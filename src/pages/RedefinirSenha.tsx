import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Lock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react'
import korbixLogo from '@/assets/5.2-logo-sem-fundo-e9820.png'
import { supabase } from '@/lib/supabase/client'
import {
  redefinirSenhaComNovaSenha,
  getWhatsAppSupportLink,
  KORBIX_WHATSAPP_DISPLAY,
} from '@/services/auth-recuperacao'
import { buscarPerfilUsuario, getRedirectPathByRole } from '@/services/profiles'
import { registrarEvento } from '@/services/eventos'

export default function RedefinirSenha() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const origem = searchParams.get('origem') === 'admin' ? 'admin' : 'login'

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifyingToken, setVerifyingToken] = useState(true)
  const [tokenValido, setTokenValido] = useState(false)
  const [tokenErrorMsg, setTokenErrorMsg] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [destPath, setDestPath] = useState(origem === 'admin' ? '/admin' : '/login')

  useEffect(() => {
    // Inspeciona sessão e hash/tokens de recuperação do Supabase Auth
    // Quando o usuário clica no link do e-mail, o Supabase Auth anexa tokens no hash da URL (#access_token=...&type=recovery)
    // ou automaticamente estabelece uma sessão de recuperação com type=recovery
    let isMounted = true

    const verificarSessaoDeRecuperacao = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          if (isMounted) {
            setVerifyingToken(false)
            setTokenValido(false)
            setTokenErrorMsg(
              'Não foi possível validar o link de recuperação. O token pode ter expirado.',
            )
          }
          return
        }

        // Verifica hash da URL por erros explícitos de token expirado
        const hash = window.location.hash
        if (hash.includes('error=')) {
          const params = new URLSearchParams(hash.replace('#', ''))
          const errorDesc =
            params.get('error_description') || 'O link de recuperação expirou ou é inválido.'
          if (isMounted) {
            setVerifyingToken(false)
            setTokenValido(false)
            setTokenErrorMsg(
              errorDesc.toLowerCase().includes('expired')
                ? 'Este link de recuperação expirou (validade máxima de 15 minutos). Por favor, solicite um novo link.'
                : 'O link de recuperação utilizado é inválido ou já foi utilizado anteriormente.',
            )
          }
          return
        }

        if (session?.user) {
          if (isMounted) {
            setUserEmail(session.user.email || null)
            setTokenValido(true)
            setVerifyingToken(false)

            // Descobre perfil para direcionamento assertivo
            buscarPerfilUsuario(session.user.id).then((p) => {
              if (p) {
                setDestPath(getRedirectPathByRole(p.tipo))
              }
            })
          }
        } else {
          // Escuta onAuthStateChange caso o processamento do hash termine em instantes
          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange((event, newSession) => {
            if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && newSession?.user)) {
              if (isMounted) {
                setUserEmail(newSession?.user.email || null)
                setTokenValido(true)
                setVerifyingToken(false)
              }
            }
          })

          // Timeout de 3 segundos para aguardar o Supabase parsear o hash
          const timer = setTimeout(() => {
            if (isMounted && verifyingToken) {
              setVerifyingToken(false)
              setTokenValido(false)
              setTokenErrorMsg(
                'Link de recuperação ausente, inválido ou expirado. Para sua segurança, os links expiram em 15 minutos.',
              )
            }
          }, 2500)

          return () => {
            clearTimeout(timer)
            subscription.unsubscribe()
          }
        }
      } catch {
        if (isMounted) {
          setVerifyingToken(false)
          setTokenValido(false)
          setTokenErrorMsg('Ocorreu uma falha ao verificar a autenticidade do link.')
        }
      }
    }

    verificarSessaoDeRecuperacao()

    return () => {
      isMounted = false
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!password || password.length < 8) {
      setErrorMessage('A nova senha deve possuir no mínimo 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('A confirmação não coincide com a nova senha digitada.')
      return
    }

    setLoading(true)

    const result = await redefinirSenhaComNovaSenha(password, userEmail || undefined)
    setLoading(false)

    if (!result.success) {
      setErrorMessage(result.error || 'Falha ao redefinir a senha. Tente novamente.')
      return
    }

    // Registra evento de auditoria/analytics
    registrarEvento('redefinicao_senha_sucesso', '/redefinir-senha', {
      origem,
    })

    setSuccess(true)
  }

  const loginRoute = origem === 'admin' ? '/admin' : '/login'
  const whatsappHelpUrl = getWhatsAppSupportLink('esqueci_senha', userEmail || undefined)

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans text-white">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[360px] bg-[#22C7E0]/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[320px] h-[260px] bg-[#1A3A75]/25 rounded-full blur-[110px] pointer-events-none" />

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

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-slate-900/90 text-slate-300 border border-slate-800 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#22C7E0]" />
            <span>Redefinição de Senha Segura</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white">Criar nova senha</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-sm">
            Defina uma nova senha para restabelecer seu acesso.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#081226] border border-[#1A3A75] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {verifyingToken ? (
            <div className="py-10 text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-[#22C7E0] mx-auto" />
              <p className="text-sm text-slate-300">Validando autenticidade do link de acesso...</p>
              <p className="text-xs text-slate-500">Por favor, aguarde um instante.</p>
            </div>
          ) : !tokenValido ? (
            <div className="space-y-5 text-center animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                <AlertCircle className="w-6 h-6" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-white">Link indisponível ou expirado</h2>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed bg-slate-900/70 p-4 rounded-xl border border-slate-800 text-left">
                  {tokenErrorMsg ||
                    'Este link de recuperação é inválido ou já expirou. Para sua proteção, os links têm validade estrita de 15 minutos e uso único.'}
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <Link
                  to={`/esqueci-senha?origem=${origem}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1A3A75] hover:bg-[#142E5E] text-white font-semibold text-sm border border-white/10 transition-all cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Solicitar novo link de redefinição</span>
                </Link>

                <Link
                  to={loginRoute}
                  className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors py-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar para tela de login</span>
                </Link>
              </div>
            </div>
          ) : success ? (
            <div className="space-y-5 text-center animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-white">Senha redefinida com sucesso!</h2>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed bg-slate-900/70 p-4 rounded-xl border border-slate-800 text-left">
                  Sua nova senha foi atualizada e salva com criptografia segura. Seu acesso está
                  restabelecido.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate(destPath, { replace: true })}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#22C7E0] hover:bg-[#1db3ca] text-[#070B14] font-bold text-sm shadow-md transition-all cursor-pointer"
                >
                  <span>Acessar a plataforma</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-start gap-2.5 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {userEmail && (
                <div className="mb-4 text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 flex items-center gap-2">
                  <span className="text-slate-500">Conta:</span>
                  <span className="text-slate-200 font-mono font-medium truncate">{userEmail}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nova Senha */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="nova-senha"
                    className="text-xs font-semibold uppercase tracking-wider text-slate-300 block"
                  >
                    Nova senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="nova-senha"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      placeholder="Mínimo de 8 caracteres"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (errorMessage) setErrorMessage('')
                      }}
                      disabled={loading}
                      className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[#070B14] border border-[#1A3A75] focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white placeholder-slate-500 text-sm outline-none transition-all disabled:opacity-50 min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
                      aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirmar Nova Senha */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="confirmar-senha"
                    className="text-xs font-semibold uppercase tracking-wider text-slate-300 block"
                  >
                    Confirmar nova senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="confirmar-senha"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      placeholder="Repita a nova senha"
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

                {/* Botão de Ação */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 min-h-[46px] rounded-xl bg-[#22C7E0] hover:bg-[#1db3ca] active:bg-[#199eb3] text-[#070B14] font-bold text-sm shadow-md transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#070B14] shrink-0" />
                        <span>Redefinindo senha...</span>
                      </>
                    ) : (
                      <>
                        <span>Redefinir senha</span>
                        <ArrowRight className="w-4 h-4 ml-1 shrink-0" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-800 text-center">
                <Link
                  to={loginRoute}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar para tela de login</span>
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Bloco de Suporte Permanente (WhatsApp / Administrador) */}
        <div className="mt-6 bg-[#081226]/80 border border-[#1A3A75]/60 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-300 font-medium">
            Precisa de ajuda? Fale com o administrador ou no WhatsApp.
          </p>
          <a
            href={whatsappHelpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2.5 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-semibold shadow-md transition-all duration-200 transform hover:scale-[1.02] active:scale-95"
          >
            <MessageSquare className="w-3.5 h-3.5 fill-current" />
            <span>Falar com o Administrador via WhatsApp ({KORBIX_WHATSAPP_DISPLAY})</span>
          </a>
        </div>
      </div>
    </div>
  )
}
