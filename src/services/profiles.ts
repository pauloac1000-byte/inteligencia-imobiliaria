import { supabase } from '@/lib/supabase/client'

export type UserRole = 'proprietario' | 'investidor' | 'gestor'

export interface UserProfile {
  id: string
  email: string
  tipo: UserRole
  created_at: string
}

export type StatusImovelLead = 'Recebido' | 'Em análise' | 'Com compatibilidade' | 'Em negociação'

export interface LeadVinculado {
  id: string
  protocolo: string | null
  tipo_imovel?: string | null
  cidade?: string | null
  telefone?: string | null
  nome?: string | null
  email?: string | null
  valor_estimado?: string | null
  motivo_venda?: string | null
  prazo_desejado?: string | null
  mensagem?: string | null
  status?: StatusImovelLead | string | null
  criado_em?: string | null
  user_id?: string | null
}

/**
 * Busca o perfil cadastrado na tabela public.profiles
 */
export async function buscarPerfilUsuario(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles' as any)
      .select('id, email, tipo, created_at')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.warn('Erro ao buscar perfil do usuário:', error.message)
      return null
    }

    if (!data) return null
    return data as unknown as UserProfile
  } catch (err) {
    console.warn('Exceção ao buscar perfil:', err)
    return null
  }
}

/**
 * Executa a RPC segura fn_vincular_lead_por_email
 */
export async function vincularLeadsDoUsuario(
  userId: string,
  email: string,
): Promise<{ total: number; protocolos: string[] }> {
  if (!userId || !email) {
    return { total: 0, protocolos: [] }
  }

  try {
    const { data, error } = await (supabase.rpc as any)('fn_vincular_lead_por_email', {
      p_user_id: userId,
      p_email: email.trim().toLowerCase(),
    })

    if (error) {
      console.warn('Aviso na vinculação de leads:', error.message)
      return { total: 0, protocolos: [] }
    }

    if (Array.isArray(data) && data.length > 0) {
      const item = data[0]
      return {
        total: item.total_vinculados || 0,
        protocolos: item.protocolos || [],
      }
    }

    return { total: 0, protocolos: [] }
  } catch (err) {
    console.warn('Falha silenciosa ao chamar fn_vincular_lead_por_email:', err)
    return { total: 0, protocolos: [] }
  }
}

/**
 * Busca os leads já vinculados a este usuário autenticado
 */
export async function buscarLeadsVinculados(userId: string): Promise<LeadVinculado[]> {
  try {
    const { data, error } = await supabase
      .from('leads_venda' as any)
      .select(
        'id, protocolo, tipo_imovel, cidade, telefone, nome, email, valor_estimado, motivo_venda, prazo_desejado, mensagem, status, criado_em, user_id',
      )
      .eq('user_id', userId)
      .order('criado_em', { ascending: false })

    if (error) {
      console.warn('Erro ao consultar leads vinculados:', error.message)
      return []
    }

    return (data || []) as unknown as LeadVinculado[]
  } catch {
    return []
  }
}

/**
 * Retorna o destino de redirecionamento apropriado conforme o tipo de perfil
 */
export function getRedirectPathByRole(role?: UserRole | null): string {
  switch (role) {
    case 'gestor':
      return '/painel'
    case 'investidor':
      return '/minha-area'
    case 'proprietario':
    default:
      return '/minha-area'
  }
}
