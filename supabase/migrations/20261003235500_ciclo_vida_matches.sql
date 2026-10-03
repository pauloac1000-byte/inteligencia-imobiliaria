-- ==============================================================================
-- Migration: Ciclo de Vida dos Matches (Imóvel x Busca)
-- Estados: sugerido, aprovado, apresentado, interesse, ligação, visita, proposta, fechado, perdido
-- Regras de Auditoria, Histórico de Transições e Mascaramento Seguro
-- ==============================================================================

-- 1. Atualizar a coluna e as constraints de status na tabela compatibilidades
-- O par nasce com "sugerido"
ALTER TABLE public.compatibilidades
  DROP CONSTRAINT IF EXISTS compatibilidades_status_check;

-- Adiciona novas colunas para campos contratuais/motivo diretamente no par para consulta ágil
ALTER TABLE public.compatibilidades
  ADD COLUMN IF NOT EXISTS status_data_mudanca TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS fechado_preco_final NUMERIC,
  ADD COLUMN IF NOT EXISTS fechado_data_contrato DATE,
  ADD COLUMN IF NOT EXISTS motivo_perda TEXT;

-- Migra dados ANTES de aplicar o novo CHECK para que nenhuma linha viole a constraint
UPDATE public.compatibilidades
SET status = 'sugerido', status_data_mudanca = NOW()
WHERE status = 'pendente' OR status IS NULL;

UPDATE public.compatibilidades
SET status = 'perdido', motivo_perda = 'outro', status_data_mudanca = NOW()
WHERE status = 'descartado';

-- Constraint de status dos matches (inclui 'eliminado' como estado técnico de pré-filtro se couber, mas o ciclo é sugerido -> fechado/perdido)
ALTER TABLE public.compatibilidades
  ADD CONSTRAINT compatibilidades_status_check
  CHECK (status = ANY (ARRAY[
    'sugerido'::text,
    'aprovado'::text,
    'apresentado'::text,
    'interesse'::text,
    'ligacao'::text,
    'visita'::text,
    'proposta'::text,
    'fechado'::text,
    'perdido'::text,
    'eliminado'::text
  ]));

-- Constraint de motivo_perda fechado
ALTER TABLE public.compatibilidades
  DROP CONSTRAINT IF EXISTS compatibilidades_motivo_perda_check;

ALTER TABLE public.compatibilidades
  ADD CONSTRAINT compatibilidades_motivo_perda_check
  CHECK (
    motivo_perda IS NULL OR motivo_perda = ANY (ARRAY[
      'preco'::text,
      'localizacao'::text,
      'documentacao'::text,
      'credito_negado'::text,
      'desistencia'::text,
      'comprou_outro'::text,
      'outro'::text
    ])
  );

-- Ajusta o default da coluna status para 'sugerido'
ALTER TABLE public.compatibilidades
  ALTER COLUMN status SET DEFAULT 'sugerido'::text;

-- 2. Tabela de histórico de transições do match
CREATE TABLE IF NOT EXISTS public.compatibilidades_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compatibilidade_id UUID NOT NULL REFERENCES public.compatibilidades(id) ON DELETE CASCADE,
  estado_anterior TEXT,
  estado_novo TEXT NOT NULL,
  autor_tipo TEXT NOT NULL CHECK (autor_tipo = ANY (ARRAY['gestor'::text, 'comprador'::text, 'sistema'::text])),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fechado_preco_final NUMERIC,
  fechado_data_contrato DATE,
  motivo_perda TEXT CHECK (
    motivo_perda IS NULL OR motivo_perda = ANY (ARRAY[
      'preco'::text,
      'localizacao'::text,
      'documentacao'::text,
      'credito_negado'::text,
      'desistencia'::text,
      'comprou_outro'::text,
      'outro'::text
    ])
  ),
  observacao TEXT
);

-- Índices no histórico
CREATE INDEX IF NOT EXISTS idx_compat_hist_compat_id ON public.compatibilidades_historico(compatibilidade_id);
CREATE INDEX IF NOT EXISTS idx_compat_hist_criado_em ON public.compatibilidades_historico(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_compat_hist_estado_novo ON public.compatibilidades_historico(estado_novo);

-- Habilitar RLS no histórico
ALTER TABLE public.compatibilidades_historico ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "compat_hist_gestor_select" ON public.compatibilidades_historico;
CREATE POLICY "compat_hist_gestor_select" ON public.compatibilidades_historico
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.tipo = 'gestor')
  );

DROP POLICY IF EXISTS "compat_hist_gestor_all" ON public.compatibilidades_historico;
CREATE POLICY "compat_hist_gestor_all" ON public.compatibilidades_historico
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.tipo = 'gestor')
  );

-- Popula histórico inicial para os pares existentes (idempotente)
INSERT INTO public.compatibilidades_historico (
  compatibilidade_id,
  estado_anterior,
  estado_novo,
  autor_tipo,
  criado_em,
  observacao
)
SELECT 
  c.id,
  NULL,
  c.status,
  'sistema',
  c.atualizado_em,
  'Carga inicial do ciclo de vida'
FROM public.compatibilidades c
WHERE NOT EXISTS (
  SELECT 1 FROM public.compatibilidades_historico ch WHERE ch.compatibilidade_id = c.id
);

-- 3. Atualizar fn_recalcular_compatibilidade_par: todo novo par nasce 'sugerido'
-- e pares recalculados que não estão em estado posterior mantêm seu ciclo sem sobrescrever
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
  v_venda public.leads_venda;
  v_investidor public.leads_investidor;
  v_nota_comprador INTEGER := 0;
  v_nota_vendedor INTEGER := 0;
  v_nota_final INTEGER := 0;
  v_faixa TEXT := 'oculta';
  v_conf RECORD;

  v_preco_pedido NUMERIC;
  v_preco_minimo NUMERIC;
  v_teto_comprador NUMERIC;
  v_fator_preco_vendedor NUMERIC := 0.0;
  v_exp_preco_vendedor TEXT := '';
  v_forma_pag_norm TEXT := '';
  v_fator_pag_vendedor NUMERIC := 1.0;
  v_exp_pag_vendedor TEXT := '';
  v_fator_prazo_vendedor NUMERIC := 0.0;
  v_exp_prazo_vendedor TEXT := '';
  v_soma_pontos_vendedor NUMERIC := 0.0;
  v_detalhamento_vendedor JSONB := '[]'::jsonb;
  v_compat_existente RECORD;
  v_novo_id UUID;
BEGIN
  -- 1. CAMADA 1: AVALIAÇÃO DE DESCARTE PRÉ-MOTOR (Eliminatórias)
  SELECT * INTO v_descarte 
  FROM public.fn_avaliar_descarte_pre_motor(p_lead_venda_id, p_lead_investidor_id);

  IF v_descarte.eliminado THEN
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
      status_data_mudanca,
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
      NOW(),
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

  -- A. PREÇO OFERTÁVEL DO VENDEDOR (Peso 40)
  IF v_teto_comprador IS NOT NULL AND v_preco_minimo IS NOT NULL AND v_teto_comprador < v_preco_minimo THEN
    v_fator_preco_vendedor := 0.0;
    v_exp_preco_vendedor := FORMAT('Teto do comprador (R$ %s) está abaixo do preço mínimo aceito pelo vendedor (R$ %s). Fator zerado.',
      ROUND(v_teto_comprador, 2), ROUND(v_preco_minimo, 2));
  ELSE
    SELECT COALESCE((elem->>'fator')::NUMERIC, 0.0)
    INTO v_fator_preco_vendedor
    FROM jsonb_array_elements(v_res.detalhamento) elem
    WHERE elem->>'criterio' = 'preco';

    IF v_fator_preco_vendedor IS NULL THEN
      v_fator_preco_vendedor := 0.0;
    END IF;

    v_exp_preco_vendedor := FORMAT('Preço ofertável compatível com a margem do vendedor (fator %s).', v_fator_preco_vendedor);
  END IF;

  -- B. PAGAMENTO DO VENDEDOR (Peso 25)
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

  -- C. PRAZO DO VENDEDOR (Peso 20)
  SELECT COALESCE((elem->>'fator')::NUMERIC, 0.0)
  INTO v_fator_prazo_vendedor
  FROM jsonb_array_elements(v_res.detalhamento) elem
  WHERE elem->>'criterio' = 'prazo';

  IF v_fator_prazo_vendedor IS NULL THEN
    v_fator_prazo_vendedor := 0.0;
  END IF;

  v_exp_prazo_vendedor := FORMAT('Alinhamento de prazo idêntico ao fator temporal avaliado pelo comprador (fator %s).', v_fator_prazo_vendedor);

  -- D. SOMA DOS PONTOS DO VENDEDOR
  v_soma_pontos_vendedor := (v_fator_preco_vendedor * 40.0)
                          + (v_fator_pag_vendedor * 25.0)
                          + (v_fator_prazo_vendedor * 20.0);

  v_nota_vendedor := ROUND((v_soma_pontos_vendedor / 85.0) * 100.0);
  IF v_nota_vendedor > 100 THEN v_nota_vendedor := 100; END IF;
  IF v_nota_vendedor < 0 THEN v_nota_vendedor := 0; END IF;

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

  -- 4. NOTA FINAL HARMÔNICA
  IF (v_nota_comprador + v_nota_vendedor) > 0 THEN
    v_nota_final := ROUND((2.0 * v_nota_comprador::NUMERIC * v_nota_vendedor::NUMERIC) / (v_nota_comprador + v_nota_vendedor)::NUMERIC);
  ELSE
    v_nota_final := 0;
  END IF;

  IF v_nota_final > 100 THEN v_nota_final := 100; END IF;
  IF v_nota_final < 0 THEN v_nota_final := 0; END IF;

  -- 5. FAIXAS DE COMPATIBILIDADE
  IF v_nota_final >= 85 THEN
    v_faixa := 'excelente';
  ELSIF v_nota_final >= 75 THEN
    v_faixa := 'alta';
  ELSIF v_nota_final >= 50 THEN
    v_faixa := 'media';
  ELSE
    v_faixa := 'oculta';
  END IF;

  -- 6. CONFIANÇA
  SELECT * INTO v_conf
  FROM public.fn_calcular_confianca_compatibilidade(p_lead_venda_id, p_lead_investidor_id);

  -- 7. Gravação: todo par nasce 'sugerido'
  -- Se já existia e estava em 'eliminado', retorna para 'sugerido'. Se já estava em outro estado, mantém o estado atual.
  SELECT id, status INTO v_compat_existente
  FROM public.compatibilidades
  WHERE lead_venda_id = p_lead_venda_id AND lead_investidor_id = p_lead_investidor_id;

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
    status_data_mudanca,
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
    'sugerido',
    NOW(),
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
      WHEN compatibilidades.status = 'eliminado' THEN 'sugerido'
      ELSE compatibilidades.status 
    END,
    status_data_mudanca = CASE
      WHEN compatibilidades.status = 'eliminado' THEN NOW()
      ELSE compatibilidades.status_data_mudanca
    END,
    eliminado = FALSE,
    motivo_eliminacao = NULL,
    atualizado_em = NOW()
  RETURNING id INTO v_novo_id;

  -- Se era um par novo, registra no histórico a criação como 'sugerido'
  IF v_compat_existente.id IS NULL AND v_novo_id IS NOT NULL THEN
    INSERT INTO public.compatibilidades_historico (
      compatibilidade_id,
      estado_anterior,
      estado_novo,
      autor_tipo,
      criado_em,
      observacao
    ) VALUES (
      v_novo_id,
      NULL,
      'sugerido',
      'sistema',
      NOW(),
      'Par gerado pelo motor de compatibilidade'
    );
  END IF;

  -- Sincroniza tabela legada compatibilidade_imovel_tese
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

-- 4. RPC SECURITY DEFINER para Gestor Mudar Estado de Match
-- Estados permitidos: 'aprovado', 'apresentado', 'interesse', 'ligacao', 'visita', 'proposta', 'fechado', 'perdido', 'sugerido'
CREATE OR REPLACE FUNCTION public.fn_gestor_mudar_estado_match(
  p_compatibilidade_id UUID,
  p_novo_estado TEXT,
  p_fechado_preco NUMERIC DEFAULT NULL,
  p_fechado_data DATE DEFAULT NULL,
  p_motivo_perda TEXT DEFAULT NULL,
  p_observacao TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  status TEXT,
  status_data_mudanca TIMESTAMPTZ,
  fechado_preco_final NUMERIC,
  fechado_data_contrato DATE,
  motivo_perda TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_estado_norm TEXT;
  v_compat public.compatibilidades;
  v_estado_anterior TEXT;
  v_motivo_norm TEXT;
BEGIN
  v_user_id := auth.uid();
  IF NOT public.fn_is_gestor() THEN
    RAISE EXCEPTION 'Acesso negado: apenas gestores podem alterar o estado dos matches.';
  END IF;

  v_estado_norm := LOWER(TRIM(COALESCE(p_novo_estado, '')));

  IF v_estado_norm NOT IN (
    'sugerido', 'aprovado', 'apresentado', 'interesse', 
    'ligacao', 'visita', 'proposta', 'fechado', 'perdido'
  ) THEN
    RAISE EXCEPTION 'Estado inválido: %', p_novo_estado;
  END IF;

  -- Validações para fechado: exige preço e data
  IF v_estado_norm = 'fechado' THEN
    IF p_fechado_preco IS NULL OR p_fechado_preco <= 0 THEN
      RAISE EXCEPTION 'Ao marcar como fechado, é obrigatório informar o preço final da venda.';
    END IF;
    IF p_fechado_data IS NULL THEN
      RAISE EXCEPTION 'Ao marcar como fechado, é obrigatório informar a data do contrato.';
    END IF;
  END IF;

  -- Validações para perdido: exige motivo na lista fechada
  IF v_estado_norm = 'perdido' THEN
    v_motivo_norm := LOWER(TRIM(COALESCE(p_motivo_perda, '')));
    IF v_motivo_norm NOT IN ('preco', 'localizacao', 'documentacao', 'credito_negado', 'desistencia', 'comprou_outro', 'outro') THEN
      RAISE EXCEPTION 'Ao marcar como perdido, é obrigatório selecionar um motivo válido: preço, localização, documentação, crédito negado, desistência, comprou outro, outro.';
    END IF;
  END IF;

  SELECT * INTO v_compat
  FROM public.compatibilidades
  WHERE public.compatibilidades.id = p_compatibilidade_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match % não encontrado.', p_compatibilidade_id;
  END IF;

  v_estado_anterior := v_compat.status;

  -- Atualiza o registro do par
  UPDATE public.compatibilidades
  SET 
    status = v_estado_norm,
    status_data_mudanca = NOW(),
    fechado_preco_final = CASE WHEN v_estado_norm = 'fechado' THEN p_fechado_preco ELSE NULL END,
    fechado_data_contrato = CASE WHEN v_estado_norm = 'fechado' THEN p_fechado_data ELSE NULL END,
    motivo_perda = CASE WHEN v_estado_norm = 'perdido' THEN v_motivo_norm ELSE NULL END,
    atualizado_em = NOW()
  WHERE public.compatibilidades.id = p_compatibilidade_id
  RETURNING * INTO v_compat;

  -- Se for aprovado, promove o status do imóvel de venda se estiver inicial
  IF v_estado_norm = 'aprovado' THEN
    UPDATE public.leads_venda
    SET status = 'Com compatibilidade'
    WHERE public.leads_venda.id = v_compat.lead_venda_id
      AND LOWER(TRIM(public.leads_venda.status)) IN ('recebido', 'em análise');
  END IF;

  -- Registra no histórico auditável
  INSERT INTO public.compatibilidades_historico (
    compatibilidade_id,
    estado_anterior,
    estado_novo,
    autor_tipo,
    user_id,
    criado_em,
    fechado_preco_final,
    fechado_data_contrato,
    motivo_perda,
    observacao
  ) VALUES (
    p_compatibilidade_id,
    v_estado_anterior,
    v_estado_norm,
    'gestor',
    v_user_id,
    NOW(),
    v_compat.fechado_preco_final,
    v_compat.fechado_data_contrato,
    v_compat.motivo_perda,
    p_observacao
  );

  RETURN QUERY SELECT 
    v_compat.id,
    v_compat.status,
    v_compat.status_data_mudanca,
    v_compat.fechado_preco_final,
    v_compat.fechado_data_contrato,
    v_compat.motivo_perda;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_gestor_mudar_estado_match(UUID, TEXT, NUMERIC, DATE, TEXT, TEXT) TO authenticated;

-- Retrocompatibilidade para fn_gestor_decidir_match: agora mapeia para a nova máquina de estados
CREATE OR REPLACE FUNCTION public.fn_gestor_decidir_match(
  p_compatibilidade_id UUID,
  p_acao TEXT
)
RETURNS TABLE (
  id UUID,
  status TEXT,
  atualizado_em TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_novo_estado TEXT;
  v_res RECORD;
BEGIN
  IF NOT public.fn_is_gestor() THEN
    RAISE EXCEPTION 'Acesso negado: apenas gestores podem aprovar ou descartar matches.';
  END IF;

  IF LOWER(TRIM(p_acao)) = 'aprovar' THEN
    v_novo_estado := 'aprovado';
  ELSIF LOWER(TRIM(p_acao)) = 'descartar' THEN
    v_novo_estado := 'perdido';
  ELSIF LOWER(TRIM(p_acao)) = 'pendente' OR LOWER(TRIM(p_acao)) = 'sugerido' THEN
    v_novo_estado := 'sugerido';
  ELSE
    RAISE EXCEPTION 'Ação inválida: deve ser aprovar, descartar ou pendente.';
  END IF;

  SELECT * INTO v_res 
  FROM public.fn_gestor_mudar_estado_match(
    p_compatibilidade_id,
    v_novo_estado,
    NULL,
    NULL,
    CASE WHEN v_novo_estado = 'perdido' THEN 'outro' ELSE NULL END,
    'Decisão rápida do gestor'
  );

  RETURN QUERY SELECT v_res.id, v_res.status, v_res.status_data_mudanca;
END;
$$;

-- 5. Atualizar fn_manifestar_interesse_investidor para avançar o estado do match para 'interesse'
-- Apenas investidor dono da busca; par deve estar visível para ele (aprovado ou posterior, nota >= limiar);
-- se já estiver num estado posterior (ligacao, visita, proposta, fechado), não rebaixa.
CREATE OR REPLACE FUNCTION public.fn_manifestar_interesse_investidor(
  p_lead_investidor_id UUID,
  p_lead_venda_id UUID,
  p_mensagem TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  status TEXT,
  notificado_em TIMESTAMPTZ,
  ja_existia BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_interesse public.interesses_investidor;
  v_ja_existia BOOLEAN := FALSE;
  v_compat public.compatibilidades;
  v_limiar_visivel NUMERIC := 75.0;
  v_estado_anterior TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso não autenticado.';
  END IF;

  -- 1. Valida se a tese pertence ao investidor autenticado (ou gestor)
  IF NOT EXISTS (
    SELECT 1 FROM public.leads_investidor 
    WHERE id = p_lead_investidor_id AND user_id = v_user_id
  ) AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = v_user_id AND tipo = 'gestor'
  ) THEN
    RAISE EXCEPTION 'Tese de investimento não pertence ao usuário.';
  END IF;

  -- 2. Valida se o imóvel existe
  IF NOT EXISTS (SELECT 1 FROM public.leads_venda WHERE id = p_lead_venda_id) THEN
    RAISE EXCEPTION 'Imóvel não encontrado.';
  END IF;

  -- 3. Valida se o par existe na tabela compatibilidades e se é visível para o investidor
  SELECT COALESCE(valor, 75.0) INTO v_limiar_visivel
  FROM public.configuracao_limiares_compatibilidade
  WHERE parametro = 'visivel_comprador';

  SELECT * INTO v_compat
  FROM public.compatibilidades
  WHERE lead_venda_id = p_lead_venda_id
    AND lead_investidor_id = p_lead_investidor_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Par de compatibilidade não encontrado.';
  END IF;

  -- Para investidor comum, par só pode receber interesse se estiver aprovado pelo gestor ou em estado de negociação,
  -- e com nota_final >= limiar de visibilidade (ou já tem interesse prévio)
  IF NOT public.fn_is_gestor() THEN
    IF v_compat.eliminado THEN
      RAISE EXCEPTION 'Imóvel indisponível para manifestação de interesse.';
    END IF;

    IF v_compat.status NOT IN ('aprovado', 'apresentado', 'interesse', 'ligacao', 'visita', 'proposta') THEN
      RAISE EXCEPTION 'A oportunidade ainda não foi homologada pelo gestor.';
    END IF;

    IF COALESCE(v_compat.nota_final, v_compat.percentual) < v_limiar_visivel THEN
      RAISE EXCEPTION 'Oportunidade abaixo do limiar de visibilidade.';
    END IF;
  END IF;

  -- 4. Verifica se já existe registro na tabela interesses_investidor
  SELECT * INTO v_interesse
  FROM public.interesses_investidor
  WHERE lead_investidor_id = p_lead_investidor_id
    AND lead_venda_id = p_lead_venda_id;

  IF FOUND THEN
    v_ja_existia := TRUE;
  ELSE
    INSERT INTO public.interesses_investidor (
      lead_investidor_id,
      lead_venda_id,
      user_id,
      status,
      mensagem,
      notificado_em
    )
    VALUES (
      p_lead_investidor_id,
      p_lead_venda_id,
      v_user_id,
      'recebido',
      NULLIF(TRIM(p_mensagem), ''),
      NOW()
    )
    RETURNING * INTO v_interesse;
  END IF;

  -- 5. Atualiza o ciclo de vida do match para 'interesse' (se ainda estiver em sugerido, aprovado ou apresentado)
  -- Se já estiver num estado posterior (ligacao, visita, proposta, fechado), não rebaixa.
  IF v_compat.status IN ('sugerido', 'aprovado', 'apresentado') THEN
    v_estado_anterior := v_compat.status;

    UPDATE public.compatibilidades
    SET 
      status = 'interesse',
      status_data_mudanca = NOW(),
      atualizado_em = NOW()
    WHERE id = v_compat.id;

    INSERT INTO public.compatibilidades_historico (
      compatibilidade_id,
      estado_anterior,
      estado_novo,
      autor_tipo,
      user_id,
      criado_em,
      observacao
    ) VALUES (
      v_compat.id,
      v_estado_anterior,
      'interesse',
      'comprador',
      v_user_id,
      NOW(),
      'Comprador clicou no botão Manifestar Interesse'
    );
  END IF;

  RETURN QUERY SELECT v_interesse.id, v_interesse.status, v_interesse.notificado_em, v_ja_existia;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_manifestar_interesse_investidor(UUID, UUID, TEXT) TO authenticated;

-- 6. Atualizar a RPC fn_listar_oportunidades_investidor:
-- "o comprador só vê pares que eu aprovei e que têm nota igual ou acima do limiar de visibilidade (75 da tabela).
-- pares com estado diferente de aprovado/apresentado/interesse/ligação/visita/proposta (ou seja, sugerido, perdido, fechado, eliminado) não aparecem para o investidor; manter o mascaramento existente intacto."
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
  interesse_status TEXT,
  status_match TEXT,
  status_data_mudanca TIMESTAMPTZ
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

  -- Lê o limiar configurado pelo gestor para exibição ao comprador (padrão 75 da tabela de configuração)
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
    0 AS nota_vendedor, -- Investidor NUNCA vê a nota do vendedor (mascaramento mantido)
    COALESCE(c.nota_final, c.percentual) AS nota_final,
    COALESCE(c.faixa_compatibilidade, 'oculta') AS faixa_compatibilidade,
    COALESCE(c.confianca_classificacao, 'baixa') AS confianca_classificacao,
    COALESCE(c.confianca_percentual, 0) AS confianca_percentual,
    COALESCE(c.confianca_detalhes, '{}'::jsonb) AS confianca_detalhes,
    public.fn_mascarar_detalhamento_investidor(COALESCE(c.detalhamento, c.criterios)) AS criterios,
    public.fn_mascarar_detalhamento_investidor(c.criterios_atendidos) AS criterios_atendidos,
    public.fn_mascarar_detalhamento_investidor(c.criterios_nao_atendidos) AS criterios_nao_atendidos,
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
    ii.status AS interesse_status,
    c.status AS status_match,
    c.status_data_mudanca
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
    -- Regra Estrita de Visibilidade:
    -- Apenas pares aprovados pelo gestor ou em etapas ativas de negociação (apresentado, interesse, ligacao, visita, proposta)
    -- Pares com status sugerido, perdido, fechado ou eliminado NÃO aparecem
    AND c.status = ANY (ARRAY[
      'aprovado'::text,
      'apresentado'::text,
      'interesse'::text,
      'ligacao'::text,
      'visita'::text,
      'proposta'::text
    ])
    -- E nota_final >= limiar configurado (75) ou já manifestou interesse prévio
    AND (
      COALESCE(c.nota_final, c.percentual) >= v_limiar_visivel
      OR ii.id IS NOT NULL
    )
  ORDER BY COALESCE(c.nota_final, c.percentual) DESC, lv.criado_em DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_listar_oportunidades_investidor() TO authenticated;

-- 7. Atualizar fn_gestor_listar_matches para expor os novos campos do ciclo
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
  status_data_mudanca TIMESTAMPTZ,
  fechado_preco_final NUMERIC,
  fechado_data_contrato DATE,
  motivo_perda TEXT,
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
    COALESCE(c.status, 'sugerido') AS status_match,
    COALESCE(c.status_data_mudanca, c.atualizado_em) AS status_data_mudanca,
    c.fechado_preco_final,
    c.fechado_data_contrato,
    c.motivo_perda,
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

GRANT EXECUTE ON FUNCTION public.fn_gestor_listar_matches() TO authenticated;

-- 8. Nova RPC: fn_gestor_resumo_ciclo_matches()
-- Retorna a contagem de matches não eliminados por estado e por motivo de perda
CREATE OR REPLACE FUNCTION public.fn_gestor_resumo_ciclo_matches()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_res JSONB;
BEGIN
  IF NOT public.fn_is_gestor() THEN
    RAISE EXCEPTION 'Acesso negado: apenas gestores podem consultar o resumo do ciclo de matches.';
  END IF;

  SELECT jsonb_build_object(
    'estados', jsonb_build_object(
      'sugerido', COUNT(*) FILTER (WHERE status = 'sugerido' AND NOT COALESCE(eliminado, false)),
      'aprovado', COUNT(*) FILTER (WHERE status = 'aprovado' AND NOT COALESCE(eliminado, false)),
      'apresentado', COUNT(*) FILTER (WHERE status = 'apresentado' AND NOT COALESCE(eliminado, false)),
      'interesse', COUNT(*) FILTER (WHERE status = 'interesse' AND NOT COALESCE(eliminado, false)),
      'ligacao', COUNT(*) FILTER (WHERE status = 'ligacao' AND NOT COALESCE(eliminado, false)),
      'visita', COUNT(*) FILTER (WHERE status = 'visita' AND NOT COALESCE(eliminado, false)),
      'proposta', COUNT(*) FILTER (WHERE status = 'proposta' AND NOT COALESCE(eliminado, false)),
      'fechado', COUNT(*) FILTER (WHERE status = 'fechado' AND NOT COALESCE(eliminado, false)),
      'perdido', COUNT(*) FILTER (WHERE status = 'perdido' AND NOT COALESCE(eliminado, false))
    ),
    'motivos_perda', jsonb_build_object(
      'preco', COUNT(*) FILTER (WHERE status = 'perdido' AND motivo_perda = 'preco' AND NOT COALESCE(eliminado, false)),
      'localizacao', COUNT(*) FILTER (WHERE status = 'perdido' AND motivo_perda = 'localizacao' AND NOT COALESCE(eliminado, false)),
      'documentacao', COUNT(*) FILTER (WHERE status = 'perdido' AND motivo_perda = 'documentacao' AND NOT COALESCE(eliminado, false)),
      'credito_negado', COUNT(*) FILTER (WHERE status = 'perdido' AND motivo_perda = 'credito_negado' AND NOT COALESCE(eliminado, false)),
      'desistencia', COUNT(*) FILTER (WHERE status = 'perdido' AND motivo_perda = 'desistencia' AND NOT COALESCE(eliminado, false)),
      'comprou_outro', COUNT(*) FILTER (WHERE status = 'perdido' AND motivo_perda = 'comprou_outro' AND NOT COALESCE(eliminado, false)),
      'outro', COUNT(*) FILTER (WHERE status = 'perdido' AND (motivo_perda = 'outro' OR motivo_perda IS NULL) AND NOT COALESCE(eliminado, false))
    ),
    'total_ativos', COUNT(*) FILTER (WHERE NOT COALESCE(eliminado, false)),
    'total_eliminados', COUNT(*) FILTER (WHERE COALESCE(eliminado, false))
  ) INTO v_res
  FROM public.compatibilidades;

  RETURN v_res;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_gestor_resumo_ciclo_matches() TO authenticated;
