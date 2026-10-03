import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { getRedirectPathByRole, UserRole } from '@/services/profiles'
import {
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  User,
  TrendingUp,
} from 'lucide-react'
import korbixLogo from '@/assets/5.2-logo-sem-fundo-e9820.png'

const OPCOES_PERFIL: {
  value: Extract<UserRole, 'proprietario' | 'investidor'>
  title: string
  subtitle: string
  icon: React.FC<{ className?: string }>
}[] = [
  {
    value: 'proprietario',
    title: 'Proprietário',
    subtitle: 'Quero vender ou gerir meus imóveis com liquidez rápida.',
    icon: User,
  },
  {
    value: 'investidor',
    title: 'Investidor',
    subtitle: 'Quero ter acesso a oportunidades qualificadas com alto retorno.',
    icon: TrendingUp,
  },
]

export default function Cadastro() {
  const { signUp, user, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [tipo, setTipo] = useState<UserRole>('proprietario')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [alreadyRegisteredNotice, setAlreadyRegisteredNotice] = useState(false)
  const [confirmationNotice, setConfirmationNotice] = useState(false)

  // Redireciona se já estiver autenticado
  useEffect(() => {
    if (!authLoading && user) {
      const destination = getRedirectPathByRole(profile?.tipo)
      navigate(destination, { replace: true })
    }
  }, [authLoading, user, profile, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setAlreadyRegisteredNotice(false)

    if (!email.trim() || !password || !confirmPassword) {
      setErrorMessage('Por favor, preencha todos os campos.')
      return
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve ter no mínimo 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('As senhas não coincidem. Digite novamente.')
      return
    }

    setLoading(true)
    const { error, needsEmailConfirmation, isAlreadyRegistered } = await signUp(
      email,
      password,
      tipo,
    )
    setLoading(false)

    if (isAlreadyRegistered) {
      setAlreadyRegisteredNotice(true)
      return
    }

    if (error) {
      const rawMsg = error.message.toLowerCase()
      if (
        rawMsg.includes('already registered') ||
        rawMsg.includes('user already exists') ||
        rawMsg.includes('já possui cadastro')
      ) {
        setAlreadyRegisteredNotice(true)
      } else {
        setErrorMessage(error.message || 'Erro ao realizar cadastro. Tente novamente.')
      }
      return
    }

    if (needsEmailConfirmation) {
      setConfirmationNotice(true)
      return
    }

    // Se a sessão foi criada imediatamente, redireciona
    const destination = getRedirectPathByRole(tipo)
    navigate(destination, { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans text-white">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[380px] bg-[#22C7E0]/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[250px] bg-[#1A3A75]/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Container Principal */}
      <div className="w-full max-w-lg relative z-10 animate-fade-in">
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Criar conta KORBIX
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Escolha seu perfil e acesse a plataforma de inteligência imobiliária.
          </p>
        </div>

        {/* Card de Cadastro */}
        <div className="bg-[#081226] border border-[#1A3A75] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {alreadyRegisteredNotice ? (
            <div className="text-center space-y-4 py-3 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">E-mail já cadastrado</h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                O e-mail <span className="text-[#22C7E0] font-semibold">{email}</span> já possui uma
                conta ativa na KORBIX. Você não precisa criar uma nova conta nem aguardar link de
                ativação.
              </p>
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[#1A3A75] hover:bg-[#142E5E] text-white font-semibold text-sm shadow-inner border border-white/10 transition-all"
                >
                  <span>Entrar com esta conta</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setAlreadyRegisteredNotice(false)
                    setEmail('')
                    setPassword('')
                    setConfirmPassword('')
                  }}
                  className="w-full sm:w-auto text-xs text-slate-400 hover:text-white py-2 px-3 transition-colors"
                >
                  Usar outro e-mail
                </button>
              </div>
            </div>
          ) : confirmationNotice ? (
            <div className="text-center space-y-4 py-3 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-[#22C7E0]/10 border border-[#22C7E0]/40 text-[#22C7E0] flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(34,199,224,0.2)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Conta criada com sucesso!</h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Enviamos um link de confirmação para o e-mail{' '}
                <span className="text-[#22C7E0] font-semibold">{email}</span>. Acesse sua caixa de
                entrada para ativar seu cadastro e entrar na plataforma.
              </p>
              <div className="pt-3">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[#1A3A75] hover:bg-[#142E5E] text-white font-semibold text-sm shadow-inner border border-white/10 transition-all"
                >
                  <span>Ir para tela de login</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="mb-5 p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-start gap-2.5 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Seleção do Tipo de Perfil (Proprietário, Investidor, Gestor) */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
                    Tipo de Perfil *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {OPCOES_PERFIL.map((op) => {
                      const isSelected = tipo === op.value
                      const IconComp = op.icon
                      return (
                        <button
                          key={op.value}
                          type="button"
                          onClick={() => setTipo(op.value)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                            isSelected
                              ? 'bg-[#070B14] border-[#22C7E0] shadow-[0_0_12px_rgba(34,199,224,0.2)]'
                              : 'bg-[#070B14]/60 border-slate-800 hover:border-slate-700 hover:bg-[#070B14]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <IconComp
                              className={`w-4 h-4 ${
                                isSelected ? 'text-[#22C7E0]' : 'text-slate-400'
                              }`}
                            />
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-[#22C7E0] animate-pulse" />
                            )}
                          </div>
                          <div className="font-semibold text-sm text-white">{op.title}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                            {op.subtitle}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Campo E-mail */}
                <div className="space-y-1.5 pt-1">
                  <label
                    htmlFor="cadastro-email"
                    className="text-xs font-semibold uppercase tracking-wider text-slate-300 block"
                  >
                    E-mail *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="cadastro-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="seu@email.com"
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

                {/* Grid Senha e Confirmação */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="cadastro-password"
                      className="text-xs font-semibold uppercase tracking-wider text-slate-300 block"
                    >
                      Senha *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="cadastro-password"
                        type="password"
                        required
                        autoComplete="new-password"
                        placeholder="Mín. 6 dígitos"
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

                  <div className="space-y-1.5">
                    <label
                      htmlFor="cadastro-confirm-password"
                      className="text-xs font-semibold uppercase tracking-wider text-slate-300 block"
                    >
                      Confirmar Senha *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="cadastro-confirm-password"
                        type="password"
                        required
                        autoComplete="new-password"
                        placeholder="Repita a senha"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value)
                          if (errorMessage) setErrorMessage('')
                        }}
                        disabled={loading}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-[#070B14] border border-[#1A3A75] focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white placeholder-slate-500 text-sm outline-none transition-all disabled:opacity-50 min-h-[44px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Aviso sobre vinculação automática */}
                <div className="p-3 rounded-lg bg-[#070B14]/80 border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#22C7E0] shrink-0" />
                  <span>
                    Caso já tenha cadastrado um imóvel pelo formulário, seus protocolos serão
                    vinculados automaticamente a esta conta.
                  </span>
                </div>

                {/* Botão Criar Conta */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 min-h-[46px] rounded-xl bg-[#1A3A75] hover:bg-[#142E5E] active:bg-[#0F2347] text-white font-semibold text-sm shadow-inner border border-white/10 hover:border-white/20 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                        <span>Criando conta...</span>
                      </>
                    ) : (
                      <>
                        <span>Criar conta</span>
                        <ArrowRight className="w-4 h-4 ml-1 shrink-0" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Divisor / Link para Login */}
              <div className="mt-6 pt-5 border-t border-slate-800 text-center space-y-3">
                <p className="text-xs text-slate-400">
                  Já possui uma conta?{' '}
                  <Link
                    to="/login"
                    className="text-[#22C7E0] hover:underline font-semibold focus:outline-none"
                  >
                    Fazer login
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Link discreto de volta para a landing */}
        <div className="mt-6 text-center">
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
