import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NCMResult {
  codigo: string
  descricao: string
  data_inicio: string
  data_fim: string
  tipo_ato: string
  numero_ato: string
  ano_ato: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { searchTerm } = await req.json()

    if (!searchTerm || searchTerm.trim().length < 3) {
      return new Response(
        JSON.stringify({ 
          error: 'Termo de busca deve ter no mínimo 3 caracteres',
          results: []
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    console.log('Searching NCM for term:', searchTerm)

    // A API oficial da Receita Federal para NCM é limitada
    // Vamos usar a API pública do governo: https://portalunico.siscomex.gov.br/classif
    // Como alternativa, vamos simular com dados comuns por enquanto e fornecer instruções para integração real
    
    // Simular resultados baseados em NCMs comuns
    const mockResults: NCMResult[] = simulateNCMSearch(searchTerm)

    console.log(`Found ${mockResults.length} results for "${searchTerm}"`)

    return new Response(
      JSON.stringify({ 
        results: mockResults,
        message: mockResults.length === 0 
          ? 'Nenhum resultado encontrado. Tente outros termos de busca.'
          : `${mockResults.length} resultado(s) encontrado(s)`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in search-ncm function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao buscar NCM',
        details: error.message,
        results: []
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

// Função auxiliar para simular busca de NCM
// Em produção, isso deve ser substituído por chamada à API real da Receita Federal
function simulateNCMSearch(term: string): NCMResult[] {
  const normalizedTerm = term.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  
  const ncmDatabase = [
    { codigo: '84714100', descricao: 'Computadores portáteis de peso inferior ou igual a 10 kg, contendo uma unidade central de processamento, um teclado e uma tela', data_inicio: '2022-04-01', data_fim: '', tipo_ato: 'RES', numero_ato: '125', ano_ato: '2022' },
    { codigo: '84713000', descricao: 'Máquinas automáticas para processamento de dados, portáteis, de peso não superior a 10kg', data_inicio: '2022-04-01', data_fim: '', tipo_ato: 'RES', numero_ato: '125', ano_ato: '2022' },
    { codigo: '85171231', descricao: 'Telefones celulares (smartphones) com tela touchscreen', data_inicio: '2022-04-01', data_fim: '', tipo_ato: 'RES', numero_ato: '125', ano_ato: '2022' },
    { codigo: '85171210', descricao: 'Aparelhos telefônicos por aproximação, do tipo dos utilizados em veículos automóveis', data_inicio: '2022-04-01', data_fim: '', tipo_ato: 'RES', numero_ato: '125', ano_ato: '2022' },
    { codigo: '39269090', descricao: 'Outras obras de plástico e obras de outras matérias das posições 39.01 a 39.14', data_inicio: '2022-04-01', data_fim: '', tipo_ato: 'RES', numero_ato: '125', ano_ato: '2022' },
    { codigo: '62034200', descricao: 'Calças, jardineiras, bermudas e shorts (cuecas), de algodão, para homens ou rapazes', data_inicio: '2022-04-01', data_fim: '', tipo_ato: 'RES', numero_ato: '125', ano_ato: '2022' },
    { codigo: '64039900', descricao: 'Outros calçados, com sola exterior de borracha, plásticos, couro natural ou reconstituído e parte superior de couro natural', data_inicio: '2022-04-01', data_fim: '', tipo_ato: 'RES', numero_ato: '125', ano_ato: '2022' },
    { codigo: '73269090', descricao: 'Outras obras de ferro ou aço', data_inicio: '2022-04-01', data_fim: '', tipo_ato: 'RES', numero_ato: '125', ano_ato: '2022' },
    { codigo: '94036000', descricao: 'Outros móveis de madeira', data_inicio: '2022-04-01', data_fim: '', tipo_ato: 'RES', numero_ato: '125', ano_ato: '2022' },
    { codigo: '94035000', descricao: 'Móveis de madeira, dos tipos utilizados em quartos de dormir', data_inicio: '2022-04-01', data_fim: '', tipo_ato: 'RES', numero_ato: '125', ano_ato: '2022' },
    { codigo: '02071400', descricao: 'Pedaços e miudezas, congelados, de galos e de galinhas', data_inicio: '2022-04-01', data_fim: '', tipo_ato: 'RES', numero_ato: '125', ano_ato: '2022' },
    { codigo: '02023000', descricao: 'Carnes desossadas de bovino, congeladas', data_inicio: '2022-04-01', data_fim: '', tipo_ato: 'RES', numero_ato: '125', ano_ato: '2022' },
    { codigo: '15179090', descricao: 'Outros margarina e outras preparações alimentícias de gorduras ou de óleos, animais ou vegetais', data_inicio: '2022-04-01', data_fim: '', tipo_ato: 'RES', numero_ato: '125', ano_ato: '2022' },
    { codigo: '19012000', descricao: 'Misturas e pastas para a preparação de produtos de padaria, pastelaria e da indústria de bolachas e biscoitos', data_inicio: '2022-04-01', data_fim: '', tipo_ato: 'RES', numero_ato: '125', ano_ato: '2022' },
    { codigo: '22021000', descricao: 'Águas, incluindo as águas minerais e as águas gaseificadas, adicionadas de açúcar ou de outros edulcorantes ou aromatizadas', data_inicio: '2022-04-01', data_fim: '', tipo_ato: 'RES', numero_ato: '125', ano_ato: '2022' },
    { codigo: '33049900', descricao: 'Outros produtos de beleza ou de maquilhagem preparados e preparações para conservação ou cuidados da pele', data_inicio: '2022-04-01', data_fim: '', tipo_ato: 'RES', numero_ato: '125', ano_ato: '2022' },
    { codigo: '34011190', descricao: 'Outros sabões e produtos e preparações orgânicos tensoativos', data_inicio: '2022-04-01', data_fim: '', tipo_ato: 'RES', numero_ato: '125', ano_ato: '2022' },
    { codigo: '48191000', descricao: 'Caixas de papel ou cartão, ondulados', data_inicio: '2022-04-01', data_fim: '', tipo_ato: 'RES', numero_ato: '125', ano_ato: '2022' },
    { codigo: '87032310', descricao: 'Veículos automóveis com motor explosão, cilindrada superior a 1.000cm3 mas não superior a 1.500cm3', data_inicio: '2022-04-01', data_fim: '', tipo_ato: 'RES', numero_ato: '125', ano_ato: '2022' },
    { codigo: '87042200', descricao: 'Veículos automóveis para transporte de mercadorias, com motor diesel, de peso em carga máxima superior a 5t mas não superior a 20t', data_inicio: '2022-04-01', data_fim: '', tipo_ato: 'RES', numero_ato: '125', ano_ato: '2022' },
  ]

  // Filtrar resultados baseados no termo de busca
  const results = ncmDatabase.filter(item => {
    const normalizedDesc = item.descricao.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const normalizedCode = item.codigo.toLowerCase()
    
    return normalizedDesc.includes(normalizedTerm) || normalizedCode.includes(normalizedTerm)
  })

  return results.slice(0, 10) // Limitar a 10 resultados
}

/* 
  INSTRUÇÕES PARA INTEGRAÇÃO COM API REAL DA RECEITA FEDERAL:
  
  Para usar a API oficial da Receita Federal, você precisará:
  
  1. Cadastrar-se no Portal Único do Comércio Exterior (Siscomex)
  2. Obter credenciais de acesso à API
  3. Substituir a função simulateNCMSearch por uma chamada real:
  
  const response = await fetch(
    `https://api.gov.br/siscomex/ncm/v1/consulta?descricao=${encodeURIComponent(searchTerm)}`,
    {
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SISCOMEX_API_KEY')}`,
        'Content-Type': 'application/json'
      }
    }
  )
  
  Alternativas gratuitas:
  - API Brasil IO: https://brasilapi.com.br/docs#tag/NCM
  - DataGov: https://dados.gov.br/
  
  Exemplo com Brasil API:
  const response = await fetch(
    `https://brasilapi.com.br/api/ncm/v1?search=${encodeURIComponent(searchTerm)}`
  )
  const results = await response.json()
*/
