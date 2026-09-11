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
      className="bg-[#F8FAFC] py-14 sm:py-20 lg:py-24 px-3.5 sm:px-6 lg:px-8 border-b border-slate-200"
    >
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-14 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/90 text-[#0B1F3A] text-xs font-semibold mb-3">
            Diferenciais Competitivos
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#0B1F3A]">
            Por que a inteligência faz a diferença
          </h2>
          <p className="mt-2.5 sm:mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
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
                className="group relative p-4.5 sm:p-6 lg:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-[#22D3EE]/60 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 overflow-hidden"
              >
                {/* Linha sutil de destaque no topo ao hover */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#22D3EE] to-[#2563EB] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="space-y-3.5 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#0B1F3A]/5 border border-[#22D3EE]/30 flex items-center justify-center text-[#22D3EE] group-hover:bg-[#22D3EE]/10 group-hover:scale-105 transition-all duration-300 shrink-0">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400 group-hover:text-[#2563EB] transition-colors">
                      {item.badge}
                    </span>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <h3 className="text-base sm:text-xl font-bold text-[#0B1F3A] tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>

                <div className="pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-slate-100 flex items-center gap-2 text-xs font-medium text-slate-500 group-hover:text-[#0B1F3A] transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" />
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
