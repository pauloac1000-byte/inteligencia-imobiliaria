-- Migration: add motivo_venda and prazo_desejado, allow null nome for step 1, add anon update policy
ALTER TABLE public.leads_venda
  ADD COLUMN IF NOT EXISTS motivo_venda TEXT,
  ADD COLUMN IF NOT EXISTS prazo_desejado TEXT;

-- nome was NOT NULL in original schema. In Step 1, only cidade, tipo_imovel and telefone/whatsapp are provided.
-- Making nome nullable allows saving lead at Step 1 before Step 2 is filled.
ALTER TABLE public.leads_venda
  ALTER COLUMN nome DROP NOT NULL;

-- Allow anon and authenticated clients to update existing leads_venda rows (for step 2 completion)
DROP POLICY IF EXISTS "leads_venda_anon_update" ON public.leads_venda;
CREATE POLICY "leads_venda_anon_update" ON public.leads_venda
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);
