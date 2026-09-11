import React from 'react'
import { ArrowUpRight } from 'lucide-react'

interface FooterProps {
  onOpenModal: (intent?: 'vender' | 'investir') => void
}

export const Footer: React.FC<FooterProps> = ({ onOpenModal }) => {
  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    const element = document.getElementById(targetId)
    if (element) {
      const yOffset = -76
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  return (
    <footer className="bg-[#08172c] text-white pt-16 pb-12 px-6 border-t border-slate-800">
      <div className="max-w-[1200px] mx-auto space-y-12">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <a href="#" onClick={scrollToTop} className="flex items-center gap-3 group w-fit">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#12294A] to-[#0B1F3A] border border-[#2563EB]/40 group-hover:border-[#22D3EE] transition-colors">
                <svg
                  className="w-5 h-5 text-[#22D3EE]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20V10.5z" />
                  <path d="M7 16h4" />
                  <path d="M11 16l3-4" />
                  <path d="M14 12h3" />
                </svg>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#22D3EE] rounded-full ring-2 ring-[#08172c]" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">
                Imóveis <span className="text-[#22D3EE]">Inteligentes</span>
              </span>
            </a>

            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Mecânica analítica de dados que cruza perfis imobiliários e teses de investimento com
              precisão, agilidade e segurança jurídica.
            </p>

            <div className="pt-2 text-xs text-slate-500">
              Operações fundamentadas em dados • Brasil
            </div>
          </div>

          {/* Links de Navegação */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Navegação
            </h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <a
                  href="#para-vender"
                  onClick={(e) => handleNavClick(e, 'para-vender')}
                  className="hover:text-[#22D3EE] transition-colors inline-flex items-center gap-1"
                >
                  Para vender
                </a>
              </li>
              <li>
                <a
                  href="#para-investir"
                  onClick={(e) => handleNavClick(e, 'para-investir')}
                  className="hover:text-[#22D3EE] transition-colors inline-flex items-center gap-1"
                >
                  Para investir
                </a>
              </li>
              <li>
                <a
                  href="#como-funciona"
                  onClick={(e) => handleNavClick(e, 'como-funciona')}
                  className="hover:text-[#22D3EE] transition-colors inline-flex items-center gap-1"
                >
                  Como funciona
                </a>
              </li>
              <li>
                <a
                  href="#diferenciais"
                  onClick={(e) => handleNavClick(e, 'diferenciais')}
                  className="hover:text-[#22D3EE] transition-colors inline-flex items-center gap-1"
                >
                  Diferenciais
                </a>
              </li>
            </ul>
          </div>

          {/* Links Informativos */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Acesso & Contato
            </h4>
            <p className="text-xs text-slate-400">
              Pronto para colocar seus dados a favor do fechamento ágil?
            </p>
            <button
              type="button"
              onClick={() => onOpenModal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-semibold transition-all shadow-md cursor-pointer"
            >
              <span>Falar com especialista em dados</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>

            <div className="pt-3 flex flex-wrap gap-4 text-xs text-slate-400">
              <span className="hover:text-white cursor-pointer transition-colors">Privacidade</span>
              <span>•</span>
              <span className="hover:text-white cursor-pointer transition-colors">
                Termos de Uso
              </span>
              <span>•</span>
              <span className="hover:text-white cursor-pointer transition-colors">Contato</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Imóveis Inteligentes. Todos os direitos reservados.
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22D3EE]" />
            <span>Compatibilidade calculada com 48 variáveis</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
