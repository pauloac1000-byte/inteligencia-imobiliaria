import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { FormVenda } from './FormVenda'
import { FormInvestidor } from './FormInvestidor'

import { Building, TrendingUp, ArrowRight, ArrowLeft } from 'lucide-react'
import { registrarEvento } from '@/services/eventos'

interface ModalComecarAgoraProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialIntent?: 'vender' | 'investir' | null
}

export const ModalComecarAgora: React.FC<ModalComecarAgoraProps> = ({
  open,
  onOpenChange,
  initialIntent = null,
}) => {
  // Se initialIntent for fornecido, começa direto na rota correspondente.
  // Se for null/undefined, começa em null (mostra a tela de seleção de intenção).
  const [selectedRoute, setSelectedRoute] = useState<'vender' | 'investir' | null>(null)

  useEffect(() => {
    if (open) {
      setSelectedRoute(initialIntent || null)
      if (initialIntent) {
        registrarEvento('formulario_iniciado', window.location.pathname || '/', {
          origem: initialIntent === 'vender' ? 'modal_proprietario' : 'modal_investidor',
          disparo: 'abertura_direta',
        })
      }
    } else {
      setSelectedRoute(null)
    }
  }, [initialIntent, open])

  const handleClose = () => {
    onOpenChange(false)
  }

  // Título e descrição dinâmicos de acordo com a etapa
  const getHeaderInfo = () => {
    if (!selectedRoute) {
      return {
        title: 'Como a KORBIX pode te ajudar hoje?',
        description:
          'Selecione seu objetivo para direcionarmos você ao atendimento técnico e ferramentas analíticas adequadas.',
      }
    }
    if (selectedRoute === 'vender') {
      return {
        title: 'Quero vender meu imóvel',
        description:
          'Cadastre as informações do seu imóvel para conectá-lo a compradores e investidores com liquidez imediata.',
      }
    }
    return {
      title: 'Quero investir',
      description:
        'Defina sua tese de alocação de capital e receba oportunidades filtradas antes de chegarem aos portais abertos.',
    }
  }

  const { title, description } = getHeaderInfo()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1.5rem)] sm:max-w-[560px] max-h-[92vh] overflow-y-auto bg-[#070B14] border border-[#1A3A75]/60 text-white shadow-2xl backdrop-blur-md p-4 sm:p-8 rounded-2xl">
        <DialogHeader className="text-left space-y-2 pr-6">
          {/* Botão sutil para voltar à seleção caso tenha entrado sem intent inicial */}
          {!initialIntent && selectedRoute && (
            <button
              type="button"
              onClick={() => setSelectedRoute(null)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#22C7E0] transition-colors mb-1 w-fit cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar para escolha de rota</span>
            </button>
          )}

          <DialogTitle className="text-lg sm:text-2xl font-bold tracking-tight text-white leading-snug">
            {title}
          </DialogTitle>
          <DialogDescription className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* TELA DE SELEÇÃO: quando aberto sem intent ("Começar agora") */}
        {!selectedRoute ? (
          <div className="pt-3 pb-1 space-y-3 sm:space-y-4 animate-fade-in">
            {/* Opção 1: Quero vender meu imóvel (rota proprietário) */}
            <button
              type="button"
              onClick={() => {
                registrarEvento('clique_quero_vender', window.location.pathname || '/', {
                  origem: 'modal_selecao',
                })
                registrarEvento('formulario_iniciado', window.location.pathname || '/', {
                  origem: 'modal_proprietario',
                  disparo: 'selecao_modal',
                })
                setSelectedRoute('vender')
              }}
              className="group relative w-full text-left p-4 sm:p-5 rounded-xl bg-[#081226] hover:bg-[#0c1a36] border border-slate-800 hover:border-[#22C7E0]/60 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 overflow-hidden flex items-center justify-between gap-3 sm:gap-4"
            >
              <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#1A3A75] group-hover:bg-[#22C7E0] transition-colors" />

              <div className="flex items-center gap-3 sm:gap-4 min-w-0 pl-1">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#070B14] border border-[#1A3A75]/60 text-[#22C7E0] group-hover:border-[#22C7E0]/60 flex items-center justify-center shrink-0 transition-colors shadow-[0_0_12px_rgba(34,199,224,0.12)]">
                  <Building className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
                </div>
                <div className="min-w-0 space-y-0.5 sm:space-y-1">
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                    Para proprietários
                  </span>
                  <div className="text-base sm:text-lg font-bold text-white group-hover:text-white tracking-tight leading-snug">
                    Quero vender meu imóvel
                  </div>
                  <p className="text-xs sm:text-[13px] text-slate-300 line-clamp-2 leading-relaxed">
                    Liquidez acelerada com compradores e investidores qualificados para o seu
                    perfil.
                  </p>
                </div>
              </div>

              <div className="w-9 h-9 rounded-lg bg-[#070B14] border border-slate-700 group-hover:border-[#22C7E0]/60 group-hover:bg-[#1A3A75] text-slate-400 group-hover:text-white flex items-center justify-center shrink-0 transition-all">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Opção 2: Quero investir (rota investidor) */}
            <button
              type="button"
              onClick={() => {
                registrarEvento('clique_quero_investir', window.location.pathname || '/', {
                  origem: 'modal_selecao',
                })
                registrarEvento('formulario_iniciado', window.location.pathname || '/', {
                  origem: 'modal_investidor',
                  disparo: 'selecao_modal',
                })
                setSelectedRoute('investir')
              }}
              className="group relative w-full text-left p-4 sm:p-5 rounded-xl bg-[#081226] hover:bg-[#0c1a36] border border-slate-800 hover:border-[#22C7E0]/60 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 overflow-hidden flex items-center justify-between gap-3 sm:gap-4"
            >
              <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#22C7E0] shadow-[0_0_8px_#22C7E0]" />

              <div className="flex items-center gap-3 sm:gap-4 min-w-0 pl-1">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#070B14] border border-[#22C7E0]/30 text-[#22C7E0] group-hover:border-[#22C7E0]/60 flex items-center justify-center shrink-0 transition-colors shadow-[0_0_12px_rgba(34,199,224,0.15)]">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
                </div>
                <div className="min-w-0 space-y-0.5 sm:space-y-1">
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#22C7E0] block">
                    Para investidores
                  </span>
                  <div className="text-base sm:text-lg font-bold text-white group-hover:text-white tracking-tight leading-snug">
                    Quero investir
                  </div>
                  <p className="text-xs sm:text-[13px] text-slate-300 line-clamp-2 leading-relaxed">
                    Acesso exclusivo a oportunidades pré-auditadas antes de chegarem aos portais
                    abertos.
                  </p>
                </div>
              </div>

              <div className="w-9 h-9 rounded-lg bg-[#070B14] border border-slate-700 group-hover:border-[#22C7E0]/60 group-hover:bg-[#1A3A75] text-slate-400 group-hover:text-white flex items-center justify-center shrink-0 transition-all">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Rodapé informativo discreto */}
            <div className="pt-2 text-center text-[11px] text-slate-400">
              Ambiente seguro • Análise técnica conduzida por corretores credenciados
            </div>
          </div>
        ) : (
          /* FORMULÁRIO SELECIONADO: Conectado ao Supabase com persistência da rota */
          <div className="pt-2 animate-fade-in">
            {selectedRoute === 'vender' ? (
              <FormVenda isInModal={true} onCancel={handleClose} onSuccess={handleClose} />
            ) : (
              <FormInvestidor isInModal={true} onCancel={handleClose} onSuccess={handleClose} />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
