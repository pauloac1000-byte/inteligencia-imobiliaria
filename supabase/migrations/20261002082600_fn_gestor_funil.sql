-- Migration: Ajuste da função RPC fn_gestor_funil para agregação robusta e eficiente
-- Retorna os dados agrupados por rota ('geral', 'proprietario', 'investidor')
-- E pelas 5 etapas exatas pedidas:
-- 1. Visitantes (hero_exibicao)
-- 2. Cliques em CTA (clique_quero_vender + clique_quero_investir)
-- 3. Formulários Iniciados (formulario_iniciado)
-- 4. Etapa 1 Concluída (etapa1_concluida)
-- 5. Cadastros Completos (cadastro_completo)

CREATE OR REPLACE FUNCTION public.fn_gestor_funil(p_dias int DEFAULT 30)
RETURNS TABLE(
  rota_filtro text,
  etapa_id text,
  etapa_ordem int,
  etapa_nome text,
  sessoes_unicas bigint,
  total_eventos bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_limite_data timestamptz;
BEGIN
  IF NOT public.fn_is_gestor() THEN
    RAISE EXCEPTION 'Acesso negado: apenas gestores podem visualizar as métricas do funil.';
  END IF;

  v_limite_data := NOW() - (COALESCE(p_dias, 30) || ' days')::interval;

  RETURN QUERY
  WITH eventos_filtrados AS (
    SELECT 
      ef.tipo_evento,
      ef.sessao_id,
      ef.criado_em,
      CASE 
        WHEN ef.tipo_evento = 'clique_quero_vender' THEN 'proprietario'
        WHEN ef.tipo_evento = 'etapa1_concluida' THEN 'proprietario'
        WHEN ef.rota = '/calculadora' OR (ef.detalhe->>'origem') = 'calculadora' THEN 'proprietario'
        WHEN (ef.detalhe->>'origem') IN ('modal_proprietario', 'secao_para_vender', 'hero_cta_primario', 'dois_caminhos_vender', 'final_cta_vender') THEN 'proprietario'

        WHEN ef.tipo_evento = 'clique_quero_investir' THEN 'investidor'
        WHEN ef.rota = '/simulador-de-retorno' OR (ef.detalhe->>'origem') = 'simulador' THEN 'investidor'
        WHEN (ef.detalhe->>'origem') IN ('modal_investidor', 'secao_para_investir', 'hero_cta_secundario', 'dois_caminhos_investir', 'final_cta_investir', 'termometro_configurar_tese') THEN 'investidor'

        ELSE 'geral'
      END AS rota_evento
    FROM public.eventos_funil ef
    WHERE ef.criado_em >= v_limite_data
  ),
  etapas_config AS (
    SELECT 'visitantes'::text AS e_id, 1 AS e_ordem, 'Visitantes'::text AS e_nome
    UNION ALL SELECT 'cliques_cta'::text, 2, 'Cliques em CTA'::text
    UNION ALL SELECT 'formularios_iniciados'::text, 3, 'Formulários Iniciados'::text
    UNION ALL SELECT 'etapa1_concluida'::text, 4, 'Etapa 1 Concluída'::text
    UNION ALL SELECT 'cadastros_completos'::text, 5, 'Cadastros Completos'::text
  ),
  rotas_config AS (
    SELECT 'geral'::text AS r
    UNION ALL SELECT 'proprietario'::text
    UNION ALL SELECT 'investidor'::text
  ),
  grade AS (
    SELECT r.r AS rota_filtro, e.e_id AS etapa_id, e.e_ordem AS etapa_ordem, e.e_nome AS etapa_nome
    FROM rotas_config r
    CROSS JOIN etapas_config e
  ),
  visitantes_total AS (
    SELECT COUNT(DISTINCT sessao_id) AS sessoes, COUNT(*) AS eventos
    FROM eventos_filtrados
    WHERE tipo_evento = 'hero_exibicao'
  ),
  agregados AS (
    -- Etapa 1: Visitantes
    SELECT 
      r.r AS rota_filtro,
      'visitantes'::text AS etapa_id,
      1 AS etapa_ordem,
      'Visitantes'::text AS etapa_nome,
      COALESCE((SELECT sessoes FROM visitantes_total), 0)::bigint AS sessoes_unicas,
      COALESCE((SELECT eventos FROM visitantes_total), 0)::bigint AS total_eventos
    FROM rotas_config r

    UNION ALL

    -- Etapa 2: Cliques em CTA
    -- Geral: soma de clique_quero_vender + clique_quero_investir
    -- Proprietário: clique_quero_vender
    -- Investidor: clique_quero_investir
    SELECT 
      'geral' AS rota_filtro,
      'cliques_cta' AS etapa_id,
      2 AS etapa_ordem,
      'Cliques em CTA' AS etapa_nome,
      COUNT(DISTINCT sessao_id)::bigint AS sessoes_unicas,
      COUNT(*)::bigint AS total_eventos
    FROM eventos_filtrados
    WHERE tipo_evento IN ('clique_quero_vender', 'clique_quero_investir')

    UNION ALL

    SELECT 
      'proprietario' AS rota_filtro,
      'cliques_cta' AS etapa_id,
      2 AS etapa_ordem,
      'Cliques em CTA' AS etapa_nome,
      COUNT(DISTINCT sessao_id)::bigint AS sessoes_unicas,
      COUNT(*)::bigint AS total_eventos
    FROM eventos_filtrados
    WHERE tipo_evento = 'clique_quero_vender'

    UNION ALL

    SELECT 
      'investidor' AS rota_filtro,
      'cliques_cta' AS etapa_id,
      2 AS etapa_ordem,
      'Cliques em CTA' AS etapa_nome,
      COUNT(DISTINCT sessao_id)::bigint AS sessoes_unicas,
      COUNT(*)::bigint AS total_eventos
    FROM eventos_filtrados
    WHERE tipo_evento = 'clique_quero_investir'

    UNION ALL

    -- Etapa 3: Formulários Iniciados
    SELECT 
      'geral' AS rota_filtro,
      'formularios_iniciados' AS etapa_id,
      3 AS etapa_ordem,
      'Formulários Iniciados' AS etapa_nome,
      COUNT(DISTINCT sessao_id)::bigint AS sessoes_unicas,
      COUNT(*)::bigint AS total_eventos
    FROM eventos_filtrados
    WHERE tipo_evento = 'formulario_iniciado'

    UNION ALL

    SELECT 
      'proprietario' AS rota_filtro,
      'formularios_iniciados' AS etapa_id,
      3 AS etapa_ordem,
      'Formulários Iniciados' AS etapa_nome,
      COUNT(DISTINCT sessao_id)::bigint AS sessoes_unicas,
      COUNT(*)::bigint AS total_eventos
    FROM eventos_filtrados
    WHERE tipo_evento = 'formulario_iniciado' AND rota_evento = 'proprietario'

    UNION ALL

    SELECT 
      'investidor' AS rota_filtro,
      'formularios_iniciados' AS etapa_id,
      3 AS etapa_ordem,
      'Formulários Iniciados' AS etapa_nome,
      COUNT(DISTINCT sessao_id)::bigint AS sessoes_unicas,
      COUNT(*)::bigint AS total_eventos
    FROM eventos_filtrados
    WHERE tipo_evento = 'formulario_iniciado' AND rota_evento = 'investidor'

    UNION ALL

    -- Etapa 4: Etapa 1 Concluída
    SELECT 
      'geral' AS rota_filtro,
      'etapa1_concluida' AS etapa_id,
      4 AS etapa_ordem,
      'Etapa 1 Concluída' AS etapa_nome,
      COUNT(DISTINCT sessao_id)::bigint AS sessoes_unicas,
      COUNT(*)::bigint AS total_eventos
    FROM eventos_filtrados
    WHERE tipo_evento = 'etapa1_concluida'

    UNION ALL

    SELECT 
      'proprietario' AS rota_filtro,
      'etapa1_concluida' AS etapa_id,
      4 AS etapa_ordem,
      'Etapa 1 Concluída' AS etapa_nome,
      COUNT(DISTINCT sessao_id)::bigint AS sessoes_unicas,
      COUNT(*)::bigint AS total_eventos
    FROM eventos_filtrados
    WHERE tipo_evento = 'etapa1_concluida'

    UNION ALL

    SELECT 
      'investidor' AS rota_filtro,
      'etapa1_concluida' AS etapa_id,
      4 AS etapa_ordem,
      'Etapa 1 Concluída' AS etapa_nome,
      0::bigint AS sessoes_unicas,
      0::bigint AS total_eventos

    UNION ALL

    -- Etapa 5: Cadastros Completos
    SELECT 
      'geral' AS rota_filtro,
      'cadastros_completos' AS etapa_id,
      5 AS etapa_ordem,
      'Cadastros Completos' AS etapa_nome,
      COUNT(DISTINCT sessao_id)::bigint AS sessoes_unicas,
      COUNT(*)::bigint AS total_eventos
    FROM eventos_filtrados
    WHERE tipo_evento = 'cadastro_completo'

    UNION ALL

    SELECT 
      'proprietario' AS rota_filtro,
      'cadastros_completos' AS etapa_id,
      5 AS etapa_ordem,
      'Cadastros Completos' AS etapa_nome,
      COUNT(DISTINCT sessao_id)::bigint AS sessoes_unicas,
      COUNT(*)::bigint AS total_eventos
    FROM eventos_filtrados
    WHERE tipo_evento = 'cadastro_completo' AND rota_evento = 'proprietario'

    UNION ALL

    SELECT 
      'investidor' AS rota_filtro,
      'cadastros_completos' AS etapa_id,
      5 AS etapa_ordem,
      'Cadastros Completos' AS etapa_nome,
      COUNT(DISTINCT sessao_id)::bigint AS sessoes_unicas,
      COUNT(*)::bigint AS total_eventos
    FROM eventos_filtrados
    WHERE tipo_evento = 'cadastro_completo' AND rota_evento = 'investidor'
  )
  SELECT 
    g.rota_filtro,
    g.etapa_id,
    g.etapa_ordem,
    g.etapa_nome,
    COALESCE(a.sessoes_unicas, 0)::bigint AS sessoes_unicas,
    COALESCE(a.total_eventos, 0)::bigint AS total_eventos
  FROM grade g
  LEFT JOIN agregados a ON a.rota_filtro = g.rota_filtro AND a.etapa_id = g.etapa_id
  ORDER BY g.rota_filtro, g.etapa_ordem;

END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_gestor_funil(int) TO authenticated;
