import React, { useState, useEffect } from 'react'
import { registrarEvento } from '@/services/eventos'
import {
  ShieldCheck,
  CheckCircle2,
  Building2,
  Home,
  Sliders,
  TrendingUp,
  MapPin,
  Sparkles,
  ArrowRight,
} from 'lucide-react'

interface CaseStudy {
  id: string
  title: string
  location: string
  category: 'Residencial' | 'Comercial'
  percentage: number
  summary: string
  criteria: string[]
  metrics: {
    label: string
    value: string
  }[]
}

const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'casa-amparo',
    title: 'casa 3 dormitórios',
    location: 'Amparo/SP',
    category: 'Residencial',
    percentage: 92,
    summary: 'casa 3 dormitórios, Amparo/SP → 92% de compatibilidade',
    criteria: [
      'Faixa de precificação racional alinhada ao m² da região',
      'Liquidez projetada compatível com a tese do comprador',
      'Perfil tipológico (3 dormitórios) e documentação conferida antes da apresentação',
    ],
    metrics: [
      { label: 'Tipologia', value: '3 dorms (1 suíte)' },
      { label: 'Status documental', value: 'em conferência' },
      { label: 'Índice de liquidez', value: 'Alta demanda local' },
    ],
  },
  {
    id: 'comercial-centro',
    title: 'comercial 120m²',
    location: 'centro',
    category: 'Comercial',
    percentage: 87,
    summary: 'comercial 120m², centro → 87% de compatibilidade',
    criteria: [
      'Área útil de 120m² em zona de alto fluxo comercial no centro',
      'Taxa de rentabilidade estimada compatível com carteira de renda',
      'Regularidade fiscal e certidões imobiliárias validadas',
    ],
    metrics: [
      { label: 'Área útil', value: '120m² corporativo' },
      { label: 'Cap Rate projetado', value: 'Aderente à tese' },
      { label: 'Região', value: 'Polo central consolidado' },
    ],
  },
]

interface CompatibilityThermometerSectionProps {
  onOpenModal?: (intent?: 'vender' | 'investir') => void
}

export const CompatibilityThermometerSection: React.FC<CompatibilityThermometerSectionProps> = ({
  onOpenModal,
}) => {
  const [selectedCaseIndex, setSelectedCaseIndex] = useState<number>(0)
  const currentCase = CASE_STUDIES[selectedCaseIndex]

  // Animação progressiva do termômetro vertical conforme critérios coincidem
  const [currentPercent, setCurrentPercent] = useState<number>(0)
  const [activeCriteriaCount, setActiveCriteriaCount] = useState<number>(0)

  useEffect(() => {
    // Reset e sobe progressivamente o termômetro até a porcentagem do caso ativo
    setCurrentPercent(0)
    setActiveCriteriaCount(0)

    const target = currentCase.percentage
    const totalSteps = 40
    const stepDuration = 35 // ~1.4s duração total
    let current = 0
    let stepCount = 0

    const timer = setInterval(() => {
      stepCount++
      const progress = Math.min(stepCount / totalSteps, 1)
      // Ease out quad
      const easedProgress = 1 - (1 - progress) * (1 - progress)
      current = Math.round(easedProgress * target)
      setCurrentPercent(current)

      // Conforme sobe, acende os critérios
      if (current >= 30 && current < 60) {
        setActiveCriteriaCount(1)
      } else if (current >= 60 && current < 85) {
        setActiveCriteriaCount(2)
      } else if (current >= 85) {
        setActiveCriteriaCount(3)
      }

      if (stepCount >= totalSteps) {
        setCurrentPercent(target)
        setActiveCriteriaCount(3)
        clearInterval(timer)
      }
    }, stepDuration)

    return () => clearInterval(timer)
  }, [selectedCaseIndex, currentCase.percentage])

  return (
    <section
      id="compatibilidade"
      className="bg-[#070B14] text-white py-14 sm:py-20 lg:py-28 px-3.5 sm:px-6 lg:px-8 border-b border-slate-900 relative overflow-hidden"
    >
      <div className="max-w-[1200px] mx-auto relative z-10">
        {/* Cabeçalho da seção */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-14 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A3A75]/35 border border-[#1A3A75]/60 text-[#22C7E0] text-xs font-semibold mb-3 sm:mb-4 shadow-[0_0_10px_rgba(34,199,224,0.15)]">
            <Sliders className="w-3.5 h-3.5 shrink-0" />
            <span>Métrica Analítica & Objetiva</span>
          </div>

          {/* TÍTULO EXATO REQUISITADO */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
            Compatibilidade medida antes do investimento.
          </h2>

          <p className="mt-2.5 sm:mt-4 text-sm sm:text-base lg:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Algoritmos cruzam critérios objetivos de localização, liquidez, precificação racional e
            tese de alocação. O termômetro sobe conforme os parâmetros coincidem com precisão
            técnica.
          </p>

          {/* SELO OBRIGATÓRIO: "conduzido por corretores credenciados" */}
          <div className="mt-4 sm:mt-6 flex justify-center">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-[#081226] border border-[#22C7E0]/40 shadow-xl shadow-black max-w-full">
              <ShieldCheck className="w-4 h-4 text-[#22C7E0] shrink-0" />
              <span className="text-[11px] sm:text-sm font-semibold tracking-wide text-slate-200">
                conduzido por corretores credenciados
              </span>
              <span className="w-2 h-2 rounded-full bg-[#22C7E0] animate-pulse shadow-[0_0_6px_#22C7E0] shrink-0" />
            </div>
          </div>
        </div>

        {/* Seletor dos 2 exemplos exigidos */}
        <div className="max-w-2xl mx-auto mb-6 sm:mb-10">
          <div className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-slate-400 text-center mb-2.5 sm:mb-3">
            Selecione uma simulação em tempo real
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 p-1.5 bg-[#081226] border border-slate-800 rounded-2xl backdrop-blur-sm">
            {CASE_STUDIES.map((c, idx) => {
              const isSelected = selectedCaseIndex === idx
              const Icon = c.category === 'Residencial' ? Home : Building2
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCaseIndex(idx)}
                  className={`flex items-center justify-between p-3 sm:p-3.5 rounded-xl text-left transition-all cursor-pointer min-h-[48px] ${
                    isSelected
                      ? 'bg-[#1A3A75] text-white shadow-inner border border-[#22C7E0]/50'
                      : 'bg-transparent text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2">
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-[#070B14] text-[#22C7E0]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold capitalize leading-snug truncate">
                        {c.title}
                      </div>
                      <div
                        className={`text-[11px] sm:text-xs flex items-center gap-1 truncate ${
                          isSelected ? 'text-white/90' : 'text-slate-400'
                        }`}
                      >
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{c.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-base sm:text-lg font-mono font-extrabold ${
                        isSelected ? 'text-[#22C7E0]' : 'text-slate-200'
                      }`}
                    >
                      {c.percentage}%
                    </div>
                    <div className="text-[9px] sm:text-[10px] uppercase font-semibold text-slate-300 tracking-wider">
                      compatibilidade
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Bloco Central: Termômetro Vertical Animado + Análise Detalhada dos Critérios */}
        <div className="bg-[#081226] border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-10 backdrop-blur-md shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center">
            {/* Coluna 1: Termômetro Vertical com gradiente #081226 → #1A3A75 → #22C7E0 */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center py-2 sm:py-4">
              {/* Badge Dinâmico com percentual do caso ativo */}
              <div className="mb-4 sm:mb-6 relative w-full max-w-[280px] sm:max-w-none flex justify-center">
                <div className="absolute -inset-1 rounded-2xl bg-[#22C7E0]/20 blur-md animate-pulse" />
                <div className="relative flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-2xl bg-[#070B14] border-2 border-[#22C7E0] shadow-2xl w-full sm:w-auto">
                  <span className="relative flex h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C7E0] opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 sm:h-3.5 sm:w-3.5 bg-[#22C7E0] shadow-[0_0_8px_#22C7E0]" />
                  </span>
                  <div className="flex flex-col min-w-0">
                    <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white font-mono leading-none tracking-tight flex items-baseline gap-1 sm:gap-2">
                      <span className="drop-shadow-[0_0_12px_rgba(34,199,224,0.4)]">
                        {currentPercent}%
                      </span>
                      <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-[#22C7E0] font-sans whitespace-nowrap">
                        de compatibilidade
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Corpo do Termômetro Vertical com réguas adaptáveis */}
              <div className="relative flex items-center justify-center">
                {/* Réguas / Escala de porcentagem ao lado esquerdo */}
                <div className="h-[270px] sm:h-[360px] flex flex-col justify-between text-right pr-1.5 sm:pr-4 text-[9px] sm:text-xs font-mono text-slate-400 select-none py-2 sm:py-3">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <span className="font-semibold text-[#22C7E0]">100%</span>
                    <span className="w-1.5 sm:w-3 h-[1px] bg-[#22C7E0]" />
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <span>75%</span>
                    <span className="w-1 sm:w-2 h-[1px] bg-slate-600" />
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <span>50%</span>
                    <span className="w-1 sm:w-2 h-[1px] bg-slate-600" />
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <span>25%</span>
                    <span className="w-1 sm:w-2 h-[1px] bg-slate-600" />
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <span className="text-slate-500">0%</span>
                    <span className="w-1.5 sm:w-3 h-[1px] bg-slate-600" />
                  </div>
                </div>

                {/* Estrutura de Vidro do Termômetro */}
                <div className="relative w-20 sm:w-28 h-[270px] sm:h-[360px] bg-[#070B14]/95 border-2 border-slate-700 rounded-full p-2 sm:p-2.5 flex flex-col justify-end shadow-2xl shadow-black ring-1 ring-white/5">
                  {/* Linhas de grade interna tracejadas */}
                  <div className="absolute inset-y-6 left-2 sm:left-3 right-2 sm:right-3 flex flex-col justify-between pointer-events-none z-10">
                    <div className="border-b border-dashed border-white/10" />
                    <div className="border-b border-dashed border-white/10" />
                    <div className="border-b border-dashed border-white/10" />
                    <div className="border-b border-dashed border-white/10" />
                  </div>

                  {/* Canal interno do líquido */}
                  <div className="relative w-full h-full bg-[#081226] rounded-full overflow-hidden flex flex-col justify-end border border-white/10">
                    {/* Coluna líquida vertical animada */}
                    {/* Gradiente solicitado: #081226 → #1A3A75 → #22C7E0 */}
                    <div
                      className="w-full relative transition-all duration-75 ease-out rounded-b-full bg-gradient-to-t from-[#081226] via-[#1A3A75] to-[#22C7E0] shadow-[0_0_18px_rgba(34,199,224,0.4)]"
                      style={{
                        height: `${currentPercent}%`,
                      }}
                    >
                      {/* Onda superior luminosa (menisco) */}
                      <div className="absolute -top-2 left-0 right-0 h-4 bg-white/70 blur-[2px] rounded-full" />
                      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-white/90 to-transparent rounded-t-full" />
                      {/* Partículas / textura de dados */}
                      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle,rgba(255,255,255,0.6)_1px,transparent_1px)] bg-[size:8px_8px]" />
                    </div>
                  </div>

                  {/* Bulbo inferior do termômetro */}
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-15 sm:w-20 h-15 sm:h-20 bg-gradient-to-br from-[#081226] to-[#070B14] border-2 border-slate-700 rounded-full flex items-center justify-center shadow-2xl">
                    <div className="w-10 sm:w-13 h-10 sm:h-13 rounded-full bg-gradient-to-tr from-[#1A3A75] to-[#22C7E0] p-0.5 flex items-center justify-center shadow-inner">
                      <TrendingUp className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
                    </div>
                  </div>
                </div>

                {/* Marcadores de alinhamento ao lado direito */}
                <div className="h-[270px] sm:h-[360px] flex flex-col justify-between text-left pl-1.5 sm:pl-4 text-[9px] sm:text-[11px] text-slate-400 select-none py-2 sm:py-3">
                  <div className="flex items-center gap-1 sm:gap-1.5 text-[#22C7E0] font-semibold">
                    <span className="w-1.5 sm:w-3 h-[1px] bg-[#22C7E0]" />
                    <span>Conexão alta</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <span className="w-1 sm:w-2 h-[1px] bg-slate-600" />
                    <span>Compatível</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <span className="w-1 sm:w-2 h-[1px] bg-slate-600" />
                    <span>Médio</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <span className="w-1 sm:w-2 h-[1px] bg-slate-600" />
                    <span>Parcial</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5 text-slate-400">
                    <span className="w-1.5 sm:w-3 h-[1px] bg-slate-600" />
                    <span>Base</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center px-2">
                <span className="text-[10px] sm:text-xs font-mono text-[#22C7E0] bg-[#070B14] px-3 py-1 rounded-full border border-slate-800 inline-block shadow-sm">
                  Gradiente analítico: #081226 → #1A3A75 → #22C7E0
                </span>
              </div>
            </div>

            {/* Coluna 2: Detalhamento dos Dois Exemplos e Critérios Coincidentes */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6">
              {/* Card de resumo do exemplo ativo (texto literal exigido) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#070B14] border border-[#1A3A75]/70 space-y-2 shadow-xl">
                <div className="text-xs uppercase font-mono font-semibold tracking-wider text-[#22C7E0] flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>SIMULAÇÃO ILUSTRATIVA DO MODELO</span>
                </div>
                {/* String exata requisitada */}
                <div className="text-base sm:text-lg lg:text-xl font-bold text-white tracking-tight leading-snug break-words">
                  &ldquo;{currentCase.summary}&rdquo;
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Conexão originada pelo cruzamento analítico entre o imóvel cadastrado e a tese do
                  comprador.
                </p>
              </div>

              {/* Critérios que coincidem e fazem o termômetro subir */}
              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-semibold text-slate-300">
                  <span>Critérios avaliados pelo modelo técnico:</span>
                  <span className="text-[#22C7E0] font-mono">
                    {activeCriteriaCount} de 3 critérios validados
                  </span>
                </div>

                <div className="space-y-2 sm:space-y-2.5">
                  {currentCase.criteria.map((crit, idx) => {
                    const isCompatible = idx < activeCriteriaCount
                    return (
                      <div
                        key={crit}
                        className={`p-3 sm:p-3.5 rounded-xl border transition-all duration-300 flex items-start gap-2.5 sm:gap-3 ${
                          isCompatible
                            ? 'bg-[#070B14] border-[#22C7E0]/50 text-white shadow-sm'
                            : 'bg-[#070B14]/40 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="mt-0.5">
                          {isCompatible ? (
                            <CheckCircle2 className="w-4 h-4 text-[#22C7E0] shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                          )}
                        </div>
                        <div className="text-xs sm:text-sm leading-relaxed min-w-0">
                          <span
                            className={isCompatible ? 'font-medium text-white' : 'text-slate-400'}
                          >
                            {crit}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Métricas do ativo analisado */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 pt-1">
                {currentCase.metrics.map((m) => (
                  <div
                    key={m.label}
                    className="p-3 sm:p-3.5 rounded-xl bg-[#070B14] border border-slate-800"
                  >
                    <div className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider font-medium">
                      {m.label}
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-white mt-0.5 leading-snug">
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Botão de ação para iniciar análise */}
              {onOpenModal && (
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      registrarEvento('clique_quero_vender', '/', {
                        origem: 'termometro_medir_compatibilidade',
                      })
                      onOpenModal('vender')
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[48px] rounded-xl bg-[#1A3A75] hover:bg-[#142E5E] active:bg-[#0F2347] text-white text-xs sm:text-sm font-semibold shadow-inner border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                  >
                    <span>Medir compatibilidade do meu imóvel</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      registrarEvento('clique_quero_investir', '/', {
                        origem: 'termometro_configurar_tese',
                      })
                      onOpenModal('investir')
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[48px] rounded-xl border border-[#1A3A75] bg-[#070B14] hover:bg-[#1A3A75]/35 active:bg-[#1A3A75]/50 text-white hover:text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer hover:border-[#22C7E0]/60 shadow-lg shadow-black/40"
                  >
                    <TrendingUp className="w-4 h-4 text-[#22C7E0] shrink-0" />
                    <span>Configurar minha busca</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <p className="mt-3 text-center text-[11px] sm:text-xs text-slate-400">
          exemplo demonstrativo — não representa negociação concluída
        </p>
      </div>
    </section>
  )
}
