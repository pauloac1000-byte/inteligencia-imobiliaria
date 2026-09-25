import React from 'react'
import {
  Clock,
  DollarSign,
  UserCheck,
  Eye,
  TrendingUp,
  FileCheck2,
  Network,
  Cpu,
  Layers,
  ArrowRight,
} from 'lucide-react'

interface SupportingSectionsProps {
  onOpenModal: (intent: 'vender' | 'investir') => void
}

export const SupportingSections: React.FC<SupportingSectionsProps> = ({ onOpenModal }) => {
  return (
    <>
      {/* SEÇÃO #para-vender */}
      <section
        id="para-vender"
        className="bg-[#070B14] text-white py-14 sm:py-20 lg:py-24 px-3.5 sm:px-6 lg:px-8 border-b border-slate-900"
      >
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 sm:gap-6 mb-8 sm:mb-14 lg:mb-16">
            <div className="max-w-2xl space-y-2.5 sm:space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A3A75]/35 border border-[#1A3A75]/60 text-[#22C7E0] text-xs font-semibold">
                Para quem quer vender
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
                Venda seu imóvel com rapidez velocidade e pelo valor justo de mercado
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Esqueça dezenas de visitas desqualificadas e meses sem proposta. Conectamos seu
                imóvel a compradores que buscam exatamente o que você tem a oferecer.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenModal('vender')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] rounded-xl bg-[#1A3A75] hover:bg-[#142E5E] active:bg-[#0F2347] text-white text-sm font-semibold shadow-inner border border-white/10 hover:border-white/20 transition-all shrink-0 cursor-pointer"
            >
              <span>Cadastrar imóvel</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Benefício 1 */}
            <div className="p-4.5 sm:p-6 lg:p-7 rounded-2xl bg-[#081226] border border-slate-800 space-y-3 sm:space-y-4 hover:border-[#1A3A75] transition-colors shadow-xl">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#070B14] border border-[#1A3A75]/60 text-[#22C7E0] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(34,199,224,0.15)]">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Prazo acelerado
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Reduza drasticamente o tempo médio de venda. Ao apresentar o imóvel apenas para
                investidores com liquidez pronta e perfil compatível, o fechamento acontece em
                semanas, não em meses.
              </p>
            </div>

            {/* Benefício 2 */}
            <div className="p-4.5 sm:p-6 lg:p-7 rounded-2xl bg-[#081226] border border-slate-800 space-y-3 sm:space-y-4 hover:border-[#1A3A75] transition-colors shadow-xl">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#070B14] border border-[#1A3A75]/60 text-[#22C7E0] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(34,199,224,0.15)]">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Preço justo e sem leilão
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Proteja a avaliação do seu patrimônio. Nosso modelo analítico fundamenta o valor
                real do metro quadrado, evitando ofertas especulativas e desvalorização causada pela
                exposição prolongada.
              </p>
            </div>

            {/* Benefício 3 */}
            <div className="p-4.5 sm:p-6 lg:p-7 rounded-2xl bg-[#081226] border border-slate-800 space-y-3 sm:space-y-4 hover:border-[#1A3A75] transition-colors shadow-xl">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#070B14] border border-[#1A3A75]/60 text-[#22C7E0] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(34,199,224,0.15)]">
                <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Comprador qualificado
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Nada de curiosos. Cada investidor conectado possui tese de investimento alinhada,
                capacidade financeira auditada e real interesse de compra documentado.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO #para-investir (convertida para azul-marinho escuro) */}
      <section
        id="para-investir"
        className="bg-[#081226] text-white py-14 sm:py-20 lg:py-24 px-3.5 sm:px-6 lg:px-8 border-b border-slate-900"
      >
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 sm:gap-6 mb-8 sm:mb-14 lg:mb-16">
            <div className="max-w-2xl space-y-2.5 sm:space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A3A75]/40 border border-[#1A3A75]/70 text-[#22C7E0] text-xs font-semibold">
                Para quem quer investir
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
                Acesse oportunidades antes de virarem commodity nos portais
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Originação direta e inteligência orientada a dados para você tomar decisões de
                alocação imobiliária com rentabilidade superior e risco calibrado.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenModal('investir')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] rounded-xl bg-[#1A3A75] hover:bg-[#142E5E] active:bg-[#0F2347] text-white text-sm font-semibold shadow-inner border border-white/10 hover:border-white/20 transition-all shrink-0 cursor-pointer"
            >
              <span>Definir tese de investimento</span>
              <ArrowRight className="w-4 h-4 shrink-0 text-[#22C7E0]" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Benefício Investir 1 */}
            <div className="p-4.5 sm:p-6 lg:p-7 rounded-2xl bg-[#070B14] border border-slate-800 shadow-xl space-y-3 sm:space-y-4 hover:border-[#22C7E0]/60 transition-all">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#081226] border border-[#22C7E0]/30 text-[#22C7E0] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(34,199,224,0.15)]">
                <Eye className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Antecipação a oportunidades
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Receba ativos imobiliários antes que cheguem a anúncios públicos. Você negocia na
                fonte com condições exclusivas e sem concorrência inflacionada.
              </p>
            </div>

            {/* Benefício Investir 2 */}
            <div className="p-4.5 sm:p-6 lg:p-7 rounded-2xl bg-[#070B14] border border-slate-800 shadow-xl space-y-3 sm:space-y-4 hover:border-[#22C7E0]/60 transition-all">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#081226] border border-[#22C7E0]/30 text-[#22C7E0] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(34,199,224,0.15)]">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Dados analíticos para decisão
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Tome decisões baseadas em números reais: projeção de valorização de região,
                histórico de metro quadrado, liquidez projetada e yield comparativo.
              </p>
            </div>

            {/* Benefício Investir 3 */}
            <div className="p-4.5 sm:p-6 lg:p-7 rounded-2xl bg-[#070B14] border border-slate-800 shadow-xl space-y-3 sm:space-y-4 hover:border-[#22C7E0]/60 transition-all">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#081226] border border-[#22C7E0]/30 text-[#22C7E0] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(34,199,224,0.15)]">
                <FileCheck2 className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Segurança jurídica completa
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Imóveis com documentação pré-auditada (certidões, ônus e histórico registral) para
                garantir fechamento ágil e blindagem do seu patrimônio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO #como-funciona: "Simples para os dois lados" (3 passos) */}
      <section
        id="como-funciona"
        className="bg-[#070B14] text-white py-14 sm:py-20 lg:py-24 px-3.5 sm:px-6 lg:px-8 border-b border-slate-900 relative overflow-hidden"
      >
        <div className="max-w-[1200px] mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A3A75]/35 border border-[#1A3A75]/60 text-[#22C7E0] text-xs font-semibold mb-3">
              Processo em 3 etapas
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
              Simples para os dois lados
            </h2>
            <p className="mt-2.5 sm:mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
              Uma ponte clara e objetiva entre quem vende e quem investe, com rigor técnico em cada
              etapa.
            </p>
          </div>

          {/* Container dos 3 passos em linha com linha conectora pontilhada */}
          <div className="relative">
            {/* Linha conectora pontilhada no Desktop (simbolizando a ponte entre os passos) */}
            <div
              className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0 border-t-2 border-dashed border-[#22C7E0]/30 z-0 pointer-events-none"
              aria-hidden="true"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8 relative z-10">
              {/* Passo 1 */}
              <div className="group relative p-5 sm:p-7 lg:p-8 rounded-2xl bg-[#081226] border border-slate-800 hover:border-[#22C7E0]/60 transition-all duration-300 shadow-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <span className="text-3xl sm:text-5xl font-extrabold text-[#22C7E0] font-mono tracking-tight drop-shadow-[0_0_12px_rgba(34,199,224,0.35)]">
                      01
                    </span>
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#070B14] border border-[#22C7E0]/30 text-[#22C7E0] flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 shadow-[0_0_10px_rgba(34,199,224,0.15)]">
                      <Layers className="w-5 h-5 stroke-[2]" />
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 tracking-tight">
                    <span>Envie seu caso</span>
                    <span className="text-[#22C7E0] font-medium text-sm sm:text-base ml-2 inline-block">
                      — 5 minutos
                    </span>
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    informe os dados do imóvel ou perfil de investimento
                  </p>
                </div>
                <div className="mt-5 sm:mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2 text-xs font-medium text-[#22C7E0]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C7E0] animate-pulse" />
                  <span>Entrada de informações</span>
                </div>
              </div>

              {/* Passo 2 */}
              <div className="group relative p-5 sm:p-7 lg:p-8 rounded-2xl bg-[#081226] border border-[#22C7E0]/40 hover:border-[#22C7E0] transition-all duration-300 shadow-2xl shadow-[#22C7E0]/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <span className="text-3xl sm:text-5xl font-extrabold text-[#22C7E0] font-mono tracking-tight drop-shadow-[0_0_12px_rgba(34,199,224,0.35)]">
                      02
                    </span>
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#070B14] border border-[#22C7E0]/40 text-[#22C7E0] flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 shadow-[0_0_10px_rgba(34,199,224,0.15)]">
                      <Cpu className="w-5 h-5 stroke-[2]" />
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 tracking-tight">
                    <span>Análise técnica com dados</span>
                    <span className="text-[#22C7E0] font-medium text-sm sm:text-base ml-2 inline-block">
                      — até 48 horas
                    </span>
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    corretores analisam precificação racional, liquidez e compatibilidade
                  </p>
                </div>
                <div className="mt-5 sm:mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2 text-xs font-medium text-[#22C7E0]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C7E0] animate-pulse" />
                  <span>Avaliação criteriosa</span>
                </div>
              </div>

              {/* Passo 3 */}
              <div className="group relative p-5 sm:p-7 lg:p-8 rounded-2xl bg-[#081226] border border-slate-800 hover:border-[#22C7E0]/60 transition-all duration-300 shadow-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <span className="text-3xl sm:text-5xl font-extrabold text-[#22C7E0] font-mono tracking-tight drop-shadow-[0_0_12px_rgba(34,199,224,0.35)]">
                      03
                    </span>
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#070B14] border border-[#22C7E0]/30 text-[#22C7E0] flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 shadow-[0_0_10px_rgba(34,199,224,0.15)]">
                      <Network className="w-5 h-5 stroke-[2]" />
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 tracking-tight">
                    <span>Conexão e negociação</span>
                    <span className="text-[#22C7E0] font-medium text-sm sm:text-base ml-2 inline-block">
                      — sob agendamento
                    </span>
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    apresentação direta com condução segura até o fechamento
                  </p>
                </div>
                <div className="mt-5 sm:mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2 text-xs font-medium text-[#22C7E0]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C7E0] animate-pulse" />
                  <span>Fechamento seguro</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
