-- Migration: Criação da tabela de rastreamento de eventos do funil de conversão
-- Sem dados pessoais, com identificador de sessão anônimo e rota.

CREATE TABLE IF NOT EXISTS public.eventos_funil (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tipo_evento TEXT NOT NULL,
  rota TEXT NOT NULL,
  sessao_id TEXT NOT NULL,
  detalhe JSONB
);

-- Índices para otimização de consultas do gestor / agregadores de funil
CREATE INDEX IF NOT EXISTS idx_eventos_funil_criado_em ON public.eventos_funil (criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_eventos_funil_tipo ON public.eventos_funil (tipo_evento);
CREATE INDEX IF NOT EXISTS idx_eventos_funil_sessao ON public.eventos_funil (sessao_id);
CREATE INDEX IF NOT EXISTS idx_eventos_funil_rota ON public.eventos_funil (rota);

-- Habilitar RLS
ALTER TABLE public.eventos_funil ENABLE ROW LEVEL SECURITY;

-- Permissões de INSERT para anon e authenticated (visitantes disparam eventos de telemetria)
DROP POLICY IF EXISTS "eventos_funil_anon_insert" ON public.eventos_funil;
CREATE POLICY "eventos_funil_anon_insert" ON public.eventos_funil
  FOR INSERT TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "eventos_funil_auth_insert" ON public.eventos_funil;
CREATE POLICY "eventos_funil_auth_insert" ON public.eventos_funil
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Permissão de SELECT restrita a gestores (via função SECURITY DEFINER existente fn_is_gestor)
DROP POLICY IF EXISTS "eventos_funil_gestor_select" ON public.eventos_funil;
CREATE POLICY "eventos_funil_gestor_select" ON public.eventos_funil
  FOR SELECT TO authenticated
  USING (public.fn_is_gestor());

-- Grants explícitos de segurança
GRANT INSERT ON public.eventos_funil TO anon;
GRANT INSERT ON public.eventos_funil TO authenticated;
GRANT SELECT ON public.eventos_funil TO authenticated;
