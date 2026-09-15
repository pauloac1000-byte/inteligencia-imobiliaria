import { supabase } from '@/lib/supabase/client'
import { StatusImovelLead } from '@/services/profiles'

export interface CriterioCompatibilidadeItem {
  criterio: string
  nome: string
  peso: number
  atendido: boolean
  pontos: number
  explicacao: string
}

export interface GestorLeadItem {
  id: string
  rota: 'proprietario' | 'investidor' | string
  protocolo: string
  nome: string | null
  telefone: string | null
  email: string | null
  motivo_venda: string | null
  prazo_desejado: string | null
  status: StatusImovelLead | string
  tipo_imovel: string | null
  cidade: string | null
  valor_estimado: string | null
  mensagem: string | null
  ticket: string | null
  objetivo: string | null
  prazo_decisao: string | null
  cidades_interesse: string | null
  perfil: string | null
  user_id: string | null
  criado_em: string | null
}

export type StatusMatch = 'pendente' | 'aprovado' | 'descartado'

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
