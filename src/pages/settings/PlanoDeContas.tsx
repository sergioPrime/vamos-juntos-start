import { useState } from "react"
import { Plus, Search, Edit, Trash2, ChevronRight, ChevronDown, ExpandIcon, ShrinkIcon, Check, ChevronsUpDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useChartOfAccounts, ChartOfAccount } from "@/hooks/useChartOfAccounts"
import { useCostCenters } from "@/hooks/useCostCenters"
import { cn } from "@/lib/utils"

const chartOfAccountSchema = z.object({
  account_code: z.string().min(1, "Código é obrigatório").transform((s) => s.trim()),
  account_name: z.string().min(1, "Nome é obrigatório"),
  account_type: z.enum(["analytic", "synthetic"], {
    required_error: "Tipo de conta é obrigatório",
  }),
  nature_code: z.string().min(1, "Código natureza é obrigatório"),
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
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [selectedAccount, setSelectedAccount] = useState<ChartOfAccount | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [allExpanded, setAllExpanded] = useState(false)

  const form = useForm<ChartOfAccountFormData>({
    resolver: zodResolver(chartOfAccountSchema),
    defaultValues: {
      account_code: "",
      account_name: "",
      account_type: "analytic",
      nature_code: "01",
      is_expense: false,
      is_active: true,
      parent_id: "",
      description: "",
      cost_center_ids: [],
    },
  })

  const natureCodeOptions = [
    { value: "01", label: "01 - Contas de Ativo" },
    { value: "02", label: "02 - Contas de Passivo" },
    { value: "03", label: "03 - Patrimônio Líquido" },
    { value: "04", label: "04 - Contas de Resultado" },
    { value: "05", label: "05 - Contas de Compensação" },
    { value: "09", label: "09 - Outras" },
  ]

  const toggleNode = (accountId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId)
    } else {
      newExpanded.add(accountId)
    }
    setExpandedNodes(newExpanded)
  }

  const expandAllNodes = () => {
    const allNodes = new Set<string>()
    const collectNodes = (accs: ChartOfAccount[]) => {
      accs.forEach(acc => {
        if (acc.children && acc.children.length > 0) {
          allNodes.add(acc.id)
          collectNodes(acc.children)
        }
      })
    }
    collectNodes(accounts)
    setExpandedNodes(allNodes)
    setAllExpanded(true)
  }

  const collapseAllNodes = () => {
    setExpandedNodes(new Set())
    setAllExpanded(false)
  }

  const getAccountPath = (account: ChartOfAccount): string => {
    if (!account.parent_id) return account.account_code
    
    const findParent = (accounts: ChartOfAccount[], targetId: string): ChartOfAccount | null => {
      for (const acc of accounts) {
        if (acc.id === targetId) return acc
        if (acc.children) {
          const found = findParent(acc.children, targetId)
          if (found) return found
        }
      }
      return null
    }
    
    const parent = findParent(accounts, account.parent_id)
    return parent ? `${getAccountPath(parent)} > ${account.account_code}` : account.account_code
  }

  const getCodeSuggestion = (parentId?: string): string => {
    if (!parentId) return "Ex: 1, 2, 3..."
    
    const findParent = (accounts: ChartOfAccount[], targetId: string): ChartOfAccount | null => {
      for (const acc of accounts) {
        if (acc.id === targetId) return acc
        if (acc.children) {
          const found = findParent(acc.children, targetId)
          if (found) return found
        }
      }
      return null
    }
    
    const parent = findParent(accounts, parentId)
    return parent ? `Ex: ${parent.account_code}.1, ${parent.account_code}.2...` : "Ex: 1.1, 1.2..."
  }

  const hasActiveChildren = (account: ChartOfAccount): boolean => {
    return account.children ? account.children.some(child => child.is_active) : false
  }

  const handleEdit = (account: ChartOfAccount) => {
    setSelectedAccount(account)
    form.reset({
      account_code: account.account_code,
      account_name: account.account_name,
      account_type: account.account_type,
      nature_code: account.nature_code,
      is_expense: account.is_expense,
      is_active: account.is_active,
      parent_id: account.parent_id || "",
      description: account.description || "",
      cost_center_ids: account.cost_centers?.map(cc => cc.id) || [],
    })
    setDialogOpen(true)
  }

  const handleNew = () => {
    setSelectedAccount(null)
    form.reset({
      account_code: "",
      account_name: "",
      account_type: "analytic",
      nature_code: "01",
      is_expense: false,
      is_active: true,
      parent_id: "",
      description: "",
      cost_center_ids: [],
    })
    setDialogOpen(true)
  }

  const onSubmit = async (data: ChartOfAccountFormData) => {
    const success = selectedAccount
      ? await updateAccount(selectedAccount.id, data as any)
      : await createAccount(data as any)

    if (success) {
      setDialogOpen(false)
      form.reset()
    }
  }

  const handleDelete = async (account: ChartOfAccount) => {
    const hasChildren = hasActiveChildren(account)
    const deleteMessage = hasChildren 
      ? `Não é possível excluir a conta "${account.account_name}" pois possui contas filhas.`
      : `Tem certeza que deseja excluir a conta "${account.account_name}"?`
    
    if (hasChildren) {
      alert(deleteMessage)
      return
    }
    
    if (confirm(deleteMessage)) {
      await deleteAccount(account.id)
    }
  }

  const filterAccounts = (accounts: ChartOfAccount[]): ChartOfAccount[] => {
    return accounts.filter(account => {
      const matchesSearch = account.account_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           account.account_name.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    })
  }

  const renderAccount = (account: ChartOfAccount, level: number = 0) => {
    const hasChildren = account.children && account.children.length > 0
    const isExpanded = expandedNodes.has(account.id)
    
    return (
      <div key={account.id} className="border-b border-border/50">
        <div 
          className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
          style={{ paddingLeft: `${12 + level * 24}px` }}
        >
          <div className="flex items-center space-x-3 flex-1">
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleNode(account.id)}
                className="p-1 h-6 w-6"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <div className="w-6" />
            )}
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm text-muted-foreground">
                  {account.account_code}
                </span>
                <span className="font-medium">{account.account_name}</span>
                <Badge variant={account.account_type === "analytic" ? "default" : "secondary"}>
                  {account.account_type === "analytic" ? "Analítica" : "Sintética"}
                </Badge>
                <Badge variant={account.is_expense ? "destructive" : "default"}>
                  {account.is_expense ? "Despesa" : "Receita"}
                </Badge>
                {!account.is_active && (
                  <Badge variant="outline">Inativa</Badge>
                )}
              </div>
              {account.description && (
                <p className="text-sm text-muted-foreground mt-1">{account.description}</p>
              )}
              {account.cost_centers && account.cost_centers.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="text-xs text-muted-foreground">Centros de Custo:</span>
                  {account.cost_centers.map((cc) => (
                    <Badge key={cc.id} variant="outline" className="text-xs">
                      {cc.code}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
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
              disabled={hasActiveChildren(account)}
              className="text-destructive hover:text-destructive disabled:opacity-50"
              title={hasActiveChildren(account) ? "Não é possível excluir conta com filhos ativos" : undefined}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {account.children!.map(child => renderAccount(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const getSyntheticAccounts = (accounts: ChartOfAccount[]): ChartOfAccount[] => {
    const result: ChartOfAccount[] = []
    const collectSynthetic = (accs: ChartOfAccount[]) => {
      accs.forEach(acc => {
        if (acc.account_type === "synthetic") {
          result.push(acc)
        }
        if (acc.children) {
          collectSynthetic(acc.children)
        }
      })
    }
    collectSynthetic(accounts)
    return result
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando plano de contas...</p>
        </div>
      </div>
    )
  }

  const filteredAccounts = filterAccounts(accounts)

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between sticky top-[4.5rem] sm:top-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-30 py-4 border-b">
        <h1 className="text-3xl font-bold">Plano de Contas</h1>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={expandAllNodes}
            disabled={allExpanded}
          >
            <ExpandIcon className="h-4 w-4 mr-2" />
            Expandir Tudo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={collapseAllNodes}
            disabled={expandedNodes.size === 0}
          >
            <ShrinkIcon className="h-4 w-4 mr-2" />
            Recolher Tudo
          </Button>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNew}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Conta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedAccount ? "Editar Conta" : "Nova Conta"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <FormField
                     control={form.control}
                     name="account_code"
                     render={({ field }) => (
                       <FormItem>
                          <FormLabel>Código Hierárquico</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={getCodeSuggestion(form.watch("parent_id"))} 
                              {...field} 
                            />
                          </FormControl>
                          {getCodeSuggestion(form.watch("parent_id")) && form.watch("parent_id") && (
                            <p className="text-xs text-muted-foreground">
                              {getCodeSuggestion(form.watch("parent_id"))}
                            </p>
                          )}
                          {selectedAccount && (
                            <p className="text-sm text-muted-foreground">
                              Caminho: {getAccountPath(selectedAccount)}
                            </p>
                          )}
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                  <FormField
                    control={form.control}
                    name="account_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da conta" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="account_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Conta</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="analytic">A - Analítica</SelectItem>
                            <SelectItem value="synthetic">S - Sintética</SelectItem>
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
                        <FormLabel>Código Natureza</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {natureCodeOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="parent_id"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Conta Pai (Opcional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value
                                  ? (() => {
                                      const selectedAccount = getSyntheticAccounts(accounts).find(account => account.id === field.value)
                                      return selectedAccount ? `${selectedAccount.account_code} - ${selectedAccount.account_name}` : "Sem conta pai"
                                    })()
                                  : "Selecione conta pai"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Buscar conta pai..." className="h-9" />
                              <CommandList>
                                <CommandEmpty>Nenhuma conta encontrada.</CommandEmpty>
                                <CommandGroup>
                                  <CommandItem
                                    value="NONE"
                                    onSelect={() => {
                                      field.onChange(undefined)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        !field.value ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    Sem conta pai
                                  </CommandItem>
                                  {getSyntheticAccounts(accounts)
                                    .filter(account => account && account.id && account.account_code && account.account_name)
                                    .map(account => (
                                      <CommandItem
                                        key={account.id}
                                        value={`${account.account_code} - ${account.account_name}`}
                                        onSelect={() => {
                                          field.onChange(account.id)
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            field.value === account.id ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {account.account_code} - {account.account_name}
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="is_expense"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Despesa</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Marque se for conta de despesa
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Ativo</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Desmarque para desativar a conta
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descrição da conta"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("account_type") === "analytic" && (
                  <FormField
                    control={form.control}
                    name="cost_center_ids"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Centros de Custo (Opcional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between text-left font-normal"
                              >
                                {field.value && field.value.length > 0 ? (
                                  <span className="flex flex-wrap gap-1">
                                    {field.value.map(id => {
                                      const costCenter = getFlatCostCenters().find(cc => cc.id === id)
                                      return costCenter ? (
                                        <Badge key={id} variant="secondary" className="text-xs">
                                          {costCenter.code}
                                          <X 
                                            className="ml-1 h-3 w-3 cursor-pointer" 
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              field.onChange(field.value?.filter(ccId => ccId !== id) || [])
                                            }}
                                          />
                                        </Badge>
                                      ) : null
                                    })}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">Selecione centros de custo...</span>
                                )}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Buscar centro de custo..." className="h-9" />
                              <CommandList>
                                <CommandEmpty>Nenhum centro de custo encontrado.</CommandEmpty>
                                <CommandGroup>
                                  {getFlatCostCenters().length === 0 ? (
                                    <CommandItem disabled>
                                      Nenhum centro de custo cadastrado
                                    </CommandItem>
                                  ) : (
                                    getFlatCostCenters().map((costCenter) => (
                                      <CommandItem
                                        key={costCenter.id}
                                        value={`${costCenter.code} - ${costCenter.name}`}
                                        onSelect={() => {
                                          const currentValue = field.value || []
                                          const isSelected = currentValue.includes(costCenter.id)
                                          if (isSelected) {
                                            field.onChange(currentValue.filter(id => id !== costCenter.id))
                                          } else {
                                            field.onChange([...currentValue, costCenter.id])
                                          }
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            field.value?.includes(costCenter.id) ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {costCenter.code} - {costCenter.name}
                                      </CommandItem>
                                    ))
                                  )}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <p className="text-xs text-muted-foreground">
                          Apenas contas analíticas podem ter centros de custo associados
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {selectedAccount ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contas Cadastradas</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por código ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={expandAllNodes}
            >
              <ExpandIcon className="h-4 w-4 mr-2" />
              Expandir Tudo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={collapseAllNodes}
            >
              <ShrinkIcon className="h-4 w-4 mr-2" />
              Recolher Tudo
            </Button>
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
              {filteredAccounts.map(account => renderAccount(account))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}