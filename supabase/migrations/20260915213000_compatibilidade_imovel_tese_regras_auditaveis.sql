-- ==============================================================================
-- MIGRATION: compatibilidade_imovel_tese_regras_auditaveis
-- KORBIX - Inteligência Imobiliária
-- Data/Versão: 20260915213000_compatibilidade_imovel_tese_regras_auditaveis.sql
--
-- REGRAS DE NEGÓCIO DO MOTOR DE COMPATIBILIDADE DETERMINÍSTICO E AUDITÁVEL:
--
-- Total: 100 pontos (percentual = soma dos pesos atendidos, de 0 a 100).
-- Sem IA, sem chamadas externas, determinístico, auditável e recalculado por gatilhos.
--
-- Critério 1 — Faixa de Preço (Peso: 30 pontos)
--   - Mapeia o valor_estimado do imóvel (normalizado e extraído como numérico)
--     para a faixa de ticket da tese de investimento:
--       * até 300 mil ('ate_300k', 'até 300 mil')     => [0, 300.000,00]
--       * 300 a 600 mil ('300_600k', '300 a 600 mil') => (300.000,00, 600.000,00]
--       * acima de 600 mil ('acima_600k', 'acima de 600 mil') => (600.000,00, +infinito)
--   - Atendido (30 pontos) se o valor do imóvel cair dentro da faixa de ticket; 0 caso contrário.
--
-- Critério 2 — Cidade (Peso: 25 pontos)
--   - O lead de investidor tem cidades_interesse como array de textos
--     (armazenado como texto, JSON array ou lista separada por vírgula).
--   - Suporta itens específicos e regiões (ex.: "Circuito das Águas Paulista",
--     que expande para cidades da região).
--   - Comparação estritamente normalizada (trim, minúsculas, remoção de acentos e pontuação).
--   - Atendido (25 pontos) se a cidade do imóvel coincidir com qualquer item da lista; 0 caso contrário.
--
-- Critério 3 — Objetivo do Investidor vs Tipo do Imóvel (Peso: 20 pontos)
--   - Mapeamento determinístico objetivo -> tipos compatíveis:
--       * "renda_aluguel" / "renda de aluguel" => 'apartamento', 'casa'
--       * "revenda" => compatível com qualquer tipo ('apartamento', 'casa', 'terreno', 'comercial')
--       * "reforma_venda" / "reforma e venda" => compatível com qualquer tipo ('apartamento', 'casa', 'terreno', 'comercial')
--   - Atendido (20 pontos) se o tipo do imóvel estiver na lista compatível do objetivo; 0 caso contrário.
--
-- Critério 4 — Prazo (Peso: 15 pontos)
--   - Compatibilidade entre prazo_desejado do proprietário e prazo_decisao do investidor:
--       * Urgência proprietário: 'até 60 dias' = 3, 'até 6 meses' = 2, 'sem pressa' = 1.
--       * Urgência investidor: '30 dias' / '30_dias' = 3, '60 dias' / '60_dias' = 2, 'flexivel' / 'flexível' = 1.
--   - Atendido (15 pontos) se urgência do investidor <= urgência do proprietário
--     (isto é: investidor flexível aceita qualquer prazo; proprietário sem pressa aceita qualquer investidor;
--      investidor de 30 dias exige proprietário com até 60 dias). 0 caso contrário.
--
-- Critério 5 — Situação Documental (Peso: 10 pontos)
--   - Baseado nos arquivos do imóvel cadastrados em public.lead_arquivos (tipo='documento'):
--       * Matrícula (rotulo='matricula' ou contendo 'matrícula'): essencial.
--       * Atendido (10 pontos) se a matrícula foi enviada; 0 se não foi enviada.
--       * Decisão técnica documentada: o peso do critério é binário pela matrícula (10 pontos se presente, 0 se ausente).
--         O envio de IPTU ou certidão é registrado no motivo e no detalhamento como informação complementar/auditável,
--         mas não altera o valor numérico que depende estritamente da matrícula.
--
-- RLS e Segurança:
--   - Tabela public.compatibilidades (com view compatibilidade_imovel_tese ou nome unificado)
--   - RLS ativa: NENHUMA política para anon.
--   - Não expõe leads de investidores para proprietários nem vice-versa.
--   - Recálculos executados via rotinas SECURITY DEFINER.
-- ==============================================================================

-- 1. ESTRUTURA DA TABELA DE COMPATIBILIDADES
CREATE TABLE IF NOT EXISTS public.compatibilidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_venda_id UUID NOT NULL REFERENCES public.leads_venda(id) ON DELETE CASCADE,
  lead_investidor_id UUID NOT NULL REFERENCES public.leads_investidor(id) ON DELETE CASCADE,
  percentual INTEGER NOT NULL DEFAULT 0 CHECK (percentual >= 0 AND percentual <= 100),
  criterios JSONB NOT NULL DEFAULT '[]'::jsonb,
  criterios_atendidos JSONB NOT NULL DEFAULT '[]'::jsonb,
  criterios_nao_atendidos JSONB NOT NULL DEFAULT '[]'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT compatibilidades_lead_venda_investidor_unique UNIQUE (lead_venda_id, lead_investidor_id)
);

CREATE INDEX IF NOT EXISTS idx_compatibilidades_lead_venda 
  ON public.compatibilidades(lead_venda_id);

CREATE INDEX IF NOT EXISTS idx_compatibilidades_lead_investidor 
  ON public.compatibilidades(lead_investidor_id);

CREATE INDEX IF NOT EXISTS idx_compatibilidades_percentual 
  ON public.compatibilidades(percentual DESC);

-- RLS Fechada na tabela compatibilidades:
ALTER TABLE public.compatibilidades ENABLE ROW LEVEL SECURITY;

-- Usuários anon NÃO possuem nenhuma permissão nem política de leitura
DROP POLICY IF EXISTS "compatibilidades_anon_none" ON public.compatibilidades;
DROP POLICY IF EXISTS "compatibilidades_auth_select" ON public.compatibilidades;
-- Acesso restrito apenas para perfil gestor autenticado (ou consultas administrativas internas)
CREATE POLICY "compatibilidades_auth_select" ON public.compatibilidades
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
        AND profiles.tipo = 'gestor'
    )
  );

-- Também garantimos que a tabela anterior compatibilidade_imovel_tese permaneça fechada ou sincronizada
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'compatibilidade_imovel_tese') THEN
    ALTER TABLE public.compatibilidade_imovel_tese ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "compatibilidade_auth_select" ON public.compatibilidade_imovel_tese;
    CREATE POLICY "compatibilidade_auth_select" ON public.compatibilidade_imovel_tese
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE profiles.id = auth.uid() 
            AND profiles.tipo = 'gestor'
        )
      );
  END IF;
END $$;

-- ==============================================================================
-- 2. FUNÇÕES AUXILIARES DETERMINÍSTICAS
-- ==============================================================================

-- 2.1. Sanitização e normalização de texto (remove acentos, cedilha, pontuações, minúsculas e espaços extras)
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

-- 2.2. Conversão textual de valor monetário para NUMERIC de forma resiliente
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
  -- Remove prefixos como 'R$', 'r$', cifrões e espaços
  v_limpo := REGEXP_REPLACE(v_limpo, '^[Rr]?\$?\s*', '', 'g');

  -- Se possui formato com vírgula decimal no final (ex: '350.000,00' ou '350000,00')
  IF v_limpo ~ ',\d{1,2}$' THEN
    v_limpo := REPLACE(v_limpo, '.', '');
    v_limpo := REPLACE(v_limpo, ',', '.');
  ELSE
    -- Caso comum em formulários: '500.000' (milhar sem centavos)
    IF v_limpo ~ '^\d{1,3}(\.\d{3})+$' THEN
      v_limpo := REPLACE(v_limpo, '.', '');
    ELSE
      -- Remove caracteres estranhos deixando apenas números e ponto
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
-- 3. MOTOR PRINCIPAL DE CÁLCULO DETERMINÍSTICO E AUDITÁVEL
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.fn_calcular_compatibilidade_detalhada(
  p_lead_venda_id UUID,
  p_lead_investidor_id UUID
)
RETURNS TABLE (
  percentual INTEGER,
  criterios JSONB,
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

  -- Pesos e status
  v_peso_preco CONSTANT INTEGER := 30;
  v_peso_cidade CONSTANT INTEGER := 25;
  v_peso_objetivo CONSTANT INTEGER := 20;
  v_peso_prazo CONSTANT INTEGER := 15;
  v_peso_docs CONSTANT INTEGER := 10;

  v_status_preco BOOLEAN := FALSE;
  v_motivo_preco TEXT := '';

  v_status_cidade BOOLEAN := FALSE;
  v_motivo_cidade TEXT := '';

  v_status_objetivo BOOLEAN := FALSE;
  v_motivo_objetivo TEXT := '';

  v_status_prazo BOOLEAN := FALSE;
  v_motivo_prazo TEXT := '';

  v_status_docs BOOLEAN := FALSE;
  v_motivo_docs TEXT := '';

  -- Total e estruturas JSON
  v_total_percentual INTEGER := 0;
  v_criterio_preco JSONB;
  v_criterio_cidade JSONB;
  v_criterio_objetivo JSONB;
  v_criterio_prazo JSONB;
  v_criterio_docs JSONB;

  v_arr_todos JSONB := '[]'::jsonb;
  v_arr_atendidos JSONB := '[]'::jsonb;
  v_arr_nao_atendidos JSONB := '[]'::jsonb;

  -- Variáveis de trabalho dos critérios
  -- Critério 1: Preço
  v_valor_imovel NUMERIC;
  v_ticket_norm TEXT;
  v_min_ticket NUMERIC := NULL;
  v_max_ticket NUMERIC := NULL;

  -- Critério 2: Cidade
  v_cidade_imovel_norm TEXT;
  v_cidades_raw TEXT;
  v_cidades_array TEXT[];
  v_cidade_item TEXT;
  v_cidade_match BOOLEAN := FALSE;
  v_circuito_aguas TEXT[] := ARRAY[
    'aguas de lindoia', 'lindoia', 'monte siao', 'serra negra',
    'aguas de sao pedro', 'piracicaba', 'amparo', 'pedreira',
    'jaguariuna', 'holambra', 'socorro', 'itapira'
  ];

  -- Critério 3: Objetivo vs Tipo
  v_objetivo_norm TEXT;
  v_tipo_imovel_norm TEXT;

  -- Critério 4: Prazo
  v_prazo_prop_norm TEXT;
  v_prazo_inv_norm TEXT;
  v_urgencia_prop INTEGER := 0;
  v_urgencia_inv INTEGER := 0;

  -- Critério 5: Documentos
  v_tem_matricula BOOLEAN := FALSE;
  v_tem_iptu BOOLEAN := FALSE;
  v_tem_certidao BOOLEAN := FALSE;
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

  -- ============================================================================
  -- CRITÉRIO 1: Faixa de Preço (Peso 30)
  -- ============================================================================
  v_valor_imovel := public.fn_compat_extrair_valor_numerico(v_venda.valor_estimado);
  v_ticket_norm := public.fn_compat_normalizar_texto(v_investidor.ticket);

  IF v_ticket_norm IS NULL OR v_ticket_norm = '' THEN
    v_status_preco := FALSE;
    v_motivo_preco := 'Investidor não especificou ticket de investimento';
  ELSIF v_valor_imovel IS NULL THEN
    v_status_preco := FALSE;
    v_motivo_preco := 'Imóvel não possui valor estimado informado para validação de faixa';
  ELSE
    IF v_ticket_norm ILIKE '%ate_300%' OR v_ticket_norm ILIKE '%ate 300%' OR v_ticket_norm ILIKE '%300 mil%' THEN
      v_min_ticket := 0;
      v_max_ticket := 300000;
    ELSIF v_ticket_norm ILIKE '%300_600%' OR v_ticket_norm ILIKE '%300 a 600%' THEN
      v_min_ticket := 300000.01;
      v_max_ticket := 600000;
    ELSIF v_ticket_norm ILIKE '%acima_600%' OR v_ticket_norm ILIKE '%acima de 600%' OR v_ticket_norm ILIKE '%acima 600%' THEN
      v_min_ticket := 600000.01;
      v_max_ticket := 999999999999;
    ELSE
      v_min_ticket := NULL;
      v_max_ticket := NULL;
    END IF;

    IF v_min_ticket IS NOT NULL AND v_valor_imovel >= v_min_ticket AND (v_max_ticket IS NULL OR v_valor_imovel <= v_max_ticket) THEN
      v_status_preco := TRUE;
      v_motivo_preco := FORMAT('Valor do imóvel (R$ %s) enquadrado na faixa de ticket do investidor (%s)', v_valor_imovel, COALESCE(v_investidor.ticket, ''));
    ELSE
      v_status_preco := FALSE;
      v_motivo_preco := FORMAT('Faixa de preço do imóvel (R$ %s) fora do ticket do investidor (%s)', COALESCE(v_valor_imovel::TEXT, 'não informado'), COALESCE(v_investidor.ticket, 'não especificado'));
    END IF;
  END IF;

  -- ============================================================================
  -- CRITÉRIO 2: Cidade (Peso 25)
  -- ============================================================================
  v_cidade_imovel_norm := public.fn_compat_normalizar_texto(v_venda.cidade);
  v_cidades_raw := v_investidor.cidades_interesse;

  IF v_cidade_imovel_norm IS NULL OR v_cidade_imovel_norm = '' THEN
    v_status_cidade := FALSE;
    v_motivo_cidade := 'Cidade do imóvel não informada no cadastro';
  ELSIF v_cidades_raw IS NULL OR TRIM(v_cidades_raw) = '' THEN
    v_status_cidade := FALSE;
    v_motivo_cidade := 'Investidor não especificou cidades de interesse';
  ELSE
    IF TRIM(v_cidades_raw) ~ '^\[' THEN
      BEGIN
        SELECT ARRAY_AGG(elems.val)
        INTO v_cidades_array
        FROM jsonb_array_elements_text(v_cidades_raw::jsonb) AS elems(val);
      EXCEPTION WHEN OTHERS THEN
        v_cidades_array := string_to_array(v_cidades_raw, ',');
      END;
    ELSE
      v_cidades_array := string_to_array(v_cidades_raw, ',');
    END IF;

    FOREACH v_cidade_item IN ARRAY v_cidades_array LOOP
      DECLARE
        v_item_norm TEXT;
      BEGIN
        v_item_norm := public.fn_compat_normalizar_texto(v_cidade_item);
        IF v_item_norm IS NOT NULL THEN
          IF v_cidade_imovel_norm = v_item_norm 
             OR v_cidade_imovel_norm ILIKE '%' || v_item_norm || '%'
             OR v_item_norm ILIKE '%' || v_cidade_imovel_norm || '%' THEN
            v_cidade_match := TRUE;
            EXIT;
          END IF;

          IF v_item_norm ILIKE '%circuito das aguas%' THEN
            DECLARE
              v_circuito_cid TEXT;
            BEGIN
              FOREACH v_circuito_cid IN ARRAY v_circuito_aguas LOOP
                IF v_cidade_imovel_norm ILIKE '%' || v_circuito_cid || '%' THEN
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
      v_motivo_cidade := FORMAT('Cidade do imóvel (%s) consta nas cidades de interesse do investidor (%s)', COALESCE(v_venda.cidade, ''), COALESCE(v_cidades_raw, ''));
    ELSE
      v_status_cidade := FALSE;
      v_motivo_cidade := FORMAT('Cidade do imóvel (%s) não consta nas cidades de interesse do investidor (%s)', COALESCE(v_venda.cidade, ''), COALESCE(v_cidades_raw, ''));
    END IF;
  END IF;

  -- ============================================================================
  -- CRITÉRIO 3: Objetivo do Investidor vs Tipo do Imóvel (Peso 20)
  -- ============================================================================
  -- Mapeamento exato com opções do formulário:
  --   tipo_imovel: 'apartamento', 'casa', 'terreno', 'comercial'
  --   objetivo: 'renda_aluguel' -> apenas 'apartamento' e 'casa'
  --             'revenda' -> qualquer tipo ('apartamento', 'casa', 'terreno', 'comercial')
  --             'reforma_venda' -> qualquer tipo ('apartamento', 'casa', 'terreno', 'comercial')
  v_objetivo_norm := public.fn_compat_normalizar_texto(v_investidor.objetivo);
  v_tipo_imovel_norm := public.fn_compat_normalizar_texto(v_venda.tipo_imovel);

  IF v_tipo_imovel_norm IS NULL OR v_tipo_imovel_norm = '' THEN
    v_status_objetivo := FALSE;
    v_motivo_objetivo := 'Tipo de imóvel não informado no cadastro do proprietário';
  ELSIF v_objetivo_norm IS NULL OR v_objetivo_norm = '' THEN
    v_status_objetivo := FALSE;
    v_motivo_objetivo := 'Investidor não definiu seu objetivo de investimento';
  ELSE
    IF v_objetivo_norm ILIKE '%renda%' OR v_objetivo_norm ILIKE '%aluguel%' THEN
      IF v_tipo_imovel_norm ILIKE '%apartamento%' OR v_tipo_imovel_norm ILIKE '%casa%' THEN
        v_status_objetivo := TRUE;
        v_motivo_objetivo := FORMAT('Tipo de imóvel (%s) compatível com objetivo de renda de aluguel (imóveis residenciais)', v_venda.tipo_imovel);
      ELSE
        v_status_objetivo := FALSE;
        v_motivo_objetivo := FORMAT('Tipo de imóvel (%s) não é residencial pronto para renda de aluguel (esperado: casa ou apartamento)', COALESCE(v_venda.tipo_imovel, ''));
      END IF;

    ELSIF v_objetivo_norm ILIKE '%revenda%' AND NOT v_objetivo_norm ILIKE '%reforma%' THEN
      -- Revenda é compatível com qualquer tipo de imóvel
      v_status_objetivo := TRUE;
      v_motivo_objetivo := FORMAT('Objetivo de revenda é compatível com qualquer tipo de imóvel (%s)', v_venda.tipo_imovel);

    ELSIF v_objetivo_norm ILIKE '%reforma%' THEN
      -- Reforma e venda é compatível com qualquer tipo de imóvel (o investidor vai reformar)
      v_status_objetivo := TRUE;
      v_motivo_objetivo := FORMAT('Objetivo de reforma e venda é compatível com qualquer tipo de imóvel (%s)', v_venda.tipo_imovel);

    ELSE
      v_status_objetivo := FALSE;
      v_motivo_objetivo := FORMAT('Objetivo do investidor (%s) não possui correlação com o tipo de imóvel (%s)', COALESCE(v_investidor.objetivo, ''), COALESCE(v_venda.tipo_imovel, ''));
    END IF;
  END IF;

  -- ============================================================================
  -- CRITÉRIO 4: Prazo (Peso 15)
  -- ============================================================================
  -- Proprietário: 'até 60 dias' = 3, 'até 6 meses' = 2, 'sem pressa' = 1
  -- Investidor: '30 dias' / '30_dias' = 3, '60 dias' / '60_dias' = 2, 'flexivel' = 1
  -- Atendido (15 pts) se investidor_urgencia <= proprietario_urgencia
  v_prazo_prop_norm := public.fn_compat_normalizar_texto(v_venda.prazo_desejado);
  v_prazo_inv_norm := public.fn_compat_normalizar_texto(v_investidor.prazo_decisao);

  IF v_prazo_prop_norm IS NULL OR v_prazo_prop_norm = '' THEN
    v_status_prazo := FALSE;
    v_motivo_prazo := 'Proprietário ainda não definiu o prazo desejado para a venda';
  ELSIF v_prazo_inv_norm IS NULL OR v_prazo_inv_norm = '' THEN
    v_status_prazo := FALSE;
    v_motivo_prazo := 'Investidor não especificou seu prazo de decisão';
  ELSE
    -- Avalia urgência do proprietário
    IF v_prazo_prop_norm ILIKE '%60 dias%' OR v_prazo_prop_norm ILIKE '%sessenta dias%' THEN
      v_urgencia_prop := 3;
    ELSIF v_prazo_prop_norm ILIKE '%6 meses%' OR v_prazo_prop_norm ILIKE '%seis meses%' THEN
      v_urgencia_prop := 2;
    ELSIF v_prazo_prop_norm ILIKE '%sem pressa%' THEN
      v_urgencia_prop := 1;
    ELSE
      v_urgencia_prop := 2; -- fallback neutro
    END IF;

    -- Avalia urgência do investidor
    IF v_prazo_inv_norm ILIKE '%30%' THEN
      v_urgencia_inv := 3;
    ELSIF v_prazo_inv_norm ILIKE '%60%' THEN
      v_urgencia_inv := 2;
    ELSIF v_prazo_inv_norm ILIKE '%flex%' THEN
      v_urgencia_inv := 1;
    ELSE
      v_urgencia_inv := 2; -- fallback neutro
    END IF;

    IF v_urgencia_inv <= v_urgencia_prop THEN
      v_status_prazo := TRUE;
      v_motivo_prazo := FORMAT('Prazo do investidor (%s) atende à urgência da venda do proprietário (%s)', v_investidor.prazo_decisao, v_venda.prazo_desejado);
    ELSE
      v_status_prazo := FALSE;
      v_motivo_prazo := FORMAT('Prazo do investidor (%s) exige decisão mais rápida do que a disponibilidade do proprietário (%s)', v_investidor.prazo_decisao, v_venda.prazo_desejado);
    END IF;
  END IF;

  -- ============================================================================
  -- CRITÉRIO 5: Situação Documental (Peso 10)
  -- ============================================================================
  -- Matrícula essencial enviada = 10 pontos. Sem matrícula = 0 pontos.
  -- IPTU e Certidão são auditados informativamente no texto descritivo.
  SELECT 
    BOOL_OR(rotulo = 'matricula' OR rotulo ILIKE '%matricula%'),
    BOOL_OR(rotulo = 'iptu' OR rotulo ILIKE '%iptu%'),
    BOOL_OR(rotulo = 'certidao' OR rotulo ILIKE '%certida%')
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
    v_status_docs := TRUE;
    v_motivo_docs := FORMAT(
      'Documento essencial (Matrícula) enviado com sucesso%s',
      CASE 
        WHEN v_tem_iptu AND v_tem_certidao THEN ' (comprovante de IPTU e certidões complementares também anexados)'
        WHEN v_tem_iptu THEN ' (comprovante de IPTU anexado)'
        WHEN v_tem_certidao THEN ' (certidões complementares anexadas)'
        ELSE ''
      END
    );
  ELSE
    v_status_docs := FALSE;
    v_motivo_docs := FORMAT(
      'Matrícula do imóvel não enviada (documento obrigatório para regularidade)%s',
      CASE 
        WHEN v_tem_iptu THEN ' [IPTU anexado]'
        WHEN v_tem_certidao THEN ' [Certidão anexada]'
        ELSE ''
      END
    );
  END IF;

  -- ============================================================================
  -- TOTALIZAÇÃO: Soma dos 5 critérios (30 + 25 + 20 + 15 + 10 = 100)
  -- ============================================================================
  v_total_percentual := 
    (CASE WHEN v_status_preco THEN v_peso_preco ELSE 0 END) +
    (CASE WHEN v_status_cidade THEN v_peso_cidade ELSE 0 END) +
    (CASE WHEN v_status_objetivo THEN v_peso_objetivo ELSE 0 END) +
    (CASE WHEN v_status_prazo THEN v_peso_prazo ELSE 0 END) +
    (CASE WHEN v_status_docs THEN v_peso_docs ELSE 0 END);

  -- Montagem dos 5 objetos estruturados
  v_criterio_preco := jsonb_build_object(
    'criterio', 'faixa_preco',
    'nome', 'Faixa de preço',
    'peso', v_peso_preco,
    'atendido', v_status_preco,
    'pontos', CASE WHEN v_status_preco THEN v_peso_preco ELSE 0 END,
    'explicacao', v_motivo_preco
  );

  v_criterio_cidade := jsonb_build_object(
    'criterio', 'cidade',
    'nome', 'Cidade',
    'peso', v_peso_cidade,
    'atendido', v_status_cidade,
    'pontos', CASE WHEN v_status_cidade THEN v_peso_cidade ELSE 0 END,
    'explicacao', v_motivo_cidade
  );

  v_criterio_objetivo := jsonb_build_object(
    'criterio', 'objetivo_vs_tipo',
    'nome', 'Objetivo do investidor contra tipo do imóvel',
    'peso', v_peso_objetivo,
    'atendido', v_status_objetivo,
    'pontos', CASE WHEN v_status_objetivo THEN v_peso_objetivo ELSE 0 END,
    'explicacao', v_motivo_objetivo
  );

  v_criterio_prazo := jsonb_build_object(
    'criterio', 'prazo',
    'nome', 'Prazo',
    'peso', v_peso_prazo,
    'atendido', v_status_prazo,
    'pontos', CASE WHEN v_status_prazo THEN v_peso_prazo ELSE 0 END,
    'explicacao', v_motivo_prazo
  );

  v_criterio_docs := jsonb_build_object(
    'criterio', 'situacao_documental',
    'nome', 'Situação documental',
    'peso', v_peso_docs,
    'atendido', v_status_docs,
    'pontos', CASE WHEN v_status_docs THEN v_peso_docs ELSE 0 END,
    'explicacao', v_motivo_docs
  );

  -- Monta lista unificada com os 5 critérios
  v_arr_todos := jsonb_build_array(
    v_criterio_preco,
    v_criterio_cidade,
    v_criterio_objetivo,
    v_criterio_prazo,
    v_criterio_docs
  );

  -- Monta listas separadas de atendidos e não atendidos
  IF v_status_preco THEN v_arr_atendidos := v_arr_atendidos || v_criterio_preco; ELSE v_arr_nao_atendidos := v_arr_nao_atendidos || v_criterio_preco; END IF;
  IF v_status_cidade THEN v_arr_atendidos := v_arr_atendidos || v_criterio_cidade; ELSE v_arr_nao_atendidos := v_arr_nao_atendidos || v_criterio_cidade; END IF;
  IF v_status_objetivo THEN v_arr_atendidos := v_arr_atendidos || v_criterio_objetivo; ELSE v_arr_nao_atendidos := v_arr_nao_atendidos || v_criterio_objetivo; END IF;
  IF v_status_prazo THEN v_arr_atendidos := v_arr_atendidos || v_criterio_prazo; ELSE v_arr_nao_atendidos := v_arr_nao_atendidos || v_criterio_prazo; END IF;
  IF v_status_docs THEN v_arr_atendidos := v_arr_atendidos || v_criterio_docs; ELSE v_arr_nao_atendidos := v_arr_nao_atendidos || v_criterio_docs; END IF;

  RETURN QUERY SELECT 
    v_total_percentual,
    v_arr_todos,
    v_arr_atendidos,
    v_arr_nao_atendidos;
END;
$$;

-- Mantém compatibilidade com a assinatura antiga fn_calcular_compatibilidade
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
  v_calc RECORD;
BEGIN
  SELECT * INTO v_calc 
  FROM public.fn_calcular_compatibilidade_detalhada(p_lead_venda_id, p_lead_investidor_id);

  RETURN QUERY SELECT 
    v_calc.percentual::NUMERIC(5,2),
    v_calc.criterios_atendidos,
    v_calc.criterios_nao_atendidos;
END;
$$;

-- ==============================================================================
-- 4. FUNÇÕES DE GRAVAÇÃO E RECÁLCULO AUTOMÁTICO (UPSERT)
-- ==============================================================================

-- 4.1. Recalcula e grava um par específico (lead_venda_id, lead_investidor_id)
DROP FUNCTION IF EXISTS public.fn_recalcular_compatibilidade_par(UUID, UUID);
CREATE OR REPLACE FUNCTION public.fn_recalcular_compatibilidade_par(
  p_lead_venda_id UUID,
  p_lead_investidor_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_res RECORD;
BEGIN
  SELECT * INTO v_res 
  FROM public.fn_calcular_compatibilidade_detalhada(p_lead_venda_id, p_lead_investidor_id);

  -- Grava na tabela public.compatibilidades
  INSERT INTO public.compatibilidades (
    lead_venda_id,
    lead_investidor_id,
    percentual,
    criterios,
    criterios_atendidos,
    criterios_nao_atendidos,
    atualizado_em
  )
  VALUES (
    p_lead_venda_id,
    p_lead_investidor_id,
    v_res.percentual,
    v_res.criterios,
    v_res.criterios_atendidos,
    v_res.criterios_nao_atendidos,
    NOW()
  )
  ON CONFLICT (lead_venda_id, lead_investidor_id)
  DO UPDATE SET
    percentual = EXCLUDED.percentual,
    criterios = EXCLUDED.criterios,
    criterios_atendidos = EXCLUDED.criterios_atendidos,
    criterios_nao_atendidos = EXCLUDED.criterios_nao_atendidos,
    atualizado_em = NOW();

  -- Mantém também sincronizada a tabela compatibilidade_imovel_tese caso exista
  BEGIN
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
      v_res.percentual::NUMERIC(5,2),
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
  EXCEPTION WHEN OTHERS THEN
    -- Ignora se compatibilidade_imovel_tese não existir ou falhar
  END;

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
-- 5. GATILHOS (TRIGGERS) AUTOMÁTICOS
-- ==============================================================================

-- 5.1. Trigger em leads_venda (AFTER INSERT OR UPDATE dos campos relevantes incluindo status)
CREATE OR REPLACE FUNCTION public.trg_compat_ao_mudar_lead_venda()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.fn_recalcular_compatibilidade_lead_venda(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_leads_venda_compatibilidade ON public.leads_venda;
CREATE TRIGGER trg_leads_venda_compatibilidade
  AFTER INSERT OR UPDATE OF tipo_imovel, cidade, valor_estimado, prazo_desejado, status ON public.leads_venda
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_compat_ao_mudar_lead_venda();

-- 5.2. Trigger em leads_investidor (AFTER INSERT OR UPDATE dos campos da tese)
CREATE OR REPLACE FUNCTION public.trg_compat_ao_mudar_lead_investidor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.fn_recalcular_compatibilidade_lead_investidor(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_leads_investidor_compatibilidade ON public.leads_investidor;
CREATE TRIGGER trg_leads_investidor_compatibilidade
  AFTER INSERT OR UPDATE OF ticket, objetivo, cidades_interesse, prazo_decisao ON public.leads_investidor
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_compat_ao_mudar_lead_investidor();

-- 5.3. Trigger em lead_arquivos (AFTER INSERT OR UPDATE OR DELETE)
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
-- 6. PERMISSÕES E COMENTÁRIOS DE AUDITORIA
-- ==============================================================================
GRANT EXECUTE ON FUNCTION public.fn_compat_normalizar_texto(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_compat_extrair_valor_numerico(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_calcular_compatibilidade_detalhada(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_calcular_compatibilidade(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_recalcular_compatibilidade_par(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_recalcular_compatibilidade_lead_venda(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_recalcular_compatibilidade_lead_investidor(UUID) TO authenticated, service_role;

COMMENT ON TABLE public.compatibilidades IS 'Tabela auditável de compatibilidade determinística entre imóveis (leads_venda) e teses de investidor (leads_investidor). Soma dos 5 critérios com pesos fixos: 100 pontos.';
COMMENT ON COLUMN public.compatibilidades.percentual IS 'Percentual inteiro de 0 a 100 somando os pesos dos critérios atendidos: preço (30), cidade (25), objetivo vs tipo (20), prazo (15) e situação documental (10).';
COMMENT ON COLUMN public.compatibilidades.criterios IS 'Lista completa dos 5 critérios em JSONB contendo criterio, nome, peso, atendido (bool), pontos e explicacao.';
COMMENT ON COLUMN public.compatibilidades.criterios_atendidos IS 'Subconjunto dos critérios atendidos com justificativa auditável.';
COMMENT ON COLUMN public.compatibilidades.criterios_nao_atendidos IS 'Subconjunto dos critérios não atendidos com o motivo objetivo do não preenchimento.';
