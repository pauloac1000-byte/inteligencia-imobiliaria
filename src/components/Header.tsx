import React, { useState, useEffect } from 'react'
import { Menu, X, ArrowRight } from 'lucide-react'

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
      setScrolled(scrollY > 40)

      // Section spy
      const sections = ['diferenciais', 'para-vender', 'para-investir', 'como-funciona']
      const scrollPosition = scrollY + 120

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

      if (scrollY < 200) {
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
    { label: 'Diferenciais', href: '#diferenciais', id: 'diferenciais' },
  ]

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    setMobileMenuOpen(false)
    const targetId = href.replace('#', '')
    const element = document.getElementById(targetId)
    if (element) {
      const yOffset = -76
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-[72px] transition-all duration-300 flex items-center ${
        scrolled
          ? 'bg-[#0B1F3A]/90 backdrop-blur-md border-b border-[#12294A] shadow-lg shadow-black/20'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="w-full max-w-[1200px] mx-auto px-6 flex items-center justify-between">
        {/* Logo "Imóveis Inteligentes" */}
        <a
          href="#"
          onClick={handleLogoClick}
          className="group flex items-center gap-3 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] rounded-lg py-1 px-1"
          aria-label="Imóveis Inteligentes - Início"
        >
          {/* Custom SVG Icon: House with Data Connected Node */}
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#12294A] to-[#0B1F3A] border border-[#2563EB]/40 shadow-sm group-hover:border-[#22D3EE] transition-colors">
            <svg
              className="w-5 h-5 text-[#22D3EE]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* House outline */}
              <path d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20V10.5z" />
              {/* Data line inside house */}
              <path d="M7 16h4" />
              <path d="M11 16l3-4" />
              <path d="M14 12h3" />
            </svg>
            {/* Glowing data point node */}
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#22D3EE] rounded-full ring-2 ring-[#0B1F3A] animate-pulse" />
          </div>

          <div className="flex flex-col">
            <span className="font-bold text-lg sm:text-xl tracking-tight text-white flex items-center gap-1">
              Imóveis
              <span className="text-[#22D3EE] font-bold">Inteligentes</span>
            </span>
            <span className="hidden sm:block text-[10px] tracking-wider uppercase text-slate-400 font-medium -mt-1">
              Inteligência imobiliária
            </span>
          </div>
        </a>

        {/* Central Navigation (Desktop) */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Navegação principal">
          {navItems.map((item) => {
            const isActive = activeSection === item.id
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className={`relative py-2 text-sm font-medium transition-colors duration-200 group ${
                  isActive ? 'text-white font-semibold' : 'text-slate-300 hover:text-white'
                }`}
              >
                {item.label}
                {/* Animated underline */}
                <span
                  className={`absolute bottom-0 left-0 h-[2px] bg-[#22D3EE] transition-all duration-200 ${
                    isActive ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                />
              </a>
            )
          })}
        </nav>

        {/* CTA Right Button (Desktop) & Mobile Hamburger */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onOpenModal()}
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-sm font-semibold shadow-md hover:shadow-lg hover:shadow-[#2563EB]/30 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <span>Começar agora</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Mobile Hamburger toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#22D3EE]"
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[72px] z-40 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="absolute right-0 top-0 bottom-0 w-[280px] bg-[#0B1F3A] border-l border-[#12294A] p-6 flex flex-col justify-between shadow-2xl animate-slide-left">
            <div className="space-y-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-700">
                Navegação
              </div>
              <nav className="flex flex-col space-y-4">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className={`text-base font-medium transition-colors py-2 border-b border-slate-800 ${
                      activeSection === item.id
                        ? 'text-[#22D3EE] font-semibold'
                        : 'text-slate-200 hover:text-[#22D3EE]'
                    }`}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>

            <div className="pt-6 border-t border-slate-800 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  onOpenModal()
                }}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#2563EB] text-white font-semibold text-sm shadow-md"
              >
                <span>Começar agora</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <div className="text-[11px] text-center text-slate-400">
                Imóveis Inteligentes • 2025
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
