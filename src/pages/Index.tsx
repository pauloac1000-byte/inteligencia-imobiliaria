import React from 'react'
import { useOutletContext } from 'react-router-dom'
import { HeroSection } from '@/components/HeroSection'
import { ProofStrip } from '@/components/ProofStrip'
import { TwoPathsSection } from '@/components/TwoPathsSection'
import { CompetitiveDifferences } from '@/components/CompetitiveDifferences'
import { SupportingSections } from '@/components/SupportingSections'
import { CompatibilityThermometerSection } from '@/components/CompatibilityThermometerSection'
import { FinalCtaSection } from '@/components/FinalCtaSection'
import { FaqSection } from '@/components/FaqSection'
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

      {/* Seção "Dois Caminhos": Tech-Midnight (#081226), cards com Dor e Ganho literais */}
      <TwoPathsSection onOpenModal={handleOpenModal} />

      {/* 2. Seção de diferenciais competitivos — grid com 4 cards (após dois caminhos, id #diferenciais) */}
      <CompetitiveDifferences />

      {/* Seções de Apoio com os IDs de ancoragem: #para-vender, #para-investir, #como-funciona ("Simples para os dois lados" - 3 passos) */}
      <SupportingSections onOpenModal={handleOpenModal} />

      {/* Seção 2: Termômetro de compatibilidade — posicionado após os passos */}
      <CompatibilityThermometerSection onOpenModal={handleOpenModal} />

      {/* 1) Seção CTA Final: Centralizada, fundo escuro azul-marinho (#081226), após o termômetro e antes do FAQ */}
      <FinalCtaSection onOpenModal={handleOpenModal} />

      {/* 2) FAQ em Acordeão: Duas abas, Tech-Midnight (#081226 e cards #070B14) */}
      <FaqSection />

      {/* 3) Rodapé com credibilidade, contato e âncoras */}
      <Footer onOpenModal={handleOpenModal} />
    </div>
  )
}

export default Index
