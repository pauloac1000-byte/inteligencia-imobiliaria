import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { CheckCircle2, ArrowRight, Building, TrendingUp } from 'lucide-react'

interface ModalComecarAgoraProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialIntent?: 'vender' | 'investir' | null
}

export const ModalComecarAgora: React.FC<ModalComecarAgoraProps> = ({
  open,
  onOpenChange,
  initialIntent = null,
}) => {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [intencao, setIntencao] = useState<'vender' | 'investir'>(
    initialIntent === 'investir' ? 'investir' : 'vender',
  )
  const [submitting, setSubmitting] = useState(false)
  const [enviadoComSucesso, setEnviadoComSucesso] = useState(false)
  const [erro, setErro] = useState('')

  // Sincronizar intenção inicial se passar via prop ao abrir
  React.useEffect(() => {
    if (initialIntent) {
      setIntencao(initialIntent)
    }
    if (open) {
      setEnviadoComSucesso(false)
      setErro('')
    }
  }, [initialIntent, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim() || !email.trim()) {
      setErro('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    if (!email.includes('@') || !email.includes('.')) {
      setErro('Informe um endereço de e-mail válido.')
      return
    }

    setErro('')
    setSubmitting(true)

    // Simulação com validação local
    setTimeout(() => {
      setSubmitting(false)
      setEnviadoComSucesso(true)

      // Fechar modal após 2 segundos com fade
      setTimeout(() => {
        onOpenChange(false)
        setNome('')
        setEmail('')
        setEnviadoComSucesso(false)
      }, 2000)
    }, 600)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-[#0B1F3A] border border-[#2563EB]/30 text-white shadow-2xl backdrop-blur-md p-6 sm:p-8">
        {!enviadoComSucesso ? (
          <>
            <DialogHeader className="text-left space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2563EB]/20 border border-[#2563EB]/40 text-[#22D3EE] text-xs font-semibold w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] animate-pulse" />
                Conexão orientada a dados
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-white">
                Começar agora
              </DialogTitle>
              <DialogDescription className="text-slate-300 text-sm">
                Preencha seus dados para conectar seu perfil à nossa base de inteligência e receber
                oportunidades compatíveis.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {erro && (
                <div className="p-3 text-xs bg-red-500/20 border border-red-500/40 text-red-200 rounded-md">
                  {erro}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Nome completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#12294A] border border-slate-600 focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] text-white placeholder-slate-400 text-sm outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  E-mail corporativo ou pessoal *
                </label>
                <input
                  type="email"
                  required
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#12294A] border border-slate-600 focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] text-white placeholder-slate-400 text-sm outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Qual é a sua intenção principal?
                </label>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setIntencao('vender')}
                    className={`flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-all ${
                      intencao === 'vender'
                        ? 'border-[#2563EB] bg-[#2563EB]/25 text-white shadow-sm ring-1 ring-[#2563EB]'
                        : 'border-slate-700 bg-[#12294A]/60 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-[#2563EB]" />
                      <span className="text-xs font-bold">Quero vender</span>
                    </div>
                    <span className="text-[11px] text-slate-400">Tenho um imóvel</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIntencao('investir')}
                    className={`flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-all ${
                      intencao === 'investir'
                        ? 'border-[#22D3EE] bg-[#22D3EE]/20 text-white shadow-sm ring-1 ring-[#22D3EE]'
                        : 'border-slate-700 bg-[#12294A]/60 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#22D3EE]" />
                      <span className="text-xs font-bold">Investir</span>
                    </div>
                    <span className="text-[11px] text-slate-400">Busco oportunidades</span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold text-sm shadow-lg hover:shadow-[#2563EB]/40 transition-all transform active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? (
                    <span>Processando dados...</span>
                  ) : (
                    <>
                      <span>Iniciar agora</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-center text-slate-400 pt-1">
                Seus dados serão tratados com total sigilo e segurança analítica.
              </p>
            </form>
          </>
        ) : (
          <div className="py-8 px-4 text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-[#22D3EE]/20 border-2 border-[#22D3EE] text-[#22D3EE] flex items-center justify-center mx-auto shadow-lg shadow-[#22D3EE]/30">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">Solicitação enviada com sucesso!</h3>
              <p className="text-sm text-slate-300 max-w-sm mx-auto">
                Nossa mecânica de dados iniciou a análise do seu perfil. Em instantes um
                especialista fará contato com os dados da compatibilidade.
              </p>
            </div>
            <div className="text-xs text-[#22D3EE] font-medium pt-2">Fechando formulário...</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
