-- ==============================================================================
-- Migration: Validação dos cenários de teste da nova pontuação e limpeza
-- Data/Versão: 20261003201500_validar_testes_nova_pontuacao.sql
-- ==============================================================================

DO $$
DECLARE
  v_venda_id UUID := 'bbbbbbbb-0000-0000-0000-000000000001'::uuid;
  v_inv_id UUID := 'cccccccc-0000-0000-0000-000000000001'::uuid;
  v_res RECORD;
  v_rec_par INTEGER;
  v_compat RECORD;
BEGIN
  -- Limpeza prévia defensiva
  DELETE FROM public.compatibilidades WHERE lead_venda_id = v_venda_id OR lead_investidor_id = v_inv_id;
  DELETE FROM public.compatibilidade_imovel_tese WHERE lead_venda_id = v_venda_id OR lead_investidor_id = v_inv_id;
  DELETE FROM public.leads_investidor WHERE id = v_inv_id;
  DELETE FROM public.leads_venda WHERE id = v_venda_id;

  -- 1. Cria lead de venda (imóvel ativo, 500k pedido, 400k mínimo, apartamento, Jardins, etc.)
  INSERT INTO public.leads_venda (
    id, telefone, tipo_imovel, cidade, bairro, status, preco_pedido, preco_minimo,
    area_util, quartos, vagas, aceita_financiamento, ocupacao, condicao, prazo_desejado,
    diferenciais
  ) VALUES (
    v_venda_id, '+5511999999999', 'apartamento', 'São Paulo', 'Jardins', 'ativo', 500000, 400000,
    100, 3, 2, TRUE, 'desocupado', 'pronto', 'até 60 dias',
    '["PISCINA", "PORTARIA"]'::jsonb
  );

  -- Cenário 1: Tudo ótimo (100%)
  INSERT INTO public.leads_investidor (
    id, telefone, finalidade, tipos_imovel, preco_minimo, preco_maximo, preco_teto_absoluto,
    min_area_m2, min_quartos, min_vagas, forma_pagamento, prazo_decisao,
    bairros_preferidos, cidades_interesse, ativo, diferenciais
  ) VALUES (
    v_inv_id, '+5511988888888', 'morar', ARRAY['apartamento'], 300000, 600000, 600000,
    80, 3, 2, 'a_vista', 'até 60 dias',
    'Jardins', 'São Paulo', TRUE, '{"PISCINA": "obrigatorio"}'::jsonb
  );

  SELECT * INTO v_res FROM public.fn_calcular_compatibilidade_detalhada(v_venda_id, v_inv_id);
  IF v_res.percentual <> 100 THEN
    RAISE EXCEPTION 'Cenário 1 falhou: esperado 100%%, obteve %', v_res.percentual;
  END IF;

  -- Cenário 2: Preço no meio do intervalo parcial (fator 0.8)
  -- teto 450k entre mínimo 400k e pedido 500k: 0.6 + 0.4 * (450k-400k)/(500k-400k) = 0.8
  -- Pontos: 0.8 * 25 = 20 (perde 5 pts no total de 100 => 95%)
  UPDATE public.leads_investidor
  SET preco_teto_absoluto = 450000, preco_maximo = 450000
  WHERE id = v_inv_id;

  SELECT * INTO v_res FROM public.fn_calcular_compatibilidade_detalhada(v_venda_id, v_inv_id);
  IF v_res.percentual <> 95 THEN
    RAISE EXCEPTION 'Cenário 2 falhou: esperado 95%%, obteve %', v_res.percentual;
  END IF;

  -- Cenário 3: Um diferencial obrigatório faltando (0 no critério)
  -- Pede ELEVADOR obrigatório (imóvel não tem) => Fator diferenciais = 0.
  -- Preço continua 450k (20 pts), diferenciais 0 pts. Total = 85%.
  UPDATE public.leads_investidor
  SET diferenciais = '{"ELEVADOR": "obrigatorio"}'::jsonb
  WHERE id = v_inv_id;

  SELECT * INTO v_res FROM public.fn_calcular_compatibilidade_detalhada(v_venda_id, v_inv_id);
  IF v_res.percentual <> 85 THEN
    RAISE EXCEPTION 'Cenário 3 falhou: esperado 85%%, obteve %', v_res.percentual;
  END IF;

  -- Cenário 4: Critério não aplicável (Terreno, normalização)
  -- Imóvel vira terreno com 500m²; diferenciais sai da conta (pesos somam 90)
  UPDATE public.leads_venda
  SET tipo_imovel = 'terreno', area_terreno = 500
  WHERE id = v_venda_id;

  UPDATE public.leads_investidor
  SET tipos_imovel = ARRAY['terreno'], min_area_terreno_m2 = 400,
      preco_teto_absoluto = 600000, preco_maximo = 600000
  WHERE id = v_inv_id;

  SELECT * INTO v_res FROM public.fn_calcular_compatibilidade_detalhada(v_venda_id, v_inv_id);
  IF v_res.percentual <> 100 THEN
    RAISE EXCEPTION 'Cenário 4 falhou: esperado 100%% normalizado, obteve %', v_res.percentual;
  END IF;

  -- Cenário 5: Persistência de par e detalhamento JSON na tabela compatibilidades
  v_rec_par := public.fn_recalcular_compatibilidade_par(v_venda_id, v_inv_id);
  IF v_rec_par <> 100 THEN
    RAISE EXCEPTION 'Cenário 5 falhou: fn_recalcular_compatibilidade_par retornou %', v_rec_par;
  END IF;

  SELECT * INTO v_compat FROM public.compatibilidades WHERE lead_venda_id = v_venda_id AND lead_investidor_id = v_inv_id;
  IF v_compat.percentual <> 100 OR v_compat.detalhamento IS NULL OR jsonb_array_length(v_compat.detalhamento) <> 7 THEN
    RAISE EXCEPTION 'Cenário 5 falhou na persistência da compatibilidade';
  END IF;

  -- Cenário 6: Confirmação de que primeira camada de descarte continua descartando (vendedor não aceita financiamento)
  UPDATE public.leads_venda SET aceita_financiamento = FALSE WHERE id = v_venda_id;
  UPDATE public.leads_investidor SET forma_pagamento = 'financiamento_aprovado' WHERE id = v_inv_id;

  v_rec_par := public.fn_recalcular_compatibilidade_par(v_venda_id, v_inv_id);
  IF v_rec_par <> 0 THEN
    RAISE EXCEPTION 'Cenário 6 falhou: par eliminado deveria retornar 0, retornou %', v_rec_par;
  END IF;

  SELECT * INTO v_compat FROM public.compatibilidades WHERE lead_venda_id = v_venda_id AND lead_investidor_id = v_inv_id;
  IF v_compat.eliminado IS NOT TRUE OR v_compat.motivo_eliminacao IS NULL THEN
    RAISE EXCEPTION 'Cenário 6 falhou: par deveria estar marcado como eliminado com motivo';
  END IF;

  -- Limpeza COMPLETA obrigatória de todos os dados de teste gerados
  DELETE FROM public.compatibilidades WHERE lead_venda_id = v_venda_id OR lead_investidor_id = v_inv_id;
  DELETE FROM public.compatibilidade_imovel_tese WHERE lead_venda_id = v_venda_id OR lead_investidor_id = v_inv_id;
  DELETE FROM public.leads_investidor WHERE id = v_inv_id;
  DELETE FROM public.leads_venda WHERE id = v_venda_id;
END $$;
