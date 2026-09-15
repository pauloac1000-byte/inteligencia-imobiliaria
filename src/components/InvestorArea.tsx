import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  OportunidadeInvestidor,
  CriterioDetalhe,
  manifestarInteresseInvestidor,
  formatarTempoDesdeListagem,
} from '@/services/investidor'
import { TeseInvestidorVinculada } from '@/services/profiles'
import { KORBIX_WHATSAPP_NUMBER } from '@/services/leads'
import {
  Sparkles,
  Building2,
  MapPin,
  Clock,
  DollarSign,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Send,
  Loader2,
  PlusCircle,
  SlidersHorizontal,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Target,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { FormInvestidor } from '@/components/FormInvestidor'

interface InvestorAreaProps {
  teses: TeseInvestidorVinculada[]
  oportunidades: OportunidadeInvestidor[]
  loading: boolean
  onRefresh: () => void
}

export const InvestorArea: React.FC<InvestorAreaProps> = ({
  teses,
  oportunidades,
  loading,
  onRefresh,
}) => {
  // Filtros
  const [minPercentual, setMinPercentual] = useState<number>(50)
  const [filtroCidade, setFiltroCidade] = useState<string>('todas')
  const [filtroObjetivo, setFiltroObjetivo] = useState<string>('todos')

  // Controle de cards expandidos para ver critérios
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})

  // Estado da ação de manifestar interesse
  const [manifestandoId, setManifestandoId] = useState<string | null>(null)
  const [interessesLocais, setInteressesLocais] = useState<
    Record<string, { status: string; notificadoEm: string }>
  >({})
  const [feedbackAcao, setFeedbackAcao] = useState<{
    imovelId: string
    mensagem: string
    sucesso: boolean
  } | null>(null)

  // Modal para criar nova tese de investidor caso não tenha ou queira adicionar
  const [modalNovaTeseAberta, setModalNovaTeseAberta] = useState(false)

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Lista dinâmica de cidades presentes nas oportunidades + Circuito das Águas
  const cidadesDisponiveis = React.useMemo(() => {
    const set = new Set<string>()
    oportunidades.forEach((op) => {
      if (op.cidade && op.cidade.trim()) {
        set.add(op.cidade.trim())
      }
    })
    set.add('Circuito das Águas Paulista')
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [oportunidades])

  // Lista de objetivos únicos encontrados
  const objetivosDisponiveis = [
    { value: 'todos', label: 'Todos os objetivos' },
    { value: 'renda_aluguel', label: 'Renda de aluguel' },
    { value: 'revenda', label: 'Revenda' },
    { value: 'reforma_venda', label: 'Reforma e venda' },
  ]

  // Aplica filtros e ordenação: maior compatibilidade primeiro, desempate por imóvel mais recente
  const oportunidadesFiltradas = React.useMemo(() => {
    return oportunidades
      .filter((op) => {
        // Percentual mínimo
        if (op.percentual < minPercentual) return false

        // Cidade
        if (filtroCidade !== 'todas') {
          const cidadeOp = (op.cidade || '').toLowerCase()
          const filtro = filtroCidade.toLowerCase()
          if (filtro === 'circuito das águas paulista') {
            const cidadesCircuito = [
              'amparo',
              'serra negra',
              'águas de lindóia',
              'lindoia',
              'socorro',
              'pedreira',
              'jaguariúna',
              'holambra',
              'monte sião',
            ]
            const matchCircuito = cidadesCircuito.some((c) => cidadeOp.includes(c))
            if (!matchCircuito && !cidadeOp.includes('circuito')) return false
          } else if (!cidadeOp.includes(filtro)) {
            return false
          }
        }

        // Objetivo
        if (filtroObjetivo !== 'todos') {
          const objTese = (op.tese_objetivo || '').toLowerCase()
          if (!objTese.includes(filtroObjetivo.toLowerCase())) {
            return false
          }
        }

        return true
      })
      .sort((a, b) => {
        if (b.percentual !== a.percentual) {
          return b.percentual - a.percentual
        }
        const dataA = a.criado_em_imovel ? new Date(a.criado_em_imovel).getTime() : 0
        const dataB = b.criado_em_imovel ? new Date(b.criado_em_imovel).getTime() : 0
        return dataB - dataA
      })
  }, [oportunidades, minPercentual, filtroCidade, filtroObjetivo])

  // Dispara RPC de manifestação de interesse
  const handleManifestarInteresse = async (op: OportunidadeInvestidor) => {
    setManifestandoId(op.compatibilidade_id)
    setFeedbackAcao(null)

    const res = await manifestarInteresseInvestidor(
      op.lead_investidor_id,
      op.lead_venda_id,
      `Investidor manifestou interesse no imóvel ${op.protocolo_imovel} via Área do Investidor.`,
    )

    setManifestandoId(null)

    if (res.success) {
      setInteressesLocais((prev) => ({
        ...prev,
        [op.compatibilidade_id]: {
          status: res.status || 'recebido',
          notificadoEm: res.notificado_em || new Date().toISOString(),
        },
      }))
      setFeedbackAcao({
        imovelId: op.compatibilidade_id,
        mensagem: res.ja_existia
          ? 'Seu interesse já estava registrado! O gestor da carteira foi renotificado.'
          : 'Interesse manifestado com sucesso! A equipe de gestão foi notificada.',
        sucesso: true,
      })
    } else {
      setFeedbackAcao({
        imovelId: op.compatibilidade_id,
        mensagem: res.error || 'Não foi possível registrar o interesse no momento.',
        sucesso: false,
      })
    }
  }

  // Se o investidor não tem tese cadastrada ainda
  if (!loading && teses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="p-8 sm:p-10 rounded-2xl bg-[#070B14] border border-slate-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#1A3A75]/40 border border-[#22C7E0]/40 flex items-center justify-center mx-auto text-[#22C7E0] shadow-[0_0_20px_rgba(34,199,224,0.2)]">
            <Target className="w-7 h-7" />
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Defina sua Tese de Investimento
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Para calcularmos a compatibilidade matemática e apresentarmos as oportunidades que
              atendem exatamente ao seu ticket, região e objetivo, cadastre sua primeira tese.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setModalNovaTeseAberta(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#22C7E0] hover:bg-[#1fb3ca] text-[#070B14] font-bold text-sm shadow-[0_0_20px_rgba(34,199,224,0.35)] transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Registrar minha tese agora</span>
            </button>
            <a
              href={`https://wa.me/${KORBIX_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                'Olá, equipe KORBIX! Sou investidor e gostaria de alinhar minha tese de investimento diretamente com a curadoria.',
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#081226] hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs sm:text-sm transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-[#22C7E0]" />
              <span>Falar com curador via WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Modal para cadastrar tese */}
        <Dialog open={modalNovaTeseAberta} onOpenChange={setModalNovaTeseAberta}>
          <DialogContent className="w-[calc(100%-1.5rem)] sm:max-w-[560px] max-h-[92vh] overflow-y-auto bg-[#070B14] border border-[#1A3A75]/60 text-white shadow-2xl backdrop-blur-md p-4 sm:p-8 rounded-2xl">
            <DialogHeader className="text-left space-y-1 pr-6">
              <DialogTitle className="text-lg sm:text-2xl font-bold tracking-tight text-white">
                Cadastrar Tese de Investimento
              </DialogTitle>
              <DialogDescription className="text-slate-300 text-xs sm:text-sm">
                Preencha os parâmetros da sua alocação para que o algoritmo ordene os imóveis com
                maior compatibilidade real.
              </DialogDescription>
            </DialogHeader>
            <div className="pt-2">
              <FormInvestidor
                isInModal={true}
                onCancel={() => setModalNovaTeseAberta(false)}
                onSuccess={() => {
                  setModalNovaTeseAberta(false)
                  onRefresh()
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Barra de Teses Ativas do Investidor */}
      <div className="p-4 rounded-xl bg-[#070B14] border border-[#22C7E0]/30 shadow-[0_0_16px_rgba(34,199,224,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#22C7E0] uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Tese de Investimento Ativa</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {teses.map((tese, idx) => (
              <span
                key={tese.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#081226] border border-slate-700 text-xs text-slate-200"
              >
                <strong className="text-[#22C7E0] font-mono">{tese.protocolo || 'KX-TESE'}</strong>
                {tese.objetivo && (
                  <span className="text-slate-400 capitalize">
                    • {tese.objetivo.replace('_', ' ')}
                  </span>
                )}
                {tese.cidades_interesse && (
                  <span className="text-slate-400 truncate max-w-[150px]">
                    • {tese.cidades_interesse}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setModalNovaTeseAberta(true)}
            className="inline-flex items-center gap-1.5 text-xs text-[#22C7E0] hover:text-white px-3 py-2 rounded-lg border border-[#22C7E0]/40 hover:bg-[#22C7E0]/10 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Nova tese</span>
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            title="Recarregar oportunidades"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#22C7E0]' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Painel de Filtros */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#070B14]/80 border border-slate-800 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
            <SlidersHorizontal className="w-4 h-4 text-[#22C7E0]" />
            <span>Filtros de Oportunidades</span>
          </div>
          <span className="text-xs text-slate-400">
            {oportunidadesFiltradas.length} oportunidade
            {oportunidadesFiltradas.length !== 1 ? 's' : ''} encontrada
            {oportunidadesFiltradas.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Filtro 1: Percentual Mínimo */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Compatibilidade mínima</span>
              <span className="text-[#22C7E0] font-mono font-bold">{minPercentual}%</span>
            </label>
            <div className="relative">
              <select
                value={minPercentual}
                onChange={(e) => setMinPercentual(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#081226] border border-slate-700 focus:border-[#22C7E0] text-xs text-white outline-none cursor-pointer appearance-none transition-colors"
              >
                <option value={0}>Todas as compatibilidades (0%+)</option>
                <option value={40}>A partir de 40%</option>
                <option value={50}>A partir de 50% (Recomendado)</option>
                <option value={70}>Alta compatibilidade (70%+)</option>
                <option value={90}>Super Match (90%+)</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* Filtro 2: Cidade */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Cidade / Região
            </label>
            <div className="relative">
              <select
                value={filtroCidade}
                onChange={(e) => setFiltroCidade(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#081226] border border-slate-700 focus:border-[#22C7E0] text-xs text-white outline-none cursor-pointer appearance-none transition-colors"
              >
                <option value="todas">Todas as cidades</option>
                {cidadesDisponiveis.map((cid) => (
                  <option key={cid} value={cid}>
                    {cid}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* Filtro 3: Objetivo */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Objetivo da Tese
            </label>
            <div className="relative">
              <select
                value={filtroObjetivo}
                onChange={(e) => setFiltroObjetivo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#081226] border border-slate-700 focus:border-[#22C7E0] text-xs text-white outline-none cursor-pointer appearance-none transition-colors"
              >
                {objetivosDisponiveis.map((obj) => (
                  <option key={obj.value} value={obj.value}>
                    {obj.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Imóveis Ordenados */}
      {loading ? (
        <div className="p-12 text-center rounded-2xl bg-[#070B14] border border-slate-800 space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#22C7E0] mx-auto" />
          <p className="text-sm text-slate-400">
            Consultando compatibilidades e auditando regras de mercado...
          </p>
        </div>
      ) : oportunidadesFiltradas.length > 0 ? (
        <div className="space-y-4">
          {oportunidadesFiltradas.map((op) => {
            const isExpanded = !!expandedCards[op.compatibilidade_id]
            const isManifesting = manifestandoId === op.compatibilidade_id
            const interesseAtual =
              interessesLocais[op.compatibilidade_id] ||
              (op.ja_manifestou_interesse
                ? {
                    status: op.interesse_status || 'recebido',
                    notificadoEm: '',
                  }
                : null)
            const jaManifestou = Boolean(interesseAtual)

            // Critérios atendidos e não atendidos seguros
            const atendidos: CriterioDetalhe[] =
              op.criterios_atendidos && op.criterios_atendidos.length > 0
                ? op.criterios_atendidos
                : op.criterios.filter((c) => c.atendido)
            const naoAtendidos: CriterioDetalhe[] =
              op.criterios_nao_atendidos && op.criterios_nao_atendidos.length > 0
                ? op.criterios_nao_atendidos
                : op.criterios.filter((c) => !c.atendido)

            const tempoDesdeListagem = formatarTempoDesdeListagem(op.criado_em_imovel)

            return (
              <div
                key={op.compatibilidade_id}
                className="group relative rounded-2xl bg-[#070B14] border border-[#1A3A75]/60 hover:border-[#22C7E0]/60 transition-all duration-200 overflow-hidden shadow-lg hover:shadow-xl"
              >
                {/* Linha de Destaque Superior Ciano */}
                <div
                  className="h-1 w-full bg-gradient-to-r from-transparent via-[#22C7E0] to-transparent opacity-80"
                  style={{
                    opacity: Math.max(0.3, op.percentual / 100),
                  }}
                />

                <div className="p-5 sm:p-6 space-y-5">
                  {/* Cabeçalho do Card: Protocolo, Badge de Compatibilidade e Tempo */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm sm:text-base font-bold text-white tracking-wide bg-[#081226] px-3 py-1 rounded-lg border border-slate-700">
                        {op.protocolo_imovel}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400 capitalize">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        {op.tipo_imovel}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {tempoDesdeListagem}
                      </span>
                    </div>

                    {/* Destaque do Percentual com Glow Ciano */}
                    <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-[#1A3A75]/50 border border-[#22C7E0] shadow-[0_0_18px_rgba(34,199,224,0.35)]">
                      <Sparkles className="w-4 h-4 text-[#22C7E0] animate-pulse" />
                      <span className="text-sm sm:text-base font-bold text-[#22C7E0] font-mono tracking-tight">
                        {op.percentual}% Compatível
                      </span>
                    </div>
                  </div>

                  {/* Informações Principais Públicas e Protegidas (Sem endereço exato nem telefone do proprietário) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#081226]/80 border border-slate-800">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#22C7E0]" />
                        Cidade / Microrregião
                      </span>
                      <p className="text-xs sm:text-sm font-medium text-white">{op.cidade}</p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-emerald-400" />
                        Faixa de Valor (Aproximada)
                      </span>
                      <p className="text-xs sm:text-sm font-medium text-emerald-300">
                        {op.faixa_valor}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-purple-400" />
                        Privacidade do Proprietário
                      </span>
                      <p className="text-xs text-slate-300 leading-tight">
                        Dados diretos liberados após manifestação mútua
                      </p>
                    </div>
                  </div>

                  {/* Critérios Resumo */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">
                        Critérios atendidos: {atendidos.length} de{' '}
                        {atendidos.length + naoAtendidos.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleExpand(op.compatibilidade_id)}
                        className="inline-flex items-center gap-1 text-[#22C7E0] hover:underline font-semibold cursor-pointer"
                      >
                        <span>{isExpanded ? 'Ocultar detalhes' : 'Ver critérios e auditoria'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Chips rápidos de critérios atendidos */}
                    <div className="flex flex-wrap gap-1.5">
                      {atendidos.map((crit, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/25"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{crit.nome}</span>
                        </span>
                      ))}
                      {naoAtendidos.map((crit, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700"
                        >
                          <XCircle className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{crit.nome}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Painel Expansível de Critérios e Explicações Detalhadas */}
                  {isExpanded && (
                    <div className="p-4 rounded-xl bg-[#081226] border border-slate-800 space-y-3 animate-fade-in text-xs">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Detalhamento do Motor de Compatibilidade KORBIX
                      </div>

                      <div className="space-y-2">
                        {op.criterios && op.criterios.length > 0 ? (
                          op.criterios.map((c, i) => (
                            <div
                              key={i}
                              className={`p-2.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                                c.atendido
                                  ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-200'
                                  : 'bg-slate-900/60 border-slate-800 text-slate-400'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {c.atendido ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                                )}
                                <div>
                                  <div className="font-semibold text-white">
                                    {c.nome}{' '}
                                    <span className="font-normal text-slate-400">
                                      ({c.pontos || (c.atendido ? c.peso : 0)} de {c.peso} pts)
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-300 mt-0.5">
                                    {c.explicacao}
                                  </p>
                                </div>
                              </div>
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded self-start sm:self-center ${
                                  c.atendido
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {c.atendido ? 'ATENDIDO' : 'NÃO ATENDIDO'}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-slate-400 text-xs">
                            Critérios auditados sem apontamentos divergentes.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Feedback da Ação */}
                  {feedbackAcao && feedbackAcao.imovelId === op.compatibilidade_id && (
                    <div
                      className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                        feedbackAcao.sucesso
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                          : 'bg-red-500/10 border-red-500/30 text-red-200'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-[#22C7E0]" />
                      <span>{feedbackAcao.mensagem}</span>
                    </div>
                  )}

                  {/* Rodapé do Card com CTA "Manifestar Interesse" */}
                  <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-400">
                      Tese vinculada:{' '}
                      <strong className="text-slate-200 font-mono">{op.tese_protocolo}</strong>
                    </span>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {jaManifestou ? (
                        <div className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Interesse Registrado (Gestor Notificado)</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleManifestarInteresse(op)}
                          disabled={isManifesting}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#22C7E0] hover:bg-[#1fb3ca] active:scale-[0.99] text-[#070B14] font-bold text-xs sm:text-sm shadow-[0_0_16px_rgba(34,199,224,0.3)] transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isManifesting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Registrando interesse...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>Manifestar interesse</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* WhatsApp Direto do Gestor KORBIX */}
                      <a
                        href={`https://wa.me/${KORBIX_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                          `Olá! Sou investidor e tenho interesse na oportunidade ${op.protocolo_imovel} (${op.tipo_imovel} em ${op.cidade}) com compatibilidade ${op.percentual}%.`,
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center p-2.5 rounded-xl bg-[#081226] hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs transition-colors"
                        title="Tirar dúvidas com o gestor da carteira"
                      >
                        <ExternalLink className="w-4 h-4 text-[#22C7E0]" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Estado vazio com filtros aplicados */
        <div className="p-8 sm:p-10 rounded-2xl bg-[#070B14] border border-slate-800 text-center space-y-3">
          <p className="text-base font-semibold text-white">
            Nenhuma oportunidade encontrada com os filtros selecionados
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Tente reduzir a compatibilidade mínima para 40% ou selecionar "Todas as cidades" para
            expandir o universo de imóveis monitorados.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setMinPercentual(40)
                setFiltroCidade('todas')
                setFiltroObjetivo('todos')
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#081226] border border-slate-700 text-xs text-slate-200 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#22C7E0]" />
              <span>Limpar filtros</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal para Adicionar Nova Tese */}
      <Dialog open={modalNovaTeseAberta} onOpenChange={setModalNovaTeseAberta}>
        <DialogContent className="w-[calc(100%-1.5rem)] sm:max-w-[560px] max-h-[92vh] overflow-y-auto bg-[#070B14] border border-[#1A3A75]/60 text-white shadow-2xl backdrop-blur-md p-4 sm:p-8 rounded-2xl">
          <DialogHeader className="text-left space-y-1 pr-6">
            <DialogTitle className="text-lg sm:text-2xl font-bold tracking-tight text-white">
              Cadastrar Nova Tese de Investimento
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-xs sm:text-sm">
              Adicione mais um perfil de alocação à sua conta para receber imóveis de diferentes
              tickets ou microrregiões.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-2">
            <FormInvestidor
              isInModal={true}
              onCancel={() => setModalNovaTeseAberta(false)}
              onSuccess={() => {
                setModalNovaTeseAberta(false)
                onRefresh()
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
