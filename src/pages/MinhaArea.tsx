import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import {
  buscarLeadsVinculados,
  buscarTesesInvestidorVinculadas,
  getRedirectPathByRole,
  LeadVinculado,
  TeseInvestidorVinculada,
  UserRole,
} from '@/services/profiles'
import { ImovelDetalhes } from '@/components/ImovelDetalhes'
import { InvestorArea } from '@/components/InvestorArea'
import { buscarOportunidadesInvestidor, OportunidadeInvestidor } from '@/services/investidor'
import {
  LogOut,
  ArrowLeft,
  Shield,
  TrendingUp,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  PlusCircle,
  RefreshCw,
} from 'lucide-react'
import korbixLogo from '@/assets/5.2-logo-sem-fundo-e9820.png'

interface MinhaAreaProps {
  forceGestor?: boolean
}

export default function MinhaArea({ forceGestor = false }: MinhaAreaProps) {
  const { user, profile, signOut, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [leads, setLeads] = useState<LeadVinculado[]>([])
  const [loadingLeads, setLoadingLeads] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  // Estados específicos para investidores
  const [teses, setTeses] = useState<TeseInvestidorVinculada[]>([])
  const [oportunidades, setOportunidades] = useState<OportunidadeInvestidor[]>([])
  const [loadingInvestidor, setLoadingInvestidor] = useState(false)

  // Tipo efetivo (se a URL for /painel, trata como visão de gestor)
  const tipoEfetivo: UserRole =
    forceGestor || location.pathname.startsWith('/painel')
      ? 'gestor'
      : profile?.tipo || 'proprietario'

  // Redirecionamento de proteção: se não houver usuário após carregar, vai para /login
  // E se a role do usuário não for proprietario e estiver acessando /minha-area, redirecionar conforme getRedirectPathByRole
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true })
      return
    }

    if (!authLoading && user && profile && !forceGestor) {
      // Se for gestor acessando /minha-area, redireciona para /painel
      if (profile.tipo === 'gestor' && location.pathname === '/minha-area') {
        const dest = getRedirectPathByRole('gestor')
        navigate(dest, { replace: true })
      }
    }
  }, [authLoading, user, profile, forceGestor, location.pathname, navigate])

  // Carrega dados de acordo com o papel do usuário
  const carregarDadosInvestidor = async (userId: string) => {
    setLoadingInvestidor(true)
    try {
      const [tesesRes, opsRes] = await Promise.all([
        buscarTesesInvestidorVinculadas(userId),
        buscarOportunidadesInvestidor(),
      ])
      setTeses(tesesRes)
      setOportunidades(opsRes)
    } catch (err) {
      console.warn('Erro ao carregar dados do investidor:', err)
    } finally {
      setLoadingInvestidor(false)
    }
  }

  // Busca leads vinculados (proprietário) ou teses/oportunidades (investidor)
  useEffect(() => {
    if (user?.id) {
      if (tipoEfetivo === 'investidor') {
        carregarDadosInvestidor(user.id)
      } else {
        setLoadingLeads(true)
        buscarLeadsVinculados(user.id)
          .then((data) => setLeads(data))
          .catch(() => setLeads([]))
          .finally(() => setLoadingLeads(false))
      }
    }
  }, [user?.id, tipoEfetivo])

  const handleSignOut = async () => {
    setLoggingOut(true)
    await signOut()
    setLoggingOut(false)
    navigate('/login', { replace: true })
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center text-white">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-[#22C7E0]" />
          <span className="text-sm text-slate-300">Carregando seus dados...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const roleLabels: Record<UserRole, { title: string; badgeClass: string; icon: typeof User }> = {
    proprietario: {
      title: 'Proprietário',
      badgeClass: 'bg-[#22C7E0]/15 text-[#22C7E0] border-[#22C7E0]/40',
      icon: User,
    },
    investidor: {
      title: 'Investidor',
      badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
      icon: TrendingUp,
    },
    gestor: {
      title: 'Gestor',
      badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
      icon: Shield,
    },
  }

  const currentRoleConfig = roleLabels[tipoEfetivo] || roleLabels.proprietario
  const RoleIcon = currentRoleConfig.icon

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col justify-between text-white font-sans relative overflow-hidden">
      {/* Background glow suave */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#22C7E0]/8 rounded-full blur-[140px] pointer-events-none" />

      {/* Barra Superior Mínima */}
      <header className="relative z-10 border-b border-[#081226] bg-[#070B14]/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link
            to="/"
            className="group flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22C7E0] rounded-xl"
            aria-label="KORBIX - Página inicial"
          >
            <img
              src={korbixLogo}
              alt="KORBIX Inteligência Imobiliária"
              className="h-10 sm:h-11 w-auto object-contain drop-shadow-[0_0_16px_rgba(34,199,224,0.25)] group-hover:brightness-110 transition-all"
            />
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-2 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ver site</span>
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={loggingOut}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/25 border border-red-500/30 text-red-300 text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
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

      {/* Conteúdo Central Mínimo Compartilhado */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col justify-center">
        <div className="bg-[#081226] border border-[#1A3A75] rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-md space-y-6 animate-fade-in">
          {/* Header da Área */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Minha área
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${currentRoleConfig.badgeClass}`}
                >
                  <RoleIcon className="w-3.5 h-3.5" />
                  <span>{currentRoleConfig.title}</span>
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Conectado como <span className="text-slate-200 font-medium">{user.email}</span>
              </p>
            </div>
          </div>

          {/* Visão Adaptativa: Proprietário */}
          {tipoEfetivo === 'proprietario' && (
            <div className="space-y-6">
              {/* Badge de vínculo com feedback claro */}
              {loadingLeads ? (
                <div className="p-4 rounded-xl bg-[#070B14] border border-slate-800 flex items-center gap-3 text-xs text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-[#22C7E0]" />
                  <span>Consultando protocolos vinculados...</span>
                </div>
              ) : leads.length > 0 ? (
                <div className="space-y-6">
                  {/* Badge / Confirmação de Vínculo */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-[#070B14] border border-[#22C7E0]/30 shadow-[0_0_14px_rgba(34,199,224,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-[#22C7E0] shrink-0" />
                      <span>
                        Seu cadastro{' '}
                        <strong className="text-[#22C7E0] font-mono tracking-wide">
                          {leads[0].protocolo || 'KX-XXXX'}
                        </strong>{' '}
                        está vinculado a esta conta
                        {leads.length > 1 &&
                          ` (+${leads.length - 1} outro${leads.length > 2 ? 's' : ''})`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (user?.id) {
                          setLoadingLeads(true)
                          buscarLeadsVinculados(user.id)
                            .then((data) => setLeads(data))
                            .finally(() => setLoadingLeads(false))
                        }
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Atualizar</span>
                    </button>
                  </div>

                  {/* Exibição detalhada do imóvel principal e demais se houver */}
                  {leads.map((leadItem, index) => (
                    <div key={leadItem.id} className="space-y-6">
                      {leads.length > 1 && (
                        <div className="pt-4 border-t border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Imóvel #{index + 1} — {leadItem.protocolo || 'KX-XXXX'}
                        </div>
                      )}
                      <ImovelDetalhes lead={leadItem} />
                    </div>
                  ))}
                </div>
              ) : (
                /* Estado vazio amigável quando o usuário logado NÃO tem lead vinculado */
                <div className="p-6 sm:p-8 rounded-2xl bg-[#070B14] border border-slate-800 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                    <AlertCircle className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Nenhum imóvel vinculado a este e-mail ainda
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                      Cadastre seu imóvel na plataforma KORBIX para receber avaliação técnica e
                      conectar-se a investidores com capital pronto para aquisição rápida.
                    </p>
                  </div>
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                      to="/"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#22C7E0] hover:bg-[#1fb3ca] text-[#070B14] font-bold text-xs sm:text-sm shadow-[0_0_18px_rgba(34,199,224,0.3)] transition-all cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Cadastrar meu imóvel agora</span>
                    </Link>
                    <Link
                      to="/calculadora"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#081226] hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs sm:text-sm transition-colors"
                    >
                      <span>Calcular custo de imóvel parado</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Visão Adaptativa: Investidor */}
          {tipoEfetivo === 'investidor' && (
            <InvestorArea
              teses={teses}
              oportunidades={oportunidades}
              loading={loadingInvestidor}
              onRefresh={() => {
                if (user?.id) {
                  carregarDadosInvestidor(user.id)
                }
              }}
            />
          )}

          {/* Visão Adaptativa: Gestor */}
          {tipoEfetivo === 'gestor' && (
            <div className="p-4 sm:p-5 rounded-xl bg-[#070B14] border border-slate-800 text-sm text-slate-300 space-y-2">
              <div className="flex items-center gap-2 font-medium text-purple-400">
                <Shield className="w-4 h-4" />
                <span>Painel de Gestor</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Acesso operacional autenticado. O módulo analítico completo do gestor será
                disponibilizado na próxima etapa de evolução da plataforma.
              </p>
            </div>
          )}

          {/* Rodapé Interno com Ações Mínimas */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <span>KORBIX Inteligência Imobiliária</span>
            <div className="flex items-center gap-4">
              <Link to="/" className="text-[#22C7E0] hover:underline">
                Voltar à página inicial
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer simples */}
      <footer className="relative z-10 py-6 text-center text-xs text-slate-500">
        Ambiente seguro • KORBIX © {new Date().getFullYear()}
      </footer>
    </div>
  )
}
