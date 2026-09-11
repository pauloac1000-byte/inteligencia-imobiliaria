import { supabase } from '@/lib/supabase/client'

export interface LeadVendaInput {
  nome: string
  telefone: string
  email: string
  tipo_imovel: 'casa' | 'apartamento' | 'terreno' | 'comercial' | string
  cidade: string
  valor_estimado?: string
  mensagem?: string
}

export interface LeadInvestidorInput {
  nome: string
  telefone: string
  email: string
  perfil: 'comprar para morar' | 'investir para renda' | 'investir para revenda' | string
  faixa_valor: string
  cidades_interesse: string
}

export interface LeadResult {
  success: boolean
  error?: string
}

export async function salvarLeadVenda(input: LeadVendaInput): Promise<LeadResult> {
  try {
    const { error } = await (supabase.from as any)('leads_venda').insert([
      {
        nome: input.nome.trim(),
        telefone: input.telefone.trim(),
        email: input.email.trim().toLowerCase(),
        tipo_imovel: input.tipo_imovel,
        cidade: input.cidade.trim(),
        valor_estimado: input.valor_estimado ? input.valor_estimado.trim() : null,
        mensagem: input.mensagem ? input.mensagem.trim() : null,
      },
    ])

    if (error) {
      console.error('Erro ao salvar lead de venda:', error)
      return {
        success: false,
        error: error.message || 'Não foi possível registrar seu imóvel. Tente novamente.',
      }
    }

    return { success: true }
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
