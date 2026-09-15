-- Migration: Area do Investidor, Vinculacao de Teses, Tabela de Interesses e RPC Mascarada
-- Versão: 20260915220000_investidor_area_interesses_compatibilidade.sql

-- 1. Adicionar user_id em public.leads_investidor (seguindo padrão de leads_venda)
ALTER TABLE public.leads_investidor
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_investidor_user_id ON public.leads_investidor (user_id);
CREATE INDEX IF NOT EXISTS idx_leads_investidor_email_lower ON public.leads_investidor (LOWER(TRIM(email)));

-- Política RLS para que investidores autenticados possam ler suas próprias teses
DROP POLICY IF EXISTS "leads_investidor_owner_select" ON public.leads_investidor;
CREATE POLICY "leads_investidor_owner_select" ON public.leads_investidor
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR auth.role() = 'authenticated');

-- 2. Atualizar fn_vincular_lead_por_email para vincular também leads_investidor quando o usuário fizer login
CREATE OR REPLACE FUNCTION public.fn_vincular_lead_por_email(
  p_user_id UUID,
  p_email TEXT
)
RETURNS TABLE (
  total_vinculados INT,
  protocolos TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cleaned_email TEXT;
  v_count_venda INT := 0;
  v_count_inv INT := 0;
  v_protocolos TEXT[];
BEGIN
  -- Validação de segurança: o chamador authenticated só pode vincular a si mesmo
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Não autorizado a vincular leads para outro usuário.';
  END IF;

  v_cleaned_email := LOWER(TRIM(p_email));
  IF v_cleaned_email IS NULL OR v_cleaned_email = '' THEN
    RETURN QUERY SELECT 0::INT, ARRAY[]::TEXT[];
    RETURN;
  END IF;

  -- Coletar protocolos que serão vinculados (ou já vinculados a este usuário) de leads_venda e leads_investidor
  SELECT COALESCE(array_agg(protocolo), ARRAY[]::TEXT[])
  INTO v_protocolos
  FROM (
    SELECT protocolo FROM public.leads_venda
    WHERE LOWER(TRIM(email)) = v_cleaned_email
      AND (user_id IS NULL OR user_id = p_user_id)
    UNION
    SELECT protocolo FROM public.leads_investidor
    WHERE LOWER(TRIM(email)) = v_cleaned_email
      AND (user_id IS NULL OR user_id = p_user_id)
  ) sub;

  -- Atualizar leads_venda que possuem o mesmo email e ainda não possuem user_id
  WITH updated_venda AS (
    UPDATE public.leads_venda
    SET user_id = p_user_id
    WHERE LOWER(TRIM(email)) = v_cleaned_email
      AND (user_id IS NULL OR user_id = p_user_id)
    RETURNING id
  )
  SELECT COUNT(*)::INT INTO v_count_venda FROM updated_venda;

  -- Atualizar leads_investidor que possuem o mesmo email e ainda não possuem user_id
  WITH updated_inv AS (
    UPDATE public.leads_investidor
    SET user_id = p_user_id
    WHERE LOWER(TRIM(email)) = v_cleaned_email
      AND (user_id IS NULL OR user_id = p_user_id)
    RETURNING id
  )
  SELECT COUNT(*)::INT INTO v_count_inv FROM updated_inv;

  RETURN QUERY SELECT (v_count_venda + v_count_inv)::INT, v_protocolos;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_vincular_lead_por_email(UUID, TEXT) TO authenticated, anon;

-- 3. Atualizar fn_submit_lead_investidor para aceitar p_user_id opcional
CREATE OR REPLACE FUNCTION public.fn_submit_lead_investidor(
  p_telefone TEXT,
  p_ticket TEXT,
  p_objetivo TEXT,
  p_cidades_interesse TEXT,
  p_prazo_decisao TEXT,
  p_rota TEXT DEFAULT 'investidor',
  p_nome TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_perfil TEXT DEFAULT NULL,
  p_faixa_valor TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  protocolo TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.leads_investidor;
  v_final_user_id UUID;
BEGIN
  -- Se o usuário autenticado chamou, vincula automaticamente
  v_final_user_id := COALESCE(auth.uid(), p_user_id);

  INSERT INTO public.leads_investidor (
    telefone,
    ticket,
    objetivo,
    cidades_interesse,
    prazo_decisao,
    rota,
    nome,
    email,
    perfil,
    faixa_valor,
    user_id
  )
  VALUES (
    TRIM(p_telefone),
    p_ticket,
    p_objetivo,
    TRIM(p_cidades_interesse),
    p_prazo_decisao,
    COALESCE(p_rota, 'investidor'),
    NULLIF(TRIM(p_nome), ''),
    NULLIF(LOWER(TRIM(p_email)), ''),
    NULLIF(TRIM(p_perfil), ''),
    NULLIF(TRIM(p_faixa_valor), ''),
    v_final_user_id
  )
  RETURNING * INTO v_lead;

  RETURN QUERY SELECT v_lead.id, v_lead.protocolo;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_submit_lead_investidor(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID) TO anon, authenticated;

-- 4. Criar tabela public.interesses_investidor
CREATE TABLE IF NOT EXISTS public.interesses_investidor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_investidor_id UUID NOT NULL REFERENCES public.leads_investidor(id) ON DELETE CASCADE,
  lead_venda_id UUID NOT NULL REFERENCES public.leads_venda(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'recebido' CHECK (status IN ('recebido', 'em_analise', 'contatado', 'concluido', 'cancelado')),
  mensagem TEXT,
  notificado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT interesses_investidor_lead_par_unique UNIQUE (lead_investidor_id, lead_venda_id)
);

CREATE INDEX IF NOT EXISTS idx_interesses_investidor_user_id ON public.interesses_investidor (user_id);
CREATE INDEX IF NOT EXISTS idx_interesses_investidor_lead_venda ON public.interesses_investidor (lead_venda_id);
CREATE INDEX IF NOT EXISTS idx_interesses_investidor_lead_inv ON public.interesses_investidor (lead_investidor_id);
CREATE INDEX IF NOT EXISTS idx_interesses_investidor_status ON public.interesses_investidor (status);

-- Habilitar RLS em interesses_investidor
ALTER TABLE public.interesses_investidor ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "interesses_investidor_user_select" ON public.interesses_investidor;
CREATE POLICY "interesses_investidor_user_select" ON public.interesses_investidor
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.tipo = 'gestor'
  ));

DROP POLICY IF EXISTS "interesses_investidor_user_insert" ON public.interesses_investidor;
CREATE POLICY "interesses_investidor_user_insert" ON public.interesses_investidor
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "interesses_investidor_gestor_update" ON public.interesses_investidor;
CREATE POLICY "interesses_investidor_gestor_update" ON public.interesses_investidor
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.tipo = 'gestor'
  ));

-- 5. Atualizar política RLS de public.compatibilidades para investidor ler apenas de SUAS teses
DROP POLICY IF EXISTS "compatibilidades_auth_select" ON public.compatibilidades;
CREATE POLICY "compatibilidades_auth_select" ON public.compatibilidades
  FOR SELECT TO authenticated
  USING (
    -- Gestor lê todas
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.tipo = 'gestor')
    OR
    -- Investidor lê apenas compatibilidades vinculadas a suas teses
    EXISTS (
      SELECT 1 FROM public.leads_investidor li
      WHERE li.id = compatibilidades.lead_investidor_id
        AND li.user_id = auth.uid()
    )
  );

-- 6. Função auxiliar segura para mascarar valor_estimado em faixas
CREATE OR REPLACE FUNCTION public.fn_mascarar_faixa_valor(p_valor_estimado TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_num NUMERIC;
BEGIN
  IF p_valor_estimado IS NULL OR TRIM(p_valor_estimado) = '' THEN
    RETURN 'Sob consulta';
  END IF;

  v_num := public.fn_compat_extrair_valor_numerico(p_valor_estimado);
  IF v_num IS NULL THEN
    RETURN 'Sob consulta';
  END IF;

  IF v_num <= 200000 THEN
    RETURN 'Até R$ 200 mil';
  ELSIF v_num <= 300000 THEN
    RETURN 'R$ 200 a 300 mil';
  ELSIF v_num <= 450000 THEN
    RETURN 'R$ 300 a 450 mil';
  ELSIF v_num <= 600000 THEN
    RETURN 'R$ 450 a 600 mil';
  ELSIF v_num <= 900000 THEN
    RETURN 'R$ 600 a 900 mil';
  ELSIF v_num <= 1500000 THEN
    RETURN 'R$ 900 mil a 1,5 mi';
  ELSE
    RETURN 'Acima de R$ 1,5 milhão';
  END IF;
END;
$$;

-- 7. RPC SECURITY DEFINER para buscar oportunidades de compatibilidade mascaradas para o investidor autenticado
-- Não expõe endereço exato, mensagem íntima nem telefone/WhatsApp do proprietário.
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
    COALESCE(lv.status, 'Recebido') AS status_imovel,
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
  ORDER BY c.percentual DESC, lv.criado_em DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_listar_oportunidades_investidor() TO authenticated;

-- 8. RPC SECURITY DEFINER para manifestar interesse
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
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso não autenticado.';
  END IF;

  -- Valida se a tese pertence ao usuário autenticado (ou se usuário é gestor)
  IF NOT EXISTS (
    SELECT 1 FROM public.leads_investidor 
    WHERE id = p_lead_investidor_id AND user_id = v_user_id
  ) AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = v_user_id AND tipo = 'gestor'
  ) THEN
    RAISE EXCEPTION 'Tese de investimento não pertence ao usuário.';
  END IF;

  -- Valida se o lead de venda existe
  IF NOT EXISTS (SELECT 1 FROM public.leads_venda WHERE id = p_lead_venda_id) THEN
    RAISE EXCEPTION 'Imóvel não encontrado.';
  END IF;

  -- Verifica se já existe registro de interesse
  SELECT * INTO v_interesse
  FROM public.interesses_investidor
  WHERE lead_investidor_id = p_lead_investidor_id
    AND lead_venda_id = p_lead_venda_id;

  IF FOUND THEN
    v_ja_existia := TRUE;
    RETURN QUERY SELECT v_interesse.id, v_interesse.status, v_interesse.notificado_em, v_ja_existia;
    RETURN;
  END IF;

  -- Inserção do novo interesse notificado
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

  RETURN QUERY SELECT v_interesse.id, v_interesse.status, v_interesse.notificado_em, FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_manifestar_interesse_investidor(UUID, UUID, TEXT) TO authenticated;
