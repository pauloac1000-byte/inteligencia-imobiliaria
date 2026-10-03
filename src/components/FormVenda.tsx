import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { salvarLeadVendaEtapa1, atualizarLeadVendaEtapa2 } from '@/services/leads'
import { consultarViaCEP, formatarCEP, normalizarDigitosCEP } from '@/services/viacep'
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Building2,
  Check,
  Sparkles,
  Search,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { ConfirmationProtocolo } from './ConfirmationProtocolo'
import { registrarEvento } from '@/services/eventos'
import {
  listarDiferenciais,
  filtrarDiferenciaisPorTipoImovel,
  DiferencialItem,
  DIFERENCIAIS_PADRAO,
} from '@/services/diferenciais'

interface FormVendaProps {
  onSuccess?: () => void
  onCancel?: () => void
  isInModal?: boolean
}

// Opções para os novos campos obrigatórios da etapa 2
const OPCOES_MOTIVO = [
  { value: 'inventário', label: 'Inventário' },
  { value: 'mudança', label: 'Mudança' },
  { value: 'preciso de liquidez', label: 'Preciso de liquidez' },
  { value: 'decisão de investimento', label: 'Decisão de investimento' },
  { value: 'outro', label: 'Outro' },
]

const OPCOES_PRAZO = [
  { value: 'até 60 dias', label: 'Até 60 dias' },
  { value: 'até 6 meses', label: 'Até 6 meses' },
  { value: 'sem pressa', label: 'Sem pressa' },
]

// Máscara e formatação de telefone/WhatsApp brasileiro
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

export const FormVenda: React.FC<FormVendaProps> = ({ onSuccess, onCancel, isInModal = true }) => {
  // Controle de etapa: 1 ou 2
  const [etapa, setEtapa] = useState<1 | 2>(1)
  const [leadId, setLeadId] = useState<string | null>(null)
  const [protocolo, setProtocolo] = useState<string>('')

  // Etapa 1: apenas 3 campos obrigatórios + diferenciais ("o imóvel tem")
  const [cidade, setCidade] = useState('')
  const [tipoImovel, setTipoImovel] = useState<string>('apartamento')
  const [diferenciaisSelecionados, setDiferenciaisSelecionados] = useState<string[]>([])
  const [todosDiferenciais, setTodosDiferenciais] = useState<DiferencialItem[]>(DIFERENCIAIS_PADRAO)
  const [telefone, setTelefone] = useState('')

  // Campos de endereço padronizados (preenchidos via CEP ou detecção)
  const [cep, setCep] = useState('')
  const [logradouro, setLogradouro] = useState('')
  const [bairro, setBairro] = useState('')
  const [codigoIbge, setCodigoIbge] = useState<string | null>(null)
  const [buscandoCep, setBuscandoCep] = useState(false)

  // Carrega diferenciais do banco na inicialização
  React.useEffect(() => {
    listarDiferenciais().then((itens) => {
      if (itens && itens.length > 0) {
        setTodosDiferenciais(itens)
      }
    })
  }, [])

  // Diferenciais filtrados para o tipo de imóvel atual (oculto para Terreno)
  const diferenciaisAplicaveis = React.useMemo(() => {
    return filtrarDiferenciaisPorTipoImovel(todosDiferenciais, tipoImovel)
  }, [todosDiferenciais, tipoImovel])

  // Agrupa diferenciais por grupo para organização visual limpa
  const gruposDiferenciais = React.useMemo(() => {
    const mapa = new Map<string, DiferencialItem[]>()
    for (const item of diferenciaisAplicaveis) {
      const g = item.grupo || 'Outros'
      if (!mapa.has(g)) mapa.set(g, [])
      mapa.get(g)!.push(item)
    }
    return Array.from(mapa.entries())
  }, [diferenciaisAplicaveis])

  const toggleDiferencial = (codigo: string) => {
    setDiferenciaisSelecionados((prev) =>
      prev.includes(codigo) ? prev.filter((c) => c !== codigo) : [...prev, codigo],
    )
  }

  // Campos de coerência do imóvel (especificação do motor de compatibilidade)
  const [precoPedido, setPrecoPedido] = useState('')
  const [precoMinimo, setPrecoMinimo] = useState('')
  const [areaUtil, setAreaUtil] = useState('')
  const [areaTerreno, setAreaTerreno] = useState('')
  const [quartos, setQuartos] = useState('')

  // Etapa 2: nome, email, valor estimado, motivo da venda, prazo desejado (+ mensagem opcional mantida)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [valorEstimado, setValorEstimado] = useState('')
  const [motivoVenda, setMotivoVenda] = useState<string>('preciso de liquidez')
  const [prazoDesejado, setPrazoDesejado] = useState<string>('até 60 dias')
  const [mensagem, setMensagem] = useState('')
  const [autorizoContato, setAutorizoContato] = useState(false)
  const [autorizoTouched, setAutorizoTouched] = useState(false)

  // Erros por campo para exibição em português junto de cada campo
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Estados de UI
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [sucesso, setSucesso] = useState(false)

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setTelefone(formatarTelefone(raw))
    if (errorMsg) setErrorMsg('')
    if (fieldErrors.telefone) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next.telefone
        return next
      })
    }
  }

  const mapearErroBanco = (mensagemErro: string) => {
    const novosErros: Record<string, string> = {}
    const msg = mensagemErro.toLowerCase()

    if (msg.includes('whatsapp') || msg.includes('+55') || msg.includes('telefone')) {
      novosErros.telefone = mensagemErro
    } else if (msg.includes('preço mínimo') || msg.includes('preco minimo')) {
      novosErros.precoMinimo = mensagemErro
    } else if (msg.includes('área útil') || msg.includes('area util')) {
      novosErros.areaUtil = mensagemErro
    } else if (msg.includes('área do terreno') || msg.includes('area do terreno')) {
      novosErros.areaTerreno = mensagemErro
    } else if (msg.includes('quarto')) {
      novosErros.quartos = mensagemErro
    } else if (msg.includes('cidade')) {
      novosErros.cidade = mensagemErro
    } else if (msg.includes('e-mail') || msg.includes('email')) {
      novosErros.email = mensagemErro
    } else if (msg.includes('nome')) {
      novosErros.nome = mensagemErro
    }

    setFieldErrors(novosErros)
    return mensagemErro
  }

  // Consulta automática do ViaCEP ao digitar 8 dígitos
  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatado = formatarCEP(e.target.value)
    setCep(formatado)
    const digitos = normalizarDigitosCEP(e.target.value)

    if (digitos.length === 8) {
      setBuscandoCep(true)
      try {
        const dados = await consultarViaCEP(digitos)
        if (dados) {
          if (dados.cidade) setCidade(dados.uf ? `${dados.cidade}, ${dados.uf}` : dados.cidade)
          if (dados.logradouro) setLogradouro(dados.logradouro)
          if (dados.bairro) setBairro(dados.bairro)
          if (dados.codigo_ibge) setCodigoIbge(dados.codigo_ibge)
        }
      } catch (err) {
        console.warn('Erro ao consultar ViaCEP no FormVenda:', err)
      } finally {
        setBuscandoCep(false)
      }
    }
  }

  // Também se o usuário digitar um CEP diretamente no campo Cidade / Estado
  const handleCidadeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setCidade(val)
    if (errorMsg) setErrorMsg('')

    // Se o usuário digitou ou colou um CEP no campo de cidade
    const digitos = normalizarDigitosCEP(val)
    if (digitos.length === 8 && /^\d{5}-?\d{3}$/.test(val.trim())) {
      setBuscandoCep(true)
      try {
        const dados = await consultarViaCEP(digitos)
        if (dados) {
          setCep(dados.cep)
          setCidade(dados.uf ? `${dados.cidade}, ${dados.uf}` : dados.cidade)
          if (dados.logradouro) setLogradouro(dados.logradouro)
          if (dados.bairro) setBairro(dados.bairro)
          if (dados.codigo_ibge) setCodigoIbge(dados.codigo_ibge)
        }
      } catch (err) {
        console.warn('Erro ao autocompletar via CEP no campo cidade:', err)
      } finally {
        setBuscandoCep(false)
      }
    }
  }

  // Avançar da Etapa 1 para Etapa 2 (Persistência imediata no banco)
  const handleAvancarEtapa1 = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})

    const errosLocais: Record<string, string> = {}

    if (!cidade.trim()) {
      errosLocais.cidade = 'Informe a cidade do imóvel.'
    }

    if (!tipoImovel) {
      errosLocais.tipoImovel = 'Selecione o tipo de imóvel.'
    }

    const digits = telefone.replace(/\D/g, '')
    if (!digits || digits.length < 10) {
      errosLocais.telefone = 'Por favor, informe um WhatsApp válido no formato +55 com DDD.'
    }

    // Validações locais adicionais conforme especificação
    const numPrecoPedido = precoPedido
      ? parseFloat(precoPedido.replace(/\./g, '').replace(',', '.'))
      : undefined
    const numPrecoMinimo = precoMinimo
      ? parseFloat(precoMinimo.replace(/\./g, '').replace(',', '.'))
      : undefined
    const numAreaUtil = areaUtil ? parseFloat(areaUtil.replace(',', '.')) : undefined
    const numAreaTerreno = areaTerreno ? parseFloat(areaTerreno.replace(',', '.')) : undefined
    const numQuartos = quartos !== '' ? parseInt(quartos, 10) : undefined

    if (
      numPrecoMinimo !== undefined &&
      numPrecoPedido !== undefined &&
      numPrecoMinimo > numPrecoPedido
    ) {
      errosLocais.precoMinimo = 'O preço mínimo não pode ser maior que o preço pedido.'
    }

    if (
      ['apartamento', 'casa', 'comercial'].includes(tipoImovel) &&
      numAreaUtil !== undefined &&
      numAreaUtil <= 0
    ) {
      errosLocais.areaUtil =
        'A área útil deve ser maior que zero nos tipos residencial e comercial.'
    }

    if (tipoImovel === 'terreno' && numAreaTerreno !== undefined && numAreaTerreno <= 0) {
      errosLocais.areaTerreno = 'A área do terreno deve ser maior que zero em terreno.'
    }

    if (
      ['apartamento', 'casa'].includes(tipoImovel) &&
      numQuartos !== undefined &&
      (numQuartos < 0 || numQuartos > 10)
    ) {
      errosLocais.quartos = 'O número de quartos deve estar entre 0 e 10 nos residenciais.'
    }

    if (Object.keys(errosLocais).length > 0) {
      setFieldErrors(errosLocais)
      setErrorMsg(Object.values(errosLocais)[0])
      return
    }

    setErrorMsg('')
    setLoading(true)

    // Filtra para garantir que apenas diferenciais aplicáveis ao tipo atual sejam enviados
    const codigosValidos = new Set(diferenciaisAplicaveis.map((d) => d.codigo))
    const diferenciaisFinal = diferenciaisSelecionados.filter((c) => codigosValidos.has(c))

    // Grava imediatamente o lead no Supabase na etapa 1
    const res = await salvarLeadVendaEtapa1({
      cidade,
      tipo_imovel: tipoImovel,
      telefone,
      rota: 'proprietario',
      diferenciais: diferenciaisFinal,
      cep: cep || undefined,
      logradouro: logradouro || undefined,
      bairro: bairro || undefined,
      codigo_ibge: codigoIbge || undefined,
      preco_pedido: numPrecoPedido,
      preco_minimo: numPrecoMinimo,
      area_util: numAreaUtil,
      quartos: numQuartos,
      area_terreno: numAreaTerreno,
    })

    setLoading(false)

    if (!res.success) {
      const err = res.error || 'Não foi possível registrar seu imóvel. Tente novamente.'
      mapearErroBanco(err)
      setErrorMsg(err)
      return
    }

    if (res.id) {
      setLeadId(res.id)
    }
    if (res.protocolo) {
      setProtocolo(res.protocolo)
    }

    // Dispara evento de etapa 1 concluída com sucesso
    registrarEvento('etapa1_concluida', window.location.pathname || '/', {
      origem: 'modal_proprietario',
    })

    // Avança para etapa 2
    setEtapa(2)
  }

  // Envio final da Etapa 2 (Atualiza o lead já criado)
  const handleSubmitEtapa2 = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})

    const errosLocais: Record<string, string> = {}

    if (!nome.trim()) {
      errosLocais.nome = 'Por favor, informe seu nome completo.'
    }

    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      errosLocais.email = 'Por favor, insira um endereço de e-mail válido.'
    }

    if (!motivoVenda) {
      errosLocais.motivoVenda = 'Selecione o motivo da venda.'
    }

    if (!prazoDesejado) {
      errosLocais.prazoDesejado = 'Selecione o prazo desejado para a venda.'
    }

    if (!autorizoContato) {
      setAutorizoTouched(true)
      errosLocais.autorizo = 'É necessário autorizar o contato para concluir o cadastro.'
    }

    const numPrecoPedido = precoPedido
      ? parseFloat(precoPedido.replace(/\./g, '').replace(',', '.'))
      : valorEstimado
        ? parseFloat(valorEstimado.replace(/\D/g, ''))
        : undefined
    const numPrecoMinimo = precoMinimo
      ? parseFloat(precoMinimo.replace(/\./g, '').replace(',', '.'))
      : undefined
    const numAreaUtil = areaUtil ? parseFloat(areaUtil.replace(',', '.')) : undefined
    const numAreaTerreno = areaTerreno ? parseFloat(areaTerreno.replace(',', '.')) : undefined
    const numQuartos = quartos !== '' ? parseInt(quartos, 10) : undefined

    if (
      numPrecoMinimo !== undefined &&
      numPrecoPedido !== undefined &&
      numPrecoMinimo > numPrecoPedido
    ) {
      errosLocais.precoMinimo = 'O preço mínimo não pode ser maior que o preço pedido.'
    }

    if (Object.keys(errosLocais).length > 0) {
      setFieldErrors(errosLocais)
      setErrorMsg(Object.values(errosLocais)[0])
      return
    }

    setErrorMsg('')
    setLoading(true)

    let protocoloFinal = protocolo

    const codigosValidos = new Set(diferenciaisAplicaveis.map((d) => d.codigo))
    const diferenciaisFinal = diferenciaisSelecionados.filter((c) => codigosValidos.has(c))

    if (leadId) {
      const res = await atualizarLeadVendaEtapa2({
        id: leadId,
        nome,
        email,
        valor_estimado:
          valorEstimado ||
          (numPrecoPedido ? `R$ ${numPrecoPedido.toLocaleString('pt-BR')}` : undefined),
        motivo_venda: motivoVenda,
        prazo_desejado: prazoDesejado,
        mensagem: mensagem || undefined,
        diferenciais: diferenciaisFinal,
        cep: cep || undefined,
        logradouro: logradouro || undefined,
        bairro: bairro || undefined,
        cidade: cidade || undefined,
        codigo_ibge: codigoIbge || undefined,
        preco_pedido: numPrecoPedido,
        preco_minimo: numPrecoMinimo,
        area_util: numAreaUtil,
        quartos: numQuartos,
        area_terreno: numAreaTerreno,
      })

      setLoading(false)

      if (!res.success) {
        const err = res.error || 'Ocorreu um erro ao atualizar suas informações. Tente novamente.'
        mapearErroBanco(err)
        setErrorMsg(err)
        return
      }
      if (res.protocolo) {
        protocoloFinal = res.protocolo
      }
    } else {
      // Fallback defensivo: se por algum motivo leadId não tiver sido salvo, faz insert completo
      const { salvarLeadVenda } = await import('@/services/leads')
      const res = await salvarLeadVenda({
        cidade,
        tipo_imovel: tipoImovel,
        telefone,
        nome,
        email,
        valor_estimado:
          valorEstimado ||
          (numPrecoPedido ? `R$ ${numPrecoPedido.toLocaleString('pt-BR')}` : undefined),
        motivo_venda: motivoVenda,
        prazo_desejado: prazoDesejado,
        mensagem: mensagem || undefined,
        rota: 'proprietario',
        diferenciais: diferenciaisFinal,
        cep: cep || undefined,
        logradouro: logradouro || undefined,
        bairro: bairro || undefined,
        codigo_ibge: codigoIbge || undefined,
        preco_pedido: numPrecoPedido,
        preco_minimo: numPrecoMinimo,
        area_util: numAreaUtil,
        quartos: numQuartos,
        area_terreno: numAreaTerreno,
      })

      setLoading(false)

      if (!res.success) {
        const err = res.error || 'Ocorreu um erro ao registrar suas informações. Tente novamente.'
        mapearErroBanco(err)
        setErrorMsg(err)
        return
      }
      if (res.protocolo) {
        protocoloFinal = res.protocolo
      }
    }

    setProtocolo(protocoloFinal || 'KX-0001')
    setSucesso(true)

    // Dispara evento de cadastro completo do proprietário
    registrarEvento('cadastro_completo', window.location.pathname || '/', {
      origem: 'modal_proprietario',
    })
  }

  const handleReset = () => {
    setEtapa(1)
    setLeadId(null)
    setProtocolo('')
    setCidade('')
    setCep('')
    setLogradouro('')
    setBairro('')
    setCodigoIbge(null)
    setTipoImovel('apartamento')
    setDiferenciaisSelecionados([])
    setTelefone('')
    setNome('')
    setEmail('')
    setValorEstimado('')
    setMotivoVenda('preciso de liquidez')
    setPrazoDesejado('até 60 dias')
    setMensagem('')
    setPrecoPedido('')
    setPrecoMinimo('')
    setAreaUtil('')
    setAreaTerreno('')
    setQuartos('')
    setAutorizoContato(false)
    setAutorizoTouched(false)
    setFieldErrors({})
    setSucesso(false)
    setErrorMsg('')
  }

  if (sucesso) {
    return (
      <ConfirmationProtocolo
        protocolo={protocolo || 'KX-0001'}
        rota="proprietario"
        onReset={handleReset}
        onClose={onCancel}
        resetLabel="Cadastrar outro imóvel"
      />
    )
  }

  return (
    <div className="space-y-4 text-left">
      {/* Indicador de progresso discreto no padrão dark tech */}
      <div className="space-y-2 pb-1 border-b border-slate-800/80">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">
              {etapa === 1 ? 'Etapa 1 de 2: Dados do imóvel' : 'Etapa 2 de 2: Perfil e contato'}
            </span>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">
            {etapa === 1 ? '50%' : '100%'}
          </span>
        </div>

        {/* Barra de progresso com os passos numerados */}
        <div className="grid grid-cols-2 gap-2">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              etapa >= 1 ? 'bg-[#22C7E0]' : 'bg-slate-800'
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              etapa === 2 ? 'bg-[#22C7E0]' : 'bg-slate-800'
            }`}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
          <span className="inline-flex items-center gap-1 text-[#22C7E0]">
            <Check className="w-3 h-3 text-[#22C7E0]" /> Imóvel & WhatsApp
          </span>
          <span className={etapa === 2 ? 'text-[#22C7E0]' : 'text-slate-500'}>
            Detalhes da negociação
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs bg-red-500/20 border border-red-500/40 text-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ========================================================
          ETAPA 1: Apenas 3 campos obrigatórios + Botão Continuar
          (cidade, tipo de imóvel e WhatsApp)
          ======================================================== */}
      {etapa === 1 && (
        <form onSubmit={handleAvancarEtapa1} className="space-y-4 animate-fade-in">
          {/* Cidade / Estado com suporte a digitação do CEP ou busca por ViaCEP sem alterar layout */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Cidade / Estado ou CEP *
              </label>
              {buscandoCep && (
                <span className="text-[11px] text-[#22C7E0] flex items-center gap-1 font-mono">
                  <Loader2 className="w-3 h-3 animate-spin" /> Buscando endereço...
                </span>
              )}
              {codigoIbge && !buscandoCep && (
                <span className="text-[10px] text-emerald-400 font-mono">IBGE: {codigoIbge}</span>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Ex.: São Paulo, SP ou digite o CEP (01310-100)"
                value={cidade}
                onChange={handleCidadeChange}
                disabled={loading}
                className={`w-full px-3.5 py-2.5 rounded-lg bg-[#081226] border text-white placeholder-slate-500 text-base sm:text-sm outline-none transition-all disabled:opacity-50 min-h-[44px] ${
                  fieldErrors.cidade
                    ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                    : 'border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0]'
                }`}
              />
              {fieldErrors.cidade && (
                <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
                  <span>{fieldErrors.cidade}</span>
                </p>
              )}
              {buscandoCep && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Loader2 className="w-4 h-4 text-[#22C7E0] animate-spin" />
                </div>
              )}
            </div>

            {/* Se logradouro ou bairro foram identificados pelo CEP, exibe discretamente sem alterar estrutura */}
            {(bairro || logradouro) && (
              <p className="text-[11px] text-slate-400 pl-0.5 truncate">
                Localizado:{' '}
                <span className="text-slate-200">
                  {[logradouro, bairro].filter(Boolean).join(', ')}
                </span>
              </p>
            )}
          </div>

          {/* Grid: Tipo de imóvel e WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Tipo de imóvel *
              </label>
              <div className="relative">
                <select
                  required
                  value={tipoImovel}
                  onChange={(e) => {
                    setTipoImovel(e.target.value)
                    if (errorMsg) setErrorMsg('')
                  }}
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#081226] border border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white text-base sm:text-sm outline-none transition-all appearance-none cursor-pointer disabled:opacity-50 min-h-[44px]"
                >
                  <option value="apartamento">Apartamento</option>
                  <option value="casa">Casa</option>
                  <option value="terreno">Terreno / Lote</option>
                  <option value="comercial">Imóvel Comercial / Sala</option>
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  ▼
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                WhatsApp *
              </label>
              <input
                type="tel"
                required
                placeholder="(11) 98765-4321"
                value={telefone}
                onChange={handleTelefoneChange}
                disabled={loading}
                className={`w-full px-3.5 py-2.5 rounded-lg bg-[#081226] border text-white placeholder-slate-500 text-base sm:text-sm outline-none transition-all disabled:opacity-50 min-h-[44px] ${
                  fieldErrors.telefone
                    ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                    : 'border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0]'
                }`}
              />
              {fieldErrors.telefone && (
                <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
                  <span>{fieldErrors.telefone}</span>
                </p>
              )}
            </div>
          </div>

          {/* Dados técnicos para coerência e motor de compatibilidade (área útil / terreno / quartos) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {['apartamento', 'casa', 'comercial'].includes(tipoImovel) && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Área útil (m²) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="Ex.: 85"
                  value={areaUtil}
                  onChange={(e) => {
                    setAreaUtil(e.target.value)
                    if (fieldErrors.areaUtil) {
                      setFieldErrors((prev) => {
                        const n = { ...prev }
                        delete n.areaUtil
                        return n
                      })
                    }
                  }}
                  disabled={loading}
                  className={`w-full px-3.5 py-2.5 rounded-lg bg-[#081226] border text-white placeholder-slate-500 text-base sm:text-sm outline-none transition-all disabled:opacity-50 min-h-[44px] ${
                    fieldErrors.areaUtil
                      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0]'
                  }`}
                />
                {fieldErrors.areaUtil && (
                  <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
                    <span>{fieldErrors.areaUtil}</span>
                  </p>
                )}
              </div>
            )}

            {tipoImovel === 'terreno' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Área do terreno (m²) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="Ex.: 300"
                  value={areaTerreno}
                  onChange={(e) => {
                    setAreaTerreno(e.target.value)
                    if (fieldErrors.areaTerreno) {
                      setFieldErrors((prev) => {
                        const n = { ...prev }
                        delete n.areaTerreno
                        return n
                      })
                    }
                  }}
                  disabled={loading}
                  className={`w-full px-3.5 py-2.5 rounded-lg bg-[#081226] border text-white placeholder-slate-500 text-base sm:text-sm outline-none transition-all disabled:opacity-50 min-h-[44px] ${
                    fieldErrors.areaTerreno
                      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0]'
                  }`}
                />
                {fieldErrors.areaTerreno && (
                  <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
                    <span>{fieldErrors.areaTerreno}</span>
                  </p>
                )}
              </div>
            )}

            {['apartamento', 'casa'].includes(tipoImovel) && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Quartos (0 a 10)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  placeholder="Ex.: 3"
                  value={quartos}
                  onChange={(e) => {
                    setQuartos(e.target.value)
                    if (fieldErrors.quartos) {
                      setFieldErrors((prev) => {
                        const n = { ...prev }
                        delete n.quartos
                        return n
                      })
                    }
                  }}
                  disabled={loading}
                  className={`w-full px-3.5 py-2.5 rounded-lg bg-[#081226] border text-white placeholder-slate-500 text-base sm:text-sm outline-none transition-all disabled:opacity-50 min-h-[44px] ${
                    fieldErrors.quartos
                      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0]'
                  }`}
                />
                {fieldErrors.quartos && (
                  <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
                    <span>{fieldErrors.quartos}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ========================================================
              DIFERENCIAIS DO IMÓVEL (O imóvel tem)
              Mostra caixas de marcar para os diferenciais aplicáveis ao tipo selecionado.
              Quando for Terreno, NÃO mostra a lista.
              ======================================================== */}
          {diferenciaisAplicaveis.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#22C7E0]" />
                  <span>O imóvel tem</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {
                    diferenciaisSelecionados.filter((c) =>
                      diferenciaisAplicaveis.some((d) => d.codigo === c),
                    ).length
                  }{' '}
                  marcado{diferenciaisSelecionados.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="p-3 sm:p-3.5 rounded-xl bg-[#081226]/80 border border-slate-800 space-y-3 max-h-60 overflow-y-auto">
                {gruposDiferenciais.map(([grupoNome, itensDoGrupo]) => (
                  <div key={grupoNome} className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#22C7E0]/90 block">
                      {grupoNome}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {itensDoGrupo.map((item) => {
                        const isChecked = diferenciaisSelecionados.includes(item.codigo)
                        return (
                          <button
                            type="button"
                            key={item.codigo}
                            onClick={() => toggleDiferencial(item.codigo)}
                            disabled={loading}
                            className={`flex items-center gap-2 p-2 rounded-lg text-xs text-left transition-all cursor-pointer border ${
                              isChecked
                                ? 'bg-[#1A3A75]/50 border-[#22C7E0] text-white shadow-sm'
                                : 'bg-[#070B14] border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                                isChecked
                                  ? 'bg-[#22C7E0] border-[#22C7E0] text-[#070B14]'
                                  : 'border-slate-600 bg-transparent'
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="leading-snug select-none">{item.nome}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 rounded-lg bg-[#081226]/60 border border-slate-800 text-slate-300 text-xs leading-relaxed flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-[#22C7E0] shrink-0 animate-pulse" />
            <span>
              Preencha para iniciar o cruzamento instantâneo com compradores em potencial da sua
              região.
            </span>
          </div>

          {/* Botão de avançar etapa 1 */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 min-h-[48px] rounded-xl bg-[#1A3A75] hover:bg-[#142E5E] active:bg-[#0F2347] text-white font-semibold text-sm shadow-inner border border-white/10 hover:border-white/20 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                  <span>Salvando dados e avançando...</span>
                </>
              ) : (
                <>
                  <span>Continuar</span>
                  <ArrowRight className="w-4 h-4 ml-1 shrink-0" />
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-center text-slate-400 pt-1 leading-relaxed">
            Seus dados são protegidos e usados exclusivamente para a avaliação técnica do imóvel.
          </p>
        </form>
      )}

      {/* ========================================================
          ETAPA 2: Nome, E-mail, Valor estimado, Motivo da venda,
          Prazo desejado (+ detalhes opcionais) e Checkbox obrigatório
          ======================================================== */}
      {etapa === 2 && (
        <form onSubmit={handleSubmitEtapa2} className="space-y-4 animate-fade-in">
          {/* Botão voltar para etapa 1 */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setErrorMsg('')
                setEtapa(1)
              }}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar para etapa 1</span>
            </button>
            <span className="text-[11px] text-[#22C7E0] font-medium">Etapa 1 salva no banco</span>
          </div>

          {/* Grid: Nome e E-mail */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Nome completo *
              </label>
              <input
                type="text"
                required
                placeholder="Ex.: Carlos Mendes"
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value)
                  if (errorMsg) setErrorMsg('')
                }}
                disabled={loading}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#081226] border border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white placeholder-slate-500 text-base sm:text-sm outline-none transition-all disabled:opacity-50 min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                E-mail *
              </label>
              <input
                type="email"
                required
                placeholder="carlos@exemplo.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errorMsg) setErrorMsg('')
                }}
                disabled={loading}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#081226] border border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white placeholder-slate-500 text-base sm:text-sm outline-none transition-all disabled:opacity-50 min-h-[44px]"
              />
            </div>
          </div>

          {/* Grid: Motivo da venda e Prazo desejado (novos campos obrigatórios) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Motivo da venda *
              </label>
              <div className="relative">
                <select
                  required
                  value={motivoVenda}
                  onChange={(e) => {
                    setMotivoVenda(e.target.value)
                    if (errorMsg) setErrorMsg('')
                  }}
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#081226] border border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white text-base sm:text-sm outline-none transition-all appearance-none cursor-pointer disabled:opacity-50 min-h-[44px]"
                >
                  {OPCOES_MOTIVO.map((op) => (
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

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Prazo desejado *
              </label>
              <div className="relative">
                <select
                  required
                  value={prazoDesejado}
                  onChange={(e) => {
                    setPrazoDesejado(e.target.value)
                    if (errorMsg) setErrorMsg('')
                  }}
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
          </div>

          {/* Grid: Preço Pedido e Preço Mínimo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Preço pedido (R$)
              </label>
              <input
                type="text"
                placeholder="Ex.: 850.000"
                value={precoPedido || valorEstimado}
                onChange={(e) => {
                  setPrecoPedido(e.target.value)
                  setValorEstimado(e.target.value)
                  if (fieldErrors.precoPedido) {
                    setFieldErrors((prev) => {
                      const n = { ...prev }
                      delete n.precoPedido
                      return n
                    })
                  }
                }}
                disabled={loading}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#081226] border border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white placeholder-slate-500 text-base sm:text-sm outline-none transition-all disabled:opacity-50 min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Preço mínimo aceito (R$)
              </label>
              <input
                type="text"
                placeholder="Ex.: 800.000"
                value={precoMinimo}
                onChange={(e) => {
                  setPrecoMinimo(e.target.value)
                  if (fieldErrors.precoMinimo) {
                    setFieldErrors((prev) => {
                      const n = { ...prev }
                      delete n.precoMinimo
                      return n
                    })
                  }
                }}
                disabled={loading}
                className={`w-full px-3.5 py-2.5 rounded-lg bg-[#081226] border text-white placeholder-slate-500 text-base sm:text-sm outline-none transition-all disabled:opacity-50 min-h-[44px] ${
                  fieldErrors.precoMinimo
                    ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                    : 'border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0]'
                }`}
              />
              {fieldErrors.precoMinimo && (
                <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
                  <span>{fieldErrors.precoMinimo}</span>
                </p>
              )}
            </div>
          </div>

          {/* Mensagem / Observações */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              DESCRIÇÃO DETALHADA DO IMÓVEL E MENSAGENS ADICIONAIS
            </label>
            <textarea
              rows={isInModal ? 2 : 3}
              placeholder="Quanto mais precisas as informações maiores a chances de uma negociação assertiva: localização, metragem, descrição dos cômodos, IPTU, condomínio, etc."
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              disabled={loading}
              className="w-full px-3.5 py-2 rounded-lg bg-[#081226] border border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white placeholder-slate-500 text-sm outline-none transition-all resize-none disabled:opacity-50"
            />
          </div>

          {/* Checkbox de Autorização de Contato */}
          <div className="pt-1 space-y-1.5">
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#081226]/80 border border-slate-800 transition-colors hover:border-slate-700">
              <Checkbox
                id="autorizo-contato-venda-etapa2"
                checked={autorizoContato}
                onCheckedChange={(checked) => {
                  const val = checked === true
                  setAutorizoContato(val)
                  setAutorizoTouched(true)
                  if (
                    val &&
                    errorMsg === 'É necessário autorizar o contato para concluir o cadastro.'
                  ) {
                    setErrorMsg('')
                  }
                }}
                className="mt-0.5 border-slate-600 data-[state=checked]:bg-[#22C7E0] data-[state=checked]:border-[#22C7E0] data-[state=checked]:text-[#070B14] cursor-pointer"
              />
              <label
                htmlFor="autorizo-contato-venda-etapa2"
                className="text-xs text-slate-300 leading-snug cursor-pointer select-none"
              >
                Autorizo o contato por WhatsApp, telefone ou e-mail sobre este cadastro, de acordo
                com a{' '}
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

          {/* Botão de envio final (mantido estilo e copy) */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !autorizoContato}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 min-h-[48px] rounded-xl bg-[#1A3A75] hover:bg-[#142E5E] active:bg-[#0F2347] text-white font-semibold text-sm shadow-inner border border-white/10 hover:border-white/20 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                  <span>Processando cadastro...</span>
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>Cadastrar imóvel para venda</span>
                  <ArrowRight className="w-4 h-4 ml-1 shrink-0" />
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-center text-slate-400 pt-1 leading-relaxed">
            Seus dados são usados apenas para analisar o seu caso e não são compartilhados com
            terceiros. Você pode pedir a exclusão a qualquer momento.
          </p>
        </form>
      )}
    </div>
  )
}
