import React, { useState, useEffect } from 'react'
import {
  GestorMatchItem,
  StatusMatch,
  MotivoPerdaMatch,
  MOTIVOS_PERDA_CONFIG,
  GestorResumoCicloMatches,
  gestorObterResumoCicloMatches,
  gestorMudarEstadoMatch,
  CriterioCompatibilidadeItem,
} from '@/services/gestor'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  TrendingUp,
  Home,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Phone,
  User,
  AlertTriangle,
  Loader2,
  Briefcase,
  Eye,
  Calendar,
  DollarSign,
  FileCheck,
  PhoneCall,
  Compass,
  Handshake,
  Award,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

interface GestorMatchesTabProps {
  matches: GestorMatchItem[]
  loading: boolean
  onDecidirMatch: (
    compatibilidadeId: string,
    acao: 'aprovar' | 'descartar' | 'pendente',
  ) => Promise<void>
  onRecarregar: () => void
}

const ESTADOS_CICLO: {
  id: StatusMatch
  label: string
  cor: string
  icone: React.ComponentType<{ className?: string }>
}[] = [
  {
    id: 'sugerido',
    label: 'Sugerido',
    cor: 'text-slate-400 bg-slate-800/80 border-slate-700',
    icone: Clock,
  },
  {
    id: 'aprovado',
    label: 'Aprovado',
    cor: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/40',
    icone: CheckCircle2,
  },
  {
    id: 'apresentado',
    label: 'Apresentado',
    cor: 'text-blue-400 bg-blue-950/40 border-blue-500/40',
    icone: Eye,
  },
  {
    id: 'interesse',
    label: 'Interesse',
    cor: 'text-purple-400 bg-purple-950/40 border-purple-500/40',
    icone: Sparkles,
  },
  {
    id: 'ligacao',
    label: 'Ligação',
    cor: 'text-indigo-400 bg-indigo-950/40 border-indigo-500/40',
    icone: PhoneCall,
  },
  {
    id: 'visita',
    label: 'Visita',
    cor: 'text-amber-400 bg-amber-950/40 border-amber-500/40',
    icone: Compass,
  },
  {
    id: 'proposta',
    label: 'Proposta',
    cor: 'text-orange-400 bg-orange-950/40 border-orange-500/40',
    icone: Handshake,
  },
  {
    id: 'fechado',
    label: 'Fechado',
    cor: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/40',
    icone: Award,
  },
  {
    id: 'perdido',
    label: 'Perdido',
    cor: 'text-rose-400 bg-rose-950/40 border-rose-500/40',
    icone: XCircle,
  },
]

export function GestorMatchesTab({ matches, loading, onRecarregar }: GestorMatchesTabProps) {
  const { toast } = useToast()

  // Resumo de contadores por estado e motivo de perda
  const [resumo, setResumo] = useState<GestorResumoCicloMatches | null>(null)
  const [loadingResumo, setLoadingResumo] = useState(false)

  // Filtros de listagem
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [filtroMotivoPerda, setFiltroMotivoPerda] = useState<string>('todos')
  const [ordenacao, setOrdenacao] = useState<'percentual_desc' | 'percentual_asc' | 'recentes'>(
    'percentual_desc',
  )
  const [detalhesAbertos, setDetalhesAbertos] = useState<Record<string, boolean>>({})
  const [processandoId, setProcessandoId] = useState<string | null>(null)

  // Modais de Transição Fechado e Perdido
  const [modalFechadoMatch, setModalFechadoMatch] = useState<GestorMatchItem | null>(null)
  const [fechadoPreco, setFechadoPreco] = useState<string>('')
  const [fechadoData, setFechadoData] = useState<string>(new Date().toISOString().split('T')[0])
  const [fechadoObs, setFechadoObs] = useState<string>('')

  const [modalPerdidoMatch, setModalPerdidoMatch] = useState<GestorMatchItem | null>(null)
  const [perdidoMotivo, setPerdidoMotivo] = useState<MotivoPerdaMatch>('preco')
  const [perdidoObs, setPerdidoObs] = useState<string>('')

  const carregarResumo = async () => {
    setLoadingResumo(true)
    try {
      const data = await gestorObterResumoCicloMatches()
      setResumo(data)
    } finally {
      setLoadingResumo(false)
    }
  }

  useEffect(() => {
    carregarResumo()
  }, [matches])

  const toggleDetalhes = (id: string) => {
    setDetalhesAbertos((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Executa mudança de estado com feedback e reload
  const executarMudancaEstado = async ({
    matchId,
    novoEstado,
    fechadoPrecoNum,
    fechadoDataStr,
    motivoPerdaStr,
    observacaoStr,
  }: {
    matchId: string
    novoEstado: StatusMatch
    fechadoPrecoNum?: number | null
    fechadoDataStr?: string | null
    motivoPerdaStr?: MotivoPerdaMatch | string | null
    observacaoStr?: string | null
  }) => {
    setProcessandoId(matchId)
    try {
      await gestorMudarEstadoMatch({
        compatibilidadeId: matchId,
        novoEstado,
        fechadoPreco: fechadoPrecoNum,
        fechadoData: fechadoDataStr,
        motivoPerda: motivoPerdaStr,
        observacao: observacaoStr,
      })

      const estadoItem = ESTADOS_CICLO.find((e) => e.id === novoEstado)
      toast({
        title: `Match movido para "${estadoItem?.label || novoEstado}"`,
        description: 'Estado e auditoria atualizados com sucesso.',
      })

      await Promise.all([carregarResumo(), onRecarregar()])
    } catch (err: any) {
      toast({
        title: 'Erro ao alterar estado',
        description: err.message || 'Falha na comunicação com o servidor.',
        variant: 'destructive',
      })
    } finally {
      setProcessandoId(null)
    }
  }

  const handleSubmeterFechado = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalFechadoMatch) return

    const precoNum = Number(fechadoPreco.replace(/[^0-9.,]/g, '').replace(',', '.'))
    if (!precoNum || precoNum <= 0) {
      toast({
        title: 'Preço final obrigatório',
        description: 'Informe um valor numérico válido para o preço final de venda.',
        variant: 'destructive',
      })
      return
    }

    if (!fechadoData) {
      toast({
        title: 'Data do contrato obrigatória',
        description: 'Selecione a data formal de assinatura do contrato.',
        variant: 'destructive',
      })
      return
    }

    const matchId = modalFechadoMatch.compatibilidade_id
    setModalFechadoMatch(null)

    await executarMudancaEstado({
      matchId,
      novoEstado: 'fechado',
      fechadoPrecoNum: precoNum,
      fechadoDataStr: fechadoData,
      observacaoStr: fechadoObs || 'Negócio fechado e contrato assinado',
    })
  }

  const handleSubmeterPerdido = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalPerdidoMatch) return

    if (!perdidoMotivo) {
      toast({
        title: 'Motivo obrigatório',
        description: 'Selecione o motivo da perda na lista fechada.',
        variant: 'destructive',
      })
      return
    }

    const matchId = modalPerdidoMatch.compatibilidade_id
    setModalPerdidoMatch(null)

    await executarMudancaEstado({
      matchId,
      novoEstado: 'perdido',
      motivoPerdaStr: perdidoMotivo,
      observacaoStr: perdidoObs || 'Oportunidade perdida no funil',
    })
  }

  // Filtragem da lista
  const matchesFiltrados = matches.filter((m) => {
    const isEliminado = Boolean(m.eliminado)
    if (filtroStatus === 'eliminados') {
      return isEliminado
    }
    // Na listagem padrão do ciclo, eliminados não entram
    if (isEliminado) {
      return false
    }
    if (filtroStatus !== 'todos' && m.status_match !== filtroStatus) {
      return false
    }
    if (
      filtroStatus === 'perdido' &&
      filtroMotivoPerda !== 'todos' &&
      m.motivo_perda !== filtroMotivoPerda
    ) {
      return false
    }
    return true
  })

  // Ordenação
  const matchesOrdenados = [...matchesFiltrados].sort((a, b) => {
    if (ordenacao === 'percentual_desc') {
      return b.percentual - a.percentual
    }
    if (ordenacao === 'percentual_asc') {
      return a.percentual - b.percentual
    }
    if (ordenacao === 'recentes') {
      const dataA = a.status_data_mudanca || a.atualizado_em
      const dataB = b.status_data_mudanca || b.atualizado_em
      return new Date(dataB).getTime() - new Date(dataA).getTime()
    }
    return 0
  })

  const formatarDataIso = (dataIso?: string | null) => {
    if (!dataIso) return 'Sem registro'
    try {
      const d = new Date(dataIso)
      if (isNaN(d.getTime())) return dataIso
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dataIso
    }
  }

  const formatarMoeda = (val?: number | null) => {
    if (val === null || val === undefined) return '—'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val)
  }

  return (
    <div className="space-y-6">
      {/* 1. RESUMO NO TOPO: Ciclo de Vida dos Matches e Motivos de Perda */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#081226] border border-[#1A3A75] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#22C7E0]" />
              <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                Resumo do Ciclo de Vida dos Matches
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Calibração do motor com dados reais do pipeline (imóvel × busca). Todo par nasce
              sugerido e é auditável.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-[#070B14] border border-slate-800 text-slate-300">
              Total ativos:{' '}
              <strong className="text-white font-mono">
                {resumo?.total_ativos ?? matches.filter((m) => !m.eliminado).length}
              </strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#070B14] border border-rose-950 text-rose-300">
              Eliminados no pré-filtro:{' '}
              <strong className="text-rose-400 font-mono">
                {resumo?.total_eliminados ?? matches.filter((m) => Boolean(m.eliminado)).length}
              </strong>
            </span>
          </div>
        </div>

        {/* Linha de Cards de Contadores por Estado */}
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
          {ESTADOS_CICLO.map((est) => {
            const Icon = est.icone
            const qtd = resumo?.estados?.[est.id as keyof typeof resumo.estados] ?? 0
            const isAtivo = filtroStatus === est.id

            return (
              <button
                key={est.id}
                type="button"
                onClick={() => setFiltroStatus(filtroStatus === est.id ? 'todos' : est.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isAtivo
                    ? 'border-[#22C7E0] bg-[#22C7E0]/10 shadow-[0_0_15px_rgba(34,199,224,0.2)]'
                    : 'bg-[#070B14] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${est.cor.split(' ')[0]}`}
                  >
                    {est.label}
                  </span>
                  <Icon className={`w-3.5 h-3.5 ${est.cor.split(' ')[0]}`} />
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg sm:text-xl font-bold font-mono text-white">{qtd}</span>
                  <span className="text-[10px] text-slate-500">pares</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Linha de Contadores por Motivo de Perda */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Detalhamento dos Motivos de Perda (Calibração do Motor)</span>
            </span>
            <span className="text-[11px] text-slate-400">
              Total perdidos:{' '}
              <strong className="text-rose-400 font-mono">{resumo?.estados?.perdido ?? 0}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {(Object.keys(MOTIVOS_PERDA_CONFIG) as MotivoPerdaMatch[]).map((motivoKey) => {
              const cfg = MOTIVOS_PERDA_CONFIG[motivoKey]
              const qtd = resumo?.motivos_perda?.[motivoKey] ?? 0
              const isAtivo = filtroStatus === 'perdido' && filtroMotivoPerda === motivoKey

              return (
                <button
                  key={motivoKey}
                  type="button"
                  onClick={() => {
                    setFiltroStatus('perdido')
                    setFiltroMotivoPerda(filtroMotivoPerda === motivoKey ? 'todos' : motivoKey)
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isAtivo
                      ? 'border-rose-500 bg-rose-500/15 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                      : 'bg-[#070B14] border-slate-800/90 hover:border-slate-700'
                  }`}
                  title={cfg.descricao}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-bold font-mono text-white">{qtd}</span>
                    <span className="text-[10px] text-rose-400">perdido</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-300 block truncate mt-0.5">
                    {cfg.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 2. BARRA DE FILTROS E ORDENAÇÃO */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl bg-[#081226] border border-[#1A3A75]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mr-1">
            Filtro:
          </span>
          <button
            type="button"
            onClick={() => {
              setFiltroStatus('todos')
              setFiltroMotivoPerda('todos')
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              filtroStatus === 'todos'
                ? 'bg-[#22C7E0]/15 text-[#22C7E0] border-[#22C7E0]/50 shadow-[0_0_12px_rgba(34,199,224,0.2)]'
                : 'bg-[#070B14] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <span>Todos Ativos</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
              {matches.filter((m) => !m.eliminado).length}
            </span>
          </button>

          {/* Botão de Eliminados (Regra KORBIX mantida) */}
          <button
            type="button"
            onClick={() => {
              setFiltroStatus('eliminados')
              setFiltroMotivoPerda('todos')
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              filtroStatus === 'eliminados'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                : 'bg-[#070B14] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Eliminados</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
              {matches.filter((m) => Boolean(m.eliminado)).length}
            </span>
          </button>
        </div>

        {/* Ordenação */}
        <div className="flex items-center gap-2 self-end md:self-auto text-xs">
          <span className="text-slate-400">Ordenar por:</span>
          <select
            value={ordenacao}
            onChange={(e) => setOrdenacao(e.target.value as any)}
            className="bg-[#070B14] border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:border-[#22C7E0] focus:outline-none"
          >
            <option value="percentual_desc">Maior compatibilidade harmônica (%)</option>
            <option value="percentual_asc">Menor compatibilidade harmônica (%)</option>
            <option value="recentes">Data da última mudança de estado</option>
          </select>
        </div>
      </div>

      {/* 3. LISTA DE MATCHES COM CONTROLE DE CICLO DE VIDA */}
      {loading ? (
        <div className="p-12 rounded-2xl bg-[#081226] border border-slate-800 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#22C7E0]" />
          <p className="text-sm text-slate-400">
            Carregando ciclo de vida e histórico dos matches...
          </p>
        </div>
      ) : matchesOrdenados.length === 0 ? (
        <div className="p-10 rounded-2xl bg-[#081226] border border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
            <Sparkles className="w-6 h-6 text-[#22C7E0]" />
          </div>
          <h4 className="text-base font-bold text-white">
            Nenhum match encontrado para os filtros selecionados
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {filtroStatus === 'eliminados'
              ? 'Nenhum par foi eliminado pelas 6 regras eliminatórias pré-motor.'
              : 'Selecione outro estado ou "Todos" para visualizar os pares calculados.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matchesOrdenados.map((match) => {
            const isDetalhesAberto = Boolean(detalhesAbertos[match.compatibilidade_id])
            const isProcessando = processandoId === match.compatibilidade_id
            const estadoCfg =
              ESTADOS_CICLO.find((e) => e.id === match.status_match) || ESTADOS_CICLO[0]
            const IconeEstado = estadoCfg.icone

            // Parsing seguro de critérios
            const atendidos: CriterioCompatibilidadeItem[] = Array.isArray(
              match.criterios_atendidos,
            )
              ? match.criterios_atendidos
              : []
            const naoAtendidos: CriterioCompatibilidadeItem[] = Array.isArray(
              match.criterios_nao_atendidos,
            )
              ? match.criterios_nao_atendidos
              : []

            return (
              <div
                key={match.compatibilidade_id}
                className={`rounded-2xl border transition-all ${
                  match.status_match === 'fechado'
                    ? 'bg-[#081226]/90 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                    : match.status_match === 'perdido'
                      ? 'bg-[#081226]/50 border-rose-950/80 opacity-75'
                      : match.status_match === 'aprovado'
                        ? 'bg-[#081226] border-cyan-500/40 shadow-[0_0_15px_rgba(34,199,224,0.1)]'
                        : 'bg-[#081226] border-[#1A3A75] hover:border-[#22C7E0]/40'
                }`}
              >
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Topo do Card: Nota Harmônica, Estado do Ciclo e Ações do Gestor */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      {/* Badge Nota Final Harmônica */}
                      <div className="px-3.5 py-2 rounded-xl border font-mono font-bold text-xl sm:text-2xl flex items-center gap-2 bg-[#070B14] border-[#22C7E0]/40 text-[#22C7E0] shadow-[0_0_15px_rgba(34,199,224,0.15)]">
                        <span>{match.nota_final ?? match.percentual}</span>
                        <span className="text-xs font-sans font-normal opacity-80">pts</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            Par Imóvel × Busca
                          </span>

                          {/* Badge de Estado Atual */}
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${estadoCfg.cor}`}
                          >
                            <IconeEstado className="w-3.5 h-3.5" />
                            <span>{estadoCfg.label}</span>
                          </span>

                          {match.ja_tem_interesse && (
                            <span className="text-[10px] bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              <span>Interesse manifestado</span>
                            </span>
                          )}
                        </div>

                        {/* Data da última mudança de estado */}
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>
                            Última atualização de estado:{' '}
                            <strong className="text-slate-300">
                              {formatarDataIso(match.status_data_mudanca || match.atualizado_em)}
                            </strong>
                          </span>
                        </div>

                        {/* Dados adicionais para fechado ou perdido */}
                        {match.status_match === 'fechado' && (
                          <div className="flex items-center gap-3 text-xs text-emerald-300 pt-0.5">
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>
                                Preço final:{' '}
                                <strong>{formatarMoeda(match.fechado_preco_final)}</strong>
                              </span>
                            </span>
                            {match.fechado_data_contrato && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>
                                  Contrato:{' '}
                                  <strong>
                                    {new Date(match.fechado_data_contrato).toLocaleDateString(
                                      'pt-BR',
                                    )}
                                  </strong>
                                </span>
                              </span>
                            )}
                          </div>
                        )}

                        {match.status_match === 'perdido' && match.motivo_perda && (
                          <div className="flex items-center gap-1.5 text-xs text-rose-300 pt-0.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                            <span>
                              Motivo da perda:{' '}
                              <strong className="capitalize">
                                {MOTIVOS_PERDA_CONFIG[match.motivo_perda as MotivoPerdaMatch]
                                  ?.label || match.motivo_perda}
                              </strong>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* BARRA DE TRANSIÇÃO DO GESTOR: Controle total do ciclo */}
                    <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                      {match.eliminado ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>Eliminado no pré-filtro</span>
                        </div>
                      ) : isProcessando ? (
                        <div className="flex items-center gap-2 text-xs text-[#22C7E0] px-3 py-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Atualizando estado...</span>
                        </div>
                      ) : (
                        <>
                          {/* Botão Aprovar (sugerido -> aprovado) */}
                          <button
                            type="button"
                            onClick={() =>
                              executarMudancaEstado({
                                matchId: match.compatibilidade_id,
                                novoEstado: 'aprovado',
                              })
                            }
                            disabled={match.status_match === 'aprovado'}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                              match.status_match === 'aprovado'
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 cursor-default'
                                : 'bg-cyan-950/40 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500 hover:text-[#070B14]'
                            }`}
                            title="Aprovar match para vitrine do investidor (nota >= 75)"
                          >
                            <Check className="w-3 h-3" />
                            <span>Aprovar</span>
                          </button>

                          {/* Botão Apresentar */}
                          <button
                            type="button"
                            onClick={() =>
                              executarMudancaEstado({
                                matchId: match.compatibilidade_id,
                                novoEstado: 'apresentado',
                              })
                            }
                            disabled={match.status_match === 'apresentado'}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                              match.status_match === 'apresentado'
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 cursor-default'
                                : 'bg-[#070B14] text-slate-300 border-slate-700 hover:border-blue-400 hover:text-blue-300'
                            }`}
                            title="Registrar envio formal da oportunidade ao investidor"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Apresentar</span>
                          </button>

                          {/* Botão Ligação */}
                          <button
                            type="button"
                            onClick={() =>
                              executarMudancaEstado({
                                matchId: match.compatibilidade_id,
                                novoEstado: 'ligacao',
                              })
                            }
                            disabled={match.status_match === 'ligacao'}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                              match.status_match === 'ligacao'
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 cursor-default'
                                : 'bg-[#070B14] text-slate-300 border-slate-700 hover:border-indigo-400 hover:text-indigo-300'
                            }`}
                            title="Registrar ligação de qualificação ou alinhamento"
                          >
                            <PhoneCall className="w-3 h-3" />
                            <span>Ligação</span>
                          </button>

                          {/* Botão Visita */}
                          <button
                            type="button"
                            onClick={() =>
                              executarMudancaEstado({
                                matchId: match.compatibilidade_id,
                                novoEstado: 'visita',
                              })
                            }
                            disabled={match.status_match === 'visita'}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                              match.status_match === 'visita'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 cursor-default'
                                : 'bg-[#070B14] text-slate-300 border-slate-700 hover:border-amber-400 hover:text-amber-300'
                            }`}
                            title="Agendar ou registrar visita ao imóvel"
                          >
                            <Compass className="w-3 h-3" />
                            <span>Visita</span>
                          </button>

                          {/* Botão Proposta */}
                          <button
                            type="button"
                            onClick={() =>
                              executarMudancaEstado({
                                matchId: match.compatibilidade_id,
                                novoEstado: 'proposta',
                              })
                            }
                            disabled={match.status_match === 'proposta'}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                              match.status_match === 'proposta'
                                ? 'bg-orange-500/20 text-orange-300 border-orange-500/50 cursor-default'
                                : 'bg-[#070B14] text-slate-300 border-slate-700 hover:border-orange-400 hover:text-orange-300'
                            }`}
                            title="Registrar proposta formal em negociação"
                          >
                            <Handshake className="w-3 h-3" />
                            <span>Proposta</span>
                          </button>

                          {/* Botão FECHADO (Abre Modal com Preço Final e Data Contrato) */}
                          <button
                            type="button"
                            onClick={() => {
                              setModalFechadoMatch(match)
                              setFechadoPreco(
                                match.fechado_preco_final ? String(match.fechado_preco_final) : '',
                              )
                              setFechadoData(
                                match.fechado_data_contrato ||
                                  new Date().toISOString().split('T')[0],
                              )
                              setFechadoObs('')
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500 hover:text-[#070B14] text-emerald-300 border border-emerald-500/40 transition-all cursor-pointer flex items-center gap-1"
                            title="Marcar como negócio fechado (exige preço e data)"
                          >
                            <Award className="w-3 h-3" />
                            <span>Fechado</span>
                          </button>

                          {/* Botão PERDIDO (Abre Modal com 7 motivos fechados) */}
                          <button
                            type="button"
                            onClick={() => {
                              setModalPerdidoMatch(match)
                              setPerdidoMotivo((match.motivo_perda as MotivoPerdaMatch) || 'preco')
                              setPerdidoObs('')
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1"
                            title="Marcar como perdido e registrar motivo"
                          >
                            <X className="w-3 h-3" />
                            <span>Perdido</span>
                          </button>

                          {/* Voltar para Sugerido se necessário */}
                          {match.status_match !== 'sugerido' && (
                            <button
                              type="button"
                              onClick={() =>
                                executarMudancaEstado({
                                  matchId: match.compatibilidade_id,
                                  novoEstado: 'sugerido',
                                })
                              }
                              title="Resetar para sugerido"
                              className="p-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 transition-colors"
                            >
                              <Clock className="w-3 h-3" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Comparativo: Imóvel vs Tese do Investidor */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Imóvel */}
                    <div className="p-4 rounded-xl bg-[#070B14] border border-slate-800/90 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-[#22C7E0]/15 text-[#22C7E0]">
                            <Home className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">
                              Imóvel ofertado
                            </span>
                            <h5 className="text-sm font-bold text-white capitalize">
                              {match.imovel_tipo || 'Imóvel'} — {match.imovel_cidade || 'Região'}
                            </h5>
                          </div>
                        </div>
                        <span className="font-mono text-xs font-bold text-[#22C7E0] bg-[#070B14] border border-[#22C7E0]/30 px-2 py-0.5 rounded">
                          {match.imovel_protocolo}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 text-slate-300">
                        <div>
                          <span className="text-[11px] text-slate-500 block">Valor estimado:</span>
                          <span className="font-semibold text-white">
                            {match.imovel_valor
                              ? match.imovel_valor.startsWith('R$')
                                ? match.imovel_valor
                                : `R$ ${match.imovel_valor}`
                              : 'Não informado'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 block">Prazo desejado:</span>
                          <span className="font-medium text-slate-200">
                            {match.imovel_prazo_desejado || 'Não especificado'}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-[11px] text-slate-500 block">
                            Status do imóvel:
                          </span>
                          <span className="text-slate-300 font-medium">{match.imovel_status}</span>
                        </div>
                      </div>

                      {/* Contato Proprietário */}
                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-slate-500" />
                          <strong className="text-slate-300 font-normal">
                            {match.proprietario_nome}
                          </strong>
                        </span>
                        {match.proprietario_telefone && (
                          <span className="flex items-center gap-1 text-[#22C7E0] font-mono">
                            <Phone className="w-3 h-3" />
                            {match.proprietario_telefone}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Investidor */}
                    <div className="p-4 rounded-xl bg-[#070B14] border border-slate-800/90 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                            <TrendingUp className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">
                              Tese do Investidor
                            </span>
                            <h5 className="text-sm font-bold text-white capitalize">
                              {match.investidor_objetivo || 'Tese cadastrada'}
                            </h5>
                          </div>
                        </div>
                        <span className="font-mono text-xs font-bold text-emerald-400 bg-[#070B14] border border-emerald-500/30 px-2 py-0.5 rounded">
                          {match.investidor_protocolo}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 text-slate-300">
                        <div>
                          <span className="text-[11px] text-slate-500 block">Ticket desejado:</span>
                          <span className="font-semibold text-white">
                            {match.investidor_ticket || 'Não informado'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 block">
                            Prazo de decisão:
                          </span>
                          <span className="font-medium text-slate-200">
                            {match.investidor_prazo || 'Não informado'}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-[11px] text-slate-500 block">
                            Cidades de interesse:
                          </span>
                          <span className="text-slate-300 truncate block">
                            {match.investidor_cidades || 'Qualquer região'}
                          </span>
                        </div>
                      </div>

                      {/* Contato Investidor */}
                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-slate-500" />
                          <strong className="text-slate-300 font-normal">
                            {match.investidor_nome}
                          </strong>
                        </span>
                        {match.investidor_telefone && (
                          <span className="flex items-center gap-1 text-emerald-400 font-mono">
                            <Phone className="w-3 h-3" />
                            {match.investidor_telefone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Auditoria / Critérios */}
                  {match.eliminado ? (
                    <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span className="font-bold text-rose-300 uppercase tracking-wider text-[11px]">
                          Motivo da Eliminação Pré-Motor (Auditoria KORBIX)
                        </span>
                      </div>
                      <p className="text-slate-200 text-xs leading-relaxed pl-6 font-medium">
                        {match.motivo_eliminacao ||
                          'Par descartado automaticamente por não cumprir os requisitos objetivos de mercado.'}
                      </p>
                    </div>
                  ) : (
                    <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                          <Check className="w-4 h-4" />
                          <span>{atendidos.length} critérios atendidos</span>
                        </span>
                        <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                          <X className="w-4 h-4" />
                          <span>{naoAtendidos.length} não atendidos</span>
                        </span>
                        <span className="text-slate-400">
                          Comprador:{' '}
                          <strong className="text-white font-mono">
                            {match.nota_comprador ?? match.percentual} pts
                          </strong>{' '}
                          • Vendedor:{' '}
                          <strong className="text-emerald-400 font-mono">
                            {match.nota_vendedor ?? 0} pts
                          </strong>
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleDetalhes(match.compatibilidade_id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#070B14] border border-[#22C7E0]/40 text-[#22C7E0] hover:text-white hover:bg-[#22C7E0]/10 font-semibold transition-colors cursor-pointer self-start sm:self-auto text-xs"
                      >
                        <span>
                          {isDetalhesAberto
                            ? 'Ocultar critérios detalhados'
                            : 'Ver critérios detalhados'}
                        </span>
                        {isDetalhesAberto ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Painel Expansível de Critérios */}
                  {isDetalhesAberto && !match.eliminado && (
                    <div className="pt-3 border-t border-slate-800 space-y-4 animate-fade-in">
                      <div className="space-y-2">
                        <h6 className="text-xs font-bold text-[#22C7E0] uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>
                            Critérios do Comprador (Nota: {match.nota_comprador ?? match.percentual}{' '}
                            pts)
                          </span>
                        </h6>
                        <div className="grid grid-cols-1 gap-2">
                          {(Array.isArray(match.criterios) && match.criterios.length > 0
                            ? match.criterios
                            : [...atendidos, ...naoAtendidos]
                          ).map((crit: any, idx: number) => {
                            const isAtendido = Boolean(crit.atendido)
                            return (
                              <div
                                key={`crit-c-${idx}`}
                                className={`p-3 rounded-xl border text-xs space-y-1 ${
                                  isAtendido
                                    ? 'bg-emerald-950/20 border-emerald-500/30'
                                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                                }`}
                              >
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <div className="flex items-center gap-2">
                                    {isAtendido ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                    ) : (
                                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                                    )}
                                    <span className="font-bold text-white">{crit.nome}</span>
                                    {typeof crit.fator === 'number' && (
                                      <span className="text-[11px] text-slate-400 font-mono">
                                        (fator {crit.fator.toFixed(2)})
                                      </span>
                                    )}
                                    {crit.peso !== undefined && (
                                      <span className="text-[11px] text-slate-500 font-normal">
                                        peso {crit.peso}
                                      </span>
                                    )}
                                  </div>
                                  <span
                                    className={`font-mono font-bold ${
                                      isAtendido ? 'text-emerald-400' : 'text-slate-400'
                                    }`}
                                  >
                                    {crit.pontos ?? (isAtendido ? crit.peso : 0)} pts
                                  </span>
                                </div>
                                <p className="text-slate-300 pl-6 text-[11px] leading-relaxed">
                                  {crit.explicacao}
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Critérios do Vendedor */}
                      <div className="pt-3 border-t border-slate-800/80 space-y-2">
                        <h6 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5" />
                          <span>
                            Critérios do Vendedor (Nota: {match.nota_vendedor ?? 0} pts — Visão
                            Gestor)
                          </span>
                        </h6>
                        <div className="grid grid-cols-1 gap-2">
                          {Array.isArray(match.detalhamento_vendedor) &&
                          match.detalhamento_vendedor.length > 0 ? (
                            match.detalhamento_vendedor.map((item: any, idx: number) => (
                              <div
                                key={`crit-v-${idx}`}
                                className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs space-y-1"
                              >
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <span className="font-bold text-white">{item.nome}</span>
                                    {typeof item.fator === 'number' && (
                                      <span className="text-[11px] text-slate-400 font-mono">
                                        (fator {item.fator.toFixed(2)})
                                      </span>
                                    )}
                                    <span className="text-[11px] text-slate-500 font-normal">
                                      peso {item.peso}
                                    </span>
                                  </div>
                                  <span className="font-mono font-bold text-emerald-400">
                                    {item.pontos ?? 0} pts
                                  </span>
                                </div>
                                <p className="text-slate-300 pl-6 text-[11px] leading-relaxed">
                                  {item.explicacao}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-slate-400 text-xs pl-2">
                              Detalhamento do vendedor ainda não calculado para este par.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 4. MODAL TRANSIÇÃO: MARCAR COMO FECHADO (Exige Preço e Data) */}
      <Dialog
        open={Boolean(modalFechadoMatch)}
        onOpenChange={(aberto) => !aberto && setModalFechadoMatch(null)}
      >
        <DialogContent className="w-[calc(100%-1.5rem)] sm:max-w-[480px] bg-[#070B14] border border-emerald-500/40 text-white shadow-2xl p-6 rounded-2xl">
          <DialogHeader className="text-left space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Award className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-white">
              Marcar Match como Fechado
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-300 leading-relaxed">
              Obrigatório registrar os dados contratuais reais para calibração do motor de mercado:
              imóvel <strong className="text-white">{modalFechadoMatch?.imovel_protocolo}</strong>{' '}
              com investidor{' '}
              <strong className="text-white">{modalFechadoMatch?.investidor_protocolo}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmeterFechado} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Preço Final da Venda (R$) *</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: 580000"
                value={fechadoPreco}
                onChange={(e) => setFechadoPreco(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#081226] border border-slate-700 focus:border-emerald-500 text-sm text-white font-mono outline-none"
              />
              <span className="text-[11px] text-slate-400">
                Valor bruto acordado no fechamento formal do negócio.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Data do Contrato / Fechamento *</span>
              </label>
              <input
                type="date"
                required
                value={fechadoData}
                onChange={(e) => setFechadoData(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#081226] border border-slate-700 focus:border-emerald-500 text-sm text-white outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Observações de Fechamento (opcional)
              </label>
              <textarea
                rows={2}
                placeholder="Condições especiais, parcelamento ou termos da escritura..."
                value={fechadoObs}
                onChange={(e) => setFechadoObs(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#081226] border border-slate-700 focus:border-emerald-500 text-xs text-white outline-none resize-none"
              />
            </div>

            <DialogFooter className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalFechadoMatch(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={processandoId !== null}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-[#070B14] shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Confirmar Fechamento</span>
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. MODAL TRANSIÇÃO: MARCAR COMO PERDIDO (Exige 1 dos 7 motivos fechados) */}
      <Dialog
        open={Boolean(modalPerdidoMatch)}
        onOpenChange={(aberto) => !aberto && setModalPerdidoMatch(null)}
      >
        <DialogContent className="w-[calc(100%-1.5rem)] sm:max-w-[480px] bg-[#070B14] border border-rose-500/40 text-white shadow-2xl p-6 rounded-2xl">
          <DialogHeader className="text-left space-y-2">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <XCircle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-white">
              Marcar Match como Perdido
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-300 leading-relaxed">
              Obrigatório selecionar o motivo exato da perda para alimentar os relatórios analíticos
              e a calibração estatística do motor KORBIX.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmeterPerdido} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Motivo da Perda (Lista Fechada KORBIX) *
              </label>
              <select
                required
                value={perdidoMotivo}
                onChange={(e) => setPerdidoMotivo(e.target.value as MotivoPerdaMatch)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#081226] border border-slate-700 focus:border-rose-500 text-xs text-white outline-none cursor-pointer"
              >
                {(Object.keys(MOTIVOS_PERDA_CONFIG) as MotivoPerdaMatch[]).map((motivoKey) => (
                  <option key={motivoKey} value={motivoKey}>
                    {MOTIVOS_PERDA_CONFIG[motivoKey].label} —{' '}
                    {MOTIVOS_PERDA_CONFIG[motivoKey].descricao}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Detalhamento / Feedback do Lead (opcional)
              </label>
              <textarea
                rows={3}
                placeholder="Ex: Investidor fechou apartamento no bairro vizinho; vendedor não aceitou contraproposta..."
                value={perdidoObs}
                onChange={(e) => setPerdidoObs(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#081226] border border-slate-700 focus:border-rose-500 text-xs text-white outline-none resize-none"
              />
            </div>

            <DialogFooter className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalPerdidoMatch(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={processandoId !== null}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Registrar Perda</span>
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
