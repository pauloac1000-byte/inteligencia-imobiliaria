import React, { useState } from 'react'
import { salvarLeadVenda } from '@/services/leads'
import { CheckCircle2, ArrowRight, Loader2, AlertCircle, Building2 } from 'lucide-react'

interface FormVendaProps {
  onSuccess?: () => void
  onCancel?: () => void
  isInModal?: boolean
}

export const FormVenda: React.FC<FormVendaProps> = ({ onSuccess, onCancel, isInModal = true }) => {
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [tipoImovel, setTipoImovel] = useState<string>('apartamento')
  const [cidade, setCidade] = useState('')
  const [valorEstimado, setValorEstimado] = useState('')
  const [mensagem, setMensagem] = useState('')

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [sucesso, setSucesso] = useState(false)

  // Validação e envio
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nome.trim()) {
      setErrorMsg('Por favor, informe seu nome completo.')
      return
    }

    if (!telefone.trim() || telefone.trim().length < 8) {
      setErrorMsg('Por favor, informe um telefone ou WhatsApp válido.')
      return
    }

    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setErrorMsg('Por favor, insira um endereço de e-mail válido.')
      return
    }

    if (!tipoImovel) {
      setErrorMsg('Selecione o tipo de imóvel.')
      return
    }

    if (!cidade.trim()) {
      setErrorMsg('Informe a cidade do imóvel.')
      return
    }

    setErrorMsg('')
    setLoading(true)

    const res = await salvarLeadVenda({
      nome,
      telefone,
      email,
      tipo_imovel: tipoImovel,
      cidade,
      valor_estimado: valorEstimado || undefined,
      mensagem: mensagem || undefined,
    })

    setLoading(false)

    if (!res.success) {
      setErrorMsg(res.error || 'Ocorreu um erro ao registrar suas informações. Tente novamente.')
      return
    }

    setSucesso(true)
    if (onSuccess) {
      // Notifica o componente pai após tempo suficiente de leitura
      setTimeout(() => {
        onSuccess()
      }, 3500)
    }
  }

  const handleReset = () => {
    setNome('')
    setTelefone('')
    setEmail('')
    setTipoImovel('apartamento')
    setCidade('')
    setValorEstimado('')
    setMensagem('')
    setSucesso(false)
    setErrorMsg('')
  }

  if (sucesso) {
    return (
      <div className="py-8 px-4 text-center space-y-5 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-[#22D3EE]/20 border-2 border-[#22D3EE] text-[#22D3EE] flex items-center justify-center mx-auto shadow-lg shadow-[#22D3EE]/30">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2563EB]/20 border border-[#2563EB]/40 text-[#22D3EE] text-xs font-semibold">
            Dados gravados com sucesso
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight">Recebemos seus dados!</h3>
          <p className="text-slate-300 text-sm max-w-md mx-auto leading-relaxed">
            Nossa equipe de especialistas e mecânica de dados entrará em contato para analisar o
            valor do seu imóvel e apresentar compradores com perfil e liquidez compatíveis.
          </p>
        </div>

        <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-slate-400 hover:text-white underline underline-offset-4 transition-colors cursor-pointer"
          >
            Cadastrar outro imóvel
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg bg-[#12294A] hover:bg-[#1A3865] border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              Fechar janela
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      {errorMsg && (
        <div className="p-3 text-xs bg-red-500/20 border border-red-500/40 text-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid: Nome e WhatsApp */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Nome completo *
          </label>
          <input
            type="text"
            required
            placeholder="Ex.: Carlos Mendes"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            disabled={loading}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#12294A] border border-slate-600 focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] text-white placeholder-slate-400 text-base sm:text-sm outline-none transition-all disabled:opacity-50 min-h-[44px]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Telefone / WhatsApp *
          </label>
          <input
            type="tel"
            required
            placeholder="(11) 98765-4321"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            disabled={loading}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#12294A] border border-slate-600 focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] text-white placeholder-slate-400 text-base sm:text-sm outline-none transition-all disabled:opacity-50 min-h-[44px]"
          />
        </div>
      </div>

      {/* Grid: E-mail e Tipo do Imóvel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            E-mail *
          </label>
          <input
            type="email"
            required
            placeholder="carlos@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#12294A] border border-slate-600 focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] text-white placeholder-slate-400 text-base sm:text-sm outline-none transition-all disabled:opacity-50 min-h-[44px]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Tipo de imóvel *
          </label>
          <div className="relative">
            <select
              required
              value={tipoImovel}
              onChange={(e) => setTipoImovel(e.target.value)}
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#12294A] border border-slate-600 focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] text-white text-base sm:text-sm outline-none transition-all appearance-none cursor-pointer disabled:opacity-50 min-h-[44px]"
            >
              <option value="apartamento">Apartamento</option>
              <option value="casa">Casa</option>
              <option value="terreno">Terreno / Lote</option>
              <option value="comercial">Imóvel Comercial / Sala</option>
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              ▼
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Cidade e Valor Estimado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Cidade / Estado *
          </label>
          <input
            type="text"
            required
            placeholder="Ex.: São Paulo, SP"
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            disabled={loading}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#12294A] border border-slate-600 focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] text-white placeholder-slate-400 text-base sm:text-sm outline-none transition-all disabled:opacity-50 min-h-[44px]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Valor estimado de venda
          </label>
          <input
            type="text"
            placeholder="Ex.: R$ 850.000"
            value={valorEstimado}
            onChange={(e) => setValorEstimado(e.target.value)}
            disabled={loading}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#12294A] border border-slate-600 focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] text-white placeholder-slate-400 text-base sm:text-sm outline-none transition-all disabled:opacity-50 min-h-[44px]"
          />
        </div>
      </div>

      {/* Mensagem / Observações */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          Mensagem ou detalhes do imóvel (opcional)
        </label>
        <textarea
          rows={isInModal ? 2 : 3}
          placeholder="Ex.: Bairro, metragem aproximada, condomínio ou urgência..."
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          disabled={loading}
          className="w-full px-3.5 py-2 rounded-lg bg-[#12294A] border border-slate-600 focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] text-white placeholder-slate-400 text-sm outline-none transition-all resize-none disabled:opacity-50"
        />
      </div>

      {/* Botão de envio */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 min-h-[48px] rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white font-semibold text-sm shadow-lg hover:shadow-[#2563EB]/40 transition-all transform active:scale-[0.99] disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
              <span>Gravando dados no Supabase...</span>
            </>
          ) : (
            <>
              <Building2 className="w-4 h-4 shrink-0" />
              <span>Cadastrar imóvel para venda</span>
              <ArrowRight className="w-4 h-4 ml-1 shrink-0" />
            </>
          )}
        </button>
      </div>

      <p className="text-[11px] text-center text-slate-400 pt-1">
        Nenhum dado é perdido. Seus dados são salvos em nosso banco com total sigilo analítico.
      </p>
    </form>
  )
}
