import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import {
  vincularLeadsDoUsuario,
  buscarPerfilUsuario,
  UserProfile,
  UserRole,
} from '@/services/profiles'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  signUp: (
    email: string,
    password: string,
    tipo: UserRole,
  ) => Promise<{
    error: AuthError | Error | null
    needsEmailConfirmation?: boolean
    isAlreadyRegistered?: boolean
  }>
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: AuthError | Error | null; profile?: UserProfile | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  refreshProfile: () => Promise<UserProfile | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Função para carregar perfil e garantir vínculo
  const carregarPerfilEVinculo = async (currentUser: User) => {
    try {
      const p = await buscarPerfilUsuario(currentUser.id)
      if (p) {
        setProfile(p)
      } else {
        // Fallback para metadados se o trigger ainda estiver concluindo
        const metaTipo = (currentUser.user_metadata?.tipo as UserRole) || 'proprietario'
        setProfile({
          id: currentUser.id,
          email: currentUser.email || '',
          tipo: metaTipo,
          created_at: new Date().toISOString(),
        })
      }

      // Dispara vinculação de leads assincronamente sem bloquear a interface
      if (currentUser.email) {
        vincularLeadsDoUsuario(currentUser.id, currentUser.email).catch(() => {
          // Fallback silencioso de vinculação
        })
      }
    } catch {
      // Ignora erro e mantém profile seguro
    }
  }

  useEffect(() => {
    // Escuta mudanças de auth (FORBIDDEN: no async/await directly inside onAuthStateChange callback)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)

      if (currentSession?.user) {
        // Chamada de função assíncrona desacoplada fora da assinatura síncrona
        carregarPerfilEVinculo(currentSession.user)
      } else {
        setProfile(null)
      }

      setLoading(false)
    })

    // Recuperação de sessão existente na inicialização
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession)
      setUser(initialSession?.user ?? null)
      if (initialSession?.user) {
        carregarPerfilEVinculo(initialSession.user).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const refreshProfile = async (): Promise<UserProfile | null> => {
    if (!user) return null
    const p = await buscarPerfilUsuario(user.id)
    if (p) {
      setProfile(p)
    }
    return p
  }

  const signUp = async (email: string, password: string, tipo: UserRole) => {
    const cleanEmail = email.trim().toLowerCase()
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          tipo,
        },
      },
    })

    if (error) {
      return { error }
    }

    // Quando o e-mail já existe e está confirmado, o Supabase Auth (GoTrue) retorna data.user com identities: []
    // sem erro (comportamento de segurança anti-enumeração) e NÃO envia novo e-mail nem cria nova conta.
    const isAlreadyRegistered =
      !!data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0

    if (isAlreadyRegistered) {
      return {
        error: new Error(
          'Este e-mail já possui cadastro na plataforma KORBIX. Acesse a página de login para entrar.',
        ),
        isAlreadyRegistered: true,
      }
    }

    // Se a confirmação de e-mail estiver ligada no Supabase e não retornar session de imediato
    const needsEmailConfirmation = !data.session && !!data.user

    if (data.user) {
      // Tenta vincular leads já cadastrados
      await vincularLeadsDoUsuario(data.user.id, cleanEmail)
    }

    return { error: null, needsEmailConfirmation }
  }

  const signIn = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    })

    if (error) {
      return { error }
    }

    if (data.user) {
      // Executa vínculo por e-mail imediatamente
      await vincularLeadsDoUsuario(data.user.id, cleanEmail)
      const p = await buscarPerfilUsuario(data.user.id)
      if (p) {
        setProfile(p)
      }
      return { error: null, profile: p }
    }

    return { error: null }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
    return { error }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
