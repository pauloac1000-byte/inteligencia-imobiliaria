import React from 'react'
import { Building, TrendingUp, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'

interface TwoPathsSectionProps {
  onOpenModal: (intent: 'vender' | 'investir') => void
}

export const TwoPathsSection: React.FC<TwoPathsSectionProps> = ({ onOpenModal }) => {
  const handleVenderClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onOpenModal('vender')
  }

  const handleInvestirClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onOpenModal('investir')
  }

  const handleCardClick = (targetId: string) => {
    const target = document.getElementById(targetId)
    if (target) {
      const yOffset = -76
      const y = target.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  return (
    <section
      id="dois-caminhos"
      className="bg-[#F8FAFC] py-14 sm:py-20 lg:py-24 px-3.5 sm:px-6 lg:px-8 border-b border-slate-200 transition-colors"
    >
      <div className="max-w-[1200px] mx-auto">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-14 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/90 text-[#0F172A] text-xs font-semibold mb-3">
            Caminhos de Decisão
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0F172A] tracking-tight">
            Um só objetivo. Dois caminhos possíveis.
          </h2>
          <p className="mt-2.5 sm:mt-3 text-sm sm:text-base text-[#475569] leading-relaxed">
            Seja para liquidar seu patrimônio pelo valor real ou para alocar capital com
            inteligência analítica, conectamos seu objetivo à ponta certa.
          </p>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 items-stretch">
          {/* Card 1: Quero vender */}
          <div
            onClick={() => handleCardClick('para-vender')}
            className="group relative bg-white rounded-2xl shadow-sm hover:shadow-2xl border border-slate-200/90 p-4 sm:p-7 lg:p-8 flex flex-col justify-between transition-all duration-300 ease-out hover:-translate-y-1.5 cursor-pointer overflow-hidden"
          >
            {/* Top 4px border: Azul Corporate */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#1D4ED8]" />

            <div className="space-y-4 sm:space-y-6">
              {/* Card Header */}
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#1D4ED8]/10 border border-[#1D4ED8]/20 flex items-center justify-center text-[#1D4ED8] group-hover:scale-105 transition-transform duration-300 shrink-0">
                  <Building className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#1D4ED8] block">
                    Para proprietários
                  </span>
                  <h3 className="text-lg sm:text-2xl font-bold text-[#0F172A] tracking-tight truncate">
                    Quero vender
                  </h3>
                </div>
              </div>

              {/* Dor (Frase literal) */}
              <div className="p-3.5 sm:p-4.5 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>A realidade do mercado</span>
                </div>
                <p className="text-sm sm:text-[15px] text-[#475569] leading-relaxed">
                  Seu imóvel parado custa caro. Cada dia sem venda é desvalorização e prejuízo
                  silencioso.
                </p>
              </div>

              {/* Ganho (Frase literal) */}
              <div className="p-3.5 sm:p-4.5 rounded-xl bg-blue-50/70 border border-blue-100 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#1D4ED8]">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>O que entregamos</span>
                </div>
                <p className="text-sm sm:text-[15px] text-[#0F172A] font-semibold leading-relaxed">
                  Venda no prazo certo, sem desvalorizar, para o comprador que realmente tem
                  interesse real no seu perfil de imóvel.
                </p>
              </div>
            </div>

            {/* Button */}
            <div className="mt-5 sm:mt-8 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleVenderClick}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 sm:px-5 min-h-[48px] rounded-xl bg-[#1D4ED8] hover:bg-[#1e40af] active:bg-[#172554] text-white text-sm sm:text-base font-semibold shadow-md group-hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                <span>Quero vender</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>
            </div>
          </div>

          {/* Card 2: Quero oportunidade de investimento */}
          <div
            onClick={() => handleCardClick('para-investir')}
            className="group relative bg-white rounded-2xl shadow-sm hover:shadow-2xl border border-slate-200/90 p-4 sm:p-7 lg:p-8 flex flex-col justify-between transition-all duration-300 ease-out hover:-translate-y-1.5 cursor-pointer overflow-hidden"
          >
            {/* Top 4px border: Ciano */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#22D3EE]" />

            <div className="space-y-4 sm:space-y-6">
              {/* Card Header */}
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#22D3EE]/15 border border-[#22D3EE]/30 flex items-center justify-center text-[#0891b2] group-hover:scale-105 transition-transform duration-300 shrink-0">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#0891b2] block">
                    Para investidores
                  </span>
                  <h3 className="text-lg sm:text-2xl font-bold text-[#0F172A] tracking-tight leading-tight">
                    Quero oportunidade de investimento
                  </h3>
                </div>
              </div>

              {/* Dor (Frase literal) */}
              <div className="p-3.5 sm:p-4.5 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>O obstáculo atual</span>
                </div>
                <p className="text-sm sm:text-[15px] text-[#475569] leading-relaxed">
                  As melhores oportunidades não chegam aos portais. Você perde negócios antes mesmo
                  de vê-los.
                </p>
              </div>

              {/* Ganho (Frase literal) */}
              <div className="p-3.5 sm:p-4.5 rounded-xl bg-cyan-50/80 border border-cyan-100 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#0891b2]">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Sua vantagem competitiva</span>
                </div>
                <p className="text-sm sm:text-[15px] text-[#0F172A] font-semibold leading-relaxed">
                  Chegue antes de todo mundo e negocie com segurança, com dados claros e conexão
                  direta com quem vende.
                </p>
              </div>
            </div>

            {/* Button */}
            <div className="mt-5 sm:mt-8 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleInvestirClick}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 sm:px-5 min-h-[48px] rounded-xl bg-[#22D3EE] hover:bg-[#06b6d4] active:bg-[#0891b2] text-[#0F172A] text-sm sm:text-base font-bold shadow-md group-hover:shadow-lg transition-all duration-200 cursor-pointer leading-snug text-center"
              >
                <span>Quero oportunidade de investimento</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#0F172A] shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
