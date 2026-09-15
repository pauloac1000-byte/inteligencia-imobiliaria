-- Migration: Adicionar campos da calculadora de imóvel parado em leads_venda e criar RPC fn_submit_lead_calculadora
-- Permite converter simulações da calculadora em leads qualificados sem expor leitura aberta (mantendo RLS segura).

-- 1. Adicionar colunas da calculadora em public.leads_venda (todas nullable para não quebrar leads existentes)
ALTER TABLE public.leads_venda
  ADD COLUMN IF NOT EXISTS calc_iptu_anual TEXT,
  ADD COLUMN IF NOT EXISTS calc_condominio_mensal TEXT,
  ADD COLUMN IF NOT EXISTS calc_manutencao_mensal TEXT,
  ADD COLUMN IF NOT EXISTS calc_meses_parado INTEGER,
  ADD COLUMN IF NOT EXISTS calc_taxa_mensal NUMERIC,
  ADD COLUMN IF NOT EXISTS calc_custo_mensal_total TEXT,
  ADD COLUMN IF NOT EXISTS calc_custo_acumulado_total TEXT;

-- 2. Criar RPC SECURITY DEFINER para gravar lead vindo da calculadora e retornar ID + protocolo
CREATE OR REPLACE FUNCTION public.fn_submit_lead_calculadora(
  p_cidade TEXT,
  p_telefone TEXT,
  p_valor_imovel TEXT,
  p_iptu_anual TEXT DEFAULT NULL,
  p_condominio_mensal TEXT DEFAULT NULL,
  p_manutencao_mensal TEXT DEFAULT NULL,
  p_meses_parado INTEGER DEFAULT NULL,
  p_taxa_mensal NUMERIC DEFAULT NULL,
  p_custo_mensal_total TEXT DEFAULT NULL,
  p_custo_acumulado_total TEXT DEFAULT NULL,
  p_rota TEXT DEFAULT 'proprietario'
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
    telefone,
    valor_estimado,
    rota,
    calc_iptu_anual,
    calc_condominio_mensal,
    calc_manutencao_mensal,
    calc_meses_parado,
    calc_taxa_mensal,
    calc_custo_mensal_total,
    calc_custo_acumulado_total,
    mensagem
  )
  VALUES (
    TRIM(p_cidade),
    TRIM(p_telefone),
    NULLIF(TRIM(p_valor_imovel), ''),
    COALESCE(p_rota, 'proprietario'),
    NULLIF(TRIM(p_iptu_anual), ''),
    NULLIF(TRIM(p_condominio_mensal), ''),
    NULLIF(TRIM(p_manutencao_mensal), ''),
    p_meses_parado,
    p_taxa_mensal,
    NULLIF(TRIM(p_custo_mensal_total), ''),
    NULLIF(TRIM(p_custo_acumulado_total), ''),
    'Lead originado da Calculadora de Custo de Imóvel Parado (/calculadora)'
  )
  RETURNING * INTO v_lead;

  RETURN QUERY SELECT v_lead.id, v_lead.protocolo;
END;
$$;

-- 3. Conceder permissão de execução aos papéis anon e authenticated
GRANT EXECUTE ON FUNCTION public.fn_submit_lead_calculadora(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, NUMERIC, TEXT, TEXT, TEXT
) TO anon, authenticated;
