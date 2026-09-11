import React from 'react'
import { useOutletContext } from 'react-router-dom'
import { HeroSection } from '@/components/HeroSection'
import { ProofStrip } from '@/components/ProofStrip'
import { TwoPathsSection } from '@/components/TwoPathsSection'
import { CompetitiveDifferences } from '@/components/CompetitiveDifferences'
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

      {/* 1. Faixa horizontal de prova — logo abaixo do hero */}
      <ProofStrip />

      {/* Seção "Dois Caminhos": Fundo off-white, cards com Dor e Ganho literais */}
      <TwoPathsSection onOpenModal={handleOpenModal} />

      {/* 2. Seção de diferenciais competitivos — grid com 4 cards (após dois caminhos, id #diferenciais) */}
      <CompetitiveDifferences />

      {/* Seções de Apoio com os IDs de ancoragem: #para-vender, #para-investir, #como-funciona */}
      <SupportingSections onOpenModal={handleOpenModal} />

      {/* Rodapé: Bloco de marca + links informativos */}
      <Footer onOpenModal={handleOpenModal} />
    </div>
  )
}

export default Index
