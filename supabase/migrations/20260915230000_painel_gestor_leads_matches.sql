-- Migration: Painel do Gestor - RPCs seguras para Leads e Matches, Status em Compatibilidades
-- Versão: 20260915230000_painel_gestor_leads_matches.sql

-- 1. Adicionar coluna status em public.compatibilidades para aprovação/descarte
ALTER TABLE public.compatibilidades
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pendente'
  CHECK (status IN ('pendente', 'aprovado', 'descartado'));

CREATE INDEX IF NOT EXISTS idx_compatibilidades_status
  ON public.compatibilidades(status);

-- 2. Atualizar política RLS de UPDATE em compatibilidades para gestor
DROP POLICY IF EXISTS "compatibilidades_gestor_update" ON public.compatibilidades;
CREATE POLICY "compatibilidades_gestor_update" ON public.compatibilidades
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.tipo = 'gestor')
  );

-- 3. Atualizar política RLS de UPDATE em leads_venda para gestor poder atualizar status
DROP POLICY IF EXISTS "leads_venda_gestor_update" ON public.leads_venda;
CREATE POLICY "leads_venda_gestor_update" ON public.leads_venda
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.tipo = 'gestor')
  );

-- 4. RPC SECURITY DEFINER para verificar se o usuário autenticado é gestor
CREATE OR REPLACE FUNCTION public.fn_is_gestor()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND tipo = 'gestor'
  );
$$;

GRANT EXECUTE ON FUNCTION public.fn_is_gestor() TO authenticated;

-- 5. RPC SECURITY DEFINER para listar todos os leads (venda e investidor) para o gestor
CREATE OR REPLACE FUNCTION public.fn_gestor_listar_leads()
RETURNS TABLE (
  id UUID,
  rota TEXT,
  protocolo TEXT,
  nome TEXT,
  telefone TEXT,
  email TEXT,
  motivo_venda TEXT,
  prazo_desejado TEXT,
  status TEXT,
  tipo_imovel TEXT,
  cidade TEXT,
  valor_estimado TEXT,
  mensagem TEXT,
  ticket TEXT,
  objetivo TEXT,
  prazo_decisao TEXT,
  cidades_interesse TEXT,
  perfil TEXT,
  user_id UUID,
  criado_em TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.fn_is_gestor() THEN
    RAISE EXCEPTION 'Acesso negado: apenas gestores podem visualizar os leads.';
  END IF;

  RETURN QUERY
  -- Leads de Proprietário / Venda
  SELECT 
    lv.id,
    COALESCE(lv.rota, 'proprietario') AS rota,
    COALESCE(lv.protocolo, 'KX-0000') AS protocolo,
    lv.nome,
    lv.telefone,
    lv.email,
    lv.motivo_venda,
    lv.prazo_desejado,
    COALESCE(lv.status, 'Recebido') AS status,
    lv.tipo_imovel,
    lv.cidade,
    lv.valor_estimado,
    lv.mensagem,
    NULL::TEXT AS ticket,
    NULL::TEXT AS objetivo,
    NULL::TEXT AS prazo_decisao,
    NULL::TEXT AS cidades_interesse,
    NULL::TEXT AS perfil,
    lv.user_id,
    lv.criado_em
  FROM public.leads_venda lv

  UNION ALL

  -- Leads de Investidor
  SELECT 
    li.id,
    COALESCE(li.rota, 'investidor') AS rota,
    COALESCE(li.protocolo, 'KX-0000') AS protocolo,
    li.nome,
    li.telefone,
    li.email,
    NULL::TEXT AS motivo_venda,
    NULL::TEXT AS prazo_desejado,
    'Cadastrado'::TEXT AS status,
    NULL::TEXT AS tipo_imovel,
    NULL::TEXT AS cidade,
    NULL::TEXT AS valor_estimado,
    NULL::TEXT AS mensagem,
    li.ticket,
    li.objetivo,
    li.prazo_decisao,
    li.cidades_interesse,
    li.perfil,
    li.user_id,
    li.criado_em
  FROM public.leads_investidor li

  ORDER BY criado_em DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_gestor_listar_leads() TO authenticated;

-- 6. RPC SECURITY DEFINER para atualizar status de um lead de venda (com persistência)
CREATE OR REPLACE FUNCTION public.fn_gestor_atualizar_status_lead(
  p_lead_id UUID,
  p_novo_status TEXT
)
RETURNS TABLE (
  id UUID,
  protocolo TEXT,
  status TEXT,
  atualizado_em TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.leads_venda;
  v_status_normalizado TEXT;
BEGIN
  IF NOT public.fn_is_gestor() THEN
    RAISE EXCEPTION 'Acesso negado: apenas gestores podem atualizar status de leads.';
  END IF;

  -- Normalização de status aceitos:
  -- 'recebido' -> 'Recebido'
  -- 'em análise' / 'em_analise' -> 'Em análise'
  -- 'com compatibilidade' / 'com_compatibilidade' -> 'Com compatibilidade'
  -- 'em negociação' / 'em_negociacao' -> 'Em negociação'
  v_status_normalizado := TRIM(p_novo_status);
  IF LOWER(v_status_normalizado) IN ('recebido') THEN
    v_status_normalizado := 'Recebido';
  ELSIF LOWER(v_status_normalizado) IN ('em análise', 'em analise', 'em_analise') THEN
    v_status_normalizado := 'Em análise';
  ELSIF LOWER(v_status_normalizado) IN ('com compatibilidade', 'com_compatibilidade') THEN
    v_status_normalizado := 'Com compatibilidade';
  ELSIF LOWER(v_status_normalizado) IN ('em negociação', 'em negociacao', 'em_negociacao') THEN
    v_status_normalizado := 'Em negociação';
  END IF;

  UPDATE public.leads_venda
  SET status = v_status_normalizado
  WHERE public.leads_venda.id = p_lead_id
  RETURNING * INTO v_lead;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead de venda não encontrado para o ID %', p_lead_id;
  END IF;

  RETURN QUERY SELECT v_lead.id, v_lead.protocolo, v_lead.status, NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_gestor_atualizar_status_lead(UUID, TEXT) TO authenticated;

-- 7. RPC SECURITY DEFINER para listar matches (pares imóvel x investidor) para o gestor
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
  atualizado_em TIMESTAMPTZ
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
    c.atualizado_em
  FROM public.compatibilidades c
  JOIN public.leads_venda lv ON lv.id = c.lead_venda_id
  JOIN public.leads_investidor li ON li.id = c.lead_investidor_id
  LEFT JOIN public.interesses_investidor ii 
    ON ii.lead_venda_id = lv.id 
   AND ii.lead_investidor_id = li.id
  ORDER BY c.percentual DESC, c.atualizado_em DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_gestor_listar_matches() TO authenticated;

-- 8. RPC SECURITY DEFINER para aprovar ou descartar um match
CREATE OR REPLACE FUNCTION public.fn_gestor_decidir_match(
  p_compatibilidade_id UUID,
  p_acao TEXT -- 'aprovar' ou 'descartar'
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
  v_novo_status TEXT;
  v_compat public.compatibilidades;
BEGIN
  IF NOT public.fn_is_gestor() THEN
    RAISE EXCEPTION 'Acesso negado: apenas gestores podem aprovar ou descartar matches.';
  END IF;

  IF LOWER(TRIM(p_acao)) = 'aprovar' THEN
    v_novo_status := 'aprovado';
  ELSIF LOWER(TRIM(p_acao)) = 'descartar' THEN
    v_novo_status := 'descartado';
  ELSIF LOWER(TRIM(p_acao)) = 'pendente' THEN
    v_novo_status := 'pendente';
  ELSE
    RAISE EXCEPTION 'Ação inválida: deve ser aprovar, descartar ou pendente.';
  END IF;

  UPDATE public.compatibilidades
  SET status = v_novo_status,
      atualizado_em = NOW()
  WHERE public.compatibilidades.id = p_compatibilidade_id
  RETURNING * INTO v_compat;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registro de compatibilidade % não encontrado.', p_compatibilidade_id;
  END IF;

  -- Se o match for aprovado, podemos também sugerir ou atualizar o status do lead_venda se estiver como 'Recebido' para 'Com compatibilidade'
  IF v_novo_status = 'aprovado' THEN
    UPDATE public.leads_venda
    SET status = 'Com compatibilidade'
    WHERE id = v_compat.lead_venda_id
      AND status IN ('Recebido', 'Em análise');
  END IF;

  RETURN QUERY SELECT v_compat.id, v_compat.status, v_compat.atualizado_em;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_gestor_decidir_match(UUID, TEXT) TO authenticated;
