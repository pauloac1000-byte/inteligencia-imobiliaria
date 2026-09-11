import React from 'react'
import { Activity, ShieldCheck, MapPin } from 'lucide-react'

export const ProofStrip: React.FC = () => {
  return (
    <section
      aria-label="Indicadores de prova e confiabilidade"
      className="bg-[#F8FAFC] border-y border-slate-200/90 py-8 sm:py-10 px-6 relative z-10"
    >
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 lg:gap-12 items-stretch">
          {/* Métrica 1 */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-white/70 sm:bg-transparent border border-slate-200/60 sm:border-0 shadow-sm sm:shadow-none transition-transform hover:-translate-y-0.5 sm:hover:translate-y-0">
            <div className="w-12 h-12 rounded-xl bg-[#0B1F3A]/5 border border-[#22D3EE]/30 flex items-center justify-center text-[#22D3EE] shrink-0 shadow-xs">
              <Activity className="w-6 h-6 stroke-[2]" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B1F3A]">
                  100%
                </span>
                <span className="h-2 w-2 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]" />
              </div>
              <p className="text-sm sm:text-base font-semibold text-[#0B1F3A] leading-snug">
                Análise técnica antes de qualquer negociação
              </p>
            </div>
          </div>

          {/* Métrica 2 */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-white/70 sm:bg-transparent border border-slate-200/60 sm:border-0 shadow-sm sm:shadow-none transition-transform hover:-translate-y-0.5 sm:hover:translate-y-0 md:border-l md:border-slate-200/80 md:pl-8">
            <div className="w-12 h-12 rounded-xl bg-[#0B1F3A]/5 border border-[#22D3EE]/30 flex items-center justify-center text-[#22D3EE] shrink-0 shadow-xs">
              <ShieldCheck className="w-6 h-6 stroke-[2]" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold uppercase tracking-wider text-[#22D3EE]">
                  Auditada
                </span>
                <span className="h-1.5 w-6 rounded-full bg-[#22D3EE]/50" />
              </div>
              <p className="text-base sm:text-lg font-bold text-[#0B1F3A] leading-snug">
                Rede qualificada de investidores com capital
              </p>
            </div>
          </div>

          {/* Métrica 3 */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-white/70 sm:bg-transparent border border-slate-200/60 sm:border-0 shadow-sm sm:shadow-none transition-transform hover:-translate-y-0.5 sm:hover:translate-y-0 md:border-l md:border-slate-200/80 md:pl-8">
            <div className="w-12 h-12 rounded-xl bg-[#0B1F3A]/5 border border-[#22D3EE]/30 flex items-center justify-center text-[#22D3EE] shrink-0 shadow-xs">
              <MapPin className="w-6 h-6 stroke-[2]" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold uppercase tracking-wider text-[#22D3EE]">
                  Regional
                </span>
                <span className="h-1.5 w-6 rounded-full bg-[#22D3EE]/50" />
              </div>
              <p className="text-base sm:text-lg font-bold text-[#0B1F3A] leading-snug">
                Domínio dos valores de cada cidade da região
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
