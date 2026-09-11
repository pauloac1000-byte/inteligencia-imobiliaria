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
      className="bg-[#F8FAFC] py-16 sm:py-24 px-6 border-b border-slate-200 transition-colors"
    >
      <div className="max-w-[1200px] mx-auto">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/80 text-[#0B1F3A] text-xs font-semibold mb-3">
            Caminhos de Decisão
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0B1F3A] tracking-tight">
            Um só objetivo. Dois caminhos possíveis.
          </h2>
          <p className="mt-3 text-base text-[#64748B]">
            Seja para liquidar seu patrimônio pelo valor real ou para alocar capital com
            inteligência analítica, conectamos seu objetivo à ponta certa.
          </p>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Card 1: Quero vender */}
          <div
            onClick={() => handleCardClick('para-vender')}
            className="group relative bg-white rounded-2xl shadow-md hover:shadow-2xl border border-slate-200/80 p-8 flex flex-col justify-between transition-all duration-300 ease-out hover:-translate-y-1.5 cursor-pointer overflow-hidden"
          >
            {/* Top 4px border: Azul elétrico */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#2563EB]" />

            <div className="space-y-6">
              {/* Card Header */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center text-[#2563EB] group-hover:scale-105 transition-transform duration-300">
                  <Building className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
                    Para proprietários
                  </span>
                  <h3 className="text-2xl font-bold text-[#0B1F3A]">Quero vender</h3>
                </div>
              </div>

              {/* Dor (Frase literal) */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-600">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>A realidade do mercado</span>
                </div>
                <p className="text-[15px] sm:text-base text-[#64748B] leading-relaxed">
                  Seu imóvel parado custa caro. Cada dia sem venda é desvalorização e prejuízo
                  silencioso.
                </p>
              </div>

              {/* Ganho (Frase literal) */}
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>O que entregamos</span>
                </div>
                <p className="text-[15px] sm:text-base text-[#0B1F3A] font-semibold leading-relaxed">
                  Venda no prazo certo, sem desvalorizar, para o comprador que realmente tem
                  interesse real no seu perfil de imóvel.
                </p>
              </div>
            </div>

            {/* Button */}
            <div className="mt-8 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleVenderClick}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-base font-semibold shadow-md group-hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                <span>Quero vender</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Card 2: Quero oportunidade de investimento */}
          <div
            onClick={() => handleCardClick('para-investir')}
            className="group relative bg-white rounded-2xl shadow-md hover:shadow-2xl border border-slate-200/80 p-8 flex flex-col justify-between transition-all duration-300 ease-out hover:-translate-y-1.5 cursor-pointer overflow-hidden"
          >
            {/* Top 4px border: Ciano */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#22D3EE]" />

            <div className="space-y-6">
              {/* Card Header */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#22D3EE]/15 border border-[#22D3EE]/30 flex items-center justify-center text-[#0891b2] group-hover:scale-105 transition-transform duration-300">
                  <TrendingUp className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#0891b2]">
                    Para investidores
                  </span>
                  <h3 className="text-2xl font-bold text-[#0B1F3A]">
                    Quero oportunidade de investimento
                  </h3>
                </div>
              </div>

              {/* Dor (Frase literal) */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-600">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>O obstáculo atual</span>
                </div>
                <p className="text-[15px] sm:text-base text-[#64748B] leading-relaxed">
                  As melhores oportunidades não chegam aos portais. Você perde negócios antes mesmo
                  de vê-los.
                </p>
              </div>

              {/* Ganho (Frase literal) */}
              <div className="p-4 rounded-xl bg-cyan-50/70 border border-cyan-100 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#0891b2]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sua vantagem competitiva</span>
                </div>
                <p className="text-[15px] sm:text-base text-[#0B1F3A] font-semibold leading-relaxed">
                  Chegue antes de todo mundo e negocie com segurança, com dados claros e conexão
                  direta com quem vende.
                </p>
              </div>
            </div>

            {/* Button */}
            <div className="mt-8 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleInvestirClick}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#22D3EE] hover:bg-[#06b6d4] text-[#0B1F3A] text-base font-bold shadow-md group-hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                <span>Quero oportunidade de investimento</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#0B1F3A]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
