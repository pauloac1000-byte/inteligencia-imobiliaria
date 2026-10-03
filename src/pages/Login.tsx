import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { getRedirectPathByRole } from '@/services/profiles'
import {
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  AlertCircle,
  ArrowLeft,
  ShieldAlert,
  Clock,
  MessageSquare,
  KeyRound,
} from 'lucide-react'
import korbixLogo from '@/assets/5.2-logo-sem-fundo-e9820.png'
import {
  checkAuthLockout,
  recordAuthAttempt,
  getWhatsAppSupportLink,
  KORBIX_WHATSAPP_DISPLAY,
  LockoutStatus,
} from '@/services/auth-recuperacao'

export default function Login() {
  const { signIn, user, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [lockout, setLockout] = useState<LockoutStatus | null>(null)
  const [secondsLeft, setSecondsLeft] = useState<number>(0)

  // Se o usuário já estiver logado, redireciona diretamente para sua respectiva área
  useEffect(() => {
    if (!authLoading && user) {
      const destination = getRedirectPathByRole(profile?.tipo)
      navigate(destination, { replace: true })
    }
  }, [authLoading, user, profile, navigate])

  // Timer para contagem regressiva durante bloqueio temporário
  useEffect(() => {
    if (secondsLeft <= 0) return

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Re-checar lockout server-side ao zerar o tempo
          if (email.trim()) {
            checkAuthLockout(email).then((st) => {
              setLockout(st)
              setSecondsLeft(st.segundosRestantes)
            })
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [secondsLeft, email])

  const formatSeconds = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`
  }

  const handleEmailBlur = async () => {
    if (!email.trim()) return
    const status = await checkAuthLockout(email)
    setLockout(status)
    setSecondsLeft(status.segundosRestantes)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !password) {
      setErrorMessage('Por favor, informe seu e-mail e sua senha.')
      return
    }

    // Verificação server-side ANTES da tentativa
    const preCheck = await checkAuthLockout(cleanEmail)
    setLockout(preCheck)
    setSecondsLeft(preCheck.segundosRestantes)

    if (preCheck.bloqueado) {
      if (preCheck.motivo === 'bloqueio_temporario' && preCheck.segundosRestantes > 0) {
        setErrorMessage(
          `Acesso temporariamente bloqueado por excesso de tentativas. Aguarde ${formatSeconds(preCheck.segundosRestantes)} ou redefina sua senha.`,
        )
      } else {
        setErrorMessage(
          'Você excedeu as tentativas de login. Redefina sua senha para restabelecer o acesso.',
        )
      }
      return
    }

    setLoading(true)
    const { error, profile: loggedProfile } = await signIn(cleanEmail, password)

    if (error) {
      // Registra a falha server-side e checa se atingiu o limite de bloqueio progressivo
      const postFail = await recordAuthAttempt(cleanEmail, 'falha', {
        origem: 'login_cliente',
        erro: error.message,
      })
      setLockout(postFail)
      setSecondsLeft(postFail.segundosRestantes)
      setLoading(false)

      if (postFail.bloqueado) {
        if (postFail.motivo === 'bloqueio_temporario' && postFail.segundosRestantes > 0) {
          setErrorMessage(
            `Você excedeu o limite de 5 tentativas. Acesso bloqueado por ${postFail.tempoBloqueioMin} minutos. Redefina sua senha agora para recuperar seu acesso.`,
          )
        } else {
          setErrorMessage('Você excedeu o limite de tentativas. Redefina sua senha para continuar.')
        }
        return
      }

      const rawMsg = error.message.toLowerCase()
      const tentativasRestantes = 5 - postFail.tentativasFalhas

      if (rawMsg.includes('invalid login credentials') || rawMsg.includes('invalid_credentials')) {
        setErrorMessage(
          tentativasRestantes > 0 && tentativasRestantes < 5
            ? `E-mail ou senha incorretos. Restam ${tentativasRestantes} ${tentativasRestantes === 1 ? 'tentativa' : 'tentativas'} antes do bloqueio.`
            : 'E-mail ou senha incorretos. Verifique suas credenciais.',
        )
      } else if (rawMsg.includes('email not confirmed')) {
        setErrorMessage(
          'Seu e-mail ainda não foi confirmado. Verifique a caixa de entrada para ativar sua conta.',
        )
      } else {
        setErrorMessage(error.message || 'Erro ao realizar login. Tente novamente.')
      }
      return
    }

    // Sucesso: registra login_sucesso no log (limpa falhas anteriores)
    await recordAuthAttempt(cleanEmail, 'sucesso', {
      origem: 'login_cliente',
    })
    setLoading(false)

    // Sucesso no login: redirecionar para a área correspondente
    const destination = getRedirectPathByRole(loggedProfile?.tipo)
    navigate(destination, { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans text-white">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-[#22C7E0]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[250px] bg-[#1A3A75]/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Container Principal */}
      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Topo: Logo KORBIX */}
        <div className="flex flex-col items-center mb-8 text-center">
          <Link
            to="/"
            className="group inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22C7E0] rounded-xl transition-all mb-4"
            aria-label="KORBIX - Voltar para início"
          >
            <img
              src={korbixLogo}
              alt="KORBIX Inteligência Imobiliária"
              className="h-12 w-auto object-contain drop-shadow-[0_0_20px_rgba(34,199,224,0.3)] group-hover:brightness-110 transition-all"
            />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">Acesse sua conta</h1>
          <p className="text-sm text-slate-400 mt-1">
            Entre para visualizar seu cadastro e oportunidades na plataforma.
          </p>
        </div>

        {/* Card de Login */}
        <div className="bg-[#081226] border border-[#1A3A75] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-start gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-medium">{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Banner de bloqueio por limite de tentativas */}
          {lockout?.bloqueado && (
            <div className="mb-5 p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-100 text-xs space-y-3 animate-fade-in">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white font-semibold">
                    {lockout.motivo === 'bloqueio_temporario' && secondsLeft > 0
                      ? `Bloqueio temporário ativo (${formatSeconds(secondsLeft)})`
                      : 'Você excedeu as tentativas de login'}
                  </strong>
                  <p className="text-amber-200/90 mt-1 leading-relaxed">
                    Por razões de segurança, este e-mail atingiu 5 ou mais tentativas incorretas.
                    {lockout.motivo === 'bloqueio_temporario' && secondsLeft > 0
                      ? ` Tempo de espera restante: ${formatSeconds(secondsLeft)}.`
                      : ' É obrigatório redefinir sua senha para restabelecer o acesso.'}
                  </p>
                </div>
              </div>

              <Link
                to={`/esqueci-senha?origem=login&email=${encodeURIComponent(email)}`}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-[#22C7E0] hover:bg-[#1db3ca] text-[#070B14] font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Redefinir senha agora</span>
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo E-mail */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="text-xs font-semibold uppercase tracking-wider text-slate-300 block"
              >
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errorMessage) setErrorMessage('')
                  }}
                  onBlur={handleEmailBlur}
                  disabled={loading}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-[#070B14] border border-[#1A3A75] focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white placeholder-slate-500 text-sm outline-none transition-all disabled:opacity-50 min-h-[44px]"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-300 block"
                >
                  Senha
                </label>
                <Link
                  to={`/esqueci-senha?origem=login${email ? `&email=${encodeURIComponent(email)}` : ''}`}
                  className="text-xs text-[#22C7E0] hover:underline focus:outline-none"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
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
                    <span>Entrando...</span>
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

          {/* Divisor / Link para Cadastro */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center space-y-3">
            <p className="text-xs text-slate-400">
              Ainda não tem uma conta?{' '}
              <Link
                to="/cadastro"
                className="text-[#22C7E0] hover:underline font-semibold focus:outline-none"
              >
                Criar conta
              </Link>
            </p>
          </div>
        </div>

        {/* Bloco de Suporte Permanente (WhatsApp / Administrador) */}
        <div className="mt-6 bg-[#081226]/80 border border-[#1A3A75]/60 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-300 font-medium">
            Precisa de ajuda? Fale com o administrador ou no WhatsApp.
          </p>
          <a
            href={getWhatsAppSupportLink(lockout?.bloqueado ? 'bloqueio' : 'ajuda_geral', email)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2.5 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-semibold shadow-md transition-all duration-200 transform hover:scale-[1.02] active:scale-95"
          >
            <MessageSquare className="w-3.5 h-3.5 fill-current" />
            <span>Falar com o Administrador via WhatsApp ({KORBIX_WHATSAPP_DISPLAY})</span>
          </a>
        </div>

        {/* Link discreto de volta para a landing */}
        <div className="mt-4 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors py-1 px-2 rounded-lg"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para o site principal</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
