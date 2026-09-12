import React, { useState, useEffect } from 'react'
import { Menu, X, ArrowRight } from 'lucide-react'
import korbixLogo from '@/assets/5.2-logo-sem-fundo-e9820.png'

interface HeaderProps {
  onOpenModal: (intent?: 'vender' | 'investir') => void
}

export const Header: React.FC<HeaderProps> = ({ onOpenModal }) => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<string>('')

  // Monitor scroll for header background blur and active anchor detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      setScrolled(scrollY > 20)

      // Section spy recalibrado com o offset do header ampliado
      const sections = [
        'diferenciais',
        'para-vender',
        'para-investir',
        'como-funciona',
        'compatibilidade',
      ]
      const isDesktop = window.innerWidth >= 1280
      const headerOffset = isDesktop ? 168 : window.innerWidth >= 1024 ? 152 : 136
      const scrollPosition = scrollY + headerOffset

      let currentActive = ''
      for (const id of sections) {
        const element = document.getElementById(id)
        if (element) {
          const top = element.offsetTop
          if (scrollPosition >= top) {
            currentActive = id
          }
        }
      }

      if (scrollY < 140) {
        setActiveSection('')
      } else {
        setActiveSection(currentActive)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { label: 'Para vender', href: '#para-vender', id: 'para-vender' },
    { label: 'Para investir', href: '#para-investir', id: 'para-investir' },
    { label: 'Como funciona', href: '#como-funciona', id: 'como-funciona' },
    { label: 'Compatibilidade', href: '#compatibilidade', id: 'compatibilidade' },
    { label: 'Diferenciais', href: '#diferenciais', id: 'diferenciais' },
  ]

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    setMobileMenuOpen(false)
    const targetId = href.replace('#', '')
    const element = document.getElementById(targetId)
    if (element) {
      // Offset recalibrado para a nova altura do header (128px mobile, 144px lg, 160px xl) + folga de 8px
      const width = window.innerWidth
      const yOffset = width >= 1280 ? -168 : width >= 1024 ? -152 : -136
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }
  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    setMobileMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-[128px] sm:h-[136px] md:h-[144px] lg:h-[152px] xl:h-[160px] transition-all duration-300 flex items-center ${
        scrolled
          ? 'bg-[#070B14]/95 backdrop-blur-md border-b border-[#081226] shadow-xl shadow-black/50'
          : 'bg-[#070B14]/85 backdrop-blur-sm border-b border-[#081226]/40'
      }`}
    >
      <div className="w-full max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-3 sm:gap-4 lg:gap-6">
        {/* Logo KORBIX no canto superior esquerdo - Dobrado de tamanho, preenchendo quase toda a altura do header */}
        <div className="flex items-center min-w-0 shrink-0 py-1 sm:py-1.5 h-full">
          <a
            href="#"
            onClick={handleLogoClick}
            className="group flex items-center h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22C7E0] rounded-xl transition-all duration-200"
            aria-label="KORBIX Inteligência Imobiliária - Início"
          >
            <img
              src={korbixLogo}
              alt="KORBIX Inteligência Imobiliária"
              className="h-[104px] xs:h-[112px] sm:h-[120px] md:h-[128px] lg:h-[136px] xl:h-[148px] w-auto max-w-[220px] xs:max-w-[240px] sm:max-w-[340px] md:max-w-[420px] lg:max-w-[520px] xl:max-w-[660px] object-contain drop-shadow-[0_0_22px_rgba(34,199,224,0.22)] group-hover:brightness-110 transition-all duration-200"
              loading="eager"
            />
          </a>
        </div>

        {/* Central Navigation (Desktop) - exibida a partir de xl para garantir convivência harmônica e sem colisão com o logo gigante */}
        <nav
          className="hidden xl:flex items-center gap-5 2xl:gap-7 shrink min-w-0"
          aria-label="Navegação principal"
        >
          {navItems.map((item) => {
            const isActive = activeSection === item.id
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className={`relative py-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap group ${
                  isActive ? 'text-white font-semibold' : 'text-slate-300 hover:text-white'
                }`}
              >
                {item.label}
                {/* Animated underline */}
                <span
                  className={`absolute bottom-0 left-0 h-[2px] bg-[#22C7E0] transition-all duration-200 ${
                    isActive ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                />
              </a>
            )
          })}
        </nav>

        {/* CTA Right Button (Desktop) & Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onOpenModal()}
            className="hidden md:inline-flex items-center justify-center gap-2 px-4 lg:px-5 py-2.5 min-h-[44px] rounded-xl bg-[#1A3A75] hover:bg-[#142E5E] active:bg-[#0F2347] text-white text-xs lg:text-sm font-semibold shadow-inner border border-white/10 hover:border-white/20 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer whitespace-nowrap"
          >
            <span>Começar agora</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Hamburger toggle com toque confortável 44x44 - visível até telas xl para navegação limpa */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2.5 min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-white/10 active:bg-white/15 transition-colors focus:outline-none focus:ring-2 focus:ring-[#22C7E0]"
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Drawer recalibrado para a nova altura do header */}
      {mobileMenuOpen && (
        <div className="xl:hidden fixed inset-0 top-[128px] sm:top-[136px] md:top-[144px] lg:top-[152px] z-40 bg-black/80 backdrop-blur-sm animate-fade-in">
          {' '}
          <div className="absolute right-0 top-0 bottom-0 w-[min(300px,85vw)] bg-[#070B14] border-l border-[#081226] p-6 flex flex-col justify-between shadow-2xl overflow-y-auto animate-fade-in">
            <div className="space-y-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-800">
                Navegação
              </div>
              <nav className="flex flex-col space-y-1">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className={`text-base font-medium transition-colors py-3 px-2 rounded-lg border-b border-slate-900 min-h-[44px] flex items-center ${
                      activeSection === item.id
                        ? 'text-[#22C7E0] font-semibold bg-white/5'
                        : 'text-slate-200 hover:text-[#22C7E0] active:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>

            <div className="pt-6 border-t border-slate-800 space-y-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  onOpenModal()
                }}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 min-h-[48px] rounded-xl bg-[#1A3A75] hover:bg-[#142E5E] active:bg-[#0F2347] text-white font-semibold text-sm shadow-inner border border-white/10 cursor-pointer"
              >
                <span>Começar agora</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <div className="text-[11px] text-center text-slate-400">
                Imóveis Inteligentes • {new Date().getFullYear()}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
