import { supabase } from '@/lib/supabase/client'

export interface CriterioDetalhe {
  criterio: string
  nome: string
  peso: number
  fator?: number
  pontos: number
  aplicavel?: boolean
  atendido: boolean
  explicacao: string
}

export interface OportunidadeInvestidor {
  compatibilidade_id: string
  lead_venda_id: string
  lead_investidor_id: string
  percentual: number
  criterios: CriterioDetalhe[]
  criterios_atendidos: CriterioDetalhe[]
  criterios_nao_atendidos: CriterioDetalhe[]
  protocolo_imovel: string
  tipo_imovel: string
  cidade: string
  faixa_valor: string
  status_imovel: string
  criado_em_imovel: string
  tese_protocolo: string
  tese_objetivo: string
  tese_ticket: string
  ja_manifestou_interesse: boolean
  interesse_id?: string | null
  interesse_status?: string | null
}

export interface ManifestarInteresseResult {
  success: boolean
  id?: string
  status?: string
  notificado_em?: string
  ja_existia?: boolean
  error?: string
}

/**
 * Formata tempo decorrido relativo ("há 2 dias", "há 3 horas", "hoje")
 */
export function formatarTempoDesdeListagem(dataIso?: string | null): string {
  if (!dataIso) return 'Recente'
  const data = new Date(dataIso)
  if (isNaN(data.getTime())) return 'Recente'

  const agora = new Date()
  const diffMs = agora.getTime() - data.getTime()
  if (diffMs < 0) return 'Recém-listado'

  const diffSegundos = Math.floor(diffMs / 1000)
  const diffMinutos = Math.floor(diffSegundos / 60)
  const diffHoras = Math.floor(diffMinutos / 60)
  const diffDias = Math.floor(diffHoras / 24)

  if (diffDias > 30) {
    const meses = Math.floor(diffDias / 30)
    return meses === 1 ? 'há 1 mês' : `há ${meses} meses`
  }
  if (diffDias >= 1) {
    return diffDias === 1 ? 'há 1 dia' : `há ${diffDias} dias`
  }
  if (diffHoras >= 1) {
    return diffHoras === 1 ? 'há 1 hora' : `há ${diffHoras} horas`
  }
  if (diffMinutos >= 1) {
    return `há ${diffMinutos} min`
  }
  return 'hoje'
}

/**
 * Busca as oportunidades compatíveis ordenadas via RPC segura fn_listar_oportunidades_investidor
 */
export async function buscarOportunidadesInvestidor(): Promise<OportunidadeInvestidor[]> {
  try {
    const { data, error } = await (supabase.rpc as any)('fn_listar_oportunidades_investidor')

    if (error) {
      console.warn('Erro ao listar oportunidades do investidor:', error.message)
      return []
    }

    if (!Array.isArray(data)) return []

    return data.map((item: any) => ({
      compatibilidade_id: item.compatibilidade_id,
      lead_venda_id: item.lead_venda_id,
      lead_investidor_id: item.lead_investidor_id,
      percentual: Number(item.percentual || 0),
      criterios: Array.isArray(item.criterios) ? item.criterios : [],
      criterios_atendidos: Array.isArray(item.criterios_atendidos) ? item.criterios_atendidos : [],
      criterios_nao_atendidos: Array.isArray(item.criterios_nao_atendidos)
        ? item.criterios_nao_atendidos
        : [],
      protocolo_imovel: item.protocolo_imovel || 'KX-0000',
      tipo_imovel: item.tipo_imovel || 'Imóvel',
      cidade: item.cidade || 'Região',
      faixa_valor: item.faixa_valor || 'Sob consulta',
      status_imovel: item.status_imovel || 'Recebido',
      criado_em_imovel: item.criado_em_imovel,
      tese_protocolo: item.tese_protocolo || 'KX-TESE',
      tese_objetivo: item.tese_objetivo || 'Geral',
      tese_ticket: item.tese_ticket || '',
      ja_manifestou_interesse: Boolean(item.ja_manifestou_interesse),
      interesse_id: item.interesse_id || null,
      interesse_status: item.interesse_status || null,
    }))
  } catch (err) {
    console.warn('Exceção ao listar oportunidades do investidor:', err)
    return []
  }
}

/**
 * Registra a manifestação de interesse em um imóvel compatível via RPC fn_manifestar_interesse_investidor
 */
export async function manifestarInteresseInvestidor(
  leadInvestidorId: string,
  leadVendaId: string,
  mensagem?: string,
): Promise<ManifestarInteresseResult> {
  try {
    const { data, error } = await (supabase.rpc as any)('fn_manifestar_interesse_investidor', {
      p_lead_investidor_id: leadInvestidorId,
      p_lead_venda_id: leadVendaId,
      p_mensagem: mensagem ? mensagem.trim() : null,
    })

    if (error) {
      console.error('Erro ao manifestar interesse:', error)
      return {
        success: false,
        error: error.message || 'Falha ao manifestar interesse. Tente novamente.',
      }
    }

    const row = Array.isArray(data) ? data[0] : data

    return {
      success: true,
      id: row?.id,
      status: row?.status,
      notificado_em: row?.notificado_em,
      ja_existia: Boolean(row?.ja_existia),
    }
  } catch (err: any) {
    console.error('Exceção ao manifestar interesse:', err)
    return {
      success: false,
      error: err?.message || 'Erro de conexão ao registrar interesse.',
    }
  }
}
