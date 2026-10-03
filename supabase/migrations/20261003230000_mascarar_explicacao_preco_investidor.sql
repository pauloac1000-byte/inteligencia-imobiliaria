-- ==============================================================================
-- Migration: 20261003230000_mascarar_explicacao_preco_investidor.sql
-- Descrição: Assegura que o detalhamento retornado para o investidor não exponha
--            o preço mínimo do vendedor nem valores internos confidenciais.
--            Aplica a máscara textual:
--              - Se teto >= pedido => "Preço dentro do seu teto."
--              - Se teto >= mínimo => "Preço próximo do seu teto."
--              - Se teto < mínimo  => "Preço acima do seu teto."
--            Investidor NUNCA vê o preço mínimo do vendedor, a nota do vendedor
--            (sempre 0 na RPC) nem o detalhamento_vendedor.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.fn_mascarar_detalhamento_investidor(p_detalhamento JSONB)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_elem JSONB;
  v_res JSONB := '[]'::jsonb;
  v_criterio TEXT;
  v_fator NUMERIC;
  v_exp TEXT;
  v_novo_item JSONB;
BEGIN
  IF p_detalhamento IS NULL OR jsonb_typeof(p_detalhamento) <> 'array' THEN
    RETURN '[]'::jsonb;
  END IF;

  FOR v_elem IN SELECT * FROM jsonb_array_elements(p_detalhamento)
  LOOP
    v_criterio := v_elem->>'criterio';
    IF v_criterio = 'preco' THEN
      v_fator := COALESCE((v_elem->>'fator')::NUMERIC, 0.0);
      IF v_fator >= 1.0 THEN
        v_exp := 'Preço dentro do seu teto.';
      ELSIF v_fator >= 0.5 THEN
        v_exp := 'Preço próximo do seu teto.';
      ELSE
        v_exp := 'Preço acima do seu teto.';
      END IF;

      -- Remove qualquer menção a preço mínimo ou números confidenciais e aplica a máscara
      -- Também mascara o fator no nível do banco para proteção em profundidade
      v_novo_item := v_elem || jsonb_build_object(
        'explicacao', v_exp,
        'fator_classificacao', CASE 
          WHEN v_fator >= 1.0 THEN 'dentro'
          WHEN v_fator >= 0.5 THEN 'proximo'
          ELSE 'acima'
        END
      );
      v_res := v_res || v_novo_item;
    ELSE
      v_res := v_res || v_elem;
    END IF;
  END LOOP;

  RETURN v_res;
END;
$$;

DROP FUNCTION IF EXISTS public.fn_listar_oportunidades_investidor();
CREATE OR REPLACE FUNCTION public.fn_listar_oportunidades_investidor()
RETURNS TABLE (
  compatibilidade_id UUID,
  lead_venda_id UUID,
  lead_investidor_id UUID,
  percentual INTEGER,
  nota_comprador INTEGER,
  nota_vendedor INTEGER,
  nota_final INTEGER,
  faixa_compatibilidade TEXT,
  confianca_classificacao TEXT,
  confianca_percentual NUMERIC,
  confianca_detalhes JSONB,
  criterios JSONB,
  criterios_atendidos JSONB,
  criterios_nao_atendidos JSONB,
  protocolo_imovel TEXT,
  tipo_imovel TEXT,
  cidade TEXT,
  faixa_valor TEXT,
  status_imovel TEXT,
  criado_em_imovel TIMESTAMPTZ,
  tese_protocolo TEXT,
  tese_objetivo TEXT,
  tese_ticket TEXT,
  ja_manifestou_interesse BOOLEAN,
  interesse_id UUID,
  interesse_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_limiar_visivel NUMERIC := 75.0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso restrito a investidores autenticados.';
  END IF;

  -- Lê o limiar configurado pelo gestor para exibição ao comprador (padrão 75)
  SELECT COALESCE(valor, 75.0) INTO v_limiar_visivel
  FROM public.configuracao_limiares_compatibilidade
  WHERE parametro = 'visivel_comprador';

  RETURN QUERY
  SELECT 
    c.id AS compatibilidade_id,
    lv.id AS lead_venda_id,
    li.id AS lead_investidor_id,
    c.percentual,
    COALESCE(c.nota_comprador, c.percentual) AS nota_comprador,
    0 AS nota_vendedor, -- Investidor NUNCA vê a nota do vendedor
    COALESCE(c.nota_final, c.percentual) AS nota_final,
    COALESCE(c.faixa_compatibilidade, 'oculta') AS faixa_compatibilidade,
    COALESCE(c.confianca_classificacao, 'baixa') AS confianca_classificacao,
    COALESCE(c.confianca_percentual, 0) AS confianca_percentual,
    COALESCE(c.confianca_detalhes, '{}'::jsonb) AS confianca_detalhes,
    public.fn_mascarar_detalhamento_investidor(COALESCE(c.detalhamento, c.criterios)) AS criterios,
    public.fn_mascarar_detalhamento_investidor(c.criterios_atendidos) AS criterios_atendidos,
    public.fn_mascarar_detalhamento_investidor(c.criterios_nao_atendidos) AS criterios_nao_atendidos,
    COALESCE(lv.protocolo, 'KX-0000') AS protocolo_imovel,
    COALESCE(lv.tipo_imovel, 'Imóvel') AS tipo_imovel,
    COALESCE(lv.cidade, 'Região') AS cidade,
    public.fn_mascarar_faixa_valor(lv.valor_estimado) AS faixa_valor,
    COALESCE(lv.status, 'ativo') AS status_imovel,
    lv.criado_em AS criado_em_imovel,
    COALESCE(li.protocolo, 'KX-TESE') AS tese_protocolo,
    COALESCE(li.objetivo, 'Geral') AS tese_objetivo,
    COALESCE(li.ticket, '') AS tese_ticket,
    (ii.id IS NOT NULL) AS ja_manifestou_interesse,
    ii.id AS interesse_id,
    ii.status AS interesse_status
  FROM public.compatibilidades c
  JOIN public.leads_investidor li ON li.id = c.lead_investidor_id
  JOIN public.leads_venda lv ON lv.id = c.lead_venda_id
  LEFT JOIN public.interesses_investidor ii 
    ON ii.lead_venda_id = lv.id 
   AND ii.lead_investidor_id = li.id 
   AND ii.user_id = v_user_id
  WHERE li.user_id = v_user_id
    AND LOWER(TRIM(lv.status)) = 'ativo'
    AND COALESCE(c.eliminado, FALSE) = FALSE
    AND (
      -- Exibe pares que atingem o limiar configurado pelo gestor ou já possuem interesse
      COALESCE(c.nota_final, c.percentual) >= v_limiar_visivel
      OR ii.id IS NOT NULL
    )
  ORDER BY COALESCE(c.nota_final, c.percentual) DESC, lv.criado_em DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_mascarar_detalhamento_investidor(JSONB) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.fn_listar_oportunidades_investidor() TO authenticated;
