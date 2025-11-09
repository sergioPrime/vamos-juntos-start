# Integração de Web Scraping para Preços de Concorrentes

## Visão Geral

O sistema agora inclui uma funcionalidade de busca automática de preços de concorrentes em marketplaces como Mercado Livre, Amazon, Magazine Luiza, etc.

**Status Atual**: Implementação em modo demonstração com dados simulados.

## Como Funcionar em Produção

Para usar esta funcionalidade em produção, você precisa integrar com uma API de web scraping profissional.

### APIs Recomendadas

1. **ScrapingBee** (Recomendado)
   - Website: https://www.scrapingbee.com
   - Preço: A partir de $49/mês
   - Vantagens: Simples de usar, lida com JavaScript, suporte a proxy

2. **ScraperAPI**
   - Website: https://www.scraperapi.com
   - Preço: A partir de $49/mês
   - Vantagens: Alta taxa de sucesso, geolocalização

3. **Bright Data (ex-Luminati)**
   - Website: https://brightdata.com
   - Preço: A partir de $500/mês
   - Vantagens: Mais robusto, para grandes volumes

### Passo a Passo para Integração

#### 1. Criar Conta na API de Scraping

Crie uma conta em uma das APIs recomendadas e obtenha sua API Key.

#### 2. Adicionar a API Key nos Secrets do Supabase

```bash
# Via Supabase CLI
supabase secrets set SCRAPING_API_KEY=sua_chave_aqui

# Via Dashboard do Supabase
# 1. Acesse seu projeto no Supabase
# 2. Vá em Settings > Edge Functions > Secrets
# 3. Adicione SCRAPING_API_KEY com sua chave
```

#### 3. Criar Edge Function para Web Scraping

Crie um arquivo `supabase/functions/scrape-competitor-prices/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, marketplace } = await req.json()
    
    const SCRAPING_API_KEY = Deno.env.get('SCRAPING_API_KEY')
    
    if (!SCRAPING_API_KEY) {
      throw new Error('SCRAPING_API_KEY não configurada')
    }

    // Exemplo usando ScrapingBee
    const marketplaceUrls: Record<string, string> = {
      mercadolivre: `https://lista.mercadolivre.com.br/${encodeURIComponent(query)}`,
      amazon: `https://www.amazon.com.br/s?k=${encodeURIComponent(query)}`,
      magazineluiza: `https://www.magazineluiza.com.br/busca/${encodeURIComponent(query)}`,
    }

    const targetUrl = marketplaceUrls[marketplace]
    
    const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?` +
      `api_key=${SCRAPING_API_KEY}` +
      `&url=${encodeURIComponent(targetUrl)}` +
      `&render_js=true` +
      `&premium_proxy=true`

    const response = await fetch(scrapingBeeUrl)
    const html = await response.text()

    // Parse do HTML para extrair produtos e preços
    // Nota: A estrutura varia por marketplace
    const products = parseProductsFromHtml(html, marketplace)

    return new Response(
      JSON.stringify({ success: true, products }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function parseProductsFromHtml(html: string, marketplace: string) {
  // Implementação específica por marketplace
  // Você precisará usar um parser HTML como DOMParser ou cheerio
  
  // Exemplo simplificado para Mercado Livre:
  const products: any[] = []
  
  // Use regex ou parser HTML para extrair:
  // - Nome do produto
  // - Preço
  // - URL
  // - Imagem (opcional)
  
  return products
}
```

#### 4. Deploy da Edge Function

```bash
supabase functions deploy scrape-competitor-prices
```

#### 5. Atualizar o Componente Frontend

Edite `src/components/products/CompetitorPriceScraper.tsx` e substitua a seção de simulação por uma chamada real:

```typescript
const handleSearch = async () => {
  // ... validações ...

  try {
    const { data, error } = await supabase.functions.invoke('scrape-competitor-prices', {
      body: {
        query: searchQuery,
        marketplace: selectedMarketplace
      }
    })

    if (error) throw error

    if (data.success) {
      setResults(data.products)
      toast({
        title: 'Busca concluída',
        description: `${data.products.length} resultados encontrados`,
      })
    }
  } catch (error) {
    console.error('Erro ao buscar preços:', error)
    toast({
      title: 'Erro ao buscar preços',
      description: error.message,
      variant: 'destructive',
    })
  } finally {
    setLoading(false)
  }
}
```

### Considerações Importantes

1. **Respeite os Termos de Serviço**: Verifique se o web scraping é permitido nos sites que você pretende fazer scraping.

2. **Rate Limiting**: Implemente limites de requisições para não sobrecarregar os servidores.

3. **Cache**: Considere fazer cache dos resultados para reduzir custos e melhorar performance.

4. **Estrutura HTML Muda**: Os sites mudam sua estrutura HTML frequentemente. Você precisará manter os parsers atualizados.

5. **Custos**: APIs de scraping cobram por requisição. Monitore seus custos.

### Alternativas Mais Simples

Se você não quer usar uma API de scraping paga, considere:

1. **Entrada Manual**: Mantenha o sistema de entrada manual de concorrentes (já implementado)

2. **Planilhas**: Importe preços de planilhas Excel/CSV periodicamente

3. **APIs Oficiais**: Alguns marketplaces oferecem APIs oficiais (geralmente requerem aprovação)

## Suporte

Para dúvidas ou problemas, consulte a documentação das APIs de scraping ou entre em contato com o suporte do PRIMEGESTOR.
