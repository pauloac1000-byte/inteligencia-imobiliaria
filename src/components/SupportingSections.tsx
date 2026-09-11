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
        className="bg-[#0B1F3A] text-white py-20 sm:py-24 px-6 border-b border-slate-800"
      >
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2563EB]/20 border border-[#2563EB]/40 text-[#2563EB] text-xs font-semibold">
                Para quem quer vender
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Venda seu imóvel com velocidade, sem queimar valor de mercado
              </h2>
              <p className="text-slate-300 text-base leading-relaxed">
                Esqueça dezenas de visitas desqualificadas e meses sem proposta. Conectamos seu
                imóvel a compradores que buscam exatamente o que você tem a oferecer.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenModal('vender')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-sm font-semibold transition-all shrink-0 cursor-pointer w-fit"
            >
              <span>Cadastrar imóvel</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Benefício 1 */}
            <div className="p-6 rounded-2xl bg-[#12294A] border border-slate-700/80 space-y-4 hover:border-[#2563EB]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#2563EB]/20 text-[#2563EB] flex items-center justify-center">
                <Clock className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-xl font-bold text-white">Prazo acelerado</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Reduza drasticamente o tempo médio de venda. Ao apresentar o imóvel apenas para
                investidores com liquidez pronta e perfil compatível, o fechamento acontece em
                semanas, não em meses.
              </p>
            </div>

            {/* Benefício 2 */}
            <div className="p-6 rounded-2xl bg-[#12294A] border border-slate-700/80 space-y-4 hover:border-[#2563EB]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#2563EB]/20 text-[#2563EB] flex items-center justify-center">
                <DollarSign className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-xl font-bold text-white">Preço justo e sem leilão</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Proteja a avaliação do seu patrimônio. Nosso modelo analítico fundamenta o valor
                real do metro quadrado, evitando ofertas especulativas e desvalorização causada pela
                exposição prolongada.
              </p>
            </div>

            {/* Benefício 3 */}
            <div className="p-6 rounded-2xl bg-[#12294A] border border-slate-700/80 space-y-4 hover:border-[#2563EB]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#2563EB]/20 text-[#2563EB] flex items-center justify-center">
                <UserCheck className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-xl font-bold text-white">Comprador qualificado</h3>
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
        className="bg-[#F8FAFC] text-[#0B1F3A] py-20 sm:py-24 px-6 border-b border-slate-200"
      >
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22D3EE]/20 border border-[#22D3EE]/40 text-[#0891b2] text-xs font-semibold">
                Para quem quer investir
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1F3A]">
                Acesse oportunidades antes de virarem commodity nos portais
              </h2>
              <p className="text-[#64748B] text-base leading-relaxed">
                Originação direta e inteligência orientada a dados para você tomar decisões de
                alocação imobiliária com rentabilidade superior e risco calibrado.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenModal('investir')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#22D3EE] hover:bg-[#06b6d4] text-[#0B1F3A] text-sm font-bold transition-all shrink-0 cursor-pointer w-fit"
            >
              <span>Definir tese de investimento</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Benefício Investir 1 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md space-y-4 hover:border-[#22D3EE] transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#22D3EE]/15 text-[#0891b2] flex items-center justify-center">
                <Eye className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-xl font-bold text-[#0B1F3A]">Antecipação a oportunidades</h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Receba ativos imobiliários antes que cheguem a anúncios públicos. Você negocia na
                fonte com condições exclusivas e sem concorrência inflacionada.
              </p>
            </div>

            {/* Benefício Investir 2 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md space-y-4 hover:border-[#22D3EE] transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#22D3EE]/15 text-[#0891b2] flex items-center justify-center">
                <TrendingUp className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-xl font-bold text-[#0B1F3A]">Dados analíticos para decisão</h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Tome decisões baseadas em números reais: projeção de valorização de região,
                histórico de metro quadrado, liquidez projetada e yield comparativo.
              </p>
            </div>

            {/* Benefício Investir 3 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md space-y-4 hover:border-[#22D3EE] transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#22D3EE]/15 text-[#0891b2] flex items-center justify-center">
                <FileCheck2 className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-xl font-bold text-[#0B1F3A]">Segurança jurídica completa</h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Imóveis com documentação pré-auditada (certidões, ônus e histórico registral) para
                garantir fechamento ágil e blindagem do seu patrimônio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO #como-funciona */}
      <section
        id="como-funciona"
        className="bg-gradient-to-b from-[#0B1F3A] to-[#12294A] text-white py-20 sm:py-24 px-6 border-b border-slate-800"
      >
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2563EB]/20 border border-[#2563EB]/40 text-[#22D3EE] text-xs font-semibold mb-3">
              Mecânica da Plataforma
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Como funciona a nossa inteligência
            </h2>
            <p className="mt-3 text-base text-slate-300">
              Três passos estruturados para transformar dados dispersos em conexões assertivas e
              transações seguras.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="relative p-8 rounded-2xl bg-[#08172c]/80 border border-slate-700/80 flex flex-col justify-between space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-4xl sm:text-5xl font-extrabold text-[#2563EB]">01</span>
                <div className="w-10 h-10 rounded-lg bg-[#2563EB]/20 text-[#22D3EE] flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Cadastre seu perfil</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Você informa o que tem ou o que procura: localização, tipologia, faixa de valor,
                  liquidez e parâmetros estratégicos da sua operação.
                </p>
              </div>
              <div className="text-xs text-[#22D3EE] font-mono">Entrada de parâmetros</div>
            </div>

            {/* Step 2 */}
            <div className="relative p-8 rounded-2xl bg-[#08172c]/80 border border-[#22D3EE]/40 flex flex-col justify-between space-y-6 shadow-lg shadow-[#22D3EE]/10">
              <div className="flex items-center justify-between">
                <span className="text-4xl sm:text-5xl font-extrabold text-[#22D3EE]">02</span>
                <div className="w-10 h-10 rounded-lg bg-[#22D3EE]/20 text-[#22D3EE] flex items-center justify-center">
                  <Cpu className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Nossa inteligência cruza</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Algoritmos analíticos avaliam 48 variáveis de investimento para calcular o
                  percentual exato de compatibilidade entre as duas pontas.
                </p>
              </div>
              <div className="text-xs text-[#22D3EE] font-mono">Cálculo de compatibilidade</div>
            </div>

            {/* Step 3 */}
            <div className="relative p-8 rounded-2xl bg-[#08172c]/80 border border-slate-700/80 flex flex-col justify-between space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-4xl sm:text-5xl font-extrabold text-[#2563EB]">03</span>
                <div className="w-10 h-10 rounded-lg bg-[#2563EB]/20 text-[#22D3EE] flex items-center justify-center">
                  <Network className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">A conexão acontece</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Contato qualificado e direto entre quem vende e quem tem capacidade de compra, com
                  acompanhamento de dados e transparência negocial.
                </p>
              </div>
              <div className="text-xs text-[#22D3EE] font-mono">Fechamento do negócio</div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
