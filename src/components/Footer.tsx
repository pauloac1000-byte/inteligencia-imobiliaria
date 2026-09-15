import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  ShieldCheck,
  Mail,
  Phone,
  FileBadge,
  Calculator,
  TrendingUp,
} from 'lucide-react'
import { KORBIX_WHATSAPP_NUMBER, KORBIX_WHATSAPP_DISPLAY } from '@/services/leads'
import korbixLogo from '@/assets/5-contorno-e238f.png'

interface FooterProps {
  onOpenModal?: (intent?: 'vender' | 'investir') => void
}

export const Footer: React.FC<FooterProps> = ({ onOpenModal }) => {
  const location = useLocation()
  const navigate = useNavigate()

  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault()
    if (location.pathname !== '/') {
      navigate('/')
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    if (location.pathname !== '/') {
      navigate('/#' + targetId)
      return
    }

    const element = document.getElementById(targetId)
    if (element) {
      const width = window.innerWidth
      const yOffset = width >= 768 ? -80 : -72
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  const handleCalculadoraClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Se o usuário clicar com modificadores (abrir em nova aba etc.), deixa o navegador agir
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return
    }
    // Tenta navegação interna suave pelo React Router, com fallback nativo se falhar
    try {
      e.preventDefault()
      navigate('/calculadora')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      // Fallback: se o router falhar (ex.: contexto de iframe restrito), navega via window.location
      window.location.href = '/calculadora'
    }
  }

  const handleSimuladorClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return
    }
    try {
      e.preventDefault()
      navigate('/simulador-de-retorno')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      window.location.href = '/simulador-de-retorno'
    }
  }

  return (
    <footer className="bg-[#070B14] text-white pt-12 sm:pt-16 pb-12 px-3.5 sm:px-6 lg:px-8 border-t border-slate-900">
      <div className="max-w-[1200px] mx-auto space-y-8 sm:space-y-10">
        {/* Banner CTA em Destaque da Calculadora - Proprietário */}
        <section aria-label="Calculadora de Custo de Imóvel Parado">
          <a
            href="/calculadora"
            onClick={handleCalculadoraClick}
            className="group relative block rounded-2xl bg-[#081226] border border-[#22C7E0] p-5 sm:p-6 lg:p-7 shadow-[0_0_24px_rgba(34,199,224,0.18)] hover:shadow-[0_0_36px_rgba(34,199,224,0.32)] transition-all duration-300 hover:border-[#22C7E0] hover:-translate-y-0.5 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22C7E0]"
          >
            {/* Efeito sutil de iluminação decorativa no canto superior direito */}
            <div
              className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#22C7E0]/15 blur-3xl pointer-events-none group-hover:bg-[#22C7E0]/25 transition-colors"
              aria-hidden="true"
            />

            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
              {/* Lado Esquerdo: Ícone + Título + Subtítulo */}
              <div className="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#070B14] border border-[#22C7E0]/40 flex items-center justify-center text-[#22C7E0] group-hover:scale-105 group-hover:border-[#22C7E0] transition-all duration-300 shrink-0 shadow-[0_0_14px_rgba(34,199,224,0.22)]">
                  <Calculator className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#22C7E0] mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C7E0] shadow-[0_0_6px_#22C7E0]" />
                    <span>Ferramenta Gratuita</span>
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-white group-hover:text-white transition-colors">
                    Quanto custa seu imóvel parado?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Simule em 30 segundos o prejuízo mensal — sem cadastro
                  </p>
                </div>
              </div>

              {/* Lado Direito: Botão primário ciano com glow */}
              <div className="shrink-0 w-full md:w-auto pt-1 md:pt-0">
                <span className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 min-h-[46px] rounded-xl bg-[#22C7E0] hover:bg-[#32d4eb] active:bg-[#1bb5cc] text-[#070B14] text-xs sm:text-sm font-bold tracking-wide shadow-[0_0_20px_rgba(34,199,224,0.45)] group-hover:shadow-[0_0_30px_rgba(34,199,224,0.7)] border border-white/20 transition-all duration-300 cursor-pointer">
                  <span>Abrir calculadora</span>
                  <ArrowUpRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </div>
          </a>
        </section>

        {/* Banner CTA em Destaque do Simulador de Retorno - Investidor */}
        <section aria-label="Simulador de Retorno para Investidores">
          <a
            href="/simulador-de-retorno"
            onClick={handleSimuladorClick}
            className="group relative block rounded-2xl bg-[#081226] border border-[#22C7E0]/60 hover:border-[#22C7E0] p-5 sm:p-6 lg:p-7 shadow-[0_0_24px_rgba(34,199,224,0.14)] hover:shadow-[0_0_36px_rgba(34,199,224,0.28)] transition-all duration-300 hover:-translate-y-0.5 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22C7E0]"
          >
            {/* Efeito sutil de iluminação decorativa no canto superior direito */}
            <div
              className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#22C7E0]/15 blur-3xl pointer-events-none group-hover:bg-[#22C7E0]/25 transition-colors"
              aria-hidden="true"
            />

            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
              {/* Lado Esquerdo: Ícone + Título + Subtítulo */}
              <div className="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#070B14] border border-[#22C7E0]/40 flex items-center justify-center text-[#22C7E0] group-hover:scale-105 group-hover:border-[#22C7E0] transition-all duration-300 shrink-0 shadow-[0_0_14px_rgba(34,199,224,0.22)]">
                  <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#22C7E0] mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C7E0] shadow-[0_0_6px_#22C7E0]" />
                    <span>Para Investidores</span>
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-white group-hover:text-white transition-colors">
                    Quanto rende investir em imóveis?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Simule o retorno do seu capital em 30 segundos — sem cadastro
                  </p>
                </div>
              </div>

              {/* Lado Direito: Botão primário ciano com glow */}
              <div className="shrink-0 w-full md:w-auto pt-1 md:pt-0">
                <span className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 min-h-[46px] rounded-xl bg-[#22C7E0] hover:bg-[#32d4eb] active:bg-[#1bb5cc] text-[#070B14] text-xs sm:text-sm font-bold tracking-wide shadow-[0_0_20px_rgba(34,199,224,0.45)] group-hover:shadow-[0_0_30px_rgba(34,199,224,0.7)] border border-white/20 transition-all duration-300 cursor-pointer">
                  <span>Abrir simulador</span>
                  <ArrowUpRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </div>
          </a>
        </section>

        {/* Grid Principal do Rodapé */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Marca + Tagline do Projeto */}
          <div className="md:col-span-4 space-y-3.5 sm:space-y-4">
            <div className="space-y-2">
              <a
                href="#"
                onClick={scrollToTop}
                className="flex items-center group w-fit focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22C7E0] rounded-lg p-0.5 transition-opacity hover:opacity-95"
                aria-label="KORBIX - Voltar ao topo"
              >
                <div className="relative flex items-center">
                  <img
                    src={korbixLogo}
                    alt="KORBIX"
                    className="h-16 sm:h-20 md:h-24 w-auto max-w-[240px] sm:max-w-[280px] md:max-w-[320px] object-contain drop-shadow-[0_0_16px_rgba(34,199,224,0.15)]"
                    loading="lazy"
                  />
                </div>
              </a>

              {/* Linha de termos de posicionamento da marca */}
              <div
                className="flex flex-wrap items-center gap-x-1.5 sm:gap-x-2 gap-y-1 text-[10px] sm:text-[11px] md:text-xs font-semibold tracking-wider text-slate-300 uppercase select-none"
                aria-label="Análise, Estratégia, Oportunidades, Resultados"
              >
                <span className="whitespace-nowrap">ANÁLISE</span>
                <span className="text-[#22C7E0] font-bold" aria-hidden="true">
                  ·
                </span>
                <span className="whitespace-nowrap">ESTRATÉGIA</span>
                <span className="text-[#22C7E0] font-bold" aria-hidden="true">
                  ·
                </span>
                <span className="whitespace-nowrap">OPORTUNIDADES</span>
                <span className="text-[#22C7E0] font-bold" aria-hidden="true">
                  ·
                </span>
                <span className="whitespace-nowrap">RESULTADOS</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Nossa mecânica de dados cruza perfil do imóvel com objetivo de compra de milhares de
              investidores. A compatibilidade precisa guia a ponte entre você e a oportunidade
              certa.
            </p>

            <div className="pt-1 flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-[#22C7E0] shrink-0" />
              <span className="leading-tight">Operações fundamentadas em dados • Brasil</span>
            </div>
          </div>

          {/* Navegação com as âncoras existentes: Para vender, Para investir, Como funciona, Diferenciais */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Navegação
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a
                  href="#para-vender"
                  onClick={(e) => handleNavClick(e, 'para-vender')}
                  className="hover:text-[#22C7E0] transition-colors inline-flex items-center gap-2 py-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C7E0] shrink-0 shadow-[0_0_6px_#22C7E0]" />
                  <span>Para vender</span>
                </a>
              </li>
              <li>
                <a
                  href="#para-investir"
                  onClick={(e) => handleNavClick(e, 'para-investir')}
                  className="hover:text-[#22C7E0] transition-colors inline-flex items-center gap-2 py-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C7E0] shrink-0 shadow-[0_0_6px_#22C7E0]" />
                  <span>Para investir</span>
                </a>
              </li>
              <li>
                <a
                  href="#como-funciona"
                  onClick={(e) => handleNavClick(e, 'como-funciona')}
                  className="hover:text-[#22C7E0] transition-colors inline-flex items-center gap-2 py-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C7E0] shrink-0 shadow-[0_0_6px_#22C7E0]" />
                  <span>Como funciona</span>
                </a>
              </li>
              <li>
                <a
                  href="#diferenciais"
                  onClick={(e) => handleNavClick(e, 'diferenciais')}
                  className="hover:text-[#22C7E0] transition-colors inline-flex items-center gap-2 py-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C7E0] shrink-0 shadow-[0_0_6px_#22C7E0]" />
                  <span>Diferenciais</span>
                </a>
              </li>
              <li>
                <a
                  href="#compatibilidade"
                  onClick={(e) => handleNavClick(e, 'compatibilidade')}
                  className="hover:text-[#22C7E0] transition-colors inline-flex items-center gap-2 py-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C7E0] shrink-0 shadow-[0_0_6px_#22C7E0]" />
                  <span>Compatibilidade</span>
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  onClick={(e) => handleNavClick(e, 'faq')}
                  className="hover:text-[#22C7E0] transition-colors inline-flex items-center gap-2 py-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C7E0] shrink-0 shadow-[0_0_6px_#22C7E0]" />
                  <span>Perguntas frequentes</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Bloco de Credibilidade e Contato com CRECI, WhatsApp e E-mail */}
          <div className="md:col-span-5 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Credibilidade & Contato
            </h4>

            {/* Informações de Contato Oficiais (campos ainda não definidos como [A DEFINIR]) */}
            <div className="space-y-2.5 text-xs text-slate-300 bg-[#081226] border border-slate-800 p-3.5 sm:p-4 rounded-xl shadow-lg">
              <div className="flex items-center gap-2.5">
                <FileBadge className="w-4 h-4 text-[#22C7E0] shrink-0" />
                <span className="text-slate-400">CRECI:</span>
                <span className="font-mono text-white font-medium">[A DEFINIR]</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#22C7E0] shrink-0" />
                <span className="text-slate-400">WhatsApp:</span>
                <a
                  href={`https://wa.me/${KORBIX_WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Gostaria de falar com a equipe da KORBIX.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-white font-medium hover:text-[#22C7E0] transition-colors"
                >
                  {KORBIX_WHATSAPP_DISPLAY}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#22C7E0] shrink-0" />
                <span className="text-slate-400">E-mail:</span>
                <span className="font-mono text-white font-medium break-all">[A DEFINIR]</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Pronto para colocar seus dados a favor de um fechamento ágil e seguro?
            </p>

            <a
              href={`https://wa.me/${KORBIX_WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Gostaria de falar com um especialista da KORBIX sobre oportunidades e imóveis.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] rounded-lg bg-[#1A3A75] hover:bg-[#142E5E] active:bg-[#0F2347] text-white text-xs sm:text-sm font-semibold shadow-inner border border-white/10 transition-all cursor-pointer"
            >
              <span>Falar no WhatsApp</span>
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
            </a>

            {/* Links informativos (privacidade, termos, contato) mantidos */}
            <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-400">
              <Link
                to="/politica-de-privacidade"
                className="hover:text-[#22C7E0] transition-colors py-1"
              >
                Privacidade
              </Link>
              <span>•</span>
              <span className="hover:text-white cursor-pointer transition-colors py-1">
                Termos de Uso
              </span>
              <span>•</span>
              <span className="hover:text-white cursor-pointer transition-colors py-1">
                Compliance
              </span>
            </div>
          </div>
        </div>

        {/* Barra Inferior com Copyright Dinâmico */}
        <div className="pt-6 sm:pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 text-center sm:text-left">
          <div>
            © {new Date().getFullYear()} Imóveis Inteligentes. Todos os direitos reservados.
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22C7E0] shrink-0 shadow-[0_0_6px_#22C7E0]" />
            <span>Compatibilidade calculada com 48 variáveis analíticas</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
