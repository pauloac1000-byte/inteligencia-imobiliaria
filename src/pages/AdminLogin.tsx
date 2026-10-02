import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { buscarPerfilUsuario } from '@/services/profiles'
import { Lock, Mail, ArrowRight, Loader2, AlertCircle, ArrowLeft, ShieldAlert } from 'lucide-react'
import korbixLogo from '@/assets/5.2-logo-sem-fundo-e9820.png'

export default function AdminLogin() {
  const { signIn, signOut, user, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Se o usuário já estiver logado:
  // Se for gestor -> vai para /painel
  // Se for outro perfil -> desloga ou exibe aviso, não permitindo entrar
  useEffect(() => {
    if (!authLoading && user && profile) {
      if (profile.tipo === 'gestor') {
        navigate('/painel', { replace: true })
      } else {
        // Logado com perfil não gestor (ex: proprietário ou investidor): desloga da área administrativa
        signOut().catch(() => {})
        setErrorMessage('Acesso não autorizado para este perfil.')
      }
    }
  }, [authLoading, user, profile, navigate, signOut])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    const cleanEmail = email.trim()
    if (!cleanEmail || !password) {
      setErrorMessage('Por favor, informe o e-mail e a senha de administrador.')
      return
    }

    setLoading(true)

    try {
      const { error, profile: loggedProfile } = await signIn(cleanEmail, password)

      if (error) {
        setLoading(false)
        const rawMsg = error.message.toLowerCase()
        if (
          rawMsg.includes('invalid login credentials') ||
          rawMsg.includes('invalid_credentials')
        ) {
          setErrorMessage('E-mail ou senha incorretos. Verifique suas credenciais.')
        } else if (rawMsg.includes('email not confirmed')) {
          setErrorMessage('E-mail ainda não confirmado. Verifique a caixa de entrada para ativar.')
        } else {
          setErrorMessage(error.message || 'Erro ao realizar login. Tente novamente.')
        }
        return
      }

      // Se autenticou com sucesso, busca perfil e verifica se é gestor
      let userProfile = loggedProfile
      if (!userProfile) {
        // Tenta buscar diretamente do banco
        const { data: authData } = await (
          await import('@/lib/supabase/client')
        ).supabase.auth.getUser()
        if (authData?.user) {
          userProfile = await buscarPerfilUsuario(authData.user.id)
        }
      }

      if (userProfile?.tipo !== 'gestor') {
        // Desloga imediatamente: contas comuns não podem usar esta tela
        await signOut()
        setLoading(false)
        setErrorMessage('Acesso não autorizado para este perfil.')
        return
      }

      // Perfil de gestor autenticado com sucesso
      setLoading(false)
      navigate('/painel', { replace: true })
    } catch (err: any) {
      setLoading(false)
      setErrorMessage(err?.message || 'Falha na validação de acesso. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans text-white">
      {/* Background glow effects escuros e discretos */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-[#22C7E0]/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[250px] bg-[#1A3A75]/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Container Principal */}
      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Topo: Logo KORBIX + Identificador Discreto de Gestão */}
        <div className="flex flex-col items-center mb-8 text-center">
          <Link
            to="/"
            className="group inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22C7E0] rounded-xl transition-all mb-4"
            aria-label="KORBIX - Voltar para início"
          >
            <img
              src={korbixLogo}
              alt="KORBIX Inteligência Imobiliária"
              className="h-12 w-auto object-contain drop-shadow-[0_0_20px_rgba(34,199,224,0.25)] group-hover:brightness-110 transition-all"
            />
          </Link>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-slate-900/90 text-slate-300 border border-slate-800 mb-2">
            <ShieldAlert className="w-3 h-3 text-[#22C7E0]" />
            <span>Área Administrativa</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white">
            Acesso restrito — Administração
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Canal reservado exclusivamente para gestores da plataforma.
          </p>
        </div>

        {/* Card de Login */}
        <div className="bg-[#081226] border border-[#1A3A75] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-start gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo E-mail */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin-email"
                className="text-xs font-semibold uppercase tracking-wider text-slate-300 block"
              >
                E-mail de administrador
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="admin@korbix.com.br"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errorMessage) setErrorMessage('')
                  }}
                  disabled={loading}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-[#070B14] border border-[#1A3A75] focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white placeholder-slate-500 text-sm outline-none transition-all disabled:opacity-50 min-h-[44px]"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin-password"
                className="text-xs font-semibold uppercase tracking-wider text-slate-300 block"
              >
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="admin-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errorMessage) setErrorMessage('')
                  }}
                  disabled={loading}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-[#070B14] border border-[#1A3A75] focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white placeholder-slate-500 text-sm outline-none transition-all disabled:opacity-50 min-h-[44px]"
                />
              </div>
            </div>

            {/* Botão Entrar */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 min-h-[46px] rounded-xl bg-[#1A3A75] hover:bg-[#142E5E] active:bg-[#0F2347] text-white font-semibold text-sm shadow-inner border border-white/10 hover:border-white/20 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar</span>
                    <ArrowRight className="w-4 h-4 ml-1 shrink-0" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Aviso sobre criação de contas - apenas interno, sem link para criar conta */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-500">
              Contas de gestão são cadastradas diretamente pela administração central.
            </p>
          </div>
        </div>

        {/* Retorno discreto à página inicial */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors py-1 px-2 rounded-lg"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para o site principal</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
