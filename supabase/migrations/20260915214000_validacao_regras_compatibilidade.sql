-- ==============================================================================
-- MIGRATION DE VALIDAÇÃO DOS CRITÉRIOS DOCUMENTAIS, CASCATA E LIMPEZA DE TESTES
-- ==============================================================================
DO $$
DECLARE
  v_pct_step3 integer;
  v_pct_step4_add integer;
  v_pct_step4_del integer;
  v_count_criterios integer;
  v_soma_pesos integer;
  v_arq_id uuid := '33333333-3333-3333-3333-333333333333'::uuid;
BEGIN
  -- 1. Conferir percentual após Step 3 (prazo_decisao='flexivel')
  SELECT percentual INTO v_pct_step3 
  FROM public.compatibilidades 
  WHERE lead_venda_id = '11111111-1111-1111-1111-111111111111'::uuid 
    AND lead_investidor_id = '22222222-2222-2222-2222-222222222222'::uuid;

  IF v_pct_step3 <> 90 THEN
    RAISE EXCEPTION 'Erro no Passo 3: esperado 90, obtido %', v_pct_step3;
  END IF;

  -- 2. Passo 4: Inserir arquivo matrícula e conferir 100%
  DECLARE
    v_user_id uuid;
  BEGIN
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    INSERT INTO public.lead_arquivos (id, lead_id, user_id, tipo, rotulo, nome_original, storage_path)
    VALUES (v_arq_id, '11111111-1111-1111-1111-111111111111'::uuid, v_user_id, 'documento', 'matricula', 'matricula_teste.pdf', 'testes/matricula_teste.pdf');
  END;

  SELECT percentual INTO v_pct_step4_add
  FROM public.compatibilidades 
  WHERE lead_venda_id = '11111111-1111-1111-1111-111111111111'::uuid 
    AND lead_investidor_id = '22222222-2222-2222-2222-222222222222'::uuid;

  IF v_pct_step4_add <> 100 THEN
    RAISE EXCEPTION 'Erro no Passo 4 (inserir matrícula): esperado 100, obtido %', v_pct_step4_add;
  END IF;

  -- 3. Deletar a matrícula e conferir retorno a 90%
  DELETE FROM public.lead_arquivos WHERE id = v_arq_id;

  SELECT percentual INTO v_pct_step4_del
  FROM public.compatibilidades 
  WHERE lead_venda_id = '11111111-1111-1111-1111-111111111111'::uuid 
    AND lead_investidor_id = '22222222-2222-2222-2222-222222222222'::uuid;

  IF v_pct_step4_del <> 90 THEN
    RAISE EXCEPTION 'Erro no Passo 4 (deletar matrícula): esperado 90, obtido %', v_pct_step4_del;
  END IF;

  -- 4. Passo 5: Conferir 5 critérios com pesos somando 100
  SELECT jsonb_array_length(criterios) INTO v_count_criterios
  FROM public.compatibilidades 
  WHERE lead_venda_id = '11111111-1111-1111-1111-111111111111'::uuid 
    AND lead_investidor_id = '22222222-2222-2222-2222-222222222222'::uuid;

  IF v_count_criterios <> 5 THEN
    RAISE EXCEPTION 'Erro no Passo 5: total de critérios diferente de 5: %', v_count_criterios;
  END IF;

  SELECT SUM((elem->>'peso')::integer) INTO v_soma_pesos
  FROM public.compatibilidades,
       jsonb_array_elements(criterios) AS elem
  WHERE lead_venda_id = '11111111-1111-1111-1111-111111111111'::uuid 
    AND lead_investidor_id = '22222222-2222-2222-2222-222222222222'::uuid;

  IF v_soma_pesos <> 100 THEN
    RAISE EXCEPTION 'Erro no Passo 5: soma dos pesos diferente de 100: %', v_soma_pesos;
  END IF;

  -- 5. Passo 6: Remover todos os dados de teste e conferir cascata
  DELETE FROM public.leads_venda WHERE id = '11111111-1111-1111-1111-111111111111'::uuid;
  DELETE FROM public.leads_investidor WHERE id = '22222222-2222-2222-2222-222222222222'::uuid;

  IF EXISTS (
    SELECT 1 FROM public.compatibilidades 
    WHERE lead_venda_id = '11111111-1111-1111-1111-111111111111'::uuid 
       OR lead_investidor_id = '22222222-2222-2222-2222-222222222222'::uuid
  ) THEN
    RAISE EXCEPTION 'Erro no Passo 6: compatibilidades não foram apagadas em cascata';
  END IF;

  RAISE NOTICE 'VALIDAÇÃO MANUAL CONCLUÍDA COM SUCESSO: TODOS OS 6 PASSOS VALIDADOS!';
END $$;
