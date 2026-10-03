import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  salvarLeadInvestidor,
  FinalidadeComprador,
  FormaPagamentoComprador,
  PrazoMudanca,
} from '@/services/leads'
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Compass,
  Check,
  Sparkles,
  Building2,
  MapPin,
  DollarSign,
  Wallet,
  Calendar,
  Layers,
  Percent,
  Search,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { ConfirmationProtocolo } from './ConfirmationProtocolo'
import { registrarEvento } from '@/services/eventos'
import {
  listarDiferenciais,
  filtrarDiferenciaisPorTiposInvestidor,
  DiferencialItem,
  PreferenciaDiferencial,
  DIFERENCIAIS_PADRAO,
} from '@/services/diferenciais'
import { consultarViaCEP, formatarCEP, normalizarDigitosCEP } from '@/services/viacep'
import {
  listarMunicipiosSP,
  listarRegioesAtalho,
  MunicipioSP,
  RegiaoAtalho,
  MUNICIPIOS_SP_FALLBACK,
  REGIOES_ATALHO_FALLBACK,
} from '@/services/regioes'

interface FormInvestidorProps {
  onSuccess?: () => void
  onCancel?: () => void
  isInModal?: boolean
}

// Tipos de imóvel espelhados do formulário de venda
const OPCOES_TIPOS_IMOVEL: { value: string; label: string }[] = [
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'casa', label: 'Casa' },
  { value: 'terreno', label: 'Terreno / Lote' },
  { value: 'comercial', label: 'Imóvel Comercial / Sala' },
]

// Opções de Prazo de Decisão (espelhadas das faixas do vendedor)
const OPCOES_PRAZO_DECISAO = [
  { value: 'até 60 dias', label: 'Até 60 dias' },
  { value: 'até 6 meses', label: 'Até 6 meses' },
  { value: 'sem pressa', label: 'Sem pressa' },
]

// Opções de Prazo para mudar (quando finalidade = morar)
const OPCOES_PRAZO_MUDANCA: { value: PrazoMudanca; label: string }[] = [
  { value: 'ate_30_dias', label: 'Até 30 dias' },
  { value: 'ate_60_dias', label: 'Até 60 dias' },
  { value: 'ate_90_dias', label: 'Até 90 dias' },
]

// Opções de forma de pagamento
const OPCOES_PAGAMENTO: { value: FormaPagamentoComprador; label: string }[] = [
  { value: 'a_vista', label: 'Recursos próprios (à vista)' },
  { value: 'financiamento_aprovado', label: 'Financiamento bancário (já aprovado)' },
  { value: 'financiamento_a_aprovar', label: 'Financiamento bancário (a aprovar)' },
]

// Máscara de telefone
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

// Formatação monetária amigável
function formatarMoedaInput(valor: string): string {
  const digits = valor.replace(/\D/g, '')
  if (!digits) return ''
  const num = parseInt(digits, 10)
  return num.toLocaleString('pt-BR')
}

function parseMoedaParaNumero(valor: string): number | undefined {
  const digits = valor.replace(/\D/g, '')
  if (!digits) return undefined
  return parseInt(digits, 10)
}

export const FormInvestidor: React.FC<FormInvestidorProps> = ({
  onSuccess,
  onCancel,
  isInModal = true,
}) => {
  // Controle de Etapas: 1 (WhatsApp, Finalidade, Tipo inicial) -> 2 (Preço, Tipos, Mínimos) -> 3 (Pagamento, Prazo, Reforma, Específicos) -> 4 (Localização completa) -> 5 (Diferenciais opcionais & Confirmação)
  const [etapa, setEtapa] = useState<1 | 2 | 3 | 4 | 5>(1)

  // ==========================================
  // ETAPA 1 (Máximo 3 campos conforme restrição)
  // 1. Finalidade (morar, renda_aluguel, revenda)
  // 2. WhatsApp
  // 3. Nome completo (ou tipo principal de partida)
  // ==========================================
  const [finalidade, setFinalidade] = useState<FinalidadeComprador>('renda_aluguel')
  const [telefone, setTelefone] = useState('')
  const [nome, setNome] = useState('')

  // ==========================================
  // ETAPA 2: Faixa de Preço & Tipos de Imóvel Aceitos & Mínimos Condicionais
  // ==========================================
  const [precoMinimoStr, setPrecoMinimoStr] = useState('')
  const [precoMaximoStr, setPrecoMaximoStr] = useState('')
  const [precoTetoStr, setPrecoTetoStr] = useState('')

  const [tiposImovel, setTiposImovel] = useState<string[]>(['apartamento', 'casa'])

  // Mínimos por tipo de imóvel
  // Residencial (apartamento/casa): área mínima, quartos mínimos, vagas mínimas
  const [minAreaResidencial, setMinAreaResidencial] = useState<string>('')
  const [minQuartos, setMinQuartos] = useState<string>('')
  const [minVagasResidencial, setMinVagasResidencial] = useState<string>('')

  // Comercial: área mínima, vagas mínimas
  const [minAreaComercial, setMinAreaComercial] = useState<string>('')
  const [minVagasComercial, setMinVagasComercial] = useState<string>('')

  // Terreno: área do terreno mínima
  const [minAreaTerreno, setMinAreaTerreno] = useState<string>('')

  // ==========================================
  // ETAPA 3: Forma de Pagamento, Prazo, Reforma e Campos Específicos da Finalidade
  // ==========================================
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamentoComprador>('a_vista')
  const [usaFgts, setUsaFgts] = useState<boolean>(false)
  const [prazoDecisao, setPrazoDecisao] = useState<string>('até 60 dias')
  const [aceitaReforma, setAceitaReforma] = useState<boolean>(true)

  // Se morar -> Prazo para mudar (até 30, 60 ou 90 dias)
  const [prazoMudanca, setPrazoMudanca] = useState<PrazoMudanca>('ate_60_dias')

  // Se renda -> Yield mínimo em % ao mês (opcional)
  const [yieldMinimo, setYieldMinimo] = useState<string>('')

  // ==========================================
  // ETAPA 4: Localização (Municípios SP por IBGE + Atalhos de Região + Bairros + Raio)
  // ==========================================
  const [municipiosSP, setMunicipiosSP] = useState<MunicipioSP[]>(MUNICIPIOS_SP_FALLBACK)
  const [regioesAtalho, setRegioesAtalho] = useState<RegiaoAtalho[]>(REGIOES_ATALHO_FALLBACK)
  const [cidadesCodigos, setCidadesCodigos] = useState<string[]>(['3550308']) // São Paulo por padrão
  const [atalhosSelecionados, setAtalhosSelecionados] = useState<string[]>([])
  const [buscaCidade, setBuscaCidade] = useState<string>('')
  const [bairrosPreferidos, setBairrosPreferidos] = useState<string>('')
  const [raioKm, setRaioKm] = useState<string>('')
  const [pontoReferencia, setPontoReferencia] = useState<string>('')

  // Dados resolvidos a partir de CEP digitado no Ponto de Referência
  const [cepReferencia, setCepReferencia] = useState<string>('')
  const [logradouroReferencia, setLogradouroReferencia] = useState<string>('')
  const [bairroReferencia, setBairroReferencia] = useState<string>('')
  const [codigoIbgeReferencia, setCodigoIbgeReferencia] = useState<string>('')
  const [buscandoCepReferencia, setBuscandoCepReferencia] = useState(false)

  // ==========================================
  // ETAPA 5: Diferenciais Desejados & Consentimento
  // ==========================================
  const [todosDiferenciais, setTodosDiferenciais] = useState<DiferencialItem[]>(DIFERENCIAIS_PADRAO)
  const [diferenciaisInvestidor, setDiferenciaisInvestidor] = useState<
    Record<string, PreferenciaDiferencial>
  >({})
  const [email, setEmail] = useState('')
  const [autorizoContato, setAutorizoContato] = useState(false)
  const [autorizoTouched, setAutorizoTouched] = useState(false)

  // Estados de UI
  const [protocolo, setProtocolo] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Carrega diferenciais, cidades de SP e atalhos de região do Supabase
  useEffect(() => {
    listarDiferenciais().then((itens) => {
      if (itens && itens.length > 0) setTodosDiferenciais(itens)
    })
    listarMunicipiosSP().then((itens) => {
      if (itens && itens.length > 0) setMunicipiosSP(itens)
    })
    listarRegioesAtalho(true).then((itens) => {
      if (itens && itens.length > 0) setRegioesAtalho(itens)
    })
  }, [])

  // Mapa rápido de código IBGE -> Nome da Cidade
  const mapaMunicipios = useMemo(() => {
    const mapa = new Map<string, string>()
    for (const m of municipiosSP) {
      mapa.set(m.codigo_ibge, m.nome)
    }
    return mapa
  }, [municipiosSP])

  // Diferenciais filtrados com base nos tipos de imóvel escolhidos
  const diferenciaisAplicaveis = useMemo(() => {
    return filtrarDiferenciaisPorTiposInvestidor(todosDiferenciais, tiposImovel)
  }, [todosDiferenciais, tiposImovel])

  const gruposDiferenciais = useMemo(() => {
    const mapa = new Map<string, DiferencialItem[]>()
    for (const item of diferenciaisAplicaveis) {
      const g = item.grupo || 'Outros'
      if (!mapa.has(g)) mapa.set(g, [])
      mapa.get(g)!.push(item)
    }
    return Array.from(mapa.entries())
  }, [diferenciaisAplicaveis])

  // Verificações de presença dos tipos
  const temResidencial = tiposImovel.includes('apartamento') || tiposImovel.includes('casa')
  const temComercial = tiposImovel.includes('comercial')
  const temTerreno = tiposImovel.includes('terreno')

  // Municípios filtrados pela busca
  const municipiosFiltrados = useMemo(() => {
    if (!buscaCidade.trim()) return municipiosSP.slice(0, 15)
    const termo = buscaCidade.toLowerCase().trim()
    return municipiosSP
      .filter(
        (m) =>
          m.nome.toLowerCase().includes(termo) ||
          m.nome_normalizado.includes(termo) ||
          m.codigo_ibge.includes(termo),
      )
      .slice(0, 20)
  }, [municipiosSP, buscaCidade])

  // Toggle tipo de imóvel
  const toggleTipoImovel = (tipo: string) => {
    if (errorMsg) setErrorMsg('')
    setTiposImovel((prev) => {
      if (prev.includes(tipo)) {
        if (prev.length === 1) return prev
        return prev.filter((t) => t !== tipo)
      } else {
        return [...prev, tipo]
      }
    })
  }

  // Toggle cidade individual por código IBGE
  const toggleCidadeCodigo = (codigo: string) => {
    if (errorMsg) setErrorMsg('')
    setCidadesCodigos((prev) =>
      prev.includes(codigo) ? prev.filter((c) => c !== codigo) : [...prev, codigo],
    )
  }

  // Toggle de Atalho de Região (marca ou desmarca todas as cidades do grupo de uma vez)
  const toggleAtalhoRegiao = (atalho: RegiaoAtalho) => {
    if (errorMsg) setErrorMsg('')
    const codigosDoAtalho = atalho.cidades.map((c) => c.codigo)
    const jaContemTodos = codigosDoAtalho.every((c) => cidadesCodigos.includes(c))

    if (jaContemTodos) {
      // Desmarca as cidades do atalho
      setCidadesCodigos((prev) => prev.filter((c) => !codigosDoAtalho.includes(c)))
      setAtalhosSelecionados((prev) => prev.filter((nome) => nome !== atalho.nome))
    } else {
      // Adiciona as cidades do atalho que ainda não estão selecionadas
      setCidadesCodigos((prev) => Array.from(new Set([...prev, ...codigosDoAtalho])))
      if (!atalhosSelecionados.includes(atalho.nome)) {
        setAtalhosSelecionados((prev) => [...prev, atalho.nome])
      }
    }
  }

  const setPreferenciaDiferencial = (codigo: string, pref: PreferenciaDiferencial) => {
    setDiferenciaisInvestidor((prev) => ({
      ...prev,
      [codigo]: pref,
    }))
  }

  // Navegação entre etapas com validações
  const avancarEtapa1 = (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    const digits = telefone.replace(/\D/g, '')
    if (!digits || digits.length < 10) {
      const msg = 'Por favor, informe um WhatsApp válido no formato +55 com DDD.'
      setFieldErrors({ telefone: msg })
      setErrorMsg(msg)
      return
    }
    setErrorMsg('')
    registrarEvento('etapa1_concluida', window.location.pathname || '/', {
      origem: 'modal_investidor_expansao',
      finalidade,
    })
    setEtapa(2)
  }

  const avancarEtapa2 = (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})

    const precoMin = parseMoedaParaNumero(precoMinimoStr)
    const precoMax = parseMoedaParaNumero(precoMaximoStr)

    if (precoMin !== undefined && precoMax !== undefined && precoMin >= precoMax) {
      const msg = 'O valor mínimo da faixa deve ser estritamente menor que o valor máximo.'
      setFieldErrors({ precoMinimo: msg })
      setErrorMsg(msg)
      return
    }

    if (tiposImovel.length === 0) {
      setErrorMsg('Selecione pelo menos um tipo de imóvel aceito.')
      return
    }
    setErrorMsg('')
    setEtapa(3)
  }

  const avancarEtapa3 = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setEtapa(4)
  }

  const avancarEtapa4 = (e: React.FormEvent) => {
    e.preventDefault()
    if (cidadesCodigos.length === 0) {
      setErrorMsg('Selecione pelo menos uma cidade ou utilize os atalhos de região.')
      return
    }
    setErrorMsg('')
    setEtapa(5)
  }

  // Submissão Final (Etapa 5)
  const handleSubmitFinal = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})

    if (!autorizoContato) {
      setAutorizoTouched(true)
      setErrorMsg('É necessário autorizar o contato para enviar o formulário.')
      return
    }

    // Parse de valores numéricos
    const precoMin = parseMoedaParaNumero(precoMinimoStr)
    const precoMax = parseMoedaParaNumero(precoMaximoStr)
    const precoTeto = parseMoedaParaNumero(precoTetoStr)

    if (precoMin !== undefined && precoMax !== undefined && precoMin >= precoMax) {
      const msg = 'O valor mínimo da faixa deve ser estritamente menor que o valor máximo.'
      setFieldErrors({ precoMinimo: msg })
      setErrorMsg(msg)
      setEtapa(2)
      return
    }

    setErrorMsg('')
    setLoading(true)

    // Prepara nomes das cidades para manter retrocompatibilidade com cidades_interesse texto
    const nomesCidades = cidadesCodigos.map((cod) => mapaMunicipios.get(cod) || cod)

    // Mínimos
    const minArea = temResidencial
      ? parseFloat(minAreaResidencial) || undefined
      : temComercial
        ? parseFloat(minAreaComercial) || undefined
        : undefined

    const minVagas = temResidencial
      ? parseInt(minVagasResidencial, 10) || undefined
      : temComercial
        ? parseInt(minVagasComercial, 10) || undefined
        : undefined

    const minQ = temResidencial ? parseInt(minQuartos, 10) || undefined : undefined
    const minTerr = temTerreno ? parseFloat(minAreaTerreno) || undefined : undefined

    const yieldNum = yieldMinimo
      ? parseFloat(yieldMinimo.replace(',', '.')) || undefined
      : undefined

    // Filtro de diferenciais válidos
    const codigosValidos = new Set(diferenciaisAplicaveis.map((d) => d.codigo))
    const diferenciaisFiltrados: Record<string, PreferenciaDiferencial> = {}
    for (const [cod, pref] of Object.entries(diferenciaisInvestidor)) {
      if (codigosValidos.has(cod)) {
        diferenciaisFiltrados[cod] = pref
      }
    }

    // Ticket sintético compatível
    let ticketCompativel = '300_600k'
    if (precoMax) {
      if (precoMax <= 300000) ticketCompativel = 'ate_300k'
      else if (precoMax > 600000) ticketCompativel = 'acima_600k'
    }

    const res = await salvarLeadInvestidor({
      telefone,
      nome: nome || undefined,
      email: email || undefined,
      ticket: ticketCompativel,
      objetivo: finalidade,
      prazo_decisao: prazoDecisao,
      cidades_interesse: nomesCidades,
      rota: 'investidor',
      tipos_imovel: tiposImovel,
      diferenciais: diferenciaisFiltrados,
      // Novos campos espelhados
      finalidade,
      preco_minimo: precoMin,
      preco_maximo: precoMax,
      preco_teto_absoluto: precoTeto,
      min_area_m2: minArea,
      min_quartos: minQ,
      min_vagas: minVagas,
      min_area_terreno_m2: minTerr,
      forma_pagamento: formaPagamento,
      usa_fgts: usaFgts,
      aceita_reforma: aceitaReforma,
      prazo_mudanca: finalidade === 'morar' ? prazoMudanca : undefined,
      yield_minimo_mensal: finalidade === 'renda_aluguel' ? yieldNum : undefined,
      cidades_codigos_ibge: cidadesCodigos,
      atalhos_regiao: atalhosSelecionados,
      bairros_preferidos: bairrosPreferidos || undefined,
      raio_km: raioKm ? parseInt(raioKm, 10) || undefined : undefined,
      ponto_referencia: pontoReferencia || undefined,
      cep_referencia: cepReferencia || undefined,
      logradouro_referencia: logradouroReferencia || undefined,
      bairro_referencia: bairroReferencia || undefined,
      codigo_ibge_referencia: codigoIbgeReferencia || undefined,
    })

    setLoading(false)

    if (!res.success) {
      const err = res.error || 'Ocorreu um erro ao registrar sua busca de imóvel. Tente novamente.'
      const msgLow = err.toLowerCase()
      if (
        msgLow.includes('mínimo da faixa') ||
        msgLow.includes('minimo da faixa') ||
        msgLow.includes('preco')
      ) {
        setFieldErrors({ precoMinimo: err })
        setEtapa(2)
      } else if (msgLow.includes('whatsapp') || msgLow.includes('+55')) {
        setFieldErrors({ telefone: err })
        setEtapa(1)
      }
      setErrorMsg(err)
      return
    }

    setProtocolo(res.protocolo || 'KX-0001')
    setSucesso(true)

    registrarEvento('cadastro_completo', window.location.pathname || '/', {
      origem: 'modal_investidor_expansao',
      finalidade,
      total_cidades: cidadesCodigos.length,
    })
  }

  const handlePontoReferenciaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setPontoReferencia(val)

    const digitos = normalizarDigitosCEP(val)
    if (digitos.length === 8 && /^\d{5}-?\d{3}$/.test(val.trim())) {
      setBuscandoCepReferencia(true)
      try {
        const dados = await consultarViaCEP(digitos)
        if (dados) {
          setCepReferencia(dados.cep)
          if (dados.logradouro) setLogradouroReferencia(dados.logradouro)
          if (dados.bairro) {
            setBairroReferencia(dados.bairro)
            if (!bairrosPreferidos) setBairrosPreferidos(dados.bairro)
          }
          if (dados.codigo_ibge) {
            setCodigoIbgeReferencia(dados.codigo_ibge)
            // Se a cidade do CEP ainda não está no cidadesCodigos, adiciona automaticamente
            setCidadesCodigos((prev) => Array.from(new Set([...prev, dados.codigo_ibge!])))
          }
        }
      } catch (err) {
        console.warn('Erro ao consultar ViaCEP no ponto de referência:', err)
      } finally {
        setBuscandoCepReferencia(false)
      }
    }
  }

  const handleReset = () => {
    setEtapa(1)
    setFinalidade('renda_aluguel')
    setTelefone('')
    setNome('')
    setEmail('')
    setPrecoMinimoStr('')
    setPrecoMaximoStr('')
    setPrecoTetoStr('')
    setTiposImovel(['apartamento', 'casa'])
    setMinAreaResidencial('')
    setMinQuartos('')
    setMinVagasResidencial('')
    setMinAreaComercial('')
    setMinVagasComercial('')
    setMinAreaTerreno('')
    setFormaPagamento('a_vista')
    setUsaFgts(false)
    setPrazoDecisao('até 60 dias')
    setAceitaReforma(true)
    setPrazoMudanca('ate_60_dias')
    setYieldMinimo('')
    setCidadesCodigos(['3550308'])
    setAtalhosSelecionados([])
    setBairrosPreferidos('')
    setRaioKm('')
    setPontoReferencia('')
    setCepReferencia('')
    setLogradouroReferencia('')
    setBairroReferencia('')
    setCodigoIbgeReferencia('')
    setDiferenciaisInvestidor({})
    setAutorizoContato(false)
    setAutorizoTouched(false)
    setProtocolo('')
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
        resetLabel="Fazer nova busca de imóvel"
      />
    )
  }

  return (
    <div className="space-y-4 text-left">
      {/* Indicador de Progresso discreto no padrão dark tech */}
      <div className="space-y-2 pb-1 border-b border-slate-800/80">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">
              {etapa === 1 && 'Etapa 1 de 5: Finalidade & Contato'}
              {etapa === 2 && 'Etapa 2 de 5: Preço, Tipos & Mínimos'}
              {etapa === 3 && 'Etapa 3 de 5: Pagamento & Condições'}
              {etapa === 4 && 'Etapa 4 de 5: Localização & Regiões'}
              {etapa === 5 && 'Etapa 5 de 5: Diferenciais & Conclusão'}
            </span>
          </div>
          <span className="text-[#22C7E0] font-mono text-[11px]">
            {etapa === 1 && '20%'}
            {etapa === 2 && '40%'}
            {etapa === 3 && '60%'}
            {etapa === 4 && '80%'}
            {etapa === 5 && '100%'}
          </span>
        </div>

        {/* Barra de progresso com os passos */}
        <div className="grid grid-cols-5 gap-1.5">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                etapa >= idx ? 'bg-[#22C7E0]' : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
          <span className="inline-flex items-center gap-1 text-[#22C7E0]">
            <Check className="w-3 h-3 text-[#22C7E0]" /> Busca Comprador & Investidor
          </span>
          <span className="text-slate-500 font-mono text-[10px]">KORBIX Intelligence</span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs bg-red-500/20 border border-red-500/40 text-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ========================================================
          ETAPA 1: Máximo 3 campos obrigatórios conforme restrição
          1. Finalidade (morar, renda, revenda)
          2. WhatsApp
          3. Nome completo (ou identificação)
          ======================================================== */}
      {etapa === 1 && (
        <form onSubmit={avancarEtapa1} className="space-y-4 animate-fade-in">
          {/* Campo 1: Finalidade da compra / investimento */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#22C7E0]" />
              <span>Qual é a finalidade principal do imóvel? *</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFinalidade('morar')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  finalidade === 'morar'
                    ? 'bg-[#1A3A75] border-[#22C7E0] text-white shadow-sm shadow-[#22C7E0]/20'
                    : 'bg-[#081226] border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">Morar</span>
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      finalidade === 'morar' ? 'border-[#22C7E0] bg-[#22C7E0]' : 'border-slate-600'
                    }`}
                  >
                    {finalidade === 'morar' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#070B14]" />
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Habitação própria para você e sua família.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFinalidade('renda_aluguel')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  finalidade === 'renda_aluguel'
                    ? 'bg-[#1A3A75] border-[#22C7E0] text-white shadow-sm shadow-[#22C7E0]/20'
                    : 'bg-[#081226] border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">Renda de aluguel</span>
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      finalidade === 'renda_aluguel'
                        ? 'border-[#22C7E0] bg-[#22C7E0]'
                        : 'border-slate-600'
                    }`}
                  >
                    {finalidade === 'renda_aluguel' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#070B14]" />
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Geração de renda passiva mensal recorrente.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFinalidade('revenda')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  finalidade === 'revenda'
                    ? 'bg-[#1A3A75] border-[#22C7E0] text-white shadow-sm shadow-[#22C7E0]/20'
                    : 'bg-[#081226] border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">Revenda</span>
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      finalidade === 'revenda'
                        ? 'border-[#22C7E0] bg-[#22C7E0]'
                        : 'border-slate-600'
                    }`}
                  >
                    {finalidade === 'revenda' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#070B14]" />
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Ganho de capital na valorização ou reforma rápida.
                </p>
              </button>
            </div>
          </div>

          {/* Grid com Campos 2 e 3: WhatsApp e Nome */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Campo 2: WhatsApp */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                WhatsApp / Telefone *
              </label>
              <input
                type="tel"
                required
                placeholder="(11) 98765-4321"
                value={telefone}
                onChange={(e) => {
                  setTelefone(formatarTelefone(e.target.value))
                  if (errorMsg) setErrorMsg('')
                  if (fieldErrors.telefone) {
                    setFieldErrors((prev) => {
                      const n = { ...prev }
                      delete n.telefone
                      return n
                    })
                  }
                }}
                className={`w-full px-3.5 py-2.5 rounded-lg bg-[#081226] border text-white placeholder-slate-500 text-base sm:text-sm outline-none transition-all min-h-[44px] ${
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
              <p className="text-[11px] text-slate-400">
                Canal prioritário onde você receberá oportunidades compatíveis.
              </p>
            </div>

            {/* Campo 3: Nome Completo */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Seu Nome (opcional)
              </label>
              <input
                type="text"
                placeholder="Ex.: Carlos Eduardo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#081226] border border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white placeholder-slate-500 text-base sm:text-sm outline-none transition-all min-h-[44px]"
              />
              <p className="text-[11px] text-slate-400">
                Como nossa equipe deve se dirigir a você.
              </p>
            </div>
          </div>

          {/* Botão Avançar para Etapa 2 */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 min-h-[48px] rounded-xl bg-[#1A3A75] hover:bg-[#142E5E] text-white font-semibold text-sm border border-white/10 hover:border-white/20 transition-all cursor-pointer"
            >
              <span>Continuar: Faixa de Preço & Tipos</span>
              <ArrowRight className="w-4 h-4 text-[#22C7E0]" />
            </button>
          </div>
        </form>
      )}

      {/* ========================================================
          ETAPA 2:
          - Faixa de preço (mínimo e máximo) e teto absoluto
          - Tipos aceitos (mesma lista do formulário do imóvel)
          - Mínimos conforme os tipos escolhidos (área, quartos, vagas)
          ======================================================== */}
      {etapa === 2 && (
        <form onSubmit={avancarEtapa2} className="space-y-4 animate-fade-in">
          {/* Faixa de Preço: Mínimo, Máximo e Teto Absoluto */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#22C7E0]" />
              <span>Faixa de preço pretendida e teto absoluto</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400">Preço Mínimo (R$)</span>
                <input
                  type="text"
                  placeholder="Ex.: 250.000"
                  value={precoMinimoStr}
                  onChange={(e) => {
                    setPrecoMinimoStr(formatarMoedaInput(e.target.value))
                    if (fieldErrors.precoMinimo) {
                      setFieldErrors((prev) => {
                        const n = { ...prev }
                        delete n.precoMinimo
                        return n
                      })
                    }
                  }}
                  className={`w-full px-3 py-2 rounded-lg bg-[#081226] border text-white placeholder-slate-500 text-sm outline-none ${
                    fieldErrors.precoMinimo
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-slate-700 focus:border-[#22C7E0]'
                  }`}
                />
                {fieldErrors.precoMinimo && (
                  <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
                    <span>{fieldErrors.precoMinimo}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-slate-400">Preço Máximo Ideal (R$)</span>
                <input
                  type="text"
                  placeholder="Ex.: 500.000"
                  value={precoMaximoStr}
                  onChange={(e) => setPrecoMaximoStr(formatarMoedaInput(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[#081226] border border-slate-700 focus:border-[#22C7E0] text-white placeholder-slate-500 text-sm outline-none"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-[#22C7E0] font-medium">Teto Absoluto (R$)</span>
                <input
                  type="text"
                  placeholder="Ex.: 600.000"
                  value={precoTetoStr}
                  onChange={(e) => setPrecoTetoStr(formatarMoedaInput(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[#081226] border border-[#22C7E0]/50 focus:border-[#22C7E0] text-white placeholder-slate-500 text-sm outline-none"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              O teto absoluto define o limite máximo intransponível para apresentação de
              oportunidades.
            </p>
          </div>

          {/* Tipos de Imóvel Aceitos (Mesma lista do formulário do imóvel) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#22C7E0]" />
                <span>Tipos aceitos * (mesma lista do imóvel)</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {tiposImovel.length} selecionado{tiposImovel.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-xl bg-[#081226]/80 border border-slate-800">
              {OPCOES_TIPOS_IMOVEL.map((tipo) => {
                const isSelected = tiposImovel.includes(tipo.value)
                return (
                  <button
                    type="button"
                    key={tipo.value}
                    onClick={() => toggleTipoImovel(tipo.value)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
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
                    <span className="truncate">{tipo.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Mínimos Condicionais conforme os tipos escolhidos */}
          <div className="space-y-3 pt-1 border-t border-slate-800/80">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#22C7E0] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Mínimos exigidos para os tipos escolhidos</span>
            </label>

            {/* Mínimos Residenciais (Apartamento / Casa) */}
            {temResidencial && (
              <div className="p-3 rounded-xl bg-[#081226] border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-white block">
                  Critérios mínimos para Residencial (Casa / Apartamento):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400">Área útil mín. (m²)</span>
                    <input
                      type="number"
                      placeholder="Ex.: 60"
                      value={minAreaResidencial}
                      onChange={(e) => setMinAreaResidencial(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#070B14] border border-slate-700 focus:border-[#22C7E0] text-white text-xs outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400">Mínimo de quartos</span>
                    <input
                      type="number"
                      placeholder="Ex.: 2"
                      value={minQuartos}
                      onChange={(e) => setMinQuartos(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#070B14] border border-slate-700 focus:border-[#22C7E0] text-white text-xs outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400">Mínimo de vagas</span>
                    <input
                      type="number"
                      placeholder="Ex.: 1"
                      value={minVagasResidencial}
                      onChange={(e) => setMinVagasResidencial(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#070B14] border border-slate-700 focus:border-[#22C7E0] text-white text-xs outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Mínimos Comerciais */}
            {temComercial && (
              <div className="p-3 rounded-xl bg-[#081226] border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-white block">
                  Critérios mínimos para Comercial:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400">Área privativa mín. (m²)</span>
                    <input
                      type="number"
                      placeholder="Ex.: 45"
                      value={minAreaComercial}
                      onChange={(e) => setMinAreaComercial(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#070B14] border border-slate-700 focus:border-[#22C7E0] text-white text-xs outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400">Mínimo de vagas</span>
                    <input
                      type="number"
                      placeholder="Ex.: 1"
                      value={minVagasComercial}
                      onChange={(e) => setMinVagasComercial(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#070B14] border border-slate-700 focus:border-[#22C7E0] text-white text-xs outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Mínimos Terreno */}
            {temTerreno && (
              <div className="p-3 rounded-xl bg-[#081226] border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-white block">
                  Critérios mínimos para Terreno / Lote:
                </span>
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400">Área do terreno mín. (m²)</span>
                  <input
                    type="number"
                    placeholder="Ex.: 250"
                    value={minAreaTerreno}
                    onChange={(e) => setMinAreaTerreno(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#070B14] border border-slate-700 focus:border-[#22C7E0] text-white text-xs outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Navegação */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEtapa(1)}
              className="px-4 py-3 rounded-xl bg-[#081226] border border-slate-700 text-slate-300 hover:text-white text-xs font-medium cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 inline mr-1" /> Voltar
            </button>
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1A3A75] hover:bg-[#142E5E] text-white font-semibold text-xs border border-white/10 cursor-pointer"
            >
              <span>Continuar: Condições de Pagamento</span>
              <ArrowRight className="w-4 h-4 text-[#22C7E0]" />
            </button>
          </div>
        </form>
      )}

      {/* ========================================================
          ETAPA 3:
          - Forma de pagamento e situação de crédito (à vista, financiado aprovado / a aprovar)
          - Opção "Vou usar FGTS"
          - Prazo de decisão (mesmas faixas do vendedor: até 60 dias, até 6 meses, sem pressa)
          - Aceita reforma (sim / não)
          - Se morar -> prazo para mudar (até 30, 60 ou 90 dias)
          - Se renda -> yield mínimo % ao mês (opcional)
          ======================================================== */}
      {etapa === 3 && (
        <form onSubmit={avancarEtapa3} className="space-y-4 animate-fade-in">
          {/* Forma de Pagamento e Situação do Crédito */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-[#22C7E0]" />
              <span>Forma de pagamento & crédito *</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {OPCOES_PAGAMENTO.map((op) => (
                <button
                  type="button"
                  key={op.value}
                  onClick={() => setFormaPagamento(op.value)}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                    formaPagamento === op.value
                      ? 'bg-[#1A3A75] border-[#22C7E0] text-white'
                      : 'bg-[#081226] border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
                  }`}
                >
                  <span className="font-semibold block">{op.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Opção Vou usar FGTS */}
          <div className="p-3 rounded-lg bg-[#081226]/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-white block">
                Vou utilizar FGTS na compra
              </span>
              <span className="text-[11px] text-slate-400">
                Sinaliza ao curador a busca prioritária por imóveis elegíveis a recursos do FGTS.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setUsaFgts(!usaFgts)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                usaFgts
                  ? 'bg-[#22C7E0] border-[#22C7E0] text-[#070B14]'
                  : 'bg-[#070B14] border-slate-700 text-slate-400'
              }`}
            >
              {usaFgts ? 'SIM, VOU USAR' : 'NÃO VOU USAR'}
            </button>
          </div>

          {/* Prazo de Decisão (mesmas faixas do vendedor) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#22C7E0]" />
              <span>Prazo de decisão estimado *</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {OPCOES_PRAZO_DECISAO.map((op) => (
                <button
                  type="button"
                  key={op.value}
                  onClick={() => setPrazoDecisao(op.value)}
                  className={`p-2.5 rounded-lg border text-center text-xs font-medium transition-all cursor-pointer ${
                    prazoDecisao === op.value
                      ? 'bg-[#1A3A75] border-[#22C7E0] text-white'
                      : 'bg-[#081226] border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          {/* Aceita Reforma (Sim ou Não) */}
          <div className="p-3 rounded-lg bg-[#081226]/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-white block">
                Aceita imóvel precisando de reforma?
              </span>
              <span className="text-[11px] text-slate-400">
                Imóveis para retrofit costumam oferecer descontos agressivos na aquisição.
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setAceitaReforma(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  aceitaReforma
                    ? 'bg-[#22C7E0] border-[#22C7E0] text-[#070B14]'
                    : 'bg-[#070B14] border-slate-700 text-slate-400'
                }`}
              >
                SIM
              </button>
              <button
                type="button"
                onClick={() => setAceitaReforma(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  !aceitaReforma
                    ? 'bg-red-500/80 border-red-500 text-white'
                    : 'bg-[#070B14] border-slate-700 text-slate-400'
                }`}
              >
                NÃO
              </button>
            </div>
          </div>

          {/* Condicional de Finalidade:
              - Se MORAR: Prazo para mudar (até 30, 60 ou 90 dias) no lugar de aceita imóvel ocupado
              - Se RENDA: Yield mínimo em % ao mês (opcional) */}
          {finalidade === 'morar' && (
            <div className="space-y-1.5 p-3 rounded-xl bg-[#081226] border border-[#22C7E0]/40">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#22C7E0] block">
                Prazo para mudar (disponibilidade de mudança):
              </label>
              <div className="grid grid-cols-3 gap-2">
                {OPCOES_PRAZO_MUDANCA.map((op) => (
                  <button
                    type="button"
                    key={op.value}
                    onClick={() => setPrazoMudanca(op.value)}
                    className={`py-2 px-1 text-center rounded-lg text-xs font-medium border cursor-pointer ${
                      prazoMudanca === op.value
                        ? 'bg-[#22C7E0] border-[#22C7E0] text-[#070B14] font-bold'
                        : 'bg-[#070B14] border-slate-700 text-slate-300'
                    }`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {finalidade === 'renda_aluguel' && (
            <div className="space-y-1.5 p-3 rounded-xl bg-[#081226] border border-[#22C7E0]/40">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#22C7E0] flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5" />
                <span>Yield mínimo pretendido (% ao mês - opcional):</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ex.: 0,65"
                  value={yieldMinimo}
                  onChange={(e) => setYieldMinimo(e.target.value)}
                  className="w-32 px-3 py-2 rounded-lg bg-[#070B14] border border-slate-700 focus:border-[#22C7E0] text-white text-sm outline-none"
                />
                <span className="text-xs text-slate-400">% a.m. de retorno líquido de locação</span>
              </div>
            </div>
          )}

          {/* Navegação */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEtapa(2)}
              className="px-4 py-3 rounded-xl bg-[#081226] border border-slate-700 text-slate-300 hover:text-white text-xs font-medium cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 inline mr-1" /> Voltar
            </button>
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1A3A75] hover:bg-[#142E5E] text-white font-semibold text-xs border border-white/10 cursor-pointer"
            >
              <span>Continuar: Localização & Regiões</span>
              <ArrowRight className="w-4 h-4 text-[#22C7E0]" />
            </button>
          </div>
        </form>
      )}

      {/* ========================================================
          ETAPA 4: Localização:
          - Qualquer cidade do estado de SP pela lista oficial do IBGE gravada pelo código
          - Atalhos de região que marcam várias cidades de uma vez
          - Bairros preferidos
          - Raio em km a partir de ponto de referência
          ======================================================== */}
      {etapa === 4 && (
        <form onSubmit={avancarEtapa4} className="space-y-4 animate-fade-in">
          {/* Atalhos de Região (Editáveis pelo gestor) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#22C7E0]" />
                <span>Atalhos de Região (marcam várias cidades de uma vez)</span>
              </label>
              <span className="text-[11px] text-slate-400">8 macrorregiões polo</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {regioesAtalho.map((atalho) => {
                const codigos = atalho.cidades.map((c) => c.codigo)
                const selecionado = codigos.every((c) => cidadesCodigos.includes(c))
                return (
                  <button
                    type="button"
                    key={atalho.id}
                    onClick={() => toggleAtalhoRegiao(atalho)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selecionado
                        ? 'bg-[#1A3A75] border-[#22C7E0] text-white shadow-sm shadow-[#22C7E0]/20'
                        : 'bg-[#081226] border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold block leading-tight">
                        {atalho.nome}
                      </span>
                      <span className="text-[10px] font-mono text-[#22C7E0] shrink-0 ml-1">
                        {atalho.cidades.length} cid.
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block line-clamp-1">
                      {atalho.descricao || 'Atalho regional'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Seletor de Cidades Oficiais IBGE SP */}
          <div className="space-y-2 pt-1 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#22C7E0]" />
                <span>Cidades do Estado de SP (Lista Oficial IBGE) *</span>
              </label>
              <span className="text-[11px] text-[#22C7E0] font-mono">
                {cidadesCodigos.length} selecionada{cidadesCodigos.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Campo de Busca Rápida de Cidades */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar por nome da cidade paulista ou código IBGE..."
                value={buscaCidade}
                onChange={(e) => setBuscaCidade(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-[#081226] border border-slate-700 focus:border-[#22C7E0] text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>

            {/* Lista com scroll de cidades disponíveis */}
            <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-[#081226]/80 border border-slate-800 max-h-48 overflow-y-auto">
              {municipiosFiltrados.map((m) => {
                const isSelected = cidadesCodigos.includes(m.codigo_ibge)
                return (
                  <button
                    type="button"
                    key={m.codigo_ibge}
                    onClick={() => toggleCidadeCodigo(m.codigo_ibge)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#1A3A75] border-[#22C7E0] text-white'
                        : 'bg-[#070B14] border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded flex items-center justify-center border transition-colors ${
                        isSelected
                          ? 'bg-[#22C7E0] border-[#22C7E0] text-[#070B14]'
                          : 'border-slate-600 bg-transparent'
                      }`}
                    >
                      {isSelected && <Check className="w-2 h-2 stroke-[3]" />}
                    </div>
                    <span>{m.nome}</span>
                    <span className="text-[9px] font-mono text-slate-400">({m.codigo_ibge})</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Bairros preferidos e Raio em km com Ponto de Referência */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-slate-800/80">
            <div className="sm:col-span-1 space-y-1">
              <span className="text-[11px] font-semibold text-slate-300">Bairros preferidos</span>
              <input
                type="text"
                placeholder="Ex.: Cambuí, Taquaral..."
                value={bairrosPreferidos}
                onChange={(e) => setBairrosPreferidos(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#081226] border border-slate-700 focus:border-[#22C7E0] text-white text-xs outline-none"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300">
                  Ponto de referência
                </span>
                {buscandoCepReferencia && (
                  <span className="text-[10px] text-[#22C7E0] flex items-center gap-1 font-mono">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" /> CEP...
                  </span>
                )}
              </div>
              <input
                type="text"
                placeholder="Ex.: Shopping Iguatemi ou CEP 13092-500"
                value={pontoReferencia}
                onChange={handlePontoReferenciaChange}
                className="w-full px-3 py-2 rounded-lg bg-[#081226] border border-slate-700 focus:border-[#22C7E0] text-white text-xs outline-none"
              />
              {logradouroReferencia && (
                <span className="text-[10px] text-slate-400 block truncate">
                  {logradouroReferencia}
                  {bairroReferencia ? ` - ${bairroReferencia}` : ''}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-300">Raio em km</span>
              <input
                type="number"
                placeholder="Ex.: 10"
                value={raioKm}
                onChange={(e) => setRaioKm(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#081226] border border-slate-700 focus:border-[#22C7E0] text-white text-xs outline-none"
              />
            </div>
          </div>

          {/* Navegação */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEtapa(3)}
              className="px-4 py-3 rounded-xl bg-[#081226] border border-slate-700 text-slate-300 hover:text-white text-xs font-medium cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 inline mr-1" /> Voltar
            </button>
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1A3A75] hover:bg-[#142E5E] text-white font-semibold text-xs border border-white/10 cursor-pointer"
            >
              <span>Continuar: Diferenciais & Conclusão</span>
              <ArrowRight className="w-4 h-4 text-[#22C7E0]" />
            </button>
          </div>
        </form>
      )}

      {/* ========================================================
          ETAPA 5: Diferenciais Desejados na Tese & Autorização Final
          ======================================================== */}
      {etapa === 5 && (
        <form onSubmit={handleSubmitFinal} className="space-y-4 animate-fade-in">
          {/* E-mail opcional para receber dossiês */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Seu E-mail (opcional)
            </label>
            <input
              type="email"
              placeholder="seuemail@exemplo.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#081226] border border-slate-700 focus:border-[#22C7E0] text-white placeholder-slate-500 text-sm outline-none"
            />
            <p className="text-[11px] text-slate-400">
              Para envio de dossiês analíticos completos e relatórios de compatibilidade.
            </p>
          </div>

          {/* Diferenciais do Imóvel: 3 opções por item (Obrigatório, Desejável, Indiferente padrão) */}
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

              <div className="p-3 rounded-xl bg-[#081226]/80 border border-slate-800 space-y-3 max-h-60 overflow-y-auto">
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

                            <div className="flex items-center gap-1 bg-[#081226] p-0.5 rounded-lg border border-slate-800 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setPreferenciaDiferencial(item.codigo, 'indiferente')
                                }
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
                                onClick={() =>
                                  setPreferenciaDiferencial(item.codigo, 'obrigatorio')
                                }
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
                Autorizo o contato por WhatsApp, telefone ou e-mail sobre esta busca de imóvel, de
                acordo com a{' '}
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

          {/* Navegação e Envio Final */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEtapa(4)}
              disabled={loading}
              className="px-4 py-3.5 rounded-xl bg-[#081226] border border-slate-700 text-slate-300 hover:text-white text-xs font-medium cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 inline mr-1" /> Voltar
            </button>

            <button
              type="submit"
              disabled={loading || !autorizoContato}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-4 min-h-[48px] rounded-xl bg-[#1A3A75] hover:bg-[#142E5E] active:bg-[#0F2347] text-white font-semibold text-sm border border-white/10 hover:border-white/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                  <span>Processando tese de busca...</span>
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

          <p className="text-[11px] text-center text-slate-400 pt-1 leading-relaxed">
            Seus dados são protegidos e usados apenas para curadoria de imóveis compatíveis.
          </p>
        </form>
      )}
    </div>
  )
}
