import React from 'react'
import { Activity, ShieldCheck, MapPin } from 'lucide-react'

export const ProofStrip: React.FC = () => {
  return (
    <section
      aria-label="Indicadores de prova e confiabilidade"
      className="bg-[#081226] border-y border-slate-800/80 py-8 sm:py-10 lg:py-12 px-3.5 sm:px-6 lg:px-8 relative z-10 shadow-2xl shadow-black/40"
    >
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-6 md:gap-8 lg:gap-12 items-stretch">
          {/* Métrica 1 */}
          <div className="flex items-start gap-3.5 sm:gap-4 p-4 sm:p-5 md:p-2 rounded-2xl bg-[#070B14]/80 sm:bg-transparent border border-slate-800/80 sm:border-0 shadow-xl sm:shadow-none transition-transform hover:-translate-y-0.5 sm:hover:translate-y-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#070B14] border border-[#22C7E0]/30 flex items-center justify-center text-[#22C7E0] shrink-0 shadow-[0_0_12px_rgba(34,199,224,0.15)]">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                  100%
                </span>
                <span className="h-2 w-2 rounded-full bg-[#22C7E0] shadow-[0_0_8px_#22C7E0]" />
              </div>
              <p className="text-sm sm:text-base font-semibold text-slate-200 leading-snug">
                Análise técnica antes de qualquer negociação
              </p>
            </div>
          </div>

          {/* Métrica 2 */}
          <div className="flex items-start gap-3.5 sm:gap-4 p-4 sm:p-5 md:p-2 rounded-2xl bg-[#070B14]/80 sm:bg-transparent border border-slate-800/80 sm:border-0 shadow-xl sm:shadow-none transition-transform hover:-translate-y-0.5 sm:hover:translate-y-0 md:border-l md:border-slate-800/80 md:pl-8">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#070B14] border border-[#22C7E0]/30 flex items-center justify-center text-[#22C7E0] shrink-0 shadow-[0_0_12px_rgba(34,199,224,0.15)]">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#22C7E0] font-mono">
                  Auditada
                </span>
                <span className="h-1.5 w-6 rounded-full bg-[#22C7E0]/50" />
              </div>
              <p className="text-sm sm:text-lg font-bold text-white leading-snug">
                Rede qualificada de investidores com capital
              </p>
            </div>
          </div>

          {/* Métrica 3 */}
          <div className="flex items-start gap-3.5 sm:gap-4 p-4 sm:p-5 md:p-2 rounded-2xl bg-[#070B14]/80 sm:bg-transparent border border-slate-800/80 sm:border-0 shadow-xl sm:shadow-none transition-transform hover:-translate-y-0.5 sm:hover:translate-y-0 md:border-l md:border-slate-800/80 md:pl-8">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#070B14] border border-[#22C7E0]/30 flex items-center justify-center text-[#22C7E0] shrink-0 shadow-[0_0_12px_rgba(34,199,224,0.15)]">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#22C7E0] font-mono">
                  Regional
                </span>
                <span className="h-1.5 w-6 rounded-full bg-[#22C7E0]/50" />
              </div>
              <p className="text-sm sm:text-lg font-bold text-white leading-snug">
                Domínio dos valores de cada cidade da região
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
