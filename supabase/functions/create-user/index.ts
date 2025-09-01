import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Function to generate unique slug
const generateUniqueSlug = (email: string): string => {
  const baseSlug = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-')
  const timestamp = Date.now().toString()
  return `${baseSlug}-${timestamp}`
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email e senha são obrigatórios' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase admin client using service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create user with email confirmed
    const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // This bypasses email confirmation
      user_metadata: {
        company_name: `Empresa ${email.split('@')[0]}`,
        first_name: email.split('@')[0],
        last_name: ''
      }
    })

    if (error) {
      console.error('Error creating user:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create a brand-new organization and default company for this user
    try {
      if (user.user) {
        const orgName = `Empresa ${email.split('@')[0]}`
        const slug = generateUniqueSlug(email)

        // 1) Create organization
        const { data: org, error: orgError } = await supabaseAdmin
          .from('organizations')
          .insert({ name: orgName, slug })
          .select('id, name')
          .single()

        if (orgError) throw orgError

        // 2) Link user as owner of the organization
        const { error: linkError } = await supabaseAdmin
          .from('user_organizations')
          .insert({ user_id: user.user.id, org_id: org.id, role: 'owner' })

        if (linkError) throw linkError

        // 3) Create default company for this organization
        const { error: companyInsertError } = await supabaseAdmin
          .from('companies')
          .insert({ name: org.name, org_id: org.id, is_default: true })

        if (companyInsertError) throw companyInsertError
      }
    } catch (orgAssocError) {
      console.error('Erro ao criar organização/empresa padrão para o usuário:', orgAssocError)
      // Seguimos mesmo se esta etapa falhar, para não bloquear o cadastro
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Usuário criado com sucesso',
        user: user.user 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in create-user function:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})