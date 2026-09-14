import React, { useEffect, useState, useMemo } from 'react'
import { X } from 'lucide-react'
import { KORBIX_WHATSAPP_NUMBER } from '@/services/leads'

type WhatsAppSectionIntent = 'proprietario' | 'investidor' | 'geral'

interface SectionConfig {
  intent: WhatsAppSectionIntent
  badge: string
  tooltip: string
  message: string
}

const SECTION_CONFIGS: Record<WhatsAppSectionIntent, SectionConfig> = {
  proprietario: {
    intent: 'proprietario',
    badge: 'Proprietário',
    tooltip: 'Quero vender meu imóvel',
    message: 'Olá! Vi a página da KORBIX e quero vender meu imóvel.',
  },
  investidor: {
    intent: 'investidor',
    badge: 'Investidor',
    tooltip: 'Oportunidades de investimento',
    message: 'Olá! Vi a página da KORBIX e quero oportunidades de investimento.',
  },
  geral: {
    intent: 'geral',
    badge: 'Atendimento',
    tooltip: 'Fale com a KORBIX',
    message: 'Olá! Gostaria de falar com a equipe da KORBIX.',
  },
}

// Mapeamento de IDs de seção na página inicial
const SECTION_INTENT_MAP: Record<string, WhatsAppSectionIntent> = {
  'para-vender': 'proprietario',
  'para-investir': 'investidor',
  'como-funciona': 'geral',
  compatibilidade: 'geral',
  diferenciais: 'geral',
  'dois-caminhos': 'geral',
  faq: 'geral',
}

export const FloatingWhatsApp: React.FC = () => {
  const [activeIntent, setActiveIntent] = useState<WhatsAppSectionIntent>('geral')
  const [showTooltip, setShowTooltip] = useState(false)
  const [dismissedTooltip, setDismissedTooltip] = useState(false)

  useEffect(() => {
    // Scroll spy usando IntersectionObserver com threshold refinado
    const sectionIds = Object.keys(SECTION_INTENT_MAP)
    const elements: HTMLElement[] = []

    sectionIds.forEach((id) => {
      const el = document.getElementById(id)
      if (el) elements.push(el)
    })

    if (elements.length === 0) {
      // Se não houver seções (outras páginas como /politica-de-privacidade), padrão 'geral'
      return
    }

    // Usar IntersectionObserver para detectar qual seção ocupa a maior parte do viewport
    const visibleRatios: Record<string, number> = {}

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibleRatios[entry.target.id] = entry.intersectionRatio
        })

        // Encontrar a seção com maior interseção visível (> 0.15)
        let bestId = ''
        let bestRatio = 0.15

        for (const [id, ratio] of Object.entries(visibleRatios)) {
          if (ratio > bestRatio) {
            bestRatio = ratio
            bestId = id
          }
        }

        if (bestId && SECTION_INTENT_MAP[bestId]) {
          setActiveIntent(SECTION_INTENT_MAP[bestId])
        }
      },
      {
        threshold: [0, 0.15, 0.3, 0.5, 0.7, 1.0],
        rootMargin: '-10% 0px -10% 0px',
      },
    )

    elements.forEach((el) => observer.observe(el))

    // Fallback adicional por scroll position para garantir detecção fluida
    const handleScroll = () => {
      const scrollY = window.scrollY
      const viewportHeight = window.innerHeight
      const midpoint = scrollY + viewportHeight * 0.45

      for (const el of elements) {
        const top = el.offsetTop
        const height = el.offsetHeight
        if (midpoint >= top && midpoint < top + height) {
          const intent = SECTION_INTENT_MAP[el.id]
          if (intent) {
            setActiveIntent(intent)
          }
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Mostrar tooltip após 3 segundos no desktop para chamar atenção suavemente
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!dismissedTooltip) {
        setShowTooltip(true)
      }
    }, 3000)
    return () => clearTimeout(timer)
  }, [dismissedTooltip])

  const currentConfig = SECTION_CONFIGS[activeIntent]

  const whatsAppLink = useMemo(() => {
    const encoded = encodeURIComponent(currentConfig.message)
    return `https://wa.me/${KORBIX_WHATSAPP_NUMBER}?text=${encoded}`
  }, [currentConfig.message])

  return (
    <aside
      aria-label="Atendimento via WhatsApp"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-2 pointer-events-none select-none print:hidden"
    >
      {/* Tooltip / Balão contextual flutuante (somente desktop ou quando ativo, com botão de fechar) */}
      {showTooltip && !dismissedTooltip && (
        <div
          role="status"
          className="pointer-events-auto hidden sm:flex items-center gap-2.5 max-w-xs px-3.5 py-2.5 rounded-2xl bg-[#081226]/95 border border-[#25D366]/40 text-white text-xs shadow-2xl shadow-black/80 backdrop-blur-md animate-fade-in transition-all"
        >
          <div className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse shrink-0 shadow-[0_0_8px_#25D366]" />
          <div className="flex-1 min-w-0">
            <span className="block text-[10px] uppercase font-mono font-bold tracking-wider text-[#25D366]">
              {currentConfig.badge}
            </span>
            <p className="text-slate-200 text-xs font-medium leading-snug truncate">
              {currentConfig.tooltip}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setDismissedTooltip(true)
              setShowTooltip(false)
            }}
            className="p-1 -mr-1 text-slate-400 hover:text-white rounded-md transition-colors cursor-pointer"
            aria-label="Fechar dica de atendimento"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Botão flutuante principal com ícone oficial WhatsApp (SVG inline) */}
      <a
        href={whatsAppLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Falar no WhatsApp KORBIX (${currentConfig.badge}): ${currentConfig.message}`}
        onMouseEnter={() => !dismissedTooltip && setShowTooltip(true)}
        className="pointer-events-auto group relative flex items-center justify-center w-14 h-14 sm:w-15 sm:h-15 rounded-full bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1caa51] text-white shadow-[0_8px_24px_rgba(37,211,102,0.35),0_0_12px_rgba(37,211,102,0.25)] hover:shadow-[0_12px_28px_rgba(37,211,102,0.5),0_0_20px_rgba(37,211,102,0.4)] transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/50"
      >
        {/* Glow suave escuro coerente com tech-midnight */}
        <span
          className="absolute -inset-1 rounded-full bg-[#25D366]/20 blur-md pointer-events-none group-hover:bg-[#25D366]/35 transition-colors"
          aria-hidden="true"
        />

        {/* Pulse ring animado sutil */}
        <span
          className="absolute inset-0 rounded-full border-2 border-[#25D366] animate-ping opacity-30 pointer-events-none"
          aria-hidden="true"
        />

        {/* Ícone SVG oficial do WhatsApp (28x28 desktop, 26x26 mobile) */}
        <svg
          viewBox="0 0 24 24"
          className="w-7 h-7 sm:w-8 sm:h-8 fill-white relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
          aria-hidden="true"
        >
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.04 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.16 12.04 20.16C10.66 20.16 9.3 19.81 8.09 19.14L7.81 18.98L4.69 19.8L5.52 16.76L5.34 16.48C4.59 15.28 4.2 13.9 4.2 11.91C4.2 7.37 7.9 3.67 12.04 3.67ZM8.73 7.34C8.56 7.34 8.28 7.4 8.05 7.66C7.82 7.91 7.18 8.52 7.18 9.77C7.18 11.02 8.08 12.22 8.21 12.39C8.34 12.56 9.97 15.07 12.46 16.15C13.06 16.41 13.52 16.56 13.88 16.68C14.48 16.87 15.02 16.84 15.46 16.78C15.94 16.71 16.94 16.17 17.15 15.58C17.36 14.99 17.36 14.48 17.3 14.38C17.23 14.28 17.06 14.21 16.81 14.09C16.56 13.96 15.32 13.35 15.09 13.27C14.86 13.19 14.69 13.14 14.53 13.39C14.36 13.64 13.88 14.21 13.73 14.38C13.59 14.55 13.44 14.57 13.19 14.44C12.94 14.32 12.13 14.05 11.18 13.2C10.44 12.54 9.94 11.72 9.8 11.47C9.65 11.22 9.78 11.09 9.91 10.96C10.02 10.85 10.15 10.67 10.28 10.53C10.4 10.38 10.45 10.28 10.53 10.11C10.61 9.94 10.57 9.8 10.51 9.68C10.45 9.55 9.94 8.31 9.73 7.8C9.52 7.31 9.31 7.37 9.15 7.37C9.01 7.36 8.87 7.34 8.73 7.34Z" />
        </svg>

        {/* Badge indicador discreto (Proprietário ou Investidor) */}
        {activeIntent !== 'geral' && (
          <span
            className="absolute -top-1.5 -left-1.5 px-1.5 py-0.5 rounded-full bg-[#081226] border border-[#25D366] text-[#25D366] font-mono text-[9px] font-bold uppercase tracking-wider shadow-md pointer-events-none"
            aria-hidden="true"
          >
            {activeIntent === 'proprietario' ? 'Venda' : 'Investir'}
          </span>
        )}
      </a>
    </aside>
  )
}
