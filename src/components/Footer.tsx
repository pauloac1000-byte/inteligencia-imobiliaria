import React from 'react'
import { ArrowUpRight, ShieldCheck, Mail, Phone, FileBadge } from 'lucide-react'

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
    <footer className="bg-[#061224] text-white pt-16 pb-12 px-6 border-t border-slate-800/80">
      <div className="max-w-[1200px] mx-auto space-y-12">
        {/* Grid Principal do Rodapé */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Marca + Tagline do Projeto */}
          <div className="md:col-span-4 space-y-4">
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
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#22D3EE] rounded-full ring-2 ring-[#061224]" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">
                Imóveis <span className="text-[#22D3EE]">Inteligentes</span>
              </span>
            </a>

            {/* Tagline do projeto */}
            <p className="text-sm text-slate-300 font-medium">Inteligência imobiliária</p>

            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Nossa mecânica de dados cruza perfil do imóvel com objetivo de compra de milhares de
              investidores. A compatibilidade precisa guia a ponte entre você e a oportunidade
              certa.
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-[#22D3EE] shrink-0" />
              <span>Operações fundamentadas em dados • Brasil</span>
            </div>
          </div>

          {/* Navegação com as âncoras existentes: Para vender, Para investir, Como funciona, Diferenciais */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Navegação
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <a
                  href="#para-vender"
                  onClick={(e) => handleNavClick(e, 'para-vender')}
                  className="hover:text-[#22D3EE] transition-colors inline-flex items-center gap-1.5"
                >
                  <span className="w-1 h-1 rounded-full bg-[#22D3EE]" />
                  <span>Para vender</span>
                </a>
              </li>
              <li>
                <a
                  href="#para-investir"
                  onClick={(e) => handleNavClick(e, 'para-investir')}
                  className="hover:text-[#22D3EE] transition-colors inline-flex items-center gap-1.5"
                >
                  <span className="w-1 h-1 rounded-full bg-[#22D3EE]" />
                  <span>Para investir</span>
                </a>
              </li>
              <li>
                <a
                  href="#como-funciona"
                  onClick={(e) => handleNavClick(e, 'como-funciona')}
                  className="hover:text-[#22D3EE] transition-colors inline-flex items-center gap-1.5"
                >
                  <span className="w-1 h-1 rounded-full bg-[#22D3EE]" />
                  <span>Como funciona</span>
                </a>
              </li>
              <li>
                <a
                  href="#diferenciais"
                  onClick={(e) => handleNavClick(e, 'diferenciais')}
                  className="hover:text-[#22D3EE] transition-colors inline-flex items-center gap-1.5"
                >
                  <span className="w-1 h-1 rounded-full bg-[#22D3EE]" />
                  <span>Diferenciais</span>
                </a>
              </li>
              <li>
                <a
                  href="#compatibilidade"
                  onClick={(e) => handleNavClick(e, 'compatibilidade')}
                  className="hover:text-[#22D3EE] transition-colors inline-flex items-center gap-1.5"
                >
                  <span className="w-1 h-1 rounded-full bg-[#22D3EE]" />
                  <span>Compatibilidade</span>
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  onClick={(e) => handleNavClick(e, 'faq')}
                  className="hover:text-[#22D3EE] transition-colors inline-flex items-center gap-1.5"
                >
                  <span className="w-1 h-1 rounded-full bg-[#22D3EE]" />
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
            <div className="space-y-2.5 text-xs text-slate-300 bg-[#0B1F3A]/70 border border-slate-800 p-4 rounded-xl">
              <div className="flex items-center gap-2.5">
                <FileBadge className="w-4 h-4 text-[#22D3EE] shrink-0" />
                <span className="text-slate-400">CRECI:</span>
                <span className="font-mono text-white font-medium">[A DEFINIR]</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#22D3EE] shrink-0" />
                <span className="text-slate-400">WhatsApp:</span>
                <span className="font-mono text-white font-medium">[A DEFINIR]</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#22D3EE] shrink-0" />
                <span className="text-slate-400">E-mail:</span>
                <span className="font-mono text-white font-medium">[A DEFINIR]</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Pronto para colocar seus dados a favor de um fechamento ágil e seguro?
            </p>

            <button
              type="button"
              onClick={() => onOpenModal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-semibold transition-all shadow-md cursor-pointer"
            >
              <span>Falar com especialista em dados</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>

            {/* Links informativos (privacidade, termos, contato) mantidos */}
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="hover:text-white cursor-pointer transition-colors">Privacidade</span>
              <span>•</span>
              <span className="hover:text-white cursor-pointer transition-colors">
                Termos de Uso
              </span>
              <span>•</span>
              <span className="hover:text-white cursor-pointer transition-colors">Compliance</span>
            </div>
          </div>
        </div>

        {/* Barra Inferior com Copyright Dinâmico */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            © {new Date().getFullYear()} Imóveis Inteligentes. Todos os direitos reservados.
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22D3EE]" />
            <span>Compatibilidade calculada com 48 variáveis analíticas</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
