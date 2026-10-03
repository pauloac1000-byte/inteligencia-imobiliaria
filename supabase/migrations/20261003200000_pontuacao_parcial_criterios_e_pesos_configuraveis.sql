-- ==============================================================================
-- Migration: Pontuação parcial de 0 a 1 por critério com pesos configuráveis
-- Data/Versão: 20261003200000_pontuacao_parcial_criterios_e_pesos_configuraveis.sql
--
-- ESPECIFICAÇÕES DO USUÁRIO:
-- 1. Pesos: preco 25, localizacao 25, tipologia 15, pagamento 10, prazo 10,
--    diferenciais 10, condicao 5, guardados em tabela de configuração editável pelo gestor.
--    Quando um critério não se aplica ao par (ex.: diferenciais em terreno), ele sai
--    da conta e a nota é normalizada pela soma dos pesos restantes.
--
-- 2. Fatores (0 a 1):
--    - Preço = 1 se teto >= pedido; senão se teto >= mínimo, 0.6 + 0.4 * (teto - mínimo) / (pedido - mínimo); senão 0.2
--    - Localização = 1 no bairro preferido; senão 1 - distância / raio
--    - Tipologia = média dos itens que valem para o tipo:
--        residencial: área, quartos, vagas
--        comercial: área, vagas
--        terreno: área do terreno
--        (1 se atende; 0.5 se falta 1 unidade ou área >= 90% do mínimo; 0 nos outros casos)
--    - Pagamento = 1, ou 0.5 se financiamento a aprovar
--    - Prazo = 1 - diferença de faixas / 2
--    - Diferenciais = 0 se falta um obrigatório; senão 0.5 + 0.5 * desejáveis atendidos / desejáveis pedidos
--        (contando apenas diferenciais aplicáveis ao tipo do imóvel; sai da conta se nenhum pedido ou se for terreno)
--    - Condição = 1 se atende ao que o comprador aceita (morar: livre dentro do prazo para mudar;
--        renda: yield aluguel atual >= yield mínimo quando ambos existirem), senão 0
--
-- 3. Detalhamento em JSON junto do par na tabela compatibilidades com:
--    criterio, peso, fator, pontos.
-- ==============================================================================

-- 1. Adicionar colunas adicionais em public.leads_venda caso não existam
-- vagas (integer) e valor_aluguel_atual (numeric)
ALTER TABLE public.leads_venda
  ADD COLUMN IF NOT EXISTS vagas INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS valor_aluguel_atual NUMERIC DEFAULT NULL;

-- 2. Adicionar coluna detalhamento jsonb em public.compatibilidades
ALTER TABLE public.compatibilidades
  ADD COLUMN IF NOT EXISTS detalhamento JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 3. Criar tabela de configuração de pesos dos critérios
CREATE TABLE IF NOT EXISTS public.configuracao_pesos_compatibilidade (
  criterio TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  peso NUMERIC(5,2) NOT NULL CHECK (peso >= 0),
  descricao TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.configuracao_pesos_compatibilidade ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS:
-- Leitura permitida para todos autenticados e anon (necessária no cálculo seguro)
DROP POLICY IF EXISTS "config_pesos_select_all" ON public.configuracao_pesos_compatibilidade;
CREATE POLICY "config_pesos_select_all" ON public.configuracao_pesos_compatibilidade
  FOR SELECT TO authenticated, anon
  USING (true);

-- Escrita restrita ao perfil gestor
DROP POLICY IF EXISTS "config_pesos_gestor_all" ON public.configuracao_pesos_compatibilidade;
CREATE POLICY "config_pesos_gestor_all" ON public.configuracao_pesos_compatibilidade
  FOR ALL TO authenticated
  USING (public.fn_is_gestor())
  WITH CHECK (public.fn_is_gestor());

-- Carga inicial idempotente dos 7 critérios oficiais com seus pesos
INSERT INTO public.configuracao_pesos_compatibilidade (criterio, nome, peso, descricao, ordem)
VALUES
  ('preco', 'Preço', 25.00, 'Faixa de valor, capacidade de investimento e tolerância na negociação.', 1),
  ('localizacao', 'Localização', 25.00, 'Bairros preferidos, cidades de interesse ou distância geográfica real ao ponto de referência.', 2),
  ('tipologia', 'Tipologia', 15.00, 'Adequação de área útil/terreno, quantidade de quartos e vagas de garagem.', 3),
  ('pagamento', 'Forma de Pagamento', 10.00, 'Compatibilidade entre condição à vista, financiamento bancário aprovado ou a aprovar.', 4),
  ('prazo', 'Prazo', 10.00, 'Alinhamento temporal entre a urgência do vendedor e o prazo de decisão do comprador.', 5),
  ('diferenciais', 'Diferenciais', 10.00, 'Atendimento a atributos obrigatórios e desejáveis específicos do imóvel.', 6),
  ('condicao', 'Condição / Ocupação', 5.00, 'Disponibilidade para mudança imediata (morar) ou rentabilidade de aluguel (renda).', 7)
ON CONFLICT (criterio) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  ordem = EXCLUDED.ordem;

-- 4. Função auxiliar para recálculo geral disparado pelo gestor ou alteração de pesos
CREATE OR REPLACE FUNCTION public.fn_recalcular_todas_compatibilidades()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r_venda RECORD;
  v_total INTEGER := 0;
BEGIN
  IF NOT public.fn_is_gestor() THEN
    RAISE EXCEPTION 'Acesso negado: apenas gestores podem disparar o recálculo global de compatibilidades.';
  END IF;

  FOR r_venda IN
    SELECT id FROM public.leads_venda WHERE LOWER(TRIM(status)) = 'ativo'
  LOOP
    PERFORM public.fn_recalcular_compatibilidade_lead_venda(r_venda.id);
    v_total := v_total + 1;
  END LOOP;

  RETURN v_total;
END;
$$;

-- Trigger para recalcular quando os pesos forem alterados
CREATE OR REPLACE FUNCTION public.trg_ao_atualizar_pesos_compatibilidade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r_venda RECORD;
BEGIN
  NEW.atualizado_em := NOW();
  -- Executa recálculo de todos os imóveis ativos em lote seguro
  FOR r_venda IN
    SELECT id FROM public.leads_venda WHERE LOWER(TRIM(status)) = 'ativo'
  LOOP
    PERFORM public.fn_recalcular_compatibilidade_lead_venda(r_venda.id);
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_atualizar_pesos_compatibilidade ON public.configuracao_pesos_compatibilidade;
CREATE TRIGGER trg_atualizar_pesos_compatibilidade
  AFTER UPDATE OF peso ON public.configuracao_pesos_compatibilidade
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trg_ao_atualizar_pesos_compatibilidade();

-- ==============================================================================
-- 5. NOVA FUNÇÃO DE PONTUAÇÃO PARCIAL DETERMINÍSTICA
-- public.fn_calcular_compatibilidade_detalhada
-- ==============================================================================
DROP FUNCTION IF EXISTS public.fn_calcular_compatibilidade_detalhada(UUID, UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.fn_calcular_compatibilidade_detalhada(
  p_lead_venda_id UUID,
  p_lead_investidor_id UUID
)
RETURNS TABLE (
  percentual INTEGER,
  criterios JSONB,
  criterios_atendidos JSONB,
  criterios_nao_atendidos JSONB,
  detalhamento JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_venda public.leads_venda;
  v_investidor public.leads_investidor;

  -- Pesos configuráveis lidos da tabela
  v_peso_preco NUMERIC := 25.0;
  v_peso_loc NUMERIC := 25.0;
  v_peso_tipo NUMERIC := 15.0;
  v_peso_pag NUMERIC := 10.0;
  v_peso_prazo NUMERIC := 10.0;
  v_peso_dif NUMERIC := 10.0;
  v_peso_cond NUMERIC := 5.0;

  -- Fatores de 0 a 1 por critério
  v_fator_preco NUMERIC := 0.0;
  v_fator_loc NUMERIC := 0.0;
  v_fator_tipo NUMERIC := 0.0;
  v_fator_pag NUMERIC := 0.0;
  v_fator_prazo NUMERIC := 0.0;
  v_fator_dif NUMERIC := 0.0;
  v_fator_cond NUMERIC := 0.0;

  -- Flags de aplicabilidade
  v_aplica_preco BOOLEAN := TRUE;
  v_aplica_loc BOOLEAN := TRUE;
  v_aplica_tipo BOOLEAN := TRUE;
  v_aplica_pag BOOLEAN := TRUE;
  v_aplica_prazo BOOLEAN := TRUE;
  v_aplica_dif BOOLEAN := TRUE;
  v_aplica_cond BOOLEAN := TRUE;

  -- Justificativas
  v_exp_preco TEXT := '';
  v_exp_loc TEXT := '';
  v_exp_tipo TEXT := '';
  v_exp_pag TEXT := '';
  v_exp_prazo TEXT := '';
  v_exp_dif TEXT := '';
  v_exp_cond TEXT := '';

  -- Variáveis de trabalho do Critério 1: Preço
  v_preco_pedido NUMERIC;
  v_preco_minimo NUMERIC;
  v_teto_comprador NUMERIC;

  -- Variáveis de trabalho do Critério 2: Localização
  v_bairro_venda_norm TEXT;
  v_bairros_pref_raw TEXT;
  v_bairro_match BOOLEAN := FALSE;
  v_distancia_metros DOUBLE PRECISION := NULL;
  v_raio_metros DOUBLE PRECISION := NULL;
  v_cidade_venda_norm TEXT;
  v_cidade_match BOOLEAN := FALSE;

  -- Variáveis de trabalho do Critério 3: Tipologia
  v_tipo_norm TEXT;
  v_sub_total NUMERIC := 0.0;
  v_sub_count INTEGER := 0;
  v_sub_area NUMERIC := 0.0;
  v_sub_quartos NUMERIC := 0.0;
  v_sub_vagas NUMERIC := 0.0;
  v_area_util_venda NUMERIC;
  v_area_terreno_venda NUMERIC;
  v_quartos_venda INTEGER;
  v_vagas_venda INTEGER;

  -- Variáveis de trabalho do Critério 4: Pagamento
  v_forma_pag_norm TEXT;

  -- Variáveis de trabalho do Critério 5: Prazo
  v_prazo_venda_norm TEXT;
  v_prazo_inv_norm TEXT;
  v_pos_venda INTEGER := 1;
  v_pos_inv INTEGER := 1;
  v_diff_faixas NUMERIC := 0.0;

  -- Variáveis de trabalho do Critério 6: Diferenciais
  v_difs_venda JSONB;
  v_difs_investidor JSONB;
  v_tem_obrigatorio_faltando BOOLEAN := FALSE;
  v_desejaveis_pedidos INTEGER := 0;
  v_desejaveis_atendidos INTEGER := 0;
  v_key TEXT;
  v_val TEXT;
  v_dif_tipo_aplicavel BOOLEAN;

  -- Variáveis de trabalho do Critério 7: Condição
  v_finalidade_norm TEXT;
  v_dias_mudanca INTEGER := 60;
  v_contrato_termina DATE;
  v_yield_imovel NUMERIC := NULL;
  v_yield_minimo_inv NUMERIC := NULL;

  -- Estruturas de totalização e JSON
  v_soma_pesos_aplicaveis NUMERIC := 0.0;
  v_soma_pontos NUMERIC := 0.0;
  v_percentual_calc INTEGER := 0;

  v_arr_detalhamento JSONB := '[]'::jsonb;
  v_arr_legado_criterios JSONB := '[]'::jsonb;
  v_arr_atendidos JSONB := '[]'::jsonb;
  v_arr_nao_atendidos JSONB := '[]'::jsonb;
  v_obj_item JSONB;
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

  -- 2. Carrega os pesos dinâmicos da tabela de configuração
  SELECT COALESCE(MAX(peso) FILTER (WHERE criterio = 'preco'), 25.0) INTO v_peso_preco FROM public.configuracao_pesos_compatibilidade;
  SELECT COALESCE(MAX(peso) FILTER (WHERE criterio = 'localizacao'), 25.0) INTO v_peso_loc FROM public.configuracao_pesos_compatibilidade;
  SELECT COALESCE(MAX(peso) FILTER (WHERE criterio = 'tipologia'), 15.0) INTO v_peso_tipo FROM public.configuracao_pesos_compatibilidade;
  SELECT COALESCE(MAX(peso) FILTER (WHERE criterio = 'pagamento'), 10.0) INTO v_peso_pag FROM public.configuracao_pesos_compatibilidade;
  SELECT COALESCE(MAX(peso) FILTER (WHERE criterio = 'prazo'), 10.0) INTO v_peso_prazo FROM public.configuracao_pesos_compatibilidade;
  SELECT COALESCE(MAX(peso) FILTER (WHERE criterio = 'diferenciais'), 10.0) INTO v_peso_dif FROM public.configuracao_pesos_compatibilidade;
  SELECT COALESCE(MAX(peso) FILTER (WHERE criterio = 'condicao'), 5.0) INTO v_peso_cond FROM public.configuracao_pesos_compatibilidade;

  -- ============================================================================
  -- CRITÉRIO 1: PREÇO (Peso 25 padrão)
  -- Fórmula:
  --   Se teto >= pedido => 1
  --   Senão se teto >= mínimo => 0.6 + 0.4 * (teto - mínimo) / (pedido - mínimo)
  --   Senão => 0.2
  -- ============================================================================
  v_preco_pedido := COALESCE(v_venda.preco_pedido, public.fn_compat_extrair_valor_numerico(v_venda.valor_estimado));
  v_preco_minimo := COALESCE(v_venda.preco_minimo, v_preco_pedido);
  v_teto_comprador := COALESCE(v_investidor.preco_teto_absoluto, v_investidor.preco_maximo);

  -- Fallback de ticket clássico caso o comprador não tenha faixa numérica preenchida
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

  IF v_preco_pedido IS NULL OR v_preco_pedido <= 0 THEN
    v_aplica_preco := FALSE;
    v_fator_preco := 0.0;
    v_exp_preco := 'Preço do imóvel não informado para o cálculo.';
  ELSIF v_teto_comprador IS NULL OR v_teto_comprador <= 0 THEN
    -- Comprador sem teto definido: aceita o valor
    v_fator_preco := 1.0;
    v_exp_preco := FORMAT('Comprador sem restrição de teto de preço definida; valor pedido R$ %s aceito.', ROUND(v_preco_pedido, 2));
  ELSIF v_teto_comprador >= v_preco_pedido THEN
    v_fator_preco := 1.0;
    v_exp_preco := FORMAT('Teto do comprador (R$ %s) cobre integralmente o preço pedido (R$ %s).', ROUND(v_teto_comprador, 2), ROUND(v_preco_pedido, 2));
  ELSIF v_preco_minimo IS NOT NULL AND v_teto_comprador >= v_preco_minimo THEN
    IF v_preco_pedido > v_preco_minimo THEN
      v_fator_preco := ROUND(0.6 + (0.4 * (v_teto_comprador - v_preco_minimo) / (v_preco_pedido - v_preco_minimo)), 4);
      -- Clamping no intervalo [0.6, 1.0]
      IF v_fator_preco > 1.0 THEN v_fator_preco := 1.0; END IF;
      IF v_fator_preco < 0.6 THEN v_fator_preco := 0.6; END IF;
    ELSE
      v_fator_preco := 0.6;
    END IF;
    v_exp_preco := FORMAT('Teto do comprador (R$ %s) está entre o preço mínimo (R$ %s) e o pedido (R$ %s); margem de negociação viável.',
      ROUND(v_teto_comprador, 2), ROUND(v_preco_minimo, 2), ROUND(v_preco_pedido, 2));
  ELSE
    v_fator_preco := 0.2;
    v_exp_preco := FORMAT('Teto do comprador (R$ %s) é inferior ao preço mínimo do vendedor (R$ %s).',
      ROUND(v_teto_comprador, 2), ROUND(COALESCE(v_preco_minimo, v_preco_pedido), 2));
  END IF;

  -- ============================================================================
  -- CRITÉRIO 2: LOCALIZAÇÃO (Peso 25 padrão)
  -- Fórmula:
  --   1 se no bairro preferido;
  --   senão 1 - distância / raio
  -- Decisão documental PostGIS/fallback:
  --   Se faltar ponto/raio ou precisão for aproximada e a distância não puder ser medida,
  --   mas a cidade está na lista de busca (já aprovada na 1ª camada), adota fator 1.0.
  -- ============================================================================
  v_bairro_venda_norm := public.fn_compat_normalizar_texto(v_venda.bairro);
  v_bairros_pref_raw := v_investidor.bairros_preferidos;

  -- Testa se o bairro do imóvel está entre os bairros preferidos do comprador
  IF v_bairro_venda_norm IS NOT NULL AND v_bairros_pref_raw IS NOT NULL AND TRIM(v_bairros_pref_raw) <> '' THEN
    DECLARE
      v_bairro_item TEXT;
      v_bairros_arr TEXT[];
    BEGIN
      v_bairros_arr := string_to_array(v_bairros_pref_raw, ',');
      FOREACH v_bairro_item IN ARRAY v_bairros_arr LOOP
        IF v_bairro_venda_norm = public.fn_compat_normalizar_texto(v_bairro_item)
           OR v_bairro_venda_norm ILIKE '%' || public.fn_compat_normalizar_texto(v_bairro_item) || '%'
           OR public.fn_compat_normalizar_texto(v_bairro_item) ILIKE '%' || v_bairro_venda_norm || '%' THEN
          v_bairro_match := TRUE;
          EXIT;
        END IF;
      END LOOP;
    END;
  END IF;

  IF v_bairro_match THEN
    v_fator_loc := 1.0;
    v_exp_loc := FORMAT('Imóvel localizado no bairro preferido do comprador (%s).', COALESCE(v_venda.bairro, ''));
  ELSE
    -- Cálculo de distância geográfica real PostGIS
    IF v_venda.localizacao IS NOT NULL 
       AND v_investidor.localizacao_referencia IS NOT NULL 
       AND v_investidor.raio_km IS NOT NULL 
       AND v_investidor.raio_km > 0 THEN

      v_distancia_metros := ST_Distance(v_venda.localizacao, v_investidor.localizacao_referencia);
      v_raio_metros := v_investidor.raio_km * 1000.0;

      IF v_raio_metros > 0 THEN
        v_fator_loc := ROUND((1.0 - (v_distancia_metros / v_raio_metros))::NUMERIC, 4);
        IF v_fator_loc < 0.0 THEN v_fator_loc := 0.0; END IF;
        IF v_fator_loc > 1.0 THEN v_fator_loc := 1.0; END IF;
      ELSE
        v_fator_loc := 1.0;
      END IF;

      v_exp_loc := FORMAT('Distância do imóvel (%s km) em relação ao ponto de referência no raio de %s km.',
        ROUND((v_distancia_metros / 1000.0)::NUMERIC, 1), v_investidor.raio_km);
    ELSE
      -- Fallback documentado: sem ponto/raio ou precisão aproximada, como o par passou na 1ª camada de descarte
      -- (que valida a cidade ou região), atribui fator 1.0 com justificativa de aderência à cidade/região.
      v_fator_loc := 1.0;
      v_exp_loc := FORMAT('Localização na cidade/região de interesse (%s).', COALESCE(v_venda.cidade, 'São Paulo'));
    END IF;
  END IF;

  -- ============================================================================
  -- CRITÉRIO 3: TIPOLOGIA (Peso 15 padrão)
  -- Fórmula:
  --   Média dos itens que valem para o tipo:
  --   - residencial: área, quartos, vagas
  --   - comercial: área, vagas
  --   - terreno: área do terreno
  --   Item atende = 1; se falta 1 unidade ou área >= 90% do mínimo = 0.5; outros = 0.
  -- ============================================================================
  v_tipo_norm := LOWER(TRIM(COALESCE(v_venda.tipo_imovel, 'apartamento')));
  v_area_util_venda := v_venda.area_util;
  v_area_terreno_venda := v_venda.area_terreno;
  v_quartos_venda := v_venda.quartos;
  v_vagas_venda := v_venda.vagas;

  IF v_tipo_norm = 'terreno' THEN
    -- Terreno: usa apenas área do terreno
    IF v_investidor.min_area_terreno_m2 IS NOT NULL AND v_investidor.min_area_terreno_m2 > 0 THEN
      IF v_area_terreno_venda IS NOT NULL AND v_area_terreno_venda >= v_investidor.min_area_terreno_m2 THEN
        v_fator_tipo := 1.0;
        v_exp_tipo := FORMAT('Área do terreno (%s m²) atende o mínimo solicitado (%s m²).', v_area_terreno_venda, v_investidor.min_area_terreno_m2);
      ELSIF v_area_terreno_venda IS NOT NULL AND v_area_terreno_venda >= (v_investidor.min_area_terreno_m2 * 0.9) THEN
        v_fator_tipo := 0.5;
        v_exp_tipo := FORMAT('Área do terreno (%s m²) atinge ao menos 90%% do mínimo solicitado (%s m²).', v_area_terreno_venda, v_investidor.min_area_terreno_m2);
      ELSE
        v_fator_tipo := 0.0;
        v_exp_tipo := FORMAT('Área do terreno (%s m²) abaixo do mínimo solicitado (%s m²).', COALESCE(v_area_terreno_venda::TEXT, 'não inf.'), v_investidor.min_area_terreno_m2);
      END IF;
    ELSE
      v_fator_tipo := 1.0;
      v_exp_tipo := 'Comprador sem exigência de área mínima de terreno.';
    END IF;
  ELSIF v_tipo_norm = 'comercial' THEN
    -- Comercial: área e vagas
    v_sub_total := 0.0;
    v_sub_count := 0;

    -- Subitem 1: Área
    IF v_investidor.min_area_m2 IS NOT NULL AND v_investidor.min_area_m2 > 0 THEN
      IF v_area_util_venda IS NOT NULL AND v_area_util_venda >= v_investidor.min_area_m2 THEN
        v_sub_area := 1.0;
      ELSIF v_area_util_venda IS NOT NULL AND v_area_util_venda >= (v_investidor.min_area_m2 * 0.9) THEN
        v_sub_area := 0.5;
      ELSE
        v_sub_area := 0.0;
      END IF;
      v_sub_total := v_sub_total + v_sub_area;
      v_sub_count := v_sub_count + 1;
    END IF;

    -- Subitem 2: Vagas
    IF v_investidor.min_vagas IS NOT NULL AND v_investidor.min_vagas > 0 THEN
      IF v_vagas_venda IS NOT NULL AND v_vagas_venda >= v_investidor.min_vagas THEN
        v_sub_vagas := 1.0;
      ELSIF v_vagas_venda IS NOT NULL AND (v_vagas_venda + 1) >= v_investidor.min_vagas THEN
        v_sub_vagas := 0.5;
      ELSE
        v_sub_vagas := 0.0;
      END IF;
      v_sub_total := v_sub_total + v_sub_vagas;
      v_sub_count := v_sub_count + 1;
    END IF;

    IF v_sub_count > 0 THEN
      v_fator_tipo := ROUND(v_sub_total / v_sub_count, 4);
      v_exp_tipo := FORMAT('Média de adequação comercial (área e vagas): fator %s.', v_fator_tipo);
    ELSE
      v_fator_tipo := 1.0;
      v_exp_tipo := 'Imóvel comercial aceito sem mínimos restritivos de área ou vagas.';
    END IF;
  ELSE
    -- Residencial (apartamento, casa): área, quartos e vagas
    v_sub_total := 0.0;
    v_sub_count := 0;

    -- Subitem 1: Área útil
    IF v_investidor.min_area_m2 IS NOT NULL AND v_investidor.min_area_m2 > 0 THEN
      IF v_area_util_venda IS NOT NULL AND v_area_util_venda >= v_investidor.min_area_m2 THEN
        v_sub_area := 1.0;
      ELSIF v_area_util_venda IS NOT NULL AND v_area_util_venda >= (v_investidor.min_area_m2 * 0.9) THEN
        v_sub_area := 0.5;
      ELSE
        v_sub_area := 0.0;
      END IF;
      v_sub_total := v_sub_total + v_sub_area;
      v_sub_count := v_sub_count + 1;
    END IF;

    -- Subitem 2: Quartos
    IF v_investidor.min_quartos IS NOT NULL AND v_investidor.min_quartos > 0 THEN
      IF v_quartos_venda IS NOT NULL AND v_quartos_venda >= v_investidor.min_quartos THEN
        v_sub_quartos := 1.0;
      ELSIF v_quartos_venda IS NOT NULL AND (v_quartos_venda + 1) >= v_investidor.min_quartos THEN
        v_sub_quartos := 0.5;
      ELSE
        v_sub_quartos := 0.0;
      END IF;
      v_sub_total := v_sub_total + v_sub_quartos;
      v_sub_count := v_sub_count + 1;
    END IF;

    -- Subitem 3: Vagas
    IF v_investidor.min_vagas IS NOT NULL AND v_investidor.min_vagas > 0 THEN
      IF v_vagas_venda IS NOT NULL AND v_vagas_venda >= v_investidor.min_vagas THEN
        v_sub_vagas := 1.0;
      ELSIF v_vagas_venda IS NOT NULL AND (v_vagas_venda + 1) >= v_investidor.min_vagas THEN
        v_sub_vagas := 0.5;
      ELSE
        v_sub_vagas := 0.0;
      END IF;
      v_sub_total := v_sub_total + v_sub_vagas;
      v_sub_count := v_sub_count + 1;
    END IF;

    IF v_sub_count > 0 THEN
      v_fator_tipo := ROUND(v_sub_total / v_sub_count, 4);
      v_exp_tipo := FORMAT('Média de adequação residencial (área, quartos e vagas): fator %s.', v_fator_tipo);
    ELSE
      v_fator_tipo := 1.0;
      v_exp_tipo := 'Imóvel residencial compatível sem mínimos restritivos de área, quartos ou vagas.';
    END IF;
  END IF;

  -- ============================================================================
  -- CRITÉRIO 4: FORMA DE PAGAMENTO (Peso 10 padrão)
  -- Fórmula:
  --   1 se à vista ou financiamento já aprovado;
  --   0.5 se financiamento a aprovar
  -- ============================================================================
  v_forma_pag_norm := LOWER(TRIM(COALESCE(v_investidor.forma_pagamento, 'a_vista')));

  IF v_forma_pag_norm IN ('financiamento_a_aprovar', 'financiamento a aprovar') 
     OR (v_forma_pag_norm ILIKE '%aprovar%' AND v_forma_pag_norm ILIKE '%financiamento%') THEN
    v_fator_pag := 0.5;
    v_exp_pag := 'Comprador opta por financiamento bancário ainda a aprovar (fator 0,5).';
  ELSE
    v_fator_pag := 1.0;
    v_exp_pag := FORMAT('Forma de pagamento com liquidez imediata ou crédito previamente aprovado (%s).', COALESCE(v_investidor.forma_pagamento, 'à vista'));
  END IF;

  -- ============================================================================
  -- CRITÉRIO 5: PRAZO (Peso 10 padrão)
  -- Fórmula:
  --   1 - diferença de faixas / 2
  -- Escala ordenada:
  --   0 = 'até 60 dias' (urgência alta)
  --   1 = 'até 6 meses' (urgência média)
  --   2 = 'sem pressa' / 'flexível' (urgência flexível)
  -- Investidor flexível / sem pressa aceita qualquer uma (diferença = 0 => fator 1).
  -- ============================================================================
  v_prazo_venda_norm := public.fn_compat_normalizar_texto(v_venda.prazo_desejado);
  v_prazo_inv_norm := public.fn_compat_normalizar_texto(v_investidor.prazo_decisao);

  -- Posição do vendedor (0: até 60 dias, 1: até 6 meses, 2: sem pressa)
  IF v_prazo_venda_norm ILIKE '%60 dias%' OR v_prazo_venda_norm ILIKE '%30%' THEN
    v_pos_venda := 0;
  ELSIF v_prazo_venda_norm ILIKE '%6 meses%' OR v_prazo_venda_norm ILIKE '%seis meses%' THEN
    v_pos_venda := 1;
  ELSE
    v_pos_venda := 2;
  END IF;

  -- Posição do comprador/investidor
  IF v_prazo_inv_norm ILIKE '%sem pressa%' OR v_prazo_inv_norm ILIKE '%flex%' THEN
    -- Investidor flexível aceita qualquer prazo sem penalidade
    v_diff_faixas := 0.0;
  ELSE
    IF v_prazo_inv_norm ILIKE '%60 dias%' OR v_prazo_inv_norm ILIKE '%30%' THEN
      v_pos_inv := 0;
    ELSIF v_prazo_inv_norm ILIKE '%6 meses%' OR v_prazo_inv_norm ILIKE '%seis meses%' THEN
      v_pos_inv := 1;
    ELSE
      v_pos_inv := 2;
    END IF;
    v_diff_faixas := ABS(v_pos_venda - v_pos_inv);
  END IF;

  v_fator_prazo := ROUND(1.0 - (v_diff_faixas / 2.0), 4);
  IF v_fator_prazo < 0.0 THEN v_fator_prazo := 0.0; END IF;
  IF v_fator_prazo > 1.0 THEN v_fator_prazo := 1.0; END IF;

  v_exp_prazo := FORMAT('Alinhamento de prazos (vendedor: "%s", comprador: "%s", diferença de faixas: %s).',
    COALESCE(v_venda.prazo_desejado, 'não informado'), COALESCE(v_investidor.prazo_decisao, 'flexível'), v_diff_faixas);

  -- ============================================================================
  -- CRITÉRIO 6: DIFERENCIAIS (Peso 10 padrão)
  -- Fórmula:
  --   0 se falta um obrigatório;
  --   senão 0.5 + 0.5 * desejáveis atendidos / desejáveis pedidos
  -- Regra de aplicabilidade:
  --   Se tipo é terreno (nenhum diferencial se aplica) OU o comprador não marcou
  --   nenhum obrigatório/desejável aplicável, o critério SAI DA CONTA (aplica = FALSE).
  -- ============================================================================
  IF v_tipo_norm = 'terreno' THEN
    v_aplica_dif := FALSE;
    v_fator_dif := 0.0;
    v_exp_dif := 'Diferenciais não se aplicam ao tipo terreno (critério desconsiderado da nota).';
  ELSE
    v_difs_venda := COALESCE(v_venda.diferenciais, '[]'::jsonb);
    v_difs_investidor := COALESCE(v_investidor.diferenciais, '{}'::jsonb);

    v_tem_obrigatorio_faltando := FALSE;
    v_desejaveis_pedidos := 0;
    v_desejaveis_atendidos := 0;

    -- Itera sobre preferências de diferenciais cadastradas pelo comprador
    FOR v_key, v_val IN 
      SELECT key, value::TEXT FROM jsonb_each_text(v_difs_investidor)
    LOOP
      -- Valida se este diferencial é aplicável ao tipo do imóvel
      SELECT EXISTS (
        SELECT 1 FROM public.diferenciais d
        WHERE d.codigo = v_key
          AND (
            (v_tipo_norm IN ('apartamento', 'casa') AND 'residencial' = ANY(d.tipos))
            OR (v_tipo_norm = 'comercial' AND 'comercial' = ANY(d.tipos))
          )
      ) INTO v_dif_tipo_aplicavel;

      IF v_dif_tipo_aplicavel THEN
        IF v_val = 'obrigatorio' THEN
          -- Verifica se o imóvel tem o diferencial
          IF NOT (v_difs_venda ? v_key) THEN
            v_tem_obrigatorio_faltando := TRUE;
          END IF;
        ELSIF v_val = 'desejavel' THEN
          v_desejaveis_pedidos := v_desejaveis_pedidos + 1;
          IF v_difs_venda ? v_key THEN
            v_desejaveis_atendidos := v_desejaveis_atendidos + 1;
          END IF;
        END IF;
      END IF;
    END LOOP;

    -- Se não marcou nenhum obrigatório nem desejável aplicável, critério sai da conta
    IF NOT v_tem_obrigatorio_faltando AND v_desejaveis_pedidos = 0 AND NOT EXISTS (
      SELECT 1 FROM jsonb_each_text(v_difs_investidor) WHERE value::TEXT = 'obrigatorio'
    ) THEN
      v_aplica_dif := FALSE;
      v_fator_dif := 0.0;
      v_exp_dif := 'Comprador não assinalou diferenciais obrigatórios ou desejáveis aplicáveis (critério normalizado).';
    ELSIF v_tem_obrigatorio_faltando THEN
      v_fator_dif := 0.0;
      v_exp_dif := 'Imóvel não possui ao menos um diferencial marcado como obrigatório pelo comprador.';
    ELSIF v_desejaveis_pedidos > 0 THEN
      v_fator_dif := ROUND(0.5 + (0.5 * v_desejaveis_atendidos::NUMERIC / v_desejaveis_pedidos::NUMERIC), 4);
      v_exp_dif := FORMAT('Todos os obrigatórios atendidos; %s de %s diferenciais desejáveis presentes.', v_desejaveis_atendidos, v_desejaveis_pedidos);
    ELSE
      -- Apenas obrigatórios pedidos e todos atendidos
      v_fator_dif := 1.0;
      v_exp_dif := 'Todos os diferenciais obrigatórios foram atendidos.';
    END IF;
  END IF;

  -- ============================================================================
  -- CRITÉRIO 7: CONDIÇÃO / OCUPAÇÃO (Peso 5 padrão)
  -- Fórmula:
  --   1 se o imóvel atende ao que o comprador aceita:
  --   - Morar: livre dentro do prazo para mudar (desocupado ou ocupado pelo proprietário
  --     com desocupação viável; se alugado, contrato deve vencer dentro do prazo para mudar);
  --   - Renda: yield do aluguel atual >= yield mínimo quando os dois existirem.
  -- Decisão documental quando falta yield de aluguel ou yield mínimo na renda:
  --   Tratado como atendido (fator 1.0) para não punir dado ausente (conforme especificação).
  -- ============================================================================
  v_finalidade_norm := LOWER(TRIM(COALESCE(v_investidor.finalidade, 'renda_aluguel')));

  IF v_finalidade_norm = 'morar' THEN
    IF LOWER(TRIM(COALESCE(v_venda.ocupacao, 'desocupado'))) = 'alugado' THEN
      v_contrato_termina := v_venda.contrato_aluguel_termino;
      IF LOWER(TRIM(COALESCE(v_investidor.prazo_mudanca, 'ate_60_dias'))) = 'ate_30_dias' THEN
        v_dias_mudanca := 30;
      ELSIF LOWER(TRIM(COALESCE(v_investidor.prazo_mudanca, 'ate_60_dias'))) = 'ate_90_dias' THEN
        v_dias_mudanca := 90;
      ELSE
        v_dias_mudanca := 60;
      END IF;

      IF v_contrato_termina IS NOT NULL AND v_contrato_termina > (CURRENT_DATE + (v_dias_mudanca || ' days')::INTERVAL) THEN
        v_fator_cond := 0.0;
        v_exp_cond := FORMAT('Imóvel alugado com término em %s, após o prazo do comprador para morar (%s dias).',
          TO_CHAR(v_contrato_termina, 'DD/MM/YYYY'), v_dias_mudanca);
      ELSE
        v_fator_cond := 1.0;
        v_exp_cond := FORMAT('Imóvel com desocupação alinhada ao prazo de mudança de até %s dias.', v_dias_mudanca);
      END IF;
    ELSE
      -- Desocupado ou ocupado pelo proprietário: livre para morar dentro do prazo
      v_fator_cond := 1.0;
      v_exp_cond := FORMAT('Imóvel %s, disponível dentro do prazo para morar.', COALESCE(v_venda.ocupacao, 'desocupado'));
    END IF;
  ELSIF v_finalidade_norm IN ('renda', 'renda_aluguel') THEN
    -- Yield do aluguel atual >= yield mínimo
    v_yield_minimo_inv := v_investidor.yield_minimo_mensal;

    IF v_venda.valor_aluguel_atual IS NOT NULL AND v_preco_pedido IS NOT NULL AND v_preco_pedido > 0 THEN
      v_yield_imovel := ROUND((v_venda.valor_aluguel_atual / v_preco_pedido) * 100.0, 2);
    END IF;

    IF v_yield_imovel IS NOT NULL AND v_yield_minimo_inv IS NOT NULL AND v_yield_minimo_inv > 0 THEN
      IF v_yield_imovel >= v_yield_minimo_inv THEN
        v_fator_cond := 1.0;
        v_exp_cond := FORMAT('Yield do aluguel atual (%s%% a.m.) atende ao yield mínimo exigido (%s%% a.m.).', v_yield_imovel, v_yield_minimo_inv);
      ELSE
        v_fator_cond := 0.0;
        v_exp_cond := FORMAT('Yield do aluguel atual (%s%% a.m.) é inferior ao yield mínimo exigido (%s%% a.m.).', v_yield_imovel, v_yield_minimo_inv);
      END IF;
    ELSE
      -- Decisão documentada no SQL: na ausência de valor de aluguel ou yield mínimo,
      -- considera atendido (1.0) para não penalizar cadastro sem dado opcional
      v_fator_cond := 1.0;
      v_exp_cond := 'Condição aceita para finalidade de renda (sem restrição de yield mínimo estipulada).';
    END IF;
  ELSE
    -- Revenda ou geral
    v_fator_cond := 1.0;
    v_exp_cond := 'Condição do imóvel aceita para o objetivo da compra.';
  END IF;

  -- ============================================================================
  -- TOTALIZAÇÃO COM NORMALIZAÇÃO POR CRITÉRIOS APLICÁVEIS
  -- ============================================================================
  v_soma_pesos_aplicaveis := 0.0;
  v_soma_pontos := 0.0;

  IF v_aplica_preco THEN
    v_soma_pesos_aplicaveis := v_soma_pesos_aplicaveis + v_peso_preco;
    v_soma_pontos := v_soma_pontos + (v_fator_preco * v_peso_preco);
  END IF;

  IF v_aplica_loc THEN
    v_soma_pesos_aplicaveis := v_soma_pesos_aplicaveis + v_peso_loc;
    v_soma_pontos := v_soma_pontos + (v_fator_loc * v_peso_loc);
  END IF;

  IF v_aplica_tipo THEN
    v_soma_pesos_aplicaveis := v_soma_pesos_aplicaveis + v_peso_tipo;
    v_soma_pontos := v_soma_pontos + (v_fator_tipo * v_peso_tipo);
  END IF;

  IF v_aplica_pag THEN
    v_soma_pesos_aplicaveis := v_soma_pesos_aplicaveis + v_peso_pag;
    v_soma_pontos := v_soma_pontos + (v_fator_pag * v_peso_pag);
  END IF;

  IF v_aplica_prazo THEN
    v_soma_pesos_aplicaveis := v_soma_pesos_aplicaveis + v_peso_prazo;
    v_soma_pontos := v_soma_pontos + (v_fator_prazo * v_peso_prazo);
  END IF;

  IF v_aplica_dif THEN
    v_soma_pesos_aplicaveis := v_soma_pesos_aplicaveis + v_peso_dif;
    v_soma_pontos := v_soma_pontos + (v_fator_dif * v_peso_dif);
  END IF;

  IF v_aplica_cond THEN
    v_soma_pesos_aplicaveis := v_soma_pesos_aplicaveis + v_peso_cond;
    v_soma_pontos := v_soma_pontos + (v_fator_cond * v_peso_cond);
  END IF;

  IF v_soma_pesos_aplicaveis > 0 THEN
    v_percentual_calc := ROUND((v_soma_pontos / v_soma_pesos_aplicaveis) * 100.0);
  ELSE
    v_percentual_calc := 0;
  END IF;

  -- Clamping seguro no intervalo [0, 100]
  IF v_percentual_calc < 0 THEN v_percentual_calc := 0; END IF;
  IF v_percentual_calc > 100 THEN v_percentual_calc := 100; END IF;

  -- ============================================================================
  -- CONSTRUÇÃO DO DETALHAMENTO JSONB E RETROCOMPATIBILIDADE
  -- Formato de cada critério:
  --   criterio, peso, fator, pontos, aplicavel, atendido, explicacao
  -- Limiar de atendido para retrocompatibilidade: fator >= 0.5 (atendido parcial/integral)
  -- ============================================================================
  -- Item Preço
  v_obj_item := jsonb_build_object(
    'criterio', 'preco',
    'nome', 'Preço',
    'peso', v_peso_preco,
    'fator', v_fator_preco,
    'pontos', ROUND(v_fator_preco * v_peso_preco, 2),
    'aplicavel', v_aplica_preco,
    'atendido', (v_fator_preco >= 0.5),
    'explicacao', v_exp_preco
  );
  v_arr_detalhamento := v_arr_detalhamento || v_obj_item;
  IF v_aplica_preco THEN
    v_arr_legado_criterios := v_arr_legado_criterios || v_obj_item;
    IF v_fator_preco >= 0.5 THEN v_arr_atendidos := v_arr_atendidos || v_obj_item; ELSE v_arr_nao_atendidos := v_arr_nao_atendidos || v_obj_item; END IF;
  END IF;

  -- Item Localização
  v_obj_item := jsonb_build_object(
    'criterio', 'localizacao',
    'nome', 'Localização',
    'peso', v_peso_loc,
    'fator', v_fator_loc,
    'pontos', ROUND(v_fator_loc * v_peso_loc, 2),
    'aplicavel', v_aplica_loc,
    'atendido', (v_fator_loc >= 0.5),
    'explicacao', v_exp_loc
  );
  v_arr_detalhamento := v_arr_detalhamento || v_obj_item;
  IF v_aplica_loc THEN
    v_arr_legado_criterios := v_arr_legado_criterios || v_obj_item;
    IF v_fator_loc >= 0.5 THEN v_arr_atendidos := v_arr_atendidos || v_obj_item; ELSE v_arr_nao_atendidos := v_arr_nao_atendidos || v_obj_item; END IF;
  END IF;

  -- Item Tipologia
  v_obj_item := jsonb_build_object(
    'criterio', 'tipologia',
    'nome', 'Tipologia',
    'peso', v_peso_tipo,
    'fator', v_fator_tipo,
    'pontos', ROUND(v_fator_tipo * v_peso_tipo, 2),
    'aplicavel', v_aplica_tipo,
    'atendido', (v_fator_tipo >= 0.5),
    'explicacao', v_exp_tipo
  );
  v_arr_detalhamento := v_arr_detalhamento || v_obj_item;
  IF v_aplica_tipo THEN
    v_arr_legado_criterios := v_arr_legado_criterios || v_obj_item;
    IF v_fator_tipo >= 0.5 THEN v_arr_atendidos := v_arr_atendidos || v_obj_item; ELSE v_arr_nao_atendidos := v_arr_nao_atendidos || v_obj_item; END IF;
  END IF;

  -- Item Pagamento
  v_obj_item := jsonb_build_object(
    'criterio', 'pagamento',
    'nome', 'Forma de Pagamento',
    'peso', v_peso_pag,
    'fator', v_fator_pag,
    'pontos', ROUND(v_fator_pag * v_peso_pag, 2),
    'aplicavel', v_aplica_pag,
    'atendido', (v_fator_pag >= 0.5),
    'explicacao', v_exp_pag
  );
  v_arr_detalhamento := v_arr_detalhamento || v_obj_item;
  IF v_aplica_pag THEN
    v_arr_legado_criterios := v_arr_legado_criterios || v_obj_item;
    IF v_fator_pag >= 0.5 THEN v_arr_atendidos := v_arr_atendidos || v_obj_item; ELSE v_arr_nao_atendidos := v_arr_nao_atendidos || v_obj_item; END IF;
  END IF;

  -- Item Prazo
  v_obj_item := jsonb_build_object(
    'criterio', 'prazo',
    'nome', 'Prazo',
    'peso', v_peso_prazo,
    'fator', v_fator_prazo,
    'pontos', ROUND(v_fator_prazo * v_peso_prazo, 2),
    'aplicavel', v_aplica_prazo,
    'atendido', (v_fator_prazo >= 0.5),
    'explicacao', v_exp_prazo
  );
  v_arr_detalhamento := v_arr_detalhamento || v_obj_item;
  IF v_aplica_prazo THEN
    v_arr_legado_criterios := v_arr_legado_criterios || v_obj_item;
    IF v_fator_prazo >= 0.5 THEN v_arr_atendidos := v_arr_atendidos || v_obj_item; ELSE v_arr_nao_atendidos := v_arr_nao_atendidos || v_obj_item; END IF;
  END IF;

  -- Item Diferenciais
  v_obj_item := jsonb_build_object(
    'criterio', 'diferenciais',
    'nome', 'Diferenciais',
    'peso', v_peso_dif,
    'fator', v_fator_dif,
    'pontos', ROUND(v_fator_dif * v_peso_dif, 2),
    'aplicavel', v_aplica_dif,
    'atendido', (v_fator_dif >= 0.5),
    'explicacao', v_exp_dif
  );
  v_arr_detalhamento := v_arr_detalhamento || v_obj_item;
  IF v_aplica_dif THEN
    v_arr_legado_criterios := v_arr_legado_criterios || v_obj_item;
    IF v_fator_dif >= 0.5 THEN v_arr_atendidos := v_arr_atendidos || v_obj_item; ELSE v_arr_nao_atendidos := v_arr_nao_atendidos || v_obj_item; END IF;
  END IF;

  -- Item Condição
  v_obj_item := jsonb_build_object(
    'criterio', 'condicao',
    'nome', 'Condição / Ocupação',
    'peso', v_peso_cond,
    'fator', v_fator_cond,
    'pontos', ROUND(v_fator_cond * v_peso_cond, 2),
    'aplicavel', v_aplica_cond,
    'atendido', (v_fator_cond >= 0.5),
    'explicacao', v_exp_cond
  );
  v_arr_detalhamento := v_arr_detalhamento || v_obj_item;
  IF v_aplica_cond THEN
    v_arr_legado_criterios := v_arr_legado_criterios || v_obj_item;
    IF v_fator_cond >= 0.5 THEN v_arr_atendidos := v_arr_atendidos || v_obj_item; ELSE v_arr_nao_atendidos := v_arr_nao_atendidos || v_obj_item; END IF;
  END IF;

  RETURN QUERY SELECT
    v_percentual_calc,
    v_arr_legado_criterios,
    v_arr_atendidos,
    v_arr_nao_atendidos,
    v_arr_detalhamento;
END;
$$;

-- ==============================================================================
-- 6. ATUALIZAR FUNÇÃO DE RECÁLCULO DO PAR (fn_recalcular_compatibilidade_par)
-- Mantendo a PRIMEIRA CAMADA INTACTA e gravando o detalhamento JSON
-- ==============================================================================
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
BEGIN
  -- Camada 1: Executa pré-motor determinístico de eliminação (INTACTA)
  SELECT * INTO v_descarte
  FROM public.fn_avaliar_descarte_pre_motor(p_lead_venda_id, p_lead_investidor_id);

  IF v_descarte.eliminado THEN
    -- Grava o par como eliminado na tabela compatibilidades com o motivo auditável
    INSERT INTO public.compatibilidades (
      lead_venda_id,
      lead_investidor_id,
      percentual,
      criterios,
      criterios_atendidos,
      criterios_nao_atendidos,
      detalhamento,
      status,
      eliminado,
      motivo_eliminacao,
      atualizado_em
    )
    VALUES (
      p_lead_venda_id,
      p_lead_investidor_id,
      0,
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
      criterios = '[]'::jsonb,
      criterios_atendidos = '[]'::jsonb,
      criterios_nao_atendidos = '[]'::jsonb,
      detalhamento = '[]'::jsonb,
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

  -- Par NÃO eliminado: segue para a nova pontuação parcial (7 critérios com pesos configuráveis)
  SELECT * INTO v_res 
  FROM public.fn_calcular_compatibilidade_detalhada(p_lead_venda_id, p_lead_investidor_id);

  -- Grava na tabela public.compatibilidades como par ativo com detalhamento JSON
  INSERT INTO public.compatibilidades (
    lead_venda_id,
    lead_investidor_id,
    percentual,
    criterios,
    criterios_atendidos,
    criterios_nao_atendidos,
    detalhamento,
    status,
    eliminado,
    motivo_eliminacao,
    atualizado_em
  )
  VALUES (
    p_lead_venda_id,
    p_lead_investidor_id,
    v_res.percentual,
    v_res.criterios,
    v_res.criterios_atendidos,
    v_res.criterios_nao_atendidos,
    v_res.detalhamento,
    'pendente',
    FALSE,
    NULL,
    NOW()
  )
  ON CONFLICT (lead_venda_id, lead_investidor_id)
  DO UPDATE SET
    percentual = EXCLUDED.percentual,
    criterios = EXCLUDED.criterios,
    criterios_atendidos = EXCLUDED.criterios_atendidos,
    criterios_nao_atendidos = EXCLUDED.criterios_nao_atendidos,
    detalhamento = EXCLUDED.detalhamento,
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
  END;

  RETURN v_res.percentual;
END;
$$;

-- ==============================================================================
-- 7. ATUALIZAR FUNÇÃO fn_calcular_compatibilidade RETROCOMPATÍVEL
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.fn_calcular_compatibilidade(
  p_lead_venda_id UUID,
  p_lead_investidor_id UUID
)
RETURNS TABLE (
  percentual NUMERIC,
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
-- 8. ATUALIZAR FUNÇÕES DE LISTAGEM PARA EXPOR detalhamento JSON
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.fn_listar_oportunidades_investidor()
RETURNS TABLE (
  compatibilidade_id UUID,
  lead_venda_id UUID,
  lead_investidor_id UUID,
  percentual INTEGER,
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
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso restrito a investidores autenticados.';
  END IF;

  RETURN QUERY
  SELECT 
    c.id AS compatibilidade_id,
    lv.id AS lead_venda_id,
    li.id AS lead_investidor_id,
    c.percentual,
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
  ORDER BY c.percentual DESC, lv.criado_em DESC;
END;
$$;

DROP FUNCTION IF EXISTS public.fn_gestor_listar_matches();
CREATE OR REPLACE FUNCTION public.fn_gestor_listar_matches()
RETURNS TABLE (
  compatibilidade_id UUID,
  percentual INTEGER,
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
    c.percentual DESC, 
    c.atualizado_em DESC;
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION public.fn_recalcular_todas_compatibilidades() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_calcular_compatibilidade_detalhada(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_recalcular_compatibilidade_par(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_calcular_compatibilidade(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_listar_oportunidades_investidor() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_gestor_listar_matches() TO authenticated;
