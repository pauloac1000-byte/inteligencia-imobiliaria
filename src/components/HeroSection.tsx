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
    <section className="relative min-h-[92vh] lg:min-h-screen bg-gradient-to-b from-[#0F172A] via-[#0D1F3C] to-[#0B1F3A] text-white flex items-center pt-24 sm:pt-28 lg:pt-24 pb-14 sm:pb-20 lg:py-0 overflow-hidden">
      {/* Background Subtle Data Grid Lines & Slow Floating Data Particles */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#FFFFFF" strokeWidth="1" />
              <circle cx="60" cy="0" r="2" fill="#22D3EE" />
              <circle cx="0" cy="60" r="2" fill="#1D4ED8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>
      </div>

      {/* Floating subtle data glow blobs */}
      <div className="absolute top-1/4 left-1/10 w-72 sm:w-96 h-72 sm:h-96 bg-[#1D4ED8]/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/10 w-72 sm:w-96 h-72 sm:h-96 bg-[#22D3EE]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container: 60% Left / 40% Right in Desktop */}
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 lg:gap-8 items-center">
          {/* Left Column (60% ~ 7 cols in desktop) */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-5 sm:space-y-7 animate-fade-in-up">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 sm:gap-2.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-[#0B1F3A]/90 border border-[#1D4ED8]/40 text-[#22D3EE] text-[10px] sm:text-xs font-semibold backdrop-blur-sm shadow-sm max-w-full">
              <span className="w-2 h-2 rounded-full bg-[#22D3EE] animate-ping shrink-0" />
              <span className="leading-tight">
                Plataforma de Inteligência e Compatibilidade Imobiliária
              </span>
            </div>

            {/* Headline EXATA: Primeira frase branca, segunda em azul corporate */}
            <h1 className="text-[28px] xs:text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-bold tracking-tight leading-[1.15] sm:leading-[1.12] break-words">
              <span className="text-white">Seu imóvel encontra o comprador certo. </span>
              <span className="text-[#1D4ED8] drop-shadow-sm block sm:inline mt-1 sm:mt-0">
                Você encontra o negócio certo.
              </span>
            </h1>

            {/* Subheadline EXATA */}
            <p className="text-sm sm:text-lg lg:text-xl text-slate-300 font-normal leading-relaxed max-w-2xl">
              Nossa mecânica de dados cruza perfil do imóvel com objetivo de compra de milhares de
              investidores. A compatibilidade precisa guia a ponte entre você e a oportunidade
              certa.
            </p>

            {/* CTAs in Line (ou empilhados no mobile com largura total e min-h 48px) */}
            <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-1 sm:pt-2">
              {/* CTA Primário: Quero vender */}
              <button
                type="button"
                onClick={handleVenderClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 sm:py-4 min-h-[48px] rounded-xl bg-[#1D4ED8] hover:bg-[#1e40af] active:bg-[#172554] text-white text-base font-semibold shadow-lg hover:shadow-[#1D4ED8]/40 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <Building className="w-5 h-5 shrink-0" />
                <span>Quero vender</span>
                <ArrowRight className="w-4 h-4 ml-0.5 shrink-0" />
              </button>

              {/* CTA Secundário: Quero oportunidade de investimento */}
              <button
                type="button"
                onClick={handleInvestirClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 sm:py-4 min-h-[48px] rounded-xl border border-white/30 bg-white/5 hover:bg-white/10 active:bg-white/15 text-white text-base font-semibold backdrop-blur-sm transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer hover:border-white/50"
              >
                <TrendingUp className="w-5 h-5 text-[#22D3EE] shrink-0" />
                <span>Quero oportunidade de investimento</span>
              </button>
            </div>

            {/* Trust Proof Points below CTAs */}
            <div className="pt-4 sm:pt-5 border-t border-slate-700/60 w-full grid grid-cols-3 gap-2 sm:gap-4 text-slate-400">
              <div className="space-y-0.5 min-w-0">
                <div className="text-white font-bold text-base sm:text-xl lg:text-2xl font-mono">
                  48
                </div>
                <div className="text-[10px] sm:text-xs text-slate-300 sm:text-slate-400 leading-snug break-words">
                  Variáveis de análise
                </div>
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="text-white font-bold text-base sm:text-xl lg:text-2xl font-mono">
                  100%
                </div>
                <div className="text-[10px] sm:text-xs text-slate-300 sm:text-slate-400 leading-snug break-words">
                  Dados verificados
                </div>
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="text-white font-bold text-base sm:text-xl lg:text-2xl break-words">
                  Direto
                </div>
                <div className="text-[10px] sm:text-xs text-slate-300 sm:text-slate-400 leading-snug break-words">
                  Sem ruído de portais
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (40% ~ 5 cols in desktop) */}
          <div className="lg:col-span-5 flex items-center justify-center pt-2 sm:pt-4 lg:pt-0">
            <HeroThermometer />
          </div>
        </div>
      </div>
    </section>
  )
}
