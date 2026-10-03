import React, { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  ShieldCheck,
  Clock,
} from 'lucide-react'
import korbixLogo from '@/assets/5.2-logo-sem-fundo-e9820.png'
import {
  solicitarRecuperacaoSenha,
  getWhatsAppSupportLink,
  KORBIX_WHATSAPP_DISPLAY,
} from '@/services/auth-recuperacao'
import { registrarEvento } from '@/services/eventos'

export default function EsqueciSenha() {
  const [searchParams] = useSearchParams()
  const origem = searchParams.get('origem') === 'admin' ? 'admin' : 'login'
  const emailParam = searchParams.get('email') || ''

  const [email, setEmail] = useState(emailParam)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const loginRoute = origem === 'admin' ? '/admin' : '/login'
  const origemTitulo = origem === 'admin' ? 'Área Administrativa' : 'Área do Cliente'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
      setErrorMessage('Por favor, informe seu endereço de e-mail.')
      return
    }

    setLoading(true)

    // Dispara analytics/evento de solicitação
    registrarEvento('solicitacao_esqueci_senha', '/esqueci-senha', {
      origem,
    })

    const result = await solicitarRecuperacaoSenha(cleanEmail, origem)
    setLoading(false)

    if (!result.success && result.error) {
      // Se for rate limit de envio pelo Supabase, mostra aviso específico
      if (result.error.toLowerCase().includes('limite de envios')) {
        setErrorMessage(result.error)
        return
      }
      // Para erros gerais técnicos inesperados:
      setErrorMessage(result.error)
      return
    }

    // Sucesso: exibe a mensagem genérica que protege a privacidade (anti-enumeração)
    setSubmitted(true)
  }

  const whatsappHelpUrl = getWhatsAppSupportLink('esqueci_senha', email)

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
            <span>Recuperação de Acesso • {origemTitulo}</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white">Redefinir sua senha</h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-sm">
            Recuperar o acesso com segurança e sem complicação.
          </p>
        </div>

        {/* Card do Formulário ou Sucesso */}
        <div className="bg-[#081226] border border-[#1A3A75] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {submitted ? (
            <div className="space-y-5 animate-fade-in text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-white">Solicitação enviada</h2>
                {/* Mensagem genérica obrigatória por segurança (não revela se o e-mail existe) */}
                <p className="text-sm text-slate-300 mt-2 leading-relaxed text-left bg-slate-900/70 p-4 rounded-xl border border-slate-800">
                  Se o e-mail informado estiver cadastrado em nossa plataforma, enviaremos um link
                  exclusivo com instruções para redefinição da sua senha.
                </p>
              </div>

              <div className="bg-slate-900/40 rounded-xl p-3 text-xs text-slate-400 border border-slate-800/80 flex items-start gap-2.5 text-left">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  O link enviado possui validade temporária de <strong>15 minutos</strong> e uso
                  único. O envio pode levar alguns minutos para chegar na sua caixa de entrada ou
                  spam.
                </span>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <Link
                  to={loginRoute}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1A3A75] hover:bg-[#142E5E] text-white font-semibold text-sm border border-white/10 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar para o login</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-xs text-slate-400 hover:text-[#22C7E0] transition-colors py-1 cursor-pointer"
                >
                  Informar outro e-mail
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

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="recovery-email"
                    className="text-xs font-semibold uppercase tracking-wider text-slate-300 block"
                  >
                    Seu e-mail de acesso
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="recovery-email"
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
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Se o e-mail estiver cadastrado, enviaremos um link seguro para a redefinição da
                    sua senha.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 min-h-[46px] rounded-xl bg-[#1A3A75] hover:bg-[#142E5E] active:bg-[#0F2347] text-white font-semibold text-sm shadow-inner border border-white/10 hover:border-white/20 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                        <span>Enviando link...</span>
                      </>
                    ) : (
                      <>
                        <span>Enviar link de redefinição</span>
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
                  <span>Lembrou da senha? Ir para o login</span>
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

        {/* Retorno discreto para o site */}
        <div className="mt-4 text-center">
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
