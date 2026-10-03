-- ==============================================================================
-- Migration: 20261003220000_nota_vendedor_final_faixa_e_confianca.sql
-- Descrição: Combina visão do comprador e do vendedor numa nota final harmônica,
--            faixa de mercado, índice de confiança auditável com verificações e
--            tabela de configuração com limiares editáveis pelo gestor e critério
--            "comprador_verificado" com peso 0.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. NOVAS COLUNAS EM public.leads_venda E public.leads_investidor (VERIFICAÇÕES)
-- ------------------------------------------------------------------------------
ALTER TABLE public.leads_venda
  ADD COLUMN IF NOT EXISTS preco_revalidado_em TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS whatsapp_confirmado BOOLEAN DEFAULT TRUE;

ALTER TABLE public.leads_investidor
  ADD COLUMN IF NOT EXISTS whatsapp_confirmado BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS comprador_verificado BOOLEAN DEFAULT FALSE;

-- ------------------------------------------------------------------------------
-- 2. NOVAS COLUNAS NA TABELA public.compatibilidades
-- ------------------------------------------------------------------------------
ALTER TABLE public.compatibilidades
  ADD COLUMN IF NOT EXISTS nota_comprador INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nota_vendedor INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nota_final INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS faixa_compatibilidade TEXT DEFAULT 'oculta',
  ADD COLUMN IF NOT EXISTS confianca_classificacao TEXT DEFAULT 'baixa',
  ADD COLUMN IF NOT EXISTS confianca_percentual NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS confianca_detalhes JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS detalhamento_vendedor JSONB DEFAULT '[]'::jsonb;

-- Constraints para garantir integridade e auditabilidade
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'compatibilidades_faixa_check'
  ) THEN
    ALTER TABLE public.compatibilidades
      ADD CONSTRAINT compatibilidades_faixa_check
      CHECK (faixa_compatibilidade IN ('excelente', 'alta', 'media', 'oculta'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'compatibilidades_confianca_check'
  ) THEN
    ALTER TABLE public.compatibilidades
      ADD CONSTRAINT compatibilidades_confianca_check
      CHECK (confianca_classificacao IN ('alta', 'media', 'baixa'));
  END IF;
END $$;

-- Índices úteis para filtragens rápidas
CREATE INDEX IF NOT EXISTS idx_compatibilidades_nota_final ON public.compatibilidades(nota_final DESC);
CREATE INDEX IF NOT EXISTS idx_compatibilidades_faixa ON public.compatibilidades(faixa_compatibilidade);
CREATE INDEX IF NOT EXISTS idx_compatibilidades_confianca ON public.compatibilidades(confianca_classificacao);

-- ------------------------------------------------------------------------------
-- 3. CRITÉRIO "comprador_verificado" NA TABELA configuracao_pesos_compatibilidade
--    Peso 0: registrado para ligar no futuro, não soma na nota do vendedor
-- ------------------------------------------------------------------------------
INSERT INTO public.configuracao_pesos_compatibilidade (criterio, nome, peso, descricao, ordem)
VALUES (
  'comprador_verificado',
  'Comprador Verificado',
  0.0,
  'Identidade, lastro financeiro e WhatsApp do comprador previamente auditados (peso 0 para ativação futura).',
  8
)
ON CONFLICT (criterio) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  ordem = EXCLUDED.ordem;

-- ------------------------------------------------------------------------------
-- 4. TABELA DE CONFIGURAÇÃO DE LIMIARES EDITÁVEIS PELO GESTOR
--    - aviso_gestor (padrão 50)
--    - visivel_comprador (padrão 75)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.configuracao_limiares_compatibilidade (
  parametro TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  descricao TEXT,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.configuracao_limiares_compatibilidade ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "config_limiares_select_all" ON public.configuracao_limiares_compatibilidade;
CREATE POLICY "config_limiares_select_all" ON public.configuracao_limiares_compatibilidade
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "config_limiares_gestor_all" ON public.configuracao_limiares_compatibilidade;
CREATE POLICY "config_limiares_gestor_all" ON public.configuracao_limiares_compatibilidade
  FOR ALL TO authenticated
  USING (public.fn_is_gestor())
  WITH CHECK (public.fn_is_gestor());

-- Inserir limiares padrão editáveis
INSERT INTO public.configuracao_limiares_compatibilidade (parametro, nome, valor, descricao)
VALUES 
  ('aviso_gestor', 'Limiar para Aviso ao Gestor', 50.0, 'Nota final a partir da qual o gestor é notificado para conferência (padrão 50).'),
  ('visivel_comprador', 'Limiar Visível ao Comprador', 75.0, 'Nota final mínima para exibição do imóvel na vitrine do comprador/investidor (padrão 75).')
ON CONFLICT (parametro) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao;

-- Trigger para recálculo automático quando limiares ou pesos forem alterados
CREATE OR REPLACE FUNCTION public.trg_ao_atualizar_limiares_compatibilidade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r_venda RECORD;
BEGIN
  NEW.atualizado_em := NOW();
  FOR r_venda IN
    SELECT id FROM public.leads_venda WHERE LOWER(TRIM(status)) = 'ativo'
  LOOP
    PERFORM public.fn_recalcular_compatibilidade_lead_venda(r_venda.id);
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_atualizar_limiares_compatibilidade ON public.configuracao_limiares_compatibilidade;
CREATE TRIGGER trg_atualizar_limiares_compatibilidade
  AFTER UPDATE OF valor ON public.configuracao_limiares_compatibilidade
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trg_ao_atualizar_limiares_compatibilidade();

-- ------------------------------------------------------------------------------
-- 5. FUNÇÃO DE CÁLCULO DA CONFIANÇA DO PAR (FÓRMULA AUDITÁVEL EM PORTUGUÊS)
--
-- FÓRMULA DOCUMENTADA:
-- Base de Completude (0 a 100 pontos):
--   Percentual ponderado de campos do motor preenchidos nos dois lados:
--   - Lado Vendedor (7 campos com peso igual):
--     * Preço pedido ou estimado informado
--     * Preço mínimo informado (ou fallback seguro)
--     * Tipo de imóvel definido
--     * Cidade informada
--     * Bairro informado
--     * Prazo desejado informado
--     * Área informada (área útil ou terreno)
--   - Lado Comprador (7 campos com peso igual):
--     * Teto / faixa de preço definido
--     * Tipos de imóvel de interesse preenchidos
--     * Finalidade informada (morar / renda)
--     * Forma de pagamento preenchida
--     * Prazo de decisão informado
--     * Bairros preferidos, cidades ou ponto de referência geográfico definido
--     * Mínimos de tipologia ou área definidos
--   Completude do par = (completude_vendedor + completude_comprador) / 2 (0% a 100%).
--
-- Verificações Auditáveis:
--   + WhatsApp confirmado vendedor (+15 pontos)
--   + WhatsApp confirmado comprador (+15 pontos)
--   + 6 ou mais fotos cadastradas no imóvel (+15 pontos)
--   + Preço revalidado há menos de 60 dias (+15 pontos)
--
-- Pontuação final de confiança = (Completude * 0.40) + Verificações (até 60 pontos).
-- Classificação:
--   - Alta: nota >= 75
--   - Média: nota >= 50 e < 75
--   - Baixa: nota < 50
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_calcular_confianca_compatibilidade(
  p_lead_venda_id UUID,
  p_lead_investidor_id UUID
)
RETURNS TABLE (
  classificacao TEXT,
  percentual NUMERIC,
  detalhes JSONB
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_venda public.leads_venda;
  v_inv public.leads_investidor;

  -- Campos vendedor
  v_qtd_campos_venda INTEGER := 7;
  v_campos_venda_preenchidos INTEGER := 0;

  -- Campos comprador
  v_qtd_campos_inv INTEGER := 7;
  v_campos_inv_preenchidos INTEGER := 0;

  v_pct_venda NUMERIC := 0.0;
  v_pct_inv NUMERIC := 0.0;
  v_pct_completude NUMERIC := 0.0;

  -- Verificações
  v_whats_venda_ok BOOLEAN := FALSE;
  v_whats_inv_ok BOOLEAN := FALSE;
  v_fotos_count INTEGER := 0;
  v_fotos_ok BOOLEAN := FALSE;
  v_revalidado_ok BOOLEAN := FALSE;
  v_dias_revalidacao INTEGER := 999;

  v_pontos_verificacoes NUMERIC := 0.0;
  v_pontos_completude NUMERIC := 0.0;
  v_score_confianca NUMERIC := 0.0;
  v_classificacao TEXT := 'baixa';
  v_explicacao_pt TEXT := '';
BEGIN
  SELECT * INTO v_venda FROM public.leads_venda WHERE id = p_lead_venda_id;
  SELECT * INTO v_inv FROM public.leads_investidor WHERE id = p_lead_investidor_id;

  IF v_venda.id IS NULL OR v_inv.id IS NULL THEN
    RETURN QUERY SELECT 'baixa'::TEXT, 0.0::NUMERIC, '{}'::jsonb;
    RETURN;
  END IF;

  -- 1. Completude do vendedor
  IF v_venda.preco_pedido IS NOT NULL OR v_venda.valor_estimado IS NOT NULL THEN
    v_campos_venda_preenchidos := v_campos_venda_preenchidos + 1;
  END IF;
  IF v_venda.preco_minimo IS NOT NULL THEN
    v_campos_venda_preenchidos := v_campos_venda_preenchidos + 1;
  END IF;
  IF v_venda.tipo_imovel IS NOT NULL AND TRIM(v_venda.tipo_imovel) <> '' THEN
    v_campos_venda_preenchidos := v_campos_venda_preenchidos + 1;
  END IF;
  IF v_venda.cidade IS NOT NULL AND TRIM(v_venda.cidade) <> '' THEN
    v_campos_venda_preenchidos := v_campos_venda_preenchidos + 1;
  END IF;
  IF v_venda.bairro IS NOT NULL AND TRIM(v_venda.bairro) <> '' THEN
    v_campos_venda_preenchidos := v_campos_venda_preenchidos + 1;
  END IF;
  IF v_venda.prazo_desejado IS NOT NULL AND TRIM(v_venda.prazo_desejado) <> '' THEN
    v_campos_venda_preenchidos := v_campos_venda_preenchidos + 1;
  END IF;
  IF (v_venda.area_util IS NOT NULL AND v_venda.area_util > 0) OR (v_venda.area_terreno IS NOT NULL AND v_venda.area_terreno > 0) THEN
    v_campos_venda_preenchidos := v_campos_venda_preenchidos + 1;
  END IF;

  v_pct_venda := ROUND((v_campos_venda_preenchidos::NUMERIC / v_qtd_campos_venda::NUMERIC) * 100.0, 2);

  -- 2. Completude do comprador
  IF v_inv.preco_teto_absoluto IS NOT NULL OR v_inv.preco_maximo IS NOT NULL OR v_inv.ticket IS NOT NULL THEN
    v_campos_inv_preenchidos := v_campos_inv_preenchidos + 1;
  END IF;
  IF v_inv.tipos_imovel IS NOT NULL AND cardinality(v_inv.tipos_imovel) > 0 THEN
    v_campos_inv_preenchidos := v_campos_inv_preenchidos + 1;
  END IF;
  IF v_inv.finalidade IS NOT NULL AND TRIM(v_inv.finalidade) <> '' THEN
    v_campos_inv_preenchidos := v_campos_inv_preenchidos + 1;
  END IF;
  IF v_inv.forma_pagamento IS NOT NULL AND TRIM(v_inv.forma_pagamento) <> '' THEN
    v_campos_inv_preenchidos := v_campos_inv_preenchidos + 1;
  END IF;
  IF v_inv.prazo_decisao IS NOT NULL AND TRIM(v_inv.prazo_decisao) <> '' THEN
    v_campos_inv_preenchidos := v_campos_inv_preenchidos + 1;
  END IF;
  IF (v_inv.bairros_preferidos IS NOT NULL AND TRIM(v_inv.bairros_preferidos) <> '')
     OR (v_inv.cidades_interesse IS NOT NULL AND TRIM(v_inv.cidades_interesse) <> '')
     OR (v_inv.localizacao_referencia IS NOT NULL) THEN
    v_campos_inv_preenchidos := v_campos_inv_preenchidos + 1;
  END IF;
  IF (v_inv.min_area_m2 IS NOT NULL AND v_inv.min_area_m2 > 0)
     OR (v_inv.min_quartos IS NOT NULL AND v_inv.min_quartos > 0)
     OR (v_inv.min_vagas IS NOT NULL AND v_inv.min_vagas > 0)
     OR (v_inv.min_area_terreno_m2 IS NOT NULL AND v_inv.min_area_terreno_m2 > 0) THEN
    v_campos_inv_preenchidos := v_campos_inv_preenchidos + 1;
  END IF;

  v_pct_inv := ROUND((v_campos_inv_preenchidos::NUMERIC / v_qtd_campos_inv::NUMERIC) * 100.0, 2);

  v_pct_completude := ROUND((v_pct_venda + v_pct_inv) / 2.0, 2);
  v_pontos_completude := ROUND(v_pct_completude * 0.40, 2); -- Até 40 pontos

  -- 3. Verificações:
  -- A. WhatsApp vendedor: confirmado por flag ou número formatado válido +55
  IF COALESCE(v_venda.whatsapp_confirmado, FALSE) = TRUE
     OR (v_venda.telefone IS NOT NULL AND public.fn_formatar_e_validar_whatsapp(v_venda.telefone) IS NOT NULL) THEN
    v_whats_venda_ok := TRUE;
    v_pontos_verificacoes := v_pontos_verificacoes + 15.0;
  END IF;

  -- B. WhatsApp comprador: confirmado por flag ou número formatado válido +55
  IF COALESCE(v_inv.whatsapp_confirmado, FALSE) = TRUE
     OR (v_inv.telefone IS NOT NULL AND public.fn_formatar_e_validar_whatsapp(v_inv.telefone) IS NOT NULL) THEN
    v_whats_inv_ok := TRUE;
    v_pontos_verificacoes := v_pontos_verificacoes + 15.0;
  END IF;

  -- C. 6 fotos cadastradas no imóvel
  SELECT COUNT(*) INTO v_fotos_count
  FROM public.lead_arquivos
  WHERE lead_id = p_lead_venda_id
    AND tipo = 'foto';

  IF v_fotos_count >= 6 THEN
    v_fotos_ok := TRUE;
    v_pontos_verificacoes := v_pontos_verificacoes + 15.0;
  END IF;

  -- D. Preço revalidado há menos de 60 dias
  IF v_venda.preco_revalidado_em IS NOT NULL THEN
    v_dias_revalidacao := EXTRACT(DAY FROM (NOW() - v_venda.preco_revalidado_em))::INTEGER;
    IF v_dias_revalidacao < 60 THEN
      v_revalidado_ok := TRUE;
      v_pontos_verificacoes := v_pontos_verificacoes + 15.0;
    END IF;
  ELSE
    -- Se não houver data explícita, usa a data de criação do lead
    v_dias_revalidacao := EXTRACT(DAY FROM (NOW() - v_venda.criado_em))::INTEGER;
    IF v_dias_revalidacao < 60 THEN
      v_revalidado_ok := TRUE;
      v_pontos_verificacoes := v_pontos_verificacoes + 15.0;
    END IF;
  END IF;

  -- 4. Nota Total de Confiança (0 a 100)
  v_score_confianca := ROUND(v_pontos_completude + v_pontos_verificacoes, 2);
  IF v_score_confianca > 100.0 THEN v_score_confianca := 100.0; END IF;
  IF v_score_confianca < 0.0 THEN v_score_confianca := 0.0; END IF;

  -- 5. Classificação
  IF v_score_confianca >= 75.0 THEN
    v_classificacao := 'alta';
    v_explicacao_pt := FORMAT('Confiança alta (%s%%): dados preenchidos com alta completude (%s%%) e verificações essenciais validadas (WhatsApp ativo, fotos e preço recente).',
      ROUND(v_score_confianca), ROUND(v_pct_completude));
  ELSIF v_score_confianca >= 50.0 THEN
    v_classificacao := 'media';
    v_explicacao_pt := FORMAT('Confiança média (%s%%): completude razoável (%s%%), restando validações documentais ou atualização de fotos/preço.',
      ROUND(v_score_confianca), ROUND(v_pct_completude));
  ELSE
    v_classificacao := 'baixa';
    v_explicacao_pt := FORMAT('Confiança baixa (%s%%): dados preliminares (%s%% de completude) necessitando de enriquecimento cadastral e confirmação de contato/fotos.',
      ROUND(v_score_confianca), ROUND(v_pct_completude));
  END IF;

  RETURN QUERY SELECT
    v_classificacao,
    v_score_confianca,
    jsonb_build_object(
      'classificacao', v_classificacao,
      'score_confianca', v_score_confianca,
      'pct_completude_geral', v_pct_completude,
      'pct_completude_vendedor', v_pct_venda,
      'campos_venda_preenchidos', v_campos_venda_preenchidos,
      'total_campos_venda', v_qtd_campos_venda,
      'pct_completude_comprador', v_pct_inv,
      'campos_comprador_preenchidos', v_campos_inv_preenchidos,
      'total_campos_comprador', v_qtd_campos_inv,
      'verificacoes', jsonb_build_object(
        'whatsapp_vendedor_confirmado', v_whats_venda_ok,
        'whatsapp_comprador_confirmado', v_whats_inv_ok,
        'qtd_fotos_imovel', v_fotos_count,
        'fotos_suficientes_6_ou_mais', v_fotos_ok,
        'dias_desde_revalidacao_preco', v_dias_revalidacao,
        'preco_revalidado_recente', v_revalidado_ok
      ),
      'explicacao', v_explicacao_pt
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 6. ATUALIZAÇÃO DA FUNÇÃO CENTRAL: fn_recalcular_compatibilidade_par
--
-- CÁLCULO ESPECIFICADO:
-- 1. Nota do vendedor (0 a 100):
--    - Preço peso 40: usa o MESMO fator de preço (0-1) do motor atual; e fator 0
--      se teto do comprador for menor que o mínimo do vendedor.
--    - Pagamento peso 25: à vista = 1; financiamento aprovado = 0,8; financiamento a aprovar = 0,4.
--    - Prazo peso 20: usa o MESMO fator de prazo do comprador.
--    - Nota do vendedor = (soma dos pontos) ÷ 85 × 100.
-- 2. Nota final harmônica:
--    - Se comprador + vendedor = 0 => 0
--    - Senão ROUND(2 × comprador × vendedor ÷ (comprador + vendedor))
-- 3. Faixas:
--    - 85 ou mais = 'excelente'
--    - 75 a 84 = 'alta'
--    - 50 a 74 = 'media'
--    - abaixo de 50 = 'oculta'
-- 4. Confiança: calculada por fn_calcular_confianca_compatibilidade e gravada no par.
-- ------------------------------------------------------------------------------
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
  v_descarte RECORD;
  v_res RECORD;
  v_conf RECORD;

  v_venda public.leads_venda;
  v_investidor public.leads_investidor;

  -- Variáveis Nota do Vendedor
  v_preco_pedido NUMERIC;
  v_preco_minimo NUMERIC;
  v_teto_comprador NUMERIC;

  v_fator_preco_vendedor NUMERIC := 0.0;
  v_fator_pag_vendedor NUMERIC := 0.4;
  v_fator_prazo_vendedor NUMERIC := 0.0;

  v_forma_pag_norm TEXT;
  v_soma_pontos_vendedor NUMERIC := 0.0;
  v_nota_vendedor INTEGER := 0;
  v_nota_comprador INTEGER := 0;
  v_nota_final INTEGER := 0;

  v_faixa TEXT := 'oculta';
  v_detalhamento_vendedor JSONB := '[]'::jsonb;
  v_exp_preco_vendedor TEXT := '';
  v_exp_pag_vendedor TEXT := '';
  v_exp_prazo_vendedor TEXT := '';
BEGIN
  -- 1. Camada 1: Pré-motor determinístico de eliminação (INTACTA)
  SELECT * INTO v_descarte
  FROM public.fn_avaliar_descarte_pre_motor(p_lead_venda_id, p_lead_investidor_id);

  IF v_descarte.eliminado THEN
    -- Grava o par como eliminado
    INSERT INTO public.compatibilidades (
      lead_venda_id,
      lead_investidor_id,
      percentual,
      nota_comprador,
      nota_vendedor,
      nota_final,
      faixa_compatibilidade,
      confianca_classificacao,
      confianca_percentual,
      confianca_detalhes,
      criterios,
      criterios_atendidos,
      criterios_nao_atendidos,
      detalhamento,
      detalhamento_vendedor,
      status,
      eliminado,
      motivo_eliminacao,
      atualizado_em
    )
    VALUES (
      p_lead_venda_id,
      p_lead_investidor_id,
      0,
      0,
      0,
      0,
      'oculta',
      'baixa',
      0,
      jsonb_build_object('motivo', 'Par pré-eliminado na 1ª camada de descarte'),
      '[]'::jsonb,
      '[]'::jsonb,
      '[]'::jsonb,
      '[]'::jsonb,
      '[]'::jsonb,
      'eliminado',
      TRUE,
      v_descarte.motivo,
      NOW()
    )
    ON CONFLICT (lead_venda_id, lead_investidor_id)
    DO UPDATE SET
      percentual = 0,
      nota_comprador = 0,
      nota_vendedor = 0,
      nota_final = 0,
      faixa_compatibilidade = 'oculta',
      confianca_classificacao = 'baixa',
      confianca_percentual = 0,
      confianca_detalhes = jsonb_build_object('motivo', 'Par pré-eliminado na 1ª camada de descarte'),
      criterios = '[]'::jsonb,
      criterios_atendidos = '[]'::jsonb,
      criterios_nao_atendidos = '[]'::jsonb,
      detalhamento = '[]'::jsonb,
      detalhamento_vendedor = '[]'::jsonb,
      status = 'eliminado',
      eliminado = TRUE,
      motivo_eliminacao = EXCLUDED.motivo_eliminacao,
      atualizado_em = NOW();

    -- Remove da tabela legada compatibilidade_imovel_tese
    BEGIN
      DELETE FROM public.compatibilidade_imovel_tese
      WHERE lead_venda_id = p_lead_venda_id AND lead_investidor_id = p_lead_investidor_id;
    EXCEPTION WHEN OTHERS THEN
    END;

    RETURN 0;
  END IF;

  -- 2. Par NÃO eliminado: calcula a pontuação detalhada do comprador (0–100)
  SELECT * INTO v_res 
  FROM public.fn_calcular_compatibilidade_detalhada(p_lead_venda_id, p_lead_investidor_id);

  v_nota_comprador := COALESCE(v_res.percentual, 0);

  -- 3. Carrega leads para a visão do vendedor
  SELECT * INTO v_venda FROM public.leads_venda WHERE id = p_lead_venda_id;
  SELECT * INTO v_investidor FROM public.leads_investidor WHERE id = p_lead_investidor_id;

  v_preco_pedido := COALESCE(v_venda.preco_pedido, public.fn_compat_extrair_valor_numerico(v_venda.valor_estimado));
  v_preco_minimo := COALESCE(v_venda.preco_minimo, v_preco_pedido);
  v_teto_comprador := COALESCE(v_investidor.preco_teto_absoluto, v_investidor.preco_maximo);

  -- Fallback de ticket comprador se necessário
  IF v_teto_comprador IS NULL THEN
    DECLARE
      v_tkt TEXT := public.fn_compat_normalizar_texto(v_investidor.ticket);
    BEGIN
      IF v_tkt ILIKE '%ate_300%' OR v_tkt ILIKE '%ate 300%' THEN
        v_teto_comprador := 300000;
      ELSIF v_tkt ILIKE '%300_600%' OR v_tkt ILIKE '%300 a 600%' THEN
        v_teto_comprador := 600000;
      ELSIF v_tkt ILIKE '%acima_600%' OR v_tkt ILIKE '%acima 600%' THEN
        v_teto_comprador := 1500000;
      END IF;
    END;
  END IF;

  -- ----------------------------------------------------------------------------
  -- A. PREÇO OFERTÁVEL DO VENDEDOR (Peso 40):
  --    - Usa o MESMO fator de preço (0-1) do motor atual;
  --    - E fator 0 se o teto do comprador for menor que o mínimo do vendedor.
  -- ----------------------------------------------------------------------------
  IF v_teto_comprador IS NOT NULL AND v_preco_minimo IS NOT NULL AND v_teto_comprador < v_preco_minimo THEN
    v_fator_preco_vendedor := 0.0;
    v_exp_preco_vendedor := FORMAT('Teto do comprador (R$ %s) está abaixo do preço mínimo aceito pelo vendedor (R$ %s). Fator zerado.',
      ROUND(v_teto_comprador, 2), ROUND(v_preco_minimo, 2));
  ELSE
    -- Extrai o fator do preço calculado pelo motor do comprador
    SELECT COALESCE((elem->>'fator')::NUMERIC, 0.0)
    INTO v_fator_preco_vendedor
    FROM jsonb_array_elements(v_res.detalhamento) elem
    WHERE elem->>'criterio' = 'preco';

    IF v_fator_preco_vendedor IS NULL THEN
      v_fator_preco_vendedor := 0.0;
    END IF;

    v_exp_preco_vendedor := FORMAT('Preço ofertável compatível com a margem do vendedor (fator %s).', v_fator_preco_vendedor);
  END IF;

  -- ----------------------------------------------------------------------------
  -- B. PAGAMENTO DO VENDEDOR (Peso 25):
  --    - à vista = 1;
  --    - financiamento aprovado = 0,8;
  --    - financiamento a aprovar = 0,4.
  -- ----------------------------------------------------------------------------
  v_forma_pag_norm := LOWER(TRIM(COALESCE(v_investidor.forma_pagamento, 'a_vista')));

  IF v_forma_pag_norm IN ('financiamento_a_aprovar', 'financiamento a aprovar') 
     OR (v_forma_pag_norm ILIKE '%aprovar%' AND v_forma_pag_norm ILIKE '%financiamento%') THEN
    v_fator_pag_vendedor := 0.4;
    v_exp_pag_vendedor := 'Comprador depende de financiamento bancário ainda a aprovar (fator 0,4).';
  ELSIF v_forma_pag_norm IN ('financiamento_aprovado', 'financiamento aprovado', 'financiamento')
     OR (v_forma_pag_norm ILIKE '%aprovado%' AND v_forma_pag_norm ILIKE '%financiamento%') THEN
    v_fator_pag_vendedor := 0.8;
    v_exp_pag_vendedor := 'Crédito imobiliário previamente aprovado pela instituição bancária (fator 0,8).';
  ELSE
    v_fator_pag_vendedor := 1.0;
    v_exp_pag_vendedor := FORMAT('Pagamento com liquidez imediata à vista (%s, fator 1,0).', COALESCE(v_investidor.forma_pagamento, 'à vista'));
  END IF;

  -- ----------------------------------------------------------------------------
  -- C. PRAZO DO VENDEDOR (Peso 20):
  --    - Usa o MESMO fator de prazo do comprador.
  -- ----------------------------------------------------------------------------
  SELECT COALESCE((elem->>'fator')::NUMERIC, 0.0)
  INTO v_fator_prazo_vendedor
  FROM jsonb_array_elements(v_res.detalhamento) elem
  WHERE elem->>'criterio' = 'prazo';

  IF v_fator_prazo_vendedor IS NULL THEN
    v_fator_prazo_vendedor := 0.0;
  END IF;

  v_exp_prazo_vendedor := FORMAT('Alinhamento de prazo idêntico ao fator temporal avaliado pelo comprador (fator %s).', v_fator_prazo_vendedor);

  -- ----------------------------------------------------------------------------
  -- D. SOMA DOS PONTOS DO VENDEDOR E NOTA DO VENDEDOR:
  --    Nota do vendedor = (soma dos pontos) ÷ 85 × 100
  -- ----------------------------------------------------------------------------
  v_soma_pontos_vendedor := (v_fator_preco_vendedor * 40.0)
                          + (v_fator_pag_vendedor * 25.0)
                          + (v_fator_prazo_vendedor * 20.0);

  v_nota_vendedor := ROUND((v_soma_pontos_vendedor / 85.0) * 100.0);
  IF v_nota_vendedor > 100 THEN v_nota_vendedor := 100; END IF;
  IF v_nota_vendedor < 0 THEN v_nota_vendedor := 0; END IF;

  -- Detalhamento JSON da visão do vendedor
  v_detalhamento_vendedor := jsonb_build_array(
    jsonb_build_object(
      'criterio', 'preco_oferta',
      'nome', 'Preço Ofertável',
      'peso', 40.0,
      'fator', v_fator_preco_vendedor,
      'pontos', ROUND(v_fator_preco_vendedor * 40.0, 2),
      'explicacao', v_exp_preco_vendedor
    ),
    jsonb_build_object(
      'criterio', 'forma_pagamento',
      'nome', 'Forma de Pagamento',
      'peso', 25.0,
      'fator', v_fator_pag_vendedor,
      'pontos', ROUND(v_fator_pag_vendedor * 25.0, 2),
      'explicacao', v_exp_pag_vendedor
    ),
    jsonb_build_object(
      'criterio', 'prazo',
      'nome', 'Prazo Desejado',
      'peso', 20.0,
      'fator', v_fator_prazo_vendedor,
      'pontos', ROUND(v_fator_prazo_vendedor * 20.0, 2),
      'explicacao', v_exp_prazo_vendedor
    ),
    jsonb_build_object(
      'criterio', 'comprador_verificado',
      'nome', 'Comprador Verificado',
      'peso', 0.0,
      'fator', CASE WHEN COALESCE(v_investidor.comprador_verificado, FALSE) THEN 1.0 ELSE 0.0 END,
      'pontos', 0.0,
      'explicacao', 'Critério registrado com peso 0 para ativação futura.'
    )
  );

  -- ----------------------------------------------------------------------------
  -- 4. NOTA FINAL HARMÔNICA:
  --    Nota final = 2 × comprador × vendedor ÷ (comprador + vendedor), arredondada
  -- ----------------------------------------------------------------------------
  IF (v_nota_comprador + v_nota_vendedor) > 0 THEN
    v_nota_final := ROUND((2.0 * v_nota_comprador::NUMERIC * v_nota_vendedor::NUMERIC) / (v_nota_comprador + v_nota_vendedor)::NUMERIC);
  ELSE
    v_nota_final := 0;
  END IF;

  IF v_nota_final > 100 THEN v_nota_final := 100; END IF;
  IF v_nota_final < 0 THEN v_nota_final := 0; END IF;

  -- ----------------------------------------------------------------------------
  -- 5. FAIXAS DE COMPATIBILIDADE:
  --    85 ou mais = "excelente"
  --    75 a 84    = "alta"
  --    50 a 74    = "media"
  --    abaixo de 50 = "oculta"
  -- ----------------------------------------------------------------------------
  IF v_nota_final >= 85 THEN
    v_faixa := 'excelente';
  ELSIF v_nota_final >= 75 THEN
    v_faixa := 'alta';
  ELSIF v_nota_final >= 50 THEN
    v_faixa := 'media';
  ELSE
    v_faixa := 'oculta';
  END IF;

  -- ----------------------------------------------------------------------------
  -- 6. CÁLCULO DE CONFIANÇA DO PAR
  -- ----------------------------------------------------------------------------
  SELECT * INTO v_conf
  FROM public.fn_calcular_confianca_compatibilidade(p_lead_venda_id, p_lead_investidor_id);

  -- ----------------------------------------------------------------------------
  -- 7. GRAVAÇÃO NA TABELA compatibilidades
  --    Nota: mantemos percentual = v_nota_comprador (ou v_nota_final, retrocompatível)
  --    Para manter o motor do comprador consistente com o que já era gravado,
  --    gravamos percentual = v_nota_comprador e nota_final = v_nota_final.
  -- ----------------------------------------------------------------------------
  INSERT INTO public.compatibilidades (
    lead_venda_id,
    lead_investidor_id,
    percentual,
    nota_comprador,
    nota_vendedor,
    nota_final,
    faixa_compatibilidade,
    confianca_classificacao,
    confianca_percentual,
    confianca_detalhes,
    criterios,
    criterios_atendidos,
    criterios_nao_atendidos,
    detalhamento,
    detalhamento_vendedor,
    status,
    eliminado,
    motivo_eliminacao,
    atualizado_em
  )
  VALUES (
    p_lead_venda_id,
    p_lead_investidor_id,
    v_nota_comprador,
    v_nota_comprador,
    v_nota_vendedor,
    v_nota_final,
    v_faixa,
    v_conf.classificacao,
    v_conf.percentual,
    v_conf.detalhes,
    v_res.criterios,
    v_res.criterios_atendidos,
    v_res.criterios_nao_atendidos,
    v_res.detalhamento,
    v_detalhamento_vendedor,
    'pendente',
    FALSE,
    NULL,
    NOW()
  )
  ON CONFLICT (lead_venda_id, lead_investidor_id)
  DO UPDATE SET
    percentual = EXCLUDED.percentual,
    nota_comprador = EXCLUDED.nota_comprador,
    nota_vendedor = EXCLUDED.nota_vendedor,
    nota_final = EXCLUDED.nota_final,
    faixa_compatibilidade = EXCLUDED.faixa_compatibilidade,
    confianca_classificacao = EXCLUDED.confianca_classificacao,
    confianca_percentual = EXCLUDED.confianca_percentual,
    confianca_detalhes = EXCLUDED.confianca_detalhes,
    criterios = EXCLUDED.criterios,
    criterios_atendidos = EXCLUDED.criterios_atendidos,
    criterios_nao_atendidos = EXCLUDED.criterios_nao_atendidos,
    detalhamento = EXCLUDED.detalhamento,
    detalhamento_vendedor = EXCLUDED.detalhamento_vendedor,
    status = CASE 
      WHEN compatibilidades.status = 'eliminado' THEN 'pendente' 
      ELSE compatibilidades.status 
    END,
    eliminado = FALSE,
    motivo_eliminacao = NULL,
    atualizado_em = NOW();

  -- Sincroniza a tabela legada compatibilidade_imovel_tese
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
      v_nota_comprador::NUMERIC(5,2),
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
  END;

  RETURN v_nota_final;
END;
$$;

-- ------------------------------------------------------------------------------
-- 7. ATUALIZAR FUNÇÕES DE LISTAGEM PARA EXPOR AS NOVAS NOTAS, FAIXA E CONFIANÇA
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.fn_listar_oportunidades_investidor();
CREATE OR REPLACE FUNCTION public.fn_listar_oportunidades_investidor()
RETURNS TABLE (
  compatibilidade_id UUID,
  lead_venda_id UUID,
  lead_investidor_id UUID,
  percentual INTEGER,
  nota_comprador INTEGER,
  nota_vendedor INTEGER,
  nota_final INTEGER,
  faixa_compatibilidade TEXT,
  confianca_classificacao TEXT,
  confianca_percentual NUMERIC,
  confianca_detalhes JSONB,
  criterios JSONB,
  criterios_atendidos JSONB,
  criterios_nao_atendidos JSONB,
  protocolo_imovel TEXT,
  tipo_imovel TEXT,
  cidade TEXT,
  faixa_valor TEXT,
  status_imovel TEXT,
  criado_em_imovel TIMESTAMPTZ,
  tese_protocolo TEXT,
  tese_objetivo TEXT,
  tese_ticket TEXT,
  ja_manifestou_interesse BOOLEAN,
  interesse_id UUID,
  interesse_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_limiar_visivel NUMERIC := 75.0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso restrito a investidores autenticados.';
  END IF;

  -- Lê o limiar configurado pelo gestor para exibição ao comprador (padrão 75)
  SELECT COALESCE(valor, 75.0) INTO v_limiar_visivel
  FROM public.configuracao_limiares_compatibilidade
  WHERE parametro = 'visivel_comprador';

  RETURN QUERY
  SELECT 
    c.id AS compatibilidade_id,
    lv.id AS lead_venda_id,
    li.id AS lead_investidor_id,
    c.percentual,
    COALESCE(c.nota_comprador, c.percentual) AS nota_comprador,
    COALESCE(c.nota_vendedor, 0) AS nota_vendedor,
    COALESCE(c.nota_final, c.percentual) AS nota_final,
    COALESCE(c.faixa_compatibilidade, 'oculta') AS faixa_compatibilidade,
    COALESCE(c.confianca_classificacao, 'baixa') AS confianca_classificacao,
    COALESCE(c.confianca_percentual, 0) AS confianca_percentual,
    COALESCE(c.confianca_detalhes, '{}'::jsonb) AS confianca_detalhes,
    COALESCE(c.detalhamento, c.criterios) AS criterios,
    c.criterios_atendidos,
    c.criterios_nao_atendidos,
    COALESCE(lv.protocolo, 'KX-0000') AS protocolo_imovel,
    COALESCE(lv.tipo_imovel, 'Imóvel') AS tipo_imovel,
    COALESCE(lv.cidade, 'Região') AS cidade,
    public.fn_mascarar_faixa_valor(lv.valor_estimado) AS faixa_valor,
    COALESCE(lv.status, 'ativo') AS status_imovel,
    lv.criado_em AS criado_em_imovel,
    COALESCE(li.protocolo, 'KX-TESE') AS tese_protocolo,
    COALESCE(li.objetivo, 'Geral') AS tese_objetivo,
    COALESCE(li.ticket, '') AS tese_ticket,
    (ii.id IS NOT NULL) AS ja_manifestou_interesse,
    ii.id AS interesse_id,
    ii.status AS interesse_status
  FROM public.compatibilidades c
  JOIN public.leads_investidor li ON li.id = c.lead_investidor_id
  JOIN public.leads_venda lv ON lv.id = c.lead_venda_id
  LEFT JOIN public.interesses_investidor ii 
    ON ii.lead_venda_id = lv.id 
   AND ii.lead_investidor_id = li.id 
   AND ii.user_id = v_user_id
  WHERE li.user_id = v_user_id
    AND LOWER(TRIM(lv.status)) = 'ativo'
    AND COALESCE(c.eliminado, FALSE) = FALSE
    AND (
      -- Exibe pares que atingem o limiar configurado pelo gestor ou já possuem interesse
      COALESCE(c.nota_final, c.percentual) >= v_limiar_visivel
      OR ii.id IS NOT NULL
    )
  ORDER BY COALESCE(c.nota_final, c.percentual) DESC, lv.criado_em DESC;
END;
$$;

DROP FUNCTION IF EXISTS public.fn_gestor_listar_matches();
CREATE OR REPLACE FUNCTION public.fn_gestor_listar_matches()
RETURNS TABLE (
  compatibilidade_id UUID,
  percentual INTEGER,
  nota_comprador INTEGER,
  nota_vendedor INTEGER,
  nota_final INTEGER,
  faixa_compatibilidade TEXT,
  confianca_classificacao TEXT,
  confianca_percentual NUMERIC,
  confianca_detalhes JSONB,
  detalhamento_vendedor JSONB,
  status_match TEXT,
  criterios JSONB,
  criterios_atendidos JSONB,
  criterios_nao_atendidos JSONB,
  lead_venda_id UUID,
  imovel_protocolo TEXT,
  imovel_tipo TEXT,
  imovel_cidade TEXT,
  imovel_valor TEXT,
  imovel_status TEXT,
  imovel_motivo_venda TEXT,
  imovel_prazo_desejado TEXT,
  proprietario_nome TEXT,
  proprietario_telefone TEXT,
  proprietario_email TEXT,
  lead_investidor_id UUID,
  investidor_protocolo TEXT,
  investidor_ticket TEXT,
  investidor_objetivo TEXT,
  investidor_cidades TEXT,
  investidor_prazo TEXT,
  investidor_nome TEXT,
  investidor_telefone TEXT,
  investidor_email TEXT,
  ja_tem_interesse BOOLEAN,
  interesse_status TEXT,
  criado_em TIMESTAMPTZ,
  atualizado_em TIMESTAMPTZ,
  eliminado BOOLEAN,
  motivo_eliminacao TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.fn_is_gestor() THEN
    RAISE EXCEPTION 'Acesso negado: apenas gestores podem visualizar os matches.';
  END IF;

  RETURN QUERY
  SELECT 
    c.id AS compatibilidade_id,
    c.percentual,
    COALESCE(c.nota_comprador, c.percentual) AS nota_comprador,
    COALESCE(c.nota_vendedor, 0) AS nota_vendedor,
    COALESCE(c.nota_final, c.percentual) AS nota_final,
    COALESCE(c.faixa_compatibilidade, 'oculta') AS faixa_compatibilidade,
    COALESCE(c.confianca_classificacao, 'baixa') AS confianca_classificacao,
    COALESCE(c.confianca_percentual, 0) AS confianca_percentual,
    COALESCE(c.confianca_detalhes, '{}'::jsonb) AS confianca_detalhes,
    COALESCE(c.detalhamento_vendedor, '[]'::jsonb) AS detalhamento_vendedor,
    COALESCE(c.status, 'pendente') AS status_match,
    COALESCE(c.detalhamento, c.criterios) AS criterios,
    c.criterios_atendidos,
    c.criterios_nao_atendidos,
    lv.id AS lead_venda_id,
    COALESCE(lv.protocolo, 'KX-0000') AS imovel_protocolo,
    COALESCE(lv.tipo_imovel, 'Imóvel') AS tipo_imovel,
    COALESCE(lv.cidade, '') AS imovel_cidade,
    COALESCE(lv.valor_estimado, '') AS imovel_valor,
    COALESCE(lv.status, 'Recebido') AS imovel_status,
    COALESCE(lv.motivo_venda, '') AS imovel_motivo_venda,
    COALESCE(lv.prazo_desejado, '') AS imovel_prazo_desejado,
    COALESCE(lv.nome, 'Não informado') AS proprietario_nome,
    COALESCE(lv.telefone, '') AS proprietario_telefone,
    COALESCE(lv.email, '') AS proprietario_email,
    li.id AS lead_investidor_id,
    COALESCE(li.protocolo, 'KX-0000') AS investidor_protocolo,
    COALESCE(li.ticket, '') AS investidor_ticket,
    COALESCE(li.objetivo, '') AS investidor_objetivo,
    COALESCE(li.cidades_interesse, '') AS investidor_cidades,
    COALESCE(li.prazo_decisao, '') AS investidor_prazo,
    COALESCE(li.nome, 'Não informado') AS investidor_nome,
    COALESCE(li.telefone, '') AS investidor_telefone,
    COALESCE(li.email, '') AS investidor_email,
    (ii.id IS NOT NULL) AS ja_tem_interesse,
    COALESCE(ii.status, '') AS interesse_status,
    c.criado_em,
    c.atualizado_em,
    COALESCE(c.eliminado, FALSE) AS eliminado,
    c.motivo_eliminacao
  FROM public.compatibilidades c
  JOIN public.leads_venda lv ON lv.id = c.lead_venda_id
  JOIN public.leads_investidor li ON li.id = c.lead_investidor_id
  LEFT JOIN public.interesses_investidor ii 
    ON ii.lead_venda_id = lv.id 
   AND ii.lead_investidor_id = li.id
  ORDER BY 
    c.eliminado ASC,
    COALESCE(c.nota_final, c.percentual) DESC, 
    c.atualizado_em DESC;
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION public.fn_calcular_confianca_compatibilidade(UUID, UUID) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.fn_recalcular_compatibilidade_par(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_listar_oportunidades_investidor() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_gestor_listar_matches() TO authenticated;
