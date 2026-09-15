-- Migration: Adicionar coluna status em public.leads_venda
-- Status permitidos: 'Recebido', 'Em análise', 'Com compatibilidade', 'Em negociação'
-- Default 'Recebido'

ALTER TABLE public.leads_venda
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Recebido';

-- Atualiza leads existentes caso estejam nulos
UPDATE public.leads_venda
SET status = 'Recebido'
WHERE status IS NULL OR status = '';
