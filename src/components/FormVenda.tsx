import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { salvarLeadVendaEtapa1, atualizarLeadVendaEtapa2 } from '@/services/leads'
import { ArrowRight, ArrowLeft, Loader2, AlertCircle, Building2, Check } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { ConfirmationProtocolo } from './ConfirmationProtocolo'

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

  // Etapa 1: apenas 3 campos obrigatórios
  const [cidade, setCidade] = useState('')
  const [tipoImovel, setTipoImovel] = useState<string>('apartamento')
  const [telefone, setTelefone] = useState('')

  // Etapa 2: nome, email, valor estimado, motivo da venda, prazo desejado (+ mensagem opcional mantida)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [valorEstimado, setValorEstimado] = useState('')
  const [motivoVenda, setMotivoVenda] = useState<string>('preciso de liquidez')
  const [prazoDesejado, setPrazoDesejado] = useState<string>('até 60 dias')
  const [mensagem, setMensagem] = useState('')
  const [autorizoContato, setAutorizoContato] = useState(false)
  const [autorizoTouched, setAutorizoTouched] = useState(false)

  // Estados de UI
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [sucesso, setSucesso] = useState(false)

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setTelefone(formatarTelefone(raw))
    if (errorMsg) setErrorMsg('')
  }

  // Avançar da Etapa 1 para Etapa 2 (Persistência imediata no banco)
  const handleAvancarEtapa1 = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!cidade.trim()) {
      setErrorMsg('Informe a cidade do imóvel.')
      return
    }

    if (!tipoImovel) {
      setErrorMsg('Selecione o tipo de imóvel.')
      return
    }

    const digits = telefone.replace(/\D/g, '')
    if (!digits || digits.length < 10) {
      setErrorMsg('Por favor, informe um WhatsApp válido com DDD (mínimo 10 dígitos).')
      return
    }

    setErrorMsg('')
    setLoading(true)

    // Grava imediatamente o lead no Supabase na etapa 1
    const res = await salvarLeadVendaEtapa1({
      cidade,
      tipo_imovel: tipoImovel,
      telefone,
      rota: 'proprietario',
    })

    setLoading(false)

    if (!res.success) {
      setErrorMsg(res.error || 'Não foi possível registrar seu imóvel. Tente novamente.')
      return
    }

    if (res.id) {
      setLeadId(res.id)
    }
    if (res.protocolo) {
      setProtocolo(res.protocolo)
    }

    // Avança para etapa 2
    setEtapa(2)
  }

  // Envio final da Etapa 2 (Atualiza o lead já criado)
  const handleSubmitEtapa2 = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nome.trim()) {
      setErrorMsg('Por favor, informe seu nome completo.')
      return
    }

    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setErrorMsg('Por favor, insira um endereço de e-mail válido.')
      return
    }

    if (!motivoVenda) {
      setErrorMsg('Selecione o motivo da venda.')
      return
    }

    if (!prazoDesejado) {
      setErrorMsg('Selecione o prazo desejado para a venda.')
      return
    }

    if (!autorizoContato) {
      setAutorizoTouched(true)
      setErrorMsg('É necessário autorizar o contato para concluir o cadastro.')
      return
    }

    setErrorMsg('')
    setLoading(true)

    let protocoloFinal = protocolo

    if (leadId) {
      const res = await atualizarLeadVendaEtapa2({
        id: leadId,
        nome,
        email,
        valor_estimado: valorEstimado || undefined,
        motivo_venda: motivoVenda,
        prazo_desejado: prazoDesejado,
        mensagem: mensagem || undefined,
      })

      setLoading(false)

      if (!res.success) {
        setErrorMsg(res.error || 'Ocorreu um erro ao atualizar suas informações. Tente novamente.')
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
        valor_estimado: valorEstimado || undefined,
        motivo_venda: motivoVenda,
        prazo_desejado: prazoDesejado,
        mensagem: mensagem || undefined,
        rota: 'proprietario',
      })

      setLoading(false)

      if (!res.success) {
        setErrorMsg(res.error || 'Ocorreu um erro ao registrar suas informações. Tente novamente.')
        return
      }
      if (res.protocolo) {
        protocoloFinal = res.protocolo
      }
    }

    setProtocolo(protocoloFinal || 'KX-0001')
    setSucesso(true)
  }

  const handleReset = () => {
    setEtapa(1)
    setLeadId(null)
    setProtocolo('')
    setCidade('')
    setTipoImovel('apartamento')
    setTelefone('')
    setNome('')
    setEmail('')
    setValorEstimado('')
    setMotivoVenda('preciso de liquidez')
    setPrazoDesejado('até 60 dias')
    setMensagem('')
    setAutorizoContato(false)
    setAutorizoTouched(false)
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
          {/* Cidade */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Cidade / Estado *
            </label>
            <input
              type="text"
              required
              placeholder="Ex.: São Paulo, SP"
              value={cidade}
              onChange={(e) => {
                setCidade(e.target.value)
                if (errorMsg) setErrorMsg('')
              }}
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#081226] border border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white placeholder-slate-500 text-base sm:text-sm outline-none transition-all disabled:opacity-50 min-h-[44px]"
            />
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
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#081226] border border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white placeholder-slate-500 text-base sm:text-sm outline-none transition-all disabled:opacity-50 min-h-[44px]"
              />
            </div>
          </div>

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

          {/* Valor estimado de venda */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Valor estimado de venda
            </label>
            <input
              type="text"
              placeholder="Ex.: R$ 850.000"
              value={valorEstimado}
              onChange={(e) => setValorEstimado(e.target.value)}
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#081226] border border-slate-700 focus:border-[#22C7E0] focus:ring-1 focus:ring-[#22C7E0] text-white placeholder-slate-500 text-base sm:text-sm outline-none transition-all disabled:opacity-50 min-h-[44px]"
            />
          </div>

          {/* Mensagem / Observações */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Mensagem ou detalhes adicionais (opcional)
            </label>
            <textarea
              rows={isInModal ? 2 : 3}
              placeholder="Ex.: Bairro, metragem aproximada, condomínio ou particularidades..."
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
