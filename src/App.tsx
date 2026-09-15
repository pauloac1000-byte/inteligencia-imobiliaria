/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import PoliticaPrivacidade from './pages/PoliticaPrivacidade'
import CalculadoraImovelParado from './pages/CalculadoraImovelParado'
import SimuladorRetornoInvestidor from './pages/SimuladorRetornoInvestidor'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import MinhaArea from './pages/MinhaArea'
import PainelGestor from './pages/PainelGestor'
import Layout from './components/Layout'

// ONLY IMPORT AND RENDER WORKING PAGES, NEVER ADD PLACEHOLDER COMPONENTS OR PAGES IN THIS FILE
// AVOID REMOVING ANY CONTEXT PROVIDERS FROM THIS FILE (e.g. TooltipProvider, Toaster, Sonner)

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/politica-de-privacidade" element={<PoliticaPrivacidade />} />
            <Route path="/calculadora" element={<CalculadoraImovelParado />} />
            <Route path="/simulador-de-retorno" element={<SimuladorRetornoInvestidor />} />
          </Route>
          {/* Rotas de Autenticação e Áreas de Usuário sem o Header/Footer padrão da landing */}
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/minha-area" element={<MinhaArea />} />
          <Route path="/painel" element={<PainelGestor />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
