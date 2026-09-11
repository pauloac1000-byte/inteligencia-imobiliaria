-- Migration para tabelas de captura de leads: leads_venda e leads_investidor
-- Idempotente com IF NOT EXISTS e DROP POLICY IF EXISTS

-- 1. Tabela leads_venda
CREATE TABLE IF NOT EXISTS public.leads_venda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT NOT NULL,
  tipo_imovel TEXT NOT NULL, -- casa, apartamento, terreno, comercial
  cidade TEXT NOT NULL,
  valor_estimado TEXT,
  mensagem TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ativar RLS para leads_venda
ALTER TABLE public.leads_venda ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para leads_venda:
-- Permite insert anônimo ou autenticado de novos leads
DROP POLICY IF EXISTS "leads_venda_anon_insert" ON public.leads_venda;
CREATE POLICY "leads_venda_anon_insert" ON public.leads_venda
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Permite leitura apenas para administradores/autenticados com role adequado (ou authenticated)
DROP POLICY IF EXISTS "leads_venda_auth_select" ON public.leads_venda;
CREATE POLICY "leads_venda_auth_select" ON public.leads_venda
  FOR SELECT TO authenticated
  USING (true);

-- 2. Tabela leads_investidor
CREATE TABLE IF NOT EXISTS public.leads_investidor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT NOT NULL,
  perfil TEXT NOT NULL, -- comprar para morar / investir para renda / investir para revenda
  faixa_valor TEXT NOT NULL,
  cidades_interesse TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ativar RLS para leads_investidor
ALTER TABLE public.leads_investidor ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para leads_investidor:
-- Permite insert anônimo ou autenticado de novos leads
DROP POLICY IF EXISTS "leads_investidor_anon_insert" ON public.leads_investidor;
CREATE POLICY "leads_investidor_anon_insert" ON public.leads_investidor
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Permite leitura apenas para autenticados
DROP POLICY IF EXISTS "leads_investidor_auth_select" ON public.leads_investidor;
CREATE POLICY "leads_investidor_auth_select" ON public.leads_investidor
  FOR SELECT TO authenticated
  USING (true);

-- Índices úteis para listagem e ordenação cronológica
CREATE INDEX IF NOT EXISTS idx_leads_venda_created_at ON public.leads_venda (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_investidor_created_at ON public.leads_investidor (created_at DESC);
