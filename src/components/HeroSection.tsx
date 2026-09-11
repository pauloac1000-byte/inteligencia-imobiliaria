import React from 'react'
import { ArrowRight, Building, TrendingUp } from 'lucide-react'
import { HeroThermometer } from './HeroThermometer'

interface HeroSectionProps {
  onOpenModal: (intent: 'vender' | 'investir') => void
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenModal }) => {
  const handleVenderClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onOpenModal('vender')
  }

  const handleInvestirClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onOpenModal('investir')
  }

  return (
    <section className="relative min-h-[92vh] lg:min-h-screen bg-gradient-to-b from-[#0B1F3A] via-[#0E2442] to-[#12294A] text-white flex items-center pt-[92px] pb-16 lg:py-0 overflow-hidden">
      {/* Background Subtle Data Grid Lines & Slow Floating Data Particles */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#FFFFFF" strokeWidth="1" />
              <circle cx="60" cy="0" r="2" fill="#22D3EE" />
              <circle cx="0" cy="60" r="2" fill="#2563EB" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>
      </div>

      {/* Floating subtle data glow blobs */}
      <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-[#2563EB]/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-[#22D3EE]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container: 60% Left / 40% Right in Desktop */}
      <div className="w-full max-w-[1200px] mx-auto px-6 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column (60% ~ 7 cols in desktop) */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6 sm:space-y-8 animate-fade-in-up">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#12294A]/80 border border-[#2563EB]/40 text-[#22D3EE] text-xs font-semibold backdrop-blur-sm shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#22D3EE] animate-ping" />
              <span>Plataforma de Inteligência e Compatibilidade Imobiliária</span>
            </div>

            {/* Headline EXATA: Primeira frase branca, segunda em azul elétrico */}
            <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-bold tracking-tight leading-[1.12]">
              <span className="text-white">Seu imóvel encontra o comprador certo. </span>
              <span className="text-[#2563EB] drop-shadow-sm block sm:inline">
                Você encontra o negócio certo.
              </span>
            </h1>

            {/* Subheadline EXATA */}
            <p className="text-base sm:text-lg lg:text-xl text-slate-300 font-normal leading-relaxed max-w-2xl">
              Nossa mecânica de dados cruza perfil do imóvel com objetivo de compra de milhares de
              investidores. A compatibilidade precisa guia a ponte entre você e a oportunidade
              certa.
            </p>

            {/* CTAs in Line (ou empilhados no mobile) */}
            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              {/* CTA Primário: Quero vender */}
              <button
                type="button"
                onClick={handleVenderClick}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-base font-semibold shadow-lg hover:shadow-[#2563EB]/40 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <Building className="w-5 h-5" />
                <span>Quero vender</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </button>

              {/* CTA Secundário: Quero oportunidade de investimento */}
              <button
                type="button"
                onClick={handleInvestirClick}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl border border-white/30 bg-white/5 hover:bg-white/10 text-white text-base font-semibold backdrop-blur-sm transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer hover:border-white/50"
              >
                <TrendingUp className="w-5 h-5 text-[#22D3EE]" />
                <span>Quero oportunidade de investimento</span>
              </button>
            </div>

            {/* Trust Proof Points below CTAs */}
            <div className="pt-4 border-t border-slate-700/60 w-full grid grid-cols-3 gap-4 text-slate-400">
              <div>
                <div className="text-white font-bold text-lg sm:text-xl">48</div>
                <div className="text-xs text-slate-400">Variáveis de análise</div>
              </div>
              <div>
                <div className="text-white font-bold text-lg sm:text-xl">100%</div>
                <div className="text-xs text-slate-400">Dados verificados</div>
              </div>
              <div>
                <div className="text-white font-bold text-lg sm:text-xl">Direto</div>
                <div className="text-xs text-slate-400">Sem ruído de portais</div>
              </div>
            </div>
          </div>

          {/* Right Column (40% ~ 5 cols in desktop) */}
          <div className="lg:col-span-5 flex items-center justify-center pt-4 lg:pt-0">
            <HeroThermometer />
          </div>
        </div>
      </div>
    </section>
  )
}
