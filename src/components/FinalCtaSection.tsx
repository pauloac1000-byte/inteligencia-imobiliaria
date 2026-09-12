import React from 'react'
import { ArrowRight, Building, TrendingUp, ShieldCheck, Check } from 'lucide-react'

interface FinalCtaSectionProps {
  onOpenModal: (intent: 'vender' | 'investir') => void
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({ onOpenModal }) => {
  const handleVenderClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onOpenModal('vender')
  }

  const handleInvestirClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onOpenModal('investir')
  }

  return (
    <section className="relative bg-[#081226] text-white py-14 sm:py-20 lg:py-28 px-3.5 sm:px-6 lg:px-8 border-b border-slate-900 overflow-hidden">
      {/* Background Subtle Data Grid Lines */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="final-cta-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#FFFFFF" strokeWidth="1" />
              <circle cx="60" cy="0" r="2" fill="#22C7E0" />
              <circle cx="0" cy="60" r="2" fill="#1A3A75" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#final-cta-grid)" />
        </svg>
      </div>

      {/* Floating subtle data glow blobs */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-[#1A3A75]/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-[#22C7E0]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Centralizado */}
      <div className="w-full max-w-[900px] mx-auto text-center relative z-10 flex flex-col items-center">
        {/* Pill Tag com detalhe ciano */}
        <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-[#070B14] border border-[#1A3A75]/60 text-[#22C7E0] text-[10px] sm:text-xs font-semibold backdrop-blur-sm shadow-xl mb-4 sm:mb-6 max-w-full">
          <span className="w-2 h-2 rounded-full bg-[#22C7E0] animate-pulse shadow-[0_0_6px_#22C7E0] shrink-0" />
          <span className="leading-tight">Conexão inteligente e fundamentada em dados</span>
        </div>
        {/* Título EXATO */}
        <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-[52px] font-bold tracking-tight leading-[1.15] text-white">
          Pronto para cruzar a ponte?
        </h2>
        {/* Subtítulo EXATO: primeira frase branca e a segunda em ciano com glow suave estilo luzes da cidade */}
        <p className="mt-3 sm:mt-6 text-base sm:text-2xl lg:text-[26px] font-semibold tracking-tight leading-snug max-w-3xl">
          <span className="text-white">Seu imóvel encontra o comprador certo. </span>
          <span className="text-[#22C7E0] drop-shadow-[0_0_16px_rgba(34,199,224,0.35)] block sm:inline mt-1 sm:mt-0">
            Você encontra o negócio certo.
          </span>
        </p>
        {/* Nota EXATA */}
        <div className="mt-3 sm:mt-4 inline-flex items-center gap-2 text-xs sm:text-sm md:text-base font-medium text-slate-300">
          <ShieldCheck className="w-4 h-4 text-[#22C7E0] shrink-0" />
          <span>Negocie com segurança!</span>
        </div>
        {/* Os dois CTAs já existentes e funcionais com bloco de reassurance junto ao CTA secundário */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-end justify-center gap-4 sm:gap-6 w-full sm:w-auto">
          {/* CTA Primário: Quero vender (azul corporate #1A3A75, hover profundo #142E5E, sombra interna sutil) */}
          <div className="flex flex-col justify-end">
            <button
              type="button"
              onClick={handleVenderClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 sm:px-7 py-3.5 sm:py-4 min-h-[48px] rounded-xl bg-[#1A3A75] hover:bg-[#142E5E] active:bg-[#0F2347] text-white text-sm sm:text-base font-semibold shadow-inner border border-white/10 hover:border-white/20 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Building className="w-5 h-5 shrink-0" />
              <span>Quero vender</span>
              <ArrowRight className="w-4 h-4 ml-0.5 shrink-0" />
            </button>
          </div>

          {/* Coluna do CTA Secundário com reassurance de checkmarks */}
          <div className="flex flex-col items-stretch sm:items-start text-left">
            {/* Bloco de reassurance: 4 checkmarks + palavra (~16px acima do CTA secundário, ~12px entre itens, ~14px font-normal slate-300, checkmarks em ciano) */}
            <div className="mb-4 flex flex-col gap-3 text-slate-300 text-sm font-normal">
              <div className="inline-flex items-center gap-2">
                <Check className="w-4 h-4 text-[#22C7E0] shrink-0 stroke-[2.5]" />
                <span className="tracking-wide text-xs sm:text-sm text-slate-300 font-normal">
                  ANÁLISE
                </span>
              </div>
              <div className="inline-flex items-center gap-2">
                <Check className="w-4 h-4 text-[#22C7E0] shrink-0 stroke-[2.5]" />
                <span className="tracking-wide text-xs sm:text-sm text-slate-300 font-normal">
                  ESTRATÉGIA
                </span>
              </div>
              <div className="inline-flex items-center gap-2">
                <Check className="w-4 h-4 text-[#22C7E0] shrink-0 stroke-[2.5]" />
                <span className="tracking-wide text-xs sm:text-sm text-slate-300 font-normal">
                  OPORTUNIDADES
                </span>
              </div>
              <div className="inline-flex items-center gap-2">
                <Check className="w-4 h-4 text-[#22C7E0] shrink-0 stroke-[2.5]" />
                <span className="tracking-wide text-xs sm:text-sm text-slate-300 font-normal">
                  RESULTADOS
                </span>
              </div>
            </div>

            {/* CTA Secundário: Quero oportunidade de investimento */}
            <button
              type="button"
              onClick={handleInvestirClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-5 sm:px-7 py-3.5 sm:py-4 min-h-[48px] rounded-xl border border-[#1A3A75] bg-[#070B14] hover:bg-[#1A3A75]/35 active:bg-[#1A3A75]/50 text-white text-sm sm:text-base font-semibold backdrop-blur-sm transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer hover:border-[#22C7E0]/60 text-center leading-snug shadow-xl"
            >
              <TrendingUp className="w-5 h-5 text-[#22C7E0] shrink-0" />
              <span>Quero oportunidade de investimento</span>
            </button>
          </div>
        </div>
        {/* Mini barra de segurança / dados com detalhes em ciano */}
        <div className="mt-7 sm:mt-10 pt-5 sm:pt-6 border-t border-slate-800/80 w-full max-w-xl flex flex-wrap items-center justify-center gap-3.5 sm:gap-6 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#22C7E0] shrink-0" />
            <span>Segurança jurídica</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C7E0] shadow-[0_0_6px_#22C7E0]" />
            <span>Dados criptografados</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C7E0] shadow-[0_0_6px_#22C7E0]" />
            <span>Atendimento humano</span>
          </div>
        </div>
      </div>
    </section>
  )
}
