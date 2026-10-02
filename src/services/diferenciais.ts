import { supabase } from '@/lib/supabase/client'

export interface DiferencialItem {
  id: string
  codigo: string
  nome: string
  grupo: 'Área externa' | 'Condomínio' | 'Uso e conforto' | 'Custo e renda' | string
  tipos: string[] // ex: ['residencial'] ou ['residencial', 'comercial']
  ativo: boolean
  ordem: number
}

export type PreferenciaDiferencial = 'indiferente' | 'desejavel' | 'obrigatorio'

// Estrutura gravada para o investidor: { [codigo]: 'indiferente' | 'desejavel' | 'obrigatorio' }
export type DiferenciaisInvestidorMap = Record<string, PreferenciaDiferencial>

// Lista estática fallback com os 15 itens exatos da especificação
export const DIFERENCIAIS_PADRAO: DiferencialItem[] = [
  // Grupo "Área externa" (todos residencial)
  {
    id: '1',
    codigo: 'PISCINA',
    nome: 'Piscina privativa',
    grupo: 'Área externa',
    tipos: ['residencial'],
    ativo: true,
    ordem: 1,
  },
  {
    id: '2',
    codigo: 'GOURMET',
    nome: 'Área gourmet com churrasqueira',
    grupo: 'Área externa',
    tipos: ['residencial'],
    ativo: true,
    ordem: 2,
  },
  {
    id: '3',
    codigo: 'QUINTAL',
    nome: 'Quintal ou jardim privativo',
    grupo: 'Área externa',
    tipos: ['residencial'],
    ativo: true,
    ordem: 3,
  },
  {
    id: '4',
    codigo: 'EDICULA',
    nome: 'Edícula',
    grupo: 'Área externa',
    tipos: ['residencial'],
    ativo: true,
    ordem: 4,
  },
  // Grupo "Condomínio"
  {
    id: '5',
    codigo: 'PORTARIA',
    nome: 'Portaria 24h',
    grupo: 'Condomínio',
    tipos: ['residencial', 'comercial'],
    ativo: true,
    ordem: 5,
  },
  {
    id: '6',
    codigo: 'LAZER_COND',
    nome: 'Lazer no condomínio',
    grupo: 'Condomínio',
    tipos: ['residencial'],
    ativo: true,
    ordem: 6,
  },
  {
    id: '7',
    codigo: 'ELEVADOR',
    nome: 'Elevador',
    grupo: 'Condomínio',
    tipos: ['residencial', 'comercial'],
    ativo: true,
    ordem: 7,
  },
  {
    id: '8',
    codigo: 'PET',
    nome: 'Aceita animais',
    grupo: 'Condomínio',
    tipos: ['residencial'],
    ativo: true,
    ordem: 8,
  },
  // Grupo "Uso e conforto"
  {
    id: '9',
    codigo: 'VAGA_COBERTA',
    nome: 'Vaga coberta',
    grupo: 'Uso e conforto',
    tipos: ['residencial', 'comercial'],
    ativo: true,
    ordem: 9,
  },
  {
    id: '10',
    codigo: 'TERREO',
    nome: 'Térreo ou sem escadas',
    grupo: 'Uso e conforto',
    tipos: ['residencial', 'comercial'],
    ativo: true,
    ordem: 10,
  },
  {
    id: '11',
    codigo: 'ESCRITORIO',
    nome: 'Escritório',
    grupo: 'Uso e conforto',
    tipos: ['residencial'],
    ativo: true,
    ordem: 11,
  },
  {
    id: '12',
    codigo: 'PLANEJADOS',
    nome: 'Armários planejados',
    grupo: 'Uso e conforto',
    tipos: ['residencial', 'comercial'],
    ativo: true,
    ordem: 12,
  },
  // Grupo "Custo e renda" (residencial e comercial)
  {
    id: '13',
    codigo: 'SOLAR',
    nome: 'Energia solar fotovoltaica',
    grupo: 'Custo e renda',
    tipos: ['residencial', 'comercial'],
    ativo: true,
    ordem: 13,
  },
  {
    id: '14',
    codigo: 'MOBILIADO',
    nome: 'Mobiliado',
    grupo: 'Custo e renda',
    tipos: ['residencial', 'comercial'],
    ativo: true,
    ordem: 14,
  },
  {
    id: '15',
    codigo: 'MEDICAO_IND',
    nome: 'Medição individual de água e gás',
    grupo: 'Custo e renda',
    tipos: ['residencial', 'comercial'],
    ativo: true,
    ordem: 15,
  },
]

// Cache em memória para evitar chamadas repetidas
let diferenciaisCache: DiferencialItem[] | null = null

/**
 * Busca diferenciais ativos da tabela do Supabase. Se falhar ou estiver offline, usa os 15 itens padrão.
 */
export async function listarDiferenciais(): Promise<DiferencialItem[]> {
  if (diferenciaisCache && diferenciaisCache.length > 0) {
    return diferenciaisCache
  }

  try {
    const { data, error } = await (supabase.from as any)('diferenciais')
      .select('id, codigo, nome, grupo, tipos, ativo, ordem')
      .eq('ativo', true)
      .order('ordem', { ascending: true })

    if (error || !data || data.length === 0) {
      console.warn('Usando diferenciais padrão (erro ou sem dados na tabela):', error?.message)
      return DIFERENCIAIS_PADRAO
    }

    diferenciaisCache = data as DiferencialItem[]
    return diferenciaisCache
  } catch (err) {
    console.warn('Exceção ao listar diferenciais:', err)
    return DIFERENCIAIS_PADRAO
  }
}

/**
 * Normaliza uma string de tipo de imóvel para as categorias de diferenciais:
 * - 'casa', 'apartamento' -> 'residencial'
 * - 'comercial' -> 'comercial'
 * - 'terreno' -> 'terreno' (não tem diferenciais)
 */
export function classificarTipoParaDiferenciais(
  tipo: string,
): 'residencial' | 'comercial' | 'terreno' | 'outro' {
  const t = tipo.toLowerCase().trim()
  if (t === 'casa' || t === 'apartamento' || t.includes('residencial')) {
    return 'residencial'
  }
  if (t === 'comercial' || t.includes('sala') || t.includes('loja')) {
    return 'comercial'
  }
  if (t === 'terreno' || t.includes('lote')) {
    return 'terreno'
  }
  return 'outro'
}

/**
 * Filtra diferenciais aplicáveis a um tipo de imóvel do proprietário.
 * Se o tipo for terreno, retorna lista vazia.
 */
export function filtrarDiferenciaisPorTipoImovel(
  itens: DiferencialItem[],
  tipoImovel: string,
): DiferencialItem[] {
  const categoria = classificarTipoParaDiferenciais(tipoImovel)
  if (categoria === 'terreno') {
    return []
  }

  return itens.filter((item) => {
    if (!item.ativo) return false
    return item.tipos.includes(categoria)
  })
}

/**
 * Filtra diferenciais aplicáveis aos tipos escolhidos pelo investidor.
 * A lista se ajusta dinamicamente conforme os tipos marcados.
 */
export function filtrarDiferenciaisPorTiposInvestidor(
  itens: DiferencialItem[],
  tiposSelecionados: string[],
): DiferencialItem[] {
  if (!tiposSelecionados || tiposSelecionados.length === 0) {
    // Por padrão se nada marcado, mostra todos os ativos aplicáveis a residencial/comercial
    return itens.filter((item) => item.ativo)
  }

  // Coleta as categorias relevantes presentes nos tipos escolhidos
  const categorias = new Set<string>()
  for (const t of tiposSelecionados) {
    const cat = classificarTipoParaDiferenciais(t)
    if (cat === 'residencial' || cat === 'comercial') {
      categorias.add(cat)
    }
  }

  // Se o investidor escolheu apenas 'terreno', nenhum diferencial de construção se aplica
  if (categorias.size === 0) {
    return []
  }

  return itens.filter((item) => {
    if (!item.ativo) return false
    return item.tipos.some((cat) => categorias.has(cat))
  })
}
