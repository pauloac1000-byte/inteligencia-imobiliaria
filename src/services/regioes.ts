import { supabase } from '@/lib/supabase/client'

export interface MunicipioSP {
  codigo_ibge: string
  nome: string
  nome_normalizado: string
  microrregiao?: string | null
  mesorregiao?: string | null
}

export interface CidadeAtalho {
  codigo: string
  nome: string
}

export interface RegiaoAtalho {
  id: string
  nome: string
  descricao: string | null
  ordem: number
  ativa: boolean
  cidades: CidadeAtalho[]
  criado_em?: string
  atualizado_em?: string
}

// Fallback defensivo para municípios do estado de SP se a rede/banco falhar
export const MUNICIPIOS_SP_FALLBACK: MunicipioSP[] = [
  { codigo_ibge: '3500501', nome: 'Águas de Lindóia', nome_normalizado: 'aguas de lindoia' },
  { codigo_ibge: '3527009', nome: 'Lindóia', nome_normalizado: 'lindoia' },
  { codigo_ibge: '3143403', nome: 'Monte Sião', nome_normalizado: 'monte siao' },
  { codigo_ibge: '3551603', nome: 'Serra Negra', nome_normalizado: 'serra negra' },
  { codigo_ibge: '3500600', nome: 'Águas de São Pedro', nome_normalizado: 'aguas de sao pedro' },
  { codigo_ibge: '3538709', nome: 'Piracicaba', nome_normalizado: 'piracicaba' },
  { codigo_ibge: '3501905', nome: 'Amparo', nome_normalizado: 'amparo' },
  { codigo_ibge: '3537107', nome: 'Pedreira', nome_normalizado: 'pedreira' },
  { codigo_ibge: '3524709', nome: 'Jaguariúna', nome_normalizado: 'jaguariuna' },
  { codigo_ibge: '3519055', nome: 'Holambra', nome_normalizado: 'holambra' },
  { codigo_ibge: '3552106', nome: 'Socorro', nome_normalizado: 'socorro' },
  { codigo_ibge: '3522604', nome: 'Itapira', nome_normalizado: 'itapira' },
  { codigo_ibge: '3509502', nome: 'Campinas', nome_normalizado: 'campinas' },
  { codigo_ibge: '3501608', nome: 'Americana', nome_normalizado: 'americana' },
  { codigo_ibge: '3503802', nome: 'Artur Nogueira', nome_normalizado: 'artur nogueira' },
  { codigo_ibge: '3512803', nome: 'Cosmópolis', nome_normalizado: 'cosmopolis' },
  { codigo_ibge: '3515152', nome: 'Engenheiro Coelho', nome_normalizado: 'engenheiro coelho' },
  { codigo_ibge: '3519071', nome: 'Hortolândia', nome_normalizado: 'hortolandia' },
  { codigo_ibge: '3520509', nome: 'Indaiatuba', nome_normalizado: 'indaiatuba' },
  { codigo_ibge: '3531803', nome: 'Monte Mor', nome_normalizado: 'monte mor' },
  { codigo_ibge: '3533403', nome: 'Nova Odessa', nome_normalizado: 'nova odessa' },
  { codigo_ibge: '3536505', nome: 'Paulínia', nome_normalizado: 'paulinia' },
  { codigo_ibge: '3552403', sumare: 'sumare', nome: 'Sumaré', nome_normalizado: 'sumare' } as any,
  { codigo_ibge: '3556206', nome: 'Valinhos', nome_normalizado: 'valinhos' },
  { codigo_ibge: '3556701', nome: 'Vinhedo', nome_normalizado: 'vinhedo' },
  { codigo_ibge: '3525904', nome: 'Jundiaí', nome_normalizado: 'jundiai' },
  {
    codigo_ibge: '3509601',
    nome: 'Campo Limpo Paulista',
    nome_normalizado: 'campo limpo paulista',
  },
  { codigo_ibge: '3556503', nome: 'Várzea Paulista', nome_normalizado: 'varzea paulista' },
  { codigo_ibge: '3523404', nome: 'Itupeva', nome_normalizado: 'itupeva' },
  { codigo_ibge: '3527306', nome: 'Louveira', nome_normalizado: 'louveira' },
  { codigo_ibge: '3510500', nome: 'Cabreúva', nome_normalizado: 'cabreuva' },
  { codigo_ibge: '3522208', nome: 'Itatiba', nome_normalizado: 'itatiba' },
  { codigo_ibge: '3550308', nome: 'São Paulo', nome_normalizado: 'sao paulo' },
  {
    codigo_ibge: '3548708',
    nome: 'São Bernardo do Campo',
    nome_normalizado: 'sao bernardo do campo',
  },
  { codigo_ibge: '3547809', nome: 'Santo André', nome_normalizado: 'santo andre' },
  { codigo_ibge: '3548807', nome: 'São Caetano do Sul', nome_normalizado: 'sao caetano do sul' },
  { codigo_ibge: '3513801', nome: 'Diadema', nome_normalizado: 'diadema' },
  { codigo_ibge: '3529401', nome: 'Mauá', nome_normalizado: 'maua' },
  { codigo_ibge: '3518800', nome: 'Guarulhos', nome_normalizado: 'guarulhos' },
  { codigo_ibge: '3534401', nome: 'Osasco', nome_normalizado: 'osasco' },
  { codigo_ibge: '3505708', nome: 'Barueri', nome_normalizado: 'barueri' },
  { codigo_ibge: '3547304', nome: 'Santana de Parnaíba', nome_normalizado: 'santana de parnaiba' },
  { codigo_ibge: '3513009', nome: 'Cotia', nome_normalizado: 'cotia' },
  { codigo_ibge: '3552809', nome: 'Taboão da Serra', nome_normalizado: 'taboao da serra' },
  { codigo_ibge: '3549904', nome: 'São José dos Campos', nome_normalizado: 'sao jose dos campos' },
  { codigo_ibge: '3554102', nome: 'Taubaté', nome_normalizado: 'taubate' },
  { codigo_ibge: '3524402', nome: 'Jacareí', nome_normalizado: 'jacarei' },
  { codigo_ibge: '3538006', nome: 'Pindamonhangaba', nome_normalizado: 'pindamonhangaba' },
  { codigo_ibge: '3518404', nome: 'Guaratinguetá', nome_normalizado: 'guaratingueta' },
  { codigo_ibge: '3502507', nome: 'Aparecida', nome_normalizado: 'aparecida' },
  { codigo_ibge: '3509700', nome: 'Campos do Jordão', nome_normalizado: 'campos do jordao' },
  { codigo_ibge: '3510559', nome: 'Caraguatatuba', nome_normalizado: 'caraguatatuba' },
  { codigo_ibge: '3555406', nome: 'Ubatuba', nome_normalizado: 'ubatuba' },
  { codigo_ibge: '3550704', nome: 'São Sebastião', nome_normalizado: 'sao sebastiao' },
  { codigo_ibge: '3520400', nome: 'Ilhabela', nome_normalizado: 'ilhabela' },
  { codigo_ibge: '3552205', nome: 'Sorocaba', nome_normalizado: 'sorocaba' },
  { codigo_ibge: '3557006', nome: 'Votorantim', nome_normalizado: 'votorantim' },
  { codigo_ibge: '3523909', nome: 'Itu', nome_normalizado: 'itu' },
  { codigo_ibge: '3545209', nome: 'Salto', nome_normalizado: 'salto' },
  { codigo_ibge: '3550605', nome: 'São Roque', nome_normalizado: 'sao roque' },
  { codigo_ibge: '3507001', nome: 'Boituva', nome_normalizado: 'boituva' },
  { codigo_ibge: '3553708', nome: 'Tatuí', nome_normalizado: 'tatui' },
  { codigo_ibge: '3543402', nome: 'Ribeirão Preto', nome_normalizado: 'ribeirao preto' },
  { codigo_ibge: '3551702', nome: 'Sertãozinho', nome_normalizado: 'sertaozinho' },
  { codigo_ibge: '3513108', nome: 'Cravinhos', nome_normalizado: 'cravinhos' },
  { codigo_ibge: '3525102', nome: 'Jardinópolis', nome_normalizado: 'jardinopolis' },
  { codigo_ibge: '3505906', nome: 'Batatais', nome_normalizado: 'batatais' },
  { codigo_ibge: '3507506', nome: 'Brodowski', nome_normalizado: 'brodowski' },
  { codigo_ibge: '3524303', nome: 'Jaboticabal', nome_normalizado: 'jaboticabal' },
  { codigo_ibge: '3516903', nome: 'Franca', nome_normalizado: 'franca' },
  { codigo_ibge: '3548500', nome: 'Santos', nome_normalizado: 'santos' },
  { codigo_ibge: '3551009', nome: 'São Vicente', nome_normalizado: 'sao vicente' },
  { codigo_ibge: '3541000', nome: 'Praia Grande', nome_normalizado: 'praia grande' },
  { codigo_ibge: '3518701', nome: 'Guarujá', nome_normalizado: 'guaruja' },
  { codigo_ibge: '3513504', nome: 'Cubatão', nome_normalizado: 'cubatao' },
  { codigo_ibge: '3506359', nome: 'Bertioga', nome_normalizado: 'bertioga' },
  { codigo_ibge: '3522158', nome: 'Itanhaém', nome_normalizado: 'itanhaem' },
  { codigo_ibge: '3531100', nome: 'Mongaguá', nome_normalizado: 'mongagua' },
  { codigo_ibge: '3537602', nome: 'Peruíbe', nome_normalizado: 'peruibe' },
]

export const REGIOES_ATALHO_FALLBACK: RegiaoAtalho[] = [
  {
    id: 'circuito-aguas',
    nome: 'Circuito das Águas Paulista',
    descricao: 'Estâncias hidrominerais e turísticas do interior paulista',
    ordem: 1,
    ativa: true,
    cidades: [
      { codigo: '3500501', nome: 'Águas de Lindóia' },
      { codigo: '3527009', nome: 'Lindóia' },
      { codigo: '3143403', nome: 'Monte Sião' },
      { codigo: '3551603', nome: 'Serra Negra' },
      { codigo: '3500600', nome: 'Águas de São Pedro' },
      { codigo: '3538709', nome: 'Piracicaba' },
      { codigo: '3501905', nome: 'Amparo' },
      { codigo: '3537107', nome: 'Pedreira' },
      { codigo: '3524709', nome: 'Jaguariúna' },
      { codigo: '3519055', nome: 'Holambra' },
      { codigo: '3552106', nome: 'Socorro' },
      { codigo: '3522604', nome: 'Itapira' },
    ],
  },
  {
    id: 'campinas-regiao',
    nome: 'Campinas e região',
    descricao: 'Região Metropolitana de Campinas e cidades do polo tecnológico',
    ordem: 2,
    ativa: true,
    cidades: [
      { codigo: '3509502', nome: 'Campinas' },
      { codigo: '3501608', nome: 'Americana' },
      { codigo: '3503802', nome: 'Artur Nogueira' },
      { codigo: '3512803', nome: 'Cosmópolis' },
      { codigo: '3515152', nome: 'Engenheiro Coelho' },
      { codigo: '3519071', nome: 'Hortolândia' },
      { codigo: '3520509', nome: 'Indaiatuba' },
      { codigo: '3531803', nome: 'Monte Mor' },
      { codigo: '3533403', nome: 'Nova Odessa' },
      { codigo: '3536505', nome: 'Paulínia' },
      { codigo: '3552403', nome: 'Sumaré' },
      { codigo: '3556206', nome: 'Valinhos' },
      { codigo: '3556701', nome: 'Vinhedo' },
    ],
  },
  {
    id: 'jundiai-regiao',
    nome: 'Jundiaí e região',
    descricao: 'Aglomeração urbana de Jundiaí e eixo Anhanguera-Bandeirantes',
    ordem: 3,
    ativa: true,
    cidades: [
      { codigo: '3525904', nome: 'Jundiaí' },
      { codigo: '3509601', nome: 'Campo Limpo Paulista' },
      { codigo: '3556503', nome: 'Várzea Paulista' },
      { codigo: '3523404', nome: 'Itupeva' },
      { codigo: '3527306', nome: 'Louveira' },
      { codigo: '3510500', nome: 'Cabreúva' },
      { codigo: '3522208', nome: 'Itatiba' },
    ],
  },
  {
    id: 'grande-sp-abc',
    nome: 'Grande São Paulo e ABC',
    descricao: 'Capital paulista, ABC paulista, região oeste e alto tietê',
    ordem: 4,
    ativa: true,
    cidades: [
      { codigo: '3550308', nome: 'São Paulo' },
      { codigo: '3548708', nome: 'São Bernardo do Campo' },
      { codigo: '3547809', nome: 'Santo André' },
      { codigo: '3548807', nome: 'São Caetano do Sul' },
      { codigo: '3513801', nome: 'Diadema' },
      { codigo: '3529401', nome: 'Mauá' },
      { codigo: '3518800', nome: 'Guarulhos' },
      { codigo: '3534401', nome: 'Osasco' },
      { codigo: '3505708', nome: 'Barueri' },
      { codigo: '3547304', nome: 'Santana de Parnaíba' },
      { codigo: '3513009', nome: 'Cotia' },
      { codigo: '3552809', nome: 'Taboão da Serra' },
    ],
  },
  {
    id: 'vale-paraiba',
    nome: 'Vale do Paraíba',
    descricao: 'Eixo Dutra, Serra da Mantiqueira e Litoral Norte',
    ordem: 5,
    ativa: true,
    cidades: [
      { codigo: '3549904', nome: 'São José dos Campos' },
      { codigo: '3554102', nome: 'Taubaté' },
      { codigo: '3524402', nome: 'Jacareí' },
      { codigo: '3538006', nome: 'Pindamonhangaba' },
      { codigo: '3518404', nome: 'Guaratinguetá' },
      { codigo: '3502507', nome: 'Aparecida' },
      { codigo: '3509700', nome: 'Campos do Jordão' },
      { codigo: '3508504', nome: 'Caçapava' },
      { codigo: '3510559', nome: 'Caraguatatuba' },
      { codigo: '3555406', nome: 'Ubatuba' },
      { codigo: '3550704', nome: 'São Sebastião' },
    ],
  },
  {
    id: 'sorocaba-regiao',
    nome: 'Sorocaba e região',
    descricao: 'Polo industrial de Sorocaba, Castelo Branco e região de Itu/Salto',
    ordem: 6,
    ativa: true,
    cidades: [
      { codigo: '3552205', nome: 'Sorocaba' },
      { codigo: '3557006', nome: 'Votorantim' },
      { codigo: '3523909', nome: 'Itu' },
      { codigo: '3545209', nome: 'Salto' },
      { codigo: '3550605', nome: 'São Roque' },
      { codigo: '3507001', nome: 'Boituva' },
      { codigo: '3553708', nome: 'Tatuí' },
      { codigo: '3537800', nome: 'Piedade' },
    ],
  },
  {
    id: 'ribeirao-preto-regiao',
    nome: 'Ribeirão Preto e região',
    descricao: 'Capital do agronegócio paulista e macrorregião nordeste',
    ordem: 7,
    ativa: true,
    cidades: [
      { codigo: '3543402', nome: 'Ribeirão Preto' },
      { codigo: '3551702', nome: 'Sertãozinho' },
      { codigo: '3513108', nome: 'Cravinhos' },
      { codigo: '3525102', nome: 'Jardinópolis' },
      { codigo: '3505906', nome: 'Batatais' },
      { codigo: '3507506', nome: 'Brodowski' },
      { codigo: '3524303', nome: 'Jaboticabal' },
      { codigo: '3516903', nome: 'Franca' },
    ],
  },
  {
    id: 'baixada-santista-litoral',
    nome: 'Baixada Santista e litoral',
    descricao: 'Região Metropolitana da Baixada Santista e praias paulistas',
    ordem: 8,
    ativa: true,
    cidades: [
      { codigo: '3548500', nome: 'Santos' },
      { codigo: '3551009', nome: 'São Vicente' },
      { codigo: '3541000', nome: 'Praia Grande' },
      { codigo: '3518701', nome: 'Guarujá' },
      { codigo: '3513504', nome: 'Cubatão' },
      { codigo: '3506359', nome: 'Bertioga' },
      { codigo: '3522158', nome: 'Itanhaém' },
      { codigo: '3531100', nome: 'Mongaguá' },
      { codigo: '3537602', nome: 'Peruíbe' },
    ],
  },
]

export async function listarMunicipiosSP(): Promise<MunicipioSP[]> {
  try {
    const { data, error } = await (supabase.from as any)('municipios_sp')
      .select('codigo_ibge, nome, nome_normalizado, microrregiao, mesorregiao')
      .order('nome', { ascending: true })

    if (error || !data || (data as any[]).length === 0) {
      return MUNICIPIOS_SP_FALLBACK
    }
    return data as unknown as MunicipioSP[]
  } catch (err) {
    console.warn('listarMunicipiosSP: erro ao carregar do Supabase, usando fallback', err)
    return MUNICIPIOS_SP_FALLBACK
  }
}

export async function listarRegioesAtalho(apenasAtivas: boolean = true): Promise<RegiaoAtalho[]> {
  try {
    let query = (supabase.from as any)('regioes_atalho')
      .select('id, nome, descricao, ordem, ativa, cidades, criado_em, atualizado_em')
      .order('ordem', { ascending: true })

    if (apenasAtivas) {
      query = query.eq('ativa', true)
    }

    const { data, error } = await query

    if (error || !data || (data as any[]).length === 0) {
      return REGIOES_ATALHO_FALLBACK
    }
    return data as unknown as RegiaoAtalho[]
  } catch (err) {
    console.warn('listarRegioesAtalho: erro ao carregar do Supabase, usando fallback', err)
    return REGIOES_ATALHO_FALLBACK
  }
}

// Funções para edição pelo Gestor
export async function gestorSalvarRegiaoAtalho(
  atalho: Partial<RegiaoAtalho>,
): Promise<{ success: boolean; data?: RegiaoAtalho; error?: string }> {
  try {
    if (atalho.id) {
      const { data, error } = await (supabase.from as any)('regioes_atalho')
        .update({
          nome: atalho.nome,
          descricao: atalho.descricao,
          ordem: atalho.ordem,
          ativa: atalho.ativa,
          cidades: atalho.cidades,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', atalho.id)
        .select()
        .single()

      if (error) return { success: false, error: error.message }
      return { success: true, data: data as unknown as RegiaoAtalho }
    } else {
      const { data, error } = await (supabase.from as any)('regioes_atalho')
        .insert({
          nome: atalho.nome,
          descricao: atalho.descricao,
          ordem: atalho.ordem || 0,
          ativa: atalho.ativa ?? true,
          cidades: atalho.cidades || [],
        })
        .select()
        .single()

      if (error) return { success: false, error: error.message }
      return { success: true, data: data as unknown as RegiaoAtalho }
    }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Falha ao salvar atalho de região' }
  }
}

export async function gestorExcluirRegiaoAtalho(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabase.from as any)('regioes_atalho').delete().eq('id', id)

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Falha ao excluir atalho de região' }
  }
}
