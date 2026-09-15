-- Migration: 20260915203000_storage_imoveis_and_lead_arquivos.sql
-- Descrição: Criação do bucket privado 'imoveis', políticas de storage RLS e tabela public.lead_arquivos

-- 1. Criação do bucket 'imoveis' (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'imoveis',
  'imoveis',
  false,
  10485760, -- 10MB limite geral
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];

-- 2. Políticas de RLS no storage.objects para o bucket 'imoveis'
-- Padrão de caminho: {user_id}/{lead_id}/{tipo}/{filename} ou {user_id}/...
-- O primeiro segmento do caminho deve ser exatamente o auth.uid()::text

DROP POLICY IF EXISTS "storage_imoveis_owner_select" ON storage.objects;
CREATE POLICY "storage_imoveis_owner_select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'imoveis'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "storage_imoveis_owner_insert" ON storage.objects;
CREATE POLICY "storage_imoveis_owner_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'imoveis'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "storage_imoveis_owner_update" ON storage.objects;
CREATE POLICY "storage_imoveis_owner_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'imoveis'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "storage_imoveis_owner_delete" ON storage.objects;
CREATE POLICY "storage_imoveis_owner_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'imoveis'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Tabela public.lead_arquivos
CREATE TABLE IF NOT EXISTS public.lead_arquivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads_venda(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('foto', 'documento')),
  rotulo TEXT CHECK (rotulo IS NULL OR rotulo IN ('matricula', 'iptu', 'certidao')),
  storage_path TEXT NOT NULL,
  nome_original TEXT,
  tamanho_bytes BIGINT,
  mime_type TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.lead_arquivos ENABLE ROW LEVEL SECURITY;

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_lead_arquivos_lead_id ON public.lead_arquivos(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_arquivos_user_id ON public.lead_arquivos(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_arquivos_tipo_ordem ON public.lead_arquivos(lead_id, tipo, ordem);

-- Políticas RLS para lead_arquivos: apenas o dono (user_id = auth.uid()) lê, insere, atualiza e remove
DROP POLICY IF EXISTS "lead_arquivos_owner_select" ON public.lead_arquivos;
CREATE POLICY "lead_arquivos_owner_select"
  ON public.lead_arquivos
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "lead_arquivos_owner_insert" ON public.lead_arquivos;
CREATE POLICY "lead_arquivos_owner_insert"
  ON public.lead_arquivos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "lead_arquivos_owner_update" ON public.lead_arquivos;
CREATE POLICY "lead_arquivos_owner_update"
  ON public.lead_arquivos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "lead_arquivos_owner_delete" ON public.lead_arquivos;
CREATE POLICY "lead_arquivos_owner_delete"
  ON public.lead_arquivos
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
