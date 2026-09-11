import React from 'react'
import { ArrowRight, Building, TrendingUp, ShieldCheck } from 'lucide-react'

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
    <section className="relative bg-[#0B1F3A] text-white py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 border-b border-slate-800 overflow-hidden">
      {/* Background Subtle Data Grid Lines */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="final-cta-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#FFFFFF" strokeWidth="1" />
              <circle cx="60" cy="0" r="2" fill="#22D3EE" />
              <circle cx="0" cy="60" r="2" fill="#2563EB" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#final-cta-grid)" />
        </svg>
      </div>

      {/* Floating subtle data glow blobs */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-[#2563EB]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-[#22D3EE]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Centralizado */}
      <div className="w-full max-w-[900px] mx-auto text-center relative z-10 flex flex-col items-center">
        {/* Pill Tag com detalhe ciano */}
        <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-[#12294A]/90 border border-[#2563EB]/40 text-[#22D3EE] text-[11px] sm:text-xs font-semibold backdrop-blur-sm shadow-sm mb-5 sm:mb-6">
          <span className="w-2 h-2 rounded-full bg-[#22D3EE] animate-pulse shrink-0" />
          <span>Conexão inteligente e fundamentada em dados</span>
        </div>

        {/* Título EXATO */}
        <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-[52px] font-bold tracking-tight leading-[1.15] text-white">
          Pronto para cruzar a ponte?
        </h2>

        {/* Subtítulo EXATO com o mesmo tratamento visual do hero: uma frase em branco e a outra em azul elétrico */}
        <p className="mt-4 sm:mt-6 text-lg sm:text-2xl lg:text-[26px] font-semibold tracking-tight leading-snug max-w-3xl">
          <span className="text-white">Seu imóvel encontra o comprador certo. </span>
          <span className="text-[#2563EB] drop-shadow-sm block sm:inline">
            Você encontra o negócio certo.
          </span>
        </p>

        {/* Nota EXATA */}
        <div className="mt-3 sm:mt-4 inline-flex items-center gap-2 text-xs sm:text-sm md:text-base font-medium text-slate-300">
          <ShieldCheck className="w-4 h-4 text-[#22D3EE] shrink-0" />
          <span>Negocie com segurança!</span>
        </div>

        {/* Os dois CTAs já existentes e funcionais (empilhados no mobile, min-h 48px) */}
        <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 pt-6 sm:pt-8">
          {/* CTA Primário: Quero vender (azul elétrico #2563EB) */}
          <button
            type="button"
            onClick={handleVenderClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 sm:py-4 min-h-[48px] rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white text-base font-semibold shadow-lg hover:shadow-[#2563EB]/40 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Building className="w-5 h-5 shrink-0" />
            <span>Quero vender</span>
            <ArrowRight className="w-4 h-4 ml-0.5 shrink-0" />
          </button>

          {/* CTA Secundário: Quero oportunidade de investimento (contorno translúcido) */}
          <button
            type="button"
            onClick={handleInvestirClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 sm:py-4 min-h-[48px] rounded-xl border border-white/30 bg-white/5 hover:bg-white/10 active:bg-white/15 text-white text-base font-semibold backdrop-blur-sm transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer hover:border-white/50"
          >
            <TrendingUp className="w-5 h-5 text-[#22D3EE] shrink-0" />
            <span>Quero oportunidade de investimento</span>
          </button>
        </div>

        {/* Mini barra de segurança / dados com detalhes em ciano */}
        <div className="mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-slate-800/80 w-full max-w-xl flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" />
            <span>Compatibilidade precisa</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" />
            <span>Documentação pré-auditada</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" />
            <span>Sem intermediários desqualificados</span>
          </div>
        </div>
      </div>
    </section>
  )
}
