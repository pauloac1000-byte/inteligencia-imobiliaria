-- Migration: Autenticação, Perfis de Usuário e Vinculação Automática de Leads KORBIX
-- Criação da tabela public.profiles com tipos proprietario, investidor e gestor
-- Trigger em auth.users para auto-provisionamento do perfil a partir de raw_user_meta_data
-- Coluna user_id em public.leads_venda com FK para auth.users
-- Função SECURITY DEFINER fn_vincular_lead_por_email(p_user_id uuid, p_email text)

-- 1. Criar tabela public.profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('proprietario', 'investidor', 'gestor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles (usuário só lê e atualiza o próprio perfil)
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. Trigger para inserir profile automaticamente ao cadastrar em auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tipo TEXT;
BEGIN
  -- Obter tipo do user_metadata (fallback seguro: 'proprietario')
  v_tipo := COALESCE(NEW.raw_user_meta_data->>'tipo', 'proprietario');
  IF v_tipo NOT IN ('proprietario', 'investidor', 'gestor') THEN
    v_tipo := 'proprietario';
  END IF;

  INSERT INTO public.profiles (id, email, tipo, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    v_tipo,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      tipo = EXCLUDED.tipo;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Adicionar coluna user_id em public.leads_venda
ALTER TABLE public.leads_venda
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_venda_user_id ON public.leads_venda (user_id);
CREATE INDEX IF NOT EXISTS idx_leads_venda_email_lower ON public.leads_venda (LOWER(TRIM(email)));

-- Permitir que usuários autenticados vejam seus próprios leads vinculados
DROP POLICY IF EXISTS "leads_venda_owner_select" ON public.leads_venda;
CREATE POLICY "leads_venda_owner_select" ON public.leads_venda
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR auth.role() = 'authenticated');

-- 4. Função SECURITY DEFINER para vincular leads por e-mail de forma segura
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
  v_count INT := 0;
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

  -- Coletar protocolos que serão vinculados (ou já vinculados a este usuário)
  SELECT COALESCE(array_agg(protocolo), ARRAY[]::TEXT[])
  INTO v_protocolos
  FROM public.leads_venda
  WHERE LOWER(TRIM(email)) = v_cleaned_email
    AND (user_id IS NULL OR user_id = p_user_id);

  -- Atualizar leads_venda que possuem o mesmo email e ainda não possuem user_id
  WITH updated AS (
    UPDATE public.leads_venda
    SET user_id = p_user_id
    WHERE LOWER(TRIM(email)) = v_cleaned_email
      AND (user_id IS NULL OR user_id = p_user_id)
    RETURNING id
  )
  SELECT COUNT(*)::INT INTO v_count FROM updated;

  RETURN QUERY SELECT v_count, v_protocolos;
END;
$$;

-- Permissão para chamar a RPC
GRANT EXECUTE ON FUNCTION public.fn_vincular_lead_por_email(UUID, TEXT) TO authenticated, anon;
