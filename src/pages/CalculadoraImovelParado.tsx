import React, { useState, useId } from 'react'
import { Link, useOutletContext, useNavigate } from 'react-router-dom'
import {
  Calculator,
  ArrowRight,
  TrendingDown,
  Building,
  HelpCircle,
  RotateCcw,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  Percent,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import {
  KORBIX_WHATSAPP_NUMBER,
  KORBIX_WHATSAPP_DISPLAY,
  salvarLeadCalculadora,
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
  // Centavos implícitos: ex "50000000" => 500000.00
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

export const CalculadoraImovelParado: React.FC = () => {
  const context = useOutletContext<LayoutContextType>()
  const navigate = useNavigate()
  const helpId = useId()

  // Valores padrão realistas para o mercado imobiliário
  // Exemplo de imóvel típico: R$ 650.000, IPTU R$ 3.600/ano, Condomínio R$ 750/mês, Manutenção R$ 350/mês, 8 meses parado
  const [valorImovelStr, setValorImovelStr] = useState<string>('R$ 650.000,00')
  const [iptuAnualStr, setIptuAnualStr] = useState<string>('R$ 3.600,00')
  const [condominioMensalStr, setCondominioMensalStr] = useState<string>('R$ 750,00')
  const [manutencaoMensalStr, setManutencaoMensalStr] = useState<string>('R$ 350,00')
  const [mesesParado, setMesesParado] = useState<number>(8)
  const [taxaOportunidade, setTaxaOportunidade] = useState<number>(0.9) // 0,9% ao mês padrão
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false)

  // Disparo de uso da calculadora (uma vez por sessão quando a tela é carregada ou interagida)
  React.useEffect(() => {
    try {
      const calcUsada = sessionStorage.getItem('korbix_calc_usada')
      if (!calcUsada) {
        sessionStorage.setItem('korbix_calc_usada', 'true')
        registrarEvento('uso_calculadora', '/calculadora', {
          origem: 'abertura_calculadora',
        })
      }
    } catch {
      registrarEvento('uso_calculadora', '/calculadora', {
        origem: 'abertura_calculadora',
      })
    }
  }, [])

  // Estados do mini-formulário de conversão de lead
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

  // Valores numéricos limpos
  const valorImovel = parseCurrency(valorImovelStr)
  const iptuAnual = parseCurrency(iptuAnualStr)
  const condominioMensal = parseCurrency(condominioMensalStr)
  const manutencaoMensal = parseCurrency(manutencaoMensalStr)
  const meses = Math.max(1, Math.min(120, mesesParado || 1))
  const taxaMensalDecimal = Math.max(0, taxaOportunidade) / 100

  // CÁLCULO TRANSPARENTE:
  // 1. Custo direto mensal = (IPTU anual / 12) + Condomínio + Manutenção
  const iptuMensal = iptuAnual / 12
  const custoDiretoMensal = iptuMensal + condominioMensal + manutencaoMensal

  // 2. Custo de oportunidade mensal do capital = Valor do imóvel × taxa mensal
  const custoOportunidadeMensal = valorImovel * taxaMensalDecimal

  // 3. Custo mensal total
  const custoMensalTotal = custoDiretoMensal + custoOportunidadeMensal

  // 4. Custo acumulado no período
  // Custo direto acumulado: soma simples das despesas ao longo dos meses
  const custoDiretoAcumulado = custoDiretoMensal * meses
  // Custo de oportunidade acumulado no período
  const custoOportunidadeAcumulado = custoOportunidadeMensal * meses
  // Custo acumulado total
  const custoAcumuladoTotal = custoMensalTotal * meses

  // Percentual relativo ao valor do imóvel consumido pelo período
  const percentualDoImovel = valorImovel > 0 ? (custoAcumuladoTotal / valorImovel) * 100 : 0

  // Frase de leitura gerada a partir dos valores
  const fraseLeitura = `Um imóvel de ${formatCurrencyCompact(valorImovel)} parado há ${meses} ${
    meses === 1 ? 'mês' : 'meses'
  } já custou aproximadamente ${formatCurrency(
    custoAcumuladoTotal,
  )} — cerca de ${formatCurrency(custoMensalTotal)} por mês.`

  // Ações de CTA
  const handleQueroVender = () => {
    if (context?.onOpenModal) {
      context.onOpenModal('vender')
    } else {
      navigate('/#para-vender')
    }
  }

  const mensagemWhatsApp = `Olá! Fiz a simulação na Calculadora da KORBIX. Tenho um imóvel avaliado em ${formatCurrencyCompact(
    valorImovel,
  )} parado há ${meses} meses (custo estimado de ${formatCurrencyCompact(
    custoAcumuladoTotal,
  )}) e gostaria de vendê-lo com inteligência de dados.`
  const whatsappUrl = `https://wa.me/${KORBIX_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    mensagemWhatsApp,
  )}`

  const handleResetPadrao = () => {
    setValorImovelStr('R$ 650.000,00')
    setIptuAnualStr('R$ 3.600,00')
    setCondominioMensalStr('R$ 750,00')
    setManutencaoMensalStr('R$ 350,00')
    setMesesParado(8)
    setTaxaOportunidade(0.9)
  }

  const handleTelefoneLeadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelefoneLead(formatarTelefone(e.target.value))
    if (leadError) setLeadError('')
  }

  const handleSubmitLeadCalculadora = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!cidadeLead.trim()) {
      setLeadError('Informe a cidade do imóvel.')
      return
    }

    const digits = telefoneLead.replace(/\D/g, '')
    if (!digits || digits.length < 10) {
      setLeadError('Por favor, informe um WhatsApp válido com DDD (mínimo 10 dígitos).')
      return
    }

    setLeadError('')
    setLeadLoading(true)

    const res = await salvarLeadCalculadora({
      cidade: cidadeLead,
      telefone: telefoneLead,
      valor_imovel: valorImovelStr,
      iptu_anual: iptuAnualStr,
      condominio_mensal: condominioMensalStr,
      manutencao_mensal: manutencaoMensalStr,
      meses_parado: meses,
      taxa_mensal: taxaOportunidade,
      custo_mensal_total: formatCurrency(custoMensalTotal),
      custo_acumulado_total: formatCurrency(custoAcumuladoTotal),
      rota: 'proprietario',
    })

    setLeadLoading(false)

    if (!res.success) {
      setLeadError(res.error || 'Não foi possível solicitar a análise no momento. Tente novamente.')
      return
    }

    setLeadProtocolo(res.protocolo || 'KX-0001')
    setLeadSucesso(true)

    // Disparar cadastro_completo para o lead da calculadora
    registrarEvento('cadastro_completo', '/calculadora', {
      origem: 'calculadora',
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
                Calculadora de Custo de Imóvel Parado
              </li>
            </ol>
          </nav>

          {/* Selo Simulação Ilustrativa em ciano */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22C7E0]/10 border border-[#22C7E0]/30 text-[#22C7E0] text-[11px] sm:text-xs font-semibold uppercase tracking-wider mb-4 shadow-[0_0_12px_rgba(34,199,224,0.15)]">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Simulação Ilustrativa • Sem Cadastro Prévio</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white max-w-3xl leading-[1.15]">
            Quanto custa manter seu <span className="text-[#22C7E0]">imóvel parado?</span>
          </h1>

          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            Descubra o impacto real das despesas mensais somadas ao custo de oportunidade do capital
            imobilizado. Sem necessidade de cadastro: cálculo 100% no seu navegador em tempo real.
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
                      <Calculator className="w-4 h-4" />
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-white">
                      Parâmetros do Imóvel
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
                  {/* Campo 1: Valor estimado do imóvel */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="calc-valor-imovel"
                        className="text-xs font-semibold uppercase tracking-wider text-slate-300"
                      >
                        Valor estimado do imóvel
                      </label>
                      <span className="text-[11px] text-slate-400 font-mono">Base de capital</span>
                    </div>
                    <div className="relative">
                      <input
                        id="calc-valor-imovel"
                        type="text"
                        inputMode="numeric"
                        value={valorImovelStr}
                        onChange={handleCurrencyChange(setValorImovelStr)}
                        className="w-full px-3.5 py-3 rounded-xl bg-[#070B14] border border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white font-mono text-base sm:text-lg outline-none transition-all"
                        placeholder="R$ 0,00"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Valor de mercado estimado para venda ou avaliação recente.
                    </p>
                  </div>

                  {/* Grid de Custos Fixos: IPTU e Condomínio */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Campo 2: IPTU anual */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="calc-iptu-anual"
                          className="text-xs font-semibold uppercase tracking-wider text-slate-300"
                        >
                          IPTU anual
                        </label>
                        <span className="text-[11px] text-slate-400 font-mono">
                          ~{formatCurrency(iptuMensal)}/mês
                        </span>
                      </div>
                      <input
                        id="calc-iptu-anual"
                        type="text"
                        inputMode="numeric"
                        value={iptuAnualStr}
                        onChange={handleCurrencyChange(setIptuAnualStr)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B14] border border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white font-mono text-sm sm:text-base outline-none transition-all"
                        placeholder="R$ 0,00"
                      />
                    </div>

                    {/* Campo 3: Condomínio mensal */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="calc-condominio"
                          className="text-xs font-semibold uppercase tracking-wider text-slate-300"
                        >
                          Condomínio mensal
                        </label>
                        <span className="text-[11px] text-slate-400">se houver</span>
                      </div>
                      <input
                        id="calc-condominio"
                        type="text"
                        inputMode="numeric"
                        value={condominioMensalStr}
                        onChange={handleCurrencyChange(setCondominioMensalStr)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B14] border border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white font-mono text-sm sm:text-base outline-none transition-all"
                        placeholder="R$ 0,00"
                      />
                    </div>
                  </div>

                  {/* Grid: Manutenção mensal e Meses parado */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Campo 4: Manutenção mensal */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="calc-manutencao"
                          className="text-xs font-semibold uppercase tracking-wider text-slate-300"
                        >
                          Manutenção mensal
                        </label>
                        <span className="text-[11px] text-slate-400">limpeza/reparos</span>
                      </div>
                      <input
                        id="calc-manutencao"
                        type="text"
                        inputMode="numeric"
                        value={manutencaoMensalStr}
                        onChange={handleCurrencyChange(setManutencaoMensalStr)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B14] border border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white font-mono text-sm sm:text-base outline-none transition-all"
                        placeholder="R$ 0,00"
                      />
                    </div>

                    {/* Campo 5: Meses parado */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="calc-meses"
                          className="text-xs font-semibold uppercase tracking-wider text-slate-300"
                        >
                          Tempo desocupado
                        </label>
                        <span className="text-[11px] text-[#22C7E0] font-mono font-bold">
                          {meses} {meses === 1 ? 'mês' : 'meses'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          id="calc-meses"
                          type="number"
                          min="1"
                          max="120"
                          step="1"
                          value={mesesParado || ''}
                          onChange={(e) => {
                            const n = parseInt(e.target.value, 10)
                            setMesesParado(isNaN(n) ? 0 : Math.max(1, Math.min(120, n)))
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B14] border border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white font-mono text-sm sm:text-base outline-none transition-all"
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setMesesParado((prev) => Math.max(1, (prev || 1) - 1))}
                            className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
                            aria-label="Diminuir um mês"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => setMesesParado((prev) => Math.min(120, (prev || 0) + 1))}
                            className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
                            aria-label="Aumentar um mês"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Seção retrátil / avançada: Taxa de Oportunidade do Capital */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="w-full flex items-center justify-between py-2 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer group"
                      aria-expanded={showAdvanced}
                    >
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-[#22C7E0]" />
                        <span className="font-semibold">Taxa de oportunidade do capital:</span>
                        <span className="font-mono text-[#22C7E0] font-bold">
                          {taxaOportunidade.toFixed(2).replace('.', ',')}% ao mês
                        </span>
                        <span className="text-[10px] text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
                          Padrão: 0,90%
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

                    {showAdvanced && (
                      <div className="mt-3 p-4 rounded-xl bg-[#070B14] border border-slate-800 space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between text-xs">
                          <label htmlFor="calc-taxa" className="text-slate-300 font-medium">
                            Taxa mensal de referência (% ao mês)
                          </label>
                          <span className="text-slate-400 font-mono text-[11px]">
                            Ex.: CDI líq., Poupança ou Renda Fixa
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            id="calc-taxa"
                            type="range"
                            min="0.0"
                            max="2.0"
                            step="0.05"
                            value={taxaOportunidade}
                            onChange={(e) => setTaxaOportunidade(parseFloat(e.target.value))}
                            className="flex-1 accent-[#22C7E0] cursor-pointer"
                          />
                          <div className="w-24 shrink-0">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.05"
                              value={taxaOportunidade}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value)
                                setTaxaOportunidade(isNaN(v) ? 0 : Math.max(0, v))
                              }}
                              className="w-full px-2.5 py-1.5 text-center rounded-lg bg-[#081226] border border-slate-700 text-white font-mono text-sm focus:border-[#22C7E0] outline-none"
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Reflete o rendimento que o valor do imóvel poderia gerar se estivesse
                          aplicado com liquidez (por exemplo, em títulos conservadores rendendo
                          ~0,9% ao mês líquido).
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card explicativo metodológico (transparência e confiança) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#081226]/50 border border-slate-800/60 text-xs text-slate-300 space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <ShieldAlert className="w-4 h-4 text-[#22C7E0] shrink-0" />
                  <span>Entenda a lógica do cálculo</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  <strong className="text-slate-200">Custos diretos:</strong> IPTU mensal (anual ÷
                  12) + Condomínio + Manutenção periódica.
                </p>
                <p className="text-slate-400 leading-relaxed">
                  <strong className="text-slate-200">Custo de oportunidade:</strong> O valor do
                  patrimônio multiplicado pela taxa mensal (
                  {taxaOportunidade.toFixed(2).replace('.', ',')}%/mês), representando o ganho que
                  você deixa de auferir enquanto o capital permanece sem liquidez.
                </p>
                <p className="text-slate-400 leading-relaxed">
                  <strong className="text-slate-200">Custo acumulado:</strong> Multiplicação linear
                  das despesas mensais e do custo de capital pelos {meses}{' '}
                  {meses === 1 ? 'mês' : 'meses'} em que o imóvel esteve desocupado.
                </p>
              </div>
            </div>

            {/* Coluna Direita: Resultado em Destaque + CTAs (5 cols) */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
              {/* Card Principal de Resultado com Glow Ciano Tech-Midnight */}
              <div className="relative rounded-2xl bg-[#081226] border border-[#22C7E0]/40 p-5 sm:p-7 shadow-[0_0_35px_rgba(34,199,224,0.15)] overflow-hidden">
                {/* Efeito de luz decorativa no topo */}
                <div
                  className="absolute -top-20 -right-20 w-44 h-44 rounded-full bg-[#22C7E0]/15 blur-3xl pointer-events-none"
                  aria-hidden="true"
                />

                <div className="relative space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#22C7E0] flex items-center gap-1.5">
                      <TrendingDown className="w-3.5 h-3.5" />
                      Resultado da Simulação
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 bg-[#070B14] px-2 py-0.5 rounded-full border border-slate-800">
                      {meses} {meses === 1 ? 'mês' : 'meses'} acumulados
                    </span>
                  </div>

                  {/* Custo Acumulado Total (Destaque Maior) */}
                  <div className="space-y-1">
                    <span className="text-xs uppercase tracking-wider font-semibold text-slate-300">
                      Custo Total Acumulado
                    </span>
                    <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-mono text-[#22C7E0] tracking-tight drop-shadow-[0_0_12px_rgba(34,199,224,0.35)] break-words">
                      {formatCurrency(custoAcumuladoTotal)}
                    </div>
                    {percentualDoImovel > 0 && (
                      <p className="text-[11px] text-slate-400 pt-0.5">
                        Equivale a{' '}
                        <strong className="text-slate-200 font-mono">
                          {percentualDoImovel.toFixed(1).replace('.', ',')}%
                        </strong>{' '}
                        do valor total do imóvel consumido no período.
                      </p>
                    )}
                  </div>

                  {/* Custo Mensal Total */}
                  <div className="p-3.5 rounded-xl bg-[#070B14] border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">Custo Mensal Total:</span>
                      <span className="font-mono text-base font-bold text-white">
                        {formatCurrency(custoMensalTotal)}
                        <span className="text-[11px] text-slate-400 font-normal">/mês</span>
                      </span>
                    </div>
                  </div>

                  {/* Detalhamento das parcelas */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/70 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="inline-flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        Despesas diretas mensais:
                      </span>
                      <span className="font-mono font-medium text-slate-200">
                        {formatCurrency(custoDiretoMensal)}/mês
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="inline-flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5 text-[#22C7E0]" />
                        Custo de oportunidade mensal:
                      </span>
                      <span className="font-mono font-medium text-[#22C7E0]">
                        {formatCurrency(custoOportunidadeMensal)}/mês
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1">
                      <span>Total em despesas diretas ({meses}m):</span>
                      <span className="font-mono">{formatCurrency(custoDiretoAcumulado)}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>Total oportunidade ({meses}m):</span>
                      <span className="font-mono">
                        {formatCurrency(custoOportunidadeAcumulado)}
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
                      Simulação ilustrativa com fins informativos, sem valor de avaliação técnica ou
                      laudo oficial.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bloco de Conversão Direta: Receber Análise de Compatibilidade deste Imóvel */}
              <div className="space-y-4">
                {leadSucesso ? (
                  <div className="p-5 sm:p-6 rounded-2xl bg-[#081226] border border-[#22C7E0]/50 shadow-[0_0_35px_rgba(34,199,224,0.15)] animate-fade-in">
                    <ConfirmationProtocolo
                      protocolo={leadProtocolo}
                      rota="proprietario"
                      onReset={handleResetLead}
                      resetLabel="Fazer nova simulação"
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl bg-gradient-to-b from-[#081226] to-[#0A1838] border border-[#22C7E0]/40 p-5 sm:p-6 shadow-[0_0_30px_rgba(34,199,224,0.15)] space-y-4">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#22C7E0]/10 border border-[#22C7E0]/30 text-[#22C7E0] text-[11px] font-semibold uppercase tracking-wider">
                        <Sparkles className="w-3 h-3 shrink-0" />
                        <span>Análise de Compatibilidade</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                        Receber a análise de compatibilidade deste imóvel
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Cruzamos o valor de{' '}
                        <strong className="text-[#22C7E0] font-mono">
                          {formatCurrencyCompact(valorImovel)}
                        </strong>{' '}
                        e os custos simulados com investidores com capital pronto na sua cidade.
                      </p>
                    </div>

                    {!showLeadForm ? (
                      <button
                        type="button"
                        onClick={() => {
                          registrarEvento('formulario_iniciado', '/calculadora', {
                            origem: 'calculadora',
                            disparo: 'abrir_formulario_analise',
                          })
                          setShowLeadForm(true)
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 min-h-[48px] rounded-xl bg-gradient-to-r from-[#22C7E0] to-[#1BA8BD] hover:from-[#35d0e8] hover:to-[#22C7E0] active:brightness-95 text-[#070B14] font-bold text-sm shadow-[0_0_20px_rgba(34,199,224,0.35)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-[#070B14]" />
                        <span>Receber a análise de compatibilidade deste imóvel</span>
                        <ArrowRight className="w-4 h-4 ml-0.5 shrink-0" />
                      </button>
                    ) : (
                      <form
                        onSubmit={handleSubmitLeadCalculadora}
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
                            htmlFor="calc-lead-cidade"
                            className="text-xs font-semibold uppercase tracking-wider text-slate-300"
                          >
                            Cidade / Estado *
                          </label>
                          <input
                            id="calc-lead-cidade"
                            type="text"
                            required
                            placeholder="Ex.: Campinas, SP"
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
                            htmlFor="calc-lead-whatsapp"
                            className="text-xs font-semibold uppercase tracking-wider text-slate-300"
                          >
                            WhatsApp *
                          </label>
                          <input
                            id="calc-lead-whatsapp"
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
                            Enviaremos o dossiê com o cruzamento de compradores ativos para o seu
                            número.
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
                                <span>Gravando simulação e gerando protocolo...</span>
                              </>
                            ) : (
                              <>
                                <span>Solicitar análise técnica com protocolo</span>
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

                {/* CTAs Finais Auxiliares mantidos */}
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={handleQueroVender}
                    className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 min-h-[48px] rounded-xl bg-[#1A3A75] hover:bg-[#142E5E] active:bg-[#0F2347] text-white font-semibold text-sm shadow-[0_0_20px_rgba(26,58,117,0.4)] border border-white/10 hover:border-white/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  >
                    <Building className="w-4 h-4 shrink-0" />
                    <span>Quero vender meu imóvel</span>
                    <ArrowRight className="w-4 h-4 ml-1 shrink-0" />
                  </button>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      registrarEvento('clique_whatsapp', '/calculadora', {
                        origem: 'calculadora_lateral',
                      })
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 min-h-[48px] rounded-xl bg-[#081226] hover:bg-[#0a1733] active:bg-[#070e1f] text-slate-200 hover:text-white font-medium text-sm border border-slate-700 hover:border-[#22C7E0]/40 transition-all cursor-pointer"
                  >
                    <span>Falar no WhatsApp com especialista</span>
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

      {/* Seção Adicional de Esclarecimentos / FAQ Rápido da Calculadora */}
      <section className="py-10 sm:py-14 px-3.5 sm:px-6 lg:px-8 border-t border-slate-900 bg-[#081226]/30">
        <div className="max-w-[1200px] mx-auto space-y-6">
          <div className="max-w-2xl">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Por que a velocidade de venda preserva seu patrimônio?
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
              Manter um imóvel desocupado à espera de uma proposta fora da realidade de mercado
              costuma corroer mais valor em despesas e perda de rendimento do que eventuais margens
              de negociação.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-2">
            <div className="p-4 sm:p-5 rounded-xl bg-[#081226] border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#22C7E0]/10 flex items-center justify-center text-[#22C7E0]">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">O tempo é um custo invisível</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Condomínio e IPTU vencem todos os meses, independentemente da visitação. Em 12
                meses, essas contas acumulam dezenas de milhares de reais sem nenhum retorno.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-[#081226] border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#22C7E0]/10 flex items-center justify-center text-[#22C7E0]">
                <Percent className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Custo de oportunidade real</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                R$ 500.000 aplicados a 0,9% ao mês geram R$ 4.500 mensais em rendimento passivo. Com
                o imóvel parado, esse ganho deixa de existir mês após mês.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-[#081226] border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#22C7E0]/10 flex items-center justify-center text-[#22C7E0]">
                <TrendingDown className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Desgaste e depreciação física</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Imóveis fechados perdem atratividade visual, acumulam mofo e pequenos vazamentos,
                exigindo manutenções contínuas para não perderem ainda mais valor de mercado.
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

export default CalculadoraImovelParado
