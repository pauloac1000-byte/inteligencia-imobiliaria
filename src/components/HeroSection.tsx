import React, { useEffect } from 'react'
import { ArrowRight, Building, TrendingUp } from 'lucide-react'
import { HeroThermometer } from './HeroThermometer'
import heroBridgeBg from '@/assets/geminigeneratedimagebrcru6brcru6brcr-58806.jpeg'
import { registrarEvento } from '@/services/eventos'

interface HeroSectionProps {
  onOpenModal: (intent: 'vender' | 'investir') => void
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenModal }) => {
  // Disparar exibição do hero uma vez por sessão
  useEffect(() => {
    try {
      const heroExibido = sessionStorage.getItem('korbix_hero_exibido')
      if (!heroExibido) {
        sessionStorage.setItem('korbix_hero_exibido', 'true')
        registrarEvento('hero_exibicao', '/', { origem: 'hero_landing' })
      }
    } catch {
      registrarEvento('hero_exibicao', '/', { origem: 'hero_landing' })
    }
  }, [])

  const handleVenderClick = (e: React.MouseEvent) => {
    e.preventDefault()
    registrarEvento('clique_quero_vender', '/', { origem: 'hero_cta_primario' })
    onOpenModal('vender')
  }

  const handleInvestirClick = (e: React.MouseEvent) => {
    e.preventDefault()
    registrarEvento('clique_quero_investir', '/', { origem: 'hero_cta_secundario' })
    onOpenModal('investir')
  }

  return (
    <section className="relative min-h-[92vh] lg:min-h-screen bg-[#070B14] text-white flex items-center pt-24 sm:pt-28 md:pt-28 lg:pt-30 xl:pt-32 pb-12 sm:pb-16 lg:pb-20 overflow-hidden">
      {/* 1. Fotografia real de fundo: Ponte suspensa noturna panorâmica */}{' '}
      <div className="absolute inset-0 pointer-events-none select-none z-0">
        <img
          src={heroBridgeBg}
          alt="Ponte suspensa iluminada à noite conectando a cidade"
          className="w-full h-full object-cover object-[72%_center] lg:object-[80%_center] scale-105 opacity-85"
          loading="eager"
          decoding="async"
        />

        {/* 2. Overlay Gradiente Horizontal Tech-Midnight (#070B14):
            #070B14 quase opaco à esquerda garantindo contraste WCAG AA para o texto,
            transicionando para transparente à direita onde a ponte noturna e luzes ficam visíveis */}
        <div
          className="absolute inset-0 hidden md:block"
          style={{
            background:
              'linear-gradient(90deg, #070B14 0%, #070B14 32%, rgba(7, 11, 20, 0.95) 46%, rgba(7, 11, 20, 0.76) 62%, rgba(7, 11, 20, 0.38) 78%, rgba(7, 11, 20, 0.15) 100%)',
          }}
        />

        {/* Overlay para Mobile (foco vertical com legibilidade total do texto) */}
        <div
          className="absolute inset-0 md:hidden"
          style={{
            background:
              'linear-gradient(180deg, rgba(7, 11, 20, 0.94) 0%, rgba(7, 11, 20, 0.96) 50%, rgba(7, 11, 20, 0.92) 80%, #070B14 100%)',
          }}
        />

        {/* Overlay no topo (garante contraste sob o header fixo translúcido) */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#070B14]/98 via-[#070B14]/80 to-transparent pointer-events-none" />

        {/* Overlay na base (transição suave para a escuridão da seção de métricas) */}
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#070B14] via-[#070B14]/85 to-transparent pointer-events-none" />

        {/* Glow suave externo azul corporate e ciano focado (estilo luzes da cidade) */}
        <div className="absolute top-1/4 left-1/12 w-80 h-80 bg-[#1A3A75]/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-[#22C7E0]/10 rounded-full blur-3xl pointer-events-none" />
      </div>
      {/* Main Container: 60% Left / 40% Right in Desktop */}
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-8 items-center">
          {/* Left Column (60% ~ 7 cols in desktop) */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-4 sm:space-y-5 lg:space-y-6 animate-fade-in-up">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 sm:gap-2.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-[#081226]/90 border border-[#1A3A75]/60 text-[#22C7E0] text-[10px] sm:text-xs font-semibold backdrop-blur-md shadow-sm max-w-full">
              <span className="w-2 h-2 rounded-full bg-[#22C7E0] animate-ping shrink-0 shadow-[0_0_8px_#22C7E0]" />
              <span className="leading-tight">
                Plataforma de Inteligência e Compatibilidade Imobiliária
              </span>
            </div>

            {/* Headline EXATA: Primeira frase branca, segunda em ciano #22C7E0 estilo luzes da cidade */}
            <h1 className="text-[28px] xs:text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-bold tracking-tight leading-[1.15] sm:leading-[1.12] break-words">
              <span className="text-white drop-shadow-md">
                Seu imóvel encontra o comprador certo.{' '}
              </span>
              <span className="text-[#22C7E0] drop-shadow-[0_0_16px_rgba(34,199,224,0.35)] block sm:inline mt-1 sm:mt-0">
                Você encontra o negócio certo.
              </span>
            </h1>

            {/* Subheadline EXATA */}
            <p className="text-sm sm:text-lg lg:text-xl text-slate-300 font-normal leading-relaxed max-w-2xl drop-shadow-sm">
              Nossa mecânica de dados cruza perfil do imóvel com objetivo de compra de investidores
              com tese de compra registrada. A compatibilidade precisa guia a ponte entre você e a
              oportunidade certa.
            </p>

            {/* CTAs in Line (ambos no azul corporate #1A3A75 sóbrio e profundo) */}
            <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-1 sm:pt-2">
              {/* CTA Primário: Quero vender (Azul corporate profundo #1A3A75, sombra interna sutil) */}
              <button
                type="button"
                onClick={handleVenderClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 sm:py-4 min-h-[48px] rounded-xl bg-[#1A3A75] hover:bg-[#142E5E] active:bg-[#0F2347] text-white text-base font-semibold shadow-inner border border-white/10 hover:border-white/20 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <Building className="w-5 h-5 shrink-0" />
                <span>Quero vender</span>
                <ArrowRight className="w-4 h-4 ml-0.5 shrink-0" />
              </button>

              {/* CTA Secundário: Quero investir (fundo azul-marinho profundo com borda corporate sóbria) */}
              <button
                type="button"
                onClick={handleInvestirClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 sm:py-4 min-h-[48px] rounded-xl border border-[#1A3A75] bg-[#081226]/85 hover:bg-[#1A3A75]/35 active:bg-[#1A3A75]/50 text-white text-base font-semibold backdrop-blur-md transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer hover:border-[#22C7E0]/60 shadow-lg shadow-black/50"
              >
                <TrendingUp className="w-5 h-5 text-[#22C7E0] shrink-0" />
                <span>Quero investir</span>
                <ArrowRight className="w-4 h-4 text-[#22C7E0] ml-0.5 shrink-0" />
              </button>
            </div>

            {/* Trust Proof Points below CTAs */}
            <div className="pt-4 sm:pt-5 border-t border-slate-700/60 w-full grid grid-cols-3 gap-2 sm:gap-4 text-slate-300">
              <div className="space-y-0.5 min-w-0">
                <div className="text-white font-bold text-base sm:text-xl lg:text-2xl font-mono drop-shadow-sm">
                  5
                </div>
                <div className="text-[10px] sm:text-xs text-slate-300 sm:text-slate-300 leading-snug break-words">
                  Critérios objetivos de compatibilidade
                </div>
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="text-white font-bold text-base sm:text-xl lg:text-2xl font-mono drop-shadow-sm">
                  48h
                </div>
                <div className="text-[10px] sm:text-xs text-slate-300 sm:text-slate-300 leading-snug break-words">
                  Prazo da análise técnica
                </div>
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="text-white font-bold text-base sm:text-xl lg:text-2xl break-words drop-shadow-sm">
                  Direto
                </div>
                <div className="text-[10px] sm:text-xs text-slate-300 sm:text-slate-300 leading-snug break-words">
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
