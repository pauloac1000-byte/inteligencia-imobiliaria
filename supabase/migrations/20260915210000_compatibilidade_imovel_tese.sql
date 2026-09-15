-- ==============================================================================
-- MIGRATION: compatibilidade_imovel_tese e motor determinístico de cálculo
-- KORBIX - Inteligência Imobiliária
-- Data/Versão: 20260915210000_compatibilidade_imovel_tese.sql
-- 
-- OBJETIVO:
-- Calcular a compatibilidade entre imóvel (leads_venda) e tese de investidor 
-- (leads_investidor) por regras 100% objetivas, determinísticas e auditáveis,
-- sem IA nem chamadas externas, com 5 critérios cujos pesos somam 100:
--   1. Faixa de preço (peso 30)
--   2. Cidade e Região de interesse (peso 25)
--   3. Objetivo do investidor vs. Tipo do imóvel (peso 20)
--   4. Prazo de decisão vs. Prazo desejado de venda (peso 15)
--   5. Situação documental do imóvel (peso 10)
--
-- ARMAZENAMENTO E AUDITORIA:
-- Grava percentual total (0 a 100) e os detalhes de critérios atendidos e não
-- atendidos em formato JSONB estruturado contendo {criterio, peso, pontos, status, motivo}.
--
-- RECÁLCULO AUTOMÁTICO:
-- Triggers disparam o recálculo em lote ou por lead sempre que:
--   (a) Um imóvel (leads_venda) for inserido ou atualizado
--   (b) Uma tese de investidor (leads_investidor) for inserida ou atualizada
--   (c) Um documento do imóvel (lead_arquivos) for inserido, alterado ou excluído
-- ==============================================================================

-- 1. TABELA compatibilidade_imovel_tese
CREATE TABLE IF NOT EXISTS public.compatibilidade_imovel_tese (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_venda_id UUID NOT NULL REFERENCES public.leads_venda(id) ON DELETE CASCADE,
  lead_investidor_id UUID NOT NULL REFERENCES public.leads_investidor(id) ON DELETE CASCADE,
  percentual NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (percentual >= 0.00 AND percentual <= 100.00),
  criterios_atendidos JSONB NOT NULL DEFAULT '[]'::jsonb,
  criterios_nao_atendidos JSONB NOT NULL DEFAULT '[]'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT compatibilidade_imovel_tese_unique UNIQUE (lead_venda_id, lead_investidor_id)
);

-- Índices de consulta e performance
CREATE INDEX IF NOT EXISTS idx_compatibilidade_lead_venda 
  ON public.compatibilidade_imovel_tese(lead_venda_id);

CREATE INDEX IF NOT EXISTS idx_compatibilidade_lead_investidor 
  ON public.compatibilidade_imovel_tese(lead_investidor_id);

CREATE INDEX IF NOT EXISTS idx_compatibilidade_percentual 
  ON public.compatibilidade_imovel_tese(percentual DESC);

-- RLS restrita: somente authenticated pode ler; nenhum acesso direto para anon
ALTER TABLE public.compatibilidade_imovel_tese ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "compatibilidade_auth_select" ON public.compatibilidade_imovel_tese;
CREATE POLICY "compatibilidade_auth_select" ON public.compatibilidade_imovel_tese
  FOR SELECT TO authenticated
  USING (true);

-- Sem políticas de INSERT/UPDATE/DELETE para clientes: gravações são exclusivas das rotinas do banco.

-- ==============================================================================
-- 2. FUNÇÕES AUXILIARES DETERMINÍSTICAS
-- ==============================================================================

-- 2.1. Sanitização e normalização de texto (remove acentos, pontuações e minúsculas)
CREATE OR REPLACE FUNCTION public.fn_compat_normalizar_texto(p_input TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(TRIM(LOWER(
    TRANSLATE(
      COALESCE(p_input, ''),
      'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
      'aaaaaeeeeiiiiooooouuuucnaaaaaeeeeiiiiooooouuuucn'
    )
  )), '');
$$;

-- 2.2. Conversão textual de valor monetário (ex.: 'R$ 850.000', '500000', '350.000,00') para NUMERIC
CREATE OR REPLACE FUNCTION public.fn_compat_extrair_valor_numerico(p_valor_texto TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_limpo TEXT;
  v_num NUMERIC;
BEGIN
  IF p_valor_texto IS NULL OR TRIM(p_valor_texto) = '' THEN
    RETURN NULL;
  END IF;

  v_limpo := TRIM(p_valor_texto);
  -- Remove prefixo monetário e espaços
  v_limpo := REGEXP_REPLACE(v_limpo, '^[Rr]?\$?\s*', '', 'g');

  -- Se tiver vírgula como separador decimal (ex.: 500.000,00 ou 500000,00)
  IF v_limpo ~ ',\d{1,2}$' THEN
    -- Remove pontos de milhar
    v_limpo := REPLACE(v_limpo, '.', '');
    -- Substitui vírgula decimal por ponto
    v_limpo := REPLACE(v_limpo, ',', '.');
  ELSE
    -- Se tiver ponto decimal ou apenas dígitos e pontos separadores
    -- Caso comum: '850.000' (milhar sem centavos)
    IF v_limpo ~ '^\d{1,3}(\.\d{3})+$' THEN
      v_limpo := REPLACE(v_limpo, '.', '');
    ELSE
      -- Remove tudo que não for dígito ou ponto
      v_limpo := REGEXP_REPLACE(v_limpo, '[^\d.]', '', 'g');
    END IF;
  END IF;

  BEGIN
    v_num := v_limpo::NUMERIC;
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;

  RETURN v_num;
END;
$$;

-- ==============================================================================
-- 3. MOTOR PRINCIPAL DE CÁLCULO: fn_calcular_compatibilidade
-- ==============================================================================
-- Parâmetros: p_lead_venda_id UUID, p_lead_investidor_id UUID
-- Retorna record com:
--   percentual NUMERIC(5,2),
--   criterios_atendidos JSONB,
--   criterios_nao_atendidos JSONB
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.fn_calcular_compatibilidade(
  p_lead_venda_id UUID,
  p_lead_investidor_id UUID
)
RETURNS TABLE (
  percentual NUMERIC(5,2),
  criterios_atendidos JSONB,
  criterios_nao_atendidos JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_venda public.leads_venda;
  v_investidor public.leads_investidor;

  -- Pontuações calculadas
  v_pontos_preco NUMERIC := 0;
  v_pontos_cidade NUMERIC := 0;
  v_pontos_tipo NUMERIC := 0;
  v_pontos_prazo NUMERIC := 0;
  v_pontos_docs NUMERIC := 0;
  v_percentual_total NUMERIC := 0;

  -- Motivos / Descrições
  v_status_preco BOOLEAN := FALSE;
  v_motivo_preco TEXT := '';

  v_status_cidade BOOLEAN := FALSE;
  v_motivo_cidade TEXT := '';

  v_status_tipo BOOLEAN := FALSE;
  v_motivo_tipo TEXT := '';

  v_status_prazo BOOLEAN := FALSE;
  v_motivo_prazo TEXT := '';

  v_status_docs BOOLEAN := FALSE;
  v_motivo_docs TEXT := '';

  -- Variáveis de trabalho
  v_valor_imovel NUMERIC;
  v_ticket_norm TEXT;
  v_min_ticket NUMERIC := NULL;
  v_max_ticket NUMERIC := NULL;

  v_cidade_imovel_norm TEXT;
  v_cidades_interesse_raw TEXT;
  v_cidades_array TEXT[];
  v_cidade_item TEXT;
  v_cidade_match BOOLEAN := FALSE;
  v_circuito_aguas_cidades TEXT[] := ARRAY[
    'aguas de lindoia', 'lindoia', 'monte siao', 'serra negra',
    'aguas de sao pedro', 'piracicaba', 'amparo', 'pedreira',
    'jaguariuna', 'holambra', 'socorro', 'itapira'
  ];

  v_objetivo_norm TEXT;
  v_tipo_imovel_norm TEXT;

  v_prazo_investidor_norm TEXT;
  v_prazo_venda_norm TEXT;

  v_tem_matricula BOOLEAN := FALSE;
  v_tem_iptu BOOLEAN := FALSE;
  v_tem_certidao BOOLEAN := FALSE;

  v_arr_atendidos JSONB := '[]'::jsonb;
  v_arr_nao_atendidos JSONB := '[]'::jsonb;
BEGIN
  -- 1. Carrega os leads
  SELECT * INTO v_venda FROM public.leads_venda WHERE id = p_lead_venda_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead de venda % não encontrado.', p_lead_venda_id;
  END IF;

  SELECT * INTO v_investidor FROM public.leads_investidor WHERE id = p_lead_investidor_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead de investidor % não encontrado.', p_lead_investidor_id;
  END IF;

  -- ----------------------------------------------------------------------------
  -- CRITÉRIO 1: Faixa de Preço (Peso 30)
  -- ----------------------------------------------------------------------------
  -- Ticket do investidor:
  --   'ate_300k' ou 'até 300 mil'  => [0, 300000]
  --   '300_600k' ou '300 a 600 mil' => (300000, 600000]
  --   'acima_600k' ou 'acima de 600 mil' => (600000, +infinito)
  -- ----------------------------------------------------------------------------
  v_valor_imovel := public.fn_compat_extrair_valor_numerico(v_venda.valor_estimado);
  v_ticket_norm := public.fn_compat_normalizar_texto(v_investidor.ticket);

  IF v_ticket_norm IS NULL OR v_ticket_norm = '' THEN
    v_status_preco := FALSE;
    v_motivo_preco := 'Investidor não especificou ticket de investimento';
  ELSIF v_valor_imovel IS NULL THEN
    v_status_preco := FALSE;
    v_motivo_preco := 'Imóvel não possui valor estimado informado para validação de faixa';
  ELSE
    IF v_ticket_norm ILIKE '%ate_300%' OR v_ticket_norm ILIKE '%300 mil%' OR v_ticket_norm ILIKE '%ate 300%' THEN
      v_min_ticket := 0;
      v_max_ticket := 300000;
    ELSIF v_ticket_norm ILIKE '%300_600%' OR v_ticket_norm ILIKE '%300 a 600%' OR v_ticket_norm ILIKE '%300 a 600 mil%' THEN
      v_min_ticket := 300000.01;
      v_max_ticket := 600000;
    ELSIF v_ticket_norm ILIKE '%acima_600%' OR v_ticket_norm ILIKE '%acima de 600%' OR v_ticket_norm ILIKE '%acima 600%' THEN
      v_min_ticket := 600000.01;
      v_max_ticket := 9999999999;
    ELSE
      -- Fallback caso seja outro texto não mapeado
      v_min_ticket := NULL;
      v_max_ticket := NULL;
    END IF;

    IF v_min_ticket IS NOT NULL AND v_valor_imovel >= v_min_ticket AND (v_max_ticket IS NULL OR v_valor_imovel <= v_max_ticket) THEN
      v_status_preco := TRUE;
      v_pontos_preco := 30;
      v_motivo_preco := FORMAT('Valor do imóvel (R$ %s) enquadrado na faixa do investidor (%s)', v_valor_imovel, COALESCE(v_investidor.ticket, ''));
    ELSE
      v_status_preco := FALSE;
      v_pontos_preco := 0;
      v_motivo_preco := FORMAT('Valor do imóvel (R$ %s) fora da faixa pretendida pelo investidor (%s)', COALESCE(v_valor_imovel::TEXT, 'não informado'), COALESCE(v_investidor.ticket, 'não especificado'));
    END IF;
  END IF;

  -- ----------------------------------------------------------------------------
  -- CRITÉRIO 2: Cidade e Região de Interesse (Peso 25)
  -- ----------------------------------------------------------------------------
  -- Cidade do imóvel vs cidades_interesse da tese.
  -- Suporta lista separada por vírgula ou JSON array.
  -- Suporta chip 'Circuito das Águas Paulista' mapeando:
  --   Águas de Lindóia, Lindóia, Monte Sião, Serra Negra, Águas de São Pedro,
  --   Piracicaba, Amparo, Pedreira, Jaguariúna, Holambra, Socorro, Itapira.
  -- ----------------------------------------------------------------------------
  v_cidade_imovel_norm := public.fn_compat_normalizar_texto(v_venda.cidade);
  v_cidades_interesse_raw := v_investidor.cidades_interesse;

  IF v_cidade_imovel_norm IS NULL OR v_cidade_imovel_norm = '' THEN
    v_status_cidade := FALSE;
    v_motivo_cidade := 'Cidade do imóvel não informada no cadastro';
  ELSIF v_cidades_interesse_raw IS NULL OR TRIM(v_cidades_interesse_raw) = '' THEN
    v_status_cidade := FALSE;
    v_motivo_cidade := 'Investidor não especificou cidades de interesse';
  ELSE
    -- Tenta converter de JSON array se iniciar com '['
    IF TRIM(v_cidades_interesse_raw) ~ '^\[' THEN
      BEGIN
        SELECT ARRAY_AGG(elems.val)
        INTO v_cidades_array
        FROM jsonb_array_elements_text(v_cidades_interesse_raw::jsonb) AS elems(val);
      EXCEPTION WHEN OTHERS THEN
        v_cidades_array := string_to_array(v_cidades_interesse_raw, ',');
      END;
    ELSE
      v_cidades_array := string_to_array(v_cidades_interesse_raw, ',');
    END IF;

    -- Itera sobre cada cidade de interesse do investidor
    FOREACH v_cidade_item IN ARRAY v_cidades_array LOOP
      DECLARE
        v_item_norm TEXT;
      BEGIN
        v_item_norm := public.fn_compat_normalizar_texto(v_cidade_item);
        IF v_item_norm IS NOT NULL THEN
          -- Match direto ou contenção (ex: 'Amparo SP' com 'Amparo')
          IF v_cidade_imovel_norm = v_item_norm 
             OR v_cidade_imovel_norm ILIKE '%' || v_item_norm || '%'
             OR v_item_norm ILIKE '%' || v_cidade_imovel_norm || '%' THEN
            v_cidade_match := TRUE;
            EXIT;
          END IF;

          -- Se investidor selecionou o chip 'Circuito das Águas Paulista'
          IF v_item_norm ILIKE '%circuito das aguas%' THEN
            DECLARE
              v_cidade_circuito TEXT;
            BEGIN
              FOREACH v_cidade_circuito IN ARRAY v_circuito_aguas_cidades LOOP
                IF v_cidade_imovel_norm ILIKE '%' || v_cidade_circuito || '%' THEN
                  v_cidade_match := TRUE;
                  EXIT;
                END IF;
              END LOOP;
            END;
            IF v_cidade_match THEN
              EXIT;
            END IF;
          END IF;
        END IF;
      END;
    END LOOP;

    IF v_cidade_match THEN
      v_status_cidade := TRUE;
      v_pontos_cidade := 25;
      v_motivo_cidade := FORMAT('Cidade do imóvel (%s) compatível com o interesse da tese (%s)', COALESCE(v_venda.cidade, ''), COALESCE(v_cidades_interesse_raw, ''));
    ELSE
      v_status_cidade := FALSE;
      v_pontos_cidade := 0;
      v_motivo_cidade := FORMAT('Cidade do imóvel (%s) não coincide com as cidades da tese (%s)', COALESCE(v_venda.cidade, ''), COALESCE(v_cidades_interesse_raw, ''));
    END IF;
  END IF;

  -- ----------------------------------------------------------------------------
  -- CRITÉRIO 3: Objetivo do Investidor vs Tipo do Imóvel (Peso 20)
  -- ----------------------------------------------------------------------------
  -- Mapeamento objetivo -> tipos compatíveis:
  --   'renda_aluguel' / 'renda de aluguel' => apartamento, casa, comercial
  --   'revenda'                            => apartamento, casa, terreno
  --   'reforma_venda' / 'reforma e venda'  => casa, apartamento, terreno
  -- ----------------------------------------------------------------------------
  v_objetivo_norm := public.fn_compat_normalizar_texto(v_investidor.objetivo);
  v_tipo_imovel_norm := public.fn_compat_normalizar_texto(v_venda.tipo_imovel);

  IF v_tipo_imovel_norm IS NULL OR v_tipo_imovel_norm = '' THEN
    v_status_tipo := FALSE;
    v_pontos_tipo := 0;
    v_motivo_tipo := 'Tipo de imóvel não informado no cadastro do proprietário';
  ELSIF v_objetivo_norm IS NULL OR v_objetivo_norm = '' THEN
    v_status_tipo := FALSE;
    v_pontos_tipo := 0;
    v_motivo_tipo := 'Investidor não definiu seu objetivo de alocação';
  ELSE
    IF v_objetivo_norm ILIKE '%renda%' OR v_objetivo_norm ILIKE '%aluguel%' THEN
      IF v_tipo_imovel_norm ILIKE '%apartamento%' OR v_tipo_imovel_norm ILIKE '%casa%' OR v_tipo_imovel_norm ILIKE '%comercial%' THEN
        v_status_tipo := TRUE;
        v_pontos_tipo := 20;
        v_motivo_tipo := FORMAT('Tipo %s é rentabilizável para objetivo de renda de aluguel', v_venda.tipo_imovel);
      ELSE
        v_status_tipo := FALSE;
        v_pontos_tipo := 0;
        v_motivo_tipo := FORMAT('Tipo %s não é prioritário para tese de renda de aluguel (esperado: Apartamento/Casa/Comercial)', COALESCE(v_venda.tipo_imovel, ''));
      END IF;

    ELSIF v_objetivo_norm ILIKE '%revenda%' AND NOT v_objetivo_norm ILIKE '%reforma%' THEN
      IF v_tipo_imovel_norm ILIKE '%apartamento%' OR v_tipo_imovel_norm ILIKE '%casa%' OR v_tipo_imovel_norm ILIKE '%terreno%' THEN
        v_status_tipo := TRUE;
        v_pontos_tipo := 20;
        v_motivo_tipo := FORMAT('Tipo %s possui alta liquidez para revenda rápida', v_venda.tipo_imovel);
      ELSE
        v_status_tipo := FALSE;
        v_pontos_tipo := 0;
        v_motivo_tipo := FORMAT('Tipo %s não atende ao padrão da tese de revenda direta', COALESCE(v_venda.tipo_imovel, ''));
      END IF;

    ELSIF v_objetivo_norm ILIKE '%reforma%' THEN
      IF v_tipo_imovel_norm ILIKE '%casa%' OR v_tipo_imovel_norm ILIKE '%apartamento%' OR v_tipo_imovel_norm ILIKE '%terreno%' THEN
        v_status_tipo := TRUE;
        v_pontos_tipo := 20;
        v_motivo_tipo := FORMAT('Tipo %s é elegível para agregação de valor com reforma e venda', v_venda.tipo_imovel);
      ELSE
        v_status_tipo := FALSE;
        v_pontos_tipo := 0;
        v_motivo_tipo := FORMAT('Tipo %s não é adequado para ciclo de retrofit/reforma e venda', COALESCE(v_venda.tipo_imovel, ''));
      END IF;

    ELSE
      -- Fallback para outros objetivos genéricos
      v_status_tipo := FALSE;
      v_pontos_tipo := 0;
      v_motivo_tipo := FORMAT('Objetivo %s não possui mapeamento determinístico para tipo %s', COALESCE(v_investidor.objetivo, ''), COALESCE(v_venda.tipo_imovel, ''));
    END IF;
  END IF;

  -- ----------------------------------------------------------------------------
  -- CRITÉRIO 4: Prazo de Decisão vs Prazo Desejado (Peso 15)
  -- ----------------------------------------------------------------------------
  -- Investidor: '30_dias' / '30 dias', '60_dias' / '60 dias', 'flexivel' / 'flexível'
  -- Proprietário: 'até 60 dias', 'até 6 meses', 'sem pressa'
  -- Matriz:
  --   30 dias: compatível apenas com 'até 60 dias'
  --   60 dias: compatível com 'até 60 dias' e 'até 6 meses'
  --   Flexível: compatível com 'até 60 dias', 'até 6 meses', 'sem pressa'
  -- ----------------------------------------------------------------------------
  v_prazo_investidor_norm := public.fn_compat_normalizar_texto(v_investidor.prazo_decisao);
  v_prazo_venda_norm := public.fn_compat_normalizar_texto(v_venda.prazo_desejado);

  IF v_prazo_investidor_norm IS NULL OR v_prazo_investidor_norm = '' THEN
    v_status_prazo := FALSE;
    v_pontos_prazo := 0;
    v_motivo_prazo := 'Investidor não especificou seu prazo de decisão';
  ELSIF v_prazo_venda_norm IS NULL OR v_prazo_venda_norm = '' THEN
    v_status_prazo := FALSE;
    v_pontos_prazo := 0;
    v_motivo_prazo := 'Proprietário ainda não definiu o prazo desejado para negociação';
  ELSE
    IF v_prazo_investidor_norm ILIKE '%flex%' THEN
      -- Flexível casa com tudo
      v_status_prazo := TRUE;
      v_pontos_prazo := 15;
      v_motivo_prazo := FORMAT('Investidor flexível alinhado com prazo do proprietário (%s)', v_venda.prazo_desejado);

    ELSIF v_prazo_investidor_norm ILIKE '%60%' THEN
      -- 60 dias casa com 'até 60 dias' e 'até 6 meses'
      IF v_prazo_venda_norm ILIKE '%60%' OR v_prazo_venda_norm ILIKE '%6 meses%' OR v_prazo_venda_norm ILIKE '%seis meses%' THEN
        v_status_prazo := TRUE;
        v_pontos_prazo := 15;
        v_motivo_prazo := FORMAT('Janela do investidor (60 dias) converge com expectativa do proprietário (%s)', v_venda.prazo_desejado);
      ELSE
        v_status_prazo := FALSE;
        v_pontos_prazo := 0;
        v_motivo_prazo := FORMAT('Investidor busca decisão em 60 dias, incompatível com proprietário (%s)', v_venda.prazo_desejado);
      END IF;

    ELSIF v_prazo_investidor_norm ILIKE '%30%' THEN
      -- 30 dias só casa com 'até 60 dias' (liquidez de curto prazo)
      IF v_prazo_venda_norm ILIKE '%60%' THEN
        v_status_prazo := TRUE;
        v_pontos_prazo := 15;
        v_motivo_prazo := FORMAT('Alta urgência mútua: investidor (30 dias) e proprietário (%s)', v_venda.prazo_desejado);
      ELSE
        v_status_prazo := FALSE;
        v_pontos_prazo := 0;
        v_motivo_prazo := FORMAT('Investidor requer decisão ágil (30 dias), divergindo do proprietário (%s)', v_venda.prazo_desejado);
      END IF;

    ELSE
      v_status_prazo := FALSE;
      v_pontos_prazo := 0;
      v_motivo_prazo := FORMAT('Prazos incompatíveis (%s vs %s)', COALESCE(v_investidor.prazo_decisao, ''), COALESCE(v_venda.prazo_desejado, ''));
    END IF;
  END IF;

  -- ----------------------------------------------------------------------------
  -- CRITÉRIO 5: Situação Documental do Imóvel (Peso 10)
  -- ----------------------------------------------------------------------------
  -- Documentos anexados em lead_arquivos (tipo='documento'):
  --   Matrícula (rotulo='matricula'): 5 pontos
  --   IPTU (rotulo='iptu'): 3 pontos
  --   Certidão (rotulo='certidao'): 2 pontos
  -- Total documental: 0 a 10 pontos.
  -- ----------------------------------------------------------------------------
  SELECT 
    BOOL_OR(rotulo = 'matricula'),
    BOOL_OR(rotulo = 'iptu'),
    BOOL_OR(rotulo = 'certidao')
  INTO 
    v_tem_matricula,
    v_tem_iptu,
    v_tem_certidao
  FROM public.lead_arquivos
  WHERE lead_id = p_lead_venda_id
    AND tipo = 'documento';

  v_tem_matricula := COALESCE(v_tem_matricula, FALSE);
  v_tem_iptu := COALESCE(v_tem_iptu, FALSE);
  v_tem_certidao := COALESCE(v_tem_certidao, FALSE);

  IF v_tem_matricula THEN
    v_pontos_docs := v_pontos_docs + 5;
  END IF;

  IF v_tem_iptu THEN
    v_pontos_docs := v_pontos_docs + 3;
  END IF;

  IF v_tem_certidao THEN
    v_pontos_docs := v_pontos_docs + 2;
  END IF;

  IF v_pontos_docs = 10 THEN
    v_status_docs := TRUE;
    v_motivo_docs := 'Dossiê documental completo: Matrícula (+5), IPTU (+3) e Certidão (+2)';
  ELSIF v_pontos_docs > 0 THEN
    -- Critério parcialmente atendido com pontuação ponderada proporcional
    v_status_docs := TRUE;
    v_motivo_docs := FORMAT(
      'Documentação parcial (%s/10 pts): %s%s%s',
      v_pontos_docs,
      CASE WHEN v_tem_matricula THEN 'Matrícula presente (+5); ' ELSE 'Matrícula pendente; ' END,
      CASE WHEN v_tem_iptu THEN 'IPTU presente (+3); ' ELSE 'IPTU pendente; ' END,
      CASE WHEN v_tem_certidao THEN 'Certidão presente (+2)' ELSE 'Certidão pendente' END
    );
  ELSE
    v_status_docs := FALSE;
    v_motivo_docs := 'Nenhum documento anexado ao imóvel (Matrícula, IPTU ou Certidão pendentes)';
  END IF;

  -- ----------------------------------------------------------------------------
  -- TOTALIZAÇÃO E CONSTRUÇÃO DOS JSONBs DE AUDITORIA
  -- ----------------------------------------------------------------------------
  v_percentual_total := v_pontos_preco + v_pontos_cidade + v_tipo_imovel_norm_ponto_safe(v_pontos_tipo) + v_pontos_prazo + v_pontos_docs;

  -- Critério 1: Preço (30)
  IF v_status_preco THEN
    v_arr_atendidos := v_arr_atendidos || jsonb_build_object(
      'criterio', 'faixa_preco',
      'nome', 'Faixa de Preço',
      'peso', 30,
      'pontos', v_pontos_preco,
      'status', 'atendido',
      'motivo', v_motivo_preco
    );
  ELSE
    v_arr_nao_atendidos := v_arr_nao_atendidos || jsonb_build_object(
      'criterio', 'faixa_preco',
      'nome', 'Faixa de Preço',
      'peso', 30,
      'pontos', 0,
      'status', 'nao_atendido',
      'motivo', v_motivo_preco
    );
  END IF;

  -- Critério 2: Cidade (25)
  IF v_status_cidade THEN
    v_arr_atendidos := v_arr_atendidos || jsonb_build_object(
      'criterio', 'cidade',
      'nome', 'Cidade e Região de Interesse',
      'peso', 25,
      'pontos', v_pontos_cidade,
      'status', 'atendido',
      'motivo', v_motivo_cidade
    );
  ELSE
    v_arr_nao_atendidos := v_arr_nao_atendidos || jsonb_build_object(
      'criterio', 'cidade',
      'nome', 'Cidade e Região de Interesse',
      'peso', 25,
      'pontos', 0,
      'status', 'nao_atendido',
      'motivo', v_motivo_cidade
    );
  END IF;

  -- Critério 3: Tipo vs Objetivo (20)
  IF v_status_tipo THEN
    v_arr_atendidos := v_arr_atendidos || jsonb_build_object(
      'criterio', 'tipo_vs_objetivo',
      'nome', 'Objetivo do Investidor vs Tipo do Imóvel',
      'peso', 20,
      'pontos', v_pontos_tipo,
      'status', 'atendido',
      'motivo', v_motivo_tipo
    );
  ELSE
    v_arr_nao_atendidos := v_arr_nao_atendidos || jsonb_build_object(
      'criterio', 'tipo_vs_objetivo',
      'nome', 'Objetivo do Investidor vs Tipo do Imóvel',
      'peso', 20,
      'pontos', 0,
      'status', 'nao_atendido',
      'motivo', v_motivo_tipo
    );
  END IF;

  -- Critério 4: Prazo (15)
  IF v_status_prazo THEN
    v_arr_atendidos := v_arr_atendidos || jsonb_build_object(
      'criterio', 'prazo',
      'nome', 'Prazo de Decisão vs Prazo de Venda',
      'peso', 15,
      'pontos', v_pontos_prazo,
      'status', 'atendido',
      'motivo', v_motivo_prazo
    );
  ELSE
    v_arr_nao_atendidos := v_arr_nao_atendidos || jsonb_build_object(
      'criterio', 'prazo',
      'nome', 'Prazo de Decisão vs Prazo de Venda',
      'peso', 15,
      'pontos', 0,
      'status', 'nao_atendido',
      'motivo', v_motivo_prazo
    );
  END IF;

  -- Critério 5: Situação Documental (10)
  IF v_status_docs THEN
    v_arr_atendidos := v_arr_atendidos || jsonb_build_object(
      'criterio', 'documentacao',
      'nome', 'Situação Documental',
      'peso', 10,
      'pontos', v_pontos_docs,
      'status', CASE WHEN v_pontos_docs = 10 THEN 'atendido' ELSE 'parcialmente_atendido' END,
      'motivo', v_motivo_docs
    );
    -- Se faltou algum doc e a nota foi menor que 10, também registra pendência em não atendidos para auditoria transparente
    IF v_pontos_docs < 10 THEN
      v_arr_nao_atendidos := v_arr_nao_atendidos || jsonb_build_object(
        'criterio', 'documentacao_pendencias',
        'nome', 'Documentos Complementares Pendentes',
        'peso', 10,
        'pontos_perdidos', (10 - v_pontos_docs),
        'status', 'pendencia_parcial',
        'motivo', FORMAT('Faltam documentos para atingir os 10 pontos totais (obtido: %s/10)', v_pontos_docs)
      );
    END IF;
  ELSE
    v_arr_nao_atendidos := v_arr_nao_atendidos || jsonb_build_object(
      'criterio', 'documentacao',
      'nome', 'Situação Documental',
      'peso', 10,
      'pontos', 0,
      'status', 'nao_atendido',
      'motivo', v_motivo_docs
    );
  END IF;

  -- Retorna resultado estruturado
  RETURN QUERY SELECT 
    ROUND(v_percentual_total, 2),
    v_arr_atendidos,
    v_arr_nao_atendidos;
END;
$$;

-- Função auxiliar interna para soma segura
CREATE OR REPLACE FUNCTION public.v_tipo_imovel_norm_ponto_safe(p_val NUMERIC)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(p_val, 0);
$$;

-- ==============================================================================
-- 4. FUNÇÕES DE GRAVAÇÃO E RECÁLCULO AUTOMÁTICO (UPSERT)
-- ==============================================================================

-- 4.1. Recalcula e grava um par específico (lead_venda_id, lead_investidor_id)
CREATE OR REPLACE FUNCTION public.fn_recalcular_compatibilidade_par(
  p_lead_venda_id UUID,
  p_lead_investidor_id UUID
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_res RECORD;
BEGIN
  SELECT * INTO v_res 
  FROM public.fn_calcular_compatibilidade(p_lead_venda_id, p_lead_investidor_id);

  INSERT INTO public.compatibilidade_imovel_tese (
    lead_venda_id,
    lead_investidor_id,
    percentual,
    criterios_atendidos,
    criterios_nao_atendidos,
    atualizado_em
  )
  VALUES (
    p_lead_venda_id,
    p_lead_investidor_id,
    v_res.percentual,
    v_res.criterios_atendidos,
    v_res.criterios_nao_atendidos,
    NOW()
  )
  ON CONFLICT (lead_venda_id, lead_investidor_id)
  DO UPDATE SET
    percentual = EXCLUDED.percentual,
    criterios_atendidos = EXCLUDED.criterios_atendidos,
    criterios_nao_atendidos = EXCLUDED.criterios_nao_atendidos,
    atualizado_em = NOW();

  RETURN v_res.percentual;
END;
$$;

-- 4.2. Recalcula um imóvel contra todas as teses de investidores
CREATE OR REPLACE FUNCTION public.fn_recalcular_compatibilidade_lead_venda(
  p_lead_venda_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r_investidor RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR r_investidor IN 
    SELECT id FROM public.leads_investidor
  LOOP
    PERFORM public.fn_recalcular_compatibilidade_par(p_lead_venda_id, r_investidor.id);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- 4.3. Recalcula uma tese contra todos os imóveis cadastrados
CREATE OR REPLACE FUNCTION public.fn_recalcular_compatibilidade_lead_investidor(
  p_lead_investidor_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r_venda RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR r_venda IN 
    SELECT id FROM public.leads_venda
  LOOP
    PERFORM public.fn_recalcular_compatibilidade_par(r_venda.id, p_lead_investidor_id);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ==============================================================================
-- 5. TRIGGERS AUTOMÁTICOS
-- ==============================================================================

-- 5.1. Trigger ao inserir ou atualizar leads_venda
CREATE OR REPLACE FUNCTION public.trg_compat_ao_mudar_lead_venda()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Dispara o recálculo do imóvel para todas as teses existentes
  PERFORM public.fn_recalcular_compatibilidade_lead_venda(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_leads_venda_compatibilidade ON public.leads_venda;
CREATE TRIGGER trg_leads_venda_compatibilidade
  AFTER INSERT OR UPDATE OF tipo_imovel, cidade, valor_estimado, prazo_desejado ON public.leads_venda
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_compat_ao_mudar_lead_venda();

-- 5.2. Trigger ao inserir ou atualizar leads_investidor
CREATE OR REPLACE FUNCTION public.trg_compat_ao_mudar_lead_investidor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Dispara o recálculo da tese para todos os imóveis existentes
  PERFORM public.fn_recalcular_compatibilidade_lead_investidor(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_leads_investidor_compatibilidade ON public.leads_investidor;
CREATE TRIGGER trg_leads_investidor_compatibilidade
  AFTER INSERT OR UPDATE OF ticket, objetivo, cidades_interesse, prazo_decisao ON public.leads_investidor
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_compat_ao_mudar_lead_investidor();

-- 5.3. Trigger ao inserir, alterar ou deletar documento em lead_arquivos
CREATE OR REPLACE FUNCTION public.trg_compat_ao_mudar_lead_arquivos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_lead_id := OLD.lead_id;
  ELSE
    v_lead_id := NEW.lead_id;
  END IF;

  -- Se for documento, recalcula a pontuação documental do imóvel
  IF v_lead_id IS NOT NULL THEN
    PERFORM public.fn_recalcular_compatibilidade_lead_venda(v_lead_id);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lead_arquivos_compatibilidade ON public.lead_arquivos;
CREATE TRIGGER trg_lead_arquivos_compatibilidade
  AFTER INSERT OR UPDATE OR DELETE ON public.lead_arquivos
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_compat_ao_mudar_lead_arquivos();

-- ==============================================================================
-- 6. PERMISSÕES DE EXECUÇÃO
-- ==============================================================================
GRANT EXECUTE ON FUNCTION public.fn_compat_normalizar_texto(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_compat_extrair_valor_numerico(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_calcular_compatibilidade(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_recalcular_compatibilidade_par(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_recalcular_compatibilidade_lead_venda(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_recalcular_compatibilidade_lead_investidor(UUID) TO authenticated, service_role;

-- Comentários da tabela e colunas para documentação e auditoria
COMMENT ON TABLE public.compatibilidade_imovel_tese IS 'Tabela auditável de compatibilidade determinística entre imóveis (leads_venda) e teses (leads_investidor). Soma total de pesos: 100.';
COMMENT ON COLUMN public.compatibilidade_imovel_tese.percentual IS 'Percentual de compatibilidade de 0 a 100 calculado deterministamente pelos 5 critérios objetivos.';
COMMENT ON COLUMN public.compatibilidade_imovel_tese.criterios_atendidos IS 'JSONB contendo lista de critérios atendidos ou parcialmente atendidos com peso, pontuação e justificativa auditável.';
COMMENT ON COLUMN public.compatibilidade_imovel_tese.criterios_nao_atendidos IS 'JSONB contendo lista de critérios não atendidos com o motivo objetivo do não preenchimento.';
