import React, { useRef, useState } from 'react'
import {
  UploadCloud,
  X,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  MoveHorizontal,
} from 'lucide-react'
import {
  LeadArquivo,
  uploadFotoImovel,
  removerArquivo,
  atualizarOrdemFotos,
  validarArquivoFoto,
} from '@/services/arquivos'

interface UploadFotosProps {
  leadId: string
  userId: string
  fotos: LeadArquivo[]
  onFotosChange: (fotos: LeadArquivo[]) => void
}

export function UploadFotos({ leadId, userId, fotos, onFotosChange }: UploadFotosProps) {
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSelecionarArquivos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setErro(null)
    setSucessoMsg(null)

    const fileList = Array.from(files)

    // Validação prévia de cada arquivo
    for (const f of fileList) {
      const valid = validarArquivoFoto(f)
      if (!valid.valido) {
        setErro(valid.erro || 'Arquivo de imagem inválido.')
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }
    }

    setEnviando(true)
    const novasFotos: LeadArquivo[] = [...fotos]
    let errosUpload: string[] = []

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]
        const proximaOrdem = novasFotos.length

        const res = await uploadFotoImovel({
          leadId,
          userId,
          file,
          ordem: proximaOrdem,
        })

        if (res.sucesso && res.arquivo) {
          novasFotos.push(res.arquivo)
        } else {
          errosUpload.push(res.erro || `Falha ao enviar "${file.name}".`)
        }
      }

      onFotosChange(novasFotos)

      if (errosUpload.length > 0) {
        setErro(errosUpload.join(' • '))
      } else {
        setSucessoMsg(
          fileList.length === 1
            ? '1 foto enviada com sucesso!'
            : `${fileList.length} fotos enviadas com sucesso!`,
        )
        setTimeout(() => setSucessoMsg(null), 4000)
      }
    } catch (err: any) {
      setErro(err?.message || 'Erro ao processar uploads.')
    } finally {
      setEnviando(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleMover = async (index: number, direcao: 'esquerda' | 'direita') => {
    const novoIndex = direcao === 'esquerda' ? index - 1 : index + 1
    if (novoIndex < 0 || novoIndex >= fotos.length) return

    const copia = [...fotos]
    const [removido] = copia.splice(index, 1)
    copia.splice(novoIndex, 0, removido)

    // Atualiza estado local instantaneamente
    onFotosChange(copia)

    // Persiste ordem no backend
    await atualizarOrdemFotos(copia)
  }

  const handleRemover = async (foto: LeadArquivo) => {
    setErro(null)
    const anterior = [...fotos]
    const filtrado = fotos.filter((f) => f.id !== foto.id)
    onFotosChange(filtrado)

    const res = await removerArquivo(foto)
    if (!res.sucesso) {
      setErro('Não foi possível remover a imagem: ' + res.erro)
      onFotosChange(anterior)
    } else {
      await atualizarOrdemFotos(filtrado)
    }
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Área de Seleção / Dropzone */}
      <div className="relative border-2 border-dashed border-[#22C7E0]/40 hover:border-[#22C7E0] bg-[#070B14]/80 rounded-2xl p-5 sm:p-6 transition-all text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={enviando}
          onChange={handleSelecionarArquivos}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
          aria-label="Selecionar fotos do imóvel"
        />

        <div className="flex flex-col items-center justify-center gap-2.5">
          <div className="w-12 h-12 rounded-2xl bg-[#22C7E0]/15 border border-[#22C7E0]/40 flex items-center justify-center text-[#22C7E0] shadow-[0_0_15px_rgba(34,199,224,0.2)]">
            {enviando ? (
              <Loader2 className="w-6 h-6 animate-spin text-[#22C7E0]" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">
              {enviando
                ? 'Fazendo upload seguro das fotos...'
                : 'Selecione ou arraste várias fotos do imóvel de uma vez'}
            </p>
            <p className="text-xs text-slate-400">
              Formatos aceitos: JPG, PNG ou WEBP • Máximo de <strong>5 MB por foto</strong>
            </p>
          </div>

          <button
            type="button"
            disabled={enviando}
            className="mt-1 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#22C7E0]/15 hover:bg-[#22C7E0]/25 text-[#22C7E0] border border-[#22C7E0]/40 text-xs font-bold transition-all pointer-events-none"
          >
            <ImageIcon className="w-4 h-4" />
            <span>{enviando ? 'Enviando...' : 'Escolher fotos no dispositivo'}</span>
          </button>
        </div>
      </div>

      {/* Mensagens inline sem alert */}
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

      {/* Galeria de Pré-visualização com Reordenação */}
      {fotos.length > 0 ? (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <span>{fotos.length} foto(s) enviada(s)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Fotos salvas
              </span>
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <MoveHorizontal className="w-3.5 h-3.5 text-[#22C7E0]" />
              <span>Use as setas para definir a ordem</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {fotos.map((foto, index) => (
              <div
                key={foto.id}
                className="group relative bg-[#070B14] rounded-xl border border-slate-800 overflow-hidden shadow-md transition-all hover:border-[#22C7E0]/50"
              >
                {/* Imagem / Pré-visualização */}
                <div className="aspect-[4/3] w-full bg-slate-900 overflow-hidden relative">
                  {foto.urlAssinada ? (
                    <img
                      src={foto.urlAssinada}
                      alt={foto.nome_original || `Foto ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}

                  {/* Badge de Posição / Capa */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#070B14]/85 text-white border border-slate-700 backdrop-blur-sm">
                    {index === 0 ? (
                      <span className="text-[#22C7E0]">★ Capa (1)</span>
                    ) : (
                      `Foto #${index + 1}`
                    )}
                  </div>

                  {/* Botão de Excluir */}
                  <button
                    type="button"
                    onClick={() => handleRemover(foto)}
                    title="Remover foto"
                    className="absolute top-2 right-2 p-1 rounded-md bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Rodapé do card: Nome + Botões de Mover Ordem */}
                <div className="p-2 bg-[#081226]/90 border-t border-slate-800/80 flex items-center justify-between gap-1">
                  <span
                    className="text-[11px] text-slate-400 truncate max-w-[90px]"
                    title={foto.nome_original || undefined}
                  >
                    {foto.nome_original || `foto_${index + 1}`}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMover(index, 'esquerda')}
                      title="Mover para antes"
                      className="p-1 rounded bg-[#070B14] hover:bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ArrowLeft className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={index === fotos.length - 1}
                      onClick={() => handleMover(index, 'direita')}
                      title="Mover para depois"
                      className="p-1 rounded bg-[#070B14] hover:bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center text-xs text-slate-400">
          Nenhuma foto enviada ainda. Selecione fotos acima para enriquecer a apresentação do
          imóvel.
        </div>
      )}
    </div>
  )
}
