import { supabase } from '@/lib/supabase/client'

export interface LeadVendaEtapa1Input {
  cidade: string
  tipo_imovel: 'casa' | 'apartamento' | 'terreno' | 'comercial' | string
  telefone: string
  rota?: 'proprietario' | string
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
}

export interface LeadInvestidorInput {
  nome: string
  telefone: string
  email: string
  perfil: 'comprar para morar' | 'investir para renda' | 'investir para revenda' | string
  faixa_valor: string
  cidades_interesse: string
  rota?: 'investidor' | string
}

export interface LeadResult {
  success: boolean
  id?: string
  error?: string
}

export async function salvarLeadVendaEtapa1(input: LeadVendaEtapa1Input): Promise<LeadResult> {
  try {
    const { data, error } = await (supabase.from as any)('leads_venda')
      .insert([
        {
          cidade: input.cidade.trim(),
          tipo_imovel: input.tipo_imovel,
          telefone: input.telefone.trim(),
          rota: input.rota || 'proprietario',
        },
      ])
      .select('id')
      .single()

    if (error) {
      console.error('Erro ao salvar lead de venda (etapa 1):', error)
      return {
        success: false,
        error: error.message || 'Não foi possível registrar seu imóvel. Tente novamente.',
      }
    }

    return { success: true, id: data?.id }
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
    const { error } = await (supabase.from as any)('leads_venda')
      .update({
        nome: input.nome.trim(),
        email: input.email.trim().toLowerCase(),
        valor_estimado: input.valor_estimado ? input.valor_estimado.trim() : null,
        motivo_venda: input.motivo_venda,
        prazo_desejado: input.prazo_desejado,
        mensagem: input.mensagem ? input.mensagem.trim() : null,
      })
      .eq('id', input.id)

    if (error) {
      console.error('Erro ao atualizar lead de venda (etapa 2):', error)
      return {
        success: false,
        error: error.message || 'Não foi possível atualizar as informações. Tente novamente.',
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
    const payload: Record<string, any> = {
      telefone: input.telefone.trim(),
      tipo_imovel: input.tipo_imovel,
      cidade: input.cidade.trim(),
      rota: input.rota || 'proprietario',
    }

    if (input.nome) payload.nome = input.nome.trim()
    if (input.email) payload.email = input.email.trim().toLowerCase()
    if (input.valor_estimado) payload.valor_estimado = input.valor_estimado.trim()
    if (input.motivo_venda) payload.motivo_venda = input.motivo_venda
    if (input.prazo_desejado) payload.prazo_desejado = input.prazo_desejado
    if (input.mensagem) payload.mensagem = input.mensagem.trim()

    let error: any
    let data: any

    if (input.id) {
      const res = await (supabase.from as any)('leads_venda')
        .update(payload)
        .eq('id', input.id)
        .select('id')
        .single()
      error = res.error
      data = res.data
    } else {
      const res = await (supabase.from as any)('leads_venda')
        .insert([payload])
        .select('id')
        .single()
      error = res.error
      data = res.data
    }

    if (error) {
      console.error('Erro ao salvar lead de venda:', error)
      return {
        success: false,
        error: error.message || 'Não foi possível registrar seu imóvel. Tente novamente.',
      }
    }

    return { success: true, id: data?.id || input.id }
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

export async function salvarLeadInvestidor(input: LeadInvestidorInput): Promise<LeadResult> {
  try {
    const { error } = await (supabase.from as any)('leads_investidor').insert([
      {
        nome: input.nome.trim(),
        telefone: input.telefone.trim(),
        email: input.email.trim().toLowerCase(),
        perfil: input.perfil,
        faixa_valor: input.faixa_valor.trim(),
        cidades_interesse: input.cidades_interesse.trim(),
        rota: input.rota || 'investidor',
      },
    ])

    if (error) {
      console.error('Erro ao salvar lead de investidor:', error)
      return {
        success: false,
        error:
          error.message || 'Não foi possível registrar sua tese de investimento. Tente novamente.',
      }
    }

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
