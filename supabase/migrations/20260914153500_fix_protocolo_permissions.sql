-- Garantir SECURITY DEFINER e permissões na sequence do protocolo KORBIX
CREATE OR REPLACE FUNCTION public.fn_gerar_protocolo_korbix()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_val BIGINT;
BEGIN
  -- Se o protocolo já estiver preenchido (ex: reaproveitado na etapa 2), mantém
  IF NEW.protocolo IS NOT NULL AND NEW.protocolo <> '' THEN
    RETURN NEW;
  END IF;

  v_next_val := nextval('public.seq_protocolo_korbix');
  NEW.protocolo := 'KX-' || LPAD(v_next_val::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Conceder uso da sequence explicitamente para anon e authenticated por redundância
GRANT USAGE, SELECT ON SEQUENCE public.seq_protocolo_korbix TO anon, authenticated;
