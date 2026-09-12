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
      const yOffset = -125
      const y = target.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  return (
    <section
      id="dois-caminhos"
      className="bg-[#081226] py-14 sm:py-20 lg:py-24 px-3.5 sm:px-6 lg:px-8 border-b border-slate-900 transition-colors relative"
    >
      <div className="max-w-[1200px] mx-auto">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-14 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A3A75]/35 border border-[#1A3A75]/60 text-[#22C7E0] text-xs font-semibold mb-3 shadow-[0_0_10px_rgba(34,199,224,0.15)]">
            Caminhos de Decisão
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
            Um só objetivo. Dois caminhos possíveis.
          </h2>
          <p className="mt-2.5 sm:mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
            Seja para liquidar seu patrimônio pelo valor real ou para alocar capital com
            inteligência analítica, conectamos seu objetivo à ponta certa.
          </p>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 items-stretch">
          {/* Card 1: Quero vender */}
          <div
            onClick={() => handleCardClick('para-vender')}
            className="group relative bg-[#070B14] rounded-2xl shadow-2xl hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)] border border-slate-800 p-4 sm:p-7 lg:p-8 flex flex-col justify-between transition-all duration-300 ease-out hover:-translate-y-1.5 cursor-pointer overflow-hidden"
          >
            {/* Top 4px border: Azul Corporate */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#1A3A75]" />

            <div className="space-y-4 sm:space-y-6">
              {/* Card Header */}
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#081226] border border-[#1A3A75]/60 flex items-center justify-center text-white group-hover:scale-105 transition-transform duration-300 shrink-0">
                  <Building className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                    Para proprietários
                  </span>
                  <h3 className="text-lg sm:text-2xl font-bold text-white tracking-tight truncate">
                    Quero vender
                  </h3>
                </div>
              </div>

              {/* Dor (Frase literal) */}
              <div className="p-3.5 sm:p-4.5 rounded-xl bg-[#081226]/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-400">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>A realidade do mercado</span>
                </div>
                <p className="text-sm sm:text-[15px] text-slate-300 leading-relaxed">
                  Seu imóvel parado custa caro. Cada dia sem venda é desvalorização e prejuízo
                  silencioso.
                </p>
              </div>

              {/* Ganho (Frase literal) */}
              <div className="p-3.5 sm:p-4.5 rounded-xl bg-[#081226] border border-[#1A3A75]/60 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#22C7E0]">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>O que entregamos</span>
                </div>
                <p className="text-sm sm:text-[15px] text-white font-semibold leading-relaxed">
                  Venda no prazo certo, sem desvalorizar, para o comprador que realmente tem
                  interesse real no seu perfil de imóvel.
                </p>
              </div>
            </div>

            {/* Button */}
            <div className="mt-5 sm:mt-8 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleVenderClick}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 sm:px-5 min-h-[48px] rounded-xl bg-[#1A3A75] hover:bg-[#142E5E] active:bg-[#0F2347] text-white text-sm sm:text-base font-semibold shadow-inner border border-white/10 group-hover:border-white/20 transition-all duration-200 cursor-pointer"
              >
                <span>Quero vender</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>
            </div>
          </div>

          {/* Card 2: Quero oportunidade de investimento */}
          <div
            onClick={() => handleCardClick('para-investir')}
            className="group relative bg-[#070B14] rounded-2xl shadow-2xl hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)] border border-slate-800 p-4 sm:p-7 lg:p-8 flex flex-col justify-between transition-all duration-300 ease-out hover:-translate-y-1.5 cursor-pointer overflow-hidden"
          >
            {/* Top 4px border: Ciano estilo luz de dados */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#22C7E0] shadow-[0_0_8px_#22C7E0]" />

            <div className="space-y-4 sm:space-y-6">
              {/* Card Header */}
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#081226] border border-[#22C7E0]/30 flex items-center justify-center text-[#22C7E0] group-hover:scale-105 transition-transform duration-300 shrink-0 shadow-[0_0_12px_rgba(34,199,224,0.15)]">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#22C7E0] block">
                    Para investidores
                  </span>
                  <h3 className="text-lg sm:text-2xl font-bold text-white tracking-tight leading-tight">
                    Quero oportunidade de investimento
                  </h3>
                </div>
              </div>

              {/* Dor (Frase literal) */}
              <div className="p-3.5 sm:p-4.5 rounded-xl bg-[#081226]/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-400">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>O obstáculo atual</span>
                </div>
                <p className="text-sm sm:text-[15px] text-slate-300 leading-relaxed">
                  As melhores oportunidades não chegam aos portais. Você perde negócios antes mesmo
                  de vê-los.
                </p>
              </div>

              {/* Ganho (Frase literal) */}
              <div className="p-3.5 sm:p-4.5 rounded-xl bg-[#081226] border border-[#1A3A75]/60 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#22C7E0]">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Sua vantagem competitiva</span>
                </div>
                <p className="text-sm sm:text-[15px] text-white font-semibold leading-relaxed">
                  Chegue antes de todo mundo e negocie com segurança, com dados claros e conexão
                  direta com quem vende.
                </p>
              </div>
            </div>

            {/* Button */}
            <div className="mt-5 sm:mt-8 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleInvestirClick}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 sm:px-5 min-h-[48px] rounded-xl bg-[#1A3A75] hover:bg-[#142E5E] active:bg-[#0F2347] text-white text-sm sm:text-base font-semibold shadow-inner border border-white/10 group-hover:border-white/20 transition-all duration-200 cursor-pointer leading-snug text-center"
              >
                <span>Quero oportunidade de investimento</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#22C7E0] shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
