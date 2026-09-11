import React from 'react'
import { Activity, ShieldCheck, MapPin } from 'lucide-react'

export const ProofStrip: React.FC = () => {
  return (
    <section
      aria-label="Indicadores de prova e confiabilidade"
      className="bg-[#F8FAFC] border-y border-slate-200/90 py-8 sm:py-10 lg:py-12 px-3.5 sm:px-6 lg:px-8 relative z-10"
    >
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-6 md:gap-8 lg:gap-12 items-stretch">
          {/* Métrica 1 */}
          <div className="flex items-start gap-3.5 sm:gap-4 p-4 sm:p-5 md:p-2 rounded-2xl bg-white sm:bg-transparent border border-slate-200/80 sm:border-0 shadow-sm sm:shadow-none transition-transform hover:-translate-y-0.5 sm:hover:translate-y-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#0F172A]/5 border border-[#22D3EE]/30 flex items-center justify-center text-[#22D3EE] shrink-0 shadow-xs">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] font-mono">
                  100%
                </span>
                <span className="h-2 w-2 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]" />
              </div>
              <p className="text-sm sm:text-base font-semibold text-[#0F172A] leading-snug">
                Análise técnica antes de qualquer negociação
              </p>
            </div>
          </div>

          {/* Métrica 2 */}
          <div className="flex items-start gap-3.5 sm:gap-4 p-4 sm:p-5 md:p-2 rounded-2xl bg-white sm:bg-transparent border border-slate-200/80 sm:border-0 shadow-sm sm:shadow-none transition-transform hover:-translate-y-0.5 sm:hover:translate-y-0 md:border-l md:border-slate-200/80 md:pl-8">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#0F172A]/5 border border-[#22D3EE]/30 flex items-center justify-center text-[#22D3EE] shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0891b2] font-mono">
                  Auditada
                </span>
                <span className="h-1.5 w-6 rounded-full bg-[#22D3EE]/50" />
              </div>
              <p className="text-sm sm:text-lg font-bold text-[#0F172A] leading-snug">
                Rede qualificada de investidores com capital
              </p>
            </div>
          </div>

          {/* Métrica 3 */}
          <div className="flex items-start gap-3.5 sm:gap-4 p-4 sm:p-5 md:p-2 rounded-2xl bg-white sm:bg-transparent border border-slate-200/80 sm:border-0 shadow-sm sm:shadow-none transition-transform hover:-translate-y-0.5 sm:hover:translate-y-0 md:border-l md:border-slate-200/80 md:pl-8">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#0F172A]/5 border border-[#22D3EE]/30 flex items-center justify-center text-[#22D3EE] shrink-0 shadow-xs">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0891b2] font-mono">
                  Regional
                </span>
                <span className="h-1.5 w-6 rounded-full bg-[#22D3EE]/50" />
              </div>
              <p className="text-sm sm:text-lg font-bold text-[#0F172A] leading-snug">
                Domínio dos valores de cada cidade da região
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
