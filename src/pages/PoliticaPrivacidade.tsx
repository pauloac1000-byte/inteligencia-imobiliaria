import React, { useEffect } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import {
  ShieldCheck,
  Lock,
  FileText,
  UserCheck,
  Trash2,
  Clock,
  ArrowLeft,
  Mail,
  Building,
  CheckCircle2,
} from 'lucide-react'
import { Footer } from '@/components/Footer'

interface LayoutContextType {
  onOpenModal?: (intent?: 'vender' | 'investir') => void
}

export const PoliticaPrivacidade: React.FC = () => {
  const context = useOutletContext<LayoutContextType>()
  const handleOpenModal = context?.onOpenModal || (() => {})

  // Rolagem para o topo ao carregar a rota
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  return (
    <div className="w-full flex flex-col min-h-screen bg-[#070B14] text-slate-100">
      {/* Espaçamento superior correspondente à altura do header fixo */}
      <div className="pt-[140px] sm:pt-[150px] md:pt-[165px] lg:pt-[175px] pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[920px] mx-auto space-y-10 sm:space-y-12">
          {/* Navegação de retorno */}
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-400 hover:text-[#22C7E0] transition-colors group px-3 py-1.5 rounded-lg bg-[#081226] border border-slate-800 hover:border-slate-700"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 text-[#22C7E0]" />
              <span>Voltar para a página inicial</span>
            </Link>
          </div>

          {/* Cabeçalho da Política */}
          <div className="space-y-4 border-b border-slate-800/80 pb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A3A75]/30 border border-[#1A3A75]/60 text-[#22C7E0] text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Privacidade & Proteção de Dados (LGPD)</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Política de Privacidade
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              Transparência absoluta sobre como coletamos, tratamos, analisamos e protegemos os seus
              dados em conformidade com as diretrizes da Lei Geral de Proteção de Dados (Lei nº
              13.709/2018).
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <Clock className="w-3.5 h-3.5 text-[#22C7E0]" />
              <span>
                Última atualização:{' '}
                {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Destaque Resumido */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#081226] to-[#0A1835] border border-[#1A3A75]/70 shadow-lg space-y-3">
            <div className="flex items-center gap-2 text-[#22C7E0] text-sm font-bold uppercase tracking-wider">
              <Lock className="w-4 h-4" />
              <span>Compromisso Fundamental</span>
            </div>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
              <strong>
                Seus dados são usados apenas para analisar o seu caso e não são compartilhados com
                terceiros.
              </strong>{' '}
              Você pode pedir a exclusão a qualquer momento através dos nossos canais de contato
              oficiais.
            </p>
          </div>

          {/* Seções Detalhadas */}
          <div className="space-y-8 text-sm sm:text-base text-slate-300 leading-relaxed">
            {/* 1. Dados Coletados */}
            <section className="space-y-3 bg-[#081226]/60 border border-slate-800/70 p-5 sm:p-7 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1A3A75]/40 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-[#22C7E0]" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  1. Dados coletados via formulários
                </h2>
              </div>
              <p>
                Coletamos exclusivamente as informações estritamente necessárias para a avaliação
                imobiliária ou cruzamento de perfil de investidor preenchidas diretamente por você
                nos nossos formulários:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-[#070B14] border border-slate-800 space-y-2">
                  <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                    <Building className="w-4 h-4 text-[#22C7E0]" />
                    Formulário de Venda de Imóvel
                  </h3>
                  <ul className="text-xs sm:text-sm text-slate-300 space-y-1.5 list-disc list-inside">
                    <li>Nome completo</li>
                    <li>Telefone / WhatsApp para contato direto</li>
                    <li>Endereço de e-mail</li>
                    <li>Tipo de imóvel e cidade/estado de localização</li>
                    <li>Valor estimado de venda pretendido</li>
                    <li>Observações e detalhes complementares do imóvel</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-[#070B14] border border-slate-800 space-y-2">
                  <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[#22C7E0]" />
                    Formulário de Investimento Imobiliário
                  </h3>
                  <ul className="text-xs sm:text-sm text-slate-300 space-y-1.5 list-disc list-inside">
                    <li>Nome completo</li>
                    <li>Telefone / WhatsApp para contato direto</li>
                    <li>Endereço de e-mail</li>
                    <li>Perfil da tese de investimento</li>
                    <li>Faixa de valor pretendida para alocação</li>
                    <li>Cidades ou regiões geográficas de interesse</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 2. Finalidade do Tratamento */}
            <section className="space-y-3 bg-[#081226]/60 border border-slate-800/70 p-5 sm:p-7 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1A3A75]/40 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-[#22C7E0]" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  2. Finalidade do tratamento e análise do caso
                </h2>
              </div>
              <p>Os dados fornecidos têm uma única e específica finalidade:</p>
              <ul className="space-y-2 list-disc list-inside text-slate-300 text-sm">
                <li>
                  <strong className="text-white">Análise do caso e cruzamento analítico:</strong>{' '}
                  calcular os índices de liquidez, preço de mercado e compatibilidade entre imóveis
                  cadastrados e investidores qualificados.
                </li>
                <li>
                  <strong className="text-white">Contato direto sobre seu cadastro:</strong>{' '}
                  retornar a você por WhatsApp, telefone ou e-mail com as conclusões da avaliação ou
                  com oportunidades pontuais que correspondam estritamente aos parâmetros
                  informados.
                </li>
                <li>
                  <strong className="text-white">Comunicação individualizada:</strong> esclarecer
                  dúvidas e apresentar o diagnóstico analítico solicitado.
                </li>
              </ul>
            </section>

            {/* 3. Não Compartilhamento */}
            <section className="space-y-3 bg-[#081226]/60 border border-slate-800/70 p-5 sm:p-7 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1A3A75]/40 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4 text-[#22C7E0]" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  3. Não compartilhamento com terceiros
                </h2>
              </div>
              <p>
                A KORBIX / Imóveis Inteligentes assume o compromisso de{' '}
                <strong className="text-white">
                  jamais vender, alugar, ceder ou compartilhar seus dados pessoais com terceiros
                </strong>{' '}
                para finalidades comerciais, publicitárias ou de mala direta.
              </p>
              <p>
                Seus dados são acessados unicamente por nossa equipe interna responsável pelo
                atendimento e processamento analítico do seu caso.
              </p>
            </section>

            {/* 4. Direito de Exclusão */}
            <section className="space-y-3 bg-[#081226]/60 border border-slate-800/70 p-5 sm:p-7 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1A3A75]/40 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4 text-[#22C7E0]" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  4. Direito de exclusão e revogação do consentimento
                </h2>
              </div>
              <p>
                Você possui total controle sobre as informações fornecidas. A qualquer momento e sem
                qualquer custo, você pode solicitar:
              </p>
              <ul className="space-y-2 list-disc list-inside text-slate-300 text-sm">
                <li>A confirmação da existência de tratamento e consulta aos dados armazenados;</li>
                <li>A correção de dados incompletos, inexatos ou desatualizados;</li>
                <li>
                  <strong className="text-white">
                    A exclusão imediata e definitiva dos seus dados
                  </strong>{' '}
                  de nossa base de cadastros;
                </li>
                <li>A revogação do consentimento para contato via WhatsApp, telefone ou e-mail.</li>
              </ul>
              <p className="pt-2 text-sm">
                Para exercer qualquer um destes direitos, basta enviar uma mensagem aos nossos
                canais de atendimento indicando seu nome e o e-mail ou telefone cadastrado. A
                exclusão é realizada prontamente.
              </p>
            </section>

            {/* 5. Último uso e Retenção dos Dados */}
            <section className="space-y-3 bg-[#081226]/60 border border-slate-800/70 p-5 sm:p-7 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1A3A75]/40 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-[#22C7E0]" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  5. Retenção e último uso dos dados
                </h2>
              </div>
              <p>
                Mantemos seus dados cadastrais unicamente durante o período necessário para a
                condução da análise do seu imóvel ou da busca por oportunidades compatíveis com a
                sua tese de investimento.
              </p>
              <p>
                Após a conclusão do atendimento ou diante da ausência de interação pelo titular pelo
                prazo razoável de atendimento, ou imediatamente mediante solicitação expressa de
                exclusão, as informações são eliminadas de forma segura de nossas bases de
                processamento ativo.
              </p>
            </section>

            {/* 6. Canais de Contato */}
            <section className="space-y-3 bg-[#081226]/60 border border-slate-800/70 p-5 sm:p-7 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1A3A75]/40 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-[#22C7E0]" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  6. Encarregado de dados e contato
                </h2>
              </div>
              <p>
                Se você tiver dúvidas sobre esta Política de Privacidade ou desejar solicitar a
                exclusão dos seus dados, utilize os canais disponibilizados em nossa página ou
                acione o suporte diretamente:
              </p>
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => handleOpenModal()}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1A3A75] hover:bg-[#142E5E] active:bg-[#0F2347] text-white text-xs sm:text-sm font-semibold shadow-inner border border-white/10 transition-colors cursor-pointer"
                >
                  <span>Abrir formulário de cadastro</span>
                </button>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#081226] hover:bg-[#0B1833] border border-slate-700 text-slate-200 text-xs sm:text-sm font-medium transition-colors"
                >
                  <span>Voltar para a página inicial</span>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Footer consistente */}
      <Footer onOpenModal={handleOpenModal} />
    </div>
  )
}

export default PoliticaPrivacidade
