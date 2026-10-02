import React, { useState } from 'react'
import { CheckCircle2, Clock, MessageSquare, Copy, Check, ArrowRight } from 'lucide-react'
import { buildWhatsAppLink } from '@/services/leads'
import { registrarEvento } from '@/services/eventos'

export interface ConfirmationProtocoloProps {
  protocolo: string
  rota: 'proprietario' | 'investidor'
  onReset?: () => void
  onClose?: () => void
  resetLabel?: string
}

interface PassoItem {
  numero: number
  titulo: string
  prazo: string
  descricao: string
}

const PASSOS_PROPRIETARIO: PassoItem[] = [
  {
    numero: 1,
    titulo: 'Análise técnica do seu imóvel',
    prazo: 'Até 48 horas',
    descricao: 'Nossa mecânica analisa metragem, precificação e liquidez de mercado da sua região.',
  },
  {
    numero: 2,
    titulo: 'Match com investidores com tese de compra registrada',
    prazo: 'Em até 5 dias',
    descricao:
      'Cruzamento direto com compradores ativos com capital pronto e interesse compatível.',
  },
  {
    numero: 3,
    titulo: 'Conexão para negociação',
    prazo: 'Sob agendamento',
    descricao:
      'Apresentação de propostas alinhadas e coordenação direta entre as partes com segurança jurídica.',
  },
]

const PASSOS_INVESTIDOR: PassoItem[] = [
  {
    numero: 1,
    titulo: 'Curadoria das oportunidades compatíveis com a sua tese',
    prazo: 'Até 48 horas',
    descricao:
      'Nossa inteligência filtra a carteira e identifica imóveis com os retornos e regiões solicitados.',
  },
  {
    numero: 2,
    titulo: 'Envio das opções que fazem sentido para o seu perfil',
    prazo: 'Em até 5 dias',
    descricao: 'Envio do dossiê detalhado das oportunidades selecionadas direto no seu WhatsApp.',
  },
  {
    numero: 3,
    titulo: 'Apresentação e visita',
    prazo: 'Sob agendamento',
    descricao:
      'Acompanhamento técnico, análise de documentação e agendamento de visita aos ativos escolhidos.',
  },
]

export const ConfirmationProtocolo: React.FC<ConfirmationProtocoloProps> = ({
  protocolo,
  rota,
  onReset,
  onClose,
  resetLabel = 'Cadastrar outro imóvel',
}) => {
  const [copiado, setCopiado] = useState(false)
  const passos = rota === 'proprietario' ? PASSOS_PROPRIETARIO : PASSOS_INVESTIDOR
  const whatsAppLink = buildWhatsAppLink(protocolo, rota)

  const handleCopiarProtocolo = async () => {
    try {
      await navigator.clipboard.writeText(protocolo)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2200)
    } catch {
      // Fallback simples
      setCopiado(false)
    }
  }

  return (
    <div className="py-2 px-1 sm:px-2 space-y-6 text-left animate-fade-in">
      {/* Cabeçalho com ícone de sucesso e badge */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-[#22C7E0]/15 border-2 border-[#22C7E0] text-[#22C7E0] flex items-center justify-center mx-auto shadow-lg shadow-[#22C7E0]/25">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1A3A75]/40 border border-[#1A3A75]/70 text-[#22C7E0] text-xs font-semibold">
            {rota === 'proprietario'
              ? 'Cadastro registrado com sucesso'
              : 'Tese registrada com sucesso'}
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {rota === 'proprietario'
              ? 'Recebemos os dados do seu imóvel'
              : 'Recebemos sua tese de investimento'}
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            {rota === 'proprietario'
              ? 'Seu imóvel entrou na nossa mecânica de cruzamento de dados. Acompanhe abaixo o protocolo e as próximas etapas.'
              : 'Seus parâmetros foram salvos na carteira de compradores ativos. Acompanhe abaixo o protocolo e as próximas etapas.'}
          </p>
        </div>
      </div>

      {/* Cartão de Protocolo em Destaque */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#081226] via-[#0A1838] to-[#081226] border border-[#22C7E0]/40 p-4 sm:p-5 shadow-xl shadow-[#22C7E0]/10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#22C7E0]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Protocolo de atendimento KORBIX
            </span>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl sm:text-3xl font-bold font-mono tracking-wider text-[#22C7E0] drop-shadow-[0_0_12px_rgba(34,199,224,0.35)]">
                {protocolo}
              </span>
              <button
                type="button"
                onClick={handleCopiarProtocolo}
                title="Copiar protocolo"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#1A3A75]/50 hover:bg-[#1A3A75] border border-slate-700 hover:border-[#22C7E0]/60 text-slate-300 hover:text-white text-xs font-mono transition-colors cursor-pointer"
              >
                {copiado ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#22C7E0]" />
                    <span className="text-[#22C7E0]">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="text-left sm:text-right text-[11px] text-slate-400 border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
            <span className="block text-slate-300 font-medium">Status da solicitação</span>
            <span className="inline-flex items-center gap-1.5 text-[#22C7E0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C7E0] animate-pulse" />
              Em fila de processamento
            </span>
          </div>
        </div>
      </div>

      {/* Três Próximos Passos Numerados com Prazo */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Próximos passos do seu atendimento
          </h4>
          <span className="text-[11px] text-slate-500 font-mono">3 etapas</span>
        </div>

        <div className="space-y-2.5">
          {passos.map((p) => (
            <div
              key={p.numero}
              className="p-3 sm:p-3.5 rounded-xl bg-[#081226]/80 border border-slate-800 hover:border-slate-700/80 transition-colors flex items-start gap-3 sm:gap-3.5"
            >
              <div className="w-7 h-7 rounded-lg bg-[#1A3A75] border border-[#22C7E0]/30 text-[#22C7E0] font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                {p.numero}
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <h5 className="text-sm font-semibold text-white leading-tight">{p.titulo}</h5>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#22C7E0] shrink-0 bg-[#22C7E0]/10 border border-[#22C7E0]/20 px-2 py-0.5 rounded-md w-fit">
                    <Clock className="w-3 h-3" />
                    {p.prazo}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{p.descricao}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botão Principal: Falar agora no WhatsApp com protocolo pré-preenchido */}
      <div className="space-y-3 pt-1">
        <a
          href={whatsAppLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            registrarEvento('clique_whatsapp', window.location.pathname || '/', {
              origem: 'confirmacao_protocolo',
              rota_lead: rota,
            })
          }}
          className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-4 min-h-[48px] rounded-xl bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1caa51] text-[#070B14] font-bold text-sm shadow-lg shadow-[#25D366]/20 transition-all transform active:scale-[0.99] cursor-pointer"
        >
          <MessageSquare className="w-4 h-4 fill-current shrink-0" />
          <span>Falar agora no WhatsApp</span>
          <ArrowRight className="w-4 h-4 ml-0.5 shrink-0" />
        </a>

        <p className="text-[11px] text-center text-slate-400 leading-relaxed">
          Atendimento direto com nossos especialistas. A mensagem já vai com o protocolo{' '}
          <span className="font-mono text-[#22C7E0] font-semibold">{protocolo}</span> informado.
        </p>
      </div>

      {/* Ações secundárias: recomeçar / fechar */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-center gap-3">
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-slate-400 hover:text-white underline underline-offset-4 transition-colors cursor-pointer"
          >
            {resetLabel}
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#081226] hover:bg-[#0B1833] border border-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            Fechar janela
          </button>
        )}
      </div>
    </div>
  )
}
