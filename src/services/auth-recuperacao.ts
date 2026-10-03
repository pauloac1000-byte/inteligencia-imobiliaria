import { supabase } from '@/lib/supabase/client'
import { KORBIX_WHATSAPP_NUMBER, KORBIX_WHATSAPP_DISPLAY } from '@/services/leads'

export interface LockoutStatus {
  bloqueado: boolean
  motivo?: 'limite_excedido' | 'bloqueio_temporario' | null
  tentativasFalhas: number
  segundosRestantes: number
  tempoBloqueioMin: number
  deveRedefinir: boolean
}

/**
 * Consulta server-side o status de bloqueio de um e-mail (RPC fn_auth_check_lockout).
 */
export async function checkAuthLockout(email: string): Promise<LockoutStatus> {
  const cleanEmail = email.trim().toLowerCase()
  if (!cleanEmail) {
    return {
      bloqueado: false,
      tentativasFalhas: 0,
      segundosRestantes: 0,
      tempoBloqueioMin: 0,
      deveRedefinir: false,
    }
  }

  try {
    const { data, error } = await (supabase.rpc as any)('fn_auth_check_lockout', {
      p_email: cleanEmail,
    })

    if (error) {
      console.warn('Erro ao verificar bloqueio de auth:', error)
      return {
        bloqueado: false,
        tentativasFalhas: 0,
        segundosRestantes: 0,
        tempoBloqueioMin: 0,
        deveRedefinir: false,
      }
    }

    const row = Array.isArray(data) ? data[0] : data
    return {
      bloqueado: !!row?.bloqueado,
      motivo: row?.motivo || null,
      tentativasFalhas: Number(row?.tentativas_falhas || 0),
      segundosRestantes: Number(row?.segundos_restantes || 0),
      tempoBloqueioMin: Number(row?.tempo_bloqueio_min || 0),
      deveRedefinir: !!row?.deve_redefinir,
    }
  } catch (err) {
    console.warn('Exceção ao verificar status de lockout:', err)
    return {
      bloqueado: false,
      tentativasFalhas: 0,
      segundosRestantes: 0,
      tempoBloqueioMin: 0,
      deveRedefinir: false,
    }
  }
}

/**
 * Registra uma tentativa de login (sucesso ou falha) no banco de logs via RPC.
 */
export async function recordAuthAttempt(
  email: string,
  resultado: 'sucesso' | 'falha',
  detalhes: Record<string, any> = {},
): Promise<LockoutStatus> {
  const cleanEmail = email.trim().toLowerCase()
  if (!cleanEmail) {
    return {
      bloqueado: false,
      tentativasFalhas: 0,
      segundosRestantes: 0,
      tempoBloqueioMin: 0,
      deveRedefinir: false,
    }
  }

  try {
    const { data, error } = await (supabase.rpc as any)('fn_auth_record_attempt', {
      p_email: cleanEmail,
      p_resultado: resultado,
      p_detalhes: detalhes,
    })

    if (error) {
      console.warn('Erro ao registrar tentativa de login no log:', error)
      return {
        bloqueado: false,
        tentativasFalhas: 0,
        segundosRestantes: 0,
        tempoBloqueioMin: 0,
        deveRedefinir: false,
      }
    }

    const row = Array.isArray(data) ? data[0] : data
    return {
      bloqueado: !!row?.bloqueado,
      motivo: row?.motivo || null,
      tentativasFalhas: Number(row?.tentativas_falhas || 0),
      segundosRestantes: Number(row?.segundos_restantes || 0),
      tempoBloqueioMin: Number(row?.tempo_bloqueio_min || 0),
      deveRedefinir: !!row?.deve_redefinir,
    }
  } catch (err) {
    console.warn('Exceção ao registrar tentativa de autenticação:', err)
    return {
      bloqueado: false,
      tentativasFalhas: 0,
      segundosRestantes: 0,
      tempoBloqueioMin: 0,
      deveRedefinir: false,
    }
  }
}

/**
 * Registra no log do banco uma solicitação ou finalização de redefinição de senha.
 */
export async function recordAuthReset(
  email: string,
  etapa: 'solicitado' | 'concluido',
  detalhes: Record<string, any> = {},
): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase()
  if (!cleanEmail) return false

  try {
    const { data, error } = await (supabase.rpc as any)('fn_auth_record_reset', {
      p_email: cleanEmail,
      p_etapa: etapa,
      p_detalhes: detalhes,
    })

    if (error) {
      console.warn('Erro ao registrar reset no log:', error)
      return false
    }

    return !!data
  } catch (err) {
    console.warn('Exceção ao registrar evento de reset de senha:', err)
    return false
  }
}

/**
 * Solicita a recuperação de senha via Supabase Auth nativo.
 * Redireciona para /redefinir-senha preservando a origem no query param se fornecido.
 */
export async function solicitarRecuperacaoSenha(
  email: string,
  origem: 'login' | 'admin' = 'login',
): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase()
  if (!cleanEmail) {
    return { success: false, error: 'Por favor, informe seu e-mail.' }
  }

  try {
    const redirectUrl = `${window.location.origin}/redefinir-senha?origem=${origem}`

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: redirectUrl,
    })

    // Registra a solicitação nos logs do banco (SECURITY DEFINER)
    await recordAuthReset(cleanEmail, 'solicitado', {
      origem,
      timestamp: new Date().toISOString(),
    })

    if (error) {
      // Nota de segurança: Supabase por padrão finge sucesso por anti-enumeração,
      // mas se houver erro técnico (ex: rate limit de e-mails), tratamos com cuidado
      const errorMsg = error.message.toLowerCase()
      if (errorMsg.includes('rate limit') || errorMsg.includes('over_email_send_rate_limit')) {
        return {
          success: false,
          error:
            'Limite de envios de e-mail atingido temporariamente pelo servidor. Aguarde alguns minutos antes de solicitar novamente ou contate o suporte no WhatsApp.',
        }
      }
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Falha ao solicitar recuperação de senha.',
    }
  }
}

/**
 * Conclui a redefinição de senha com a nova senha usando updateUser.
 */
export async function redefinirSenhaComNovaSenha(
  novaSenha: string,
  emailAssociado?: string,
): Promise<{ success: boolean; error?: string }> {
  if (!novaSenha || novaSenha.length < 8) {
    return { success: false, error: 'A senha deve conter no mínimo 8 caracteres.' }
  }

  try {
    const { data, error } = await supabase.auth.updateUser({
      password: novaSenha,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    const email = data.user?.email || emailAssociado || ''
    if (email) {
      // Registra sucesso nos logs e reseta o contador de falhas para o e-mail
      await recordAuthReset(email, 'concluido', {
        timestamp: new Date().toISOString(),
      })
    }

    return { success: true }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Falha ao redefinir sua senha.',
    }
  }
}

/**
 * Monta o link do WhatsApp para canal de ajuda e suporte de acesso KORBIX.
 */
export function getWhatsAppSupportLink(
  assunto: 'bloqueio' | 'esqueci_senha' | 'ajuda_geral' = 'ajuda_geral',
  emailTentado?: string,
): string {
  let mensagem = 'Olá! Preciso de ajuda para acessar a plataforma KORBIX.'
  if (assunto === 'bloqueio') {
    mensagem = emailTentado
      ? `Olá! Minha conta (${emailTentado}) foi bloqueada por excesso de tentativas na plataforma KORBIX. Preciso de suporte para desbloquear o acesso.`
      : 'Olá! Minha conta foi bloqueada por excesso de tentativas na plataforma KORBIX. Preciso de ajuda para redefinir o acesso.'
  } else if (assunto === 'esqueci_senha') {
    mensagem = emailTentado
      ? `Olá! Estou com dificuldades para redefinir a senha do e-mail ${emailTentado} na plataforma KORBIX.`
      : 'Olá! Não estou conseguindo recuperar minha senha na plataforma KORBIX. Podem me auxiliar?'
  }

  const encoded = encodeURIComponent(mensagem)
  return `https://wa.me/${KORBIX_WHATSAPP_NUMBER}?text=${encoded}`
}

export { KORBIX_WHATSAPP_NUMBER, KORBIX_WHATSAPP_DISPLAY }
