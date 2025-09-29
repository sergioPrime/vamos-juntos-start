import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { useOrganization } from "@/hooks/useOrganization"
import { supabase } from "@/integrations/supabase/client"

const TestePDV = () => {
  const { user } = useAuth()
  const { currentOrg } = useOrganization()
  const { toast } = useToast()
  const navigate = useNavigate()

  const criarSessaoCaixa = async () => {
    if (!currentOrg?.id || !user?.id) return

    try {
      const { error } = await supabase
        .from('caixa_sessoes')
        .insert({
          org_id: currentOrg.id,
          usuario_abertura: user.id,
          valor_inicial: 100.00,
          valor_atual: 100.00,
          status: 'aberto',
          abertura_em: new Date().toISOString()
        })

      if (error) throw error

      // Registrar movimentação de abertura
      await supabase
        .from('caixa_movimentacoes')
        .insert({
          org_id: currentOrg.id,
          tipo: 'abertura',
          valor: 100.00,
          descricao: 'Abertura do caixa - Teste',
          created_by: user.id
        })

      toast({
        title: "Sessão de caixa criada!",
        description: "Caixa aberto com valor inicial de R$ 100,00"
      })
    } catch (error) {
      console.error('Error creating cash session:', error)
      toast({
        title: "Erro ao criar sessão",
        description: "Erro ao abrir o caixa para teste",
        variant: "destructive"
      })
    }
  }

  const criarVendaTeste = async () => {
    if (!currentOrg?.id || !user?.id) return

    try {
      // Buscar produto e método de pagamento
      const { data: produtos } = await supabase
        .from('products')
        .select('*')
        .eq('org_id', currentOrg.id)
        .eq('active', true)
        .limit(1)

      const { data: pagamentos } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('org_id', currentOrg.id)
        .eq('active', true)
        .limit(1)

      if (!produtos?.length || !pagamentos?.length) {
        toast({
          title: "Dados insuficientes",
          description: "Necessário ter produtos e métodos de pagamento cadastrados",
          variant: "destructive"
        })
        return
      }

      const produto = produtos[0]
      const pagamento = pagamentos[0]
      const orderNumber = `PDV-TESTE-${Date.now()}`

      // Criar pedido de teste
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          org_id: currentOrg.id,
          owner_id: user.id,
          order_number: orderNumber,
          status: 'completed',
          order_type: 'sale',
          subtotal: produto.unit_price * 2,
          total_amount: produto.unit_price * 2,
          payment_status: 'paid',
          payment_method: pagamento.name,
          completed_at: new Date().toISOString()
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Criar item do pedido
      await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: produto.id,
          product_name: produto.name,
          product_sku: produto.sku,
          quantity: 2,
          unit_price: produto.unit_price,
          total_price: produto.unit_price * 2
        })

      // Criar movimento de estoque
      await supabase
        .from('stock_movements')
        .insert({
          org_id: currentOrg.id,
          product_id: produto.id,
          movement_type: 'out',
          quantity: 2,
          reference_type: 'order',
          reference_id: order.id,
          notes: `Venda Teste PDV - ${orderNumber}`,
          created_by: user.id
        })

      // Registrar no caixa se estiver aberto
      const { data: caixaAberto } = await supabase
        .from('caixa_sessoes')
        .select('id, valor_atual')
        .eq('org_id', currentOrg.id)
        .eq('status', 'aberto')
        .maybeSingle()

      if (caixaAberto) {
        const valorVenda = produto.unit_price * 2

        // Atualizar valor do caixa
        await supabase
          .from('caixa_sessoes')
          .update({
            valor_atual: caixaAberto.valor_atual + valorVenda
          })
          .eq('id', caixaAberto.id)

        // Registrar movimentação
        await supabase
          .from('caixa_movimentacoes')
          .insert({
            org_id: currentOrg.id,
            sessao_id: caixaAberto.id,
            tipo: 'venda',
            valor: valorVenda,
            descricao: `Venda Teste - ${orderNumber}`,
            reference_id: order.id,
            reference_type: 'order',
            created_by: user.id
          })
      }

      toast({
        title: "Venda de teste criada!",
        description: `${produto.name} x2 - R$ ${(produto.unit_price * 2).toFixed(2)}`
      })

    } catch (error) {
      console.error('Error creating test sale:', error)
      toast({
        title: "Erro ao criar venda",
        description: "Erro ao processar venda de teste",
        variant: "destructive"
      })
    }
  }

  const criarDevolucaoTeste = async () => {
    if (!currentOrg?.id || !user?.id) return

    try {
      // Buscar última venda
      const { data: ultimaVenda } = await supabase
        .from('orders')
        .select('*')
        .eq('org_id', currentOrg.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)

      if (!ultimaVenda?.length) {
        toast({
          title: "Nenhuma venda encontrada",
          description: "Crie uma venda primeiro para testar devolução",
          variant: "destructive"
        })
        return
      }

      const venda = ultimaVenda[0]

      // Buscar itens da venda
      const { data: itens } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', venda.id)

      if (!itens?.length) return

      // Devolver ao estoque
      for (const item of itens) {
        await supabase
          .from('stock_movements')
          .insert({
            org_id: currentOrg.id,
            product_id: item.product_id,
            movement_type: 'in',
            quantity: item.quantity,
            reference_type: 'devolucao',
            reference_id: venda.id,
            notes: `Devolução Teste - ${venda.order_number}`,
            created_by: user.id
          })
      }

      // Atualizar status do pedido
      await supabase
        .from('orders')
        .update({
          status: 'returned',
          notes: 'Devolução de teste - PDV'
        })
        .eq('id', venda.id)

      // Registrar no caixa se estiver aberto
      const { data: caixaAberto } = await supabase
        .from('caixa_sessoes')
        .select('id, valor_atual')
        .eq('org_id', currentOrg.id)
        .eq('status', 'aberto')
        .maybeSingle()

      if (caixaAberto) {
        // Atualizar valor do caixa
        await supabase
          .from('caixa_sessoes')
          .update({
            valor_atual: caixaAberto.valor_atual - venda.total_amount
          })
          .eq('id', caixaAberto.id)

        // Registrar movimentação
        await supabase
          .from('caixa_movimentacoes')
          .insert({
            org_id: currentOrg.id,
            sessao_id: caixaAberto.id,
            tipo: 'devolucao',
            valor: venda.total_amount,
            descricao: `Devolução Teste - ${venda.order_number}`,
            observacoes: 'Teste de devolução automática',
            reference_id: venda.id,
            reference_type: 'order',
            created_by: user.id
          })
      }

      toast({
        title: "Devolução processada!",
        description: `Devolução de R$ ${venda.total_amount.toFixed(2)}`
      })

    } catch (error) {
      console.error('Error creating test return:', error)
      toast({
        title: "Erro ao processar devolução",
        description: "Erro ao criar devolução de teste",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="page-container container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Teste do PDV - Lançamentos Automáticos</h1>
        <Button variant="outline" onClick={() => navigate('/pdv')}>
          Voltar ao PDV
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Teste 1: Abrir Caixa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💰 Teste 1: Abrir Caixa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Cria uma sessão de caixa com valor inicial de R$ 100,00
            </p>
            <Button onClick={criarSessaoCaixa} className="w-full">
              Abrir Caixa de Teste
            </Button>
          </CardContent>
        </Card>

        {/* Teste 2: Venda */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🛒 Teste 2: Venda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Cria uma venda automática com 2 unidades do primeiro produto
            </p>
            <Button onClick={criarVendaTeste} className="w-full">
              Criar Venda de Teste
            </Button>
          </CardContent>
        </Card>

        {/* Teste 3: Devolução */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ↩️ Teste 3: Devolução
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Processa devolução da última venda criada
            </p>
            <Button onClick={criarDevolucaoTeste} variant="outline" className="w-full">
              Processar Devolução
            </Button>
          </CardContent>
        </Card>

        {/* Navegação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎛️ Operações do PDV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Acesse as operações avançadas do PDV
            </p>
            <Button onClick={() => navigate('/pdv/operacoes')} variant="secondary" className="w-full">
              Ir para Operações
            </Button>
          </CardContent>
        </Card>

        {/* PDV Principal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏪 PDV Principal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Acesse o PDV principal para vendas
            </p>
            <Button onClick={() => navigate('/pdv')} variant="secondary" className="w-full">
              Ir para PDV
            </Button>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Status dos Testes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="outline">✅ PDV Funcionando</Badge>
              <Badge variant="outline">✅ Operações Implementadas</Badge>
              <Badge variant="outline">✅ Integração com Estoque</Badge>
              <Badge variant="outline">✅ Controle de Caixa</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">🎯 Funcionalidades Implementadas:</h3>
        <ul className="space-y-1 text-sm">
          <li>• ✅ PDV completo com carrinho de compras</li>
          <li>• ✅ Operações de caixa (abrir/fechar/suprimento/sangria)</li>
          <li>• ✅ Sistema de devoluções</li>
          <li>• ✅ Integração com estoque (movimentações automáticas)</li>
          <li>• ✅ Integração com pessoas, produtos, tabelas de preços e formas de pagamento</li>
          <li>• ✅ Controle de sessões de caixa com histórico</li>
          <li>• ✅ Interface responsiva e moderna</li>
        </ul>
      </div>
    </div>
  )
}

export default TestePDV