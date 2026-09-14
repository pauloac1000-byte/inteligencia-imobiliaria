-- Migration to update leads_investidor for investor thesis capture
-- Adds ticket, objetivo, prazo_decisao, and allows nullable nome/email if needed, while keeping rota default 'investidor'

ALTER TABLE public.leads_investidor 
  ALTER COLUMN nome DROP NOT NULL;

ALTER TABLE public.leads_investidor 
  ADD COLUMN IF NOT EXISTS ticket TEXT,
  ADD COLUMN IF NOT EXISTS objetivo TEXT,
  ADD COLUMN IF NOT EXISTS prazo_decisao TEXT;

-- In case cidades_interesse was already present as TEXT, it can store JSON array string or comma-separated list
