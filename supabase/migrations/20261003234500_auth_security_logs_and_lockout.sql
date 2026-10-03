-- Tabela de logs de segurança para tentativas de login e redefinições de senha
CREATE TABLE IF NOT EXISTS public.auth_security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  tipo_evento TEXT NOT NULL, -- 'login_tentativa', 'login_sucesso', 'login_falha', 'solicitacao_redefinicao', 'redefinicao_sucesso'
  resultado TEXT NOT NULL, -- 'sucesso', 'falha', 'bloqueado'
  detalhe JSONB DEFAULT '{}'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para buscas rápidas por e-mail e data
CREATE INDEX IF NOT EXISTS idx_auth_sec_logs_email_data ON public.auth_security_logs (email, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_auth_sec_logs_tipo ON public.auth_security_logs (tipo_evento);

-- Habilitar RLS
ALTER TABLE public.auth_security_logs ENABLE ROW LEVEL SECURITY;

-- Política de RLS: apenas gestores podem ler os logs
DROP POLICY IF EXISTS "auth_sec_logs_gestor_select" ON public.auth_security_logs;
CREATE POLICY "auth_sec_logs_gestor_select" ON public.auth_security_logs
  FOR SELECT TO authenticated
  USING (public.fn_is_gestor());

-- Bloqueia inserções e mutações diretas de clientes anônimos ou comuns (as funções security definer farão isso)
DROP POLICY IF EXISTS "auth_sec_logs_no_client_insert" ON public.auth_security_logs;
CREATE POLICY "auth_sec_logs_no_client_insert" ON public.auth_security_logs
  FOR INSERT TO authenticated
  WITH CHECK (false);

-- Função RPC: Verifica status de bloqueio por e-mail (SECURITY DEFINER)
-- Retorna se está bloqueado, motivo ('limite_excedido' | 'bloqueio_temporario'), tentativas com falha, tempo restante em segundos e tier de bloqueio (5, 15, 30 min)
CREATE OR REPLACE FUNCTION public.fn_auth_check_lockout(p_email TEXT)
RETURNS TABLE (
  bloqueado BOOLEAN,
  motivo TEXT,
  tentativas_falhas INT,
  segundos_restantes INT,
  tempo_bloqueio_min INT,
  deve_redefinir BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_email TEXT;
  ultimo_sucesso TIMESTAMPTZ;
  ultima_redefinicao TIMESTAMPTZ;
  marco_temporal TIMESTAMPTZ;
  falhas_apos_marco INT;
  falhas_bloqueio INT;
  ultima_falha TIMESTAMPTZ;
  janela_min INT := 0;
  tempo_passado_seg INT;
  segundos_espera INT;
BEGIN
  clean_email := lower(trim(p_email));
  IF clean_email IS NULL OR clean_email = '' THEN
    RETURN QUERY SELECT false, NULL::TEXT, 0, 0, 0, false;
    RETURN;
  END IF;

  -- Localizar o último sucesso de login ou redefinição para zerar contador de falhas
  SELECT MAX(criado_em) INTO ultimo_sucesso
  FROM public.auth_security_logs
  WHERE email = clean_email AND tipo_evento = 'login_sucesso';

  SELECT MAX(criado_em) INTO ultima_redefinicao
  FROM public.auth_security_logs
  WHERE email = clean_email AND tipo_evento = 'redefinicao_sucesso';

  marco_temporal := GREATEST(
    COALESCE(ultimo_sucesso, '1970-01-01'::timestamptz),
    COALESCE(ultima_redefinicao, '1970-01-01'::timestamptz)
  );

  -- Contar falhas após o último marco
  SELECT COUNT(*), MAX(criado_em)
  INTO falhas_apos_marco, ultima_falha
  FROM public.auth_security_logs
  WHERE email = clean_email
    AND tipo_evento = 'login_falha'
    AND criado_em > marco_temporal;

  falhas_apos_marco := COALESCE(falhas_apos_marco, 0);

  -- Se atingiu ou ultrapassou 5 tentativas de falha
  IF falhas_apos_marco >= 5 THEN
    -- Determinar escalonamento de bloqueio progressivo para além de 5 tentativas:
    -- 5 tentativas: obriga redefinição de senha e aplica 5 min de resfriamento inicial
    -- 6 tentativas: 15 min de bloqueio
    -- 7 ou mais tentativas: 30 min de bloqueio
    IF falhas_apos_marco = 5 THEN
      janela_min := 5;
    ELSIF falhas_apos_marco = 6 THEN
      janela_min := 15;
    ELSE
      janela_min := 30;
    END IF;

    tempo_passado_seg := EXTRACT(EPOCH FROM (NOW() - ultima_falha))::INT;
    segundos_espera := (janela_min * 60) - tempo_passado_seg;

    IF segundos_espera > 0 THEN
      -- Bloqueio temporário ativo
      RETURN QUERY SELECT
        true,
        'bloqueio_temporario'::TEXT,
        falhas_apos_marco,
        segundos_espera,
        janela_min,
        true;
      RETURN;
    ELSE
      -- Já passou o tempo de espera do bloqueio temporário, mas como atingiu 5 falhas, ainda é obrigado a redefinir a senha
      RETURN QUERY SELECT
        true,
        'limite_excedido'::TEXT,
        falhas_apos_marco,
        0,
        0,
        true;
      RETURN;
    END IF;
  END IF;

  -- Menos de 5 tentativas de falha
  RETURN QUERY SELECT
    false,
    NULL::TEXT,
    falhas_apos_marco,
    0,
    0,
    false;
END;
$$;

-- Função RPC: Registra tentativa de login e retorna estado atualizado
CREATE OR REPLACE FUNCTION public.fn_auth_record_attempt(
  p_email TEXT,
  p_resultado TEXT, -- 'sucesso' | 'falha'
  p_detalhes JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  bloqueado BOOLEAN,
  motivo TEXT,
  tentativas_falhas INT,
  segundos_restantes INT,
  tempo_bloqueio_min INT,
  deve_redefinir BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_email TEXT;
  evento TEXT;
BEGIN
  clean_email := lower(trim(p_email));
  IF clean_email IS NULL OR clean_email = '' THEN
    RETURN QUERY SELECT false, NULL::TEXT, 0, 0, 0, false;
    RETURN;
  END IF;

  IF p_resultado = 'sucesso' THEN
    evento := 'login_sucesso';
  ELSE
    evento := 'login_falha';
  END IF;

  INSERT INTO public.auth_security_logs (email, tipo_evento, resultado, detalhe)
  VALUES (clean_email, evento, p_resultado, COALESCE(p_detalhes, '{}'::jsonb));

  RETURN QUERY SELECT * FROM public.fn_auth_check_lockout(clean_email);
END;
$$;

-- Função RPC: Registra solicitação ou sucesso de redefinição de senha
CREATE OR REPLACE FUNCTION public.fn_auth_record_reset(
  p_email TEXT,
  p_etapa TEXT, -- 'solicitado' | 'concluido'
  p_detalhes JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_email TEXT;
  evento TEXT;
BEGIN
  clean_email := lower(trim(p_email));
  IF clean_email IS NULL OR clean_email = '' THEN
    RETURN false;
  END IF;

  IF p_etapa = 'concluido' THEN
    evento := 'redefinicao_sucesso';
  ELSE
    evento := 'solicitacao_redefinicao';
  END IF;

  INSERT INTO public.auth_security_logs (email, tipo_evento, resultado, detalhe)
  VALUES (clean_email, evento, 'sucesso', COALESCE(p_detalhes, '{}'::jsonb));

  RETURN true;
END;
$$;

-- Conceder permissão de execução das RPCs para anônimos e autenticados
GRANT EXECUTE ON FUNCTION public.fn_auth_check_lockout(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_auth_record_attempt(TEXT, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_auth_record_reset(TEXT, TEXT, JSONB) TO anon, authenticated;
