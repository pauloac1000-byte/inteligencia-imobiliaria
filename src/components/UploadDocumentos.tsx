import React, { useRef, useState } from 'react'
import {
  FileText,
  UploadCloud,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Trash2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'
import {
  LeadArquivo,
  RotuloDocumento,
  ROTULO_DOCUMENTO_LABELS,
  uploadDocumentoImovel,
  removerArquivo,
  validarArquivoDocumento,
} from '@/services/arquivos'

interface UploadDocumentosProps {
  leadId: string
  userId: string
  documentos: LeadArquivo[]
  onDocumentosChange: (documentos: LeadArquivo[]) => void
  filtroRotulo?: RotuloDocumento // Se fornecido, exibe/gerencia apenas este rótulo (para encaixar nas pendências individuais)
}

interface ConfigRotulo {
  id: RotuloDocumento
  label: string
  desc: string
}

const ROTULOS: Record<RotuloDocumento, ConfigRotulo> = {
  matricula: {
    id: 'matricula',
    label: 'Matrícula',
    desc: 'Certidão atualizada de inteiro teor do imóvel',
  },
  iptu: {
    id: 'iptu',
    label: 'IPTU',
    desc: 'Espelho do carnê vigente ou certidão de dados cadastrais',
  },
  certidao: {
    id: 'certidao',
    label: 'Certidão',
    desc: 'Certidões negativas, ônus reais ou formal de partilha',
  },
}

export function UploadDocumentos({
  leadId,
  userId,
  documentos,
  onDocumentosChange,
  filtroRotulo,
}: UploadDocumentosProps) {
  const [rotuloSelecionado, setRotuloSelecionado] = useState<RotuloDocumento>(
    filtroRotulo || 'matricula',
  )
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Encontra se já há documento para o rótulo
  const docPorRotulo = (rot: RotuloDocumento) =>
    documentos.find((d) => d.tipo === 'documento' && d.rotulo === rot)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setErro(null)
    setSucessoMsg(null)

    const rotuloEfetivo = filtroRotulo || rotuloSelecionado

    const valid = validarArquivoDocumento(file)
    if (!valid.valido) {
      setErro(valid.erro || 'Documento em formato inválido.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setEnviando(true)

    try {
      const res = await uploadDocumentoImovel({
        leadId,
        userId,
        file,
        rotulo: rotuloEfetivo,
      })

      if (res.sucesso && res.arquivo) {
        // Substitui ou adiciona na lista
        const outros = documentos.filter(
          (d) => !(d.tipo === 'documento' && d.rotulo === rotuloEfetivo),
        )
        onDocumentosChange([...outros, res.arquivo])
        setSucessoMsg(`Documento "${ROTULO_DOCUMENTO_LABELS[rotuloEfetivo]}" enviado com sucesso!`)
        setTimeout(() => setSucessoMsg(null), 4000)
      } else {
        setErro(res.erro || 'Erro ao enviar documento.')
      }
    } catch (err: any) {
      setErro(err?.message || 'Erro inesperado ao processar o arquivo.')
    } finally {
      setEnviando(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemover = async (doc: LeadArquivo) => {
    setErro(null)
    const anterior = [...documentos]
    const outros = documentos.filter((d) => d.id !== doc.id)
    onDocumentosChange(outros)

    const res = await removerArquivo(doc)
    if (!res.sucesso) {
      setErro('Falha ao remover documento: ' + res.erro)
      onDocumentosChange(anterior)
    }
  }

  const rotulosParaExibir: RotuloDocumento[] = filtroRotulo
    ? [filtroRotulo]
    : ['matricula', 'iptu', 'certidao']

  return (
    <div className="space-y-4 pt-2">
      {/* Seletor de rótulo (se não estiver travado por filtro) */}
      {!filtroRotulo && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            Escolha o rótulo do documento:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['matricula', 'iptu', 'certidao'] as RotuloDocumento[]).map((r) => {
              const ativo = rotuloSelecionado === r
              const jaEnviado = Boolean(docPorRotulo(r))
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRotuloSelecionado(r)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    ativo
                      ? 'bg-[#22C7E0]/15 border-[#22C7E0] text-white shadow-[0_0_12px_rgba(34,199,224,0.15)] font-semibold'
                      : 'bg-[#070B14] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span>{ROTULOS[r].label}</span>
                    {jaEnviado && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Caixa de Upload do PDF */}
      <div className="relative border-2 border-dashed border-indigo-500/40 hover:border-indigo-400 bg-[#070B14]/80 rounded-2xl p-4 sm:p-5 transition-all text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          disabled={enviando}
          onChange={handleUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
          aria-label={`Upload de PDF para ${
            ROTULO_DOCUMENTO_LABELS[filtroRotulo || rotuloSelecionado]
          }`}
        />

        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            {enviando ? (
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            ) : (
              <UploadCloud className="w-5 h-5" />
            )}
          </div>

          <div className="space-y-0.5">
            <p className="text-xs sm:text-sm font-semibold text-white">
              {enviando ? (
                'Enviando documento...'
              ) : (
                <span>
                  Enviar PDF para{' '}
                  <strong className="text-[#22C7E0]">
                    "{ROTULO_DOCUMENTO_LABELS[filtroRotulo || rotuloSelecionado]}"
                  </strong>
                </span>
              )}
            </p>
            <p className="text-[11px] text-slate-400">
              Apenas arquivos <strong>.PDF</strong> • Limite máximo de <strong>10 MB</strong>
            </p>
          </div>

          <button
            type="button"
            disabled={enviando}
            className="mt-1 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-xs font-semibold pointer-events-none"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>
              {enviando ? 'Processando envio...' : 'Selecionar PDF no computador / celular'}
            </span>
          </button>
        </div>
      </div>

      {/* Alertas inline */}
      {erro && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <span className="leading-relaxed">{erro}</span>
        </div>
      )}

      {sucessoMsg && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{sucessoMsg}</span>
        </div>
      )}

      {/* Lista de Documentos por Rótulo */}
      <div className="space-y-2 pt-1">
        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
          Documentos cadastrados:
        </span>

        {rotulosParaExibir.map((rot) => {
          const doc = docPorRotulo(rot)
          const config = ROTULOS[rot]

          return (
            <div
              key={rot}
              className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                doc
                  ? 'bg-[#070B14] border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.06)]'
                  : 'bg-[#070B14]/60 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                <div
                  className={`p-2 rounded-lg border shrink-0 ${
                    doc
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-white">{config.label}</span>
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                        doc
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700'
                      }`}
                    >
                      {doc ? 'Enviado' : 'Não enviado'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {doc ? doc.nome_original || 'Arquivo PDF' : config.desc}
                  </p>
                </div>
              </div>

              {/* Ações do documento */}
              {doc && (
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  {doc.urlAssinada && (
                    <a
                      href={doc.urlAssinada}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#22C7E0]" />
                      <span>Visualizar</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemover(doc)}
                    title="Remover documento"
                    className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-300 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
