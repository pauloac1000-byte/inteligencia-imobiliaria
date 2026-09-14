import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { salvarLeadInvestidor } from '@/services/leads'
import { CheckCircle2, ArrowRight, Loader2, AlertCircle, TrendingUp } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

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
  const [autorizoContato, setAutorizoContato] = useState(false)
  const [autorizoTouched, setAutorizoTouched] = useState(false)

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

    if (!autorizoContato) {
      setAutorizoTouched(true)
      setErrorMsg('É necessário autorizar o contato para enviar o formulário.')
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
      rota: 'investidor',
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
    setAutorizoContato(false)
    setAutorizoTouched(false)
    setSucesso(false)
    setErrorMsg('')
  }

  if (sucesso) {
    return (
      <div className="py-8 px-4 text-center space-y-5 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-[#22C7E0]/20 border-2 border-[#22C7E0] text-[#22C7E0] flex items-center justify-center mx-auto shadow-lg shadow-[#22C7E0]/30">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1A3A75]/40 border border-[#1A3A75]/70 text-[#22C7E0] text-xs font-semibold">
            Tese registrada com sucesso
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
              className="px-4 py-2 rounded-lg bg-[#081226] hover:bg-[#0B1833] border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
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
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#081226] border border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white placeholder-slate-500 text-base sm:text-sm outline-none transition-all disabled:opacity-50 min-h-[44px]"
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
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#081226] border border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white placeholder-slate-500 text-base sm:text-sm outline-none transition-all disabled:opacity-50 min-h-[44px]"
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
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#081226] border border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white placeholder-slate-500 text-base sm:text-sm outline-none transition-all disabled:opacity-50 min-h-[44px]"
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
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#081226] border border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white text-base sm:text-sm outline-none transition-all appearance-none cursor-pointer disabled:opacity-50 min-h-[44px]"
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
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#081226] border border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white text-base sm:text-sm outline-none transition-all appearance-none cursor-pointer disabled:opacity-50 min-h-[44px]"
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
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#081226] border border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white placeholder-slate-500 text-base sm:text-sm outline-none transition-all disabled:opacity-50 min-h-[44px]"
          />
        </div>
      </div>

      {/* Checkbox de Autorização de Contato */}
      <div className="pt-1 space-y-1.5">
        <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#081226]/80 border border-slate-800 transition-colors hover:border-slate-700">
          <Checkbox
            id="autorizo-contato-investidor"
            checked={autorizoContato}
            onCheckedChange={(checked) => {
              const val = checked === true
              setAutorizoContato(val)
              setAutorizoTouched(true)
              if (
                val &&
                errorMsg === 'É necessário autorizar o contato para enviar o formulário.'
              ) {
                setErrorMsg('')
              }
            }}
            className="mt-0.5 border-slate-600 data-[state=checked]:bg-[#22C7E0] data-[state=checked]:border-[#22C7E0] data-[state=checked]:text-[#070B14] cursor-pointer"
          />
          <label
            htmlFor="autorizo-contato-investidor"
            className="text-xs text-slate-300 leading-snug cursor-pointer select-none"
          >
            Autorizo o contato por WhatsApp, telefone ou e-mail sobre este cadastro, de acordo com a{' '}
            <Link
              to="/politica-de-privacidade"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#22C7E0] hover:text-[#22C7E0]/80 underline underline-offset-2 transition-colors font-medium inline-block"
              onClick={(e) => e.stopPropagation()}
            >
              Política de Privacidade
            </Link>
            . *
          </label>
        </div>

        {autorizoTouched && !autorizoContato && (
          <p className="text-[11px] text-red-400 pl-1 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
            Por favor, marque a caixa acima para autorizar o contato antes de enviar.
          </p>
        )}
      </div>

      {/* Botão de envio */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={loading || !autorizoContato}
          className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 min-h-[48px] rounded-xl bg-[#1A3A75] hover:bg-[#142E5E] active:bg-[#0F2347] text-white font-semibold text-sm shadow-inner border border-white/10 hover:border-white/20 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
              <span>Processando perfil...</span>
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4 text-[#22C7E0] shrink-0" />
              <span>Buscar oportunidades de investimento</span>
              <ArrowRight className="w-4 h-4 ml-1 shrink-0" />
            </>
          )}
        </button>
      </div>

      <p className="text-[11px] text-center text-slate-400 pt-1 leading-relaxed">
        Seus dados são usados apenas para analisar o seu caso e não são compartilhados com
        terceiros. Você pode pedir a exclusão a qualquer momento.
      </p>
    </form>
  )
}
