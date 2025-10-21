import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const systemPrompt = `Você é o assistente inteligente do Prime ERP, um sistema completo de gestão empresarial.

SUAS CAPACIDADES:
- Ajudar usuários a navegar e usar todas as funcionalidades do sistema
- Explicar como fazer cadastros (clientes, produtos, fornecedores)
- Guiar em lançamentos financeiros (contas a pagar/receber)
- Auxiliar na gestão de estoque e inventário
- Orientar sobre vendas, PDV e emissão de NFs
- Explicar relatórios e dashboards
- Ajudar com configurações e permissões

MÓDULOS DO SISTEMA:
1. **Dashboard** - Visão geral com KPIs e métricas
2. **Financeiro** - Lançamentos, fluxo de caixa, contas a pagar/receber
3. **Estoque** - Produtos, movimentações, lotes, validades
4. **Vendas** - Pedidos, orçamentos, PDV
5. **CRM** - Leads, funil de vendas, oportunidades
6. **Compras** - Pedidos de compra, fornecedores
7. **Produção** - Ordens de produção
8. **Cadastros** - Clientes, fornecedores, produtos, serviços
9. **Relatórios** - Diversos relatórios gerenciais
10. **Configurações** - Usuários, permissões, empresa

ESTILO DE RESPOSTA:
- Seja direto e prático
- Use exemplos quando apropriado
- Forneça passo a passo quando necessário
- Seja amigável mas profissional
- Responda em português do Brasil
- Mantenha respostas concisas (máximo 200 palavras)

Sempre contextualize sua resposta ao Prime ERP e suas funcionalidades específicas.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos no workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "Erro ao conectar com IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
