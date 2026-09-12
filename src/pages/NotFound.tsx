/* 404 Page - Displays when a user attempts to access a non-existent route - translate to the language of the user */
import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'

const NotFound = () => {
  const location = useLocation()

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname)
  }, [location.pathname])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070B14] text-white">
      <div className="text-center p-6 max-w-md">
        <h1 className="text-5xl font-bold mb-4 text-[#22C7E0] font-mono">404</h1>
        <p className="text-xl text-slate-300 mb-6">Página não encontrada</p>
        <a
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#1A3A75] hover:bg-[#142E5E] text-white text-sm font-semibold transition-colors shadow-inner"
        >
          Voltar para o início
        </a>
      </div>
    </div>
  )
}

export default NotFound
