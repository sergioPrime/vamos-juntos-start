import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { ChevronDown, ChevronRight, Edit, Trash2, Plus, ExpandIcon, ShrinkIcon, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { useChartOfAccounts, type ChartOfAccount } from "@/hooks/useChartOfAccounts"
import { useCostCenters } from "@/hooks/useCostCenters"
import { useOrganization } from "@/hooks/useOrganization"
import { useToast } from "@/hooks/use-toast"

const chartOfAccountSchema = z.object({
  account_code: z.string().min(1, "Código é obrigatório"),
  account_name: z.string().min(1, "Nome é obrigatório"),
  account_type: z.enum(["synthetic", "analytic"]),
  nature_code: z.string().optional(),
  is_expense: z.boolean().default(false),
  is_active: z.boolean().default(true),
  parent_id: z.string().optional(),
  description: z.string().optional(),
  cost_center_ids: z.array(z.string()).optional(),
})

type ChartOfAccountFormData = z.infer<typeof chartOfAccountSchema>

export default function PlanoDeContas() {
  const { accounts, loading, createAccount, updateAccount, deleteAccount } = useChartOfAccounts()
  const { costCenters, loading: loadingCostCenters, getFlatCostCenters } = useCostCenters()
  const organization = useOrganization()
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [selectedAccount, setSelectedAccount] = useState<ChartOfAccount | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [allExpanded, setAllExpanded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<ChartOfAccountFormData>({
    resolver: zodResolver(chartOfAccountSchema),
    defaultValues: {
      account_type: "analytic",
      is_expense: false,
      is_active: true,
      cost_center_ids: [],
    },
  })

  // Auto-expand nodes on initial load
  useEffect(() => {
    if (accounts.length > 0 && expandedNodes.size === 0) {
      const rootAccounts = accounts.filter(acc => !acc.parent_id)
      setExpandedNodes(new Set(rootAccounts.map(acc => acc.id)))
    }
  }, [accounts, expandedNodes.size])

  const validateAccountCodeUniqueness = async (accountCode: string, excludeId?: string) => {
    const isDuplicate = accounts.some(acc => 
      acc.account_code === accountCode && acc.id !== excludeId
    )
    
    if (isDuplicate) {
      toast({
        title: "Código duplicado",
        description: "Este código já está sendo usado por outra conta.",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const filteredAccounts = accounts.filter(account => {
    if (!searchTerm) return true
    return (
      account.account_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.account_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const getAccountChildren = (parentId: string | null) => {
    return filteredAccounts.filter(account => account.parent_id === parentId)
  }

  const toggleNode = (accountId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId)
    } else {
      newExpanded.add(accountId)
    }
    setExpandedNodes(newExpanded)
  }

  const expandAll = () => {
    const allAccountIds = accounts.map(acc => acc.id)
    setExpandedNodes(new Set(allAccountIds))
    setAllExpanded(true)
  }

  const collapseAll = () => {
    setExpandedNodes(new Set())
    setAllExpanded(false)
  }

  const resetForm = () => {
    form.reset({
      account_type: "analytic",
      is_expense: false,
      is_active: true,
      cost_center_ids: [],
    })
    setSelectedAccount(null)
  }

  const handleEdit = (account: ChartOfAccount) => {
    setSelectedAccount(account)
    form.reset({
      account_code: account.account_code,
      account_name: account.account_name,
      account_type: account.account_type as "synthetic" | "analytic",
      nature_code: account.nature_code || "",
      is_expense: account.is_expense || false,
      is_active: account.is_active,
      parent_id: account.parent_id || "",
      description: account.description || "",
      cost_center_ids: [],
    })
    setDialogOpen(true)
  }

  const handleDelete = async (account: ChartOfAccount) => {
    if (confirm(`Tem certeza que deseja excluir a conta "${account.account_name}"?`)) {
      try {
        await deleteAccount(account.id)
        toast({
          title: "Sucesso",
          description: "Conta excluída com sucesso",
        })
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error.message || "Erro ao excluir conta",
          variant: "destructive",
        })
      }
    }
  }

  const onSubmit = async (data: ChartOfAccountFormData) => {
    if (isSubmitting) return

    if (!organization?.currentOrg?.id) {
      toast({
        title: "Erro",
        description: "Organização não encontrada",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const isValid = await validateAccountCodeUniqueness(
        data.account_code, 
        selectedAccount?.id
      )
      if (!isValid) {
        setIsSubmitting(false)
        return
      }

      const accountData = {
        account_code: data.account_code,
        account_name: data.account_name,
        account_type: data.account_type,
        nature_code: data.nature_code || "",
        is_expense: data.is_expense || false,
        is_active: data.is_active,
        parent_id: data.parent_id || undefined,
        description: data.description || "",
        org_id: organization.currentOrg.id,
        cost_center_ids: data.cost_center_ids || [],
      }

      if (selectedAccount) {
        await updateAccount(selectedAccount.id, accountData)
        toast({
          title: "Sucesso",
          description: "Conta atualizada com sucesso",
        })
      } else {
        await createAccount(accountData)
        toast({
          title: "Sucesso", 
          description: "Conta criada com sucesso",
        })
      }

      setDialogOpen(false)
      resetForm()
    } catch (error: any) {
      console.error("Error saving account:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar conta",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAccountCodeBlur = async (accountCode: string) => {
    if (accountCode && accountCode !== selectedAccount?.account_code) {
      await validateAccountCodeUniqueness(accountCode, selectedAccount?.id)
    }
  }

  const renderAccount = (account: ChartOfAccount, level: number = 0) => {
    const children = getAccountChildren(account.id)
    const hasChildren = children.length > 0
    const isExpanded = expandedNodes.has(account.id)
    const paddingLeft = level * 24

    return (
      <div key={account.id}>
        <div
          className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
          style={{ paddingLeft: `${paddingLeft + 12}px` }}
        >
          <div className="flex items-center space-x-3 flex-1">
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => toggleNode(account.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <div className="w-6 h-6" />
            )}
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm text-muted-foreground">
                  {account.account_code}
                </span>
                <span className="font-medium">{account.account_name}</span>
                
                <div className="flex space-x-1">
                  <Badge variant={account.account_type === "synthetic" ? "secondary" : "default"}>
                    {account.account_type === "synthetic" ? "Sintética" : "Analítica"}
                  </Badge>
                  
                  {account.is_expense && (
                    <Badge variant="destructive" className="text-xs">
                      Despesa
                    </Badge>
                  )}
                  
                  {!account.is_active && (
                    <Badge variant="outline" className="text-xs">
                      Inativa
                    </Badge>
                  )}
                  
                  {account.nature_code && (
                    <Badge variant="outline" className="text-xs">
                      {account.nature_code}
                    </Badge>
                  )}
                </div>
              </div>
              
              {account.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {account.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(account)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(account)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {children.map(child => renderAccount(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const rootAccounts = getAccountChildren(null)

  if (loading || loadingCostCenters) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando plano de contas...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plano de Contas</h1>
          <p className="text-muted-foreground">
            Gerencie o plano de contas da organização
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {selectedAccount ? "Editar Conta" : "Nova Conta"}
              </DialogTitle>
              <DialogDescription>
                {selectedAccount 
                  ? "Edite as informações da conta contábil"
                  : "Adicione uma nova conta ao plano de contas"
                }
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="account_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código da Conta *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="1.1.01" 
                            {...field} 
                            onBlur={() => handleAccountCodeBlur(field.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="account_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Conta *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="synthetic">Sintética</SelectItem>
                            <SelectItem value="analytic">Analítica</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="account_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Conta *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da conta contábil" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="parent_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conta Pai</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a conta pai" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Nenhuma (Conta raiz)</SelectItem>
                            {accounts
                              .filter(acc => acc.id !== selectedAccount?.id)
                              .map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  {account.account_code} - {account.account_name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nature_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código de Natureza</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 01, 02, 03..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descrição da conta contábil"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center space-x-4">
                  <FormField
                    control={form.control}
                    name="is_expense"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Conta de Despesa
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Conta Ativa
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false)
                      resetForm()
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Salvando..." : selectedAccount ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-4">
        <Input
          placeholder="Buscar por código ou nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contas Cadastradas</CardTitle>
              <CardDescription>
                {accounts.length} contas no total
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                <ExpandIcon className="h-4 w-4 mr-2" />
                Expandir Tudo
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                <ShrinkIcon className="h-4 w-4 mr-2" />
                Recolher Tudo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredAccounts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? "Nenhuma conta encontrada" : "Nenhuma conta cadastrada"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {rootAccounts.map(account => renderAccount(account))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
