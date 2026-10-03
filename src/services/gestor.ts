import { supabase } from '@/lib/supabase/client'
import { StatusImovelLead } from '@/services/profiles'

export interface CriterioCompatibilidadeItem {
  criterio: string
  nome: string
  peso: number
  fator?: number
  atendido: boolean
  pontos: number
  aplicavel?: boolean
  explicacao: string
}

export interface ConfiguracaoPesoItem {
  criterio: string
  nome: string
  peso: number
  descricao?: string | null
  ordem: number
  atualizado_em?: string
}

export interface GestorLeadItem {
  id: string
  rota: 'proprietario' | 'investidor' | string
  protocolo: string
  nome?: string | null
  telefone?: string | null
  email?: string | null
  motivo_venda?: string | null
  prazo_desejado?: string | null
  status?: string | null
  tipo_imovel?: string | null
  cidade?: string | null
  valor_estimado?: string | null
  mensagem?: string | null
  ticket?: string | null
  objetivo?: string | null
  prazo_decisao?: string | null
  cidades_interesse?: string | null
  perfil?: string | null
  user_id?: string | null
  criado_em: string
  alerta_valor?: string | null
  alerta_motivo?: string | null
  preco_pedido?: number | null
  area_util?: number | null
  area_terreno?: number | null
  quartos?: number | null
  autorizacao_comissao_percentual?: number | null
  autorizacao_quem_paga?: string | null
  autorizacao_prazo?: string | null
  procuracao_necessaria?: boolean | null
  total_docs_obrigatorios?: number | null
  total_docs_conferidos?: number | null
  apto_para_ativar?: boolean | null
}
export type StatusMatch = 'pendente' | 'aprovado' | 'descartado'

export interface GestorFunilEtapaItem {
  rota_filtro: 'geral' | 'proprietario' | 'investidor' | string
  etapa_id:
    | 'visitantes'
    | 'cliques_cta'
    | 'formularios_iniciados'
    | 'etapa1_concluida'
    | 'cadastros_completos'
    | string
  etapa_ordem: number
  etapa_nome: string
  sessoes_unicas: number
  total_eventos: number
}

export interface GestorMatchItem {
  compatibilidade_id: string
  percentual: number
  status_match: StatusMatch
  criterios: CriterioCompatibilidadeItem[] | any
  criterios_atendidos: CriterioCompatibilidadeItem[] | any
  criterios_nao_atendidos: CriterioCompatibilidadeItem[] | any
  lead_venda_id: string
  imovel_protocolo: string
  imovel_tipo: string
  imovel_cidade: string
  imovel_valor: string
  imovel_status: string
  imovel_motivo_venda: string
  imovel_prazo_desejado: string
  proprietario_nome: string
  proprietario_telefone: string
  proprietario_email: string
  lead_investidor_id: string
  investidor_protocolo: string
  investidor_ticket: string
  investidor_objetivo: string
  investidor_cidades: string
  investidor_prazo: string
  investidor_nome: string
  investidor_telefone: string
  investidor_email: string
  ja_tem_interesse: boolean
  interesse_status: string
  criado_em: string
  atualizado_em: string
  eliminado?: boolean
  motivo_eliminacao?: string | null
}

/**
 * Verifica se o usuário atual autenticado possui perfil de gestor
 */
export async function verificarSeGestor(): Promise<boolean> {
  try {
    const { data, error } = await (supabase.rpc as any)('fn_is_gestor')
    if (error) {
      console.warn('Erro ao verificar perfil de gestor via RPC:', error.message)
      return false
    }
    return Boolean(data)
  } catch {
    return false
  }
}

/**
 * Lista todos os leads (proprietários e investidores) com dados completos
 */
export async function gestorListarLeads(): Promise<GestorLeadItem[]> {
  try {
    const { data, error } = await (supabase.rpc as any)('fn_gestor_listar_leads')
    if (error) {
      console.error('Erro ao buscar leads no painel do gestor:', error.message)
      throw new Error(error.message)
    }
    return (data || []) as GestorLeadItem[]
  } catch (err: any) {
    console.error('Falha ao listar leads do gestor:', err)
    throw err
  }
}

/**
 * Atualiza o status de um lead de venda (proprietário)
 * Status aceitos: Recebido, Em análise, Com compatibilidade, Em negociação
 */
export async function gestorAtualizarStatusLead(
  leadId: string,
  novoStatus: StatusImovelLead | string,
): Promise<{ id: string; status: string; protocolo: string }> {
  try {
    const { data, error } = await (supabase.rpc as any)('fn_gestor_atualizar_status_lead', {
      p_lead_id: leadId,
      p_novo_status: novoStatus,
    })

    if (error) {
      console.error('Erro ao atualizar status do lead via RPC:', error.message)
      throw new Error(error.message)
    }

    if (Array.isArray(data) && data.length > 0) {
      return data[0]
    }
    return { id: leadId, status: novoStatus, protocolo: '' }
  } catch (err: any) {
    console.error('Falha na persistência do status do lead:', err)
    throw err
  }
}

/**
 * Gestor ativa o imóvel no motor de compatibilidade (validação estrita)
 */
export async function gestorAtivarImovel(
  leadId: string,
): Promise<{ id: string; status: string; protocolo: string }> {
  try {
    const { data, error } = await (supabase.rpc as any)('fn_gestor_ativar_imovel', {
      p_lead_id: leadId,
    })

    if (error) {
      throw new Error(error.message)
    }

    if (Array.isArray(data) && data.length > 0) {
      return data[0]
    }
    return { id: leadId, status: 'ativo', protocolo: '' }
  } catch (err: any) {
    console.error('Falha ao ativar imóvel:', err)
    throw err
  }
}

/**
 * Busca o checklist de documentos de conferência de um imóvel
 */
export async function gestorObterDocumentosConferencia(
  leadId: string,
): Promise<import('./arquivos').DocumentoConferenciaItem[]> {
  try {
    const { data, error } = await (supabase.rpc as any)('fn_obter_documentos_conferencia', {
      p_lead_id: leadId,
    })

    if (error) {
      console.error('Erro ao buscar documentos de conferência:', error.message)
      throw new Error(error.message)
    }

    const docs = (data || []) as import('./arquivos').DocumentoConferenciaItem[]

    // Gera URL assinada para visualização rápida caso tenha storage_path
    const comUrls = await Promise.all(
      docs.map(async (doc) => {
        if (!doc.arquivo_storage_path) return doc
        try {
          const { data: signedData } = await supabase.storage
            .from('imoveis')
            .createSignedUrl(doc.arquivo_storage_path, 3600)
          return {
            ...doc,
            urlAssinada: signedData?.signedUrl,
          }
        } catch {
          return doc
        }
      }),
    )

    return comUrls
  } catch (err: any) {
    console.error('Falha ao carregar checklist de conferência:', err)
    throw err
  }
}

/**
 * Gestor decide sobre documento (conferir ou recusar com motivo)
 */
export async function gestorDecidirDocumento({
  leadId,
  tipoDocumento,
  decisao,
  motivoRecusa,
}: {
  leadId: string
  tipoDocumento: string
  decisao: 'conferido' | 'recusado'
  motivoRecusa?: string
}): Promise<void> {
  const { error } = await (supabase.rpc as any)('fn_gestor_decidir_documento', {
    p_lead_id: leadId,
    p_tipo_documento: tipoDocumento,
    p_decisao: decisao,
    p_motivo_recusa: motivoRecusa || null,
  })

  if (error) {
    throw new Error(error.message)
  }
}

/**
 * Altera se procuração é necessária
 */
export async function gestorToggleProcuracao(
  leadId: string,
  necessaria: boolean,
): Promise<boolean> {
  const { data, error } = await (supabase.rpc as any)('fn_gestor_toggle_procuracao', {
    p_lead_id: leadId,
    p_necessaria: necessaria,
  })

  if (error) {
    throw new Error(error.message)
  }
  return Boolean(data)
}

/**
 * Salva os dados contratuais da autorização de venda (comissão 6-8%, pagador, prazo)
 */
export async function salvarDadosAutorizacaoVenda({
  leadId,
  comissaoPercentual,
  quemPaga,
  prazoAutorizacao,
  procuracaoNecessaria,
}: {
  leadId: string
  comissaoPercentual: number
  quemPaga: 'vendedor' | 'comprador' | 'dividido' | string
  prazoAutorizacao?: string | null
  procuracaoNecessaria?: boolean
}): Promise<boolean> {
  const { data, error } = await (supabase.rpc as any)('fn_salvar_dados_autorizacao_venda', {
    p_lead_id: leadId,
    p_comissao_percentual: comissaoPercentual,
    p_quem_paga: quemPaga,
    p_prazo_autorizacao: prazoAutorizacao || null,
    p_procuracao_necessaria: procuracaoNecessaria ?? false,
  })

  if (error) {
    throw new Error(error.message)
  }
  return Boolean(data)
}

/**
 * Lista todos os matches calculados entre imóveis e teses de investidor,
 * ordenados por percentual decrescente.
 */
export async function gestorListarMatches(): Promise<GestorMatchItem[]> {
  try {
    const { data, error } = await (supabase.rpc as any)('fn_gestor_listar_matches')
    if (error) {
      console.error('Erro ao buscar matches no painel do gestor:', error.message)
      throw new Error(error.message)
    }
    return (data || []) as GestorMatchItem[]
  } catch (err: any) {
    console.error('Falha ao listar matches do gestor:', err)
    throw err
  }
}

/**
 * Aprova ou descarta um match (par imóvel x investidor)
 */
export async function gestorDecidirMatch(
  compatibilidadeId: string,
  acao: 'aprovar' | 'descartar' | 'pendente',
): Promise<{ id: string; status: StatusMatch }> {
  try {
    const { data, error } = await (supabase.rpc as any)('fn_gestor_decidir_match', {
      p_compatibilidade_id: compatibilidadeId,
      p_acao: acao,
    })

    if (error) {
      console.error('Erro ao registrar decisão do match via RPC:', error.message)
      throw new Error(error.message)
    }

    if (Array.isArray(data) && data.length > 0) {
      return data[0]
    }
    return { id: compatibilidadeId, status: acao === 'aprovar' ? 'aprovado' : 'descartado' }
  } catch (err: any) {
    console.error('Falha ao decidir match:', err)
    throw err
  }
}

/**
 * Exporta a lista de leads em formato CSV no navegador (download imediato)
 */
/**
 * Busca as métricas agregadas do funil de conversão por período e rota
 */
export async function gestorObterMetricasFunil(
  dias: 7 | 30 | 90 = 30,
): Promise<GestorFunilEtapaItem[]> {
  try {
    const { data, error } = await (supabase.rpc as any)('fn_gestor_funil', {
      p_dias: dias,
    })

    if (error) {
      console.error('Erro ao buscar métricas do funil via RPC:', error.message)
      throw new Error(error.message)
    }

    return (data || []).map((item: any) => ({
      rota_filtro: item.rota_filtro,
      etapa_id: item.etapa_id,
      etapa_ordem: Number(item.etapa_ordem),
      etapa_nome: item.etapa_nome,
      sessoes_unicas: Number(item.sessoes_unicas || 0),
      total_eventos: Number(item.total_eventos || 0),
    }))
  } catch (err: any) {
    console.error('Falha ao carregar métricas do funil:', err)
    throw err
  }
}

export function exportarLeadsCSV(leads: GestorLeadItem[]): void {
  if (!leads || leads.length === 0) {
    throw new Error('Nenhum lead disponível para exportação.')
  }

  // Cabeçalhos em Português
  const colunas = [
    'Protocolo',
    'Rota',
    'Status',
    'Nome',
    'Telefone',
    'E-mail',
    'Cidade',
    'Tipo de Imóvel',
    'Valor Estimado / Ticket',
    'Motivo da Venda / Objetivo',
    'Prazo Desejado / Decisão',
    'Cidades de Interesse',
    'Mensagem',
    'Data de Cadastro',
  ]

  const formatarCampo = (valor: string | null | undefined): string => {
    if (valor === null || valor === undefined) return '""'
    const texto = String(valor).replace(/"/g, '""')
    return `"${texto}"`
  }

  const linhas = leads.map((lead) => {
    const isProprietario = lead.rota === 'proprietario'
    const valorOuTicket = isProprietario ? lead.valor_estimado : lead.ticket
    const motivoOuObjetivo = isProprietario ? lead.motivo_venda : lead.objetivo
    const prazo = isProprietario ? lead.prazo_desejado : lead.prazo_decisao

    const dataFormatada = lead.criado_em
      ? new Date(lead.criado_em).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : ''

    return [
      formatarCampo(lead.protocolo),
      formatarCampo(lead.rota === 'proprietario' ? 'Proprietário' : 'Investidor'),
      formatarCampo(lead.status),
      formatarCampo(lead.nome),
      formatarCampo(lead.telefone),
      formatarCampo(lead.email),
      formatarCampo(lead.cidade),
      formatarCampo(lead.tipo_imovel),
      formatarCampo(valorOuTicket),
      formatarCampo(motivoOuObjetivo),
      formatarCampo(prazo),
      formatarCampo(lead.cidades_interesse),
      formatarCampo(lead.mensagem),
      formatarCampo(dataFormatada),
    ].join(';')
  })

  // Byte Order Mark (BOM) UTF-8 para Excel abrir acentuações em PT-BR sem corromper
  const conteudoCSV = '\uFEFF' + [colunas.join(';'), ...linhas].join('\r\n')

  const blob = new Blob([conteudoCSV], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  const dataHoje = new Date().toISOString().split('T')[0]
  link.setAttribute('download', `korbix_leads_${dataHoje}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
