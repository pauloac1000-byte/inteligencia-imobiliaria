import React, { useState } from 'react'
import { GestorMatchItem, StatusMatch, CriterioCompatibilidadeItem } from '@/services/gestor'
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Home,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  DollarSign,
  Tag,
  Phone,
  Mail,
  User,
  AlertTriangle,
  Loader2,
} from 'lucide-react'

interface GestorMatchesTabProps {
  matches: GestorMatchItem[]
  loading: boolean
  onDecidirMatch: (
    compatibilidadeId: string,
    acao: 'aprovar' | 'descartar' | 'pendente',
  ) => Promise<void>
  onRecarregar: () => void
}

export function GestorMatchesTab({
  matches,
  loading,
  onDecidirMatch,
  onRecarregar,
}: GestorMatchesTabProps) {
  const [filtroStatus, setFiltroStatus] = useState<
    'todos' | 'pendente' | 'aprovado' | 'descartado'
  >('todos')
  const [ordenacao, setOrdenacao] = useState<'percentual_desc' | 'percentual_asc' | 'recentes'>(
    'percentual_desc',
  )
  const [detalhesAbertos, setDetalhesAbertos] = useState<Record<string, boolean>>({})
  const [processandoId, setProcessandoId] = useState<string | null>(null)

  const toggleDetalhes = (id: string) => {
    setDetalhesAbertos((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleDecidir = async (
    compatibilidadeId: string,
    acao: 'aprovar' | 'descartar' | 'pendente',
  ) => {
    setProcessandoId(compatibilidadeId)
    try {
      await onDecidirMatch(compatibilidadeId, acao)
    } finally {
      setProcessandoId(null)
    }
  }

  // Filtragem
  const matchesFiltrados = matches.filter((m) => {
    if (filtroStatus !== 'todos' && m.status_match !== filtroStatus) {
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
      return new Date(b.atualizado_em).getTime() - new Date(a.atualizado_em).getTime()
    }
    return 0
  })

  // Contadores para os filtros
  const contadores = {
    todos: matches.length,
    pendente: matches.filter((m) => m.status_match === 'pendente').length,
    aprovado: matches.filter((m) => m.status_match === 'aprovado').length,
    descartado: matches.filter((m) => m.status_match === 'descartado').length,
  }

  const getPercentualBadge = (pct: number) => {
    if (pct >= 80) {
      return {
        bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]',
        label: 'Altíssima compatibilidade',
      }
    }
    if (pct >= 55) {
      return {
        bg: 'bg-[#22C7E0]/15 border-[#22C7E0]/40 text-[#22C7E0] shadow-[0_0_12px_rgba(34,199,224,0.3)]',
        label: 'Boa compatibilidade',
      }
    }
    if (pct >= 30) {
      return {
        bg: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
        label: 'Média compatibilidade',
      }
    }
    return {
      bg: 'bg-slate-800 border-slate-700 text-slate-400',
      label: 'Baixa compatibilidade',
    }
  }

  const getStatusMatchBadge = (status: StatusMatch) => {
    switch (status) {
      case 'aprovado':
        return {
          label: 'Aprovado',
          className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
          icon: CheckCircle2,
        }
      case 'descartado':
        return {
          label: 'Descartado',
          className: 'bg-red-500/15 text-red-300 border-red-500/40',
          icon: XCircle,
        }
      case 'pendente':
      default:
        return {
          label: 'Pendente de decisão',
          className: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
          icon: Clock,
        }
    }
  }

  return (
    <div className="space-y-6">
      {/* Barra de Filtros e Ordenação */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl bg-[#081226] border border-[#1A3A75]">
        {/* Filtros de Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mr-1">
            Status:
          </span>
          {(
            [
              { id: 'todos', label: 'Todos', count: contadores.todos },
              { id: 'pendente', label: 'Pendentes', count: contadores.pendente },
              { id: 'aprovado', label: 'Aprovados', count: contadores.aprovado },
              { id: 'descartado', label: 'Descartados', count: contadores.descartado },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFiltroStatus(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                filtroStatus === item.id
                  ? 'bg-[#22C7E0]/15 text-[#22C7E0] border-[#22C7E0]/50 shadow-[0_0_12px_rgba(34,199,224,0.2)]'
                  : 'bg-[#070B14] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              <span>{item.label}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                {item.count}
              </span>
            </button>
          ))}
        </div>

        {/* Ordenação */}
        <div className="flex items-center gap-2 self-end md:self-auto text-xs">
          <span className="text-slate-400">Ordenar por:</span>
          <select
            value={ordenacao}
            onChange={(e) => setOrdenacao(e.target.value as any)}
            className="bg-[#070B14] border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:border-[#22C7E0] focus:outline-none"
          >
            <option value="percentual_desc">Maior compatibilidade primeiro (%)</option>
            <option value="percentual_asc">Menor compatibilidade primeiro (%)</option>
            <option value="recentes">Mais recentes</option>
          </select>
        </div>
      </div>

      {/* Lista de Matches */}
      {loading ? (
        <div className="p-12 rounded-2xl bg-[#081226] border border-slate-800 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#22C7E0]" />
          <p className="text-sm text-slate-400">
            Calculando e carregando matches determinísticos...
          </p>
        </div>
      ) : matchesOrdenados.length === 0 ? (
        <div className="p-10 rounded-2xl bg-[#081226] border border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
            <Sparkles className="w-6 h-6 text-[#22C7E0]" />
          </div>
          <h4 className="text-base font-bold text-white">
            Nenhum match encontrado para este filtro
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Assim que novos imóveis e teses de investidores forem cadastrados, o motor
            determinístico calculará as pontuações e exibirá os pares aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matchesOrdenados.map((match) => {
            const pctConfig = getPercentualBadge(match.percentual)
            const statusConfig = getStatusMatchBadge(match.status_match)
            const StatusIcon = statusConfig.icon
            const isDetalhesAberto = Boolean(detalhesAbertos[match.compatibilidade_id])
            const isProcessando = processandoId === match.compatibilidade_id

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
                  match.status_match === 'aprovado'
                    ? 'bg-[#081226]/90 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                    : match.status_match === 'descartado'
                      ? 'bg-[#081226]/50 border-slate-800 opacity-70'
                      : 'bg-[#081226] border-[#1A3A75] hover:border-[#22C7E0]/40'
                }`}
              >
                {/* Linha Principal do Match */}
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Topo do Card: Percentual, Status e Botões de Decisão */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      {/* Badge do Percentual com Termômetro */}
                      <div
                        className={`px-3 py-1.5 rounded-xl border font-mono font-bold text-xl sm:text-2xl flex items-center gap-2 ${pctConfig.bg}`}
                      >
                        <span>{match.percentual}%</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            Match KORBIX
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusConfig.className}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            <span>{statusConfig.label}</span>
                          </span>
                          {match.ja_tem_interesse && (
                            <span className="text-[10px] bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                              Interesse manifestado
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{pctConfig.label}</p>
                      </div>
                    </div>

                    {/* Ações Rápidas: APROVAR ou DESCARTAR */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isProcessando ? (
                        <div className="flex items-center gap-2 text-xs text-[#22C7E0] px-3 py-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Gravando...</span>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDecidir(match.compatibilidade_id, 'aprovar')}
                            disabled={match.status_match === 'aprovado'}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              match.status_match === 'aprovado'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 cursor-default'
                                : 'bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-[#070B14] shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-[1.02]'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>
                              {match.status_match === 'aprovado' ? 'Aprovado' : 'Aprovar'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDecidir(match.compatibilidade_id, 'descartar')}
                            disabled={match.status_match === 'descartado'}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              match.status_match === 'descartado'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/40 cursor-default'
                                : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>
                              {match.status_match === 'descartado' ? 'Descartado' : 'Descartar'}
                            </span>
                          </button>

                          {match.status_match !== 'pendente' && (
                            <button
                              type="button"
                              onClick={() => handleDecidir(match.compatibilidade_id, 'pendente')}
                              title="Resetar para pendente"
                              className="p-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 transition-colors"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Comparativo Lado a Lado: Imóvel (Venda) vs Investidor (Tese) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Coluna Imóvel */}
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
                              {match.imovel_tipo || 'Imóvel'} —{' '}
                              {match.imovel_cidade || 'Não informada'}
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
                        <div>
                          <span className="text-[11px] text-slate-500 block">Motivo da venda:</span>
                          <span className="text-slate-300 truncate block">
                            {match.imovel_motivo_venda || 'Não informado'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 block">Status atual:</span>
                          <span className="text-slate-300 font-medium">{match.imovel_status}</span>
                        </div>
                      </div>

                      {/* Contato do Proprietário */}
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

                    {/* Coluna Investidor */}
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

                      {/* Contato do Investidor */}
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

                  {/* Resumo Rápido dos Critérios */}
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
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleDetalhes(match.compatibilidade_id)}
                      className="inline-flex items-center gap-1.5 text-[#22C7E0] hover:text-[#5eead4] font-semibold transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      <span>
                        {isDetalhesAberto
                          ? 'Ocultar auditoria dos 5 critérios'
                          : 'Ver detalhamento dos 5 critérios'}
                      </span>
                      {isDetalhesAberto ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Painel Expansível de Critérios Auditáveis */}
                  {isDetalhesAberto && (
                    <div className="pt-3 border-t border-slate-800 space-y-3 animate-fade-in">
                      <h6 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Auditoria Determinística de Critérios (Total: 100 pontos)
                      </h6>

                      <div className="space-y-2">
                        {/* Critérios Atendidos */}
                        {atendidos.map((crit, idx) => (
                          <div
                            key={`atendido-${idx}`}
                            className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span className="font-bold text-emerald-300">{crit.nome}</span>
                              </div>
                              <span className="font-mono font-bold text-emerald-400">
                                +{crit.peso || crit.pontos} pts
                              </span>
                            </div>
                            <p className="text-slate-300 pl-6 text-[11px] leading-relaxed">
                              {crit.explicacao}
                            </p>
                          </div>
                        ))}

                        {/* Critérios Não Atendidos */}
                        {naoAtendidos.map((crit, idx) => (
                          <div
                            key={`nao-atendido-${idx}`}
                            className="p-3 rounded-xl bg-amber-950/15 border border-amber-500/25 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                                <span className="font-bold text-amber-300">{crit.nome}</span>
                              </div>
                              <span className="font-mono text-slate-400">0 / {crit.peso} pts</span>
                            </div>
                            <p className="text-slate-400 pl-6 text-[11px] leading-relaxed">
                              {crit.explicacao}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
