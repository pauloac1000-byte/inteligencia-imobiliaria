import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  salvarLeadInvestidor,
  TicketInvestidor,
  ObjetivoInvestidor,
  PrazoDecisaoInvestidor,
} from '@/services/leads'
import { ArrowRight, Loader2, AlertCircle, Compass, Check, Sparkles, Building2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { ConfirmationProtocolo } from './ConfirmationProtocolo'
import { registrarEvento } from '@/services/eventos'
import {
  listarDiferenciais,
  filtrarDiferenciaisPorTiposInvestidor,
  DiferencialItem,
  DIFERENCIAIS_PADRAO,
  PreferenciaDiferencial,
} from '@/services/diferenciais'

interface FormInvestidorProps {
  onSuccess?: () => void
  onCancel?: () => void
  isInModal?: boolean
}

// Opções de Ticket solicitadas
const OPCOES_TICKET: { value: TicketInvestidor; label: string }[] = [
  { value: 'ate_300k', label: 'Até R$ 300 mil' },
  { value: '300_600k', label: 'R$ 300 a 600 mil' },
  { value: 'acima_600k', label: 'Acima de R$ 600 mil' },
]

// Opções de Objetivo solicitadas
const OPCOES_OBJETIVO: { value: ObjetivoInvestidor; label: string }[] = [
  { value: 'renda_aluguel', label: 'Renda de aluguel' },
  { value: 'revenda', label: 'Revenda' },
  { value: 'reforma_venda', label: 'Reforma e venda' },
]

// Opções de Prazo de Decisão solicitadas
const OPCOES_PRAZO: { value: PrazoDecisaoInvestidor; label: string }[] = [
  { value: '30_dias', label: '30 dias' },
  { value: '60_dias', label: '60 dias' },
  { value: 'flexivel', label: 'Flexível' },
]

// Cidades da região de atuação com tags de seleção múltipla
const CIDADES_DISPONIVEIS = [
  'São Paulo - Capital',
  'Campinas',
  'São José dos Campos',
  'Sorocaba',
  'Ribeirão Preto',
  'Santos & Litoral',
  'Jundiaí',
  'ABC Paulista',
  'Circuito das Águas Paulista',
]

// Tipos de imóvel de interesse para o investidor
const TIPOS_IMOVEL_INVESTIDOR: { value: string; label: string }[] = [
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'casa', label: 'Casa' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'terreno', label: 'Terreno / Lote' },
]

// Máscara e formatação em tempo real de telefone/WhatsApp brasileiro (mínimo 10 dígitos com DDD)
function formatarTelefone(valor: string): string {
  const digits = valor.replace(/\D/g, '').slice(0, 11)
  if (!digits) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

export const FormInvestidor: React.FC<FormInvestidorProps> = ({
  onSuccess,
  onCancel,
  isInModal = true,
}) => {
  const [telefone, setTelefone] = useState('')
  const [ticket, setTicket] = useState<TicketInvestidor>('300_600k')
  const [objetivo, setObjetivo] = useState<ObjetivoInvestidor>('renda_aluguel')
  const [prazoDecisao, setPrazoDecisao] = useState<PrazoDecisaoInvestidor>('30_dias')
  const [tiposImovel, setTiposImovel] = useState<string[]>(['apartamento', 'casa'])
  const [diferenciaisInvestidor, setDiferenciaisInvestidor] = useState<
    Record<string, PreferenciaDiferencial>
  >({})
  const [todosDiferenciais, setTodosDiferenciais] = useState<DiferencialItem[]>(DIFERENCIAIS_PADRAO)
  const [cidadesSelecionadas, setCidadesSelecionadas] = useState<string[]>(['São Paulo - Capital'])
  const [outraCidade, setOutraCidade] = useState('')

  const [autorizoContato, setAutorizoContato] = useState(false)
  const [autorizoTouched, setAutorizoTouched] = useState(false)

  const [protocolo, setProtocolo] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [sucesso, setSucesso] = useState(false)

  // Carrega diferenciais da tabela no Supabase
  React.useEffect(() => {
    listarDiferenciais().then((itens) => {
      if (itens && itens.length > 0) {
        setTodosDiferenciais(itens)
      }
    })
  }, [])

  // Diferenciais ajustados dinamicamente com base nos tipos de imóvel escolhidos pelo investidor
  const diferenciaisAplicaveis = React.useMemo(() => {
    return filtrarDiferenciaisPorTiposInvestidor(todosDiferenciais, tiposImovel)
  }, [todosDiferenciais, tiposImovel])

  // Agrupamento por grupo
  const gruposDiferenciais = React.useMemo(() => {
    const mapa = new Map<string, DiferencialItem[]>()
    for (const item of diferenciaisAplicaveis) {
      const g = item.grupo || 'Outros'
      if (!mapa.has(g)) mapa.set(g, [])
      mapa.get(g)!.push(item)
    }
    return Array.from(mapa.entries())
  }, [diferenciaisAplicaveis])

  const toggleTipoImovel = (tipo: string) => {
    if (errorMsg) setErrorMsg('')
    setTiposImovel((prev) => {
      const existe = prev.includes(tipo)
      if (existe) {
        // Garante que não fique sem nenhum
        if (prev.length === 1) return prev
        return prev.filter((t) => t !== tipo)
      } else {
        return [...prev, tipo]
      }
    })
  }

  const setPreferenciaDiferencial = (codigo: string, pref: PreferenciaDiferencial) => {
    setDiferenciaisInvestidor((prev) => {
      // Se 'indiferente', pode manter explícito ou apagar para padrão
      return {
        ...prev,
        [codigo]: pref,
      }
    })
  }

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setTelefone(formatarTelefone(raw))
    if (errorMsg) setErrorMsg('')
  }

  const toggleCidade = (cidade: string) => {
    if (errorMsg) setErrorMsg('')
    if (cidadesSelecionadas.includes(cidade)) {
      setCidadesSelecionadas(cidadesSelecionadas.filter((c) => c !== cidade))
    } else {
      setCidadesSelecionadas([...cidadesSelecionadas, cidade])
    }
  }

  const handleAddOutraCidade = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const limpa = outraCidade.trim()
      if (limpa && !cidadesSelecionadas.includes(limpa)) {
        setCidadesSelecionadas([...cidadesSelecionadas, limpa])
        setOutraCidade('')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const digits = telefone.replace(/\D/g, '')
    if (!digits || digits.length < 10) {
      setErrorMsg('Por favor, informe um WhatsApp válido com DDD (mínimo 10 dígitos).')
      return
    }

    if (!ticket) {
      setErrorMsg('Selecione o ticket pretendido para alocação.')
      return
    }

    if (!objetivo) {
      setErrorMsg('Selecione seu objetivo principal de investimento.')
      return
    }

    const todasCidades = [...cidadesSelecionadas]
    if (outraCidade.trim() && !todasCidades.includes(outraCidade.trim())) {
      todasCidades.push(outraCidade.trim())
    }

    if (todasCidades.length === 0) {
      setErrorMsg('Selecione pelo menos 1 cidade de interesse para alocação.')
      return
    }

    if (!prazoDecisao) {
      setErrorMsg('Selecione seu prazo de decisão estimado.')
      return
    }

    if (!autorizoContato) {
      setAutorizoTouched(true)
      setErrorMsg('É necessário autorizar o contato para enviar o formulário.')
      return
    }

    setErrorMsg('')
    setLoading(true)

    // Prepara o mapa de diferenciais apenas para os itens que se aplicam aos tipos escolhidos
    const codigosValidos = new Set(diferenciaisAplicaveis.map((d) => d.codigo))
    const diferenciaisFiltrados: Record<string, PreferenciaDiferencial> = {}
    for (const [cod, pref] of Object.entries(diferenciaisInvestidor)) {
      if (codigosValidos.has(cod)) {
        diferenciaisFiltrados[cod] = pref
      }
    }

    const res = await salvarLeadInvestidor({
      telefone,
      ticket,
      objetivo,
      cidades_interesse: todasCidades,
      prazo_decisao: prazoDecisao,
      rota: 'investidor',
      tipos_imovel: tiposImovel,
      diferenciais: diferenciaisFiltrados,
    })

    setLoading(false)

    if (!res.success) {
      setErrorMsg(
        res.error || 'Ocorreu um erro ao registrar sua tese de investidor. Tente novamente.',
      )
      return
    }

    setProtocolo(res.protocolo || 'KX-0001')
    setSucesso(true)

    // Dispara evento de cadastro completo do investidor ("Registrar minha tese")
    registrarEvento('cadastro_completo', window.location.pathname || '/', {
      origem: 'modal_investidor',
    })
  }

  const handleReset = () => {
    setTelefone('')
    setProtocolo('')
    setTicket('300_600k')
    setObjetivo('renda_aluguel')
    setPrazoDecisao('30_dias')
    setTiposImovel(['apartamento', 'casa'])
    setDiferenciaisInvestidor({})
    setCidadesSelecionadas(['São Paulo - Capital'])
    setOutraCidade('')
    setAutorizoContato(false)
    setAutorizoTouched(false)
    setSucesso(false)
    setErrorMsg('')
  }

  if (sucesso) {
    return (
      <ConfirmationProtocolo
        protocolo={protocolo || 'KX-0001'}
        rota="investidor"
        onReset={handleReset}
        onClose={onCancel}
        resetLabel="Registrar outra tese"
      />
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      {errorMsg && (
        <div className="p-3 text-xs bg-red-500/20 border border-red-500/40 text-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* WhatsApp com máscara em tempo real */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          WhatsApp / Telefone *
        </label>
        <input
          type="tel"
          required
          placeholder="(11) 98765-4321"
          value={telefone}
          onChange={handleTelefoneChange}
          disabled={loading}
          className="w-full px-3.5 py-2.5 rounded-lg bg-[#081226] border border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white placeholder-slate-500 text-base sm:text-sm outline-none transition-all disabled:opacity-50 min-h-[44px]"
        />
        <p className="text-[11px] text-slate-400">
          Canal prioritário onde você receberá oportunidades compatíveis com a sua tese.
        </p>
      </div>

      {/* Grid: Ticket e Objetivo (Selects estilizados no tema dark do modal) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Ticket */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Ticket pretendido *
          </label>
          <div className="relative">
            <select
              required
              value={ticket}
              onChange={(e) => setTicket(e.target.value as TicketInvestidor)}
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#081226] border border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white text-base sm:text-sm outline-none transition-all appearance-none cursor-pointer disabled:opacity-50 min-h-[44px]"
            >
              {OPCOES_TICKET.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              ▼
            </div>
          </div>
        </div>

        {/* Objetivo */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Objetivo de alocação *
          </label>
          <div className="relative">
            <select
              required
              value={objetivo}
              onChange={(e) => setObjetivo(e.target.value as ObjetivoInvestidor)}
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#081226] border border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white text-base sm:text-sm outline-none transition-all appearance-none cursor-pointer disabled:opacity-50 min-h-[44px]"
            >
              {OPCOES_OBJETIVO.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              ▼
            </div>
          </div>
        </div>
      </div>

      {/* Tipos de imóvel de interesse: Múltipla escolha */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#22C7E0]" />
            <span>Tipos de imóvel * (múltipla escolha)</span>
          </label>
          <span className="text-[11px] text-slate-400 font-mono">
            {tiposImovel.length} selecionado{tiposImovel.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-[#081226]/80 border border-slate-800">
          {TIPOS_IMOVEL_INVESTIDOR.map((tipo) => {
            const isSelected = tiposImovel.includes(tipo.value)
            return (
              <button
                type="button"
                key={tipo.value}
                onClick={() => toggleTipoImovel(tipo.value)}
                disabled={loading}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[#1A3A75] border-[#22C7E0] text-white shadow-sm shadow-[#22C7E0]/20'
                    : 'bg-[#070B14] border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                    isSelected
                      ? 'bg-[#22C7E0] border-[#22C7E0] text-[#070B14]'
                      : 'border-slate-600 bg-transparent'
                  }`}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <span>{tipo.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ========================================================
          DIFERENCIAIS DO IMÓVEL (Busca do Comprador / Tese)
          Apresenta 3 opções por item: Obrigatório, Desejável, Indiferente (padrão).
          A lista se ajusta dinamicamente conforme os tipos marcados.
          ======================================================== */}
      {diferenciaisAplicaveis.length > 0 && (
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#22C7E0]" />
              <span>Diferenciais desejados na tese</span>
            </label>
            <span className="text-[11px] text-slate-400">
              Padrão: <strong className="text-slate-300">Indiferente</strong>
            </span>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl bg-[#081226]/80 border border-slate-800 space-y-3 max-h-72 overflow-y-auto">
            {gruposDiferenciais.map(([grupoNome, itensDoGrupo]) => (
              <div key={grupoNome} className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#22C7E0]/90 block">
                  {grupoNome}
                </span>

                <div className="space-y-1.5">
                  {itensDoGrupo.map((item) => {
                    const prefAtual: PreferenciaDiferencial =
                      diferenciaisInvestidor[item.codigo] || 'indiferente'
                    return (
                      <div
                        key={item.codigo}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg bg-[#070B14] border border-slate-800/80 hover:border-slate-700 transition-colors"
                      >
                        <span className="text-xs text-slate-200 select-none leading-snug">
                          {item.nome}
                        </span>

                        {/* 3 Opções por item: Indiferente (padrão) | Desejável | Obrigatório */}
                        <div className="flex items-center gap-1 bg-[#081226] p-0.5 rounded-lg border border-slate-800 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreferenciaDiferencial(item.codigo, 'indiferente')}
                            disabled={loading}
                            className={`px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                              prefAtual === 'indiferente'
                                ? 'bg-slate-700/80 text-white'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Indiferente
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreferenciaDiferencial(item.codigo, 'desejavel')}
                            disabled={loading}
                            className={`px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                              prefAtual === 'desejavel'
                                ? 'bg-[#1A3A75] text-[#22C7E0] border border-[#22C7E0]/40'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Desejável
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreferenciaDiferencial(item.codigo, 'obrigatorio')}
                            disabled={loading}
                            className={`px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                              prefAtual === 'obrigatorio'
                                ? 'bg-[#22C7E0] text-[#070B14] font-semibold'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Obrigatório
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cidades de interesse: Múltipla escolha com badges/chips interativos */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Cidades de interesse * (múltipla escolha)
          </label>
          <span className="text-[11px] text-slate-400">
            {cidadesSelecionadas.length} selecionada{cidadesSelecionadas.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-[#081226]/80 border border-slate-800">
          {CIDADES_DISPONIVEIS.map((cidade) => {
            const isSelected = cidadesSelecionadas.includes(cidade)
            return (
              <button
                type="button"
                key={cidade}
                onClick={() => toggleCidade(cidade)}
                disabled={loading}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[#1A3A75] border-[#22C7E0] text-white shadow-sm shadow-[#22C7E0]/20'
                    : 'bg-[#070B14] border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                    isSelected
                      ? 'bg-[#22C7E0] border-[#22C7E0] text-[#070B14]'
                      : 'border-slate-600 bg-transparent'
                  }`}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <span>{cidade}</span>
              </button>
            )
          })}
        </div>

        {/* Campo opcional para adicionar outra região/cidade */}
        <div className="pt-1">
          <input
            type="text"
            placeholder="Outra cidade ou bairro específico (pressione Enter para adicionar)"
            value={outraCidade}
            onChange={(e) => setOutraCidade(e.target.value)}
            onKeyDown={handleAddOutraCidade}
            disabled={loading}
            className="w-full px-3 py-2 rounded-lg bg-[#081226]/50 border border-slate-800 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-xs text-white placeholder-slate-500 outline-none transition-all disabled:opacity-50"
          />
        </div>
      </div>

      {/* Prazo de Decisão (Select estilizado no tema dark) */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          Prazo de decisão *
        </label>
        <div className="relative">
          <select
            required
            value={prazoDecisao}
            onChange={(e) => setPrazoDecisao(e.target.value as PrazoDecisaoInvestidor)}
            disabled={loading}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#081226] border border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white text-base sm:text-sm outline-none transition-all appearance-none cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            {OPCOES_PRAZO.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            ▼
          </div>
        </div>
      </div>

      {/* Checkbox de Autorização de Contato */}
      <div className="pt-1 space-y-1.5">
        <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#081226]/80 border border-slate-800 transition-colors hover:border-slate-700">
          <Checkbox
            id="autorizo-contato-investidor"
            checked={autorizoContato}
            onCheckedChange={(checked) => {
              const val = checked === true
              setAutorizoContato(val)
              setAutorizoTouched(true)
              if (
                val &&
                errorMsg === 'É necessário autorizar o contato para enviar o formulário.'
              ) {
                setErrorMsg('')
              }
            }}
            className="mt-0.5 border-slate-600 data-[state=checked]:bg-[#22C7E0] data-[state=checked]:border-[#22C7E0] data-[state=checked]:text-[#070B14] cursor-pointer"
          />
          <label
            htmlFor="autorizo-contato-investidor"
            className="text-xs text-slate-300 leading-snug cursor-pointer select-none"
          >
            Autorizo o contato por WhatsApp, telefone ou e-mail sobre este cadastro, de acordo com a{' '}
            <Link
              to="/politica-de-privacidade"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#22C7E0] hover:text-[#22C7E0]/80 underline underline-offset-2 transition-colors font-medium inline-block"
              onClick={(e) => e.stopPropagation()}
            >
              Política de Privacidade
            </Link>
            . *
          </label>
        </div>

        {autorizoTouched && !autorizoContato && (
          <p className="text-[11px] text-red-400 pl-1 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
            Por favor, marque a caixa acima para autorizar o contato antes de enviar.
          </p>
        )}
      </div>

      {/* Botão de envio: TEXTO EXATO "Registrar minha tese" */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={loading || !autorizoContato}
          className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 min-h-[48px] rounded-xl bg-[#1A3A75] hover:bg-[#142E5E] active:bg-[#0F2347] text-white font-semibold text-sm shadow-inner border border-white/10 hover:border-white/20 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
              <span>Processando tese de alocação...</span>
            </>
          ) : (
            <>
              <Compass className="w-4 h-4 text-[#22C7E0] shrink-0" />
              <span>Registrar minha tese</span>
              <ArrowRight className="w-4 h-4 ml-1 shrink-0" />
            </>
          )}
        </button>
      </div>

      {/* Microcopy de rodapé mantida */}
      <p className="text-[11px] text-center text-slate-400 pt-1 leading-relaxed">
        Seus dados são usados apenas para analisar o seu caso e não são compartilhados com
        terceiros. Você pode pedir a exclusão a qualquer momento.
      </p>
    </form>
  )
}
