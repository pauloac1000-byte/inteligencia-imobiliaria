import React from 'react'
import {
  Clock,
  DollarSign,
  UserCheck,
  Eye,
  TrendingUp,
  FileCheck2,
  ShieldCheck,
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
        className="bg-[#0B1F3A] text-white py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800"
      >
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-14 lg:mb-16">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2563EB]/20 border border-[#2563EB]/40 text-[#22D3EE] text-xs font-semibold">
                Para quem quer vender
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
                Venda seu imóvel com velocidade, sem queimar valor de mercado
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Esqueça dezenas de visitas desqualificadas e meses sem proposta. Conectamos seu
                imóvel a compradores que buscam exatamente o que você tem a oferecer.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenModal('vender')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white text-sm font-semibold transition-all shrink-0 cursor-pointer shadow-md"
            >
              <span>Cadastrar imóvel</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {/* Benefício 1 */}
            <div className="p-5 sm:p-6 lg:p-7 rounded-2xl bg-[#12294A] border border-slate-700/80 space-y-4 hover:border-[#2563EB]/50 transition-colors shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-[#2563EB]/20 text-[#22D3EE] flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 stroke-[2]" />
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
            <div className="p-5 sm:p-6 lg:p-7 rounded-2xl bg-[#12294A] border border-slate-700/80 space-y-4 hover:border-[#2563EB]/50 transition-colors shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-[#2563EB]/20 text-[#22D3EE] flex items-center justify-center shrink-0">
                <DollarSign className="w-6 h-6 stroke-[2]" />
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
            <div className="p-5 sm:p-6 lg:p-7 rounded-2xl bg-[#12294A] border border-slate-700/80 space-y-4 hover:border-[#2563EB]/50 transition-colors shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-[#2563EB]/20 text-[#22D3EE] flex items-center justify-center shrink-0">
                <UserCheck className="w-6 h-6 stroke-[2]" />
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

      {/* SEÇÃO #para-investir */}
      <section
        id="para-investir"
        className="bg-[#F8FAFC] text-[#0B1F3A] py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200"
      >
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-14 lg:mb-16">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22D3EE]/20 border border-[#22D3EE]/40 text-[#0891b2] text-xs font-semibold">
                Para quem quer investir
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#0B1F3A] leading-tight">
                Acesse oportunidades antes de virarem commodity nos portais
              </h2>
              <p className="text-[#64748B] text-sm sm:text-base leading-relaxed">
                Originação direta e inteligência orientada a dados para você tomar decisões de
                alocação imobiliária com rentabilidade superior e risco calibrado.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenModal('investir')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] rounded-xl bg-[#22D3EE] hover:bg-[#06b6d4] active:bg-[#0891b2] text-[#0B1F3A] text-sm font-bold transition-all shrink-0 cursor-pointer shadow-md"
            >
              <span>Definir tese de investimento</span>
              <ArrowRight className="w-4 h-4 shrink-0 text-[#0B1F3A]" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {/* Benefício Investir 1 */}
            <div className="p-5 sm:p-6 lg:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md space-y-4 hover:border-[#22D3EE] transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#22D3EE]/15 text-[#0891b2] flex items-center justify-center shrink-0">
                <Eye className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#0B1F3A] tracking-tight">
                Antecipação a oportunidades
              </h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Receba ativos imobiliários antes que cheguem a anúncios públicos. Você negocia na
                fonte com condições exclusivas e sem concorrência inflacionada.
              </p>
            </div>

            {/* Benefício Investir 2 */}
            <div className="p-5 sm:p-6 lg:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md space-y-4 hover:border-[#22D3EE] transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#22D3EE]/15 text-[#0891b2] flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#0B1F3A] tracking-tight">
                Dados analíticos para decisão
              </h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Tome decisões baseadas em números reais: projeção de valorização de região,
                histórico de metro quadrado, liquidez projetada e yield comparativo.
              </p>
            </div>

            {/* Benefício Investir 3 */}
            <div className="p-5 sm:p-6 lg:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md space-y-4 hover:border-[#22D3EE] transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#22D3EE]/15 text-[#0891b2] flex items-center justify-center shrink-0">
                <FileCheck2 className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#0B1F3A] tracking-tight">
                Segurança jurídica completa
              </h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
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
        className="bg-[#0B1F3A] text-white py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800 relative overflow-hidden"
      >
        {/* Glow de fundo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[600px] h-[300px] bg-[#2563EB]/10 blur-[120px] rounded-full pointer-events-none -z-0" />

        <div className="max-w-[1200px] mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22D3EE]/10 border border-[#22D3EE]/30 text-[#22D3EE] text-xs font-semibold mb-3">
              Processo em 3 etapas
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
              Simples para os dois lados
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
              Uma ponte clara e objetiva entre quem vende e quem investe, com rigor técnico em cada
              etapa.
            </p>
          </div>

          {/* Container dos 3 passos em linha com linha conectora pontilhada */}
          <div className="relative">
            {/* Linha conectora pontilhada no Desktop (simbolizando a ponte entre os passos) */}
            <div
              className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0 border-t-2 border-dashed border-[#22D3EE]/40 z-0 pointer-events-none"
              aria-hidden="true"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative z-10">
              {/* Passo 1 */}
              <div className="group relative p-6 sm:p-7 lg:p-8 rounded-2xl bg-[#12294A]/80 border border-slate-700/80 hover:border-[#22D3EE]/60 transition-all duration-300 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-5 sm:mb-6">
                    <span className="text-4xl sm:text-5xl font-extrabold text-[#22D3EE] font-mono tracking-tight drop-shadow-[0_0_12px_rgba(34,211,238,0.35)]">
                      01
                    </span>
                    <div className="w-11 h-11 rounded-xl bg-[#22D3EE]/15 border border-[#22D3EE]/30 text-[#22D3EE] flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                      <Layers className="w-5 h-5 stroke-[2]" />
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 tracking-tight">
                    Envie seu caso
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    informe os dados do imóvel ou perfil de investimento
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center gap-2 text-xs font-medium text-[#22D3EE]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] animate-pulse" />
                  <span>Entrada de informações</span>
                </div>
              </div>

              {/* Passo 2 */}
              <div className="group relative p-6 sm:p-7 lg:p-8 rounded-2xl bg-[#12294A]/80 border border-[#22D3EE]/50 hover:border-[#22D3EE] transition-all duration-300 shadow-xl shadow-[#22D3EE]/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-5 sm:mb-6">
                    <span className="text-4xl sm:text-5xl font-extrabold text-[#22D3EE] font-mono tracking-tight drop-shadow-[0_0_12px_rgba(34,211,238,0.35)]">
                      02
                    </span>
                    <div className="w-11 h-11 rounded-xl bg-[#22D3EE]/20 border border-[#22D3EE]/40 text-[#22D3EE] flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                      <Cpu className="w-5 h-5 stroke-[2]" />
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 tracking-tight">
                    Análise técnica com dados
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    corretores analisam precificação racional, liquidez e compatibilidade
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center gap-2 text-xs font-medium text-[#22D3EE]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] animate-pulse" />
                  <span>Avaliação criteriosa</span>
                </div>
              </div>

              {/* Passo 3 */}
              <div className="group relative p-6 sm:p-7 lg:p-8 rounded-2xl bg-[#12294A]/80 border border-slate-700/80 hover:border-[#22D3EE]/60 transition-all duration-300 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-5 sm:mb-6">
                    <span className="text-4xl sm:text-5xl font-extrabold text-[#22D3EE] font-mono tracking-tight drop-shadow-[0_0_12px_rgba(34,211,238,0.35)]">
                      03
                    </span>
                    <div className="w-11 h-11 rounded-xl bg-[#22D3EE]/15 border border-[#22D3EE]/30 text-[#22D3EE] flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                      <Network className="w-5 h-5 stroke-[2]" />
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 tracking-tight">
                    Conexão e negociação
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    apresentação direta com condução segura até o fechamento
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center gap-2 text-xs font-medium text-[#22D3EE]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] animate-pulse" />
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
