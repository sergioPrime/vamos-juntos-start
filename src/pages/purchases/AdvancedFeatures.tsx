import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import RecurringPurchases from '@/components/purchases/RecurringPurchases'
import BudgetManagement from '@/components/purchases/BudgetManagement'
import ApprovalPolicies from '@/components/purchases/ApprovalPolicies'
import { Calendar, DollarSign, Shield, Settings } from 'lucide-react'

const AdvancedFeatures = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Funcionalidades Avançadas</h1>
        <p className="text-muted-foreground">
          Ferramentas avançadas para otimizar processos de compra
        </p>
      </div>

      <Tabs defaultValue="recurring" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recurring" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Compras Recorrentes
          </TabsTrigger>
          <TabsTrigger value="budget" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Orçamento de Compras
          </TabsTrigger>
          <TabsTrigger value="policies" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Políticas de Aprovação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recurring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Compras Recorrentes
              </CardTitle>
              <CardDescription>
                Configure templates para geração automática de pedidos periódicos como insumos mensais, 
                materiais de escritório trimestrais, ou qualquer compra que se repita em intervalos regulares.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecurringPurchases />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Orçamento de Compras
              </CardTitle>
              <CardDescription>
                Planeje e monitore gastos por categoria, centro de custo ou projeto. 
                Compare valores planejados vs realizados e receba alertas quando limites forem atingidos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BudgetManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Políticas de Aprovação
              </CardTitle>
              <CardDescription>
                Configure regras automáticas de aprovação baseadas em valores e hierarquia organizacional. 
                Defina limites específicos para cada nível gerencial.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ApprovalPolicies />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Feature Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card>
          <CardHeader className="text-center">
            <Calendar className="h-8 w-8 mx-auto text-blue-600" />
            <CardTitle className="text-lg">Automação de Pedidos</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Elimine tarefas repetitivas configurando templates que geram pedidos automaticamente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <DollarSign className="h-8 w-8 mx-auto text-green-600" />
            <CardTitle className="text-lg">Controle Orçamentário</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Monitore gastos em tempo real e evite estouros de orçamento com alertas automáticos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <Shield className="h-8 w-8 mx-auto text-purple-600" />
            <CardTitle className="text-lg">Governança Avançada</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Configure políticas flexíveis que se adaptam à estrutura organizacional da empresa
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdvancedFeatures