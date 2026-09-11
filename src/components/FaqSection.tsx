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
    question: 'Como é garantida a segurança jurídica da negociação?',
    answer:
      'Toda transação conta com auditoria documental prévia conduzida por corretores credenciados: certidões de ônus reais, regularidade fiscal dos proprietários e histórico registral completo. A plataforma atua como uma ponte técnica que assegura conformidade e blindagem patrimonial para ambos os lados.',
  },
]

export const FaqSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'proprietario' | 'investidor'>('proprietario')

  return (
    <section
      id="faq"
      className="bg-[#F8FAFC] text-[#0B1F3A] py-20 sm:py-28 px-6 border-b border-slate-200"
    >
      <div className="max-w-[880px] mx-auto">
        {/* Cabeçalho da seção */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#2563EB] text-xs font-semibold mb-4">
            <HelpCircle className="w-3.5 h-3.5 text-[#22D3EE]" />
            <span>Dúvidas Frequentes</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-[#0B1F3A] leading-tight">
            Perguntas frequentes
          </h2>

          <p className="mt-3 text-base text-[#64748B] leading-relaxed">
            Transparência analítica para quem quer vender com liquidez ou investir com segurança.
          </p>

          {/* Abas comutadoras: "Sou proprietário" e "Sou investidor" */}
          <div className="mt-8 flex justify-center">
            <div className="inline-flex p-1.5 rounded-xl bg-slate-200/80 border border-slate-300/80 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab('proprietario')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'proprietario'
                    ? 'bg-[#0B1F3A] text-white shadow-md'
                    : 'text-[#64748B] hover:text-[#0B1F3A]'
                }`}
              >
                <Building className="w-4 h-4 text-[#22D3EE]" />
                <span>Sou proprietário</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('investidor')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'investidor'
                    ? 'bg-[#0B1F3A] text-white shadow-md'
                    : 'text-[#64748B] hover:text-[#0B1F3A]'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-[#22D3EE]" />
                <span>Sou investidor</span>
              </button>
            </div>
          </div>
        </div>

        {/* Acordeão Shadcn/ui (type="single", collapsible, transição suave, detalhes em ciano) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 transition-all">
          <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100 text-xs font-semibold text-[#64748B]">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
              {activeTab === 'proprietario'
                ? 'Critérios e processos para venda patrimonial'
                : 'Critérios e tese para alocação de capital'}
            </span>
            <span className="text-[11px] font-mono text-[#2563EB]">1 item aberto por vez</span>
          </div>

          {activeTab === 'proprietario' ? (
            <Accordion type="single" collapsible className="w-full">
              {FAQ_PROPRIETARIO.map((item) => (
                <AccordionItem
                  key={item.id}
                  value={item.id}
                  className="border-b border-slate-100 last:border-0 py-1"
                >
                  <AccordionTrigger className="text-left text-sm sm:text-base font-semibold text-[#0B1F3A] hover:text-[#2563EB] hover:no-underline py-4 transition-colors group">
                    <span className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] group-hover:scale-125 transition-transform" />
                      <span>{item.question}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-[#64748B] leading-relaxed pl-5 pr-2 pt-1 pb-4">
                    <div className="border-l-2 border-[#22D3EE]/60 pl-3">{item.answer}</div>
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
                  className="border-b border-slate-100 last:border-0 py-1"
                >
                  <AccordionTrigger className="text-left text-sm sm:text-base font-semibold text-[#0B1F3A] hover:text-[#2563EB] hover:no-underline py-4 transition-colors group">
                    <span className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] group-hover:scale-125 transition-transform" />
                      <span>{item.question}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-[#64748B] leading-relaxed pl-5 pr-2 pt-1 pb-4">
                    <div className="border-l-2 border-[#22D3EE]/60 pl-3">{item.answer}</div>
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
