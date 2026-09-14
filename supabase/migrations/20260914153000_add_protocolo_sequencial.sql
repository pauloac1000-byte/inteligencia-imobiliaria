-- Migration: Adicionar coluna protocolo sequencial formato KX-0001 para leads_venda e leads_investidor
-- Sequence compartilhada entre ambas as tabelas para garantir unicidade e sequencialidade global KORBIX.

-- 1. Criar sequence compartilhada caso não exista
CREATE SEQUENCE IF NOT EXISTS public.seq_protocolo_korbix START WITH 1 INCREMENT BY 1;

-- 2. Adicionar coluna protocolo TEXT em ambas as tabelas
ALTER TABLE public.leads_venda ADD COLUMN IF NOT EXISTS protocolo TEXT UNIQUE;
ALTER TABLE public.leads_investidor ADD COLUMN IF NOT EXISTS protocolo TEXT UNIQUE;

-- 3. Função para gerar protocolo formatado KX-0001
CREATE OR REPLACE FUNCTION public.fn_gerar_protocolo_korbix()
RETURNS TRIGGER AS $$
DECLARE
  v_next_val BIGINT;
BEGIN
  -- Se o protocolo já estiver preenchido (ex: reaproveitado ou fornecido), mantém
  IF NEW.protocolo IS NOT NULL AND NEW.protocolo <> '' THEN
    RETURN NEW;
  END IF;

  v_next_val := nextval('public.seq_protocolo_korbix');
  NEW.protocolo := 'KX-' || LPAD(v_next_val::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Triggers BEFORE INSERT para preencher automaticamente o protocolo
DROP TRIGGER IF EXISTS trg_gerar_protocolo_leads_venda ON public.leads_venda;
CREATE TRIGGER trg_gerar_protocolo_leads_venda
  BEFORE INSERT ON public.leads_venda
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_gerar_protocolo_korbix();

DROP TRIGGER IF EXISTS trg_gerar_protocolo_leads_investidor ON public.leads_investidor;
CREATE TRIGGER trg_gerar_protocolo_leads_investidor
  BEFORE INSERT ON public.leads_investidor
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_gerar_protocolo_korbix();

-- 5. Backfill defensivo para registros antigos sem protocolo (caso existam)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.leads_venda WHERE protocolo IS NULL OR protocolo = '' ORDER BY criado_em ASC LOOP
    UPDATE public.leads_venda
    SET protocolo = 'KX-' || LPAD(nextval('public.seq_protocolo_korbix')::TEXT, 4, '0')
    WHERE id = r.id;
  END LOOP;

  FOR r IN SELECT id FROM public.leads_investidor WHERE protocolo IS NULL OR protocolo = '' ORDER BY criado_em ASC LOOP
    UPDATE public.leads_investidor
    SET protocolo = 'KX-' || LPAD(nextval('public.seq_protocolo_korbix')::TEXT, 4, '0')
    WHERE id = r.id;
  END LOOP;
END $$;

-- 6. Garantir índices para consulta rápida por protocolo
CREATE INDEX IF NOT EXISTS idx_leads_venda_protocolo ON public.leads_venda(protocolo);
CREATE INDEX IF NOT EXISTS idx_leads_investidor_protocolo ON public.leads_investidor(protocolo);
