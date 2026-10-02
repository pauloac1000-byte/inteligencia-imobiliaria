-- Migration: Criar tabela diferenciais, popular os 15 itens exatos e estender leads_venda, leads_investidor e as RPCs SECURITY DEFINER
-- Data/Versão: 20261002193000_create_diferenciais_and_extend_rpcs.sql

-- 1. Criar tabela diferenciais
CREATE TABLE IF NOT EXISTS public.diferenciais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  grupo TEXT NOT NULL,
  tipos TEXT[] NOT NULL DEFAULT '{}',
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS na tabela diferenciais
ALTER TABLE public.diferenciais ENABLE ROW LEVEL SECURITY;

-- Visitantes e usuários autenticados podem ler diferenciais ativos
DROP POLICY IF EXISTS "diferenciais_select_all" ON public.diferenciais;
CREATE POLICY "diferenciais_select_all" ON public.diferenciais
  FOR SELECT TO anon, authenticated
  USING (ativo = true);

-- Inserir / Atualizar os 15 itens exatos solicitados
-- 1. Área externa (todos residencial: casa, apartamento)
--    PISCINA | Piscina privativa
--    GOURMET | Área gourmet com churrasqueira
--    QUINTAL | Quintal ou jardim privativo
--    EDICULA | Edícula
-- 2. Condomínio:
--    PORTARIA | Portaria 24h (residencial e comercial)
--    LAZER_COND | Lazer no condomínio (residencial)
--    ELEVADOR | Elevador (residencial e comercial)
--    PET | Aceita animais (residencial)
-- 3. Uso e conforto:
--    VAGA_COBERTA | Vaga coberta (residencial e comercial)
--    TERREO | Térreo ou sem escadas (residencial e comercial)
--    ESCRITORIO | Escritório (residencial)
--    PLANEJADOS | Armários planejados (residencial e comercial)
-- 4. Custo e renda (residencial e comercial):
--    SOLAR | Energia solar fotovoltaica
--    MOBILIADO | Mobiliado
--    MEDICAO_IND | Medição individual de água e gás

INSERT INTO public.diferenciais (codigo, nome, grupo, tipos, ativo, ordem) VALUES
  ('PISCINA', 'Piscina privativa', 'Área externa', ARRAY['residencial'], true, 1),
  ('GOURMET', 'Área gourmet com churrasqueira', 'Área externa', ARRAY['residencial'], true, 2),
  ('QUINTAL', 'Quintal ou jardim privativo', 'Área externa', ARRAY['residencial'], true, 3),
  ('EDICULA', 'Edícula', 'Área externa', ARRAY['residencial'], true, 4),
  ('PORTARIA', 'Portaria 24h', 'Condomínio', ARRAY['residencial', 'comercial'], true, 5),
  ('LAZER_COND', 'Lazer no condomínio', 'Condomínio', ARRAY['residencial'], true, 6),
  ('ELEVADOR', 'Elevador', 'Condomínio', ARRAY['residencial', 'comercial'], true, 7),
  ('PET', 'Aceita animais', 'Condomínio', ARRAY['residencial'], true, 8),
  ('VAGA_COBERTA', 'Vaga coberta', 'Uso e conforto', ARRAY['residencial', 'comercial'], true, 9),
  ('TERREO', 'Térreo ou sem escadas', 'Uso e conforto', ARRAY['residencial', 'comercial'], true, 10),
  ('ESCRITORIO', 'Escritório', 'Uso e conforto', ARRAY['residencial'], true, 11),
  ('PLANEJADOS', 'Armários planejados', 'Uso e conforto', ARRAY['residencial', 'comercial'], true, 12),
  ('SOLAR', 'Energia solar fotovoltaica', 'Custo e renda', ARRAY['residencial', 'comercial'], true, 13),
  ('MOBILIADO', 'Mobiliado', 'Custo e renda', ARRAY['residencial', 'comercial'], true, 14),
  ('MEDICAO_IND', 'Medição individual de água e gás', 'Custo e renda', ARRAY['residencial', 'comercial'], true, 15)
ON CONFLICT (codigo) DO UPDATE SET
  nome = EXCLUDED.nome,
  grupo = EXCLUDED.grupo,
  tipos = EXCLUDED.tipos,
  ativo = EXCLUDED.ativo,
  ordem = EXCLUDED.ordem;

-- 2. Adicionar coluna diferenciais JSONB em leads_venda e leads_investidor
ALTER TABLE public.leads_venda
  ADD COLUMN IF NOT EXISTS diferenciais JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.leads_investidor
  ADD COLUMN IF NOT EXISTS tipos_imovel TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS diferenciais JSONB DEFAULT '{}'::jsonb;

-- 3. Dropar assinaturas existentes de RPCs que serão recriadas para evitar overloads duplicados
DROP FUNCTION IF EXISTS public.fn_submit_lead_venda_etapa1(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.fn_submit_lead_venda_etapa1(TEXT, TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.fn_submit_lead_venda_etapa2(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.fn_submit_lead_venda_etapa2(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.fn_submit_lead_venda(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.fn_submit_lead_venda(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.fn_submit_lead_investidor(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS public.fn_submit_lead_investidor(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, JSONB, TEXT[]);
DROP FUNCTION IF EXISTS public.fn_submit_lead_simulador_investidor(TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, NUMERIC, TEXT, NUMERIC, NUMERIC, TEXT);
DROP FUNCTION IF EXISTS public.fn_submit_lead_simulador_investidor(TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, NUMERIC, TEXT, NUMERIC, NUMERIC, TEXT, JSONB);

-- 4. Recriar fn_submit_lead_venda_etapa1 com p_diferenciais JSONB DEFAULT '[]'::jsonb
CREATE OR REPLACE FUNCTION public.fn_submit_lead_venda_etapa1(
  p_cidade TEXT,
  p_tipo_imovel TEXT,
  p_telefone TEXT,
  p_rota TEXT DEFAULT 'proprietario',
  p_diferenciais JSONB DEFAULT '[]'::jsonb
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
    rota,
    diferenciais
  )
  VALUES (
    TRIM(p_cidade),
    p_tipo_imovel,
    TRIM(p_telefone),
    COALESCE(p_rota, 'proprietario'),
    COALESCE(p_diferenciais, '[]'::jsonb)
  )
  RETURNING * INTO v_lead;

  RETURN QUERY SELECT v_lead.id, v_lead.protocolo;
END;
$$;

-- 5. Recriar fn_submit_lead_venda_etapa2 com p_diferenciais JSONB DEFAULT NULL
CREATE OR REPLACE FUNCTION public.fn_submit_lead_venda_etapa2(
  p_id UUID,
  p_nome TEXT,
  p_email TEXT,
  p_motivo_venda TEXT,
  p_prazo_desejado TEXT,
  p_valor_estimado TEXT DEFAULT NULL,
  p_mensagem TEXT DEFAULT NULL,
  p_diferenciais JSONB DEFAULT NULL
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
    mensagem = NULLIF(TRIM(p_mensagem), ''),
    diferenciais = COALESCE(p_diferenciais, leads_venda.diferenciais)
  WHERE public.leads_venda.id = p_id
  RETURNING * INTO v_lead;

  IF v_lead.id IS NULL THEN
    RAISE EXCEPTION 'Lead de venda com ID % não encontrado.', p_id;
  END IF;

  RETURN QUERY SELECT v_lead.id, v_lead.protocolo;
END;
$$;

-- 6. Recriar fn_submit_lead_venda (fallback / completo) com p_diferenciais JSONB DEFAULT NULL
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
  p_mensagem TEXT DEFAULT NULL,
  p_diferenciais JSONB DEFAULT NULL
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
      mensagem = COALESCE(NULLIF(TRIM(p_mensagem), ''), leads_venda.mensagem),
      diferenciais = COALESCE(p_diferenciais, leads_venda.diferenciais)
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
      diferenciais
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
      COALESCE(p_diferenciais, '[]'::jsonb)
    )
    RETURNING * INTO v_lead;
  END IF;

  RETURN QUERY SELECT v_lead.id, v_lead.protocolo;
END;
$$;

-- 7. Recriar fn_submit_lead_investidor com p_diferenciais JSONB e p_tipos_imovel TEXT[]
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
  p_user_id UUID DEFAULT NULL,
  p_diferenciais JSONB DEFAULT '{}'::jsonb,
  p_tipos_imovel TEXT[] DEFAULT '{}'::text[]
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
    user_id,
    diferenciais,
    tipos_imovel
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
    v_final_user_id,
    COALESCE(p_diferenciais, '{}'::jsonb),
    COALESCE(p_tipos_imovel, '{}'::text[])
  )
  RETURNING * INTO v_lead;

  RETURN QUERY SELECT v_lead.id, v_lead.protocolo;
END;
$$;

-- 8. Recriar fn_submit_lead_simulador_investidor com p_diferenciais JSONB DEFAULT '{}'::jsonb
CREATE OR REPLACE FUNCTION public.fn_submit_lead_simulador_investidor(
  p_cidade TEXT,
  p_telefone TEXT,
  p_sim_valor_compra TEXT,
  p_sim_custo_reforma TEXT DEFAULT NULL,
  p_sim_aluguel_mensal TEXT DEFAULT NULL,
  p_sim_prazo_revenda_meses INTEGER DEFAULT NULL,
  p_sim_valorizacao_anual NUMERIC DEFAULT NULL,
  p_sim_capital_investido TEXT DEFAULT NULL,
  p_sim_rentabilidade_mensal NUMERIC DEFAULT NULL,
  p_sim_retorno_total NUMERIC DEFAULT NULL,
  p_rota TEXT DEFAULT 'investidor',
  p_diferenciais JSONB DEFAULT '{}'::jsonb
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
    cidades_interesse,
    telefone,
    rota,
    sim_valor_compra,
    sim_custo_reforma,
    sim_aluguel_mensal,
    sim_prazo_revenda_meses,
    sim_valorizacao_anual,
    sim_capital_investido,
    sim_rentabilidade_mensal,
    sim_retorno_total,
    diferenciais
  )
  VALUES (
    TRIM(p_cidade),
    TRIM(p_telefone),
    COALESCE(p_rota, 'investidor'),
    NULLIF(TRIM(p_sim_valor_compra), ''),
    NULLIF(TRIM(p_sim_custo_reforma), ''),
    NULLIF(TRIM(p_sim_aluguel_mensal), ''),
    p_sim_prazo_revenda_meses,
    p_sim_valorizacao_anual,
    NULLIF(TRIM(p_sim_capital_investido), ''),
    p_sim_rentabilidade_mensal,
    p_sim_retorno_total,
    COALESCE(p_diferenciais, '{}'::jsonb)
  )
  RETURNING * INTO v_lead;

  RETURN QUERY SELECT v_lead.id, v_lead.protocolo;
END;
$$;

-- 9. Conceder permissão de execução aos papéis anon e authenticated
GRANT EXECUTE ON FUNCTION public.fn_submit_lead_venda_etapa1(TEXT, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_submit_lead_venda_etapa2(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_submit_lead_venda(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_submit_lead_investidor(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, JSONB, TEXT[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_submit_lead_simulador_investidor(TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, NUMERIC, TEXT, NUMERIC, NUMERIC, TEXT, JSONB) TO anon, authenticated;
