-- Migration: Validações de coerência para motor de compatibilidade e alertas de preço/m²
-- Data: 2026-10-03
-- Idempotente com IF NOT EXISTS, DROP CONSTRAINT/TRIGGER/POLICY IF EXISTS

-- 1. Normalizar e padronizar função utilitária para WhatsApp +55 com DDD e 9 dígitos
CREATE OR REPLACE FUNCTION public.fn_formatar_e_validar_whatsapp(p_tel TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_digitos TEXT;
BEGIN
  IF p_tel IS NULL THEN
    RETURN NULL;
  END IF;

  -- Extrai apenas dígitos
  v_digitos := regexp_replace(p_tel, '\D', '', 'g');

  -- Se começa com 0 (ex: 019998563025), remove o zero inicial
  IF LENGTH(v_digitos) = 12 AND LEFT(v_digitos, 1) = '0' THEN
    v_digitos := SUBSTRING(v_digitos FROM 2);
  END IF;

  -- Se o usuário digitou DDD + número (10 ou 11 dígitos), prefixa com 55
  -- Se forem 10 dígitos (DDD + 8 dígitos), no Brasil números móveis com WhatsApp têm 9 dígitos
  IF LENGTH(v_digitos) = 11 THEN
    v_digitos := '55' || v_digitos;
  ELSIF LENGTH(v_digitos) = 13 AND LEFT(v_digitos, 2) = '55' THEN
    -- Já tem 55 + DDD (2 dígitos) + 9 dígitos = 13 dígitos
    NULL;
  ELSE
    -- Não corresponde a um celular WhatsApp brasileiro com DDD válido
    RETURN NULL;
  END IF;

  -- Validação estrita de formato: 55 + DDD (11 a 99) + 9 + 8 dígitos = 13 dígitos
  IF v_digitos ~ '^55[1-9][0-9]9[0-9]{8}$' THEN
    RETURN '+' || v_digitos;
  END IF;

  RETURN NULL;
END;
$$;

-- 2. Atualizar registros históricos existentes para o formato padronizado +55...
UPDATE public.leads_venda
SET telefone = public.fn_formatar_e_validar_whatsapp(telefone)
WHERE public.fn_formatar_e_validar_whatsapp(telefone) IS NOT NULL;

UPDATE public.leads_investidor
SET telefone = public.fn_formatar_e_validar_whatsapp(telefone)
WHERE public.fn_formatar_e_validar_whatsapp(telefone) IS NOT NULL;

-- 3. Adicionar novas colunas em leads_venda caso não existam
ALTER TABLE public.leads_venda
  ADD COLUMN IF NOT EXISTS preco_pedido NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS preco_minimo NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS area_util NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS area_terreno NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS quartos INTEGER DEFAULT NULL;

-- Se valor_estimado existir e preco_pedido for nulo, sincroniza valor numérico
UPDATE public.leads_venda
SET preco_pedido = public.fn_compat_extrair_valor_numerico(valor_estimado)
WHERE preco_pedido IS NULL AND valor_estimado IS NOT NULL;

-- 4. Tabela de alertas do gestor para revisão de valores
CREATE TABLE IF NOT EXISTS public.alertas_gestor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_venda_id UUID NOT NULL REFERENCES public.leads_venda(id) ON DELETE CASCADE,
  rotulo TEXT NOT NULL DEFAULT 'revisar valor',
  tipo_alerta TEXT NOT NULL DEFAULT 'preco_m2_fora_mediana',
  motivo TEXT NOT NULL,
  detalhes JSONB DEFAULT '{}'::jsonb,
  resolvido BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_alertas_gestor_lead_rotulo UNIQUE (lead_venda_id, rotulo)
);

CREATE INDEX IF NOT EXISTS idx_alertas_gestor_lead_venda ON public.alertas_gestor(lead_venda_id);
CREATE INDEX IF NOT EXISTS idx_alertas_gestor_rotulo ON public.alertas_gestor(rotulo);

ALTER TABLE public.alertas_gestor ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "alertas_gestor_leitura_autenticado" ON public.alertas_gestor;
CREATE POLICY "alertas_gestor_leitura_autenticado" ON public.alertas_gestor
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "alertas_gestor_gestao" ON public.alertas_gestor;
CREATE POLICY "alertas_gestor_gestao" ON public.alertas_gestor
  FOR ALL TO authenticated
  USING (public.fn_is_gestor())
  WITH CHECK (public.fn_is_gestor());

-- 5. Função e trigger para validação de dados incoerentes em leads_venda
CREATE OR REPLACE FUNCTION public.fn_validar_lead_venda()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_tel_norm TEXT;
  v_tipo_norm TEXT;
BEGIN
  -- A. Validação de WhatsApp / Telefone (+55 com DDD e 9 dígitos)
  v_tel_norm := public.fn_formatar_e_validar_whatsapp(NEW.telefone);
  IF v_tel_norm IS NULL THEN
    RAISE EXCEPTION 'O WhatsApp deve estar no formato +55 com DDD de 2 dígitos e 9 dígitos (ex.: +5519998563025).'
      USING ERRCODE = '23514';
  END IF;
  NEW.telefone := v_tel_norm;

  -- Se preco_pedido for nulo mas valor_estimado estiver preenchido, extrai
  IF NEW.preco_pedido IS NULL AND NEW.valor_estimado IS NOT NULL THEN
    NEW.preco_pedido := public.fn_compat_extrair_valor_numerico(NEW.valor_estimado);
  END IF;

  -- B. Validação: preço mínimo (se informado) <= preço pedido (se informado)
  IF NEW.preco_minimo IS NOT NULL AND NEW.preco_pedido IS NOT NULL THEN
    IF NEW.preco_minimo > NEW.preco_pedido THEN
      RAISE EXCEPTION 'O preço mínimo não pode ser maior que o preço pedido.'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  v_tipo_norm := LOWER(TRIM(COALESCE(NEW.tipo_imovel, '')));

  -- C. Validação de Área útil > 0 nos tipos residencial (apartamento, casa) e comercial
  IF v_tipo_norm IN ('apartamento', 'casa', 'comercial') THEN
    IF NEW.area_util IS NOT NULL AND NEW.area_util <= 0 THEN
      RAISE EXCEPTION 'A área útil deve ser maior que zero para imóveis residenciais e comerciais.'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  -- D. Validação de Área do terreno > 0 no tipo terreno
  IF v_tipo_norm = 'terreno' THEN
    IF NEW.area_terreno IS NOT NULL AND NEW.area_terreno <= 0 THEN
      RAISE EXCEPTION 'A área do terreno deve ser maior que zero para o tipo terreno.'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  -- E. Validação de Quartos entre 0 e 10 nos residenciais
  IF v_tipo_norm IN ('apartamento', 'casa') THEN
    IF NEW.quartos IS NOT NULL AND (NEW.quartos < 0 OR NEW.quartos > 10) THEN
      RAISE EXCEPTION 'O número de quartos deve estar entre 0 e 10 nos tipos residenciais.'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_lead_venda ON public.leads_venda;
CREATE TRIGGER trg_validar_lead_venda
  BEFORE INSERT OR UPDATE ON public.leads_venda
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_validar_lead_venda();

-- 6. Função e trigger para validação de dados incoerentes em leads_investidor
CREATE OR REPLACE FUNCTION public.fn_validar_lead_investidor()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_tel_norm TEXT;
BEGIN
  -- A. Validação de WhatsApp / Telefone (+55 com DDD e 9 dígitos)
  v_tel_norm := public.fn_formatar_e_validar_whatsapp(NEW.telefone);
  IF v_tel_norm IS NULL THEN
    RAISE EXCEPTION 'O WhatsApp deve estar no formato +55 com DDD de 2 dígitos e 9 dígitos (ex.: +5519998563025).'
      USING ERRCODE = '23514';
  END IF;
  NEW.telefone := v_tel_norm;

  -- B. Validação: mínimo da faixa de preço < máximo da faixa
  IF NEW.preco_minimo IS NOT NULL AND NEW.preco_maximo IS NOT NULL THEN
    IF NEW.preco_minimo >= NEW.preco_maximo THEN
      RAISE EXCEPTION 'O valor mínimo da faixa deve ser estritamente menor que o valor máximo.'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_lead_investidor ON public.leads_investidor;
CREATE TRIGGER trg_validar_lead_investidor
  BEFORE INSERT OR UPDATE ON public.leads_investidor
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_validar_lead_investidor();

-- 7. Função para verificar e gerar/atualizar alerta de mediana de preço por m²
-- Regra de negócio:
-- Preço por m² = preco_pedido / area_util.
-- Comparado com a mediana dos imóveis do MESMO TIPO na MESMA CIDADE (por codigo_ibge, ou nome de cidade normalizado se codigo_ibge for nulo).
-- A regra só se aplica quando houver ao menos 5 imóveis desse tipo na cidade
-- (contando o próprio imóvel como parte da amostra da cidade).
-- Se ficar fora de +-50% da mediana (< 0.5 * mediana OU > 1.5 * mediana), grava o alerta 'revisar valor' sem bloquear o cadastro.
-- Evita duplicatas com ON CONFLICT (lead_venda_id, rotulo) DO UPDATE.
CREATE OR REPLACE FUNCTION public.fn_checar_alerta_preco_m2_lead_venda()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_preco_pedido NUMERIC;
  v_area_util NUMERIC;
  v_preco_m2 NUMERIC;
  v_tipo TEXT;
  v_ibge TEXT;
  v_cidade_norm TEXT;
  v_total_imoveis INTEGER;
  v_mediana_m2 NUMERIC;
  v_limite_inf NUMERIC;
  v_limite_sup NUMERIC;
  v_motivo TEXT;
BEGIN
  v_preco_pedido := NEW.preco_pedido;
  IF v_preco_pedido IS NULL AND NEW.valor_estimado IS NOT NULL THEN
    v_preco_pedido := public.fn_compat_extrair_valor_numerico(NEW.valor_estimado);
  END IF;

  v_area_util := NEW.area_util;
  v_tipo := LOWER(TRIM(COALESCE(NEW.tipo_imovel, '')));
  v_ibge := NULLIF(TRIM(COALESCE(NEW.codigo_ibge, '')), '');
  v_cidade_norm := public.fn_compat_normalizar_texto(NEW.cidade);

  -- Se não possui preço válido (>0) ou área útil válida (>0), não calcula preço/m²
  IF v_preco_pedido IS NULL OR v_preco_pedido <= 0 OR v_area_util IS NULL OR v_area_util <= 0 THEN
    RETURN NEW;
  END IF;

  v_preco_m2 := ROUND(v_preco_pedido / v_area_util, 2);

  -- Contagem de imóveis do mesmo tipo na mesma cidade que tenham preço e área útil
  IF v_ibge IS NOT NULL THEN
    SELECT
      COUNT(*),
      percentile_cont(0.5) WITHIN GROUP (ORDER BY (COALESCE(preco_pedido, public.fn_compat_extrair_valor_numerico(valor_estimado)) / area_util))
    INTO v_total_imoveis, v_mediana_m2
    FROM public.leads_venda
    WHERE LOWER(TRIM(COALESCE(tipo_imovel, ''))) = v_tipo
      AND codigo_ibge = v_ibge
      AND area_util > 0
      AND (preco_pedido > 0 OR public.fn_compat_extrair_valor_numerico(valor_estimado) > 0);
  ELSE
    SELECT
      COUNT(*),
      percentile_cont(0.5) WITHIN GROUP (ORDER BY (COALESCE(preco_pedido, public.fn_compat_extrair_valor_numerico(valor_estimado)) / area_util))
    INTO v_total_imoveis, v_mediana_m2
    FROM public.leads_venda
    WHERE LOWER(TRIM(COALESCE(tipo_imovel, ''))) = v_tipo
      AND public.fn_compat_normalizar_texto(cidade) = v_cidade_norm
      AND area_util > 0
      AND (preco_pedido > 0 OR public.fn_compat_extrair_valor_numerico(valor_estimado) > 0);
  END IF;

  -- Regra: só se aplica quando existirem ao menos 5 imóveis desse tipo na cidade
  IF v_total_imoveis IS NULL OR v_total_imoveis < 5 OR v_mediana_m2 IS NULL OR v_mediana_m2 <= 0 THEN
    -- Não atinge a amostragem mínima de 5 imóveis: não gera nem mantém alerta desatualizado
    DELETE FROM public.alertas_gestor
    WHERE lead_venda_id = NEW.id AND rotulo = 'revisar valor';
    RETURN NEW;
  END IF;

  v_limite_inf := v_mediana_m2 * 0.50;
  v_limite_sup := v_mediana_m2 * 1.50;

  -- Se estiver fora de +-50% da mediana
  IF v_preco_m2 < v_limite_inf OR v_preco_m2 > v_limite_sup THEN
    v_motivo := FORMAT(
      'Preço por m² (R$ %s/m²) está fora da faixa de 50%% da mediana regional (R$ %s/m² com base em %s imóveis do tipo "%s"). Faixa esperada: R$ %s/m² a R$ %s/m².',
      ROUND(v_preco_m2, 2)::TEXT,
      ROUND(v_mediana_m2, 2)::TEXT,
      v_total_imoveis::TEXT,
      v_tipo,
      ROUND(v_limite_inf, 2)::TEXT,
      ROUND(v_limite_sup, 2)::TEXT
    );

    INSERT INTO public.alertas_gestor (
      lead_venda_id,
      rotulo,
      tipo_alerta,
      motivo,
      detalhes,
      resolvido,
      atualizado_em
    )
    VALUES (
      NEW.id,
      'revisar valor',
      'preco_m2_fora_mediana',
      v_motivo,
      jsonb_build_object(
        'preco_pedido', v_preco_pedido,
        'area_util', v_area_util,
        'preco_m2', v_preco_m2,
        'mediana_m2', ROUND(v_mediana_m2, 2),
        'limite_inferior', ROUND(v_limite_inf, 2),
        'limite_superior', ROUND(v_limite_sup, 2),
        'amostra_imoveis', v_total_imoveis,
        'tipo_imovel', v_tipo
      ),
      FALSE,
      NOW()
    )
    ON CONFLICT (lead_venda_id, rotulo)
    DO UPDATE SET
      motivo = EXCLUDED.motivo,
      detalhes = EXCLUDED.detalhes,
      atualizado_em = NOW();
  ELSE
    -- O valor está dentro da faixa de coerência: remove alerta prévio caso tenha sido corrigido
    DELETE FROM public.alertas_gestor
    WHERE lead_venda_id = NEW.id AND rotulo = 'revisar valor';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_alerta_preco_m2_lead_venda ON public.leads_venda;
CREATE TRIGGER trg_alerta_preco_m2_lead_venda
  AFTER INSERT OR UPDATE OF preco_pedido, valor_estimado, area_util, tipo_imovel, cidade, codigo_ibge
  ON public.leads_venda
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_checar_alerta_preco_m2_lead_venda();

-- 8. Atualizar RPCs de submissão de leads para aceitar os novos campos coerentes

-- 8.1. fn_submit_lead_venda_etapa1
DROP FUNCTION IF EXISTS public.fn_submit_lead_venda_etapa1(
  TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
);
DROP FUNCTION IF EXISTS public.fn_submit_lead_venda_etapa1(
  TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, INTEGER, NUMERIC
);

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
  p_codigo_ibge TEXT DEFAULT NULL,
  p_preco_pedido NUMERIC DEFAULT NULL,
  p_preco_minimo NUMERIC DEFAULT NULL,
  p_area_util NUMERIC DEFAULT NULL,
  p_quartos INTEGER DEFAULT NULL,
  p_area_terreno NUMERIC DEFAULT NULL
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
    preco_pedido,
    preco_minimo,
    area_util,
    quartos,
    area_terreno,
    valor_estimado,
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
    p_preco_pedido,
    p_preco_minimo,
    p_area_util,
    p_quartos,
    p_area_terreno,
    CASE WHEN p_preco_pedido IS NOT NULL THEN p_preco_pedido::TEXT ELSE NULL END,
    'aproximada'
  )
  RETURNING * INTO v_lead;

  RETURN QUERY SELECT v_lead.id, v_lead.protocolo;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_submit_lead_venda_etapa1(
  TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, INTEGER, NUMERIC
) TO anon, authenticated;

-- 8.2. fn_submit_lead_venda_etapa2
DROP FUNCTION IF EXISTS public.fn_submit_lead_venda_etapa2(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
);
DROP FUNCTION IF EXISTS public.fn_submit_lead_venda_etapa2(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, INTEGER, NUMERIC
);

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
  p_codigo_ibge TEXT DEFAULT NULL,
  p_preco_pedido NUMERIC DEFAULT NULL,
  p_preco_minimo NUMERIC DEFAULT NULL,
  p_area_util NUMERIC DEFAULT NULL,
  p_quartos INTEGER DEFAULT NULL,
  p_area_terreno NUMERIC DEFAULT NULL
)
RETURNS TABLE(id UUID, protocolo TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.leads_venda;
  v_ibge TEXT;
  v_num_estimado NUMERIC;
BEGIN
  v_ibge := NULLIF(TRIM(p_codigo_ibge), '');
  IF v_ibge IS NULL AND p_cidade IS NOT NULL AND TRIM(p_cidade) <> '' THEN
    SELECT codigo_ibge INTO v_ibge
    FROM public.municipios_sp
    WHERE nome_normalizado = public.fn_compat_normalizar_texto(p_cidade)
    LIMIT 1;
  END IF;

  v_num_estimado := COALESCE(p_preco_pedido, public.fn_compat_extrair_valor_numerico(p_valor_estimado));

  UPDATE public.leads_venda
  SET
    nome = TRIM(p_nome),
    email = LOWER(TRIM(p_email)),
    motivo_venda = p_motivo_venda,
    prazo_desejado = p_prazo_desejado,
    valor_estimado = COALESCE(NULLIF(TRIM(p_valor_estimado), ''), leads_venda.valor_estimado),
    preco_pedido = COALESCE(v_num_estimado, leads_venda.preco_pedido),
    preco_minimo = COALESCE(p_preco_minimo, leads_venda.preco_minimo),
    area_util = COALESCE(p_area_util, leads_venda.area_util),
    quartos = COALESCE(p_quartos, leads_venda.quartos),
    area_terreno = COALESCE(p_area_terreno, leads_venda.area_terreno),
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
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, INTEGER, NUMERIC
) TO anon, authenticated;

-- 8.3. fn_submit_lead_venda (completo / fallback)
DROP FUNCTION IF EXISTS public.fn_submit_lead_venda(
  TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
);
DROP FUNCTION IF EXISTS public.fn_submit_lead_venda(
  TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, INTEGER, NUMERIC
);

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
  p_codigo_ibge TEXT DEFAULT NULL,
  p_preco_pedido NUMERIC DEFAULT NULL,
  p_preco_minimo NUMERIC DEFAULT NULL,
  p_area_util NUMERIC DEFAULT NULL,
  p_quartos INTEGER DEFAULT NULL,
  p_area_terreno NUMERIC DEFAULT NULL
)
RETURNS TABLE(id UUID, protocolo TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.leads_venda;
  v_ibge TEXT;
  v_num_estimado NUMERIC;
BEGIN
  v_ibge := NULLIF(TRIM(p_codigo_ibge), '');
  IF v_ibge IS NULL AND p_cidade IS NOT NULL AND TRIM(p_cidade) <> '' THEN
    SELECT codigo_ibge INTO v_ibge
    FROM public.municipios_sp
    WHERE nome_normalizado = public.fn_compat_normalizar_texto(p_cidade)
    LIMIT 1;
  END IF;

  v_num_estimado := COALESCE(p_preco_pedido, public.fn_compat_extrair_valor_numerico(p_valor_estimado));

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
      preco_pedido = COALESCE(v_num_estimado, leads_venda.preco_pedido),
      preco_minimo = COALESCE(p_preco_minimo, leads_venda.preco_minimo),
      area_util = COALESCE(p_area_util, leads_venda.area_util),
      quartos = COALESCE(p_quartos, leads_venda.quartos),
      area_terreno = COALESCE(p_area_terreno, leads_venda.area_terreno),
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
      preco_pedido,
      preco_minimo,
      area_util,
      quartos,
      area_terreno,
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
      v_num_estimado,
      p_preco_minimo,
      p_area_util,
      p_quartos,
      p_area_terreno,
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
  TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, INTEGER, NUMERIC
) TO anon, authenticated;

-- 8.4. Atualizar fn_gestor_listar_leads para incluir coluna alerta_valor
DROP FUNCTION IF EXISTS public.fn_gestor_listar_leads();
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
  criado_em TIMESTAMPTZ,
  alerta_valor TEXT,
  alerta_motivo TEXT,
  preco_pedido NUMERIC,
  area_util NUMERIC,
  area_terreno NUMERIC,
  quartos INTEGER
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
    lv.criado_em,
    ag.rotulo AS alerta_valor,
    ag.motivo AS alerta_motivo,
    lv.preco_pedido,
    lv.area_util,
    lv.area_terreno,
    lv.quartos
  FROM public.leads_venda lv
  LEFT JOIN public.alertas_gestor ag ON ag.lead_venda_id = lv.id AND ag.rotulo = 'revisar valor'

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
    li.criado_em,
    NULL::TEXT AS alerta_valor,
    NULL::TEXT AS alerta_motivo,
    li.preco_minimo AS preco_pedido,
    li.min_area_m2 AS area_util,
    li.min_area_terreno_m2 AS area_terreno,
    li.min_quartos AS quartos
  FROM public.leads_investidor li

  ORDER BY criado_em DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_gestor_listar_leads() TO authenticated;
