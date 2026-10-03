-- ==============================================================================
-- Migration: 20261003113000_padronizar_geografia_postgis_e_enderecos.sql
-- Objetivo:
--  1. Habilitar a extensão postgis (se não estiver habilitada)
--  2. Adicionar campos de padronização de endereço e PostGIS em leads_venda:
--     - cep TEXT
--     - logradouro TEXT
--     - numero TEXT
--     - complemento TEXT
--     - bairro TEXT
--     - codigo_ibge TEXT
--     - localizacao geography(Point, 4326)
--     - latitude NUMERIC
--     - longitude NUMERIC
--     - precisao_localizacao TEXT ('exata', 'aproximada')
--     - geocodificado_em TIMESTAMPTZ
--  3. Adicionar campos de georreferenciamento do ponto de referência em leads_investidor:
--     - cep_referencia TEXT
--     - logradouro_referencia TEXT
--     - bairro_referencia TEXT
--     - codigo_ibge_referencia TEXT
--     - localizacao_referencia geography(Point, 4326)
--     - latitude_referencia NUMERIC
--     - longitude_referencia NUMERIC
--     - precisao_localizacao TEXT ('exata', 'aproximada')
--     - geocodificado_em TIMESTAMPTZ
--  4. Criar índices GiST nas colunas geography e índices B-Tree nos códigos IBGE e CEPs
--  5. Atualizar as RPCs SECURITY DEFINER com GRANT EXECUTE para anon e authenticated
-- ==============================================================================

-- 1. Habilitar extensão PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Colunas em public.leads_venda
ALTER TABLE public.leads_venda
  ADD COLUMN IF NOT EXISTS cep TEXT,
  ADD COLUMN IF NOT EXISTS logradouro TEXT,
  ADD COLUMN IF NOT EXISTS numero TEXT,
  ADD COLUMN IF NOT EXISTS complemento TEXT,
  ADD COLUMN IF NOT EXISTS bairro TEXT,
  ADD COLUMN IF NOT EXISTS codigo_ibge TEXT,
  ADD COLUMN IF NOT EXISTS localizacao geography(Point, 4326),
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS precisao_localizacao TEXT,
  ADD COLUMN IF NOT EXISTS geocodificado_em TIMESTAMPTZ;

-- 3. Colunas em public.leads_investidor
ALTER TABLE public.leads_investidor
  ADD COLUMN IF NOT EXISTS cep_referencia TEXT,
  ADD COLUMN IF NOT EXISTS logradouro_referencia TEXT,
  ADD COLUMN IF NOT EXISTS bairro_referencia TEXT,
  ADD COLUMN IF NOT EXISTS codigo_ibge_referencia TEXT,
  ADD COLUMN IF NOT EXISTS localizacao_referencia geography(Point, 4326),
  ADD COLUMN IF NOT EXISTS latitude_referencia NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude_referencia NUMERIC,
  ADD COLUMN IF NOT EXISTS precisao_localizacao TEXT,
  ADD COLUMN IF NOT EXISTS geocodificado_em TIMESTAMPTZ;

-- 4. Índices GiST e auxiliares
CREATE INDEX IF NOT EXISTS idx_leads_venda_localizacao_gist
  ON public.leads_venda USING gist (localizacao);

CREATE INDEX IF NOT EXISTS idx_leads_venda_codigo_ibge
  ON public.leads_venda (codigo_ibge);

CREATE INDEX IF NOT EXISTS idx_leads_venda_cep
  ON public.leads_venda (cep);

CREATE INDEX IF NOT EXISTS idx_leads_investidor_localizacao_ref_gist
  ON public.leads_investidor USING gist (localizacao_referencia);

CREATE INDEX IF NOT EXISTS idx_leads_investidor_codigo_ibge_ref
  ON public.leads_investidor (codigo_ibge_referencia);

-- 5. Atualizar / Sobrescrever fn_submit_lead_venda_etapa1
-- Aceita opcionalmente cep, logradouro, numero, complemento, bairro, codigo_ibge
DROP FUNCTION IF EXISTS public.fn_submit_lead_venda_etapa1(TEXT, TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.fn_submit_lead_venda_etapa1(TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.fn_submit_lead_venda_etapa1(
  p_cidade TEXT,
  p_tipo_imovel TEXT,
  p_telefone TEXT,
  p_rota TEXT DEFAULT 'proprietario'::TEXT,
  p_diferenciais JSONB DEFAULT '[]'::jsonb,
  p_cep TEXT DEFAULT NULL,
  p_logradouro TEXT DEFAULT NULL,
  p_numero TEXT DEFAULT NULL,
  p_complemento TEXT DEFAULT NULL,
  p_bairro TEXT DEFAULT NULL,
  p_codigo_ibge TEXT DEFAULT NULL
)
RETURNS TABLE(id UUID, protocolo TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.leads_venda;
  v_ibge TEXT;
BEGIN
  v_ibge := NULLIF(TRIM(p_codigo_ibge), '');
  IF v_ibge IS NULL AND p_cidade IS NOT NULL AND TRIM(p_cidade) <> '' THEN
    SELECT codigo_ibge INTO v_ibge
    FROM public.municipios_sp
    WHERE nome_normalizado = public.fn_compat_normalizar_texto(p_cidade)
    LIMIT 1;
  END IF;

  INSERT INTO public.leads_venda (
    cidade,
    tipo_imovel,
    telefone,
    rota,
    diferenciais,
    cep,
    logradouro,
    numero,
    complemento,
    bairro,
    codigo_ibge,
    precisao_localizacao
  )
  VALUES (
    TRIM(p_cidade),
    p_tipo_imovel,
    TRIM(p_telefone),
    COALESCE(p_rota, 'proprietario'),
    COALESCE(p_diferenciais, '[]'::jsonb),
    NULLIF(TRIM(p_cep), ''),
    NULLIF(TRIM(p_logradouro), ''),
    NULLIF(TRIM(p_numero), ''),
    NULLIF(TRIM(p_complemento), ''),
    NULLIF(TRIM(p_bairro), ''),
    v_ibge,
    'aproximada'
  )
  RETURNING * INTO v_lead;

  RETURN QUERY SELECT v_lead.id, v_lead.protocolo;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_submit_lead_venda_etapa1(
  TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO anon, authenticated;

-- 6. Atualizar / Sobrescrever fn_submit_lead_venda_etapa2
DROP FUNCTION IF EXISTS public.fn_submit_lead_venda_etapa2(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.fn_submit_lead_venda_etapa2(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.fn_submit_lead_venda_etapa2(
  p_id UUID,
  p_nome TEXT,
  p_email TEXT,
  p_motivo_venda TEXT,
  p_prazo_desejado TEXT,
  p_valor_estimado TEXT DEFAULT NULL,
  p_mensagem TEXT DEFAULT NULL,
  p_diferenciais JSONB DEFAULT NULL,
  p_cep TEXT DEFAULT NULL,
  p_logradouro TEXT DEFAULT NULL,
  p_numero TEXT DEFAULT NULL,
  p_complemento TEXT DEFAULT NULL,
  p_bairro TEXT DEFAULT NULL,
  p_cidade TEXT DEFAULT NULL,
  p_codigo_ibge TEXT DEFAULT NULL
)
RETURNS TABLE(id UUID, protocolo TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.leads_venda;
  v_ibge TEXT;
BEGIN
  v_ibge := NULLIF(TRIM(p_codigo_ibge), '');
  IF v_ibge IS NULL AND p_cidade IS NOT NULL AND TRIM(p_cidade) <> '' THEN
    SELECT codigo_ibge INTO v_ibge
    FROM public.municipios_sp
    WHERE nome_normalizado = public.fn_compat_normalizar_texto(p_cidade)
    LIMIT 1;
  END IF;

  UPDATE public.leads_venda
  SET
    nome = TRIM(p_nome),
    email = LOWER(TRIM(p_email)),
    motivo_venda = p_motivo_venda,
    prazo_desejado = p_prazo_desejado,
    valor_estimado = NULLIF(TRIM(p_valor_estimado), ''),
    mensagem = NULLIF(TRIM(p_mensagem), ''),
    diferenciais = COALESCE(p_diferenciais, leads_venda.diferenciais),
    cep = COALESCE(NULLIF(TRIM(p_cep), ''), leads_venda.cep),
    logradouro = COALESCE(NULLIF(TRIM(p_logradouro), ''), leads_venda.logradouro),
    numero = COALESCE(NULLIF(TRIM(p_numero), ''), leads_venda.numero),
    complemento = COALESCE(NULLIF(TRIM(p_complemento), ''), leads_venda.complemento),
    bairro = COALESCE(NULLIF(TRIM(p_bairro), ''), leads_venda.bairro),
    cidade = COALESCE(NULLIF(TRIM(p_cidade), ''), leads_venda.cidade),
    codigo_ibge = COALESCE(v_ibge, leads_venda.codigo_ibge)
  WHERE public.leads_venda.id = p_id
  RETURNING * INTO v_lead;

  IF v_lead.id IS NULL THEN
    RAISE EXCEPTION 'Lead de venda com ID % não encontrado.', p_id;
  END IF;

  RETURN QUERY SELECT v_lead.id, v_lead.protocolo;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_submit_lead_venda_etapa2(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO anon, authenticated;

-- 7. Atualizar / Sobrescrever fn_submit_lead_venda (submissão direta/completa)
DROP FUNCTION IF EXISTS public.fn_submit_lead_venda(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.fn_submit_lead_venda(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.fn_submit_lead_venda(
  p_telefone TEXT,
  p_tipo_imovel TEXT,
  p_cidade TEXT,
  p_rota TEXT DEFAULT 'proprietario'::TEXT,
  p_id UUID DEFAULT NULL,
  p_nome TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_valor_estimado TEXT DEFAULT NULL,
  p_motivo_venda TEXT DEFAULT NULL,
  p_prazo_desejado TEXT DEFAULT NULL,
  p_mensagem TEXT DEFAULT NULL,
  p_diferenciais JSONB DEFAULT NULL,
  p_cep TEXT DEFAULT NULL,
  p_logradouro TEXT DEFAULT NULL,
  p_numero TEXT DEFAULT NULL,
  p_complemento TEXT DEFAULT NULL,
  p_bairro TEXT DEFAULT NULL,
  p_codigo_ibge TEXT DEFAULT NULL
)
RETURNS TABLE(id UUID, protocolo TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.leads_venda;
  v_ibge TEXT;
BEGIN
  v_ibge := NULLIF(TRIM(p_codigo_ibge), '');
  IF v_ibge IS NULL AND p_cidade IS NOT NULL AND TRIM(p_cidade) <> '' THEN
    SELECT codigo_ibge INTO v_ibge
    FROM public.municipios_sp
    WHERE nome_normalizado = public.fn_compat_normalizar_texto(p_cidade)
    LIMIT 1;
  END IF;

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
      mensagem = COALESCE(NULLIF(TRIM(p_mensagem), ''), leads_venda.mensagem),
      diferenciais = COALESCE(p_diferenciais, leads_venda.diferenciais),
      cep = COALESCE(NULLIF(TRIM(p_cep), ''), leads_venda.cep),
      logradouro = COALESCE(NULLIF(TRIM(p_logradouro), ''), leads_venda.logradouro),
      numero = COALESCE(NULLIF(TRIM(p_numero), ''), leads_venda.numero),
      complemento = COALESCE(NULLIF(TRIM(p_complemento), ''), leads_venda.complemento),
      bairro = COALESCE(NULLIF(TRIM(p_bairro), ''), leads_venda.bairro),
      codigo_ibge = COALESCE(v_ibge, leads_venda.codigo_ibge)
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
      mensagem,
      diferenciais,
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      codigo_ibge,
      precisao_localizacao
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
      NULLIF(TRIM(p_mensagem), ''),
      COALESCE(p_diferenciais, '[]'::jsonb),
      NULLIF(TRIM(p_cep), ''),
      NULLIF(TRIM(p_logradouro), ''),
      NULLIF(TRIM(p_numero), ''),
      NULLIF(TRIM(p_complemento), ''),
      NULLIF(TRIM(p_bairro), ''),
      v_ibge,
      'aproximada'
    )
    RETURNING * INTO v_lead;
  END IF;

  RETURN QUERY SELECT v_lead.id, v_lead.protocolo;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_submit_lead_venda(
  TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO anon, authenticated;

-- 8. Atualizar / Sobrescrever fn_submit_lead_investidor com parâmetros de georreferenciamento do ponto de referência
DROP FUNCTION IF EXISTS public.fn_submit_lead_investidor(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, JSONB, TEXT[],
  TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, INTEGER, INTEGER, NUMERIC, TEXT, BOOLEAN, BOOLEAN, TEXT, NUMERIC, TEXT[], TEXT[], TEXT, INTEGER, TEXT
);
DROP FUNCTION IF EXISTS public.fn_submit_lead_investidor(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, JSONB, TEXT[],
  TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, INTEGER, INTEGER, NUMERIC, TEXT, BOOLEAN, BOOLEAN, TEXT, NUMERIC, TEXT[], TEXT[], TEXT, INTEGER, TEXT,
  TEXT, TEXT, TEXT, TEXT
);

CREATE OR REPLACE FUNCTION public.fn_submit_lead_investidor(
  p_telefone TEXT,
  p_ticket TEXT,
  p_objetivo TEXT,
  p_cidades_interesse TEXT,
  p_prazo_decisao TEXT,
  p_rota TEXT DEFAULT 'investidor'::TEXT,
  p_nome TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_perfil TEXT DEFAULT NULL,
  p_faixa_valor TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_diferenciais JSONB DEFAULT '{}'::jsonb,
  p_tipos_imovel TEXT[] DEFAULT '{}'::TEXT[],
  p_finalidade TEXT DEFAULT 'renda_aluguel'::TEXT,
  p_preco_minimo NUMERIC DEFAULT NULL,
  p_preco_maximo NUMERIC DEFAULT NULL,
  p_preco_teto_absoluto NUMERIC DEFAULT NULL,
  p_min_area_m2 NUMERIC DEFAULT NULL,
  p_min_quartos INTEGER DEFAULT NULL,
  p_min_vagas INTEGER DEFAULT NULL,
  p_min_area_terreno_m2 NUMERIC DEFAULT NULL,
  p_forma_pagamento TEXT DEFAULT NULL,
  p_usa_fgts BOOLEAN DEFAULT FALSE,
  p_aceita_reforma BOOLEAN DEFAULT TRUE,
  p_prazo_mudanca TEXT DEFAULT NULL,
  p_yield_minimo_mensal NUMERIC DEFAULT NULL,
  p_cidades_codigos_ibge TEXT[] DEFAULT '{}'::TEXT[],
  p_atalhos_regiao TEXT[] DEFAULT '{}'::TEXT[],
  p_bairros_preferidos TEXT DEFAULT NULL,
  p_raio_km INTEGER DEFAULT NULL,
  p_ponto_referencia TEXT DEFAULT NULL,
  p_cep_referencia TEXT DEFAULT NULL,
  p_logradouro_referencia TEXT DEFAULT NULL,
  p_bairro_referencia TEXT DEFAULT NULL,
  p_codigo_ibge_referencia TEXT DEFAULT NULL
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
  v_finalidade_normalizada TEXT;
BEGIN
  v_final_user_id := COALESCE(auth.uid(), p_user_id);
  v_finalidade_normalizada := COALESCE(NULLIF(TRIM(p_finalidade), ''), 'renda_aluguel');

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
    user_id,
    diferenciais,
    tipos_imovel,
    finalidade,
    preco_minimo,
    preco_maximo,
    preco_teto_absoluto,
    min_area_m2,
    min_quartos,
    min_vagas,
    min_area_terreno_m2,
    forma_pagamento,
    usa_fgts,
    aceita_reforma,
    prazo_mudanca,
    yield_minimo_mensal,
    cidades_codigos_ibge,
    atalhos_regiao,
    bairros_preferidos,
    raio_km,
    ponto_referencia,
    cep_referencia,
    logradouro_referencia,
    bairro_referencia,
    codigo_ibge_referencia,
    precisao_localizacao
  )
  VALUES (
    TRIM(p_telefone),
    p_ticket,
    COALESCE(p_objetivo, v_finalidade_normalizada),
    TRIM(p_cidades_interesse),
    p_prazo_decisao,
    COALESCE(p_rota, 'investidor'),
    NULLIF(TRIM(p_nome), ''),
    NULLIF(LOWER(TRIM(p_email)), ''),
    NULLIF(TRIM(p_perfil), ''),
    NULLIF(TRIM(p_faixa_valor), ''),
    v_final_user_id,
    COALESCE(p_diferenciais, '{}'::jsonb),
    COALESCE(p_tipos_imovel, '{}'::TEXT[]),
    v_finalidade_normalizada,
    p_preco_minimo,
    p_preco_maximo,
    p_preco_teto_absoluto,
    p_min_area_m2,
    p_min_quartos,
    p_min_vagas,
    p_min_area_terreno_m2,
    NULLIF(TRIM(p_forma_pagamento), ''),
    COALESCE(p_usa_fgts, FALSE),
    COALESCE(p_aceita_reforma, TRUE),
    NULLIF(TRIM(p_prazo_mudanca), ''),
    p_yield_minimo_mensal,
    COALESCE(p_cidades_codigos_ibge, '{}'::TEXT[]),
    COALESCE(p_atalhos_regiao, '{}'::TEXT[]),
    NULLIF(TRIM(p_bairros_preferidos), ''),
    p_raio_km,
    NULLIF(TRIM(p_ponto_referencia), ''),
    NULLIF(TRIM(p_cep_referencia), ''),
    NULLIF(TRIM(p_logradouro_referencia), ''),
    NULLIF(TRIM(p_bairro_referencia), ''),
    NULLIF(TRIM(p_codigo_ibge_referencia), ''),
    'aproximada'
  )
  RETURNING * INTO v_lead;

  RETURN QUERY SELECT v_lead.id, v_lead.protocolo;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_submit_lead_investidor(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, JSONB, TEXT[],
  TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, INTEGER, INTEGER, NUMERIC, TEXT, BOOLEAN, BOOLEAN, TEXT, NUMERIC, TEXT[], TEXT[], TEXT, INTEGER, TEXT,
  TEXT, TEXT, TEXT, TEXT
) TO anon, authenticated;

-- 9. Função utilitária no banco para atualizar coordenadas / geography com precisão
-- Pode ser chamada com segurança via service_role ou por edge functions / triggers
CREATE OR REPLACE FUNCTION public.fn_atualizar_coordenadas_lead(
  p_tabela TEXT,
  p_id UUID,
  p_latitude NUMERIC,
  p_longitude NUMERIC,
  p_precisao TEXT DEFAULT 'aproximada'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_point geography(Point, 4326);
BEGIN
  IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
    v_point := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography;
  ELSE
    v_point := NULL;
  END IF;

  IF p_tabela = 'leads_venda' THEN
    UPDATE public.leads_venda
    SET
      latitude = p_latitude,
      longitude = p_longitude,
      localizacao = v_point,
      precisao_localizacao = COALESCE(p_precisao, 'aproximada'),
      geocodificado_em = NOW()
    WHERE id = p_id;
    RETURN TRUE;
  ELSIF p_tabela = 'leads_investidor' THEN
    UPDATE public.leads_investidor
    SET
      latitude_referencia = p_latitude,
      longitude_referencia = p_longitude,
      localizacao_referencia = v_point,
      precisao_localizacao = COALESCE(p_precisao, 'aproximada'),
      geocodificado_em = NOW()
    WHERE id = p_id;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_atualizar_coordenadas_lead(
  TEXT, UUID, NUMERIC, NUMERIC, TEXT
) TO authenticated, service_role;
