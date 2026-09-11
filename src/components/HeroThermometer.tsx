import React, { useState, useEffect } from 'react'
import { Sparkles, Activity } from 'lucide-react'

export const HeroThermometer: React.FC = () => {
  const [fillPercent, setFillPercent] = useState<number>(0)
  const [isCompleted, setIsCompleted] = useState<boolean>(false)

  useEffect(() => {
    // Fill from 0% to 92% over ~2000ms
    const targetPercent = 92
    const duration = 2000
    const steps = 60
    const intervalTime = duration / steps
    const increment = targetPercent / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= targetPercent) {
        setFillPercent(targetPercent)
        setIsCompleted(true)
        clearInterval(timer)
      } else {
        setFillPercent(Math.round(current))
      }
    }, intervalTime)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-[320px] sm:max-w-[380px] mx-auto select-none px-2 sm:px-0">
      {/* Background ambient glow behind thermometer */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#22D3EE]/15 to-[#1D4ED8]/15 blur-3xl rounded-full -z-10" />

      {/* Pop Elastic Badge (Appears when completed) */}
      <div
        className={`w-full max-w-[300px] sm:max-w-none flex justify-center transition-all duration-400 ease-out mb-4 sm:mb-5 z-20 ${
          isCompleted ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
        }`}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div className="relative group w-full sm:w-auto">
          {/* Cyan pulsing glow */}
          <div className="absolute -inset-1 rounded-2xl bg-[#22D3EE]/30 blur-md animate-pulse" />

          <div className="relative flex items-center justify-center gap-2 sm:gap-2.5 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-[#0B1F3A]/95 border border-[#22D3EE] backdrop-blur-md shadow-xl shadow-[#0F172A]/50">
            <span className="flex h-2.5 w-2.5 sm:h-3 sm:w-3 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22D3EE] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-[#22D3EE]" />
            </span>
            <div className="flex flex-col min-w-0">
              <div className="text-xl sm:text-[32px] font-extrabold text-white leading-none tracking-tight flex items-baseline gap-1 sm:gap-1.5 font-mono">
                <span>92%</span>
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#22D3EE] font-sans whitespace-nowrap">
                  de compatibilidade
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thermometer Glass Structure */}
      <div className="relative w-22 sm:w-32 h-[270px] sm:h-[380px] bg-[#0B1F3A]/80 border-2 border-slate-700/70 rounded-full p-2 sm:p-2.5 flex flex-col justify-end backdrop-blur-sm shadow-2xl overflow-visible">
        {/* Subtle grid lines & reference marks (25%, 50%, 75%) */}
        <div className="absolute inset-y-8 right-2 sm:right-3 flex flex-col justify-between text-[9px] sm:text-[10px] font-mono text-slate-400 pointer-events-none select-none z-10">
          <div className="flex items-center gap-0.5 sm:gap-1">
            <span className="w-1.5 sm:w-2 h-[1px] bg-slate-500" />
            <span>75%</span>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <span className="w-1.5 sm:w-2 h-[1px] bg-slate-500" />
            <span>50%</span>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <span className="w-1.5 sm:w-2 h-[1px] bg-slate-500" />
            <span>25%</span>
          </div>
        </div>

        {/* Interior vertical chamber */}
        <div className="relative w-full h-full bg-[#08172c]/80 rounded-full overflow-hidden flex flex-col justify-end border border-white/5">
          {/* Subtle horizontal reference lines across track */}
          <div className="absolute bottom-[25%] left-0 right-0 h-[1px] bg-white/10 z-10 border-dashed" />
          <div className="absolute bottom-[50%] left-0 right-0 h-[1px] bg-white/10 z-10 border-dashed" />
          <div className="absolute bottom-[75%] left-0 right-0 h-[1px] bg-white/10 z-10 border-dashed" />

          {/* Liquid Fill (from 0% to 92%) - gradiente atualizado: #0B1F3A -> #1D4ED8 -> #22D3EE */}
          <div
            className="w-full relative transition-all ease-out rounded-b-full bg-gradient-to-t from-[#0B1F3A] via-[#1D4ED8] to-[#22D3EE]"
            style={{
              height: `${fillPercent}%`,
              transitionDuration: '50ms',
            }}
          >
            {/* Top liquid meniscus / wave pulse effect */}
            <div className="absolute -top-2 left-0 right-0 h-4 bg-white/60 blur-[2px] rounded-full animate-pulse" />

            {/* Glowing wave head */}
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-white/80 to-transparent rounded-t-full" />

            {/* Internal bubbles/particles effect */}
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle,rgba(255,255,255,0.4)_1px,transparent_1px)] bg-[size:10px_10px]" />
          </div>
        </div>

        {/* Bulb base */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-14 sm:w-20 h-14 sm:h-20 bg-gradient-to-br from-[#0B1F3A] to-[#0F172A] border-2 border-slate-700/80 rounded-full flex items-center justify-center shadow-lg -z-0">
          <div className="w-9 sm:w-14 h-9 sm:h-14 rounded-full bg-gradient-to-br from-[#1D4ED8] to-[#22D3EE] p-0.5 flex items-center justify-center shadow-inner">
            <Activity className="w-4 sm:w-6 h-4 sm:h-6 text-white animate-pulse" />
          </div>
        </div>
      </div>

      {/* Micro-legend below thermometer */}
      <div className="mt-7 sm:mt-8 text-center max-w-[290px] px-2">
        <p className="text-xs sm:text-sm text-slate-300 sm:text-slate-400 flex items-center justify-center gap-1.5 font-medium leading-relaxed">
          <Sparkles className="w-3.5 h-3.5 text-[#22D3EE] shrink-0" />
          <span>calculada em tempo real com base em 48 variáveis de investimento</span>
        </p>
      </div>
    </div>
  )
}
