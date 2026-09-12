import React from 'react'
import { LineChart, Network, MapPin, UserCheck } from 'lucide-react'

export const CompetitiveDifferences: React.FC = () => {
  const differentials = [
    {
      title: 'Precificação Racional',
      description: 'avaliação criteriosa fundamentada em métricas',
      icon: LineChart,
      badge: '01',
    },
    {
      title: 'Rede Qualificada',
      description: 'acesso direto a investidores em busca de liquidez e patrimônio',
      icon: Network,
      badge: '02',
    },
    {
      title: 'Domínio Regional',
      description: 'conhecimento dos valores e especificidades de cada cidade',
      icon: MapPin,
      badge: '03',
    },
    {
      title: 'Atendimento Direto',
      description: 'corretores credenciados',
      icon: UserCheck,
      badge: '04',
    },
  ]

  return (
    <section
      id="diferenciais"
      className="bg-[#081226] py-14 sm:py-20 lg:py-24 px-3.5 sm:px-6 lg:px-8 border-b border-slate-900"
    >
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-14 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A3A75]/35 border border-[#1A3A75]/60 text-[#22C7E0] text-xs font-semibold mb-3 shadow-[0_0_10px_rgba(34,199,224,0.15)]">
            Diferenciais Competitivos
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
            Por que a inteligência faz a diferença
          </h2>
          <p className="mt-2.5 sm:mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
            Processos analíticos e conexões qualificadas para transformar transações imobiliárias em
            decisões seguras e rentáveis.
          </p>
        </div>

        {/* Grid com 4 cards: 4 colunas desktop (lg), 2 colunas tablet (sm), 1 coluna mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-stretch">
          {differentials.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="group relative p-4.5 sm:p-6 lg:p-7 rounded-2xl bg-[#070B14] border border-slate-800 shadow-xl hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)] hover:border-[#22C7E0]/60 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 overflow-hidden"
              >
                {/* Linha sutil de destaque no topo ao hover */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#22C7E0] to-[#1A3A75] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="space-y-3.5 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#081226] border border-[#22C7E0]/30 flex items-center justify-center text-[#22C7E0] group-hover:bg-[#22C7E0]/15 group-hover:scale-105 transition-all duration-300 shrink-0 shadow-[0_0_10px_rgba(34,199,224,0.15)]">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400 group-hover:text-[#22C7E0] transition-colors">
                      {item.badge}
                    </span>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <h3 className="text-base sm:text-xl font-bold text-white tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>
                  </div>
                </div>

                <div className="pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-slate-800/80 flex items-center gap-2 text-xs font-medium text-slate-400 group-hover:text-white transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C7E0] shadow-[0_0_6px_#22C7E0]" />
                  <span>Padrão Imóveis Inteligentes</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
