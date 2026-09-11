import React from 'react'
import { useOutletContext } from 'react-router-dom'
import { HeroSection } from '@/components/HeroSection'
import { TwoPathsSection } from '@/components/TwoPathsSection'
import { SupportingSections } from '@/components/SupportingSections'
import { Footer } from '@/components/Footer'

interface LayoutContextType {
  onOpenModal: (intent?: 'vender' | 'investir') => void
}

const Index: React.FC = () => {
  const context = useOutletContext<LayoutContextType>()
  const handleOpenModal = context?.onOpenModal || (() => {})

  return (
    <div className="w-full flex flex-col">
      {/* Hero Section: Conversão com Headline exata, Subheadline exata, CTAs, Termômetro 92% */}
      <HeroSection onOpenModal={handleOpenModal} />

      {/* Seção "Dois Caminhos": Fundo off-white, cards com Dor e Ganho literais */}
      <TwoPathsSection onOpenModal={handleOpenModal} />

      {/* Seções de Apoio com os IDs de ancoragem: #para-vender, #para-investir, #como-funciona, #diferenciais */}
      <SupportingSections onOpenModal={handleOpenModal} />

      {/* Rodapé: Bloco de marca + links informativos */}
      <Footer onOpenModal={handleOpenModal} />
    </div>
  )
}

export default Index
