import { supabase } from '@/lib/supabase/client'

export type TipoEventoFunil =
  | 'hero_exibicao'
  | 'clique_quero_vender'
  | 'clique_quero_investir'
  | 'formulario_iniciado'
  | 'etapa1_concluida'
  | 'cadastro_completo'
  | 'clique_whatsapp'
  | 'uso_calculadora'
  | string

export interface EventoFunilPayload {
  tipo: TipoEventoFunil
  rota?: string
  detalhe?: Record<string, any> | string | null
}

const STORAGE_SESSION_KEY = 'korbix_session_id'

/**
 * Obtém ou gera um identificador de sessão pseudo-anônimo exclusivo para a aba do navegador.
 * Armazenado em sessionStorage (expira quando a aba é fechada).
 * NUNCA contém dados pessoais, cookies de rastreamento de longo prazo ou fingerprinting.
 */
export function getAnonymousSessionId(): string {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return 'srv_' + Math.random().toString(36).substring(2, 15)
    }

    let sessionId = window.sessionStorage.getItem(STORAGE_SESSION_KEY)
    if (!sessionId) {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        sessionId = crypto.randomUUID()
      } else {
        sessionId =
          'sess_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36)
      }
      window.sessionStorage.setItem(STORAGE_SESSION_KEY, sessionId)
    }
    return sessionId
  } catch {
    return 'fallback_' + Math.random().toString(36).substring(2, 15)
  }
}

/**
 * Normaliza a rota atual caso não seja fornecida explicitamente.
 */
function getCurrentRoute(): string {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.pathname || '/'
  }
  return '/'
}

/**
 * Registra um evento no Supabase de forma fire-and-forget.
 * Nunca bloqueia a UI, nunca lança erro para o usuário (falha silenciosa).
 * Sem nenhum dado pessoal (apenas tipo, rota, timestamp, sessao_id e detalhe genérico).
 */
export function registrarEvento(
  tipo: TipoEventoFunil,
  rota?: string,
  detalhe?: Record<string, any> | string | null,
): void {
  try {
    const sessao_id = getAnonymousSessionId()
    const rotaFinal = rota || getCurrentRoute()

    // Formata o detalhe para objeto JSON seguro (garantindo que não seja string crua com dados)
    let detalheJson: Record<string, any> | null = null
    if (detalhe) {
      if (typeof detalhe === 'string') {
        detalheJson = { origem: detalhe }
      } else if (typeof detalhe === 'object') {
        detalheJson = detalhe
      }
    }

    // Insert direto no Supabase sem .select() (RLS para anônimos permite apenas INSERT)
    // Usamos promise sem await ou catch interno com log silencioso
    void (async () => {
      try {
        const { error } = await (supabase.from as any)('eventos_funil').insert([
          {
            tipo_evento: tipo,
            rota: rotaFinal,
            sessao_id,
            detalhe: detalheJson,
          },
        ])
        if (error) {
          // Log discreto de depuração apenas em desenvolvimento
          if (import.meta.env?.DEV) {
            console.warn('[telemetria] Falha ao registrar evento:', error.message)
          }
        }
      } catch (err: any) {
        if (import.meta.env?.DEV) {
          console.warn('[telemetria] Exceção no registro do evento:', err?.message)
        }
      }
    })()
  } catch (outerErr: any) {
    // Falha 100% silenciosa: nada interrompe a experiência do usuário
    if (import.meta.env?.DEV) {
      console.warn('[telemetria] Exceção externa:', outerErr?.message)
    }
  }
}
