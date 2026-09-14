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

  // Define a rota/formulário diretamente a partir do botão clicado
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
      <DialogContent className="w-[calc(100%-1.5rem)] sm:max-w-[560px] max-h-[92vh] overflow-y-auto bg-[#070B14] border border-[#1A3A75]/60 text-white shadow-2xl backdrop-blur-md p-4 sm:p-8 rounded-2xl">
        <DialogHeader className="text-left space-y-2 pr-6">
          <DialogTitle className="text-lg sm:text-2xl font-bold tracking-tight text-white leading-snug">
            {intencao === 'vender' ? 'Quero vender meu imóvel' : 'Quero investir'}
          </DialogTitle>
          <DialogDescription className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            {intencao === 'vender'
              ? 'Cadastre as informações do seu imóvel para conectá-lo a compradores e investidores com liquidez imediata.'
              : 'Defina sua tese de alocação de capital e receba oportunidades filtradas antes de chegarem aos portais abertos.'}
          </DialogDescription>
        </DialogHeader>

        {/* Formulário Conectado ao Supabase (Rota definida pelo botão de entrada) */}
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
