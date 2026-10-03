import { supabase } from '@/lib/supabase/client'
import { MUNICIPIOS_SP_FALLBACK, MunicipioSP } from './regioes'

export interface ViaCepEndereco {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  ibge: string
  gia?: string
  ddd?: string
  siafi?: string
  erro?: boolean | string
}

export interface EnderecoPadronizado {
  cep: string
  logradouro: string
  bairro: string
  cidade: string
  uf: string
  codigo_ibge: string | null
  origem: 'viacep' | 'fallback'
}

/**
 * Remove caracteres não numéricos e formata o CEP (XXXXX-XXX).
 */
export function formatarCEP(valor: string): string {
  const digits = valor.replace(/\D/g, '').slice(0, 8)
  if (!digits) return ''
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

/**
 * Limpa qualquer caractere não numérico retornando exatamente 8 dígitos ou string vazia.
 */
export function normalizarDigitosCEP(valor: string): string {
  return valor.replace(/\D/g, '').slice(0, 8)
}

/**
 * Normaliza string para comparação sem acento e em minúsculas.
 */
export function normalizarNomeCidade(nome: string): string {
  return (nome || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Resolve o código IBGE buscando primeiro na tabela municipios_sp do banco,
 * depois no fallback local.
 */
export async function resolverCodigoIBGEPorCidade(
  nomeCidade: string,
  ibgeSugerido?: string,
): Promise<{ codigo_ibge: string | null; nomeOficial: string }> {
  if (ibgeSugerido && ibgeSugerido.trim().length >= 7) {
    return { codigo_ibge: ibgeSugerido.trim(), nomeOficial: nomeCidade }
  }

  const norm = normalizarNomeCidade(nomeCidade)
  if (!norm) return { codigo_ibge: null, nomeOficial: nomeCidade }

  try {
    const { data } = await (supabase.from as any)('municipios_sp')
      .select('codigo_ibge, nome, nome_normalizado')
      .or(`nome_normalizado.eq.${norm},nome_normalizado.ilike.%${norm}%`)
      .limit(1)

    if (data && data.length > 0) {
      return {
        codigo_ibge: data[0].codigo_ibge,
        nomeOficial: data[0].nome,
      }
    }
  } catch (err) {
    console.warn('resolverCodigoIBGEPorCidade: falha ao consultar municipios_sp', err)
  }

  // Fallback nos municípios pré-carregados
  const fallback = MUNICIPIOS_SP_FALLBACK.find(
    (m: MunicipioSP) =>
      m.nome_normalizado === norm ||
      m.nome_normalizado.includes(norm) ||
      norm.includes(m.nome_normalizado),
  )

  if (fallback) {
    return {
      codigo_ibge: fallback.codigo_ibge,
      nomeOficial: fallback.nome,
    }
  }

  return { codigo_ibge: null, nomeOficial: nomeCidade }
}

/**
 * Consulta a API do ViaCEP a partir do navegador conforme regra 1 do usuário.
 * Retorna logradouro, bairro, cidade, uf e código IBGE resolvido.
 */
export async function consultarViaCEP(cepRaw: string): Promise<EnderecoPadronizado | null> {
  const digits = normalizarDigitosCEP(cepRaw)
  if (digits.length !== 8) {
    return null
  }

  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!res.ok) {
      console.warn(`ViaCEP retornou status HTTP ${res.status}`)
      return null
    }

    const data: ViaCepEndereco = await res.json()
    if (data.erro === true || data.erro === 'true') {
      return null
    }

    const cidadeNome = data.localidade || ''
    const ibgeRetornado = data.ibge || null

    // Cruza com tabela oficial municipios_sp para padronização robusta
    const { codigo_ibge, nomeOficial } = await resolverCodigoIBGEPorCidade(
      cidadeNome,
      ibgeRetornado || undefined,
    )

    return {
      cep: formatarCEP(data.cep || digits),
      logradouro: (data.logradouro || '').trim(),
      bairro: (data.bairro || '').trim(),
      cidade: nomeOficial || cidadeNome,
      uf: (data.uf || '').toUpperCase(),
      codigo_ibge: codigo_ibge || ibgeRetornado,
      origem: 'viacep',
    }
  } catch (err) {
    console.warn('Erro ao consultar ViaCEP:', err)
    return null
  }
}
