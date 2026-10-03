-- ==============================================================================
-- Migration: Primeira camada do motor de compatibilidade (descarte pré-pontuação)
-- Versão: 20261003180000_primeira_camada_descarte_pre_motor.sql
--
-- ESPECIFICAÇÕES IMPLEMENTADAS:
-- 1. Eliminar o par (imóvel × busca de comprador/investidor) quando qualquer uma destas condições for verdadeira:
--    a) cidade do imóvel fora da lista de cidades da busca E distância > raio_km (quando houver ponto e raio definidos);
--    b) tipo do imóvel não está entre os tipos aceitos pela busca;
--    c) preço mínimo do vendedor > teto do comprador × 1,10 (10% tolerância);
--    d) comprador depende de financiamento e vendedor não aceita financiamento;
--    e) condição ou ocupação do imóvel recusada pelo comprador — incluindo o caso específico:
--       imóvel alugado cujo contrato termina DEPOIS do prazo para mudar de quem vai morar (finalidade "morar");
--    f) imóvel não está no estado "ativo" OU a busca não está ativa.
-- 2. Gravar motivo da eliminação em campo de texto claro em português para auditoria.
-- 3. Pares eliminados NÃO aparecem para investidor (fn_listar_oportunidades_investidor) nem na lista comum de matches,
--    mas aparecem apenas para o gestor sob novo filtro na aba Matches.
-- ==============================================================================

-- 1. Adicionar colunas necessárias em public.leads_venda
ALTER TABLE public.leads_venda
  ADD COLUMN IF NOT EXISTS aceita_financiamento BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS ocupacao TEXT DEFAULT 'desocupado', -- 'desocupado', 'ocupado_proprietario', 'alugado'
  ADD COLUMN IF NOT EXISTS condicao TEXT DEFAULT 'pronto', -- 'pronto', 'precisa_reforma', 'em_construcao'
  ADD COLUMN IF NOT EXISTS contrato_aluguel_termino DATE DEFAULT NULL;

-- 2. Adicionar coluna ativa em public.leads_investidor (se a busca está ativa ou inativa/pausada)
ALTER TABLE public.leads_investidor
  ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;

-- 3. Atualizar public.compatibilidades com campos de eliminação e auditoria
ALTER TABLE public.compatibilidades
  ADD COLUMN IF NOT EXISTS eliminado BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS motivo_eliminacao TEXT DEFAULT NULL;

-- Atualizar CHECK constraint do status em compatibilidades para permitir 'eliminado' caso necessário
ALTER TABLE public.compatibilidades DROP CONSTRAINT IF EXISTS compatibilidades_status_check;
ALTER TABLE public.compatibilidades ADD CONSTRAINT compatibilidades_status_check
  CHECK (status = ANY (ARRAY['pendente'::TEXT, 'aprovado'::TEXT, 'descartado'::TEXT, 'eliminado'::TEXT]));

-- Criar índice para performance de busca por eliminados
CREATE INDEX IF NOT EXISTS idx_compatibilidades_eliminado ON public.compatibilidades(eliminado);

-- Atualizar RLS em public.compatibilidades:
-- Usuários comuns (investidores) SÓ podem ler linhas onde eliminado = FALSE.
-- Gestores podem ler tudo (inclusive pares eliminados).
DROP POLICY IF EXISTS "compatibilidades_auth_select" ON public.compatibilidades;
CREATE POLICY "compatibilidades_auth_select" ON public.compatibilidades
  FOR SELECT TO authenticated
  USING (
    (EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.tipo = 'gestor'
    ))
    OR
    (
      eliminado = FALSE
      AND EXISTS (
        SELECT 1 FROM public.leads_investidor li 
        WHERE li.id = compatibilidades.lead_investidor_id 
          AND li.user_id = auth.uid()
      )
    )
  );

-- ==============================================================================
-- 4. FUNÇÃO DETERMINÍSTICA DA PRIMEIRA CAMADA (PRÉ-MOTOR DE DESCARTE)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.fn_avaliar_descarte_pre_motor(
  p_lead_venda_id UUID,
  p_lead_investidor_id UUID
)
RETURNS TABLE (
  eliminado BOOLEAN,
  motivo TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_venda public.leads_venda;
  v_investidor public.leads_investidor;
  
  -- Regra A (Localização)
  v_cidade_imovel_norm TEXT;
  v_cidade_match BOOLEAN := FALSE;
  v_distancia_metros DOUBLE PRECISION := NULL;
  v_raio_metros DOUBLE PRECISION := NULL;
  v_cidade_item TEXT;
  v_cidades_array TEXT[];
  v_circuito_aguas TEXT[] := ARRAY[
    'aguas de lindoia', 'lindoia', 'monte siao', 'serra negra',
    'aguas de sao pedro', 'piracicaba', 'amparo', 'pedreira',
    'jaguariuna', 'holambra', 'socorro', 'itapira'
  ];

  -- Regra B (Tipo de imóvel)
  v_tipo_imovel_norm TEXT;
  v_tipo_aceito BOOLEAN := FALSE;
  v_tipo_elem TEXT;

  -- Regra C (Preço mínimo do vendedor vs Teto absoluto)
  v_piso_vendedor NUMERIC;
  v_teto_comprador NUMERIC;
  v_teto_com_tolerancia NUMERIC;

  -- Regra D (Financiamento)
  v_precisa_financiamento BOOLEAN := FALSE;
  v_vendedor_aceita_finan BOOLEAN := TRUE;

  -- Regra E (Condição, Ocupação e Contrato Aluguel)
  v_reforma_recusada BOOLEAN := FALSE;
  v_contrato_termina DATE;
  v_dias_mudanca INTEGER := 60;
  v_data_limite_mudanca DATE;
  v_dias_restantes_contrato INTEGER;

  -- Regra F (Status ativo)
  v_status_venda_norm TEXT;
  v_busca_ativa BOOLEAN := TRUE;
BEGIN
  -- 1. Carrega dados do imóvel
  SELECT * INTO v_venda FROM public.leads_venda WHERE id = p_lead_venda_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT TRUE, 'Imóvel ofertado não encontrado no sistema.'::TEXT;
    RETURN;
  END IF;

  -- 2. Carrega dados da busca do comprador/investidor
  SELECT * INTO v_investidor FROM public.leads_investidor WHERE id = p_lead_investidor_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT TRUE, 'Busca do comprador/investidor não encontrada no sistema.'::TEXT;
    RETURN;
  END IF;

  -- ============================================================================
  -- REGRA F: Imóvel não está no estado "ativo" OU a busca não está ativa.
  -- ============================================================================
  v_status_venda_norm := LOWER(TRIM(COALESCE(v_venda.status, '')));
  IF v_status_venda_norm <> 'ativo' THEN
    RETURN QUERY SELECT TRUE, FORMAT('Imóvel não está no estado "ativo" (estado atual: "%s").', COALESCE(v_venda.status, 'indefinido'))::TEXT;
    RETURN;
  END IF;

  v_busca_ativa := COALESCE(v_investidor.ativo, TRUE);
  IF NOT v_busca_ativa THEN
    RETURN QUERY SELECT TRUE, 'A busca do comprador/investidor está pausada ou inativa.'::TEXT;
    RETURN;
  END IF;

  -- ============================================================================
  -- REGRA B: Tipo do imóvel não está entre os tipos aceitos pela busca.
  -- ============================================================================
  v_tipo_imovel_norm := public.fn_compat_normalizar_texto(v_venda.tipo_imovel);
  
  IF v_investidor.tipos_imovel IS NOT NULL AND array_length(v_investidor.tipos_imovel, 1) > 0 THEN
    FOREACH v_tipo_elem IN ARRAY v_investidor.tipos_imovel LOOP
      IF v_tipo_imovel_norm = public.fn_compat_normalizar_texto(v_tipo_elem)
         OR v_tipo_imovel_norm ILIKE '%' || public.fn_compat_normalizar_texto(v_tipo_elem) || '%'
         OR public.fn_compat_normalizar_texto(v_tipo_elem) ILIKE '%' || v_tipo_imovel_norm || '%' THEN
        v_tipo_aceito := TRUE;
        EXIT;
      END IF;
    END LOOP;

    IF NOT v_tipo_aceito THEN
      RETURN QUERY SELECT TRUE, FORMAT('Tipo de imóvel "%s" não está entre os tipos aceitos pelo comprador (%s).', 
        COALESCE(v_venda.tipo_imovel, 'indefinido'), 
        array_to_string(v_investidor.tipos_imovel, ', ')
      )::TEXT;
      RETURN;
    END IF;
  END IF;

  -- ============================================================================
  -- REGRA A: Cidade do imóvel fora da lista de cidades da busca E distância 
  -- (quando houver ponto geográfico e raio definidos) maior que o raio em km do comprador.
  -- ============================================================================
  v_cidade_imovel_norm := public.fn_compat_normalizar_texto(v_venda.cidade);

  -- 1. Verifica match por cidades_interesse (texto / lista / JSON)
  IF v_investidor.cidades_interesse IS NOT NULL AND TRIM(v_investidor.cidades_interesse) <> '' THEN
    IF TRIM(v_investidor.cidades_interesse) ~ '^\[' THEN
      BEGIN
        SELECT ARRAY_AGG(elems.val)
        INTO v_cidades_array
        FROM jsonb_array_elements_text(v_investidor.cidades_interesse::jsonb) AS elems(val);
      EXCEPTION WHEN OTHERS THEN
        v_cidades_array := string_to_array(v_investidor.cidades_interesse, ',');
      END;
    ELSE
      v_cidades_array := string_to_array(v_investidor.cidades_interesse, ',');
    END IF;

    FOREACH v_cidade_item IN ARRAY v_cidades_array LOOP
      DECLARE
        v_item_norm TEXT;
      BEGIN
        v_item_norm := public.fn_compat_normalizar_texto(v_cidade_item);
        IF v_item_norm IS NOT NULL AND v_item_norm <> '' THEN
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
  END IF;

  -- 2. Verifica match por códigos IBGE das cidades de interesse
  IF NOT v_cidade_match AND v_investidor.cidades_codigos_ibge IS NOT NULL AND array_length(v_investidor.cidades_codigos_ibge, 1) > 0 THEN
    IF v_venda.codigo_ibge IS NOT NULL AND v_venda.codigo_ibge = ANY(v_investidor.cidades_codigos_ibge) THEN
      v_cidade_match := TRUE;
    ELSIF EXISTS (
      SELECT 1 FROM public.municipios_sp m
      WHERE m.codigo_ibge = ANY(v_investidor.cidades_codigos_ibge)
        AND (
          v_cidade_imovel_norm = m.nome_normalizado
          OR v_cidade_imovel_norm ILIKE '%' || m.nome_normalizado || '%'
          OR m.nome_normalizado ILIKE '%' || v_cidade_imovel_norm || '%'
        )
    ) THEN
      v_cidade_match := TRUE;
    END IF;
  END IF;

  -- Se a cidade NÃO está na lista da busca:
  IF NOT v_cidade_match THEN
    -- Verifica se há ponto geográfico e raio definidos na busca e localização no imóvel
    IF v_investidor.localizacao_referencia IS NOT NULL 
       AND v_investidor.raio_km IS NOT NULL 
       AND v_investidor.raio_km > 0 
       AND v_venda.localizacao IS NOT NULL THEN
       
      v_distancia_metros := ST_Distance(v_venda.localizacao, v_investidor.localizacao_referencia);
      v_raio_metros := v_investidor.raio_km * 1000.0;

      IF v_distancia_metros > v_raio_metros THEN
        RETURN QUERY SELECT TRUE, FORMAT('Cidade do imóvel (%s) fora da lista de interesse e distância (%s km) excede o raio máximo permitido de %s km.',
          COALESCE(v_venda.cidade, 'Não informada'),
          ROUND((v_distancia_metros / 1000.0)::NUMERIC, 1)::TEXT,
          v_investidor.raio_km::TEXT
        )::TEXT;
        RETURN;
      END IF;
    ELSE
      -- Não tem ponto/raio ou não casou cidade
      RETURN QUERY SELECT TRUE, FORMAT('Cidade do imóvel (%s) não consta nas cidades ou regiões de interesse do comprador.',
        COALESCE(v_venda.cidade, 'Não informada')
      )::TEXT;
      RETURN;
    END IF;
  END IF;

  -- ============================================================================
  -- REGRA C: Preço mínimo do vendedor maior que o teto do comprador × 1,10
  -- (o preço mínimo do vendedor é o piso aceitável; o teto absoluto do comprador é o teto aceitável — tolerância 10%)
  -- ============================================================================
  v_piso_vendedor := COALESCE(v_venda.preco_minimo, v_venda.preco_pedido, public.fn_compat_extrair_valor_numerico(v_venda.valor_estimado));
  v_teto_comprador := COALESCE(v_investidor.preco_teto_absoluto, v_investidor.preco_maximo);

  IF v_piso_vendedor IS NOT NULL AND v_piso_vendedor > 0 AND v_teto_comprador IS NOT NULL AND v_teto_comprador > 0 THEN
    v_teto_com_tolerancia := ROUND(v_teto_comprador * 1.10, 2);
    IF v_piso_vendedor > v_teto_com_tolerancia THEN
      RETURN QUERY SELECT TRUE, FORMAT('Preço mínimo do vendedor (R$ %s) excede em mais de 10%% o teto aceitável do comprador (R$ %s; teto com tolerância: R$ %s).',
        ROUND(v_piso_vendedor, 2)::TEXT,
        ROUND(v_teto_comprador, 2)::TEXT,
        ROUND(v_teto_com_tolerancia, 2)::TEXT
      )::TEXT;
      RETURN;
    END IF;
  END IF;

  -- ============================================================================
  -- REGRA D: Comprador depende de financiamento (situação do crédito "financiamento aprovado" 
  -- ou "financiamento a aprovar") e o vendedor não aceita financiamento.
  -- ============================================================================
  IF v_investidor.forma_pagamento IS NOT NULL THEN
    IF LOWER(TRIM(v_investidor.forma_pagamento)) IN ('financiamento_aprovado', 'financiamento_a_aprovar') 
       OR LOWER(TRIM(v_investidor.forma_pagamento)) ILIKE '%financiamento%' THEN
      v_precisa_financiamento := TRUE;
    END IF;
  END IF;

  v_vendedor_aceita_finan := COALESCE(v_venda.aceita_financiamento, TRUE);

  IF v_precisa_financiamento AND NOT v_vendedor_aceita_finan THEN
    RETURN QUERY SELECT TRUE, 'Comprador depende de financiamento bancário e o proprietário não aceita financiamento no imóvel.'::TEXT;
    RETURN;
  END IF;

  -- ============================================================================
  -- REGRA E: Condição ou ocupação do imóvel recusada pelo comprador — incluindo o caso específico:
  -- imóvel alugado cujo contrato termina DEPOIS do prazo para mudar de quem vai morar (finalidade "morar").
  -- ============================================================================
  -- E.1. Reforma recusada pelo comprador
  IF v_investidor.aceita_reforma IS NOT NULL AND v_investidor.aceita_reforma = FALSE THEN
    IF LOWER(TRIM(COALESCE(v_venda.condicao, ''))) IN ('precisa_reforma', 'reforma_necessaria', 'reforma') THEN
      RETURN QUERY SELECT TRUE, 'Imóvel precisa de reformas e o comprador não aceita imóvel para reformar.'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- E.2. Caso específico: finalidade 'morar' e imóvel alugado cujo contrato termina DEPOIS do prazo para mudar
  IF LOWER(TRIM(COALESCE(v_investidor.finalidade, ''))) = 'morar' THEN
    IF LOWER(TRIM(COALESCE(v_venda.ocupacao, ''))) = 'alugado' THEN
      v_contrato_termina := v_venda.contrato_aluguel_termino;

      IF v_contrato_termina IS NOT NULL THEN
        -- Prazo para mudar: 'ate_30_dias', 'ate_60_dias', 'ate_90_dias'
        IF LOWER(TRIM(COALESCE(v_investidor.prazo_mudanca, ''))) = 'ate_30_dias' THEN
          v_dias_mudanca := 30;
        ELSIF LOWER(TRIM(COALESCE(v_investidor.prazo_mudanca, ''))) = 'ate_60_dias' THEN
          v_dias_mudanca := 60;
        ELSIF LOWER(TRIM(COALESCE(v_investidor.prazo_mudanca, ''))) = 'ate_90_dias' THEN
          v_dias_mudanca := 90;
        ELSE
          v_dias_mudanca := 60;
        END IF;

        v_data_limite_mudanca := CURRENT_DATE + (v_dias_mudanca || ' days')::INTERVAL;

        IF v_contrato_termina > v_data_limite_mudanca THEN
          v_dias_restantes_contrato := (v_contrato_termina - CURRENT_DATE);
          RETURN QUERY SELECT TRUE, FORMAT('Imóvel alugado com contrato até %s (restam %s dias), excedendo o prazo do comprador para mudar de até %s dias.',
            TO_CHAR(v_contrato_termina, 'DD/MM/YYYY'),
            v_dias_restantes_contrato::TEXT,
            v_dias_mudanca::TEXT
          )::TEXT;
          RETURN;
        END IF;
      END IF;
    END IF;
  END IF;

  -- Par passou em todas as 6 regras objetivas de pré-eliminação
  RETURN QUERY SELECT FALSE, NULL::TEXT;
  RETURN;
END;
$$;

-- ==============================================================================
-- 5. ATUALIZAR FUNÇÃO DE RECÁLCULO DO PAR (fn_recalcular_compatibilidade_par)
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
  -- Camada 1: Executa pré-motor determinístico de eliminação
  SELECT * INTO v_descarte
  FROM public.fn_avaliar_descarte_pre_motor(p_lead_venda_id, p_lead_investidor_id);

  IF v_descarte.eliminado THEN
    -- Grava o par como eliminado na tabela compatibilidades com o motivo auditável
    -- e zera a pontuação para manter transparência
    INSERT INTO public.compatibilidades (
      lead_venda_id,
      lead_investidor_id,
      percentual,
      criterios,
      criterios_atendidos,
      criterios_nao_atendidos,
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
      status = 'eliminado',
      eliminado = TRUE,
      motivo_eliminacao = EXCLUDED.motivo_eliminacao,
      atualizado_em = NOW();

    -- Remove da tabela compatibilidade_imovel_tese para não misturar no legado
    BEGIN
      DELETE FROM public.compatibilidade_imovel_tese
      WHERE lead_venda_id = p_lead_venda_id AND lead_investidor_id = p_lead_investidor_id;
    EXCEPTION WHEN OTHERS THEN
    END;

    RETURN 0;
  END IF;

  -- Par NÃO eliminado: segue para a pontuação determinística dos 5 critérios (peso 100)
  SELECT * INTO v_res 
  FROM public.fn_calcular_compatibilidade_detalhada(p_lead_venda_id, p_lead_investidor_id);

  -- Grava na tabela public.compatibilidades como par ativo/válido
  INSERT INTO public.compatibilidades (
    lead_venda_id,
    lead_investidor_id,
    percentual,
    criterios,
    criterios_atendidos,
    criterios_nao_atendidos,
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
    status = CASE 
      WHEN compatibilidades.status = 'eliminado' THEN 'pendente' 
      ELSE compatibilidades.status 
    END,
    eliminado = FALSE,
    motivo_eliminacao = NULL,
    atualizado_em = NOW();

  -- Sincroniza a tabela compatibilidade_imovel_tese
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
-- 6. ATUALIZAR FUNÇÃO DE LISTAGEM DE OPORTUNIDADES DO INVESTIDOR
-- Pares eliminados NUNCA aparecem na área do investidor
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
    c.criterios,
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
    AND COALESCE(c.eliminado, FALSE) = FALSE -- NUNCA exibe pares eliminados para o comprador/investidor
  ORDER BY c.percentual DESC, lv.criado_em DESC;
END;
$$;

-- ==============================================================================
-- 7. ATUALIZAR FUNÇÃO DE LISTAGEM DE MATCHES DO GESTOR
-- Adiciona colunas eliminado e motivo_eliminacao para alimentar o filtro "Eliminados"
-- ==============================================================================
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
    c.criterios,
    c.criterios_atendidos,
    c.criterios_nao_atendidos,
    lv.id AS lead_venda_id,
    COALESCE(lv.protocolo, 'KX-0000') AS imovel_protocolo,
    COALESCE(lv.tipo_imovel, 'Imóvel') AS imovel_tipo,
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
    c.eliminado ASC, -- Não eliminados primeiro
    c.percentual DESC, 
    c.atualizado_em DESC;
END;
$$;

-- ==============================================================================
-- 8. ATUALIZAR TRIGGERS DE RECÁLCULO PARA REAGIREM A TODAS AS MUDANÇAS RELEVANTES
-- ==============================================================================
-- 8.1. Trigger em leads_venda
DROP TRIGGER IF EXISTS trg_leads_venda_compatibilidade ON public.leads_venda;
CREATE TRIGGER trg_leads_venda_compatibilidade
  AFTER INSERT OR UPDATE OF tipo_imovel, cidade, valor_estimado, preco_pedido, preco_minimo, prazo_desejado, status, aceita_financiamento, ocupacao, condicao, contrato_aluguel_termino, localizacao ON public.leads_venda
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_compat_ao_mudar_lead_venda();

-- 8.2. Trigger em leads_investidor
DROP TRIGGER IF EXISTS trg_leads_investidor_compatibilidade ON public.leads_investidor;
CREATE TRIGGER trg_leads_investidor_compatibilidade
  AFTER INSERT OR UPDATE OF ticket, objetivo, finalidade, tipos_imovel, cidades_interesse, cidades_codigos_ibge, preco_minimo, preco_maximo, preco_teto_absoluto, forma_pagamento, aceita_reforma, prazo_mudanca, raio_km, localizacao_referencia, ativo ON public.leads_investidor
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_compat_ao_mudar_lead_investidor();

-- ==============================================================================
-- 9. PERMISSÕES DE EXECUÇÃO
-- ==============================================================================
GRANT EXECUTE ON FUNCTION public.fn_avaliar_descarte_pre_motor(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_recalcular_compatibilidade_par(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_gestor_listar_matches() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_listar_oportunidades_investidor() TO authenticated;
