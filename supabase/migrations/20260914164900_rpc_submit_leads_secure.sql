-- Migration: Criar RPCs SECURITY DEFINER para envio e atualização segura de leads KORBIX
-- Permite que visitantes anônimos registrem leads e obtenham seu protocolo KX-000X sem expor outros leads via SELECT aberta.
-- Mantém a política RLS restrita para SELECT (somente autenticados/administradores).

-- 1. Inserção Etapa 1 / Inserção Completa de Lead Venda
CREATE OR REPLACE FUNCTION public.fn_submit_lead_venda_etapa1(
  p_cidade TEXT,
  p_tipo_imovel TEXT,
  p_telefone TEXT,
  p_rota TEXT DEFAULT 'proprietario'
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
  v_lead public.leads_venda;
BEGIN
  INSERT INTO public.leads_venda (
    cidade,
    tipo_imovel,
    telefone,
    rota
  )
  VALUES (
    TRIM(p_cidade),
    p_tipo_imovel,
    TRIM(p_telefone),
    COALESCE(p_rota, 'proprietario')
  )
  RETURNING * INTO v_lead;

  RETURN QUERY SELECT v_lead.id, v_lead.protocolo;
END;
$$;

-- 2. Atualização Etapa 2 de Lead Venda
CREATE OR REPLACE FUNCTION public.fn_submit_lead_venda_etapa2(
  p_id UUID,
  p_nome TEXT,
  p_email TEXT,
  p_motivo_venda TEXT,
  p_prazo_desejado TEXT,
  p_valor_estimado TEXT DEFAULT NULL,
  p_mensagem TEXT DEFAULT NULL
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
  v_lead public.leads_venda;
BEGIN
  UPDATE public.leads_venda
  SET
    nome = TRIM(p_nome),
    email = LOWER(TRIM(p_email)),
    motivo_venda = p_motivo_venda,
    prazo_desejado = p_prazo_desejado,
    valor_estimado = NULLIF(TRIM(p_valor_estimado), ''),
    mensagem = NULLIF(TRIM(p_mensagem), '')
  WHERE public.leads_venda.id = p_id
  RETURNING * INTO v_lead;

  IF v_lead.id IS NULL THEN
    RAISE EXCEPTION 'Lead de venda com ID % não encontrado.', p_id;
  END IF;

  RETURN QUERY SELECT v_lead.id, v_lead.protocolo;
END;
$$;

-- 3. Inserção / Atualização Completa (Fallback) de Lead Venda
CREATE OR REPLACE FUNCTION public.fn_submit_lead_venda(
  p_telefone TEXT,
  p_tipo_imovel TEXT,
  p_cidade TEXT,
  p_rota TEXT DEFAULT 'proprietario',
  p_id UUID DEFAULT NULL,
  p_nome TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_valor_estimado TEXT DEFAULT NULL,
  p_motivo_venda TEXT DEFAULT NULL,
  p_prazo_desejado TEXT DEFAULT NULL,
  p_mensagem TEXT DEFAULT NULL
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
  v_lead public.leads_venda;
BEGIN
  IF p_id IS NOT NULL THEN
    UPDATE public.leads_venda
    SET
      telefone = TRIM(p_telefone),
      tipo_imovel = p_tipo_imovel,
      cidade = TRIM(p_cidade),
      rota = COALESCE(p_rota, 'proprietario'),
      nome = COALESCE(NULLIF(TRIM(p_nome), ''), leads_venda.nome),
      email = COALESCE(NULLIF(LOWER(TRIM(p_email)), ''), leads_venda.email),
      valor_estimado = COALESCE(NULLIF(TRIM(p_valor_estimado), ''), leads_venda.valor_estimado),
      motivo_venda = COALESCE(p_motivo_venda, leads_venda.motivo_venda),
      prazo_desejado = COALESCE(p_prazo_desejado, leads_venda.prazo_desejado),
      mensagem = COALESCE(NULLIF(TRIM(p_mensagem), ''), leads_venda.mensagem)
    WHERE public.leads_venda.id = p_id
    RETURNING * INTO v_lead;
  ELSE
    INSERT INTO public.leads_venda (
      telefone,
      tipo_imovel,
      cidade,
      rota,
      nome,
      email,
      valor_estimado,
      motivo_venda,
      prazo_desejado,
      mensagem
    )
    VALUES (
      TRIM(p_telefone),
      p_tipo_imovel,
      TRIM(p_cidade),
      COALESCE(p_rota, 'proprietario'),
      NULLIF(TRIM(p_nome), ''),
      NULLIF(LOWER(TRIM(p_email)), ''),
      NULLIF(TRIM(p_valor_estimado), ''),
      p_motivo_venda,
      p_prazo_desejado,
      NULLIF(TRIM(p_mensagem), '')
    )
    RETURNING * INTO v_lead;
  END IF;

  RETURN QUERY SELECT v_lead.id, v_lead.protocolo;
END;
$$;

-- 4. Inserção de Lead Investidor
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
  p_faixa_valor TEXT DEFAULT NULL
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
BEGIN
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
    faixa_valor
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
    NULLIF(TRIM(p_faixa_valor), '')
  )
  RETURNING * INTO v_lead;

  RETURN QUERY SELECT v_lead.id, v_lead.protocolo;
END;
$$;

-- 5. Conceder permissão EXECUTE aos papéis anon e authenticated
GRANT EXECUTE ON FUNCTION public.fn_submit_lead_venda_etapa1(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_submit_lead_venda_etapa2(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_submit_lead_venda(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_submit_lead_investidor(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
