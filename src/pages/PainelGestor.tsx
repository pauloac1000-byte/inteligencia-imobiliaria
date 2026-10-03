import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import {
  gestorListarLeads,
  gestorAtualizarStatusLead,
  gestorListarMatches,
  gestorDecidirMatch,
  GestorLeadItem,
  GestorMatchItem,
  verificarSeGestor,
} from '@/services/gestor'
import { StatusImovelLead } from '@/services/profiles'
import { GestorLeadsTab } from '@/components/GestorLeadsTab'
import { GestorMatchesTab } from '@/components/GestorMatchesTab'
import { GestorFunilTab } from '@/components/GestorFunilTab'
import { GestorRegioesTab } from '@/components/GestorRegioesTab'
import {
  Shield,
  Users,
  GitCompare,
  TrendingUp,
  Building,
  Filter,
  RefreshCw,
  LogOut,
  ArrowLeft,
  Loader2,
  AlertOctagon,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import korbixLogo from '@/assets/5.2-logo-sem-fundo-e9820.png'
import { useToast } from '@/hooks/use-toast'

export default function PainelGestor() {
  const { user, profile, signOut, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [abaAtiva, setAbaAtiva] = useState<'leads' | 'matches' | 'funil' | 'regioes'>('leads')
  const [leads, setLeads] = useState<GestorLeadItem[]>([])
  const [matches, setMatches] = useState<GestorMatchItem[]>([])
  const [loadingDados, setLoadingDados] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const [acessoNegado, setAcessoNegado] = useState(false)

  // 1. Verificação de autenticação e proteção estrita: apenas gestores podem ver esta rota
  useEffect(() => {
    if (authLoading) return

    if (!user) {
      // Usuário não logado vai para /login
      navigate('/login', { replace: true })
      return
    }

    if (profile && profile.tipo !== 'gestor') {
      // Perfil não é gestor: bloqueia imediatamente e redireciona
      setAcessoNegado(true)
      const redirectDest = profile.tipo === 'investidor' ? '/minha-area' : '/minha-area'
      setTimeout(() => {
        navigate(redirectDest, { replace: true })
      }, 1500)
    }
  }, [authLoading, user, profile, navigate])

  // 2. Carrega todos os dados do painel (leads + matches)
  const carregarDados = async () => {
    setLoadingDados(true)
    try {
      const [leadsRes, matchesRes] = await Promise.all([
        gestorListarLeads().catch((err) => {
          console.error('Erro ao listar leads:', err)
          return []
        }),
        gestorListarMatches().catch((err) => {
          console.error('Erro ao listar matches:', err)
          return []
        }),
      ])
      setLeads(leadsRes)
      setMatches(matchesRes)
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar painel',
        description: err.message || 'Falha ao sincronizar dados com o servidor.',
        variant: 'destructive',
      })
    } finally {
      setLoadingDados(false)
    }
  }

  useEffect(() => {
    if (user && profile?.tipo === 'gestor') {
      carregarDados()
    }
  }, [user, profile?.tipo])

  // Handlers para ações inline com persistência
  const handleAtualizarStatusLead = async (
    leadId: string,
    novoStatus: StatusImovelLead | string,
  ) => {
    await gestorAtualizarStatusLead(leadId, novoStatus)
    // Atualiza estado local imediatamente
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: novoStatus } : l)))
    // Se mudou status de lead de venda, recarrega matches pois o trigger de compatibilidade pode ter rodado
    gestorListarMatches()
      .then((m) => setMatches(m))
      .catch(() => {})
  }

  const handleDecidirMatch = async (
    compatibilidadeId: string,
    acao: 'aprovar' | 'descartar' | 'pendente',
  ) => {
    await gestorDecidirMatch(compatibilidadeId, acao)
    await carregarDados()
  }

  const handleSignOut = async () => {
    setLoggingOut(true)
    await signOut()
    setLoggingOut(false)
    navigate('/login', { replace: true })
  }

  // Estado de carregamento do auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center text-white">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-[#22C7E0]" />
          <span className="text-sm text-slate-300">Validando credenciais de gestor...</span>
        </div>
      </div>
    )
  }

  // Estado de acesso negado
  if (acessoNegado || (profile && profile.tipo !== 'gestor')) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center text-white p-4">
        <div className="max-w-md w-full bg-[#081226] border border-red-500/30 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/40 flex items-center justify-center mx-auto text-red-400">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Acesso Restrito ao Gestor</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Sua conta (<span className="text-slate-200">{user?.email}</span>) não possui permissão
            de gestor. Redirecionando para sua área correspondente...
          </p>
          <div className="pt-2 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-[#22C7E0]" />
          </div>
        </div>
      </div>
    )
  }

  // Métricas rápidas do dashboard
  const metricas = {
    totalLeads: leads.length,
    leadsProprietario: leads.filter((l) => l.rota === 'proprietario').length,
    leadsInvestidor: leads.filter((l) => l.rota === 'investidor').length,
    totalMatches: matches.length,
    matchesAprovados: matches.filter((m) => m.status_match === 'aprovado').length,
    matchesAltaCompat: matches.filter((m) => m.percentual >= 70).length,
  }

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col justify-between text-white font-sans relative overflow-x-hidden">
      {/* Background Glows Tech-Midnight */}
      <div className="absolute top-10 left-1/3 -translate-x-1/2 w-[700px] h-[350px] bg-[#22C7E0]/6 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-40 right-10 w-[500px] h-[300px] bg-[#1A3A75]/25 rounded-full blur-[140px] pointer-events-none" />

      {/* Barra de Navegação Superior do Gestor */}
      <header className="relative z-10 border-b border-[#081226] bg-[#070B14]/85 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              to="/"
              className="group flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22C7E0] rounded-xl"
              aria-label="KORBIX - Página inicial"
            >
              <img
                src={korbixLogo}
                alt="KORBIX Inteligência Imobiliária"
                className="h-9 sm:h-10 w-auto object-contain drop-shadow-[0_0_16px_rgba(34,199,224,0.25)] group-hover:brightness-110 transition-all"
              />
            </Link>

            <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-slate-800">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/40">
                <Shield className="w-3.5 h-3.5" />
                <span>Painel do Gestor</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={carregarDados}
              disabled={loadingDados}
              className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-[#081226] transition-colors cursor-pointer disabled:opacity-50"
              title="Recarregar dados"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loadingDados ? 'animate-spin text-[#22C7E0]' : ''}`}
              />
              <span className="hidden sm:inline">Atualizar</span>
            </button>

            <Link
              to="/"
              className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-2 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ver landing page</span>
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={loggingOut}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/25 border border-red-500/30 text-red-300 text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              {loggingOut ? (
                <Loader2 className="w-4 h-4 animate-spin text-red-300" />
              ) : (
                <LogOut className="w-4 h-4 text-red-300" />
              )}
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal do Painel */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Topo: Título e Métricas Rápidas */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
                <span>Operação KORBIX</span>
                <span className="text-xs font-mono font-normal text-[#22C7E0] bg-[#22C7E0]/10 border border-[#22C7E0]/30 px-2 py-0.5 rounded">
                  v2.0 Gestão
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Central de triagem de leads, gestão de fluxo dos imóveis e homologação de matches.
              </p>
            </div>
            <div className="text-xs text-slate-400">
              Conectado como <strong className="text-slate-200">{user?.email}</strong>
            </div>
          </div>

          {/* Cards de Métricas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-xl bg-[#081226] border border-[#1A3A75] space-y-1">
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                Total de Leads
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-bold font-mono text-white">
                  {metricas.totalLeads}
                </span>
                <span className="text-[11px] text-[#22C7E0]">
                  {metricas.leadsProprietario} prop. / {metricas.leadsInvestidor} inv.
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#081226] border border-[#1A3A75] space-y-1">
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                Matches Calculados
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-bold font-mono text-[#22C7E0]">
                  {metricas.totalMatches}
                </span>
                <span className="text-[11px] text-slate-400">pares auditados</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#081226] border border-[#1A3A75] space-y-1">
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                Matches Aprovados
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
                  {metricas.matchesAprovados}
                </span>
                <span className="text-[11px] text-emerald-400/80">homologados</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#081226] border border-[#1A3A75] space-y-1">
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                Alta Compatibilidade (≥70%)
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-bold font-mono text-purple-400">
                  {metricas.matchesAltaCompat}
                </span>
                <span className="text-[11px] text-purple-400/80">prioritários</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navegação por Abas (Leads vs Matches vs Funil) */}
        <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto">
          <button
            type="button"
            onClick={() => setAbaAtiva('leads')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
              abaAtiva === 'leads'
                ? 'border-[#22C7E0] text-[#22C7E0] bg-[#22C7E0]/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Lista de Leads ({leads.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('matches')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
              abaAtiva === 'matches'
                ? 'border-[#22C7E0] text-[#22C7E0] bg-[#22C7E0]/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitCompare className="w-4 h-4" />
            <span>Matches Imóvel × Investidor ({matches.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('funil')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
              abaAtiva === 'funil'
                ? 'border-[#22C7E0] text-[#22C7E0] bg-[#22C7E0]/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Filter className="w-4 h-4 text-[#22C7E0]" />
            <span>Métricas do Funil</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('regioes')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
              abaAtiva === 'regioes'
                ? 'border-[#22C7E0] text-[#22C7E0] bg-[#22C7E0]/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#22C7E0]" />
            <span>Atalhos de Região</span>
          </button>
        </div>

        {/* Conteúdo da Aba Selecionada */}
        {abaAtiva === 'leads' && (
          <GestorLeadsTab
            leads={leads}
            loading={loadingDados}
            onAtualizarStatus={handleAtualizarStatusLead}
            onRecarregar={carregarDados}
          />
        )}

        {abaAtiva === 'matches' && (
          <GestorMatchesTab
            matches={matches}
            loading={loadingDados}
            onDecidirMatch={handleDecidirMatch}
            onRecarregar={carregarDados}
          />
        )}

        {abaAtiva === 'funil' && <GestorFunilTab onRecarregar={carregarDados} />}

        {abaAtiva === 'regioes' && <GestorRegioesTab />}
      </main>

      {/* Footer do Painel */}
      <footer className="relative z-10 py-6 text-center text-xs text-slate-500 border-t border-[#081226]">
        KORBIX Inteligência Imobiliária • Painel Gestor Seguro • RLS + RPC Security Definer
      </footer>
    </div>
  )
}
