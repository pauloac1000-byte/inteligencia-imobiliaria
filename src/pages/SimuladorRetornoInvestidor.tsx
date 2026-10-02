import React, { useState, useId } from 'react'
import { Link, useOutletContext, useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  ArrowRight,
  Building,
  HelpCircle,
  RotateCcw,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Percent,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Wallet,
  Clock,
  DollarSign,
  PieChart,
} from 'lucide-react'
import {
  KORBIX_WHATSAPP_NUMBER,
  KORBIX_WHATSAPP_DISPLAY,
  salvarLeadSimuladorInvestidor,
} from '@/services/leads'
import { ConfirmationProtocolo } from '@/components/ConfirmationProtocolo'
import { Footer } from '@/components/Footer'
import { registrarEvento } from '@/services/eventos'

interface LayoutContextType {
  onOpenModal?: (intent?: 'vender' | 'investir') => void
}

/**
 * Utilitários de formatação e parsing monetário PT-BR
 */
function parseCurrency(raw: string): number {
  if (!raw) return 0
  const clean = raw.replace(/[^\d]/g, '')
  if (!clean) return 0
  // Centavos implícitos: ex "35000000" => 350000.00
  return Number(clean) / 100
}

function formatCurrency(value: number): string {
  if (isNaN(value) || value === null || value === undefined) return 'R$ 0,00'
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatCurrencyCompact(value: number): string {
  if (isNaN(value) || value === null || value === undefined) return 'R$ 0'
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
}

function numberToCurrencyInput(centsNumber: number): string {
  return centsNumber.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatarTelefone(valor: string): string {
  const digits = valor.replace(/\D/g, '').slice(0, 11)
  if (!digits) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

export const SimuladorRetornoInvestidor: React.FC = () => {
  const context = useOutletContext<LayoutContextType>()
  const navigate = useNavigate()
  const helpId = useId()

  // Entradas sugeridas com defaults razoáveis e realistas
  // Exemplo típico: Compra R$ 380.000, Reforma R$ 50.000, Aluguel R$ 2.400/mês, Revenda em 24 meses, Valorização 10% a.a.
  const [valorCompraStr, setValorCompraStr] = useState<string>('R$ 380.000,00')
  const [custoReformaStr, setCustoReformaStr] = useState<string>('R$ 50.000,00')
  const [aluguelMensalStr, setAluguelMensalStr] = useState<string>('R$ 2.400,00')
  const [prazoRevendaMeses, setPrazoRevendaMeses] = useState<number>(24)
  const [valorizacaoAnual, setValorizacaoAnual] = useState<number>(10.0) // 10% a.a.
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false)

  // Mini-formulário inline de conversão da tese
  const [showLeadForm, setShowLeadForm] = useState<boolean>(false)
  const [cidadeLead, setCidadeLead] = useState<string>('')
  const [telefoneLead, setTelefoneLead] = useState<string>('')
  const [leadLoading, setLeadLoading] = useState<boolean>(false)
  const [leadError, setLeadError] = useState<string>('')
  const [leadProtocolo, setLeadProtocolo] = useState<string>('')
  const [leadSucesso, setLeadSucesso] = useState<boolean>(false)

  // Handlers para inputs de moeda
  const handleCurrencyChange =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawDigits = e.target.value.replace(/\D/g, '')
      if (!rawDigits) {
        setter('R$ 0,00')
        return
      }
      const val = Number(rawDigits) / 100
      setter(numberToCurrencyInput(val))
    }

  // Parse de valores numéricos
  const valorCompra = parseCurrency(valorCompraStr)
  const custoReforma = parseCurrency(custoReformaStr)
  const aluguelMensal = parseCurrency(aluguelMensalStr)
  const meses = Math.max(1, Math.min(120, prazoRevendaMeses || 1))
  const valorizacaoAnualPercent = Math.max(0, valorizacaoAnual)

  // ==========================================
  // CÁLCULO 100% CLIENT-SIDE (Sem IA, sem NaN):
  // ==========================================
  // 1. Capital investido = valor de compra + custo de reforma
  const capitalInvestido = valorCompra + custoReforma

  // 2. Valor estimado na revenda = valor de compra × (1 + valorização anual)^(meses/12)
  const fatorTempoAnos = meses / 12
  const taxaAnualDecimal = valorizacaoAnualPercent / 100
  const valorRevendaEstimado =
    valorCompra > 0 ? valorCompra * Math.pow(1 + taxaAnualDecimal, fatorTempoAnos) : 0

  // Ganho bruto de valorização patrimonial
  const ganhoValorizacao = Math.max(0, valorRevendaEstimado - valorCompra)

  // 3. Aluguel acumulado no prazo
  const totalAlugueisAcumulado = aluguelMensal * meses

  // Total recebido = aluguéis acumulados + valor estimado de revenda
  const totalRecebido = totalAlugueisAcumulado + valorRevendaEstimado

  // Lucro líquido = total recebido - capital investido
  const lucroTotal = totalRecebido - capitalInvestido

  // Retorno total na revenda (%) sobre o capital investido
  const retornoTotalPercent = capitalInvestido > 0 ? (lucroTotal / capitalInvestido) * 100 : 0

  // 4. Rentabilidade mensal sobre o capital (%):
  // Rendimento médio mensal = aluguel mensal + valorização média mensal
  // Valorização média mensal = ganho de valorização ÷ meses
  const valorizacaoMediaMensal = meses > 0 ? ganhoValorizacao / meses : 0
  const rendimentoMedioMensal = aluguelMensal + valorizacaoMediaMensal
  const rentabilidadeMensalPercent =
    capitalInvestido > 0 ? (rendimentoMedioMensal / capitalInvestido) * 100 : 0

  // Dividend yield mensal puro (só aluguel)
  const yieldMensalAluguel = capitalInvestido > 0 ? (aluguelMensal / capitalInvestido) * 100 : 0

  // 5. Prazo de retorno do capital investido (payback em meses):
  // Meses necessários para o fluxo acumulado cobrir o capital investido.
  // Em cada mês m: fluxo acumulado = (aluguelMensal * m) + ganho de valorização proporcional (m/meses * ganhoValorizacao)
  // Ou seja: rendimento médio mensal = aluguelMensal + valorizacaoMediaMensal
  // Se houver revenda ao final do prazo, o capital já pode ser recuperado integralmente no prazo de revenda.
  // Caso o rendimento mensal amortize o capital: capitalInvestido / rendimentoMedioMensal
  let paybackMesesText = 'Calculando...'
  let paybackMesesNum = 0
  if (capitalInvestido <= 0) {
    paybackMesesText = 'Defina os valores'
  } else if (rendimentoMedioMensal > 0) {
    // Meses via fluxo contínuo
    const mesesNecessarios = capitalInvestido / rendimentoMedioMensal
    paybackMesesNum = Math.ceil(mesesNecessarios)
    if (paybackMesesNum <= meses) {
      paybackMesesText = `~${paybackMesesNum} ${paybackMesesNum === 1 ? 'mês' : 'meses'}`
    } else {
      // Se a revenda ocorrer no mês do prazo, o capital é liquidado na revenda
      paybackMesesText = `~${meses} meses (na revenda) ou ${paybackMesesNum}m contínuos`
    }
  } else {
    paybackMesesText = 'Indeterminado'
  }

  // Frase de leitura contextualizada
  const fraseLeitura =
    capitalInvestido > 0
      ? `Com um capital de ${formatCurrencyCompact(capitalInvestido)}, você tem retorno estimado de ${retornoTotalPercent.toFixed(1).replace('.', ',')}% ao final de ${meses} ${meses === 1 ? 'mês' : 'meses'} (lucro projetado de ${formatCurrency(lucroTotal)}) e rentabilidade média de ${rentabilidadeMensalPercent.toFixed(2).replace('.', ',')}% ao mês.`
      : 'Informe o valor de compra e reforma para calcular os retornos estimados da sua tese.'

  const handleResetPadrao = () => {
    setValorCompraStr('R$ 380.000,00')
    setCustoReformaStr('R$ 50.000,00')
    setAluguelMensalStr('R$ 2.400,00')
    setPrazoRevendaMeses(24)
    setValorizacaoAnual(10.0)
  }

  const handleTelefoneLeadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelefoneLead(formatarTelefone(e.target.value))
    if (leadError) setLeadError('')
  }

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!cidadeLead.trim()) {
      setLeadError('Informe a cidade ou região de interesse.')
      return
    }

    const digits = telefoneLead.replace(/\D/g, '')
    if (!digits || digits.length < 10) {
      setLeadError('Por favor, informe um WhatsApp válido com DDD (mínimo 10 dígitos).')
      return
    }

    if (capitalInvestido <= 0) {
      setLeadError('Preencha os valores da simulação antes de enviar sua tese.')
      return
    }

    setLeadError('')
    setLeadLoading(true)

    const res = await salvarLeadSimuladorInvestidor({
      cidade: cidadeLead,
      telefone: telefoneLead,
      valor_compra: valorCompraStr,
      custo_reforma: custoReformaStr,
      aluguel_mensal: aluguelMensalStr,
      prazo_revenda_meses: meses,
      valorizacao_anual: valorizacaoAnualPercent,
      capital_investido: formatCurrency(capitalInvestido),
      rentabilidade_mensal: Number(rentabilidadeMensalPercent.toFixed(2)),
      retorno_total: Number(retornoTotalPercent.toFixed(2)),
      rota: 'investidor',
    })

    setLeadLoading(false)

    if (!res.success) {
      setLeadError(res.error || 'Não foi possível gravar sua tese no momento. Tente novamente.')
      return
    }

    setLeadProtocolo(res.protocolo || 'KX-0001')
    setLeadSucesso(true)

    // Disparar cadastro_completo para o lead do simulador
    registrarEvento('cadastro_completo', '/simulador-de-retorno', {
      origem: 'simulador',
    })
  }

  const handleResetLead = () => {
    setLeadSucesso(false)
    setLeadProtocolo('')
    setCidadeLead('')
    setTelefoneLead('')
    setLeadError('')
    setShowLeadForm(false)
  }

  const handleQueroInvestirModal = () => {
    if (context?.onOpenModal) {
      context.onOpenModal('investir')
    } else {
      navigate('/#para-investir')
    }
  }

  // Link WhatsApp com números-chave da simulação
  const mensagemWhatsApp = `Olá, equipe KORBIX! Simulei uma tese de investimento no simulador de retorno: Capital de ${formatCurrencyCompact(
    capitalInvestido,
  )} (compra ${formatCurrencyCompact(valorCompra)} + reforma ${formatCurrencyCompact(
    custoReforma,
  )}), aluguel estimado de ${formatCurrency(
    aluguelMensal,
  )}/mês e revenda em ${meses} meses (retorno projetado de ${retornoTotalPercent.toFixed(
    1,
  )}% / ${rentabilidadeMensalPercent.toFixed(
    2,
  )}% a.m.). Gostaria de conhecer oportunidades com este perfil.`
  const whatsappUrl = `https://wa.me/${KORBIX_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    mensagemWhatsApp,
  )}`

  return (
    <div className="w-full flex flex-col min-h-screen bg-[#070B14] text-slate-100">
      {/* Top Breadcrumb & Hero Header */}
      <section className="pt-24 sm:pt-28 md:pt-32 pb-8 sm:pb-12 px-3.5 sm:px-6 lg:px-8 border-b border-slate-900/80 bg-gradient-to-b from-[#081226]/60 via-[#070B14] to-[#070B14]">
        <div className="max-w-[1200px] mx-auto">
          {/* Breadcrumb simples */}
          <nav aria-label="Navegação estrutural" className="mb-4 sm:mb-6">
            <ol className="flex items-center gap-2 text-xs text-slate-400">
              <li>
                <Link
                  to="/"
                  className="hover:text-[#22C7E0] transition-colors focus:outline-none focus:underline"
                >
                  Início
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-slate-200 font-medium" aria-current="page">
                Simulador de Retorno para Investidores
              </li>
            </ol>
          </nav>

          {/* Selo Simulação Ilustrativa em ciano */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22C7E0]/10 border border-[#22C7E0]/30 text-[#22C7E0] text-[11px] sm:text-xs font-semibold uppercase tracking-wider mb-4 shadow-[0_0_12px_rgba(34,199,224,0.15)]">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Simulação Ilustrativa • Sem Cadastro Prévio</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white max-w-3xl leading-[1.15]">
            Simulador de Retorno <span className="text-[#22C7E0]">para Investidores</span>
          </h1>

          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            Projete o ganho combinado de renda de aluguel e valorização de revenda com base no seu
            capital disponível. Cálculo em tempo real 100% no seu navegador.
          </p>
        </div>
      </section>

      {/* Main Interactive Grid */}
      <section className="py-8 sm:py-12 md:py-16 px-3.5 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Coluna Esquerda: Formulário de Entradas (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-[#081226] border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl shadow-black/40">
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#22C7E0]/10 border border-[#22C7E0]/30 flex items-center justify-center text-[#22C7E0]">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-white">
                      Parâmetros da Oportunidade
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetPadrao}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#22C7E0] transition-colors cursor-pointer py-1 px-2 rounded-md hover:bg-white/5"
                    title="Restaurar valores de exemplo"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Redefinir</span>
                  </button>
                </div>

                <div className="space-y-4 sm:space-y-5">
                  {/* Grid: Valor de Compra e Custo de Reforma */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Campo 1: Valor de Compra */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="sim-valor-compra"
                          className="text-xs font-semibold uppercase tracking-wider text-slate-300"
                        >
                          Valor de compra
                        </label>
                        <span className="text-[11px] text-slate-400 font-mono">Aquisição</span>
                      </div>
                      <input
                        id="sim-valor-compra"
                        type="text"
                        inputMode="numeric"
                        value={valorCompraStr}
                        onChange={handleCurrencyChange(setValorCompraStr)}
                        className="w-full px-3.5 py-3 rounded-xl bg-[#070B14] border border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white font-mono text-base sm:text-lg outline-none transition-all"
                        placeholder="R$ 0,00"
                      />
                      <p className="text-[11px] text-slate-400">
                        Preço negociado de compra do imóvel.
                      </p>
                    </div>

                    {/* Campo 2: Custo de Reforma */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="sim-custo-reforma"
                          className="text-xs font-semibold uppercase tracking-wider text-slate-300"
                        >
                          Custo de reforma
                        </label>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Capex / Retrofit
                        </span>
                      </div>
                      <input
                        id="sim-custo-reforma"
                        type="text"
                        inputMode="numeric"
                        value={custoReformaStr}
                        onChange={handleCurrencyChange(setCustoReformaStr)}
                        className="w-full px-3.5 py-3 rounded-xl bg-[#070B14] border border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white font-mono text-base sm:text-lg outline-none transition-all"
                        placeholder="R$ 0,00"
                      />
                      <p className="text-[11px] text-slate-400">
                        Pintura, marcenaria e adequações.
                      </p>
                    </div>
                  </div>

                  {/* Resumo do Capital Investido */}
                  <div className="p-3 rounded-xl bg-[#070B14] border border-slate-800 flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-slate-300 flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-[#22C7E0]" />
                      Capital Total Investido (Compra + Reforma):
                    </span>
                    <span className="font-mono font-bold text-white text-base">
                      {formatCurrency(capitalInvestido)}
                    </span>
                  </div>

                  {/* Campo 3: Aluguel Mensal Estimado */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="sim-aluguel-mensal"
                        className="text-xs font-semibold uppercase tracking-wider text-slate-300"
                      >
                        Aluguel mensal estimado
                      </label>
                      <span className="text-[11px] text-[#22C7E0] font-mono">
                        Yield direto: {yieldMensalAluguel.toFixed(2).replace('.', ',')}% a.m.
                      </span>
                    </div>
                    <input
                      id="sim-aluguel-mensal"
                      type="text"
                      inputMode="numeric"
                      value={aluguelMensalStr}
                      onChange={handleCurrencyChange(setAluguelMensalStr)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B14] border border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white font-mono text-sm sm:text-base outline-none transition-all"
                      placeholder="R$ 0,00"
                    />
                    <p className="text-[11px] text-slate-400">
                      Renda mensal bruta de locação durante o período em que estiver com o imóvel.
                    </p>
                  </div>

                  {/* Campo 4: Prazo de revenda em meses */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="sim-prazo-meses"
                        className="text-xs font-semibold uppercase tracking-wider text-slate-300"
                      >
                        Prazo estimado de revenda (meses)
                      </label>
                      <span className="text-[11px] text-[#22C7E0] font-mono font-bold">
                        {meses} {meses === 1 ? 'mês' : 'meses'} (~{(meses / 12).toFixed(1)} anos)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="sim-prazo-meses"
                        type="number"
                        min="1"
                        max="120"
                        step="1"
                        value={prazoRevendaMeses || ''}
                        onChange={(e) => {
                          const n = parseInt(e.target.value, 10)
                          setPrazoRevendaMeses(isNaN(n) ? 0 : Math.max(1, Math.min(120, n)))
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B14] border border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white font-mono text-sm sm:text-base outline-none transition-all"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setPrazoRevendaMeses((prev) => Math.max(1, (prev || 1) - 6))
                          }
                          className="px-2.5 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                          aria-label="Diminuir 6 meses"
                        >
                          -6m
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPrazoRevendaMeses((prev) => Math.max(1, (prev || 1) - 1))
                          }
                          className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
                          aria-label="Diminuir um mês"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPrazoRevendaMeses((prev) => Math.min(120, (prev || 0) + 1))
                          }
                          className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
                          aria-label="Aumentar um mês"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPrazoRevendaMeses((prev) => Math.min(120, (prev || 0) + 6))
                          }
                          className="px-2.5 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                          aria-label="Aumentar 6 meses"
                        >
                          +6m
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Campo 5: Valorização esperada ao ano (% a.a.) com slider retrátil */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="w-full flex items-center justify-between py-2 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer group"
                      aria-expanded={showAdvanced}
                    >
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-[#22C7E0]" />
                        <span className="font-semibold">Valorização patrimonial esperada:</span>
                        <span className="font-mono text-[#22C7E0] font-bold">
                          {valorizacaoAnual.toFixed(1).replace('.', ',')}% ao ano
                        </span>
                        <span className="text-[10px] text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
                          Padrão: 10,0%
                        </span>
                      </div>
                      <div className="text-slate-400 group-hover:text-white transition-colors">
                        {showAdvanced ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </button>

                    {showAdvanced ? (
                      <div className="mt-3 p-4 rounded-xl bg-[#070B14] border border-slate-800 space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between text-xs">
                          <label htmlFor="sim-taxa-val" className="text-slate-300 font-medium">
                            Taxa de valorização anual (% a.a.)
                          </label>
                          <span className="text-slate-400 font-mono text-[11px]">
                            Apreciação de mercado + valor agregado pela reforma
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            id="sim-taxa-val"
                            type="range"
                            min="0.0"
                            max="30.0"
                            step="0.5"
                            value={valorizacaoAnual}
                            onChange={(e) => setValorizacaoAnual(parseFloat(e.target.value))}
                            className="flex-1 accent-[#22C7E0] cursor-pointer"
                          />
                          <div className="w-24 shrink-0">
                            <input
                              type="number"
                              min="0"
                              max="50"
                              step="0.5"
                              value={valorizacaoAnual}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value)
                                setValorizacaoAnual(isNaN(v) ? 0 : Math.max(0, v))
                              }}
                              className="w-full px-2.5 py-1.5 text-center rounded-lg bg-[#081226] border border-slate-700 text-white font-mono text-sm focus:border-[#22C7E0] outline-none"
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Combina a inflação imobiliária natural da região com o ganho de capital
                          trazido por reformas e compras com desconto.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center gap-3">
                        <input
                          type="range"
                          min="0.0"
                          max="30.0"
                          step="0.5"
                          value={valorizacaoAnual}
                          onChange={(e) => setValorizacaoAnual(parseFloat(e.target.value))}
                          className="flex-1 accent-[#22C7E0] cursor-pointer"
                          aria-label="Ajustar valorização anual"
                        />
                        <span className="text-xs font-mono text-slate-300 w-16 text-right">
                          {valorizacaoAnual.toFixed(1).replace('.', ',')}% a.a.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card explicativo de transparência dos cálculos */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#081226]/50 border border-slate-800/60 text-xs text-slate-300 space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <ShieldCheck className="w-4 h-4 text-[#22C7E0] shrink-0" />
                  <span>Metodologia analítica transparente</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  <strong className="text-slate-200">Capital Investido:</strong> Soma do valor de
                  compra com o capex de reforma necessário para deixar o ativo pronto.
                </p>
                <p className="text-slate-400 leading-relaxed">
                  <strong className="text-slate-200">Valor na Revenda:</strong> Valor de compra
                  corrigido pela taxa anual composta no período de {meses} meses (
                  {fatorTempoAnos.toFixed(1)} anos).
                </p>
                <p className="text-slate-400 leading-relaxed">
                  <strong className="text-slate-200">Retorno Total e Payback:</strong> Soma dos
                  aluguéis líquidos acumulados ao ganho de capital na revenda sobre o valor
                  investido, calculando o tempo de recuperação do aporte inicial.
                </p>
              </div>
            </div>

            {/* Coluna Direita: Resultado em Destaque + CTAs (5 cols) */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
              {/* Card Principal de Resultado com Glow Ciano Tech-Midnight */}
              <div className="relative rounded-2xl bg-[#081226] border border-[#22C7E0]/40 p-5 sm:p-7 shadow-[0_0_35px_rgba(34,199,224,0.15)] overflow-hidden">
                <div
                  className="absolute -top-20 -right-20 w-44 h-44 rounded-full bg-[#22C7E0]/15 blur-3xl pointer-events-none"
                  aria-hidden="true"
                />

                <div className="relative space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#22C7E0] flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Projeção da Tese
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 bg-[#070B14] px-2 py-0.5 rounded-full border border-slate-800">
                      {meses} meses de horizonte
                    </span>
                  </div>

                  {/* Destaque Principal: Retorno Total na Revenda */}
                  <div className="space-y-1">
                    <span className="text-xs uppercase tracking-wider font-semibold text-slate-300">
                      Retorno Total na Revenda
                    </span>
                    <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-mono text-[#22C7E0] tracking-tight drop-shadow-[0_0_12px_rgba(34,199,224,0.35)] break-words">
                      {retornoTotalPercent.toFixed(1).replace('.', ',')}%
                      <span className="text-base sm:text-lg font-normal text-slate-300 ml-2">
                        (+{formatCurrency(lucroTotal)})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 pt-0.5">
                      Total recebido:{' '}
                      <strong className="text-slate-200 font-mono">
                        {formatCurrency(totalRecebido)}
                      </strong>{' '}
                      sobre <span className="font-mono">{formatCurrency(capitalInvestido)}</span>{' '}
                      investidos.
                    </p>
                  </div>

                  {/* Grid de Métricas Secundárias: Rentabilidade Mensal e Payback */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-[#070B14] border border-slate-800 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                        <DollarSign className="w-3.5 h-3.5 text-[#22C7E0]" />
                        <span>Rentabilidade Mensal:</span>
                      </div>
                      <div className="font-mono text-lg font-bold text-white">
                        {rentabilidadeMensalPercent.toFixed(2).replace('.', ',')}%
                        <span className="text-[11px] text-slate-400 font-normal"> /mês</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ~{formatCurrency(rendimentoMedioMensal)}/mês médio
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#070B14] border border-slate-800 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                        <Clock className="w-3.5 h-3.5 text-[#22C7E0]" />
                        <span>Prazo de Retorno:</span>
                      </div>
                      <div className="font-mono text-base font-bold text-white">
                        {paybackMesesText}
                      </div>
                      <div className="text-[10px] text-slate-400">recuperação do capital</div>
                    </div>
                  </div>

                  {/* Detalhamento das fontes de retorno */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/70 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="inline-flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        Valor estimado na revenda:
                      </span>
                      <span className="font-mono font-medium text-slate-200">
                        {formatCurrency(valorRevendaEstimado)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="inline-flex items-center gap-1.5">
                        <PieChart className="w-3.5 h-3.5 text-[#22C7E0]" />
                        Ganho de valorização do imóvel:
                      </span>
                      <span className="font-mono font-medium text-[#22C7E0]">
                        +{formatCurrency(ganhoValorizacao)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Aluguéis acumulados ({meses}m):
                      </span>
                      <span className="font-mono font-medium text-slate-200">
                        +{formatCurrency(totalAlugueisAcumulado)}
                      </span>
                    </div>
                  </div>

                  {/* Frase de Leitura Dinâmica em Destaque */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-[#1A3A75]/25 border border-[#1A3A75]/70 text-slate-200 text-xs sm:text-sm leading-relaxed">
                    <p className="font-medium text-white italic">&ldquo;{fraseLeitura}&rdquo;</p>
                  </div>

                  {/* Disclaimer discreto */}
                  <div className="pt-1 flex items-start gap-2 text-[11px] text-slate-400 leading-tight">
                    <HelpCircle
                      id={helpId}
                      className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5"
                    />
                    <p>
                      Simulação ilustrativa para modelagem de tese, sem garantia de rentabilidade
                      passada ou futura.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bloco de Conversão da Tese: Quero oportunidades com este perfil */}
              <div className="space-y-4">
                {leadSucesso ? (
                  <div className="p-5 sm:p-6 rounded-2xl bg-[#081226] border border-[#22C7E0]/50 shadow-[0_0_35px_rgba(34,199,224,0.15)] animate-fade-in">
                    <ConfirmationProtocolo
                      protocolo={leadProtocolo}
                      rota="investidor"
                      onReset={handleResetLead}
                      resetLabel="Fazer nova simulação"
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl bg-gradient-to-b from-[#081226] to-[#0A1838] border border-[#22C7E0]/40 p-5 sm:p-6 shadow-[0_0_30px_rgba(34,199,224,0.15)] space-y-4">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#22C7E0]/10 border border-[#22C7E0]/30 text-[#22C7E0] text-[11px] font-semibold uppercase tracking-wider">
                        <Sparkles className="w-3 h-3 shrink-0" />
                        <span>Curadoria Sob Demanda</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                        Receba oportunidades compatíveis com este perfil
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Gravamos suas entradas de capital ({formatCurrencyCompact(capitalInvestido)}
                        ) e retorno ({retornoTotalPercent.toFixed(1)}%) para cruzar com imóveis em
                        negociação na sua cidade.
                      </p>
                    </div>

                    {!showLeadForm ? (
                      <button
                        type="button"
                        onClick={() => {
                          registrarEvento('formulario_iniciado', '/simulador-de-retorno', {
                            origem: 'simulador',
                            disparo: 'abrir_formulario_tese',
                          })
                          setShowLeadForm(true)
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 min-h-[48px] rounded-xl bg-gradient-to-r from-[#22C7E0] to-[#1BA8BD] hover:from-[#35d0e8] hover:to-[#22C7E0] active:brightness-95 text-[#070B14] font-bold text-sm shadow-[0_0_20px_rgba(34,199,224,0.35)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-[#070B14]" />
                        <span>Quero oportunidades com este perfil</span>
                        <ArrowRight className="w-4 h-4 ml-0.5 shrink-0" />
                      </button>
                    ) : (
                      <form
                        onSubmit={handleSubmitLead}
                        className="space-y-3.5 pt-1 animate-fade-in text-left"
                      >
                        {leadError && (
                          <div className="p-3 text-xs bg-red-500/20 border border-red-500/40 text-red-200 rounded-lg flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                            <span>{leadError}</span>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <label
                            htmlFor="sim-lead-cidade"
                            className="text-xs font-semibold uppercase tracking-wider text-slate-300"
                          >
                            Cidade / Região de interesse *
                          </label>
                          <input
                            id="sim-lead-cidade"
                            type="text"
                            required
                            placeholder="Ex.: Campinas, SP ou Região Metropolitana"
                            value={cidadeLead}
                            onChange={(e) => {
                              setCidadeLead(e.target.value)
                              if (leadError) setLeadError('')
                            }}
                            disabled={leadLoading}
                            className="w-full px-3.5 py-2.5 rounded-lg bg-[#070B14] border border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white placeholder-slate-500 text-base sm:text-sm outline-none transition-all disabled:opacity-50 min-h-[44px]"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label
                            htmlFor="sim-lead-whatsapp"
                            className="text-xs font-semibold uppercase tracking-wider text-slate-300"
                          >
                            WhatsApp *
                          </label>
                          <input
                            id="sim-lead-whatsapp"
                            type="tel"
                            required
                            placeholder="(19) 98765-4321"
                            value={telefoneLead}
                            onChange={handleTelefoneLeadChange}
                            disabled={leadLoading}
                            className="w-full px-3.5 py-2.5 rounded-lg bg-[#070B14] border border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white placeholder-slate-500 text-base sm:text-sm outline-none transition-all disabled:opacity-50 min-h-[44px]"
                          />
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#070B14]/80 border border-slate-800 text-[11px] text-slate-400 leading-snug flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#22C7E0] shrink-0" />
                          <span>
                            Enviaremos oportunidades com tese equivalente ao seu perfil direto no
                            WhatsApp.
                          </span>
                        </div>

                        <div className="pt-1 flex flex-col gap-2">
                          <button
                            type="submit"
                            disabled={leadLoading}
                            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 min-h-[48px] rounded-xl bg-gradient-to-r from-[#22C7E0] to-[#1BA8BD] hover:from-[#35d0e8] hover:to-[#22C7E0] active:brightness-95 text-[#070B14] font-bold text-sm shadow-[0_0_20px_rgba(34,199,224,0.35)] transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            {leadLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin text-[#070B14] shrink-0" />
                                <span>Gravando tese e gerando protocolo...</span>
                              </>
                            ) : (
                              <>
                                <span>Quero oportunidades com este perfil</span>
                                <ArrowRight className="w-4 h-4 ml-0.5 shrink-0 text-[#070B14]" />
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowLeadForm(false)}
                            disabled={leadLoading}
                            className="text-xs text-slate-400 hover:text-white py-1 transition-colors cursor-pointer text-center"
                          >
                            Recolher formulário
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* CTAs Auxiliares de Atendimento */}
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={handleQueroInvestirModal}
                    className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 min-h-[48px] rounded-xl bg-[#1A3A75] hover:bg-[#142E5E] active:bg-[#0F2347] text-white font-semibold text-sm shadow-[0_0_20px_rgba(26,58,117,0.4)] border border-white/10 hover:border-white/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  >
                    <Building className="w-4 h-4 shrink-0" />
                    <span>Conhecer a carteira de oportunidades</span>
                    <ArrowRight className="w-4 h-4 ml-1 shrink-0" />
                  </button>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      registrarEvento('clique_whatsapp', '/simulador-de-retorno', {
                        origem: 'simulador_lateral',
                      })
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 min-h-[48px] rounded-xl bg-[#081226] hover:bg-[#0a1733] active:bg-[#070e1f] text-slate-200 hover:text-white font-medium text-sm border border-slate-700 hover:border-[#22C7E0]/40 transition-all cursor-pointer"
                  >
                    <span>Falar no WhatsApp com curador de investimentos</span>
                    <ArrowUpRight className="w-4 h-4 text-[#22C7E0] shrink-0" />
                  </a>

                  <p className="text-[11px] text-center text-slate-400">
                    Atendimento oficial KORBIX: {KORBIX_WHATSAPP_DISPLAY}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Apoio / Pilares da Estratégia de Investimento Imobiliário */}
      <section className="py-10 sm:py-14 px-3.5 sm:px-6 lg:px-8 border-t border-slate-900 bg-[#081226]/30">
        <div className="max-w-[1200px] mx-auto space-y-6">
          <div className="max-w-2xl">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Como capturar retornos acima do CDI no mercado imobiliário?
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
              O investidor estratégico não busca apenas renda passiva ou valorização isolada, mas
              sim a combinação ótima dos dois motores com margem de segurança na compra.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-2">
            <div className="p-4 sm:p-5 rounded-xl bg-[#081226] border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#22C7E0]/10 flex items-center justify-center text-[#22C7E0]">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Margem de segurança na compra</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                O lucro imobiliário se consolida na aquisição: comprar imóveis desocupados com
                desconto permite blindar o capital e alavancar a rentabilidade final.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-[#081226] border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#22C7E0]/10 flex items-center justify-center text-[#22C7E0]">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Reforma com agregação de valor</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Retrofits inteligentes e modernizações aumentam o valor de revenda muito acima do
                capex gasto, acelerando a liquidez e elevando o aluguel mensal.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-[#081226] border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#22C7E0]/10 flex items-center justify-center text-[#22C7E0]">
                <Percent className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Duplo motor de rentabilidade</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                A renda dos aluguéis gera fluxo de caixa mensal enquanto o patrimônio ganha
                valorização composta até a saída programada na revenda.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Rodapé completo KORBIX */}
      <Footer onOpenModal={context?.onOpenModal} />
    </div>
  )
}

export default SimuladorRetornoInvestidor
