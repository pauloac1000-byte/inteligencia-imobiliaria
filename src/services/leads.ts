import { supabase } from '@/lib/supabase/client'

export interface LeadVendaEtapa1Input {
  cidade: string
  tipo_imovel: 'casa' | 'apartamento' | 'terreno' | 'comercial' | string
  telefone: string
  rota?: 'proprietario' | string
  diferenciais?: string[] // Lista de códigos de diferenciais selecionados: ['PISCINA', 'PORTARIA', ...]
}

export interface LeadVendaEtapa2Input {
  id: string
  nome: string
  email: string
  valor_estimado?: string
  motivo_venda:
    | 'inventário'
    | 'mudança'
    | 'preciso de liquidez'
    | 'decisão de investimento'
    | 'outro'
    | string
  prazo_desejado: 'até 60 dias' | 'até 6 meses' | 'sem pressa' | string
  mensagem?: string
  diferenciais?: string[]
}

export interface LeadVendaInput {
  id?: string
  nome?: string
  telefone: string
  email?: string
  tipo_imovel: 'casa' | 'apartamento' | 'terreno' | 'comercial' | string
  cidade: string
  valor_estimado?: string
  motivo_venda?: string
  prazo_desejado?: string
  mensagem?: string
  rota?: 'proprietario' | string
  diferenciais?: string[]
}

export type TicketInvestidor = 'ate_300k' | '300_600k' | 'acima_600k' | string
export type ObjetivoInvestidor = 'renda_aluguel' | 'revenda' | 'reforma_venda' | string
export type PrazoDecisaoInvestidor = '30_dias' | '60_dias' | 'flexivel' | string

export interface LeadInvestidorInput {
  telefone: string
  ticket: TicketInvestidor
  objetivo: ObjetivoInvestidor
  cidades_interesse: string[] | string
  prazo_decisao: PrazoDecisaoInvestidor
  nome?: string
  email?: string
  perfil?: string
  faixa_valor?: string
  rota?: 'investidor' | string
  tipos_imovel?: string[]
  diferenciais?:
    | Record<string, 'indiferente' | 'desejavel' | 'obrigatorio'>
    | Record<string, string>
}

export interface LeadCalculadoraInput {
  cidade: string
  telefone: string
  valor_imovel: string
  iptu_anual?: string
  condominio_mensal?: string
  manutencao_mensal?: string
  meses_parado?: number
  taxa_mensal?: number
  custo_mensal_total?: string
  custo_acumulado_total?: string
  rota?: 'proprietario' | string
}

export interface LeadSimuladorInvestidorInput {
  cidade: string
  telefone: string
  valor_compra: string
  custo_reforma?: string
  aluguel_mensal?: string
  prazo_revenda_meses?: number
  valorizacao_anual?: number
  capital_investido?: string
  rentabilidade_mensal?: number
  retorno_total?: number
  rota?: 'investidor' | string
  diferenciais?:
    | Record<string, 'indiferente' | 'desejavel' | 'obrigatorio'>
    | Record<string, string>
}

// Constantes centralizadas para atendimento KORBIX
export const KORBIX_WHATSAPP_NUMBER = '5519998563025' // WhatsApp oficial KORBIX
export const KORBIX_WHATSAPP_DISPLAY = '(19) 99856-3025'

export interface LeadResult {
  success: boolean
  id?: string
  protocolo?: string
  error?: string
}

/**
 * Monta o link wa.me com mensagem personalizada contendo o protocolo gerado.
 */
export function buildWhatsAppLink(protocolo: string, rota: 'proprietario' | 'investidor'): string {
  const mensagem =
    rota === 'proprietario'
      ? `Olá, equipe KORBIX! Acabei de cadastrar meu imóvel com o protocolo ${protocolo} e gostaria de falar com um especialista sobre a análise técnica.`
      : `Olá, equipe KORBIX! Acabei de registrar minha tese de investimento com o protocolo ${protocolo} e gostaria de falar com a curadoria de oportunidades.`

  const encoded = encodeURIComponent(mensagem)
  return `https://wa.me/${KORBIX_WHATSAPP_NUMBER}?text=${encoded}`
}

export async function salvarLeadVendaEtapa1(input: LeadVendaEtapa1Input): Promise<LeadResult> {
  try {
    // Abordagem segura via RPC Security Definer (permite retorno de id + protocolo para perfil anônimo sem abrir SELECT geral)
    const { data: rpcData, error: rpcError } = await (supabase.rpc as any)(
      'fn_submit_lead_venda_etapa1',
      {
        p_cidade: input.cidade.trim(),
        p_tipo_imovel: input.tipo_imovel,
        p_telefone: input.telefone.trim(),
        p_rota: input.rota || 'proprietario',
        p_diferenciais: input.diferenciais || [],
      },
    )

    if (!rpcError && rpcData) {
      const row = Array.isArray(rpcData) ? rpcData[0] : rpcData
      return { success: true, id: row?.id, protocolo: row?.protocolo }
    }

    // Fallback defensivo com insert direto se RPC não estiver disponível (sem .select() para anônimos devido ao RLS)
    console.warn('RPC fn_submit_lead_venda_etapa1 falhou ou indisponível:', rpcError)

    const { error: insertError } = await (supabase.from as any)('leads_venda').insert([
      {
        cidade: input.cidade.trim(),
        tipo_imovel: input.tipo_imovel,
        telefone: input.telefone.trim(),
        rota: input.rota || 'proprietario',
        diferenciais: input.diferenciais || [],
      },
    ])

    if (insertError) {
      console.error('Erro ao salvar lead de venda (etapa 1):', insertError || rpcError)
      return {
        success: false,
        error:
          insertError.message ||
          rpcError?.message ||
          'Não foi possível registrar seu imóvel no momento. Tente novamente.',
      }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Exceção ao enviar etapa 1 de venda:', err)
    return {
      success: false,
      error:
        err?.message ||
        'Falha de conexão ao salvar os dados. Verifique sua rede e tente novamente.',
    }
  }
}

export async function atualizarLeadVendaEtapa2(input: LeadVendaEtapa2Input): Promise<LeadResult> {
  try {
    // Abordagem segura via RPC Security Definer
    const { data: rpcData, error: rpcError } = await (supabase.rpc as any)(
      'fn_submit_lead_venda_etapa2',
      {
        p_id: input.id,
        p_nome: input.nome.trim(),
        p_email: input.email.trim().toLowerCase(),
        p_motivo_venda: input.motivo_venda,
        p_prazo_desejado: input.prazo_desejado,
        p_valor_estimado: input.valor_estimado ? input.valor_estimado.trim() : null,
        p_mensagem: input.mensagem ? input.mensagem.trim() : null,
        p_diferenciais: input.diferenciais ?? null,
      },
    )

    if (!rpcError && rpcData) {
      const row = Array.isArray(rpcData) ? rpcData[0] : rpcData
      return { success: true, id: row?.id || input.id, protocolo: row?.protocolo }
    }

    // Fallback defensivo com update direto sem .select() (RLS não permite select para anônimos)
    console.warn('RPC fn_submit_lead_venda_etapa2 falhou ou indisponível:', rpcError)

    const updatePayload: Record<string, any> = {
      nome: input.nome.trim(),
      email: input.email.trim().toLowerCase(),
      valor_estimado: input.valor_estimado ? input.valor_estimado.trim() : null,
      motivo_venda: input.motivo_venda,
      prazo_desejado: input.prazo_desejado,
      mensagem: input.mensagem ? input.mensagem.trim() : null,
    }
    if (input.diferenciais !== undefined) {
      updatePayload.diferenciais = input.diferenciais
    }

    const { error: updateError } = await (supabase.from as any)('leads_venda')
      .update(updatePayload)
      .eq('id', input.id)

    if (updateError) {
      console.error('Erro ao atualizar lead de venda (etapa 2):', updateError || rpcError)
      return {
        success: false,
        error:
          updateError.message ||
          rpcError?.message ||
          'Não foi possível atualizar as informações no momento. Tente novamente.',
      }
    }

    return { success: true, id: input.id }
  } catch (err: any) {
    console.error('Exceção ao enviar etapa 2 de venda:', err)
    return {
      success: false,
      error:
        err?.message ||
        'Falha de conexão ao salvar os dados. Verifique sua rede e tente novamente.',
    }
  }
}

export async function salvarLeadVenda(input: LeadVendaInput): Promise<LeadResult> {
  try {
    // Abordagem segura via RPC Security Definer
    const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('fn_submit_lead_venda', {
      p_telefone: input.telefone.trim(),
      p_tipo_imovel: input.tipo_imovel,
      p_cidade: input.cidade.trim(),
      p_rota: input.rota || 'proprietario',
      p_id: input.id || null,
      p_nome: input.nome ? input.nome.trim() : null,
      p_email: input.email ? input.email.trim().toLowerCase() : null,
      p_valor_estimado: input.valor_estimado ? input.valor_estimado.trim() : null,
      p_motivo_venda: input.motivo_venda || null,
      p_prazo_desejado: input.prazo_desejado || null,
      p_mensagem: input.mensagem ? input.mensagem.trim() : null,
      p_diferenciais: input.diferenciais || [],
    })

    if (!rpcError && rpcData) {
      const row = Array.isArray(rpcData) ? rpcData[0] : rpcData
      return { success: true, id: row?.id || input.id, protocolo: row?.protocolo }
    }

    // Fallback defensivo direto
    const payload: Record<string, any> = {
      telefone: input.telefone.trim(),
      tipo_imovel: input.tipo_imovel,
      cidade: input.cidade.trim(),
      rota: input.rota || 'proprietario',
      diferenciais: input.diferenciais || [],
    }

    if (input.nome) payload.nome = input.nome.trim()
    if (input.email) payload.email = input.email.trim().toLowerCase()
    if (input.valor_estimado) payload.valor_estimado = input.valor_estimado.trim()
    if (input.motivo_venda) payload.motivo_venda = input.motivo_venda
    if (input.prazo_desejado) payload.prazo_desejado = input.prazo_desejado
    if (input.mensagem) payload.mensagem = input.mensagem.trim()

    let error: any
    let data: any

    console.warn('RPC fn_submit_lead_venda falhou ou indisponível:', rpcError)

    if (input.id) {
      const res = await (supabase.from as any)('leads_venda').update(payload).eq('id', input.id)
      error = res.error
    } else {
      const res = await (supabase.from as any)('leads_venda').insert([payload])
      error = res.error
    }

    if (error) {
      console.error('Erro ao salvar lead de venda:', error || rpcError)
      return {
        success: false,
        error:
          error.message ||
          rpcError?.message ||
          'Não foi possível registrar seu imóvel no momento. Tente novamente.',
      }
    }

    return { success: true, id: input.id }
  } catch (err: any) {
    console.error('Exceção ao enviar lead de venda:', err)
    return {
      success: false,
      error:
        err?.message ||
        'Falha de conexão ao salvar os dados. Verifique sua rede e tente novamente.',
    }
  }
}

export async function salvarLeadCalculadora(input: LeadCalculadoraInput): Promise<LeadResult> {
  try {
    // Abordagem segura via RPC Security Definer
    const { data: rpcData, error: rpcError } = await (supabase.rpc as any)(
      'fn_submit_lead_calculadora',
      {
        p_cidade: input.cidade.trim(),
        p_telefone: input.telefone.trim(),
        p_valor_imovel: input.valor_imovel ? input.valor_imovel.trim() : null,
        p_iptu_anual: input.iptu_anual ? input.iptu_anual.trim() : null,
        p_condominio_mensal: input.condominio_mensal ? input.condominio_mensal.trim() : null,
        p_manutencao_mensal: input.manutencao_mensal ? input.manutencao_mensal.trim() : null,
        p_meses_parado: input.meses_parado ?? null,
        p_taxa_mensal: input.taxa_mensal ?? null,
        p_custo_mensal_total: input.custo_mensal_total ? input.custo_mensal_total.trim() : null,
        p_custo_acumulado_total: input.custo_acumulado_total
          ? input.custo_acumulado_total.trim()
          : null,
        p_rota: input.rota || 'proprietario',
      },
    )

    if (!rpcError && rpcData) {
      const row = Array.isArray(rpcData) ? rpcData[0] : rpcData
      return { success: true, id: row?.id, protocolo: row?.protocolo }
    }

    // Fallback defensivo com insert direto sem .select() (RLS não permite leitura para anônimos)
    console.warn('RPC fn_submit_lead_calculadora falhou ou indisponível:', rpcError)

    const { error: insertError } = await (supabase.from as any)('leads_venda').insert([
      {
        cidade: input.cidade.trim(),
        telefone: input.telefone.trim(),
        valor_estimado: input.valor_imovel ? input.valor_imovel.trim() : null,
        rota: input.rota || 'proprietario',
        calc_iptu_anual: input.iptu_anual ? input.iptu_anual.trim() : null,
        calc_condominio_mensal: input.condominio_mensal ? input.condominio_mensal.trim() : null,
        calc_manutencao_mensal: input.manutencao_mensal ? input.manutencao_mensal.trim() : null,
        calc_meses_parado: input.meses_parado ?? null,
        calc_taxa_mensal: input.taxa_mensal ?? null,
        calc_custo_mensal_total: input.custo_mensal_total ? input.custo_mensal_total.trim() : null,
        calc_custo_acumulado_total: input.custo_acumulado_total
          ? input.custo_acumulado_total.trim()
          : null,
        mensagem: 'Lead originado da Calculadora de Custo de Imóvel Parado (/calculadora)',
      },
    ])

    if (insertError) {
      console.error('Erro ao salvar lead da calculadora:', insertError || rpcError)
      return {
        success: false,
        error:
          insertError.message ||
          rpcError?.message ||
          'Não foi possível registrar seus dados no momento. Tente novamente.',
      }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Exceção ao enviar lead da calculadora:', err)
    return {
      success: false,
      error:
        err?.message ||
        'Falha de conexão ao salvar os dados. Verifique sua rede e tente novamente.',
    }
  }
}

export async function salvarLeadSimuladorInvestidor(
  input: LeadSimuladorInvestidorInput,
): Promise<LeadResult> {
  try {
    // Abordagem segura via RPC Security Definer (retorna ID + protocolo KX-XXXX gerado pelo trigger)
    const { data: rpcData, error: rpcError } = await (supabase.rpc as any)(
      'fn_submit_lead_simulador_investidor',
      {
        p_cidade: input.cidade.trim(),
        p_telefone: input.telefone.trim(),
        p_sim_valor_compra: input.valor_compra ? input.valor_compra.trim() : null,
        p_sim_custo_reforma: input.custo_reforma ? input.custo_reforma.trim() : null,
        p_sim_aluguel_mensal: input.aluguel_mensal ? input.aluguel_mensal.trim() : null,
        p_sim_prazo_revenda_meses: input.prazo_revenda_meses ?? null,
        p_sim_valorizacao_anual: input.valorizacao_anual ?? null,
        p_sim_capital_investido: input.capital_investido ? input.capital_investido.trim() : null,
        p_sim_rentabilidade_mensal: input.rentabilidade_mensal ?? null,
        p_sim_retorno_total: input.retorno_total ?? null,
        p_rota: input.rota || 'investidor',
        p_diferenciais: input.diferenciais || {},
      },
    )

    if (!rpcError && rpcData) {
      const row = Array.isArray(rpcData) ? rpcData[0] : rpcData
      return { success: true, id: row?.id, protocolo: row?.protocolo }
    }

    // Se a chamada RPC falhou, reportamos erro amigável ao usuário.
    // Fallback defensivo com insert direto sem .select() (para visitantes anônimos o RLS bloqueia SELECT)
    console.warn('RPC fn_submit_lead_simulador_investidor falhou ou indisponível:', rpcError)

    const { error: insertError } = await (supabase.from as any)('leads_investidor').insert([
      {
        cidades_interesse: input.cidade.trim(),
        telefone: input.telefone.trim(),
        rota: input.rota || 'investidor',
        sim_valor_compra: input.valor_compra ? input.valor_compra.trim() : null,
        sim_custo_reforma: input.custo_reforma ? input.custo_reforma.trim() : null,
        sim_aluguel_mensal: input.aluguel_mensal ? input.aluguel_mensal.trim() : null,
        sim_prazo_revenda_meses: input.prazo_revenda_meses ?? null,
        sim_valorizacao_anual: input.valorizacao_anual ?? null,
        sim_capital_investido: input.capital_investido ? input.capital_investido.trim() : null,
        sim_rentabilidade_mensal: input.rentabilidade_mensal ?? null,
        sim_retorno_total: input.retorno_total ?? null,
        diferenciais: input.diferenciais || {},
      },
    ])

    if (insertError) {
      console.error('Erro ao salvar lead do simulador de investidor no fallback:', insertError)
      return {
        success: false,
        error:
          rpcError?.message ||
          insertError?.message ||
          'Não foi possível registrar seu interesse no momento. Tente novamente.',
      }
    }

    // Lead gravado via insert direto sem retorno de leitura por RLS
    return { success: true }
  } catch (err: any) {
    console.error('Exceção ao enviar lead do simulador:', err)
    return {
      success: false,
      error:
        err?.message ||
        'Falha de conexão ao salvar os dados. Verifique sua rede e tente novamente.',
    }
  }
}

export async function salvarLeadInvestidor(input: LeadInvestidorInput): Promise<LeadResult> {
  try {
    const cidadesFormatadas = Array.isArray(input.cidades_interesse)
      ? input.cidades_interesse.join(', ')
      : input.cidades_interesse.trim()

    // Abordagem segura via RPC Security Definer
    const { data: rpcData, error: rpcError } = await (supabase.rpc as any)(
      'fn_submit_lead_investidor',
      {
        p_telefone: input.telefone.trim(),
        p_ticket: input.ticket,
        p_objetivo: input.objetivo,
        p_cidades_interesse: cidadesFormatadas,
        p_prazo_decisao: input.prazo_decisao,
        p_rota: input.rota || 'investidor',
        p_nome: input.nome ? input.nome.trim() : null,
        p_email: input.email ? input.email.trim().toLowerCase() : null,
        p_perfil: input.perfil ? input.perfil.trim() : null,
        p_faixa_valor: input.faixa_valor ? input.faixa_valor.trim() : null,
        p_diferenciais: input.diferenciais || {},
        p_tipos_imovel: input.tipos_imovel || [],
      },
    )

    if (!rpcError && rpcData) {
      const row = Array.isArray(rpcData) ? rpcData[0] : rpcData
      return { success: true, id: row?.id, protocolo: row?.protocolo }
    }

    // Se a chamada RPC falhou, reportamos erro amigável ao usuário.
    // Fallback defensivo com insert direto sem .select() (para visitantes anônimos o RLS bloqueia SELECT)
    console.warn('RPC fn_submit_lead_investidor falhou ou indisponível:', rpcError)

    const payload: Record<string, any> = {
      telefone: input.telefone.trim(),
      ticket: input.ticket,
      objetivo: input.objetivo,
      cidades_interesse: cidadesFormatadas,
      prazo_decisao: input.prazo_decisao,
      rota: input.rota || 'investidor',
      diferenciais: input.diferenciais || {},
      tipos_imovel: input.tipos_imovel || [],
    }

    if (input.nome) payload.nome = input.nome.trim()
    if (input.email) payload.email = input.email.trim().toLowerCase()
    if (input.perfil) payload.perfil = input.perfil
    if (input.faixa_valor) payload.faixa_valor = input.faixa_valor

    const { error: insertError } = await (supabase.from as any)('leads_investidor').insert([
      payload,
    ])

    if (insertError) {
      console.error('Erro ao salvar lead de investidor no fallback:', insertError)
      return {
        success: false,
        error:
          rpcError?.message ||
          insertError?.message ||
          'Não foi possível registrar sua tese de investimento no momento. Tente novamente.',
      }
    }

    // Lead gravado via insert direto sem retorno de leitura por RLS
    return { success: true }
  } catch (err: any) {
    console.error('Exceção ao enviar lead de investidor:', err)
    return {
      success: false,
      error:
        err?.message ||
        'Falha de conexão ao salvar os dados. Verifique sua rede e tente novamente.',
    }
  }
}
