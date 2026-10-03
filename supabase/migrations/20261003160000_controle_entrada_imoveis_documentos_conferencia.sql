-- Migration: 20261003160000_controle_entrada_imoveis_documentos_conferencia.sql
-- Descrição: Controle de entrada no motor de compatibilidade (autorização assinada + documentos conferidos)
-- 1. Ciclo de status estendido: rascunho, em análise, ativo, em negociação, vendido, retirado, expirado
-- 2. Tabela lead_documentos_conferencia para checklist auditável por documento (conferido / recusado com motivo)
-- 3. Campos da autorização de venda: comissao_percentual (6 a 8), quem_paga (vendedor/comprador/dividido), prazo_autorizacao, procuracao_necessaria
-- 4. Extensão do constraint de rotulos em lead_arquivos e RLS para gestor ler e gerar URL assinada
-- 5. Motor de compatibilidade: apenas imóveis em estado 'ativo' geram/mantêm compatibilidade; não-ativos removem registros
-- 6. RPCs para conferência do gestor, ativação com validação estrita e consulta protegida

-- ==============================================================================
-- 1. EXTENSÃO E PADRONIZAÇÃO DE STATUS EM leads_venda
-- ==============================================================================

-- Desabilitar temporariamente trigger de validação durante o mapeamento de status legado
ALTER TABLE public.leads_venda DISABLE TRIGGER trg_validar_lead_venda;

-- Remover constraint antigo se houver
ALTER TABLE public.leads_venda DROP CONSTRAINT IF EXISTS leads_venda_status_check;

-- Mapear status legados 'Recebido' -> 'em análise', 'Com compatibilidade' -> 'ativo' (ou manter conforme regra)
UPDATE public.leads_venda
SET status = 'em análise'
WHERE LOWER(TRIM(status)) IN ('recebido', 'em analise', 'em_analise');

UPDATE public.leads_venda
SET status = 'ativo'
WHERE LOWER(TRIM(status)) IN ('ativo', 'com compatibilidade', 'com_compatibilidade');

UPDATE public.leads_venda
SET status = 'em negociação'
WHERE LOWER(TRIM(status)) IN ('em negociacao', 'em negociação', 'em_negociacao');

-- Default agora é 'em análise'
ALTER TABLE public.leads_venda ALTER COLUMN status SET DEFAULT 'em análise';

-- Constraint de status permitidos: rascunho, em análise, ativo, em negociação, vendido, retirado, expirado
ALTER TABLE public.leads_venda
  ADD CONSTRAINT leads_venda_status_check
  CHECK (status IN ('rascunho', 'em análise', 'ativo', 'em negociação', 'vendido', 'retirado', 'expirado'));

-- Reabilitar trigger de validação
ALTER TABLE public.leads_venda ENABLE TRIGGER trg_validar_lead_venda;

-- Adicionar colunas da autorização de venda e procuração em leads_venda
ALTER TABLE public.leads_venda
  ADD COLUMN IF NOT EXISTS autorizacao_comissao_percentual NUMERIC(4,2) DEFAULT 6.00,
  ADD COLUMN IF NOT EXISTS autorizacao_quem_paga TEXT DEFAULT 'vendedor',
  ADD COLUMN IF NOT EXISTS autorizacao_prazo DATE,
  ADD COLUMN IF NOT EXISTS autorizacao_assinada_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS procuracao_necessaria BOOLEAN NOT NULL DEFAULT FALSE;

-- Constraint de comissão entre 6% e 8% quando informada
ALTER TABLE public.leads_venda DROP CONSTRAINT IF EXISTS leads_venda_comissao_check;
ALTER TABLE public.leads_venda
  ADD CONSTRAINT leads_venda_comissao_check
  CHECK (
    autorizacao_comissao_percentual IS NULL
    OR (autorizacao_comissao_percentual >= 6.00 AND autorizacao_comissao_percentual <= 8.00)
  );

-- Constraint de quem paga a comissão
ALTER TABLE public.leads_venda DROP CONSTRAINT IF EXISTS leads_venda_quem_paga_check;
ALTER TABLE public.leads_venda
  ADD CONSTRAINT leads_venda_quem_paga_check
  CHECK (
    autorizacao_quem_paga IS NULL
    OR autorizacao_quem_paga IN ('vendedor', 'comprador', 'dividido')
  );

-- ==============================================================================
-- 2. EXTENSÃO DE RÓTULOS EM lead_arquivos
-- ==============================================================================

-- Remover constraint antigo de rotulo
ALTER TABLE public.lead_arquivos DROP CONSTRAINT IF EXISTS lead_arquivos_rotulo_check;

-- Rótulos permitidos:
-- autorizacao_venda, rg_cpf, estado_civil, matricula, iptu, procuracao, certidao (legado/outros)
ALTER TABLE public.lead_arquivos
  ADD CONSTRAINT lead_arquivos_rotulo_check
  CHECK (
    rotulo IS NULL OR rotulo IN (
      'autorizacao_venda',
      'rg_cpf',
      'estado_civil',
      'matricula',
      'iptu',
      'procuracao',
      'certidao'
    )
  );

-- Adicionar coluna opcional para data de emissao no caso de matricula
ALTER TABLE public.lead_arquivos
  ADD COLUMN IF NOT EXISTS data_emissao DATE;

-- RLS para gestor ler todos os registros em lead_arquivos
DROP POLICY IF EXISTS "lead_arquivos_gestor_select" ON public.lead_arquivos;
CREATE POLICY "lead_arquivos_gestor_select"
  ON public.lead_arquivos
  FOR SELECT
  TO authenticated
  USING (public.fn_is_gestor());

-- RLS de Storage para o gestor poder ler / gerar URL assinada de arquivos no bucket 'imoveis'
DROP POLICY IF EXISTS "storage_imoveis_gestor_select" ON storage.objects;
CREATE POLICY "storage_imoveis_gestor_select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'imoveis'
    AND public.fn_is_gestor()
  );

-- ==============================================================================
-- 3. TABELA lead_documentos_conferencia (CHECKLIST DO GESTOR POR IMÓVEL)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.lead_documentos_conferencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_venda_id UUID NOT NULL REFERENCES public.leads_venda(id) ON DELETE CASCADE,
  tipo_documento TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  obrigatorio BOOLEAN NOT NULL DEFAULT TRUE,
  motivo_recusa TEXT,
  arquivo_id UUID REFERENCES public.lead_arquivos(id) ON DELETE SET NULL,
  conferido_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  conferido_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_lead_doc_tipo UNIQUE (lead_venda_id, tipo_documento),
  CONSTRAINT chk_status_conferencia CHECK (status IN ('pendente', 'enviado', 'conferido', 'recusado')),
  CONSTRAINT chk_tipo_documento CHECK (tipo_documento IN (
    'autorizacao_venda',
    'rg_cpf',
    'estado_civil',
    'matricula',
    'iptu',
    'procuracao'
  ))
);

ALTER TABLE public.lead_documentos_conferencia ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_lead_doc_conf_lead ON public.lead_documentos_conferencia(lead_venda_id);
CREATE INDEX IF NOT EXISTS idx_lead_doc_conf_status ON public.lead_documentos_conferencia(status);

-- RLS para conferência:
-- 1) Gestor pode fazer SELECT, INSERT, UPDATE, DELETE em tudo
DROP POLICY IF EXISTS "lead_doc_conf_gestor_all" ON public.lead_documentos_conferencia;
CREATE POLICY "lead_doc_conf_gestor_all"
  ON public.lead_documentos_conferencia
  FOR ALL
  TO authenticated
  USING (public.fn_is_gestor())
  WITH CHECK (public.fn_is_gestor());

-- 2) Proprietário pode ler apenas o status de conferência dos seus próprios imóveis
DROP POLICY IF EXISTS "lead_doc_conf_owner_select" ON public.lead_documentos_conferencia;
CREATE POLICY "lead_doc_conf_owner_select"
  ON public.lead_documentos_conferencia
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads_venda lv
      WHERE lv.id = lead_documentos_conferencia.lead_venda_id
        AND lv.user_id = auth.uid()
    )
  );

-- ==============================================================================
-- 4. FUNÇÕES DE INICIALIZAÇÃO E SINCRONIZAÇÃO DO CHECKLIST
-- ==============================================================================

-- Função para garantir a existência dos 6 itens de checklist para um lead de venda
CREATE OR REPLACE FUNCTION public.fn_inicializar_checklist_documentos(p_lead_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_procuracao_req BOOLEAN;
BEGIN
  SELECT procuracao_necessaria INTO v_procuracao_req
  FROM public.leads_venda
  WHERE id = p_lead_id;

  v_procuracao_req := COALESCE(v_procuracao_req, FALSE);

  -- 1. autorizacao_venda (obrigatório)
  INSERT INTO public.lead_documentos_conferencia (lead_venda_id, tipo_documento, obrigatorio, status)
  VALUES (p_lead_id, 'autorizacao_venda', TRUE, 'pendente')
  ON CONFLICT (lead_venda_id, tipo_documento) DO NOTHING;

  -- 2. rg_cpf (obrigatório)
  INSERT INTO public.lead_documentos_conferencia (lead_venda_id, tipo_documento, obrigatorio, status)
  VALUES (p_lead_id, 'rg_cpf', TRUE, 'pendente')
  ON CONFLICT (lead_venda_id, tipo_documento) DO NOTHING;

  -- 3. estado_civil (obrigatório)
  INSERT INTO public.lead_documentos_conferencia (lead_venda_id, tipo_documento, obrigatorio, status)
  VALUES (p_lead_id, 'estado_civil', TRUE, 'pendente')
  ON CONFLICT (lead_venda_id, tipo_documento) DO NOTHING;

  -- 4. matricula (obrigatório)
  INSERT INTO public.lead_documentos_conferencia (lead_venda_id, tipo_documento, obrigatorio, status)
  VALUES (p_lead_id, 'matricula', TRUE, 'pendente')
  ON CONFLICT (lead_venda_id, tipo_documento) DO NOTHING;

  -- 5. iptu (obrigatório)
  INSERT INTO public.lead_documentos_conferencia (lead_venda_id, tipo_documento, obrigatorio, status)
  VALUES (p_lead_id, 'iptu', TRUE, 'pendente')
  ON CONFLICT (lead_venda_id, tipo_documento) DO NOTHING;

  -- 6. procuracao (obrigatório SOMENTE se procuracao_necessaria = true)
  INSERT INTO public.lead_documentos_conferencia (lead_venda_id, tipo_documento, obrigatorio, status)
  VALUES (p_lead_id, 'procuracao', v_procuracao_req, 'pendente')
  ON CONFLICT (lead_venda_id, tipo_documento) DO UPDATE
    SET obrigatorio = v_procuracao_req;
END;
$$;

-- Trigger para atualizar status para 'enviado' quando proprietário sobe arquivo em lead_arquivos
CREATE OR REPLACE FUNCTION public.trg_sincronizar_arquivo_conferencia()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead_id UUID;
  v_rotulo TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_lead_id := OLD.lead_id;
    v_rotulo := OLD.rotulo;

    -- Se não houver mais nenhum arquivo deste rótulo, volta para pendente se não estava já recusado
    IF v_rotulo IS NOT NULL AND v_lead_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.lead_arquivos 
        WHERE lead_id = v_lead_id AND rotulo = v_rotulo
      ) THEN
        UPDATE public.lead_documentos_conferencia
        SET status = 'pendente',
            arquivo_id = NULL,
            atualizado_em = NOW()
        WHERE lead_venda_id = v_lead_id 
          AND tipo_documento = v_rotulo
          AND status IN ('enviado');
      END IF;
    END IF;
    RETURN OLD;
  ELSE
    v_lead_id := NEW.lead_id;
    v_rotulo := NEW.rotulo;

    IF v_rotulo IS NOT NULL AND v_rotulo IN (
      'autorizacao_venda', 'rg_cpf', 'estado_civil', 'matricula', 'iptu', 'procuracao'
    ) THEN
      -- Garante que o checklist existe
      PERFORM public.fn_inicializar_checklist_documentos(v_lead_id);

      -- Se estava pendente ou recusado, com novo envio muda para 'enviado'
      UPDATE public.lead_documentos_conferencia
      SET status = CASE WHEN status = 'conferido' THEN 'conferido' ELSE 'enviado' END,
          arquivo_id = NEW.id,
          motivo_recusa = CASE WHEN status = 'conferido' THEN motivo_recusa ELSE NULL END,
          atualizado_em = NOW()
      WHERE lead_venda_id = v_lead_id 
        AND tipo_documento = v_rotulo;
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_lead_arquivos_sinc_conferencia ON public.lead_arquivos;
CREATE TRIGGER trg_lead_arquivos_sinc_conferencia
  AFTER INSERT OR UPDATE OR DELETE ON public.lead_arquivos
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sincronizar_arquivo_conferencia();

-- ==============================================================================
-- 5. RECALCULO DE COMPATIBILIDADE RESTRITO A IMÓVEIS "ativo"
-- ==============================================================================

-- 5.1. Recalcula um par específico (lead_venda_id, lead_investidor_id)
CREATE OR REPLACE FUNCTION public.fn_recalcular_compatibilidade_par(
  p_lead_venda_id UUID,
  p_lead_investidor_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_res RECORD;
  v_status_imovel TEXT;
BEGIN
  -- Regra mandatória do usuário: apenas imóveis em estado 'ativo' entram no motor de compatibilidade.
  SELECT status INTO v_status_imovel
  FROM public.leads_venda
  WHERE id = p_lead_venda_id;

  IF v_status_imovel IS NULL OR LOWER(TRIM(v_status_imovel)) <> 'ativo' THEN
    -- Imóvel não é ativo: remove qualquer compatibilidade existente para manter consistência absoluta
    DELETE FROM public.compatibilidades
    WHERE lead_venda_id = p_lead_venda_id AND lead_investidor_id = p_lead_investidor_id;

    BEGIN
      DELETE FROM public.compatibilidade_imovel_tese
      WHERE lead_venda_id = p_lead_venda_id AND lead_investidor_id = p_lead_investidor_id;
    EXCEPTION WHEN OTHERS THEN
    END;

    RETURN 0;
  END IF;

  -- Se for 'ativo', executa o cálculo determinístico de 5 critérios
  SELECT * INTO v_res 
  FROM public.fn_calcular_compatibilidade_detalhada(p_lead_venda_id, p_lead_investidor_id);

  -- Grava na tabela public.compatibilidades
  INSERT INTO public.compatibilidades (
    lead_venda_id,
    lead_investidor_id,
    percentual,
    criterios,
    criterios_atendidos,
    criterios_nao_atendidos,
    atualizado_em
  )
  VALUES (
    p_lead_venda_id,
    p_lead_investidor_id,
    v_res.percentual,
    v_res.criterios,
    v_res.criterios_atendidos,
    v_res.criterios_nao_atendidos,
    NOW()
  )
  ON CONFLICT (lead_venda_id, lead_investidor_id)
  DO UPDATE SET
    percentual = EXCLUDED.percentual,
    criterios = EXCLUDED.criterios,
    criterios_atendidos = EXCLUDED.criterios_atendidos,
    criterios_nao_atendidos = EXCLUDED.criterios_nao_atendidos,
    atualizado_em = NOW();

  -- Mantém também sincronizada a tabela compatibilidade_imovel_tese
  BEGIN
    INSERT INTO public.compatibilidade_imovel_tese (
      lead_venda_id,
      lead_investidor_id,
      percentual,
      criterios_atendidos,
      criterios_nao_atendidos,
      atualizado_em
    )
    VALUES (
      p_lead_venda_id,
      p_lead_investidor_id,
      v_res.percentual::NUMERIC(5,2),
      v_res.criterios_atendidos,
      v_res.criterios_nao_atendidos,
      NOW()
    )
    ON CONFLICT (lead_venda_id, lead_investidor_id)
    DO UPDATE SET
      percentual = EXCLUDED.percentual,
      criterios_atendidos = EXCLUDED.criterios_atendidos,
      criterios_nao_atendidos = EXCLUDED.criterios_nao_atendidos,
      atualizado_em = NOW();
  EXCEPTION WHEN OTHERS THEN
  END;

  RETURN v_res.percentual;
END;
$$;

-- 5.2. Recalcula um imóvel contra todas as teses de investidores
CREATE OR REPLACE FUNCTION public.fn_recalcular_compatibilidade_lead_venda(
  p_lead_venda_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r_investidor RECORD;
  v_count INTEGER := 0;
  v_status_imovel TEXT;
BEGIN
  SELECT status INTO v_status_imovel
  FROM public.leads_venda
  WHERE id = p_lead_venda_id;

  -- Se o imóvel não está ativo, limpa pares existentes e encerra
  IF v_status_imovel IS NULL OR LOWER(TRIM(v_status_imovel)) <> 'ativo' THEN
    DELETE FROM public.compatibilidades WHERE lead_venda_id = p_lead_venda_id;
    BEGIN
      DELETE FROM public.compatibilidade_imovel_tese WHERE lead_venda_id = p_lead_venda_id;
    EXCEPTION WHEN OTHERS THEN
    END;
    RETURN 0;
  END IF;

  FOR r_investidor IN 
    SELECT id FROM public.leads_investidor
  LOOP
    PERFORM public.fn_recalcular_compatibilidade_par(p_lead_venda_id, r_investidor.id);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- 5.3. Recalcula uma tese contra apenas imóveis com status 'ativo'
CREATE OR REPLACE FUNCTION public.fn_recalcular_compatibilidade_lead_investidor(
  p_lead_investidor_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r_venda RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Seleciona apenas imóveis ATIVOS
  FOR r_venda IN 
    SELECT id FROM public.leads_venda WHERE LOWER(TRIM(status)) = 'ativo'
  LOOP
    PERFORM public.fn_recalcular_compatibilidade_par(r_venda.id, p_lead_investidor_id);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- Trigger em leads_venda: limpa ou recalcula compatibilidade quando o status mudar
DROP TRIGGER IF EXISTS trg_leads_venda_compatibilidade ON public.leads_venda;
CREATE TRIGGER trg_leads_venda_compatibilidade
  AFTER INSERT OR UPDATE OF tipo_imovel, cidade, valor_estimado, prazo_desejado, status ON public.leads_venda
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_compat_ao_mudar_lead_venda();

-- ==============================================================================
-- 6. ÁREA DO INVESTIDOR: CONTINUA VENDO APENAS IMÓVEIS ATIVOS (E SEM DADOS SENSÍVEIS)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.fn_listar_oportunidades_investidor()
RETURNS TABLE (
  compatibilidade_id UUID,
  lead_venda_id UUID,
  lead_investidor_id UUID,
  percentual INTEGER,
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
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso restrito a investidores autenticados.';
  END IF;

  RETURN QUERY
  SELECT 
    c.id AS compatibilidade_id,
    lv.id AS lead_venda_id,
    li.id AS lead_investidor_id,
    c.percentual,
    c.criterios,
    c.criterios_atendidos,
    c.criterios_nao_atendidos,
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
    AND LOWER(TRIM(lv.status)) = 'ativo' -- Só imóveis ativos entram e aparecem
  ORDER BY c.percentual DESC, lv.criado_em DESC;
END;
$$;

-- ==============================================================================
-- 7. RPCS DO GESTOR: CONFERÊNCIA, ATIVAÇÃO E LISTAGEM
-- ==============================================================================

-- 7.1. Gestor decide documento individual (conferir ou recusar com motivo)
CREATE OR REPLACE FUNCTION public.fn_gestor_decidir_documento(
  p_lead_id UUID,
  p_tipo_documento TEXT,
  p_decisao TEXT, -- 'conferido' ou 'recusado'
  p_motivo_recusa TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  lead_venda_id UUID,
  tipo_documento TEXT,
  status TEXT,
  motivo_recusa TEXT,
  conferido_em TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec public.lead_documentos_conferencia;
  v_decisao_norm TEXT;
BEGIN
  IF NOT public.fn_is_gestor() THEN
    RAISE EXCEPTION 'Acesso negado: apenas gestores podem conferir documentos.';
  END IF;

  v_decisao_norm := LOWER(TRIM(p_decisao));
  IF v_decisao_norm NOT IN ('conferido', 'recusado') THEN
    RAISE EXCEPTION 'Decisão inválida: deve ser conferido ou recusado.';
  END IF;

  IF v_decisao_norm = 'recusado' AND (p_motivo_recusa IS NULL OR TRIM(p_motivo_recusa) = '') THEN
    RAISE EXCEPTION 'Para recusar um documento, é obrigatório informar o motivo.';
  END IF;

  PERFORM public.fn_inicializar_checklist_documentos(p_lead_id);

  UPDATE public.lead_documentos_conferencia
  SET status = v_decisao_norm,
      motivo_recusa = CASE WHEN v_decisao_norm = 'recusado' THEN TRIM(p_motivo_recusa) ELSE NULL END,
      conferido_por = auth.uid(),
      conferido_em = NOW(),
      atualizado_em = NOW()
  WHERE lead_venda_id = p_lead_id 
    AND tipo_documento = p_tipo_documento
  RETURNING * INTO v_rec;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item de documento % não encontrado para o lead %.', p_tipo_documento, p_lead_id;
  END IF;

  RETURN QUERY SELECT 
    v_rec.id,
    v_rec.lead_venda_id,
    v_rec.tipo_documento,
    v_rec.status,
    v_rec.motivo_recusa,
    v_rec.conferido_em;
END;
$$;

-- 7.2. Alternar se procuração é necessária (controlado pelo gestor ou dono)
CREATE OR REPLACE FUNCTION public.fn_gestor_toggle_procuracao(
  p_lead_id UUID,
  p_necessaria BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.fn_is_gestor() THEN
    -- Proprietário também pode marcar se outra pessoa assina
    IF NOT EXISTS (
      SELECT 1 FROM public.leads_venda WHERE id = p_lead_id AND user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Acesso negado para alterar procuração deste imóvel.';
    END IF;
  END IF;

  UPDATE public.leads_venda
  SET procuracao_necessaria = p_necessaria
  WHERE id = p_lead_id;

  PERFORM public.fn_inicializar_checklist_documentos(p_lead_id);

  UPDATE public.lead_documentos_conferencia
  SET obrigatorio = p_necessaria,
      atualizado_em = NOW()
  WHERE lead_venda_id = p_lead_id
    AND tipo_documento = 'procuracao';

  RETURN p_necessaria;
END;
$$;

-- 7.3. Gestor ativa imóvel: REGRA ESTRITA - só ativa se todos os obrigatórios forem CONFERIDOS
CREATE OR REPLACE FUNCTION public.fn_gestor_ativar_imovel(
  p_lead_id UUID
)
RETURNS TABLE (
  id UUID,
  protocolo TEXT,
  status TEXT,
  atualizado_em TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.leads_venda;
  v_pendentes_count INTEGER;
  v_nomes_pendentes TEXT;
BEGIN
  IF NOT public.fn_is_gestor() THEN
    RAISE EXCEPTION 'Acesso negado: apenas o gestor pode mudar um imóvel para ativo.';
  END IF;

  SELECT * INTO v_lead FROM public.leads_venda WHERE id = p_lead_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead de venda não encontrado: %', p_lead_id;
  END IF;

  -- Garante checklist inicializado
  PERFORM public.fn_inicializar_checklist_documentos(p_lead_id);

  -- Verifica se há documentos obrigatórios não conferidos
  -- (procuração só conta quando obrigatorio = TRUE)
  SELECT 
    COUNT(*),
    STRING_AGG(tipo_documento, ', ')
  INTO 
    v_pendentes_count,
    v_nomes_pendentes
  FROM public.lead_documentos_conferencia
  WHERE lead_venda_id = p_lead_id
    AND obrigatorio = TRUE
    AND status <> 'conferido';

  IF v_pendentes_count > 0 THEN
    RAISE EXCEPTION 'Não é possível ativar o imóvel. Os seguintes documentos obrigatórios ainda não foram conferidos: %', v_nomes_pendentes;
  END IF;

  -- Atualiza status para 'ativo'
  UPDATE public.leads_venda
  SET status = 'ativo'
  WHERE id = p_lead_id
  RETURNING * INTO v_lead;

  -- Dispara o recálculo imediato de compatibilidade para fazer o imóvel entrar no motor
  PERFORM public.fn_recalcular_compatibilidade_lead_venda(p_lead_id);

  RETURN QUERY SELECT v_lead.id, v_lead.protocolo, v_lead.status, NOW();
END;
$$;

-- 7.4. Gestor atualiza status geral do lead com controle de ativação
CREATE OR REPLACE FUNCTION public.fn_gestor_atualizar_status_lead(
  p_lead_id UUID,
  p_novo_status TEXT
)
RETURNS TABLE (
  id UUID,
  protocolo TEXT,
  status TEXT,
  atualizado_em TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.leads_venda;
  v_status_normalizado TEXT;
BEGIN
  IF NOT public.fn_is_gestor() THEN
    RAISE EXCEPTION 'Acesso negado: apenas gestores podem atualizar status de leads.';
  END IF;

  v_status_normalizado := LOWER(TRIM(p_novo_status));

  -- Mapeamento / normalização
  IF v_status_normalizado IN ('rascunho') THEN
    v_status_normalizado := 'rascunho';
  ELSIF v_status_normalizado IN ('recebido', 'em análise', 'em analise', 'em_analise') THEN
    v_status_normalizado := 'em análise';
  ELSIF v_status_normalizado IN ('ativo', 'com compatibilidade', 'com_compatibilidade') THEN
    -- Mudar para 'ativo' exige validação de documentos conferidos
    RETURN QUERY SELECT * FROM public.fn_gestor_ativar_imovel(p_lead_id);
    RETURN;
  ELSIF v_status_normalizado IN ('em negociação', 'em negociacao', 'em_negociacao') THEN
    v_status_normalizado := 'em negociação';
  ELSIF v_status_normalizado IN ('vendido') THEN
    v_status_normalizado := 'vendido';
  ELSIF v_status_normalizado IN ('retirado') THEN
    v_status_normalizado := 'retirado';
  ELSIF v_status_normalizado IN ('expirado') THEN
    v_status_normalizado := 'expirado';
  ELSE
    RAISE EXCEPTION 'Status inválido: %', p_novo_status;
  END IF;

  UPDATE public.leads_venda
  SET status = v_status_normalizado
  WHERE public.leads_venda.id = p_lead_id
  RETURNING * INTO v_lead;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead de venda não encontrado para o ID %', p_lead_id;
  END IF;

  -- Se não for 'ativo', limpa compatibilidade se houver
  IF v_status_normalizado <> 'ativo' THEN
    PERFORM public.fn_recalcular_compatibilidade_lead_venda(p_lead_id);
  END IF;

  RETURN QUERY SELECT v_lead.id, v_lead.protocolo, v_lead.status, NOW();
END;
$$;

-- 7.5. RPC para buscar o checklist de documentos de um lead (usado pelo gestor e pelo proprietário)
CREATE OR REPLACE FUNCTION public.fn_obter_documentos_conferencia(p_lead_id UUID)
RETURNS TABLE (
  id UUID,
  lead_venda_id UUID,
  tipo_documento TEXT,
  status TEXT,
  obrigatorio BOOLEAN,
  motivo_recusa TEXT,
  arquivo_id UUID,
  arquivo_nome TEXT,
  arquivo_storage_path TEXT,
  arquivo_data_emissao DATE,
  conferido_em TIMESTAMPTZ,
  atualizado_em TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Permite apenas gestores ou o próprio proprietário do imóvel
  IF NOT public.fn_is_gestor() THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.leads_venda WHERE id = p_lead_id AND user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Acesso negado para consultar documentos deste imóvel.';
    END IF;
  END IF;

  -- Garante inicialização
  PERFORM public.fn_inicializar_checklist_documentos(p_lead_id);

  RETURN QUERY
  SELECT 
    c.id,
    c.lead_venda_id,
    c.tipo_documento,
    c.status,
    c.obrigatorio,
    c.motivo_recusa,
    la.id AS arquivo_id,
    la.nome_original AS arquivo_nome,
    la.storage_path AS arquivo_storage_path,
    la.data_emissao AS arquivo_data_emissao,
    c.conferido_em,
    c.atualizado_em
  FROM public.lead_documentos_conferencia c
  LEFT JOIN LATERAL (
    SELECT id, nome_original, storage_path, data_emissao
    FROM public.lead_arquivos
    WHERE lead_id = c.lead_venda_id 
      AND rotulo = c.tipo_documento
    ORDER BY criado_em DESC
    LIMIT 1
  ) la ON true
  WHERE c.lead_venda_id = p_lead_id
  ORDER BY 
    CASE c.tipo_documento
      WHEN 'autorizacao_venda' THEN 1
      WHEN 'rg_cpf' THEN 2
      WHEN 'estado_civil' THEN 3
      WHEN 'matricula' THEN 4
      WHEN 'iptu' THEN 5
      WHEN 'procuracao' THEN 6
      ELSE 7
    END;
END;
$$;

-- 7.6. RPC para o proprietário salvar campos da autorização de venda
CREATE OR REPLACE FUNCTION public.fn_salvar_dados_autorizacao_venda(
  p_lead_id UUID,
  p_comissao_percentual NUMERIC,
  p_quem_paga TEXT,
  p_prazo_autorizacao DATE,
  p_procuracao_necessaria BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Valida acesso do dono ou do gestor
  IF NOT public.fn_is_gestor() THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.leads_venda WHERE id = p_lead_id AND user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Acesso negado para atualizar autorização deste imóvel.';
    END IF;
  END IF;

  IF p_comissao_percentual IS NOT NULL AND (p_comissao_percentual < 6.00 OR p_comissao_percentual > 8.00) THEN
    RAISE EXCEPTION 'O percentual de comissão deve estar entre 6%% e 8%%.';
  END IF;

  IF p_quem_paga IS NOT NULL AND LOWER(p_quem_paga) NOT IN ('vendedor', 'comprador', 'dividido') THEN
    RAISE EXCEPTION 'Quem paga a comissão deve ser vendedor, comprador ou dividido.';
  END IF;

  UPDATE public.leads_venda
  SET autorizacao_comissao_percentual = COALESCE(p_comissao_percentual, 6.00),
      autorizacao_quem_paga = COALESCE(LOWER(p_quem_paga), 'vendedor'),
      autorizacao_prazo = p_prazo_autorizacao,
      autorizacao_assinada_em = NOW(),
      procuracao_necessaria = COALESCE(p_procuracao_necessaria, procuracao_necessaria)
  WHERE id = p_lead_id;

  -- Ajusta obrigatoriedade da procuração no checklist
  PERFORM public.fn_gestor_toggle_procuracao(p_lead_id, COALESCE(p_procuracao_necessaria, FALSE));

  RETURN TRUE;
END;
$$;

-- ==============================================================================
-- 8. ATUALIZAR fn_gestor_listar_leads PARA INCLUIR DADOS DA AUTORIZAÇÃO E CHECKLIST
-- ==============================================================================

DROP FUNCTION IF EXISTS public.fn_gestor_listar_leads();
CREATE OR REPLACE FUNCTION public.fn_gestor_listar_leads()
RETURNS TABLE (
  id UUID,
  rota TEXT,
  protocolo TEXT,
  nome TEXT,
  telefone TEXT,
  email TEXT,
  motivo_venda TEXT,
  prazo_desejado TEXT,
  status TEXT,
  tipo_imovel TEXT,
  cidade TEXT,
  valor_estimado TEXT,
  mensagem TEXT,
  ticket TEXT,
  objetivo TEXT,
  prazo_decisao TEXT,
  cidades_interesse TEXT,
  perfil TEXT,
  user_id UUID,
  criado_em TIMESTAMPTZ,
  alerta_valor TEXT,
  alerta_motivo TEXT,
  preco_pedido NUMERIC,
  area_util NUMERIC,
  area_terreno NUMERIC,
  quartos INTEGER,
  autorizacao_comissao_percentual NUMERIC,
  autorizacao_quem_paga TEXT,
  autorizacao_prazo DATE,
  procuracao_necessaria BOOLEAN,
  total_docs_obrigatorios INTEGER,
  total_docs_conferidos INTEGER,
  apto_para_ativar BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.fn_is_gestor() THEN
    RAISE EXCEPTION 'Acesso negado: apenas gestores podem visualizar os leads.';
  END IF;

  RETURN QUERY
  -- Leads de Proprietário / Venda
  SELECT 
    lv.id,
    COALESCE(lv.rota, 'proprietario') AS rota,
    COALESCE(lv.protocolo, 'KX-0000') AS protocolo,
    lv.nome,
    lv.telefone,
    lv.email,
    lv.motivo_venda,
    lv.prazo_desejado,
    COALESCE(lv.status, 'em análise') AS status,
    lv.tipo_imovel,
    lv.cidade,
    lv.valor_estimado,
    lv.mensagem,
    NULL::TEXT AS ticket,
    NULL::TEXT AS objetivo,
    NULL::TEXT AS prazo_decisao,
    NULL::TEXT AS cidades_interesse,
    NULL::TEXT AS perfil,
    lv.user_id,
    lv.criado_em,
    ag.rotulo AS alerta_valor,
    ag.motivo AS alerta_motivo,
    lv.preco_pedido,
    lv.area_util,
    lv.area_terreno,
    lv.quartos,
    lv.autorizacao_comissao_percentual,
    lv.autorizacao_quem_paga,
    lv.autorizacao_prazo,
    lv.procuracao_necessaria,
    COALESCE(conf_stat.total_obrig, 5)::INTEGER AS total_docs_obrigatorios,
    COALESCE(conf_stat.total_conf, 0)::INTEGER AS total_docs_conferidos,
    (COALESCE(conf_stat.total_obrig, 5) > 0 AND COALESCE(conf_stat.total_obrig, 5) = COALESCE(conf_stat.total_conf, 0))::BOOLEAN AS apto_para_ativar
  FROM public.leads_venda lv
  LEFT JOIN public.alertas_gestor ag ON ag.lead_venda_id = lv.id AND ag.rotulo = 'revisar valor'
  LEFT JOIN LATERAL (
    SELECT 
      COUNT(*) FILTER (WHERE obrigatorio = TRUE) AS total_obrig,
      COUNT(*) FILTER (WHERE obrigatorio = TRUE AND status = 'conferido') AS total_conf
    FROM public.lead_documentos_conferencia
    WHERE lead_venda_id = lv.id
  ) conf_stat ON true

  UNION ALL

  -- Leads de Investidor
  SELECT 
    li.id,
    COALESCE(li.rota, 'investidor') AS rota,
    COALESCE(li.protocolo, 'KX-0000') AS protocolo,
    li.nome,
    li.telefone,
    li.email,
    NULL::TEXT AS motivo_venda,
    NULL::TEXT AS prazo_desejado,
    'Cadastrado'::TEXT AS status,
    NULL::TEXT AS tipo_imovel,
    NULL::TEXT AS cidade,
    NULL::TEXT AS valor_estimado,
    NULL::TEXT AS mensagem,
    li.ticket,
    li.objetivo,
    li.prazo_decisao,
    li.cidades_interesse,
    li.perfil,
    li.user_id,
    li.criado_em,
    NULL::TEXT AS alerta_valor,
    NULL::TEXT AS alerta_motivo,
    li.preco_minimo AS preco_pedido,
    li.min_area_m2 AS area_util,
    li.min_area_terreno_m2 AS area_terreno,
    li.min_quartos AS quartos,
    NULL::NUMERIC AS autorizacao_comissao_percentual,
    NULL::TEXT AS autorizacao_quem_paga,
    NULL::DATE AS autorizacao_prazo,
    FALSE AS procuracao_necessaria,
    0::INTEGER AS total_docs_obrigatorios,
    0::INTEGER AS total_docs_conferidos,
    FALSE AS apto_para_ativar
  FROM public.leads_investidor li

  ORDER BY criado_em DESC;
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION public.fn_inicializar_checklist_documentos(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_gestor_decidir_documento(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_gestor_toggle_procuracao(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_gestor_ativar_imovel(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_gestor_atualizar_status_lead(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_obter_documentos_conferencia(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_salvar_dados_autorizacao_venda(UUID, NUMERIC, TEXT, DATE, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_gestor_listar_leads() TO authenticated;
