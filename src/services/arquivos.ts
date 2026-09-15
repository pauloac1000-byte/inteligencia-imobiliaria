import { supabase } from '@/lib/supabase/client'

export type TipoArquivo = 'foto' | 'documento'
export type RotuloDocumento = 'matricula' | 'iptu' | 'certidao'

export interface LeadArquivo {
  id: string
  lead_id: string
  user_id: string
  tipo: TipoArquivo
  rotulo: RotuloDocumento | null
  storage_path: string
  nome_original: string | null
  tamanho_bytes: number | null
  mime_type: string | null
  ordem: number
  criado_em: string
  urlAssinada?: string
}

export const ROTULO_DOCUMENTO_LABELS: Record<RotuloDocumento, string> = {
  matricula: 'Matrícula',
  iptu: 'IPTU',
  certidao: 'Certidão',
}

export const MAX_FOTO_BYTES = 5 * 1024 * 1024 // 5 MB
export const MAX_DOC_BYTES = 10 * 1024 * 1024 // 10 MB

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
export const ALLOWED_DOC_TYPES = ['application/pdf']

/**
 * Valida tipo e tamanho de arquivo de foto
 */
export function validarArquivoFoto(file: File): { valido: boolean; erro?: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valido: false,
      erro: `Formato inválido (${file.name}). Apenas fotos em JPG, PNG ou WEBP são aceitas.`,
    }
  }
  if (file.size > MAX_FOTO_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1)
    return {
      valido: false,
      erro: `Arquivo "${file.name}" tem ${mb} MB e excede o limite máximo de 5 MB por foto.`,
    }
  }
  return { valido: true }
}

/**
 * Valida tipo e tamanho de arquivo de documento
 */
export function validarArquivoDocumento(file: File): { valido: boolean; erro?: string } {
  if (!ALLOWED_DOC_TYPES.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf')) {
    return {
      valido: false,
      erro: `Formato inválido (${file.name}). Apenas documentos em PDF são aceitos.`,
    }
  }
  if (file.size > MAX_DOC_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1)
    return {
      valido: false,
      erro: `Arquivo "${file.name}" tem ${mb} MB e excede o limite máximo de 10 MB por PDF.`,
    }
  }
  return { valido: true }
}

/**
 * Lista todos os arquivos de um lead com URLs assinadas para pré-visualização segura
 */
export async function listarArquivosDoLead(leadId: string): Promise<LeadArquivo[]> {
  try {
    const { data, error } = await supabase
      .from('lead_arquivos' as any)
      .select('*')
      .eq('lead_id', leadId)
      .order('ordem', { ascending: true })
      .order('criado_em', { ascending: true })

    if (error) {
      console.warn('Erro ao listar arquivos do lead:', error.message)
      return []
    }

    const arquivos = (data || []) as unknown as LeadArquivo[]
    if (arquivos.length === 0) return []

    // Gerar URLs assinadas temporárias para exibição (60 minutos)
    const comUrls = await Promise.all(
      arquivos.map(async (arq) => {
        try {
          const { data: signedData } = await supabase.storage
            .from('imoveis')
            .createSignedUrl(arq.storage_path, 3600)
          return {
            ...arq,
            urlAssinada: signedData?.signedUrl,
          }
        } catch {
          return arq
        }
      }),
    )

    return comUrls
  } catch (err) {
    console.warn('Exceção ao listar arquivos do lead:', err)
    return []
  }
}

/**
 * Faz upload de uma foto no storage e insere o registro na tabela lead_arquivos
 */
export async function uploadFotoImovel({
  leadId,
  userId,
  file,
  ordem,
}: {
  leadId: string
  userId: string
  file: File
  ordem: number
}): Promise<{ sucesso: boolean; arquivo?: LeadArquivo; erro?: string }> {
  const validacao = validarArquivoFoto(file)
  if (!validacao.valido) {
    return { sucesso: false, erro: validacao.erro }
  }

  try {
    const timestamp = Date.now()
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${userId}/${leadId}/fotos/${timestamp}_${cleanFileName}`

    const { error: uploadError } = await supabase.storage
      .from('imoveis')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'image/jpeg',
      })

    if (uploadError) {
      console.error('Erro no upload de foto para storage:', uploadError)
      return { sucesso: false, erro: `Falha no upload: ${uploadError.message}` }
    }

    const { data: insertData, error: insertError } = await supabase
      .from('lead_arquivos' as any)
      .insert({
        lead_id: leadId,
        user_id: userId,
        tipo: 'foto',
        rotulo: null,
        storage_path: storagePath,
        nome_original: file.name,
        tamanho_bytes: file.size,
        mime_type: file.type || 'image/jpeg',
        ordem,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao registrar foto no banco:', insertError)
      // Tenta remover o arquivo enviado caso falhe a gravação
      await supabase.storage.from('imoveis').remove([storagePath])
      return { sucesso: false, erro: `Falha ao registrar foto: ${insertError.message}` }
    }

    const { data: signedData } = await supabase.storage
      .from('imoveis')
      .createSignedUrl(storagePath, 3600)

    const arquivoCriado: LeadArquivo = {
      ...(insertData as unknown as LeadArquivo),
      urlAssinada: signedData?.signedUrl,
    }

    return { sucesso: true, arquivo: arquivoCriado }
  } catch (err: any) {
    console.error('Exceção no uploadFotoImovel:', err)
    return { sucesso: false, erro: err?.message || 'Erro inesperado ao enviar foto.' }
  }
}

/**
 * Faz upload de um documento PDF com rótulo
 * Se já existir um documento com o mesmo rótulo para o lead, substitui
 */
export async function uploadDocumentoImovel({
  leadId,
  userId,
  file,
  rotulo,
}: {
  leadId: string
  userId: string
  file: File
  rotulo: RotuloDocumento
}): Promise<{ sucesso: boolean; arquivo?: LeadArquivo; erro?: string }> {
  const validacao = validarArquivoDocumento(file)
  if (!validacao.valido) {
    return { sucesso: false, erro: validacao.erro }
  }

  try {
    const timestamp = Date.now()
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${userId}/${leadId}/documentos/${rotulo}_${timestamp}_${cleanFileName}`

    // Verifica se já existia um documento com este rótulo para remover o antigo
    const { data: antigos } = await supabase
      .from('lead_arquivos' as any)
      .select('id, storage_path')
      .eq('lead_id', leadId)
      .eq('tipo', 'documento')
      .eq('rotulo', rotulo)

    const { error: uploadError } = await supabase.storage
      .from('imoveis')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'application/pdf',
      })

    if (uploadError) {
      console.error('Erro no upload do documento para storage:', uploadError)
      return { sucesso: false, erro: `Falha no upload: ${uploadError.message}` }
    }

    const { data: insertData, error: insertError } = await supabase
      .from('lead_arquivos' as any)
      .insert({
        lead_id: leadId,
        user_id: userId,
        tipo: 'documento',
        rotulo,
        storage_path: storagePath,
        nome_original: file.name,
        tamanho_bytes: file.size,
        mime_type: 'application/pdf',
        ordem: 0,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao registrar documento no banco:', insertError)
      await supabase.storage.from('imoveis').remove([storagePath])
      return { sucesso: false, erro: `Falha ao registrar documento: ${insertError.message}` }
    }

    // Remover antigos registros do mesmo rótulo se houver
    if (antigos && antigos.length > 0) {
      const pathsParaRemover = antigos.map((a: any) => a.storage_path).filter(Boolean)
      const idsParaRemover = antigos.map((a: any) => a.id)
      if (pathsParaRemover.length > 0) {
        await supabase.storage.from('imoveis').remove(pathsParaRemover)
      }
      if (idsParaRemover.length > 0) {
        await supabase
          .from('lead_arquivos' as any)
          .delete()
          .in('id', idsParaRemover)
      }
    }

    const { data: signedData } = await supabase.storage
      .from('imoveis')
      .createSignedUrl(storagePath, 3600)

    const arquivoCriado: LeadArquivo = {
      ...(insertData as unknown as LeadArquivo),
      urlAssinada: signedData?.signedUrl,
    }

    return { sucesso: true, arquivo: arquivoCriado }
  } catch (err: any) {
    console.error('Exceção no uploadDocumentoImovel:', err)
    return { sucesso: false, erro: err?.message || 'Erro inesperado ao enviar documento.' }
  }
}

/**
 * Remove um arquivo (storage + registro)
 */
export async function removerArquivo(
  arquivo: LeadArquivo,
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    if (arquivo.storage_path) {
      await supabase.storage.from('imoveis').remove([arquivo.storage_path])
    }

    const { error } = await supabase
      .from('lead_arquivos' as any)
      .delete()
      .eq('id', arquivo.id)

    if (error) {
      return { sucesso: false, erro: error.message }
    }
    return { sucesso: true }
  } catch (err: any) {
    return { sucesso: false, erro: err?.message || 'Erro ao remover arquivo.' }
  }
}

/**
 * Atualiza a ordem de fotos
 */
export async function atualizarOrdemFotos(fotosOrdenadas: LeadArquivo[]): Promise<boolean> {
  try {
    const updates = fotosOrdenadas.map((foto, index) =>
      supabase
        .from('lead_arquivos' as any)
        .update({ ordem: index })
        .eq('id', foto.id),
    )
    await Promise.all(updates)
    return true
  } catch (err) {
    console.warn('Erro ao atualizar ordem das fotos:', err)
    return false
  }
}
