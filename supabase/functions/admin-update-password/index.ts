import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido. Use POST.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Sessão inválida: autentique-se para alterar senhas.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { userId, password } = await req.json()

    if (!userId || typeof userId !== 'string') {
      return new Response(JSON.stringify({ error: 'Informe o identificador do usuário.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'A nova senha deve conter pelo menos 6 caracteres.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor ausente (service role).' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Valida o JWT do chamador com um cliente autenticado pela própria sessão
    const callerClient = createClient(supabaseUrl, anonKey || serviceRoleKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const {
      data: { user: caller },
      error: callerError,
    } = await callerClient.auth.getUser(authHeader.replace('Bearer ', '').trim())

    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: 'Sessão inválida ou expirada.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Somente administradores podem alterar senhas de outros acessos
    const { data: callerProfile, error: profileError } = await callerClient
      .from('profiles')
      .select('is_admin')
      .eq('id', caller.id)
      .maybeSingle()

    if (profileError || !callerProfile || !callerProfile.is_admin) {
      return new Response(
        JSON.stringify({ error: 'Apenas administradores podem alterar senhas.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Atualiza a senha do acesso informado com o cliente de service role
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: updated, error: updateError } = await adminClient.auth.admin.updateUserById(
      userId,
      { password },
    )

    if (updateError || !updated) {
      return new Response(
        JSON.stringify({ error: updateError?.message || 'Erro ao atualizar a senha.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(JSON.stringify({ success: true, userId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Erro inesperado ao atualizar a senha.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
