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

    // Associate user with the existing default company (primegestor)
    try {
      if (user.user) {
        // Find the default company
        const { data: defaultCompany, error: companyError } = await supabaseAdmin
          .from('companies')
          .select('id, org_id')
          .eq('is_default', true)
          .single()

        if (defaultCompany) {
          // Add user to default company's organization as member
          const { error: linkError } = await supabaseAdmin
            .from('user_organizations')
            .insert({
              user_id: user.user.id,
              org_id: defaultCompany.org_id,
              role: 'member'
            })

          if (linkError) {
            console.error('Erro ao associar usuário à organização padrão:', linkError)
          } else {
            console.log('Usuário associado com sucesso à empresa padrão')
          }
        } else {
          console.error('Empresa padrão não encontrada')
        }
      }
    } catch (orgAssocError) {
      console.error('Erro ao associar usuário à empresa padrão:', orgAssocError)
      // Continue with user creation even if company association fails
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