import React, { useState } from 'react'
import {
  GestorLeadItem,
  exportarLeadsCSV,
  gestorAtivarImovel,
  gestorObterDocumentosConferencia,
  gestorDecidirDocumento,
  gestorToggleProcuracao,
} from '@/services/gestor'
import { DocumentoConferenciaItem, ROTULO_DOCUMENTO_LABELS } from '@/services/arquivos'
import { StatusImovelLead } from '@/services/profiles'
import {
  Download,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  User,
  Building,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Edit2,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Zap,
  XCircle,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface GestorLeadsTabProps {
  leads: GestorLeadItem[]
  loading: boolean
  onAtualizarStatus: (leadId: string, novoStatus: StatusImovelLead | string) => Promise<void>
  onRecarregar: () => void
}

const OPCOES_STATUS: StatusImovelLead[] = [
  'rascunho',
  'em análise',
  'ativo',
  'em negociação',
  'vendido',
  'retirado',
  'expirado',
]

export function GestorLeadsTab({
  leads,
  loading,
  onAtualizarStatus,
  onRecarregar,
}: GestorLeadsTabProps) {
  const { toast } = useToast()

  const [busca, setBusca] = useState('')
  const [filtroRota, setFiltroRota] = useState<'todas' | 'proprietario' | 'investidor'>('todas')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [salvandoId, setSalvandoId] = useState<string | null>(null)

  // Checklist de documentos por lead selecionado
  const [leadChecklistAberto, setLeadChecklistAberto] = useState<string | null>(null)
  const [docsChecklist, setDocsChecklist] = useState<Record<string, DocumentoConferenciaItem[]>>({})
  const [carregandoDocs, setCarregandoDocs] = useState<Record<string, boolean>>({})
  const [motivosRecusa, setMotivosRecusa] = useState<Record<string, string>>({})
  const [processandoAcaoDoc, setProcessandoAcaoDoc] = useState<string | null>(null)
  const [ativandoLeadId, setAtivandoLeadId] = useState<string | null>(null)

  const carregarDocsLead = async (leadId: string) => {
    setCarregandoDocs((prev) => ({ ...prev, [leadId]: true }))
    try {
      const docs = await gestorObterDocumentosConferencia(leadId)
      setDocsChecklist((prev) => ({ ...prev, [leadId]: docs }))
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar documentos',
        description: err.message || 'Falha ao buscar checklist do imóvel.',
        variant: 'destructive',
      })
    } finally {
      setCarregandoDocs((prev) => ({ ...prev, [leadId]: false }))
    }
  }

  const toggleChecklist = (leadId: string) => {
    if (leadChecklistAberto === leadId) {
      setLeadChecklistAberto(null)
    } else {
      setLeadChecklistAberto(leadId)
      if (!docsChecklist[leadId]) {
        carregarDocsLead(leadId)
      }
    }
  }

  const handleDecidirDoc = async (
    leadId: string,
    tipoDoc: string,
    decisao: 'conferido' | 'recusado',
  ) => {
    const chaveMotivo = `${leadId}_${tipoDoc}`
    const motivo = motivosRecusa[chaveMotivo]

    if (decisao === 'recusado' && (!motivo || motivo.trim() === '')) {
      toast({
        title: 'Motivo obrigatório',
        description: 'Informe o motivo da recusa do documento para o proprietário poder corrigir.',
        variant: 'destructive',
      })
      return
    }

    setProcessandoAcaoDoc(`${leadId}_${tipoDoc}`)
    try {
      await gestorDecidirDocumento({
        leadId,
        tipoDocumento: tipoDoc,
        decisao,
        motivoRecusa: decisao === 'recusado' ? motivo : undefined,
      })
      toast({
        title: decisao === 'conferido' ? 'Documento conferido!' : 'Documento recusado',
        description:
          decisao === 'conferido'
            ? 'Documento validado com sucesso.'
            : 'Recusa registrada com motivo.',
      })
      await carregarDocsLead(leadId)
      onRecarregar()
    } catch (err: any) {
      toast({
        title: 'Erro na conferência',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setProcessandoAcaoDoc(null)
    }
  }

  const handleToggleProcuracaoGestor = async (leadId: string, atual: boolean) => {
    try {
      await gestorToggleProcuracao(leadId, !atual)
      toast({
        title: !atual ? 'Procuração marcada como necessária' : 'Procuração dispensada',
        description: !atual
          ? 'Agora a procuração é item obrigatório para ativar este imóvel.'
          : 'O checklist foi recalculado sem a obrigatoriedade da procuração.',
      })
      await carregarDocsLead(leadId)
      onRecarregar()
    } catch (err: any) {
      toast({
        title: 'Erro ao alternar procuração',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  const handleAtivarImovel = async (leadId: string, protocolo: string) => {
    setAtivandoLeadId(leadId)
    try {
      await gestorAtivarImovel(leadId)
      toast({
        title: '🚀 Imóvel ATIVADO com sucesso!',
        description: `O imóvel ${protocolo} agora está ATIVO e participando do motor de compatibilidade em tempo real.`,
      })
      await carregarDocsLead(leadId)
      onRecarregar()
    } catch (err: any) {
      toast({
        title: 'Não foi possível ativar o imóvel',
        description:
          err.message || 'Verifique se todos os documentos obrigatórios foram conferidos.',
        variant: 'destructive',
      })
    } finally {
      setAtivandoLeadId(null)
    }
  }

  // Tratamento da exportação CSV
  const handleExportarCSV = () => {
    try {
      if (leadsFiltrados.length === 0) {
        toast({
          title: 'Nenhum lead para exportar',
          description: 'Ajuste os filtros para exibir ao menos um lead antes de exportar.',
          variant: 'destructive',
        })
        return
      }

      exportarLeadsCSV(leadsFiltrados)
      toast({
        title: 'Exportação concluída!',
        description: `Arquivo CSV gerado com ${leadsFiltrados.length} lead(s).`,
      })
    } catch (err: any) {
      toast({
        title: 'Erro na exportação',
        description: err.message || 'Falha ao gerar o arquivo CSV.',
        variant: 'destructive',
      })
    }
  }

  // Mudança inline de status
  const handleChangeStatus = async (lead: GestorLeadItem, novoStatus: string) => {
    if (lead.rota !== 'proprietario') {
      return
    }
    if (lead.status === novoStatus) {
      return
    }

    setSalvandoId(lead.id)
    try {
      await onAtualizarStatus(lead.id, novoStatus)
      toast({
        title: 'Status atualizado com sucesso!',
        description: `Lead ${lead.protocolo} atualizado para "${novoStatus}". Refletido na área do proprietário.`,
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar status',
        description: err.message || 'Não foi possível persistir a alteração no banco.',
        variant: 'destructive',
      })
    } finally {
      setSalvandoId(null)
    }
  }

  // Filtragem
  const leadsFiltrados = leads.filter((item) => {
    // Filtro de rota
    if (filtroRota !== 'todas' && item.rota !== filtroRota) {
      return false
    }

    // Filtro de status
    if (filtroStatus !== 'todos' && item.status !== filtroStatus) {
      return false
    }

    // Busca textual (protocolo, nome, email, telefone, cidade, motivo)
    if (busca.trim()) {
      const termo = busca.toLowerCase()
      const campos = [
        item.protocolo,
        item.nome,
        item.email,
        item.telefone,
        item.cidade,
        item.motivo_venda,
        item.prazo_desejado,
        item.tipo_imovel,
        item.ticket,
        item.objetivo,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      if (!campos.includes(termo)) {
        return false
      }
    }

    return true
  })

  // Contadores
  const contadores = {
    total: leads.length,
    proprietarios: leads.filter((l) => l.rota === 'proprietario').length,
    investidores: leads.filter((l) => l.rota === 'investidor').length,
  }

  const getStatusBadge = (status: string, rota: string) => {
    if (rota === 'investidor') {
      return {
        label: 'Tese Cadastrada',
        className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
        dot: 'bg-emerald-400',
      }
    }

    const s = (status || '').toLowerCase().trim()
    switch (s) {
      case 'rascunho':
        return {
          label: 'Rascunho',
          className: 'bg-slate-500/15 text-slate-300 border-slate-500/40',
          dot: 'bg-slate-400',
        }
      case 'em análise':
      case 'em analise':
      case 'recebido':
        return {
          label: 'Em análise',
          className: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
          dot: 'bg-amber-400 animate-pulse',
        }
      case 'ativo':
      case 'com compatibilidade':
        return {
          label: 'Ativo (no motor)',
          className:
            'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]',
          dot: 'bg-emerald-400 animate-pulse',
        }
      case 'em negociação':
      case 'em negociacao':
        return {
          label: 'Em negociação',
          className: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40',
          dot: 'bg-indigo-400',
        }
      case 'vendido':
        return {
          label: 'Vendido',
          className: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
          dot: 'bg-purple-400',
        }
      case 'retirado':
        return {
          label: 'Retirado',
          className: 'bg-zinc-600/15 text-zinc-400 border-zinc-600/40',
          dot: 'bg-zinc-500',
        }
      case 'expirado':
        return {
          label: 'Expirado',
          className: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
          dot: 'bg-rose-400',
        }
      default:
        return {
          label: status || 'Em análise',
          className: 'bg-slate-800 text-slate-300 border-slate-700',
          dot: 'bg-slate-500',
        }
    }
  }

  return (
    <div className="space-y-6">
      {/* Barra de Filtros, Busca e Exportação */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#081226] border border-[#1A3A75] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Busca por texto */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por protocolo (KX-...), nome, telefone, e-mail, cidade ou motivo..."
              className="w-full bg-[#070B14] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0]"
            />
          </div>

          {/* Botão de Exportação CSV Client-side */}
          <button
            type="button"
            onClick={handleExportarCSV}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#22C7E0] hover:bg-[#1fb3ca] active:bg-[#1ca2b7] text-[#070B14] font-bold text-xs sm:text-sm shadow-[0_0_15px_rgba(34,199,224,0.3)] transition-all cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV ({leadsFiltrados.length})</span>
          </button>
        </div>

        {/* Linha secundária de filtros */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
          {/* Rota */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              Rota:
            </span>
            {(
              [
                { id: 'todas', label: 'Todas as rotas', count: contadores.total },
                { id: 'proprietario', label: 'Proprietários', count: contadores.proprietarios },
                { id: 'investidor', label: 'Investidores', count: contadores.investidores },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFiltroRota(item.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  filtroRota === item.id
                    ? 'bg-[#22C7E0]/15 text-[#22C7E0] border-[#22C7E0]/50'
                    : 'bg-[#070B14] text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {item.label} ({item.count})
              </button>
            ))}
          </div>

          {/* Filtro Status (para proprietários) */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Status do fluxo:</span>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="bg-[#070B14] border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:border-[#22C7E0] focus:outline-none"
            >
              <option value="todos">Todos os status</option>
              {OPCOES_STATUS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabela / Lista de Leads */}
      {loading ? (
        <div className="p-12 rounded-2xl bg-[#081226] border border-slate-800 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#22C7E0]" />
          <p className="text-sm text-slate-400">Carregando base de leads do KORBIX...</p>
        </div>
      ) : leadsFiltrados.length === 0 ? (
        <div className="p-10 rounded-2xl bg-[#081226] border border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
            <User className="w-6 h-6 text-slate-400" />
          </div>
          <h4 className="text-base font-bold text-white">Nenhum lead encontrado</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Não há registros correspondentes aos filtros selecionados. Tente limpar os termos de
            busca.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {leadsFiltrados.map((lead) => {
            const isProprietario = lead.rota === 'proprietario'
            const statusConfig = getStatusBadge(lead.status, lead.rota)
            const isSalvando = salvandoId === lead.id

            return (
              <div
                key={lead.id}
                className="bg-[#081226] border border-[#1A3A75] hover:border-[#22C7E0]/40 rounded-2xl p-4 sm:p-5 shadow-lg transition-all space-y-4"
              >
                {/* Linha 1: Identificação, Rota, Protocolo e Status Editável */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Protocolo */}
                    <span className="font-mono text-xs sm:text-sm font-bold text-[#22C7E0] bg-[#070B14] border border-[#22C7E0]/40 px-2.5 py-1 rounded-lg">
                      {lead.protocolo || 'KX-0000'}
                    </span>

                    {/* Rota */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        isProprietario
                          ? 'bg-[#22C7E0]/15 text-[#22C7E0] border-[#22C7E0]/40'
                          : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {isProprietario ? (
                        <>
                          <Building className="w-3 h-3" />
                          <span>Proprietário</span>
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-3 h-3" />
                          <span>Investidor</span>
                        </>
                      )}
                    </span>

                    {/* Alerta de coerência / mediana de valor para o gestor */}
                    {lead.alerta_valor === 'revisar valor' && (
                      <span
                        title={
                          lead.alerta_motivo ||
                          'Preço por m² fora da faixa mediana de 50% regional.'
                        }
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm animate-pulse"
                      >
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span>revisar valor</span>
                      </span>
                    )}

                    {/* Data de cadastro */}
                    {lead.criado_em && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>
                          {new Date(lead.criado_em).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* STATUS EDITÁVEL INLINE */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">
                      Status:
                    </span>

                    {isProprietario ? (
                      <div className="relative inline-flex items-center">
                        <select
                          value={lead.status}
                          disabled={isSalvando}
                          onChange={(e) => handleChangeStatus(lead, e.target.value)}
                          className={`appearance-none bg-[#070B14] border text-xs font-semibold rounded-xl pl-3 pr-8 py-1.5 cursor-pointer focus:outline-none transition-all ${
                            statusConfig.className
                          } ${isSalvando ? 'opacity-50 cursor-wait' : 'hover:border-[#22C7E0]'}`}
                        >
                          {OPCOES_STATUS.map((opcao) => (
                            <option
                              key={opcao}
                              value={opcao}
                              className="bg-[#070B14] text-slate-200"
                            >
                              {opcao}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-2.5 pointer-events-none text-slate-400">
                          {isSalvando ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#22C7E0]" />
                          ) : (
                            <Edit2 className="w-3 h-3" />
                          )}
                        </div>
                      </div>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.className}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
                        <span>{statusConfig.label}</span>
                      </span>
                    )}
                  </div>
                </div>
                {/* Linha 2: Dados Principais em Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  {/* Contato */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider block">
                      Contato
                    </span>
                    <p className="font-semibold text-white truncate">
                      {lead.nome || 'Nome não preenchido'}
                    </p>
                    <div className="flex items-center gap-1 text-slate-300 font-mono text-[11px]">
                      <Phone className="w-3 h-3 text-[#22C7E0]" />
                      <span>{lead.telefone || 'Sem telefone'}</span>
                    </div>
                    {lead.email && (
                      <div className="flex items-center gap-1 text-slate-400 text-[11px] truncate">
                        <Mail className="w-3 h-3 text-slate-500" />
                        <span className="truncate">{lead.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Localização e Tipo / Cidades */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider block">
                      {isProprietario ? 'Imóvel & Cidade' : 'Cidades de Interesse'}
                    </span>
                    {isProprietario ? (
                      <>
                        <p className="font-semibold text-white capitalize">
                          {lead.tipo_imovel || 'Não informado'}
                        </p>
                        <p className="text-slate-300">{lead.cidade || 'Não informada'}</p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-white">
                          {lead.cidades_interesse || 'Qualquer região'}
                        </p>
                        <p className="text-slate-400 capitalize">{lead.perfil || 'Investidor'}</p>
                      </>
                    )}
                  </div>

                  {/* Valores: Valor Estimado / Ticket */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider block">
                      {isProprietario ? 'Valor Estimado' : 'Ticket Pretendido'}
                    </span>
                    <p className="font-semibold text-[#22C7E0] text-sm">
                      {isProprietario
                        ? lead.valor_estimado
                          ? lead.valor_estimado.startsWith('R$')
                            ? lead.valor_estimado
                            : `R$ ${lead.valor_estimado}`
                          : 'A avaliar'
                        : lead.ticket || 'Não informado'}
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      {isProprietario
                        ? `Prazo: ${lead.prazo_desejado || 'Não especificado'}`
                        : `Decisão: ${lead.prazo_decisao || 'Flexível'}`}
                    </p>
                  </div>

                  {/* Motivo da Venda / Objetivo da Tese */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider block">
                      {isProprietario ? 'Motivo da Venda' : 'Objetivo da Tese'}
                    </span>
                    <p className="text-slate-300 font-medium">
                      {isProprietario
                        ? lead.motivo_venda || 'Não especificado'
                        : lead.objetivo || 'Renda / Revenda'}
                    </p>
                    {lead.mensagem && (
                      <p className="text-slate-400 text-[11px] line-clamp-2 italic">
                        "{lead.mensagem}"
                      </p>
                    )}
                  </div>
                </div>
                {/* Linha da Autorização de Venda e Checklist de Documentos (Proprietários) */}
                {isProprietario && (
                  <div className="pt-3 border-t border-slate-800/80 space-y-3">
                    {/* Resumo da autorização e status de documentos */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#070B14] p-3 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-3 flex-wrap text-xs">
                        <span className="font-semibold text-white flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-[#22C7E0]" />
                          <span>Controle de Entrada:</span>
                        </span>

                        <span className="text-slate-300">
                          Comissão:{' '}
                          <strong className="text-white">
                            {lead.autorizacao_comissao_percentual
                              ? `${lead.autorizacao_comissao_percentual}%`
                              : '6.0% (padrão)'}
                          </strong>{' '}
                          (paga por {lead.autorizacao_quem_paga || 'vendedor'})
                        </span>

                        {lead.autorizacao_prazo && (
                          <span className="text-slate-400">
                            Validade:{' '}
                            <strong className="text-slate-200">
                              {new Date(lead.autorizacao_prazo).toLocaleDateString('pt-BR')}
                            </strong>
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-slate-300">
                          Docs conferidos:{' '}
                          <strong
                            className={
                              lead.apto_para_ativar ? 'text-emerald-400' : 'text-amber-400'
                            }
                          >
                            {lead.total_docs_conferidos ?? 0} / {lead.total_docs_obrigatorios ?? 5}
                          </strong>
                        </span>

                        {lead.procuracao_necessaria && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px]">
                            Exige procuração
                          </span>
                        )}
                      </div>

                      {/* Botões de Ação: Abrir Checklist e Botão Ativar */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleChecklist(lead.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold border border-slate-700 transition-all cursor-pointer"
                        >
                          <span>
                            Checklist ({lead.total_docs_conferidos ?? 0}/
                            {lead.total_docs_obrigatorios ?? 5})
                          </span>
                          {leadChecklistAberto === lead.id ? (
                            <ChevronUp className="w-3.5 h-3.5 text-[#22C7E0]" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </button>

                        {/* BOTÃO ATIVAR NO MOTOR */}
                        <button
                          type="button"
                          disabled={
                            !lead.apto_para_ativar ||
                            lead.status === 'ativo' ||
                            ativandoLeadId === lead.id
                          }
                          onClick={() => handleAtivarImovel(lead.id, lead.protocolo)}
                          title={
                            lead.status === 'ativo'
                              ? 'Imóvel já está ativo no motor'
                              : !lead.apto_para_ativar
                                ? 'Exige autorização assinada e todos os documentos obrigatórios conferidos'
                                : 'Ativar imóvel no motor de compatibilidade'
                          }
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            lead.status === 'ativo'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                              : lead.apto_para_ativar
                                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer'
                                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                          }`}
                        >
                          {ativandoLeadId === lead.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Zap className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {lead.status === 'ativo' ? 'Ativo no motor' : 'Ativar no motor'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Painel Expansível de Conferência Documental */}
                    {leadChecklistAberto === lead.id && (
                      <div className="bg-[#070B14] rounded-xl border border-indigo-500/40 p-4 space-y-4 animate-fade-in">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                          <div>
                            <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-[#22C7E0]" />
                              <span>Conferência de Documentos Exigidos</span>
                            </h5>
                            <p className="text-[11px] text-slate-400">
                              Marque cada item como conferido ou recuse apontando o motivo para
                              notificar o proprietário.
                            </p>
                          </div>

                          {/* Alternar procuração */}
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleProcuracaoGestor(
                                lead.id,
                                Boolean(lead.procuracao_necessaria),
                              )
                            }
                            className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                              lead.procuracao_necessaria
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            {lead.procuracao_necessaria
                              ? '✓ Procuração marcada como necessária'
                              : '+ Marcar procuração como necessária'}
                          </button>
                        </div>

                        {carregandoDocs[lead.id] ? (
                          <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-[#22C7E0]" />
                            <span>Carregando arquivos e checklist...</span>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {(docsChecklist[lead.id] || []).map((doc) => {
                              const chaveMotivo = `${lead.id}_${doc.tipo_documento}`
                              const isProcessando = processandoAcaoDoc === chaveMotivo
                              const rotuloNome =
                                ROTULO_DOCUMENTO_LABELS[doc.tipo_documento] || doc.tipo_documento

                              return (
                                <div
                                  key={doc.id || doc.tipo_documento}
                                  className="p-3 rounded-xl bg-[#081226] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                                >
                                  {/* Documento info */}
                                  <div className="space-y-1 min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold text-white">{rotuloNome}</span>
                                      {doc.obrigatorio ? (
                                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                                          Obrigatório
                                        </span>
                                      ) : (
                                        <span className="text-[10px] uppercase font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                          Opcional / Disp.
                                        </span>
                                      )}

                                      {/* Status badge */}
                                      <span
                                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                          doc.status === 'conferido'
                                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                                            : doc.status === 'recusado'
                                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                                              : doc.status === 'enviado'
                                                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                                                : 'bg-slate-800 text-slate-400 border-slate-700'
                                        }`}
                                      >
                                        {doc.status}
                                      </span>
                                    </div>

                                    {/* Arquivo anexado */}
                                    {doc.arquivo_nome ? (
                                      <div className="flex items-center gap-2 text-slate-300 text-[11px] pt-0.5">
                                        <span className="truncate max-w-[260px] text-slate-200">
                                          📎 {doc.arquivo_nome}
                                        </span>
                                        {doc.arquivo_data_emissao && (
                                          <span className="text-amber-300">
                                            (Emissão:{' '}
                                            {new Date(doc.arquivo_data_emissao).toLocaleDateString(
                                              'pt-BR',
                                            )}
                                            )
                                          </span>
                                        )}
                                        {doc.urlAssinada && (
                                          <a
                                            href={doc.urlAssinada}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-[#22C7E0] hover:underline shrink-0"
                                          >
                                            <span>Abrir</span>
                                            <ExternalLink className="w-3 h-3" />
                                          </a>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-[11px] text-slate-500 italic">
                                        Nenhum arquivo enviado pelo proprietário ainda.
                                      </p>
                                    )}

                                    {/* Motivo de recusa se houver */}
                                    {doc.motivo_recusa && (
                                      <p className="text-[11px] text-rose-400 bg-rose-950/30 p-1.5 rounded border border-rose-900/40">
                                        Motivo de recusa: <strong>{doc.motivo_recusa}</strong>
                                      </p>
                                    )}
                                  </div>

                                  {/* Ações do Gestor: Conferir / Recusar com Motivo */}
                                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                                    {doc.status !== 'conferido' && (
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="text"
                                          placeholder="Motivo se for recusar..."
                                          value={motivosRecusa[chaveMotivo] || ''}
                                          onChange={(e) =>
                                            setMotivosRecusa((prev) => ({
                                              ...prev,
                                              [chaveMotivo]: e.target.value,
                                            }))
                                          }
                                          className="bg-[#070B14] border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] text-white w-48 placeholder-slate-500 focus:outline-none focus:border-rose-400"
                                        />
                                        <button
                                          type="button"
                                          disabled={isProcessando}
                                          onClick={() =>
                                            handleDecidirDoc(
                                              lead.id,
                                              doc.tipo_documento,
                                              'recusado',
                                            )
                                          }
                                          className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                                        >
                                          Recusar
                                        </button>
                                      </div>
                                    )}

                                    <button
                                      type="button"
                                      disabled={isProcessando || doc.status === 'conferido'}
                                      onClick={() =>
                                        handleDecidirDoc(lead.id, doc.tipo_documento, 'conferido')
                                      }
                                      className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                        doc.status === 'conferido'
                                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                                          : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 cursor-pointer'
                                      } disabled:opacity-50`}
                                    >
                                      {isProcessando ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                      )}
                                      <span>
                                        {doc.status === 'conferido'
                                          ? 'Conferido ✓'
                                          : 'Marcar Conferido'}
                                      </span>
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Feedback de impacto do status para o gestor e motivo do alerta */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-[#22C7E0]" />
                        <span>
                          O proprietário vê em tempo real este imóvel como "
                          <strong className="text-slate-200">{lead.status}</strong>" em sua área
                          privada.
                        </span>
                      </span>

                      {lead.alerta_valor === 'revisar valor' && lead.alerta_motivo && (
                        <span className="text-amber-400/90 text-[11px] bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-md">
                          {lead.alerta_motivo}
                        </span>
                      )}

                      <span className="font-mono text-slate-500">ID: {lead.id.slice(0, 8)}...</span>
                    </div>
                  </div>
                )}{' '}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
