import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CalendarIcon, Plus, MoreHorizontal, Filter, Download, RefreshCcw, ChevronDown, ChevronUp } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { supabase } from "@/integrations/supabase/client"
import { useOrganization } from "@/hooks/useOrganization"
import { useToast } from "@/hooks/use-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ResponsiveTable } from "@/components/ui/responsive-table"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

const formSchema = z.object({
  company_id: z.string().min(1, "Empresa é obrigatória"),
  person_id: z.string().min(1, "Cliente/Fornecedor é obrigatório"),
  entry_type: z.enum(["receivable", "payable"]),
  chart_of_account_id: z.string().min(1, "Plano de conta é obrigatório"),
  cost_center_id: z.string().min(1, "Centro de custo é obrigatório"),
  amount: z.string().min(1, "Valor é obrigatório"),
  payment_method_id: z.string().optional(),
  bank_account_id: z.string().optional(),
  competence_date: z.date(),
  due_date: z.date(),
  is_settled: z.boolean().default(false),
  settled_at: z.date().optional(),
  settled_payment_method_id: z.string().optional(),
  description: z.string().optional(),
})

interface FinancialEntry {
  id: string
  entry_type: "receivable" | "payable"
  person_type: "customer" | "supplier"
  amount: number
  due_date: string
  is_settled: boolean
  settled_at?: string
  description?: string
  companies?: { name: string }
  customers?: { name: string }
  suppliers?: { name: string }
  chart_of_accounts?: { account_name: string }
  payment_methods?: { name: string }
  bank_accounts?: { bank_name: string }
}

export default function Lancamentos() {
  const organization = useOrganization()
  const { toast } = useToast()
  const [entries, setEntries] = useState<FinancialEntry[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [chartOfAccounts, setChartOfAccounts] = useState<any[]>([])
  const [costCenters, setCostCenters] = useState<any[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showMoreFields, setShowMoreFields] = useState(false)
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entry_type: "receivable",
      competence_date: new Date(),
      due_date: new Date(),
      is_settled: false,
    },
  })

  useEffect(() => {
    if (organization?.currentOrg?.id) {
      loadData()
    }
  }, [organization])

  const loadData = async () => {
    if (!organization?.currentOrg?.id) return

    try {
      setLoading(true)
      
      const [
        entriesResponse,
        companiesResponse,
        customersResponse,
        suppliersResponse,
        chartResponse,
        costCentersResponse,
        paymentMethodsResponse,
        bankAccountsResponse
      ] = await Promise.all([
        supabase
          .from("financial_entries")
          .select(`
            *,
            companies(name),
            customers(name),
            suppliers(name),
            chart_of_accounts(account_name),
            payment_methods(name),
            bank_accounts(bank_name)
          `)
          .eq("org_id", organization.currentOrg.id)
          .order("created_at", { ascending: false }),
        
        supabase
          .from("companies")
          .select("*")
          .eq("org_id", organization.currentOrg.id)
          .eq("is_active", true),
        
        supabase
          .from("customers")
          .select("*")
          .eq("org_id", organization.currentOrg.id),
        
        supabase
          .from("suppliers")
          .select("*")
          .eq("org_id", organization.currentOrg.id),
        
        supabase
          .from("chart_of_accounts")
          .select("*")
          .eq("org_id", organization.currentOrg.id)
          .eq("is_active", true),
        
        supabase
          .from("cost_centers")
          .select("*")
          .eq("org_id", organization.currentOrg.id)
          .eq("is_active", true),
        
        supabase
          .from("payment_methods")
          .select("*")
          .eq("org_id", organization.currentOrg.id)
          .eq("active", true),
        
        supabase
          .from("bank_accounts")
          .select("*")
          .eq("org_id", organization.currentOrg.id)
          .eq("is_active", true)
      ])

      if (entriesResponse.error) throw entriesResponse.error
      if (companiesResponse.error) throw companiesResponse.error
      if (customersResponse.error) throw customersResponse.error
      if (suppliersResponse.error) throw suppliersResponse.error
      if (chartResponse.error) throw chartResponse.error
      if (costCentersResponse.error) throw costCentersResponse.error
      if (paymentMethodsResponse.error) throw paymentMethodsResponse.error
      if (bankAccountsResponse.error) throw bankAccountsResponse.error

      setEntries((entriesResponse.data || []) as any)
      setCompanies(companiesResponse.data || [])
      setCustomers(customersResponse.data || [])
      setSuppliers(suppliersResponse.data || [])
      setChartOfAccounts(chartResponse.data || [])
      setCostCenters(costCentersResponse.data || [])
      setPaymentMethods(paymentMethodsResponse.data || [])
      setBankAccounts(bankAccountsResponse.data || [])
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!organization?.currentOrg?.id) return

    try {
      const entryData = {
        ...values,
        org_id: organization.currentOrg.id,
        person_type: values.entry_type === "receivable" ? "customer" : "supplier",
        amount: parseFloat(values.amount),
        competence_date: values.competence_date.toISOString().split('T')[0],
        due_date: values.due_date.toISOString().split('T')[0],
        created_by: organization.currentOrg.id, // Temporary - should be user ID
      }

      const { error } = await supabase
        .from("financial_entries")
        .insert(entryData as any)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Lançamento criado com sucesso",
      })

      form.reset()
      loadData()
    } catch (error) {
      console.error("Error creating entry:", error)
      toast({
        title: "Erro",
        description: "Erro ao criar lançamento",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (entry: FinancialEntry) => {
    if (entry.is_settled) {
      return <Badge variant="default">Quitado</Badge>
    }
    
    const isOverdue = new Date(entry.due_date) < new Date()
    return (
      <Badge variant={isOverdue ? "destructive" : "secondary"}>
        {isOverdue ? "Em Atraso" : "Pendente"}
      </Badge>
    )
  }

  const filteredEntries = entries.filter(entry => {
    if (filterType !== "all" && entry.entry_type !== filterType) return false
    if (filterStatus === "settled" && !entry.is_settled) return false
    if (filterStatus === "pending" && entry.is_settled) return false
    if (filterStatus === "overdue" && (entry.is_settled || new Date(entry.due_date) >= new Date())) return false
    return true
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy')
  }

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando lançamentos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lançamentos Financeiros</h1>
          <p className="text-muted-foreground">
            Gerencie contas a receber e contas a pagar
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dados" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="pagamentos" disabled>Pagamentos</TabsTrigger>
          <TabsTrigger value="arquivos" disabled>Arquivos</TabsTrigger>
          <TabsTrigger value="historico" disabled>Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Section */}
            <Card>
              <CardHeader>
                <CardTitle>Novo Lançamento</CardTitle>
                <CardDescription>
                  Preencha os dados para criar um novo lançamento financeiro
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="entry_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Lançamento</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="receivable">Conta a Receber</SelectItem>
                              <SelectItem value="payable">Conta a Pagar</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="company_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sua Empresa</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a empresa" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {companies.map((company) => (
                                <SelectItem key={company.id} value={company.id}>
                                  {company.name}
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
                      name="person_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {form.watch("entry_type") === "receivable" ? "Cliente" : "Fornecedor"}
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={`Selecione o ${form.watch("entry_type") === "receivable" ? "cliente" : "fornecedor"}`} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(form.watch("entry_type") === "receivable" ? customers : suppliers).map((person) => (
                                <SelectItem key={person.id} value={person.id}>
                                  {person.name}
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
                      name="chart_of_account_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plano de Conta</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o plano de conta" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {chartOfAccounts.map((account) => (
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
                      name="cost_center_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Centro de Custo</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o centro de custo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {costCenters.map((center) => (
                                <SelectItem key={center.id} value={center.id}>
                                  {center.code} - {center.name}
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
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor (R$)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="0,00"
                              type="number"
                              step="0.01"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="competence_date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Data da Competência</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "dd/MM/yyyy")
                                    ) : (
                                      <span>Selecione a data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                  className="p-3 pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="due_date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Data do Vencimento</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "dd/MM/yyyy")
                                    ) : (
                                      <span>Selecione a data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                  className="p-3 pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="is_settled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Foi Quitado?</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <Collapsible open={showMoreFields} onOpenChange={setShowMoreFields}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between">
                          Mostrar Mais Campos
                          {showMoreFields ? <ChevronUp /> : <ChevronDown />}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="payment_method_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Forma de Pagamento</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione a forma de pagamento" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {paymentMethods.map((method) => (
                                    <SelectItem key={method.id} value={method.id}>
                                      {method.name}
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
                          name="bank_account_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Conta Bancária</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione a conta bancária" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {bankAccounts.map((account) => (
                                    <SelectItem key={account.id} value={account.id}>
                                      {account.bank_name} - {account.account_number}
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
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descrição</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Descrição do lançamento"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CollapsibleContent>
                    </Collapsible>

                    <Button type="submit" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Lançamento
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* List Section */}
            <Card>
              <CardHeader>
                <CardTitle>Lançamentos Recentes</CardTitle>
                <CardDescription>
                  Visualize e gerencie seus lançamentos financeiros
                </CardDescription>
                
                <div className="flex items-center space-x-2">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="receivable">A Receber</SelectItem>
                      <SelectItem value="payable">A Pagar</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Status</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="settled">Quitado</SelectItem>
                      <SelectItem value="overdue">Em Atraso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {filteredEntries.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum lançamento encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredEntries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant={entry.entry_type === "receivable" ? "default" : "secondary"}>
                              {entry.entry_type === "receivable" ? "A Receber" : "A Pagar"}
                            </Badge>
                            {getStatusBadge(entry)}
                          </div>
                          <p className="font-medium">
                            {entry.person_type === "customer" && entry.customers?.name}
                            {entry.person_type === "supplier" && entry.suppliers?.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Venc: {formatDate(entry.due_date)}
                          </p>
                          {entry.description && (
                            <p className="text-sm text-muted-foreground">{entry.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            {formatCurrency(entry.amount)}
                          </p>
                          {entry.is_settled && entry.settled_at && (
                            <p className="text-sm text-muted-foreground">
                              Quitado em {formatDate(entry.settled_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}