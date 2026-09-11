import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Building, TrendingUp } from 'lucide-react'
import { FormVenda } from './FormVenda'
import { FormInvestidor } from './FormInvestidor'

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
  const [intencao, setIntencao] = useState<'vender' | 'investir'>('vender')

  // Sincronizar intenção inicial se passar via prop ao abrir
  useEffect(() => {
    if (initialIntent) {
      setIntencao(initialIntent)
    } else if (open && !initialIntent) {
      setIntencao('vender')
    }
  }, [initialIntent, open])

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[92vh] overflow-y-auto bg-[#0B1F3A] border border-[#2563EB]/40 text-white shadow-2xl backdrop-blur-md p-6 sm:p-8">
        <DialogHeader className="text-left space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2563EB]/20 border border-[#2563EB]/40 text-[#22D3EE] text-xs font-semibold w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] animate-pulse" />
            Conexão orientada a dados no Supabase
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight text-white">
            {intencao === 'vender'
              ? 'Quero vender meu imóvel'
              : 'Quero oportunidade de investimento'}
          </DialogTitle>
          <DialogDescription className="text-slate-300 text-sm">
            {intencao === 'vender'
              ? 'Cadastre as informações do seu imóvel para conectá-lo a compradores e investidores com liquidez imediata.'
              : 'Defina sua tese de alocação de capital e receba oportunidades filtradas antes de chegarem aos portais abertos.'}
          </DialogDescription>
        </DialogHeader>

        {/* Seletor de Abas de Intenção */}
        <div className="pt-2 pb-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-2">
            Escolha seu objetivo:
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIntencao('vender')}
              className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                intencao === 'vender'
                  ? 'border-[#2563EB] bg-[#2563EB]/25 text-white shadow-sm ring-1 ring-[#2563EB]'
                  : 'border-slate-700 bg-[#12294A]/60 text-slate-300 hover:border-slate-600'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-[#2563EB]/20 flex items-center justify-center shrink-0">
                <Building className="w-4 h-4 text-[#2563EB]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold truncate">Quero vender</span>
                <span className="text-[11px] text-slate-400 truncate">Tenho um imóvel</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIntencao('investir')}
              className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                intencao === 'investir'
                  ? 'border-[#22D3EE] bg-[#22D3EE]/20 text-white shadow-sm ring-1 ring-[#22D3EE]'
                  : 'border-slate-700 bg-[#12294A]/60 text-slate-300 hover:border-slate-600'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-[#22D3EE]/20 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-[#22D3EE]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold truncate">Investimento</span>
                <span className="text-[11px] text-slate-400 truncate">Busco retorno/renda</span>
              </div>
            </button>
          </div>
        </div>

        {/* Formulário Conectado ao Supabase */}
        <div className="pt-2">
          {intencao === 'vender' ? (
            <FormVenda isInModal={true} onCancel={handleClose} onSuccess={handleClose} />
          ) : (
            <FormInvestidor isInModal={true} onCancel={handleClose} onSuccess={handleClose} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
