-- Migration: Seed initial user pauloac1000@gmail.com and test lead linkage
-- Idempotent check: only creates if auth user does not exist yet

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Se o usuário pauloac1000@gmail.com não existe em auth.users, insere
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'pauloac1000@gmail.com') THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'pauloac1000@gmail.com',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"tipo": "proprietario"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    -- O trigger on_auth_user_created já insere em public.profiles!
    -- Vincula leads existentes automaticamente
    PERFORM public.fn_vincular_lead_por_email(v_user_id, 'pauloac1000@gmail.com');
  ELSE
    -- Se já existia, garante que leads existentes com esse e-mail fiquem vinculados
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'pauloac1000@gmail.com';
    IF v_user_id IS NOT NULL THEN
      PERFORM public.fn_vincular_lead_por_email(v_user_id, 'pauloac1000@gmail.com');
    END IF;
  END IF;
END $$;
