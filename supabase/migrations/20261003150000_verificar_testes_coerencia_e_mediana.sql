-- Migration de execução e validação dos casos de teste de coerência e alertas
-- Executa todos os testes exigidos na tarefa e faz o rollback/delete deixando o banco 100% limpo

DO $$
DECLARE
  v_res RECORD;
  v_err TEXT;
  v_id1 UUID; v_id2 UUID; v_id3 UUID; v_id4 UUID; v_id5 UUID;
  v_alerta_count INT;
  v_alerta_rotulo TEXT;
BEGIN
  RAISE NOTICE '>>> INICIANDO BATERIA DE TESTES NO BANCO REAL <<<';

  ----------------------------------------------------------------------
  -- CASO 1: Válido: lead de venda completo com WhatsApp +5519998563025, área > 0, quartos 0–10
  -- Deve gravar e retornar protocolo KX.
  ----------------------------------------------------------------------
  SELECT * INTO v_res FROM public.fn_submit_lead_venda_etapa1(
    p_cidade := 'TESTE_VALIDO_CAMPINAS',
    p_tipo_imovel := 'apartamento',
    p_telefone := '+5519998563025',
    p_preco_pedido := 550000,
    p_preco_minimo := 500000,
    p_area_util := 85,
    p_quartos := 3
  );

  IF v_res.protocolo IS NULL OR v_res.protocolo NOT LIKE 'KX-%' THEN
    RAISE EXCEPTION 'TESTE 1 FALHOU: Esperava protocolo KX-..., recebeu: %', v_res.protocolo;
  END IF;

  DELETE FROM public.leads_venda WHERE id = v_res.id;
  RAISE NOTICE 'TESTE 1 PASSOU: Lead de venda válido gravado com protocolo KX e removido com sucesso.';

  ----------------------------------------------------------------------
  -- CASO 2: Inválido: WhatsApp sem +55 / DDD inválido
  -- Deve retornar erro em português citando o WhatsApp.
  ----------------------------------------------------------------------
  BEGIN
    PERFORM public.fn_submit_lead_venda_etapa1(
      p_cidade := 'TESTE_WHATSAPP_INVALIDO',
      p_tipo_imovel := 'apartamento',
      p_telefone := '1999999999', -- inválido: 10 dígitos (sem nono dígito) e sem +55
      p_area_util := 80
    );
    RAISE EXCEPTION 'TESTE 2 FALHOU: Deveria ter recusado WhatsApp sem formato +55 com DDD e 9 dígitos.';
  EXCEPTION WHEN OTHERS THEN
    v_err := SQLERRM;
    IF v_err NOT LIKE '%WhatsApp%' THEN
      RAISE EXCEPTION 'TESTE 2 FALHOU: Mensagem de erro não citou WhatsApp em português. Mensagem: %', v_err;
    END IF;
    RAISE NOTICE 'TESTE 2 PASSOU: WhatsApp inválido rejeitado com erro em português: "%"', v_err;
  END;

  ----------------------------------------------------------------------
  -- CASO 3: Inválido: preço mínimo > preço pedido
  -- Deve retornar erro em português.
  ----------------------------------------------------------------------
  BEGIN
    PERFORM public.fn_submit_lead_venda_etapa1(
      p_cidade := 'TESTE_PRECO_INVALIDO',
      p_tipo_imovel := 'apartamento',
      p_telefone := '+5519998563025',
      p_preco_pedido := 400000,
      p_preco_minimo := 500000, -- maior que preco_pedido
      p_area_util := 80
    );
    RAISE EXCEPTION 'TESTE 3 FALHOU: Deveria ter recusado preço mínimo maior que o pedido.';
  EXCEPTION WHEN OTHERS THEN
    v_err := SQLERRM;
    IF v_err NOT LIKE '%preço mínimo%' THEN
      RAISE EXCEPTION 'TESTE 3 FALHOU: Mensagem de erro não citou preço mínimo em português. Mensagem: %', v_err;
    END IF;
    RAISE NOTICE 'TESTE 3 PASSOU: Preço mínimo > pedido rejeitado com erro em português: "%"', v_err;
  END;

  ----------------------------------------------------------------------
  -- CASO 4: Inválido: mínimo da faixa >= máximo no investidor
  -- Deve retornar erro em português.
  ----------------------------------------------------------------------
  BEGIN
    PERFORM public.fn_submit_lead_investidor(
      p_telefone := '+5519998563025',
      p_ticket := '300_600k',
      p_objetivo := 'renda_aluguel',
      p_cidades_interesse := 'Campinas',
      p_prazo_decisao := '30_dias',
      p_preco_minimo := 600000,
      p_preco_maximo := 500000 -- menor que o mínimo
    );
    RAISE EXCEPTION 'TESTE 4 FALHOU: Deveria ter recusado preco_minimo >= preco_maximo no investidor.';
  EXCEPTION WHEN OTHERS THEN
    v_err := SQLERRM;
    IF v_err NOT LIKE '%valor mínimo da faixa%' THEN
      RAISE EXCEPTION 'TESTE 4 FALHOU: Mensagem de erro não citou valor mínimo da faixa em português. Mensagem: %', v_err;
    END IF;
    RAISE NOTICE 'TESTE 4 PASSOU: Mínimo >= máximo no investidor rejeitado com erro em português: "%"', v_err;
  END;

  ----------------------------------------------------------------------
  -- CASO 5: Inválido:
  -- 5a: Área útil 0 em apartamento / casa / comercial -> erro em português
  -- 5b: Área de terreno 0 em terreno -> erro em português
  -- 5c: Quartos 11 -> erro em português
  ----------------------------------------------------------------------
  -- 5a: area_util 0
  BEGIN
    PERFORM public.fn_submit_lead_venda_etapa1(
      p_cidade := 'TESTE_AREA_UTIL_ZERO',
      p_tipo_imovel := 'apartamento',
      p_telefone := '+5519998563025',
      p_area_util := 0
    );
    RAISE EXCEPTION 'TESTE 5a FALHOU: Deveria ter recusado area_util <= 0.';
  EXCEPTION WHEN OTHERS THEN
    v_err := SQLERRM;
    IF v_err NOT LIKE '%área útil%' THEN
      RAISE EXCEPTION 'TESTE 5a FALHOU: Mensagem de erro não citou área útil em português. Mensagem: %', v_err;
    END IF;
    RAISE NOTICE 'TESTE 5a PASSOU: Área útil <= 0 rejeitada com erro em português: "%"', v_err;
  END;

  -- 5b: area_terreno 0
  BEGIN
    PERFORM public.fn_submit_lead_venda_etapa1(
      p_cidade := 'TESTE_AREA_TERRENO_ZERO',
      p_tipo_imovel := 'terreno',
      p_telefone := '+5519998563025',
      p_area_terreno := 0
    );
    RAISE EXCEPTION 'TESTE 5b FALHOU: Deveria ter recusado area_terreno <= 0.';
  EXCEPTION WHEN OTHERS THEN
    v_err := SQLERRM;
    IF v_err NOT LIKE '%área do terreno%' THEN
      RAISE EXCEPTION 'TESTE 5b FALHOU: Mensagem de erro não citou área do terreno em português. Mensagem: %', v_err;
    END IF;
    RAISE NOTICE 'TESTE 5b PASSOU: Área terreno <= 0 rejeitada com erro em português: "%"', v_err;
  END;

  -- 5c: quartos 11
  BEGIN
    PERFORM public.fn_submit_lead_venda_etapa1(
      p_cidade := 'TESTE_QUARTOS_11',
      p_tipo_imovel := 'apartamento',
      p_telefone := '+5519998563025',
      p_area_util := 120,
      p_quartos := 11
    );
    RAISE EXCEPTION 'TESTE 5c FALHOU: Deveria ter recusado quartos > 10.';
  EXCEPTION WHEN OTHERS THEN
    v_err := SQLERRM;
    IF v_err NOT LIKE '%quartos%' THEN
      RAISE EXCEPTION 'TESTE 5c FALHOU: Mensagem de erro não citou quartos em português. Mensagem: %', v_err;
    END IF;
    RAISE NOTICE 'TESTE 5c PASSOU: Quartos 11 rejeitado com erro em português: "%"', v_err;
  END;

  ----------------------------------------------------------------------
  -- CASO 6 e 7: Regra da Mediana
  -- 6. Com < 5 imóveis do tipo na cidade -> NENHUM ALERTA
  -- 7. Com >= 5 imóveis do mesmo tipo na cidade (codigo_ibge):
  --    - Inserir um imóvel com preço/m² fora de +-50% da mediana:
  --      -> Alerta 'revisar valor' gravado em alertas_gestor
  --      -> Cadastro NÃO bloqueado
  --      -> Não duplica ao regravar/alterar
  --      -> Corrigir o valor para dentro da faixa -> alerta resolvido/removido
  ----------------------------------------------------------------------
  -- Isolamento com código IBGE de teste único: '9999001'
  SELECT id INTO v_id1 FROM public.fn_submit_lead_venda_etapa1(
    p_cidade := 'CidadeTesteMediana',
    p_codigo_ibge := '9999001',
    p_tipo_imovel := 'apartamento',
    p_telefone := '+5519998563025',
    p_preco_pedido := 15000000, -- R$ 150.000/m² para 100m² (claramente extremo)
    p_area_util := 100
  );

  -- Verifica subcaso < 5 imóveis:
  SELECT COUNT(*) INTO v_alerta_count FROM public.alertas_gestor WHERE lead_venda_id = v_id1;
  IF v_alerta_count > 0 THEN
    DELETE FROM public.leads_venda WHERE codigo_ibge = '9999001';
    RAISE EXCEPTION 'TESTE 6 FALHOU: Com 1 imóvel (< 5) na cidade, alerta_gestor NÃO deveria ter sido gerado.';
  END IF;
  RAISE NOTICE 'TESTE 6 PASSOU: Com < 5 imóveis na cidade, nenhum alerta foi gerado.';

  -- Insere outros 4 imóveis para totalizar 5 imóveis do tipo apartamento na cidade '9999001'
  -- Quatro imóveis em R$ 5.000/m² (500.000 / 100m²). A mediana será R$ 5.000/m².
  SELECT id INTO v_id2 FROM public.fn_submit_lead_venda_etapa1(
    p_cidade := 'CidadeTesteMediana', p_codigo_ibge := '9999001', p_tipo_imovel := 'apartamento',
    p_telefone := '+5519998563025', p_preco_pedido := 500000, p_area_util := 100
  );
  SELECT id INTO v_id3 FROM public.fn_submit_lead_venda_etapa1(
    p_cidade := 'CidadeTesteMediana', p_codigo_ibge := '9999001', p_tipo_imovel := 'apartamento',
    p_telefone := '+5519998563025', p_preco_pedido := 500000, p_area_util := 100
  );
  SELECT id INTO v_id4 FROM public.fn_submit_lead_venda_etapa1(
    p_cidade := 'CidadeTesteMediana', p_codigo_ibge := '9999001', p_tipo_imovel := 'apartamento',
    p_telefone := '+5519998563025', p_preco_pedido := 500000, p_area_util := 100
  );
  SELECT id INTO v_id5 FROM public.fn_submit_lead_venda_etapa1(
    p_cidade := 'CidadeTesteMediana', p_codigo_ibge := '9999001', p_tipo_imovel := 'apartamento',
    p_telefone := '+5519998563025', p_preco_pedido := 500000, p_area_util := 100
  );

  -- Agora a amostra possui 5 imóveis. Atualizamos o imóvel v_id1 para disparar checagem da mediana:
  UPDATE public.leads_venda SET preco_pedido = 15000000 WHERE id = v_id1;

  SELECT COUNT(*), MAX(rotulo) INTO v_alerta_count, v_alerta_rotulo
  FROM public.alertas_gestor WHERE lead_venda_id = v_id1;

  IF v_alerta_count <> 1 OR v_alerta_rotulo <> 'revisar valor' THEN
    DELETE FROM public.leads_venda WHERE codigo_ibge = '9999001';
    RAISE EXCEPTION 'TESTE 7a FALHOU: Alerta "revisar valor" não foi gravado para o imóvel fora da mediana.';
  END IF;
  RAISE NOTICE 'TESTE 7a PASSOU: Com >= 5 imóveis e preço fora de +-50%% da mediana, alerta "revisar valor" gravado sem bloquear cadastro.';

  -- Verificar que não duplica ao regravar/alterar:
  UPDATE public.leads_venda SET preco_pedido = 16000000 WHERE id = v_id1;
  SELECT COUNT(*) INTO v_alerta_count FROM public.alertas_gestor WHERE lead_venda_id = v_id1;
  IF v_alerta_count <> 1 THEN
    DELETE FROM public.leads_venda WHERE codigo_ibge = '9999001';
    RAISE EXCEPTION 'TESTE 7b FALHOU: Alerta duplicou após alteração: count=%', v_alerta_count;
  END IF;
  RAISE NOTICE 'TESTE 7b PASSOU: Alerta não duplica em atualizações sucessivas (ON CONFLICT DO UPDATE).';

  -- Corrigir o valor para dentro da faixa de coerência (ex.: R$ 5.100/m² -> 510.000 para 100m²):
  UPDATE public.leads_venda SET preco_pedido = 510000 WHERE id = v_id1;
  SELECT COUNT(*) INTO v_alerta_count FROM public.alertas_gestor WHERE lead_venda_id = v_id1;
  IF v_alerta_count <> 0 THEN
    DELETE FROM public.leads_venda WHERE codigo_ibge = '9999001';
    RAISE EXCEPTION 'TESTE 7c FALHOU: Alerta não foi removido após correção do valor para dentro da faixa.';
  END IF;
  RAISE NOTICE 'TESTE 7c PASSOU: Após corrigir o valor para dentro da faixa, alerta foi resolvido/removido automaticamente.';

  ----------------------------------------------------------------------
  -- LIMPEZA GERAL DE DADOS DE TESTE
  ----------------------------------------------------------------------
  DELETE FROM public.leads_venda WHERE codigo_ibge = '9999001' OR cidade LIKE 'TESTE_%';

  RAISE NOTICE '>>> BATERIA DE TESTES CONCLUÍDA: 100%% DOS TESTES PASSARAM E BANCO LIMPO <<<';
END $$;
