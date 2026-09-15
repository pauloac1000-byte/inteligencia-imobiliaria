-- Migration: Adicionar campos de simulação de retorno em public.leads_investidor e criar RPC fn_submit_lead_simulador_investidor
-- Permite registrar as entradas e saídas simuladas pelo investidor como sua tese de compra com protocolo sequencial KX-XXXX.

-- 1. Adicionar colunas da simulação de retorno em public.leads_investidor (todas nullable para não afetar registros existentes)
ALTER TABLE public.leads_investidor
  ADD COLUMN IF NOT EXISTS sim_valor_compra TEXT,
  ADD COLUMN IF NOT EXISTS sim_custo_reforma TEXT,
  ADD COLUMN IF NOT EXISTS sim_aluguel_mensal TEXT,
  ADD COLUMN IF NOT EXISTS sim_prazo_revenda_meses INTEGER,
  ADD COLUMN IF NOT EXISTS sim_valorizacao_anual NUMERIC,
  ADD COLUMN IF NOT EXISTS sim_capital_investido TEXT,
  ADD COLUMN IF NOT EXISTS sim_rentabilidade_mensal NUMERIC,
  ADD COLUMN IF NOT EXISTS sim_retorno_total NUMERIC;

-- 2. Criar RPC SECURITY DEFINER para gravar lead vindo do simulador com rota 'investidor' e retornar ID + protocolo
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
  p_rota TEXT DEFAULT 'investidor'
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
    sim_retorno_total
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
    p_sim_retorno_total
  )
  RETURNING * INTO v_lead;

  RETURN QUERY SELECT v_lead.id, v_lead.protocolo;
END;
$$;

-- 3. Conceder permissão de execução aos papéis anon e authenticated
GRANT EXECUTE ON FUNCTION public.fn_submit_lead_simulador_investidor(
  TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, NUMERIC, TEXT, NUMERIC, NUMERIC, TEXT
) TO anon, authenticated;
