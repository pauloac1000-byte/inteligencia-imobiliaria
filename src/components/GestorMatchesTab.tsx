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
  Award,
  Gauge,
  Briefcase,
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
    'todos' | 'pendente' | 'aprovado' | 'descartado' | 'eliminados'
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
  // Regra do Usuário:
  // "Pares eliminados NÃO aparecem para o investidor (área do investidor) nem na lista de matches do gestor
  // — apenas num novo filtro "Eliminados" na aba Matches do /painel, que lista os pares eliminados com o motivo visível."
  const matchesFiltrados = matches.filter((m) => {
    const isEliminado = Boolean(m.eliminado)
    if (filtroStatus === 'eliminados') {
      return isEliminado
    }
    // Na lista de matches padrão (todos, pendente, aprovado, descartado), pares eliminados NÃO aparecem
    if (isEliminado) {
      return false
    }
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
  const matchesValidos = matches.filter((m) => !m.eliminado)
  const matchesEliminados = matches.filter((m) => Boolean(m.eliminado))

  const contadores = {
    todos: matchesValidos.length,
    pendente: matchesValidos.filter((m) => m.status_match === 'pendente').length,
    aprovado: matchesValidos.filter((m) => m.status_match === 'aprovado').length,
    descartado: matchesValidos.filter((m) => m.status_match === 'descartado').length,
    eliminados: matchesEliminados.length,
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
              { id: 'eliminados', label: 'Eliminados', count: contadores.eliminados },
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
                      {/* Badge da Nota Final Harmônica */}
                      <div
                        className={`px-3 py-1.5 rounded-xl border font-mono font-bold text-xl sm:text-2xl flex items-center gap-2 ${pctConfig.bg}`}
                      >
                        <span>{match.nota_final ?? match.percentual}</span>
                        <span className="text-xs font-sans font-normal opacity-80">pts</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
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

                        {/* Badges de Notas Comprador / Vendedor, Faixa e Confiança para o Gestor */}
                        <div className="flex items-center gap-2 flex-wrap pt-0.5">
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#070B14] border border-slate-700 text-slate-300">
                            Comprador:{' '}
                            <strong className="text-[#22C7E0] font-mono">
                              {match.nota_comprador ?? match.percentual} pts
                            </strong>
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#070B14] border border-emerald-500/30 text-slate-300">
                            Vendedor:{' '}
                            <strong className="text-emerald-400 font-mono">
                              {match.nota_vendedor ?? 0} pts
                            </strong>
                          </span>
                          {match.faixa_compatibilidade && (
                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#070B14] border border-slate-700 text-slate-300 capitalize">
                              Faixa:{' '}
                              <strong className="text-white">{match.faixa_compatibilidade}</strong>
                            </span>
                          )}
                          {match.confianca_classificacao && (
                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#070B14] border border-slate-700 text-slate-300 capitalize">
                              Confiança:{' '}
                              <strong
                                className={
                                  match.confianca_classificacao === 'alta'
                                    ? 'text-emerald-400'
                                    : match.confianca_classificacao === 'media'
                                      ? 'text-amber-400'
                                      : 'text-slate-400'
                                }
                              >
                                {match.confianca_classificacao}
                              </strong>
                              {match.confianca_percentual ? (
                                <span className="font-mono text-[10px] text-slate-400 ml-1">
                                  ({Math.round(match.confianca_percentual)}%)
                                </span>
                              ) : null}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{pctConfig.label}</p>
                      </div>
                    </div>

                    {/* Ações Rápidas: APROVAR ou DESCARTAR */}
                    <div className="flex items-center gap-2 shrink-0">
                      {match.eliminado ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>Eliminado no pré-filtro</span>
                        </div>
                      ) : isProcessando ? (
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

                  {/* Bloco de Auditoria: Motivo da Eliminação (quando par eliminado) OU Resumo dos 5 critérios */}
                  {match.eliminado ? (
                    <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span className="font-bold text-rose-300 uppercase tracking-wider text-[11px]">
                          Motivo da Eliminação Pré-Motor (Auditoria Korbix)
                        </span>
                      </div>
                      <p className="text-slate-200 text-xs leading-relaxed pl-6 font-medium">
                        {match.motivo_eliminacao ||
                          'Par descartado automaticamente por não cumprir os requisitos objetivos de compatibilidade.'}
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
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleDetalhes(match.compatibilidade_id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#070B14] border border-[#22C7E0]/40 text-[#22C7E0] hover:text-white hover:bg-[#22C7E0]/10 font-semibold transition-colors cursor-pointer self-start sm:self-auto text-xs"
                      >
                        <span>
                          {isDetalhesAberto
                            ? 'Ocultar critérios de comprador e vendedor'
                            : 'Ver critérios de comprador e vendedor'}
                        </span>
                        {isDetalhesAberto ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                  {/* Painel Expansível de Critérios Auditáveis (Visão Gestor: Comprador + Vendedor) */}
                  {isDetalhesAberto && (
                    <div className="pt-3 border-t border-slate-800 space-y-4 animate-fade-in">
                      {/* Bloco 1: Critérios da Visão do Comprador */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h6 className="text-xs font-bold text-[#22C7E0] uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>
                              Critérios do Comprador (Nota:{' '}
                              {match.nota_comprador ?? match.percentual} pts)
                            </span>
                          </h6>
                          <span className="text-[11px] text-slate-400">
                            {atendidos.length} atendidos • {naoAtendidos.length} não atendidos
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          {/* Lista Completa de Critérios do Comprador com Pontos, Pesos, Fatores e Explicação */}
                          {(Array.isArray(match.criterios) && match.criterios.length > 0
                            ? match.criterios
                            : [...atendidos, ...naoAtendidos]
                          ).map((crit: any, idx: number) => {
                            const isAtendido = Boolean(crit.atendido)
                            return (
                              <div
                                key={`crit-comprador-${idx}`}
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

                      {/* Bloco 2: Critérios da Visão do Vendedor (Exclusivo Gestor) */}
                      <div className="pt-3 border-t border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <h6 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5" />
                            <span>
                              Critérios do Vendedor (Nota: {match.nota_vendedor ?? 0} pts)
                            </span>
                          </h6>
                          <span className="text-[11px] text-slate-400">
                            Visão interna do gestor
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          {Array.isArray(match.detalhamento_vendedor) &&
                          match.detalhamento_vendedor.length > 0 ? (
                            match.detalhamento_vendedor.map((item: any, idx: number) => {
                              const pontos = item.pontos ?? 0
                              const peso = item.peso ?? 0
                              return (
                                <div
                                  key={`crit-vendedor-${idx}`}
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
                                        peso {peso}
                                      </span>
                                    </div>
                                    <span className="font-mono font-bold text-emerald-400">
                                      {pontos} pts
                                    </span>
                                  </div>
                                  <p className="text-slate-300 pl-6 text-[11px] leading-relaxed">
                                    {item.explicacao}
                                  </p>
                                </div>
                              )
                            })
                          ) : (
                            <p className="text-slate-400 text-xs pl-2">
                              Detalhamento do vendedor ainda não gravado para este par.
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
    </div>
  )
}
