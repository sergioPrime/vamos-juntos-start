import React, { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useOrganization } from '@/hooks/useOrganization'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/hooks/use-toast'
import { Plus, DollarSign, TrendingUp, TrendingDown, AlertTriangle, Calendar, PieChart } from 'lucide-react'

interface PurchaseBudget {
  id: string
  budget_name: string
  budget_year: number
  cost_center?: string
  category?: string
  planned_amount: number
  spent_amount: number
  reserved_amount: number
  available_amount: number
  status: 'draft' | 'active' | 'closed'
  created_at: string
  monthly_breakdown?: BudgetMonthlyBreakdown[]
  alerts?: BudgetAlert[]
}

interface BudgetMonthlyBreakdown {
  id: string
  month: number
  planned_amount: number
  spent_amount: number
}

interface BudgetAlert {
  id: string
  alert_type: 'threshold' | 'overspent' | 'monthly_limit'
  threshold_percentage?: number
  is_triggered: boolean
  triggered_at?: string
  message?: string
}

interface NewBudgetForm {
  budget_name: string
  budget_year: number
  cost_center: string
  category: string
  planned_amount: number
  monthly_distribution: number[]
}

const BudgetManagement = () => {
  const { user } = useAuth()
  const { currentOrg: currentOrganization } = useOrganization()
  const [budgets, setBudgets] = useState<PurchaseBudget[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [newBudget, setNewBudget] = useState<NewBudgetForm>({
    budget_name: '',
    budget_year: new Date().getFullYear(),
    cost_center: '',
    category: '',
    planned_amount: 0,
    monthly_distribution: Array(12).fill(0)
  })

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  useEffect(() => {
    if (currentOrganization) {
      fetchBudgets()
    }
  }, [currentOrganization, selectedYear])

  const fetchBudgets = async () => {
    if (!currentOrganization) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('purchase_budgets')
        .select(`
          *,
          budget_monthly_breakdown(*),
          budget_alerts(*)
        `)
        .eq('org_id', currentOrganization.id)
        .eq('budget_year', selectedYear)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching budgets:', error)
        toast({
          title: "Erro",
          description: "Erro ao carregar orçamentos",
          variant: "destructive",
        })
        return
      }

      setBudgets((data as PurchaseBudget[]) || [])
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar orçamentos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createBudget = async () => {
    if (!currentOrganization || !user) return

    try {
      const budgetData = {
        budget_name: newBudget.budget_name,
        budget_year: newBudget.budget_year,
        cost_center: newBudget.cost_center || null,
        category: newBudget.category || null,
        planned_amount: newBudget.planned_amount,
        available_amount: newBudget.planned_amount,
        org_id: currentOrganization.id,
        created_by: user.id
      }

      const { data: budget, error: budgetError } = await supabase
        .from('purchase_budgets')
        .insert(budgetData)
        .select()
        .single()

      if (budgetError) {
        console.error('Error creating budget:', budgetError)
        toast({
          title: "Erro",
          description: "Erro ao criar orçamento",
          variant: "destructive",
        })
        return
      }

      // Create monthly breakdown
      const monthlyData = newBudget.monthly_distribution.map((amount, index) => ({
        budget_id: budget.id,
        month: index + 1,
        planned_amount: amount
      })).filter(item => item.planned_amount > 0)

      if (monthlyData.length > 0) {
        const { error: monthlyError } = await supabase
          .from('budget_monthly_breakdown')
          .insert(monthlyData)

        if (monthlyError) {
          console.error('Error creating monthly breakdown:', monthlyError)
        }
      }

      toast({
        title: "Sucesso",
        description: "Orçamento criado com sucesso",
      })

      setIsCreateDialogOpen(false)
      resetForm()
      fetchBudgets()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar orçamento",
        variant: "destructive",
      })
    }
  }

  const distributeAmountEvenly = () => {
    const monthlyAmount = newBudget.planned_amount / 12
    setNewBudget(prev => ({
      ...prev,
      monthly_distribution: Array(12).fill(monthlyAmount)
    }))
  }

  const updateMonthlyAmount = (month: number, amount: number) => {
    setNewBudget(prev => ({
      ...prev,
      monthly_distribution: prev.monthly_distribution.map((val, index) =>
        index === month ? amount : val
      )
    }))
  }

  const resetForm = () => {
    setNewBudget({
      budget_name: '',
      budget_year: new Date().getFullYear(),
      cost_center: '',
      category: '',
      planned_amount: 0,
      monthly_distribution: Array(12).fill(0)
    })
  }

  const getUsagePercentage = (budget: PurchaseBudget) => {
    if (budget.planned_amount === 0) return 0
    return (budget.spent_amount / budget.planned_amount) * 100
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: <Badge variant="secondary">Rascunho</Badge>,
      active: <Badge variant="default" className="bg-green-600">Ativo</Badge>,
      closed: <Badge variant="outline">Fechado</Badge>
    }
    return badges[status as keyof typeof badges] || <Badge>{status}</Badge>
  }

  const getUsageBadge = (percentage: number) => {
    if (percentage >= 100) return <Badge variant="destructive">Estourado</Badge>
    if (percentage >= 80) return <Badge className="bg-yellow-600">Atenção</Badge>
    if (percentage >= 60) return <Badge className="bg-blue-600">Moderado</Badge>
    return <Badge variant="outline">Baixo</Badge>
  }

  const totalPlanned = budgets.reduce((sum, budget) => sum + budget.planned_amount, 0)
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent_amount, 0)
  const totalAvailable = budgets.reduce((sum, budget) => sum + budget.available_amount, 0)

  if (loading) {
    return <div className="p-6">Carregando orçamentos...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Orçamento</h2>
          <p className="text-muted-foreground">Planeje e monitore gastos por categoria</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i
                return (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Orçamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Orçamento de Compras</DialogTitle>
                <DialogDescription>
                  Configure um orçamento para controle de gastos
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="general">Dados Gerais</TabsTrigger>
                  <TabsTrigger value="monthly">Distribuição Mensal</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="budget_name">Nome do Orçamento *</Label>
                      <Input
                        id="budget_name"
                        value={newBudget.budget_name}
                        onChange={(e) => setNewBudget(prev => ({ ...prev, budget_name: e.target.value }))}
                        placeholder="Ex: Material de Escritório 2024"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="budget_year">Ano *</Label>
                      <Input
                        id="budget_year"
                        type="number"
                        value={newBudget.budget_year}
                        onChange={(e) => setNewBudget(prev => ({ ...prev, budget_year: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cost_center">Centro de Custo</Label>
                      <Input
                        id="cost_center"
                        value={newBudget.cost_center}
                        onChange={(e) => setNewBudget(prev => ({ ...prev, cost_center: e.target.value }))}
                        placeholder="Ex: ADM, VEN, PRO"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="category">Categoria</Label>
                      <Input
                        id="category"
                        value={newBudget.category}
                        onChange={(e) => setNewBudget(prev => ({ ...prev, category: e.target.value }))}
                        placeholder="Ex: Material, Equipamentos, Serviços"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="planned_amount">Valor Planejado Total *</Label>
                    <Input
                      id="planned_amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newBudget.planned_amount}
                      onChange={(e) => setNewBudget(prev => ({ ...prev, planned_amount: Number(e.target.value) }))}
                      placeholder="0.00"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="monthly" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-semibold">Distribuição Mensal</h4>
                    <Button onClick={distributeAmountEvenly} variant="outline" size="sm">
                      Distribuir Igualmente
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {months.map((month, index) => (
                      <div key={index}>
                        <Label>{month}</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={newBudget.monthly_distribution[index]}
                          onChange={(e) => updateMonthlyAmount(index, Number(e.target.value))}
                          placeholder="0.00"
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center text-sm">
                      <span>Total Distribuído:</span>
                      <span className="font-bold">
                        R$ {newBudget.monthly_distribution.reduce((sum, amount) => sum + amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Valor Planejado:</span>
                      <span className="font-bold">
                        R$ {newBudget.planned_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {Math.abs(newBudget.planned_amount - newBudget.monthly_distribution.reduce((sum, amount) => sum + amount, 0)) > 0.01 && (
                      <div className="flex justify-between items-center text-sm text-orange-600">
                        <span>Diferença:</span>
                        <span className="font-bold">
                          R$ {Math.abs(newBudget.planned_amount - newBudget.monthly_distribution.reduce((sum, amount) => sum + amount, 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={createBudget}>
                  Criar Orçamento
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Planejado</p>
                <p className="text-2xl font-bold">R$ {totalPlanned.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Gasto</p>
                <p className="text-2xl font-bold">R$ {totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-muted-foreground">
                {totalPlanned > 0 ? ((totalSpent / totalPlanned) * 100).toFixed(1) : 0}% do planejado
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Disponível</p>
                <p className="text-2xl font-bold">R$ {totalAvailable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget List */}
      <div className="grid gap-4">
        {budgets.map((budget) => {
          const usagePercentage = getUsagePercentage(budget)
          const activeAlerts = budget.alerts?.filter(alert => alert.is_triggered) || []
          
          return (
            <Card key={budget.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {budget.budget_name}
                      {getStatusBadge(budget.status)}
                      {getUsageBadge(usagePercentage)}
                    </CardTitle>
                    <CardDescription>
                      {budget.cost_center && `Centro: ${budget.cost_center} • `}
                      {budget.category && `Categoria: ${budget.category}`}
                    </CardDescription>
                  </div>
                  
                  {activeAlerts.length > 0 && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {activeAlerts.length} alerta(s)
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Utilização do Orçamento</span>
                      <span>{usagePercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={Math.min(usagePercentage, 100)} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Planejado:</span>
                      <p className="font-semibold">R$ {budget.planned_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Gasto:</span>
                      <p className="font-semibold">R$ {budget.spent_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Reservado:</span>
                      <p className="font-semibold">R$ {budget.reserved_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Disponível:</span>
                      <p className="font-semibold">R$ {budget.available_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                  
                  {activeAlerts.length > 0 && (
                    <div className="pt-4 border-t">
                      <h5 className="text-sm font-semibold mb-2 text-red-600">Alertas Ativos:</h5>
                      {activeAlerts.map((alert) => (
                        <div key={alert.id} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          {alert.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
        
        {budgets.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum orçamento configurado</h3>
              <p className="text-muted-foreground mb-4">
                Configure orçamentos para controlar gastos por categoria
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Orçamento
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default BudgetManagement