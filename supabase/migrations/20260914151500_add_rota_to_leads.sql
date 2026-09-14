-- Adiciona coluna 'rota' nas tabelas leads_venda e leads_investidor
-- Valor gravado: 'proprietario' ou 'investidor'

ALTER TABLE public.leads_venda
ADD COLUMN IF NOT EXISTS rota TEXT NOT NULL DEFAULT 'proprietario';

ALTER TABLE public.leads_investidor
ADD COLUMN IF NOT EXISTS rota TEXT NOT NULL DEFAULT 'investidor';

-- Comentários descritivos
COMMENT ON COLUMN public.leads_venda.rota IS 'Identificador da rota de origem do lead (proprietario ou investidor)';
COMMENT ON COLUMN public.leads_investidor.rota IS 'Identificador da rota de origem do lead (proprietario ou investidor)';
