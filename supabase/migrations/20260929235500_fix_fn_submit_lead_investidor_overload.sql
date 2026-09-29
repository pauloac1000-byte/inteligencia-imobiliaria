-- Migração para remover a versão ambígua de 10 parâmetros de fn_submit_lead_investidor
-- Mantendo apenas a versão oficial de 11 parâmetros (com p_user_id UUID DEFAULT NULL)
-- SECURITY DEFINER com permissões explícitas para anon e authenticated.

-- 1. Dropar a versão antiga de 10 parâmetros
DROP FUNCTION IF EXISTS public.fn_submit_lead_investidor(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

-- 2. Garantir que a versão de 11 parâmetros está presente, atualizada e com SECURITY DEFINER
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

-- 3. Conceder permissão de execução aos perfis anon e authenticated
GRANT EXECUTE ON FUNCTION public.fn_submit_lead_investidor(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID) TO anon, authenticated;
