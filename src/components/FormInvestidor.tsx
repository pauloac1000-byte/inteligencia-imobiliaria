import React, { useState } from 'react'
import { salvarLeadInvestidor } from '@/services/leads'
import { CheckCircle2, ArrowRight, Loader2, AlertCircle, TrendingUp } from 'lucide-react'

interface FormInvestidorProps {
  onSuccess?: () => void
  onCancel?: () => void
  isInModal?: boolean
}

const OPCOES_PERFIL = [
  { value: 'comprar para morar', label: 'Comprar para morar' },
  { value: 'investir para renda', label: 'Investir para renda (locação/yield)' },
  { value: 'investir para revenda', label: 'Investir para revenda (retrofit/flip)' },
]

export const FormInvestidor: React.FC<FormInvestidorProps> = ({
  onSuccess,
  onCancel,
  isInModal = true,
}) => {
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [perfil, setPerfil] = useState<string>('investir para renda')
  const [faixaValor, setFaixaValor] = useState('R$ 500 mil a R$ 1 milhão')
  const [cidadesInteresse, setCidadesInteresse] = useState('')

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [sucesso, setSucesso] = useState(false)

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

    if (!perfil) {
      setErrorMsg('Selecione seu perfil de investimento.')
      return
    }

    if (!faixaValor.trim()) {
      setErrorMsg('Informe a faixa de valor pretendida.')
      return
    }

    if (!cidadesInteresse.trim()) {
      setErrorMsg('Informe as cidades ou regiões de interesse.')
      return
    }

    setErrorMsg('')
    setLoading(true)

    const res = await salvarLeadInvestidor({
      nome,
      telefone,
      email,
      perfil,
      faixa_valor: faixaValor,
      cidades_interesse: cidadesInteresse,
    })

    setLoading(false)

    if (!res.success) {
      setErrorMsg(
        res.error || 'Ocorreu um erro ao salvar seu perfil de investidor. Tente novamente.',
      )
      return
    }

    setSucesso(true)
    if (onSuccess) {
      setTimeout(() => {
        onSuccess()
      }, 3500)
    }
  }

  const handleReset = () => {
    setNome('')
    setTelefone('')
    setEmail('')
    setPerfil('investir para renda')
    setFaixaValor('R$ 500 mil a R$ 1 milhão')
    setCidadesInteresse('')
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#22D3EE]/20 border border-[#22D3EE]/40 text-[#22D3EE] text-xs font-semibold">
            Tese registrada no Supabase
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight">Recebemos seus dados!</h3>
          <p className="text-slate-300 text-sm max-w-md mx-auto leading-relaxed">
            Nossa mecânica de dados iniciou o mapeamento de ativos compatíveis com a sua tese. Nossa
            equipe entrará em contato com oportunidades selecionadas antes de chegarem ao mercado
            aberto.
          </p>
        </div>

        <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-slate-400 hover:text-white underline underline-offset-4 transition-colors cursor-pointer"
          >
            Registrar outra tese
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
            placeholder="Ex.: Mariana Albuquerque"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            disabled={loading}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#12294A] border border-slate-600 focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] text-white placeholder-slate-400 text-sm outline-none transition-all disabled:opacity-50"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Telefone / WhatsApp *
          </label>
          <input
            type="tel"
            required
            placeholder="(11) 99876-5432"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            disabled={loading}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#12294A] border border-slate-600 focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] text-white placeholder-slate-400 text-sm outline-none transition-all disabled:opacity-50"
          />
        </div>
      </div>

      {/* Grid: E-mail e Perfil */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            E-mail *
          </label>
          <input
            type="email"
            required
            placeholder="mariana@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#12294A] border border-slate-600 focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] text-white placeholder-slate-400 text-sm outline-none transition-all disabled:opacity-50"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Perfil de interesse *
          </label>
          <div className="relative">
            <select
              required
              value={perfil}
              onChange={(e) => setPerfil(e.target.value)}
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#12294A] border border-slate-600 focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] text-white text-sm outline-none transition-all appearance-none cursor-pointer disabled:opacity-50"
            >
              {OPCOES_PERFIL.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              ▼
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Faixa de Valor e Cidades de Interesse */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Faixa de valor pretendida *
          </label>
          <div className="relative">
            <select
              required
              value={faixaValor}
              onChange={(e) => setFaixaValor(e.target.value)}
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#12294A] border border-slate-600 focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] text-white text-sm outline-none transition-all appearance-none cursor-pointer disabled:opacity-50"
            >
              <option value="Até R$ 500 mil">Até R$ 500 mil</option>
              <option value="R$ 500 mil a R$ 1 milhão">R$ 500 mil a R$ 1 milhão</option>
              <option value="R$ 1 milhão a R$ 2,5 milhões">R$ 1 milhão a R$ 2,5 milhões</option>
              <option value="R$ 2,5 milhões a R$ 5 milhões">R$ 2,5 milhões a R$ 5 milhões</option>
              <option value="Acima de R$ 5 milhões">Acima de R$ 5 milhões</option>
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              ▼
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Cidades / Regiões de interesse *
          </label>
          <input
            type="text"
            required
            placeholder="Ex.: São Paulo (Sul e Oeste), Campinas"
            value={cidadesInteresse}
            onChange={(e) => setCidadesInteresse(e.target.value)}
            disabled={loading}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#12294A] border border-slate-600 focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] text-white placeholder-slate-400 text-sm outline-none transition-all disabled:opacity-50"
          />
        </div>
      </div>

      {/* Botão de envio */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 min-h-[48px] rounded-xl bg-[#22D3EE] hover:bg-[#06b6d4] active:bg-[#0891b2] text-[#0B1F3A] font-bold text-sm shadow-lg hover:shadow-[#22D3EE]/30 transition-all transform active:scale-[0.99] disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#0B1F3A] shrink-0" />
              <span>Gravando dados no Supabase...</span>
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4 shrink-0" />
              <span>Buscar oportunidades de investimento</span>
              <ArrowRight className="w-4 h-4 ml-1 shrink-0" />
            </>
          )}
        </button>
      </div>

      <p className="text-[11px] text-center text-slate-400 pt-1">
        Conexão direta com pontas verificadas. Seus dados são salvos com segurança analítica.
      </p>
    </form>
  )
}
