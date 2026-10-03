import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface GeocodeRequest {
  tabela: 'leads_venda' | 'leads_investidor'
  id: string
  // Opcionais se já salvos no registro
  logradouro?: string | null
  numero?: string | null
  bairro?: string | null
  cidade?: string | null
  cep?: string | null
  codigo_ibge?: string | null
}

interface GeocodeResult {
  latitude: number | null
  longitude: number | null
  precisao: 'exata' | 'aproximada'
  status: 'ok' | 'fallback_bairro' | 'falha' | 'ja_exata'
  detalhes?: string
}

async function chamarGoogleGeocoding(
  query: string,
  apiKey: string,
): Promise<{ lat: number; lng: number } | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    query,
  )}&key=${apiKey}&language=pt-BR&region=br`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.warn(`Google Geocoding retornou HTTP ${res.status}`)
      return null
    }

    const data = await res.json()
    if (data.status === 'OK' && Array.isArray(data.results) && data.results.length > 0) {
      const loc = data.results[0].geometry?.location
      if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
        return { lat: loc.lat, lng: loc.lng }
      }
    } else {
      console.warn(`Google Geocoding status: ${data.status} para query "${query}"`)
    }
  } catch (err) {
    console.warn('Erro ao chamar Google Geocoding:', err)
  }

  return null
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const supabaseServiceKey =
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || ''
  const apiKey =
    Deno.env.get('GOOGLE_GEOCODING_API_KEY') || Deno.env.get('GOOGLE_MAPS_API_KEY') || ''

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })

  try {
    const payload: GeocodeRequest = await req.json()
    const { tabela, id } = payload

    if (!tabela || !id) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros "tabela" e "id" são obrigatórios.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 1. Carrega o registro existente para checar se já está geocodificado com "exata"
    const { data: registro, error: fetchErr } = await supabaseAdmin
      .from(tabela)
      .select('*')
      .eq('id', id)
      .single()

    if (fetchErr || !registro) {
      return new Response(
        JSON.stringify({ error: `Registro ${id} não encontrado na tabela ${tabela}.` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Idempotência: se já tem precisão "exata", não geocodifica de novo
    if (registro.precisao_localizacao === 'exata' && registro.localizacao) {
      return new Response(
        JSON.stringify({
          status: 'ja_exata',
          precisao: 'exata',
          latitude: registro.latitude,
          longitude: registro.longitude,
          mensagem: 'Registro já geocodificado com precisão exata anteriormente.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Monta dados de endereço combinando payload e registro
    const isVenda = tabela === 'leads_venda'
    const logradouro =
      payload.logradouro || (isVenda ? registro.logradouro : registro.logradouro_referencia) || ''
    const numero = payload.numero || (isVenda ? registro.numero : '') || ''
    const bairro = payload.bairro || (isVenda ? registro.bairro : registro.bairro_referencia) || ''
    const cidade = payload.cidade || (isVenda ? registro.cidade : registro.cidades_interesse) || ''
    const cep = payload.cep || (isVenda ? registro.cep : registro.cep_referencia) || ''

    let resultado: GeocodeResult = {
      latitude: null,
      longitude: null,
      precisao: 'aproximada',
      status: 'falha',
      detalhes: 'Chave de API não configurada ou endereço não localizado.',
    }

    // Se temos a chave da API Google Geocoding
    if (apiKey) {
      // Tentativa 1: Endereço completo (logradouro, número, bairro, cidade, CEP)
      const partesCompletas = [
        [logradouro, numero].filter(Boolean).join(', '),
        bairro,
        cidade,
        cep,
        'Brasil',
      ].filter((p) => Boolean(p && String(p).trim()))

      if (partesCompletas.length >= 2) {
        const queryCompleta = partesCompletas.join(', ')
        const coordsExatas = await chamarGoogleGeocoding(queryCompleta, apiKey)
        if (coordsExatas) {
          resultado = {
            latitude: coordsExatas.lat,
            longitude: coordsExatas.lng,
            precisao: 'exata',
            status: 'ok',
            detalhes: `Geocodificado com sucesso via "${queryCompleta}"`,
          }
        }
      }

      // Tentativa 2 (Fallback): Se falhou e temos bairro + cidade, consulta centro do bairro
      if (!resultado.latitude && bairro && cidade) {
        const queryBairro = `${bairro}, ${cidade}, Brasil`
        const coordsBairro = await chamarGoogleGeocoding(queryBairro, apiKey)
        if (coordsBairro) {
          resultado = {
            latitude: coordsBairro.lat,
            longitude: coordsBairro.lng,
            precisao: 'aproximada',
            status: 'fallback_bairro',
            detalhes: `Centro do bairro obtido via "${queryBairro}"`,
          }
        }
      }
    } else {
      console.warn(
        'GOOGLE_GEOCODING_API_KEY ou GOOGLE_MAPS_API_KEY ausente nos Segredos. Seguindo caminho de fallback (aproximada).',
      )
    }

    // 2. Grava latitude/longitude e PostGIS geography via RPC do banco
    const lat = resultado.latitude
    const lng = resultado.longitude
    const precisao = resultado.precisao

    // Chama a RPC fn_atualizar_coordenadas_lead
    const { error: rpcErr } = await supabaseAdmin.rpc('fn_atualizar_coordenadas_lead', {
      p_tabela: tabela,
      p_id: id,
      p_latitude: lat,
      p_longitude: lng,
      p_precisao: precisao,
    })

    if (rpcErr) {
      console.error('Erro na RPC fn_atualizar_coordenadas_lead:', rpcErr)
      // Fallback update direto caso a RPC falhe
      const updateData: Record<string, any> = isVenda
        ? {
            latitude: lat,
            longitude: lng,
            precisao_localizacao: precisao,
            geocodificado_em: new Date().toISOString(),
          }
        : {
            latitude_referencia: lat,
            longitude_referencia: lng,
            precisao_localizacao: precisao,
            geocodificado_em: new Date().toISOString(),
          }

      await supabaseAdmin.from(tabela).update(updateData).eq('id', id)
    }

    return new Response(JSON.stringify(resultado), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('Exceção na Edge Function geocodificar-endereco:', err)
    return new Response(
      JSON.stringify({ error: err?.message || 'Erro interno ao processar geocodificação.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
