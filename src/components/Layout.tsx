import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { ModalComecarAgora } from './ModalComecarAgora'

export default function Layout() {
  const [modalOpen, setModalOpen] = useState(false)
  const [initialIntent, setInitialIntent] = useState<'vender' | 'investir' | null>(null)

  const handleOpenModal = (intent?: 'vender' | 'investir') => {
    setInitialIntent(intent || null)
    setModalOpen(true)
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#070B14] text-slate-100 selection:bg-[#1A3A75] selection:text-white">
      {/* Header fixo 72px com blur/scroll tracking */}
      <Header onOpenModal={handleOpenModal} />

      {/* Main Outlet com contexto para permitir que páginas filhas abram o modal */}
      <main className="flex-1 w-full">
        <Outlet context={{ onOpenModal: handleOpenModal }} />
      </main>

      {/* Modal global de captura "Começar agora" */}
      <ModalComecarAgora
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialIntent={initialIntent}
      />
    </div>
  )
}
