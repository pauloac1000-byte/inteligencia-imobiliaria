import React, { useState } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { HelpCircle, Building, TrendingUp, Sparkles } from 'lucide-react'

interface FaqItem {
  id: string
  question: string
  answer: string
}

const FAQ_PROPRIETARIO: FaqItem[] = [
  {
    id: 'prop-tempo',
    question: 'Qual o tempo médio estimado para a venda do imóvel?',
    answer:
      'Ao contrário do modelo tradicional de portais abertos, onde o imóvel fica meses exposto a visitas desqualificadas, nossa mecânica conecta o ativo diretamente a investidores com capital pronto e tese compatível. Esse alinhamento reduz o ciclo de negociação para poucas semanas, acelerando a travessia da ponte até a assinatura.',
  },
  {
    id: 'prop-precificacao',
    question: 'Como funciona a precificação racional do meu imóvel?',
    answer:
      'Nossa análise técnica cruza mais de 48 variáveis de mercado: histórico real de transações na região, valor de m² praticado, liquidez e liquidez de demanda. Isso estabelece um valor justo e defensável, evitando tanto a desvalorização por tempo excessivo em estoque quanto propostas predatórias.',
  },
  {
    id: 'prop-custo',
    question: 'Existe algum custo para cadastrar meu imóvel na plataforma?',
    answer:
      'O cadastro e a análise preliminar de compatibilidade são 100% gratuitos para o proprietário. A remuneração ocorre apenas no fechamento bem-sucedido da operação, por meio dos honorários padrão de intermediação conduzidos pelos corretores credenciados que realizam a ponte segura do negócio.',
  },
]

const FAQ_INVESTIDOR: FaqItem[] = [
  {
    id: 'inv-oportunidades',
    question: 'Como recebo as oportunidades de investimento compatíveis?',
    answer:
      'Após o registro da sua tese (faixa de aporte, região de interesse, tipologia e expectativa de cap rate ou valorização), nosso algoritmo analisa os ativos cadastrados e envia apenas oportunidades com alto índice de compatibilidade diretamente para você, antes de chegarem ao mercado aberto.',
  },
  {
    id: 'inv-exclusividade',
    question: 'As oportunidades apresentadas possuem exclusividade de negociação?',
    answer:
      'Sim. Estabelecemos uma conexão direta com os proprietários verificados na nossa base. As oportunidades filtradas não passam pelo ruído de leilões informais em redes sociais ou múltiplos anúncios concorrentes nos portais, preservando sua margem analítica e poder de negociação.',
  },
  {
    id: 'inv-seguranca',
    question: 'Qual a segurança jurídica das transações estruturadas pela plataforma?',
    answer:
      'Toda transação conta com auditoria documental rigorosa: levantamento de certidões forenses, regularidade fiscal, análise de matrículas, ônus reais e histórico da titularidade. O processo é integralmente conduzido e respaldado por corretores credenciados perante os órgãos reguladores competentes.',
  },
]

export const FaqSection: React.FC = () => {
  const [tab, setTab] = useState<'venda' | 'investimento'>('venda')

  return (
    <section
      id="faq"
      className="bg-[#081226] text-white py-14 sm:py-20 lg:py-28 px-3.5 sm:px-6 lg:px-8 border-b border-slate-900"
    >
      <div className="max-w-[880px] mx-auto">
        {/* Cabeçalho da seção */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A3A75]/35 border border-[#1A3A75]/60 text-[#22C7E0] text-xs font-semibold mb-3 sm:mb-4 shadow-[0_0_10px_rgba(34,199,224,0.15)]">
            <HelpCircle className="w-3.5 h-3.5 text-[#22C7E0] shrink-0" />
            <span>Dúvidas Frequentes</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-[42px] font-bold tracking-tight text-white leading-tight">
            Perguntas frequentes
          </h2>

          <p className="mt-2.5 sm:mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
            Transparência analítica para quem quer vender com liquidez ou investir com segurança.
          </p>

          {/* Abas comutadoras: "Sou proprietário" e "Sou investidor" */}
          <div className="mt-5 sm:mt-8 flex justify-center">
            <div className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex p-1.5 rounded-xl bg-[#070B14] border border-slate-800 shadow-inner gap-1">
              <button
                type="button"
                onClick={() => setTab('venda')}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 min-h-[46px] rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  tab === 'venda'
                    ? 'bg-[#1A3A75] text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building className="w-4 h-4 text-[#22C7E0] shrink-0" />
                <span className="whitespace-nowrap">Sou proprietário</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('investimento')}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 min-h-[46px] rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  tab === 'investimento'
                    ? 'bg-[#1A3A75] text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-[#22C7E0] shrink-0" />
                <span className="whitespace-nowrap">Sou investidor</span>
              </button>
            </div>
          </div>
        </div>

        {/* Accordion das perguntas com design refinado Tech-Midnight */}
        <div className="bg-[#070B14] rounded-2xl border border-slate-800 shadow-2xl p-3.5 sm:p-6 lg:p-7 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 mb-2 border-b border-slate-800/80 text-xs font-semibold text-slate-300 gap-1.5">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#22C7E0] shrink-0" />
              <span>
                {tab === 'venda'
                  ? 'Perguntas selecionadas para proprietários'
                  : 'Perguntas selecionadas para investidores'}
              </span>
            </span>
            <span className="text-[11px] font-mono text-[#22C7E0]">1 item aberto por vez</span>
          </div>

          {tab === 'venda' ? (
            <Accordion type="single" collapsible className="w-full">
              {FAQ_PROPRIETARIO.map((item) => (
                <AccordionItem
                  key={item.id}
                  value={item.id}
                  className="border-b border-slate-800/80 last:border-0 py-1"
                >
                  <AccordionTrigger className="text-left text-sm sm:text-base font-semibold text-white hover:text-[#22C7E0] hover:no-underline py-3.5 sm:py-4 transition-colors group">
                    <span className="flex items-start sm:items-center gap-2.5 sm:gap-3 pr-2">
                      <span className="w-2 h-2 rounded-full bg-[#22C7E0] shadow-[0_0_6px_#22C7E0] group-hover:scale-125 transition-transform mt-1.5 sm:mt-0 shrink-0" />
                      <span className="leading-snug">{item.question}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-slate-300 leading-relaxed pl-4 sm:pl-5 pr-1 sm:pr-2 pt-1 pb-4">
                    <div className="border-l-2 border-[#22C7E0]/60 pl-3 sm:pl-3.5">
                      {item.answer}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {FAQ_INVESTIDOR.map((item) => (
                <AccordionItem
                  key={item.id}
                  value={item.id}
                  className="border-b border-slate-800/80 last:border-0 py-1"
                >
                  <AccordionTrigger className="text-left text-sm sm:text-base font-semibold text-white hover:text-[#22C7E0] hover:no-underline py-3.5 sm:py-4 transition-colors group">
                    <span className="flex items-start sm:items-center gap-2.5 sm:gap-3 pr-2">
                      <span className="w-2 h-2 rounded-full bg-[#22C7E0] shadow-[0_0_6px_#22C7E0] group-hover:scale-125 transition-transform mt-1.5 sm:mt-0 shrink-0" />
                      <span className="leading-snug">{item.question}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-slate-300 leading-relaxed pl-4 sm:pl-5 pr-1 sm:pr-2 pt-1 pb-4">
                    <div className="border-l-2 border-[#22C7E0]/60 pl-3 sm:pl-3.5">
                      {item.answer}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </div>
    </section>
  )
}
