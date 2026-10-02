import React, { useEffect, useState, useMemo } from 'react'
import { GestorFunilEtapaItem, gestorObterMetricasFunil } from '@/services/gestor'
import {
  Filter,
  Calendar,
  AlertTriangle,
  ArrowDown,
  RefreshCw,
  Users,
  MousePointerClick,
  FileText,
  CheckCircle2,
  Trophy,
  Loader2,
  TrendingDown,
  Info,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface GestorFunilTabProps {
  onRecarregar?: () => void
}

type PeriodoDias = 7 | 30 | 90
type RotaFiltro = 'geral' | 'proprietario' | 'investidor'

interface QuedaGargalo {
  deEtapa: string
  paraEtapa: string
  taxaQueda: number // percentual perdido: (1 - conversao) * 100
  deOrdem: number
  paraOrdem: number
}

export function GestorFunilTab({ onRecarregar }: GestorFunilTabProps) {
  const { toast } = useToast()

  const [periodo, setPeriodo] = useState<PeriodoDias>(30)
  const [rotaFiltro, setRotaFiltro] = useState<RotaFiltro>('geral')
  const [dados, setDados] = useState<GestorFunilEtapaItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const carregarMetricas = async (dias: PeriodoDias) => {
    setLoading(true)
    try {
      const res = await gestorObterMetricasFunil(dias)
      setDados(res)
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar funil',
        description: err.message || 'Falha ao sincronizar métricas de conversão.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarMetricas(periodo)
  }, [periodo])

  // Etapas filtradas pela rota selecionada e ordenadas (1 a 5)
  const etapasDaRota = useMemo(() => {
    const filtradas = dados.filter((d) => d.rota_filtro === rotaFiltro)
    return [...filtradas].sort((a, b) => a.etapa_ordem - b.etapa_ordem)
  }, [dados, rotaFiltro])

  // Volume do topo do funil (Visitantes = etapa 1)
  const volumeVisitantesTopo = useMemo(() => {
    const etapa1 = etapasDaRota.find((e) => e.etapa_ordem === 1)
    return etapa1 ? etapa1.sessoes_unicas : 0
  }, [etapasDaRota])

  // Cálculo da maior queda percentual entre duas etapas consecutivas
  const maiorQueda = useMemo<QuedaGargalo | null>(() => {
    if (etapasDaRota.length < 2) return null

    let piorQueda: QuedaGargalo | null = null

    for (let i = 0; i < etapasDaRota.length - 1; i++) {
      const atual = etapasDaRota[i]
      const proxima = etapasDaRota[i + 1]

      const volAtual = atual.sessoes_unicas
      const volProx = proxima.sessoes_unicas

      // Se a etapa atual teve 0 sessões, não há cálculo válido de transição
      if (volAtual > 0) {
        // Taxa de conversão de atual para próxima
        const taxaConversao = (volProx / volAtual) * 100
        const taxaPerda = Math.max(0, 100 - taxaConversao)

        if (taxaPerda > 0) {
          if (!piorQueda || taxaPerda > piorQueda.taxaQueda) {
            piorQueda = {
              deEtapa: atual.etapa_nome,
              paraEtapa: proxima.etapa_nome,
              taxaQueda: Number(taxaPerda.toFixed(1)),
              deOrdem: atual.etapa_ordem,
              paraOrdem: proxima.etapa_ordem,
            }
          }
        }
      }
    }

    return piorQueda
  }, [etapasDaRota])

  // Ícones representativos de cada etapa
  const getEtapaIcon = (ordem: number) => {
    switch (ordem) {
      case 1:
        return <Users className="w-5 h-5 text-[#22C7E0]" />
      case 2:
        return <MousePointerClick className="w-5 h-5 text-[#22C7E0]" />
      case 3:
        return <FileText className="w-5 h-5 text-[#22C7E0]" />
      case 4:
        return <CheckCircle2 className="w-5 h-5 text-[#22C7E0]" />
      case 5:
        return <Trophy className="w-5 h-5 text-emerald-400" />
      default:
        return <Users className="w-5 h-5 text-[#22C7E0]" />
    }
  }

  // Descrição do que cada etapa mede
  const getEtapaDescricao = (etapaId: string, rota: RotaFiltro) => {
    switch (etapaId) {
      case 'visitantes':
        return 'Sessões anônimas únicas que visualizaram a página (Hero landing).'
      case 'cliques_cta':
        if (rota === 'proprietario') return 'Cliques em "Quero vender meu imóvel".'
        if (rota === 'investidor') return 'Cliques em "Quero investir".'
        return 'Soma dos cliques de intenção ("Quero vender" + "Quero investir").'
      case 'formularios_iniciados':
        if (rota === 'proprietario') return 'Abertura do formulário de proprietário ou calculadora.'
        if (rota === 'investidor') return 'Abertura do formulário de tese ou simulador.'
        return 'Aberturas de qualquer fluxo de formulário ou simulador.'
      case 'etapa1_concluida':
        if (rota === 'proprietario')
          return 'Proprietários que preencheram dados do imóvel e WhatsApp.'
        if (rota === 'investidor') return 'Não aplicável ao fluxo de investidor (etapa única).'
        return 'Conclusão da primeira etapa com validação de dados básicos.'
      case 'cadastros_completos':
        if (rota === 'proprietario')
          return 'Envios finais completos de proprietários com protocolo KX gerado.'
        if (rota === 'investidor')
          return 'Envios finais completos de teses com protocolo KX gerado.'
        return 'Cadastros finais homologados com protocolo KX em qualquer rota.'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Barra de Controles: Período e Rota */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#081226] border border-[#1A3A75] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Seletor de Rota */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#22C7E0]" />
              Rota:
            </span>
            {(
              [
                { id: 'geral', label: 'Visão Geral (Todas)' },
                { id: 'proprietario', label: 'Proprietários' },
                { id: 'investidor', label: 'Investidores' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRotaFiltro(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  rotaFiltro === item.id
                    ? 'bg-[#22C7E0]/15 text-[#22C7E0] border-[#22C7E0]/60 shadow-[0_0_12px_rgba(34,199,224,0.15)]'
                    : 'bg-[#070B14] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Seletor de Período + Botão Atualizar */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <div className="flex items-center gap-1 bg-[#070B14] p-1 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[11px] px-2 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Período:
              </span>
              {([7, 30, 90] as const).map((dias) => (
                <button
                  key={dias}
                  type="button"
                  onClick={() => setPeriodo(dias)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    periodo === dias
                      ? 'bg-[#22C7E0] text-[#070B14] shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {dias} dias
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => carregarMetricas(periodo)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-[#070B14] transition-colors cursor-pointer disabled:opacity-50"
              title="Recarregar métricas do funil"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#22C7E0]' : ''}`}
              />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          </div>
        </div>

        {/* Linha explicativa da metodologia de contagem */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
          <Info className="w-3.5 h-3.5 text-[#22C7E0] shrink-0" />
          <span>
            Métrica padronizada por <strong>sessões anônimas únicas</strong> (
            <code className="text-slate-300">sessao_id</code>) para cálculo rigoroso da conversão
            entre etapas sucessivas.
          </span>
        </div>
      </div>

      {/* Banner de Destaque da Maior Queda (Gargalo Identificado) */}
      {maiorQueda && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.12)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shrink-0 text-amber-400">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-amber-500/25 border border-amber-500/50 text-amber-300">
                  Maior Gargalo Detectado
                </span>
                <span className="text-xs text-amber-300/80 font-mono">
                  Etapa {maiorQueda.deOrdem} → Etapa {maiorQueda.paraOrdem}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mt-1">
                Perda de {maiorQueda.taxaQueda}% entre &ldquo;{maiorQueda.deEtapa}&rdquo; e &ldquo;
                {maiorQueda.paraEtapa}&rdquo;
              </h3>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Principal ponto de atrito da jornada na rota selecionada nos últimos {periodo} dias.
              </p>
            </div>
          </div>
          <div className="sm:text-right shrink-0">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-400">
              -{maiorQueda.taxaQueda}%
            </span>
            <span className="block text-[11px] text-amber-300/70">evasão na transição</span>
          </div>
        </div>
      )}

      {/* Exibição do Funil: Sequência Vertical com Métricas e Conectores */}
      {loading ? (
        <div className="p-16 rounded-2xl bg-[#081226] border border-slate-800 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#22C7E0]" />
          <p className="text-sm text-slate-300 font-medium">
            Calculando conversões do funil ({periodo} dias)...
          </p>
        </div>
      ) : etapasDaRota.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#081226] border border-slate-800 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-slate-500 mx-auto" />
          <h4 className="text-base font-bold text-white">Nenhum dado registrado no período</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Não há registros de eventos para o período de {periodo} dias na rota selecionada.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {etapasDaRota.map((etapa, idx) => {
            const etapaAnterior = idx > 0 ? etapasDaRota[idx - 1] : null

            // Taxa em relação à etapa anterior (%)
            const taxaAnterior =
              etapaAnterior && etapaAnterior.sessoes_unicas > 0
                ? ((etapa.sessoes_unicas / etapaAnterior.sessoes_unicas) * 100).toFixed(1)
                : null

            // Perda percentual em relação à anterior
            const taxaPerdaAnterior =
              taxaAnterior !== null ? (100 - Number(taxaAnterior)).toFixed(1) : null

            // Taxa em relação ao topo do funil (Visitantes)
            const taxaTopo =
              volumeVisitantesTopo > 0
                ? ((etapa.sessoes_unicas / volumeVisitantesTopo) * 100).toFixed(1)
                : null

            // Largura relativa da barra baseada no topo (100% no topo)
            const larguraBarra =
              volumeVisitantesTopo > 0
                ? Math.max(8, Math.min(100, (etapa.sessoes_unicas / volumeVisitantesTopo) * 100))
                : 0

            // Verifica se a transição DESTA etapa anterior para a atual é a MAIOR QUEDA
            const isMaiorQueda =
              maiorQueda &&
              etapaAnterior &&
              maiorQueda.deOrdem === etapaAnterior.etapa_ordem &&
              maiorQueda.paraOrdem === etapa.etapa_ordem

            return (
              <React.Fragment key={etapa.etapa_id}>
                {/* Indicador de Transição / Queda entre Etapas */}
                {idx > 0 && etapaAnterior && (
                  <div className="relative py-1 flex items-center justify-center">
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold border transition-all ${
                        isMaiorQueda
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/50'
                          : 'bg-[#081226] text-slate-400 border-slate-800'
                      }`}
                    >
                      <ArrowDown
                        className={`w-3.5 h-3.5 ${isMaiorQueda ? 'text-amber-400 stroke-[3]' : 'text-slate-500'}`}
                      />
                      <span>
                        Conversão:{' '}
                        <strong
                          className={isMaiorQueda ? 'text-amber-300 font-bold' : 'text-slate-200'}
                        >
                          {taxaAnterior}%
                        </strong>
                      </span>
                      {Number(taxaPerdaAnterior) > 0 && (
                        <span
                          className={`text-[11px] ${isMaiorQueda ? 'text-red-400 font-bold' : 'text-slate-500'}`}
                        >
                          (-{taxaPerdaAnterior}% queda)
                        </span>
                      )}
                      {isMaiorQueda && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200 ml-1">
                          Maior Queda
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Card da Etapa */}
                <div
                  className={`rounded-2xl p-4 sm:p-5 transition-all relative overflow-hidden ${
                    isMaiorQueda
                      ? 'bg-[#081226] border-2 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                      : 'bg-[#081226] border border-[#1A3A75] hover:border-[#22C7E0]/50'
                  }`}
                >
                  {/* Linha 1: Título, Ícone, Ordem e Métricas */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#070B14] border border-[#1A3A75] flex items-center justify-center shrink-0">
                        {getEtapaIcon(etapa.etapa_ordem)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-[#22C7E0] bg-[#22C7E0]/10 border border-[#22C7E0]/30 px-2 py-0.5 rounded font-bold">
                            Etapa {etapa.etapa_ordem} de 5
                          </span>
                          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                            {etapa.etapa_nome}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {getEtapaDescricao(etapa.etapa_id, rotaFiltro)}
                        </p>
                      </div>
                    </div>

                    {/* Números da Etapa */}
                    <div className="flex items-baseline gap-4 sm:text-right">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                          Sessões Únicas
                        </span>
                        <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
                          {etapa.sessoes_unicas.toLocaleString('pt-BR')}
                        </span>
                      </div>

                      <div className="pl-3 border-l border-slate-800">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                          Total Eventos
                        </span>
                        <span className="text-sm sm:text-base font-bold font-mono text-slate-300">
                          {etapa.total_eventos.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Linha 2: Barra Visual do Funil + Indicadores de Taxa */}
                  <div className="pt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">
                        Taxa vs. Topo (Visitantes):{' '}
                        <strong className="text-[#22C7E0]">
                          {taxaTopo !== null ? `${taxaTopo}%` : '—'}
                        </strong>
                      </span>
                      {taxaAnterior !== null && (
                        <span className="text-slate-400">
                          Taxa vs. Anterior:{' '}
                          <strong className={isMaiorQueda ? 'text-amber-400' : 'text-slate-200'}>
                            {taxaAnterior}%
                          </strong>
                        </span>
                      )}
                    </div>

                    {/* Barra de Progresso com Gradiente KORBIX */}
                    <div className="w-full h-3 rounded-full bg-[#070B14] border border-slate-800 overflow-hidden relative">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          etapa.etapa_ordem === 5
                            ? 'bg-gradient-to-r from-[#22C7E0] to-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                            : 'bg-gradient-to-r from-[#1A3A75] via-[#22C7E0] to-[#22C7E0] shadow-[0_0_12px_rgba(34,199,224,0.3)]'
                        }`}
                        style={{ width: `${larguraBarra}%` }}
                      />
                    </div>
                  </div>
                </div>
              </React.Fragment>
            )
          })}
        </div>
      )}

      {/* Tabela Resumo do Funil */}
      {!loading && etapasDaRota.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#081226] border border-[#1A3A75] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Resumo Tabular da Jornada
            </h4>
            <span className="text-xs text-slate-400 font-mono">
              Rota: <strong className="text-[#22C7E0] uppercase">{rotaFiltro}</strong> • {periodo}{' '}
              dias
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Etapa</th>
                  <th className="py-2.5 px-3 text-right">Sessões Únicas</th>
                  <th className="py-2.5 px-3 text-right">Conversão Etapa Anterior</th>
                  <th className="py-2.5 px-3 text-right">Queda / Perda</th>
                  <th className="py-2.5 px-3 text-right">Conversão Topo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {etapasDaRota.map((item, idx) => {
                  const ant = idx > 0 ? etapasDaRota[idx - 1] : null
                  const convAnt =
                    ant && ant.sessoes_unicas > 0
                      ? ((item.sessoes_unicas / ant.sessoes_unicas) * 100).toFixed(1)
                      : null
                  const perda = convAnt !== null ? (100 - Number(convAnt)).toFixed(1) : null
                  const convTopo =
                    volumeVisitantesTopo > 0
                      ? ((item.sessoes_unicas / volumeVisitantesTopo) * 100).toFixed(1)
                      : null
                  const isGargalo =
                    maiorQueda &&
                    ant &&
                    maiorQueda.deOrdem === ant.etapa_ordem &&
                    maiorQueda.paraOrdem === item.etapa_ordem

                  return (
                    <tr
                      key={item.etapa_id}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        isGargalo ? 'bg-amber-500/10' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-[#22C7E0] font-bold">{item.etapa_ordem}</td>
                      <td className="py-3 px-3 font-sans font-semibold text-white flex items-center gap-2">
                        <span>{item.etapa_nome}</span>
                        {isGargalo && (
                          <span className="text-[10px] font-mono uppercase bg-amber-500/30 text-amber-200 border border-amber-500/50 px-1.5 py-0.5 rounded">
                            Maior gargalo
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right text-white font-bold">
                        {item.sessoes_unicas.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {convAnt !== null ? (
                          <span
                            className={isGargalo ? 'text-amber-400 font-bold' : 'text-slate-300'}
                          >
                            {convAnt}%
                          </span>
                        ) : (
                          <span className="text-slate-600">100.0% (Início)</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {perda !== null && Number(perda) > 0 ? (
                          <span className={isGargalo ? 'text-red-400 font-bold' : 'text-slate-500'}>
                            -{perda}%
                          </span>
                        ) : (
                          <span className="text-slate-600">0.0%</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right text-[#22C7E0] font-bold">
                        {convTopo !== null ? `${convTopo}%` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
