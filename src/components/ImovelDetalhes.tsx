import React, { useEffect, useState } from 'react'
import {
  Camera,
  FileText,
  DollarSign,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  ImageIcon,
} from 'lucide-react'
import { LeadVinculado, StatusImovelLead } from '@/services/profiles'
import { KORBIX_WHATSAPP_NUMBER } from '@/services/leads'
import { registrarEvento } from '@/services/eventos'
import { LeadArquivo, listarArquivosDoLead, RotuloDocumento } from '@/services/arquivos'
import { UploadFotos } from './UploadFotos'
import { UploadDocumentos } from './UploadDocumentos'

interface ImovelCardProps {
  lead: LeadVinculado
}

// Configuração visual para cada status
const STATUS_CONFIG: Record<
  StatusImovelLead,
  {
    label: string
    badgeClass: string
    dotClass: string
    descricao: string
  }
> = {
  Recebido: {
    label: 'Recebido',
    badgeClass:
      'bg-cyan-500/15 text-[#22C7E0] border-[#22C7E0]/40 shadow-[0_0_12px_rgba(34,199,224,0.2)]',
    dotClass: 'bg-[#22C7E0] animate-pulse',
    descricao: 'Cadastro recebido em nossa base. Triagem inicial em andamento.',
  },
  'Em análise': {
    label: 'Em análise',
    badgeClass:
      'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]',
    dotClass: 'bg-amber-400 animate-pulse',
    descricao: 'Nossa equipe técnica está analisando a documentação e métricas do imóvel.',
  },
  'Com compatibilidade': {
    label: 'Com compatibilidade',
    badgeClass:
      'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]',
    dotClass: 'bg-emerald-400',
    descricao: 'Encontramos investidores qualificados com tese compatível com seu imóvel.',
  },
  'Em negociação': {
    label: 'Em negociação',
    badgeClass:
      'bg-indigo-500/15 text-indigo-300 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.2)]',
    dotClass: 'bg-indigo-400',
    descricao: 'Proposta em estruturação e negociação direta conduzida pela KORBIX.',
  },
}

interface PendenciaItem {
  id: string
  titulo: string
  subtitulo: string
  descricao: string
  exemplos: string[]
  dica: string
  mensagemWhatsApp: string
  statusPadrao: 'pendente' | 'ok'
}

interface GrupoPendencia {
  id: 'fotos' | 'documentos' | 'financeiro'
  titulo: string
  icone: React.ElementType
  corIcone: string
  badgeCor: string
  itens: PendenciaItem[]
}

export function ImovelDetalhes({ lead }: ImovelCardProps) {
  // Estado local para alternar pendências abertas (accordion)
  const [itemAberto, setItemAberto] = useState<string | null>('fotos_comodos')

  // Estado opcional para o usuário marcar um item como preenchido/enviado para conferência própria
  const [concluidos, setConcluidos] = useState<Record<string, boolean>>({})

  // Arquivos reais persistidos no Supabase Storage e na tabela lead_arquivos
  const [arquivos, setArquivos] = useState<LeadArquivo[]>([])
  const [carregandoArquivos, setCarregandoArquivos] = useState(false)

  // Carregar arquivos vinculados ao lead
  useEffect(() => {
    if (lead.id) {
      setCarregandoArquivos(true)
      listarArquivosDoLead(lead.id)
        .then((data) => setArquivos(data))
        .catch(() => setArquivos([]))
        .finally(() => setCarregandoArquivos(false))
    }
  }, [lead.id])

  // Fotos e Documentos segregados
  const fotos = arquivos.filter((a) => a.tipo === 'foto')
  const docs = arquivos.filter((a) => a.tipo === 'documento')

  const docMatricula = docs.find((d) => d.rotulo === 'matricula')
  const docIptu = docs.find((d) => d.rotulo === 'iptu')
  const docCertidao = docs.find((d) => d.rotulo === 'certidao')

  // Verificação de completude de arquivos
  const temFotos = fotos.length > 0
  const temMatricula = Boolean(docMatricula)
  const temIptu = Boolean(docIptu)
  const temCertidao = Boolean(docCertidao)
  const temAlgumDoc = docs.length > 0

  // Cálculo da completude do cadastro
  // Campos etapa 1: cidade, tipo_imovel, telefone
  // Campos etapa 2: nome, email, valor_estimado, motivo_venda, prazo_desejado
  // Arquivos: Fotos do imóvel, Documentos (Matrícula, IPTU e Certidão)
  const camposEtapa1 = [
    { label: 'Cidade', preenchido: Boolean(lead.cidade && lead.cidade.trim()) },
    { label: 'Tipo de imóvel', preenchido: Boolean(lead.tipo_imovel && lead.tipo_imovel.trim()) },
    { label: 'WhatsApp', preenchido: Boolean(lead.telefone && lead.telefone.trim()) },
  ]

  const camposEtapa2 = [
    { label: 'Nome', preenchido: Boolean(lead.nome && lead.nome.trim()) },
    { label: 'E-mail', preenchido: Boolean(lead.email && lead.email.trim()) },
    {
      label: 'Valor estimado',
      preenchido: Boolean(lead.valor_estimado && lead.valor_estimado.trim()),
    },
    {
      label: 'Motivo da venda',
      preenchido: Boolean(lead.motivo_venda && lead.motivo_venda.trim()),
    },
    {
      label: 'Prazo desejado',
      preenchido: Boolean(lead.prazo_desejado && lead.prazo_desejado.trim()),
    },
  ]

  const camposArquivos = [
    {
      label: `Fotos (${fotos.length})`,
      preenchido: temFotos,
    },
    {
      label: `Matrícula`,
      preenchido: temMatricula,
    },
    {
      label: `IPTU`,
      preenchido: temIptu,
    },
    {
      label: `Certidão`,
      preenchido: temCertidao,
    },
  ]

  const todosCampos = [...camposEtapa1, ...camposEtapa2, ...camposArquivos]
  const totalCampos = todosCampos.length
  const camposPreenchidos = todosCampos.filter((c) => c.preenchido).length
  const percentualCompletude = Math.round((camposPreenchidos / totalCampos) * 100)

  // Status visual
  const statusAtual: StatusImovelLead = (lead.status as StatusImovelLead) || 'Recebido'
  const configStatus = STATUS_CONFIG[statusAtual] || STATUS_CONFIG['Recebido']

  const protocolo = lead.protocolo || 'KX-0000'

  // Função para link do WhatsApp oficial com mensagem contextualizada
  const montarLinkWhatsApp = (assunto: string, detalhes?: string) => {
    const texto = `Olá, equipe KORBIX! Sou proprietário do imóvel protocolo *${protocolo}*. Gostaria de enviar ou tirar dúvidas sobre: *${assunto}*${detalhes ? ` (${detalhes})` : ''}.`
    return `https://wa.me/${KORBIX_WHATSAPP_NUMBER}?text=${encodeURIComponent(texto)}`
  }

  // Grupos de pendências estruturados
  const grupos: GrupoPendencia[] = [
    {
      id: 'fotos',
      titulo: 'Fotos do imóvel',
      icone: Camera,
      corIcone: 'text-cyan-400',
      badgeCor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
      itens: [
        {
          id: 'fotos_comodos',
          titulo: 'Fotos dos cômodos e fachada',
          subtitulo: 'Salas, quartos, cozinha, banheiros, varanda e fachada externa',
          descricao:
            'Fotos com boa iluminação natural aumentam a atratividade do seu imóvel para os investidores em até 4x na triagem técnica.',
          exemplos: [
            'Fachada frontal do imóvel ou do edifício',
            'Sala de estar e jantar em ângulo amplo',
            'Quartos, suítes e banheiros iluminados',
            'Cozinha, lavanderia e área de serviço',
            'Garagem e áreas comuns do condomínio (se aplicável)',
          ],
          dica: 'Dica: abra janelas e cortinas para valorizar a luz do dia antes de fotografar.',
          mensagemWhatsApp: 'Fotos dos cômodos e fachada',
          statusPadrao: 'pendente',
        },
      ],
    },
    {
      id: 'documentos',
      titulo: 'Documentos',
      icone: FileText,
      corIcone: 'text-indigo-400',
      badgeCor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
      itens: [
        {
          id: 'doc_matricula',
          titulo: 'Matrícula atualizada do imóvel',
          subtitulo:
            'Certidão de matrícula de inteiro teor emitida pelo Cartório de Registro de Imóveis',
          descricao:
            'A matrícula comprova a titularidade, metragem real averbada e existência de eventuais gravames, ônus ou usufrutos.',
          exemplos: [
            'Certidão de inteiro teor (preferencialmente emitida nos últimos 30 a 90 dias)',
            'Pode ser versão digital em PDF baixada do registrador do imóvel',
          ],
          dica: 'Caso esteja em processo de inventário ou partilha, a cópia simples do formal também é aceita.',
          mensagemWhatsApp: 'Matrícula atualizada do imóvel',
          statusPadrao: 'pendente',
        },
        {
          id: 'doc_iptu',
          titulo: 'Espelho do IPTU / Carnê anual',
          subtitulo: 'Folha de rosto do carnê do ano vigente ou certidão de dados cadastrais',
          descricao:
            'Permite à KORBIX validar a inscrição municipal, área construída cadastrada e valor venal de referência.',
          exemplos: [
            'Página com número de inscrição/cadastro do imóvel',
            'Valor venal e demonstrativo de parcelas em PDF',
          ],
          dica: 'Você encontra a segunda via em PDF facilmente no portal da Prefeitura da sua cidade.',
          mensagemWhatsApp: 'Cópia ou espelho do IPTU',
          statusPadrao: 'pendente',
        },
        {
          id: 'doc_certidao',
          titulo: 'Certidão adicional (ônus / negativas)',
          subtitulo: 'Certidão de ações reipersecutórias, débitos ou formal de partilha',
          descricao:
            'Validação jurídica complementar para atestar regularidade da titularidade perante os compradores.',
          exemplos: [
            'Certidão negativa de ônus reais',
            'Certidão conjunta de tributos municipais/federais ou escritura de inventário',
          ],
          dica: 'Envie em formato PDF para análise imediata pelo corpo jurídico da KORBIX.',
          mensagemWhatsApp: 'Certidões do imóvel',
          statusPadrao: 'pendente',
        },
      ],
    },
    {
      id: 'financeiro',
      titulo: 'Informações financeiras',
      icone: DollarSign,
      corIcone: 'text-emerald-400',
      badgeCor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      itens: [
        {
          id: 'fin_expectativa',
          titulo: 'Expectativa líquida e flexibilidade',
          subtitulo: 'Valor esperado em mãos e abertura para negociação à vista com investidor',
          descricao:
            'Apresentar sua faixa ideal de recebimento permite calibrar a tese de liquidez rápida com os investidores cadastrados.',
          exemplos: [
            'Valor pretendido líquido de comissões',
            'Flexibilidade para propostas de aporte imediato à vista',
          ],
          dica: 'Investidores com capital em conta priorizam imóveis com margem de desconto versus valor de mercado.',
          mensagemWhatsApp: 'Informações de expectativa líquida e valores',
          statusPadrao: 'pendente',
        },
        {
          id: 'fin_dividas',
          titulo: 'Situação de débitos e condomínio',
          subtitulo: 'Declaração de quitação condominial e eventuais pendências de financiamento',
          descricao:
            'Se houver saldo devedor de financiamento bancário, IPTU em atraso ou taxa condominial pendente, nossa equipe pode incluir a quitação no fluxo da transação.',
          exemplos: [
            'Saldo devedor atualizado do financiamento (se houver)',
            'Certidão negativa de débitos condominiais ou valor de taxa mensal',
          ],
          dica: 'Não se preocupe se houver débitos: investidores institucionais da KORBIX compram inclusive com passivos a liquidar.',
          mensagemWhatsApp: 'Situação de dívidas e débitos do imóvel',
          statusPadrao: 'pendente',
        },
      ],
    },
  ]

  const alternarItem = (id: string) => {
    setItemAberto((atual) => (atual === id ? null : id))
  }

  const alternarConcluido = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setConcluidos((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* 3. BLOCO "PRÓXIMA AÇÃO" EM DESTAQUE NO TOPO                  */}
      {/* Card destacado com ciano, glow e prazo prometido (até 5 dias úteis) */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#081226] via-[#0d2146] to-[#081226] border-2 border-[#22C7E0]/60 p-5 sm:p-6 shadow-[0_0_35px_rgba(34,199,224,0.18)]">
        {/* Glow de fundo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#22C7E0]/15 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-48 h-48 bg-[#1A3A75]/30 rounded-full blur-[60px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#22C7E0]/20 text-[#22C7E0] border border-[#22C7E0]/40">
                <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
                <span>Próxima Ação Prioritária</span>
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-amber-300 font-medium bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                <Clock className="w-3 h-3" />
                <span>Análise técnica em até 5 dias úteis</span>
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>
                {temFotos
                  ? 'Fotos enviadas com sucesso! Envie agora os documentos'
                  : 'Enviar fotos do imóvel para início da análise'}
              </span>
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {temFotos
                ? `Você já enviou ${fotos.length} foto(s). Quanto mais documentos (Matrícula, IPTU) você enviar pelo painel, mais rápida e precisa será a precificação e a proposta com investidores.`
                : 'Nossa equipe já recebeu o cadastro do seu imóvel. Envie as fotos (fachada e cômodos principais) diretamente pelo painel para que os peritos finalizem a análise de liquidez dentro de até 5 dias úteis.'}
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2.5">
            <button
              type="button"
              onClick={() => {
                setItemAberto(temFotos ? 'doc_matricula' : 'fotos_comodos')
                const el = document.getElementById('secao-pendencias')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#22C7E0] hover:bg-[#1fb3ca] active:bg-[#1ca2b7] text-[#070B14] font-bold text-sm shadow-[0_0_20px_rgba(34,199,224,0.4)] transition-all transform hover:scale-[1.02] active:scale-[0.99] cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>{temFotos ? 'Enviar documentos pelo painel' : 'Enviar fotos pelo painel'}</span>
            </button>

            <a
              href={montarLinkWhatsApp(
                'Fotos e documentos do imóvel',
                'Alternativa de envio por WhatsApp',
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors py-1 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Enviar via WhatsApp (alternativa)</span>
            </a>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. CARTÃO DO IMÓVEL COM PROTOCOLO, STATUS E COMPLETUDE        */}
      {/* ============================================================ */}
      <div className="bg-[#081226] border border-[#1A3A75] rounded-2xl p-5 sm:p-7 shadow-xl backdrop-blur-md space-y-6">
        {/* Cabeçalho do Cartão: Identificação e Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Protocolo do Imóvel
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-[#070B14] border border-[#22C7E0]/40 font-mono text-sm font-bold text-[#22C7E0] tracking-wide">
                {protocolo}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white capitalize">
              {lead.tipo_imovel ? `${lead.tipo_imovel}` : 'Imóvel residencial'}
              {lead.cidade ? ` em ${lead.cidade}` : ''}
            </h2>
            {lead.valor_estimado && (
              <p className="text-xs sm:text-sm text-slate-400">
                Valor estimado informado:{' '}
                <strong className="text-slate-200">
                  {lead.valor_estimado.startsWith('R$')
                    ? lead.valor_estimado
                    : `R$ ${lead.valor_estimado}`}
                </strong>
              </p>
            )}
          </div>

          {/* Badge de Status com glow e pill visual */}
          <div className="flex sm:flex-col sm:items-end gap-1.5">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Status do Imóvel
            </span>
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold border ${configStatus.badgeClass}`}
            >
              <span className={`w-2 h-2 rounded-full ${configStatus.dotClass}`} />
              <span>{configStatus.label}</span>
            </div>
            <p className="hidden sm:block text-[11px] text-slate-400 max-w-xs text-right mt-1">
              {configStatus.descricao}
            </p>
          </div>
        </div>

        {/* Workflow visual simples de 4 etapas */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Etapas do fluxo KORBIX
            </span>
            <span className="text-[#22C7E0] font-medium">Status: {configStatus.label}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {(
              [
                { key: 'Recebido', rotulo: '1. Recebido' },
                { key: 'Em análise', rotulo: '2. Em análise' },
                { key: 'Com compatibilidade', rotulo: '3. Compatibilidade' },
                { key: 'Em negociação', rotulo: '4. Negociação' },
              ] as const
            ).map((etapa, idx) => {
              const etapasOrdem = ['Recebido', 'Em análise', 'Com compatibilidade', 'Em negociação']
              const statusIdx = etapasOrdem.indexOf(statusAtual)
              const etapaIdx = idx
              const isActive = etapa.key === statusAtual
              const isPast = statusIdx > etapaIdx

              return (
                <div
                  key={etapa.key}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isActive
                      ? 'bg-[#22C7E0]/15 border-[#22C7E0] text-[#22C7E0] shadow-[0_0_12px_rgba(34,199,224,0.15)] font-semibold'
                      : isPast
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-[#070B14]/60 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 text-xs">
                    {isPast ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : isActive ? (
                      <span className="w-2 h-2 rounded-full bg-[#22C7E0] animate-pulse" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-600" />
                    )}
                    <span className="truncate">{etapa.rotulo}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Barra de Completude do Cadastro */}
        <div className="space-y-3 pt-2 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs sm:text-sm">
            <span className="font-semibold text-white flex items-center gap-2">
              <span>Cadastro {percentualCompletude}% completo</span>
              {percentualCompletude === 100 ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  Dados completos
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 font-normal">
                  ({camposPreenchidos} de {totalCampos} campos principais)
                </span>
              )}
            </span>
            <span className="text-xs text-slate-400">
              {percentualCompletude < 100
                ? 'Mais dados aumentam a acurácia da avaliação técnica'
                : 'Todas as informações essenciais estão registradas'}
            </span>
          </div>

          {/* Barra de Progresso com degradê ciano e brilho */}
          <div className="w-full h-3 bg-[#070B14] rounded-full overflow-hidden border border-[#1A3A75] p-[2px]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#1A3A75] via-[#22C7E0] to-[#5eead4] transition-all duration-700 ease-out shadow-[0_0_12px_rgba(34,199,224,0.5)]"
              style={{ width: `${percentualCompletude}%` }}
            />
          </div>

          {/* Pílulas dos campos preenchidos e faltantes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1 text-xs">
            {todosCampos.map((campo) => (
              <div
                key={campo.label}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors ${
                  campo.preenchido
                    ? 'bg-slate-900/80 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/5 border-amber-500/20 text-amber-300/80'
                }`}
              >
                {campo.preenchido ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )}
                <span className="truncate">{campo.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. LISTA DE PENDÊNCIAS CLICÁVEIS                             */}
      {/* Três grupos: Fotos, Documentos e Informações financeiras     */}
      {/* ============================================================ */}
      <div id="secao-pendencias" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#22C7E0]" />
              <span>Pendências e Documentação para Análise</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Clique em cada item para ver os detalhes e envie facilmente pelo canal oficial do
              WhatsApp.
            </p>
          </div>
          <a
            href={montarLinkWhatsApp('Dúvidas e pendências do imóvel')}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              registrarEvento('clique_whatsapp', window.location.pathname || '/minha-area', {
                origem: 'detalhes_imovel',
              })
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-[#070B14] font-semibold text-xs transition-all shadow-md"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Falar com o corretor da KORBIX</span>
          </a>{' '}
        </div>

        {/* Grupos de pendências */}
        <div className="space-y-4">
          {grupos.map((grupo) => {
            const GrupoIcon = grupo.icone
            return (
              <div
                key={grupo.id}
                className="bg-[#081226] border border-[#1A3A75] rounded-2xl p-4 sm:p-5 shadow-lg space-y-3"
              >
                {/* Cabeçalho do Grupo */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#070B14] border border-[#1A3A75]">
                      <GrupoIcon className={`w-4 h-4 ${grupo.corIcone}`} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white tracking-wide">
                        {grupo.titulo}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {grupo.itens.length}{' '}
                        {grupo.itens.length === 1 ? 'item requerido' : 'itens requeridos'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${grupo.badgeCor}`}
                  >
                    Etapa de triagem
                  </span>
                </div>

                {/* Itens do Grupo */}
                <div className="space-y-2.5">
                  {grupo.itens.map((item) => {
                    const isOpen = itemAberto === item.id

                    // Determina se o item está efetivamente enviado / concluído
                    let isEfetivamenteFeito = concluidos[item.id] || false
                    let tagComplementar: string | null = null

                    if (item.id === 'fotos_comodos') {
                      if (temFotos) {
                        isEfetivamenteFeito = true
                        tagComplementar = `${fotos.length} foto${fotos.length > 1 ? 's' : ''}`
                      }
                    } else if (item.id === 'doc_matricula') {
                      if (temMatricula) {
                        isEfetivamenteFeito = true
                        tagComplementar = 'PDF enviado'
                      }
                    } else if (item.id === 'doc_iptu') {
                      if (temIptu) {
                        isEfetivamenteFeito = true
                        tagComplementar = 'PDF enviado'
                      }
                    } else if (item.id === 'doc_certidao') {
                      if (temCertidao) {
                        isEfetivamenteFeito = true
                        tagComplementar = 'PDF enviado'
                      }
                    }

                    // Determina se é área de fotos ou de documentos
                    const isItemFotos = item.id === 'fotos_comodos'
                    const rotuloDocMap: Record<string, RotuloDocumento> = {
                      doc_matricula: 'matricula',
                      doc_iptu: 'iptu',
                      doc_certidao: 'certidao',
                    }
                    const rotuloDocItem = rotuloDocMap[item.id]

                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border transition-all ${
                          isOpen
                            ? 'bg-[#070B14] border-[#22C7E0]/50 shadow-[0_0_15px_rgba(34,199,224,0.08)]'
                            : 'bg-[#070B14]/70 border-slate-800/90 hover:border-slate-700'
                        }`}
                      >
                        {/* Linha Clicável */}
                        <button
                          type="button"
                          onClick={() => alternarItem(item.id)}
                          className="w-full p-3.5 sm:p-4 text-left flex items-start sm:items-center justify-between gap-3 focus:outline-none cursor-pointer"
                        >
                          <div className="flex items-start sm:items-center gap-3 min-w-0">
                            {/* Toggle de conclusão visual pelo usuário */}
                            <button
                              type="button"
                              onClick={(e) => alternarConcluido(item.id, e)}
                              title={
                                isEfetivamenteFeito
                                  ? 'Marcar como pendente'
                                  : 'Marcar como enviado/concluído'
                              }
                              className={`mt-0.5 sm:mt-0 p-1 rounded-lg border transition-all cursor-pointer ${
                                isEfetivamenteFeito
                                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                  : 'bg-slate-900 border-slate-700 text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-sm font-semibold ${
                                    isEfetivamenteFeito ? 'text-slate-300' : 'text-white'
                                  }`}
                                >
                                  {item.titulo}
                                </span>
                                <span
                                  className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                                    isEfetivamenteFeito
                                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                                      : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                                  }`}
                                >
                                  {isEfetivamenteFeito ? 'Enviado / OK' : 'Pendente'}
                                </span>
                                {tagComplementar && (
                                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 text-[#22C7E0] border border-cyan-500/30">
                                    {tagComplementar}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 truncate mt-0.5">
                                {item.subtitulo}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 pt-0.5 sm:pt-0">
                            <span className="text-xs text-[#22C7E0] hidden sm:inline">
                              {isOpen ? 'Ocultar' : 'Ver instruções e upload'}
                            </span>
                            {isOpen ? (
                              <ChevronUp className="w-4 h-4 text-[#22C7E0]" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </button>

                        {/* Painel de Explicação e Upload Inline quando aberto */}
                        {isOpen && (
                          <div className="px-3.5 sm:px-4 pb-4 pt-1 border-t border-slate-800/80 space-y-4 text-xs text-slate-300 animate-fade-in">
                            <p className="leading-relaxed text-slate-200">{item.descricao}</p>

                            {/* O que enviar / exemplos */}
                            <div className="bg-[#081226] border border-slate-800 rounded-xl p-3 space-y-2">
                              <span className="font-semibold text-slate-200 block text-[11px] uppercase tracking-wider">
                                O que enviar:
                              </span>
                              <ul className="space-y-1.5 pl-1">
                                {item.exemplos.map((ex, i) => (
                                  <li key={i} className="flex items-start gap-2 text-slate-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C7E0] mt-1.5 shrink-0" />
                                    <span>{ex}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* MÓDULO DE UPLOAD INTEGRADO: FOTOS */}
                            {isItemFotos && lead.id && (
                              <div className="bg-[#081226] border border-[#22C7E0]/30 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                                  <div className="flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-[#22C7E0]" />
                                    <span className="font-bold text-white text-xs sm:text-sm">
                                      Upload de Fotos do Imóvel
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-cyan-300">
                                    {fotos.length > 0
                                      ? `${fotos.length} foto${fotos.length > 1 ? 's' : ''} pronta${
                                          fotos.length > 1 ? 's' : ''
                                        }`
                                      : 'Nenhuma foto enviada'}
                                  </span>
                                </div>

                                <UploadFotos
                                  leadId={lead.id}
                                  userId={lead.user_id || ''}
                                  fotos={fotos}
                                  onFotosChange={(novasFotos) => {
                                    // Atualiza lista completa mantendo os documentos
                                    const outros = arquivos.filter((a) => a.tipo !== 'foto')
                                    setArquivos([...novasFotos, ...outros])
                                  }}
                                />
                              </div>
                            )}

                            {/* MÓDULO DE UPLOAD INTEGRADO: DOCUMENTO (PDF com rótulo) */}
                            {rotuloDocItem && lead.id && (
                              <div className="bg-[#081226] border border-indigo-500/30 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-indigo-400" />
                                    <span className="font-bold text-white text-xs sm:text-sm">
                                      Upload de Documento (PDF)
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-indigo-300">
                                    Rótulo: {item.titulo.split(' ')[0]}
                                  </span>
                                </div>

                                <UploadDocumentos
                                  leadId={lead.id}
                                  userId={lead.user_id || ''}
                                  documentos={docs}
                                  filtroRotulo={rotuloDocItem}
                                  onDocumentosChange={(novosDocs) => {
                                    const fotosExistentes = arquivos.filter(
                                      (a) => a.tipo === 'foto',
                                    )
                                    setArquivos([...fotosExistentes, ...novosDocs])
                                  }}
                                />
                              </div>
                            )}

                            {/* Dica do especialista */}
                            <div className="flex items-start gap-2 text-slate-400 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                              <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                              <span className="italic">{item.dica}</span>
                            </div>

                            {/* Ações do item: Manter WhatsApp oficial como alternativa secundária */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-800/60">
                              <button
                                type="button"
                                onClick={(e) => alternarConcluido(item.id, e)}
                                className={`text-xs px-3 py-2 rounded-lg border font-medium transition-all text-center cursor-pointer ${
                                  isEfetivamenteFeito
                                    ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                                }`}
                              >
                                {isEfetivamenteFeito
                                  ? 'Desmarcar envio manual'
                                  : 'Marcar como já enviado'}
                              </button>

                              <a
                                href={montarLinkWhatsApp(item.mensagemWhatsApp, item.subtitulo)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs shadow-sm transition-all cursor-pointer"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Enviar pelo WhatsApp oficial (alternativa)</span>
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
