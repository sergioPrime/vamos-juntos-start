import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CalendarIcon, Plus, RefreshCcw, ChevronDown, ChevronUp, Check, ChevronsUpDown, Download } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { supabase } from "@/integrations/supabase/client"
import { useOrganization } from "@/hooks/useOrganization"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { useFinancialEntries } from "@/hooks/useFinancialEntries"
import { useBankAccounts } from "@/hooks/useBankAccounts"
import { FinancialListingTab } from "@/components/finance/FinancialListingTab"

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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const formSchema = z.object({
  company_id: z.string().min(1, "Empresa é obrigatória"),
  person_id: z.string().min(1, "Cliente/Fornecedor é obrigatório"),
  entry_type: z.enum(["receivable", "payable"]),
  chart_of_account_id: z.string().min(1, "Plano de conta é obrigatório"),
  cost_center_id: z.string().min(1, "Centro de custo é obrigatório"),
  amount: z.string().min(1, "Valor é obrigatório").refine((val) => {
    const numericValue = parseFloat(val)
    return numericValue > 0
  }, "Valor deve ser maior que zero"),
  payment_method_id: z.string().optional(),
  bank_account_id: z.string().optional(),
  competence_date: z.date(),
  due_date: z.date(),
  is_settled: z.boolean().default(false),
  settled_at: z.date().optional(),
  settled_payment_method_id: z.string().optional(),
  description: z.string().optional(),
  // New fields
  group_name: z.string().optional(),
  document_number: z.string().optional(),
  discount_percent: z.number().optional(),
  original_due_date: z.date().optional(),
  is_conciliated: z.boolean().default(false),
  // Installment/Recurrence fields
  installment_type: z.enum(["none", "manual", "automatic", "recurring"]).default("none"),
  installment_count: z.number().optional(),
  installment_interval: z.enum(["monthly", "quarterly", "semiannual", "annual"]).optional(),
})

interface FinancialEntry {
  id: string
  entry_code?: number
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
  const { user } = useAuth()
  const { toast } = useToast()
  const { entries, loading: entriesLoading, loadEntries, createEntry } = useFinancialEntries()
  const { getFormattedAccountName } = useBankAccounts()
  const [companies, setCompanies] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [chartOfAccounts, setChartOfAccounts] = useState<any[]>([])
  const [costCenters, setCostCenters] = useState<any[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showMoreFields, setShowMoreFields] = useState(false)
  const [showInstallments, setShowInstallments] = useState(false)
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [companySearchOpen, setCompanySearchOpen] = useState(false)
  const [companySearchValue, setCompanySearchValue] = useState("")
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false)
  const [customerSearchValue, setCustomerSearchValue] = useState("")
  const [supplierSearchOpen, setSupplierSearchOpen] = useState(false)
  const [supplierSearchValue, setSupplierSearchValue] = useState("")
  const [chartAccountSearchOpen, setChartAccountSearchOpen] = useState(false)
  const [chartAccountSearchValue, setChartAccountSearchValue] = useState("")
  const [costCenterSearchOpen, setCostCenterSearchOpen] = useState(false)
  const [costCenterSearchValue, setCostCenterSearchValue] = useState("")
  const [amountDisplayValue, setAmountDisplayValue] = useState("")
  const [activeTab, setActiveTab] = useState("listagem")
  const [editingEntry, setEditingEntry] = useState<any>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entry_type: "receivable",
      competence_date: new Date(),
      due_date: new Date(),
      is_settled: false,
      installment_type: "none",
    },
  })

  useEffect(() => {
    if (organization?.currentOrg?.id) {
      loadData()
    }
  }, [organization])

  // Listen for edit entry events from listing tab
  useEffect(() => {
    const handleSwitchToEditTab = (event: any) => {
      const entry = event.detail.entry;
      setEditingEntry(entry);
      
      // Pre-fill form with entry data
      form.reset({
        company_id: entry.company_id || '',
        person_id: entry.person_id || '',
        entry_type: entry.entry_type || 'receivable',
        chart_of_account_id: entry.chart_of_account_id || '',
        cost_center_id: entry.cost_center_id || '',
        amount: entry.amount?.toString() || '',
        payment_method_id: entry.payment_method_id || '',
        bank_account_id: entry.bank_account_id || '',
        competence_date: new Date(entry.competence_date),
        due_date: new Date(entry.due_date),
        is_settled: entry.is_settled || false,
        settled_at: entry.settled_at ? new Date(entry.settled_at) : undefined,
        settled_payment_method_id: entry.settled_payment_method_id || '',
        description: entry.description || '',
        installment_type: "none",
      });
      
      setAmountDisplayValue(entry.amount ? formatCurrencyInput((entry.amount * 100).toString()) : '');
      setActiveTab("dados");
    };

    window.addEventListener('switch-to-dados-tab', handleSwitchToEditTab);
    return () => window.removeEventListener('switch-to-dados-tab', handleSwitchToEditTab);
  }, [form])

  const loadData = async () => {
    if (!organization?.currentOrg?.id) return

    try {
      setLoading(true)
      
      console.log("Loading data for organization:", organization?.currentOrg?.id)
      
        const [
        companiesResponse,
        customersResponse,
        suppliersResponse,
        chartResponse,
        costCentersResponse,
        paymentMethodsResponse,
        bankAccountsResponse
      ] = await Promise.all([
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
          .select(`
            *,
            chart_account_cost_centers!chart_account_cost_centers_chart_of_account_id_fkey(
              cost_center_id,
              cost_centers!chart_account_cost_centers_cost_center_id_fkey(id, code, name)
            )
          `)
          .eq("org_id", organization.currentOrg.id)
          .eq("is_active", true)
          .eq("account_type", "analytic"),
        
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
          .select(`
            *,
            companies (
              id,
              name
            )
          `)
          .eq("org_id", organization.currentOrg.id)
          .eq("is_active", true)
      ])

      if (companiesResponse.error) {
        console.error("Companies error:", companiesResponse.error)
        throw companiesResponse.error
      }
      if (customersResponse.error) {
        console.error("Customers error:", customersResponse.error)
        throw customersResponse.error
      }
      if (suppliersResponse.error) {
        console.error("Suppliers error:", suppliersResponse.error)
        throw suppliersResponse.error
      }
      if (chartResponse.error) throw chartResponse.error
      if (costCentersResponse.error) throw costCentersResponse.error
      if (paymentMethodsResponse.error) throw paymentMethodsResponse.error
      if (bankAccountsResponse.error) throw bankAccountsResponse.error

      console.log("Data loaded:", {
        companies: companiesResponse.data?.length || 0,
        customers: customersResponse.data?.length || 0,
        suppliers: suppliersResponse.data?.length || 0,
        chartOfAccounts: chartResponse.data?.length || 0,
        costCenters: costCentersResponse.data?.length || 0,
        paymentMethods: paymentMethodsResponse.data?.length || 0,
        bankAccounts: bankAccountsResponse.data?.length || 0,
      })
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
        entry_type: values.entry_type,
        person_id: values.person_id,
        chart_of_account_id: values.chart_of_account_id,
        cost_center_id: values.cost_center_id,
        amount: parseFloat(values.amount),
        due_date: values.due_date.toISOString().split('T')[0],
        competence_date: values.competence_date.toISOString().split('T')[0],
        company_id: values.company_id,
        payment_method_id: values.payment_method_id,
        bank_account_id: values.bank_account_id,
        description: values.description,
        person_type: values.entry_type === "receivable" ? "customer" : "supplier",
        is_settled: values.is_settled,
        settled_at: values.settled_at ? values.settled_at.toISOString().split('T')[0] : null,
        settled_payment_method_id: values.settled_payment_method_id,
      }

      if (editingEntry) {
        // Update existing entry
        const { error } = await supabase
          .from('financial_entries')
          .update(entryData)
          .eq('id', editingEntry.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Lançamento atualizado com sucesso",
        })
      } else {
        // Create new entry
        await createEntry(entryData)

        toast({
          title: "Sucesso",
          description: "Lançamento criado com sucesso",
        })
      }

      form.reset()
      setAmountDisplayValue("")
      setEditingEntry(null)
      loadData()
      loadEntries()
      setActiveTab("listagem")
    } catch (error) {
      console.error("Error saving entry:", error)
      toast({
        title: "Erro",
        description: editingEntry ? "Erro ao atualizar lançamento" : "Erro ao criar lançamento",
        variant: "destructive",
      })
    }
  }

  // Function to get available cost centers based on selected account
  const getAvailableCostCenters = () => {
    const selectedAccountId = form.watch("chart_of_account_id")
    
    if (!selectedAccountId) {
      return costCenters
    }

    const selectedAccount = chartOfAccounts.find(acc => acc.id === selectedAccountId)
    
    // If account has pre-associated cost centers, only show those
    if (selectedAccount?.chart_account_cost_centers && selectedAccount.chart_account_cost_centers.length > 0) {
      return selectedAccount.chart_account_cost_centers.map((cacc: any) => cacc.cost_centers)
    }
    
    // Otherwise, show all active cost centers
    return costCenters
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

  // Currency formatting functions
  const formatCurrencyInput = (value: string) => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/\D/g, "")
    
    if (!numericValue) return ""
    
    // Convert to number and format as currency
    const numberValue = parseInt(numericValue, 10) / 100
    
    return numberValue.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const parseCurrencyValue = (formattedValue: string) => {
    if (!formattedValue) return 0
    
    // Remove currency formatting and convert to number
    const numericString = formattedValue.replace(/\./g, "").replace(",", ".")
    return parseFloat(numericString) || 0
  }

  const handleAmountChange = (value: string) => {
    const formatted = formatCurrencyInput(value)
    setAmountDisplayValue(formatted)
    
    // Update form with numeric value
    const numericValue = parseCurrencyValue(formatted)
    form.setValue("amount", numericValue.toString())
  }


  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy')
  }

  if (loading || entriesLoading) {
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
    <div className="page-container w-full h-full min-h-screen space-y-6 -m-3 sm:-m-4 lg:-m-6 p-3 sm:p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lançamentos Financeiros</h1>
          <p className="text-muted-foreground">
            Gerencie contas a receber e contas a pagar
          </p>
          {!loading && (
            <div className="text-sm text-muted-foreground mt-1">
              {companies.length} empresas • {customers.length} clientes • {suppliers.length} fornecedores
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            console.log("Debug data:", { companies, customers, suppliers, chartOfAccounts, costCenters })
          }}>
            Debug
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setEditingEntry(null);
              form.reset();
              setAmountDisplayValue("");
              setActiveTab("dados");
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="listagem">Listagem</TabsTrigger>
          <TabsTrigger value="pagamentos" disabled>Pagamentos</TabsTrigger>
          <TabsTrigger value="arquivos" disabled>Arquivos</TabsTrigger>
          <TabsTrigger value="historico" disabled>Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="space-y-6">
          {/* Full Width Form Section */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle>
                {editingEntry ? "Editar Lançamento" : "Novo Lançamento"}
              </CardTitle>
              <CardDescription>
                {editingEntry 
                  ? "Edite os dados do lançamento financeiro"
                  : "Preencha os dados para criar um novo lançamento financeiro"
                }
              </CardDescription>
              {loading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent animate-spin rounded-full"></div>
                  Carregando dados...
                </div>
              )}
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Company and Entry Type Section */}
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-semibold mb-4">Dados da Empresa</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Campo Código - não editável */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Código</label>
                        <Input
                          value={editingEntry?.entry_code || "Automático"}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                          Gerado automaticamente
                        </p>
                      </div>

                      <FormField
                        control={form.control}
                        name="entry_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Lançamento *</FormLabel>
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
                            <FormLabel>Sua Empresa *</FormLabel>
                            <Popover open={companySearchOpen} onOpenChange={setCompanySearchOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={companySearchOpen}
                                    className={cn(
                                      "w-full justify-between",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value
                                      ? companies.find((company) => company.id === field.value)?.name
                                      : "Selecione a empresa"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0 z-50 bg-background">
                                <Command>
                                  <CommandInput 
                                    placeholder="Buscar empresa..." 
                                    value={companySearchValue}
                                    onValueChange={setCompanySearchValue}
                                  />
                                  <CommandList>
                                    <CommandEmpty>
                                      {companies.length === 0 
                                        ? "Nenhuma empresa cadastrada. Cadastre em Configurações → Empresas."
                                        : "Nenhuma empresa encontrada."
                                      }
                                    </CommandEmpty>
                                    <CommandGroup>
                                      {companies.map((company) => (
                                        <CommandItem
                                          key={company.id}
                                          value={company.name}
                                          onSelect={() => {
                                            field.onChange(company.id)
                                            setCompanySearchValue("")
                                            setCompanySearchOpen(false)
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              field.value === company.id ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          {company.name}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            {companies.length === 0 && (
                              <p className="text-xs text-muted-foreground">
                                Nenhuma empresa cadastrada. Cadastre em Configurações → Empresas.
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="person_id"
                        render={({ field }) => {
                          const isReceivable = form.watch("entry_type") === "receivable"
                          const people = isReceivable ? customers : suppliers
                          const personType = isReceivable ? "cliente" : "fornecedor"
                          const searchOpen = isReceivable ? customerSearchOpen : supplierSearchOpen
                          const setSearchOpen = isReceivable ? setCustomerSearchOpen : setSupplierSearchOpen
                          const searchValue = isReceivable ? customerSearchValue : supplierSearchValue
                          const setSearchValue = isReceivable ? setCustomerSearchValue : setSupplierSearchValue
                          
                          return (
                            <FormItem>
                              <FormLabel>
                                {isReceivable ? "Cliente *" : "Fornecedor *"}
                              </FormLabel>
                              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={searchOpen}
                                      className={cn(
                                        "w-full justify-between",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value
                                        ? people.find((person) => person.id === field.value)?.name
                                        : `Selecione o ${personType}`}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0 z-50 bg-background">
                                  <Command>
                                    <CommandInput 
                                      placeholder={`Buscar ${personType}...`}
                                      value={searchValue}
                                      onValueChange={setSearchValue}
                                    />
                                    <CommandList>
                                      <CommandEmpty>
                                        {people.length === 0 
                                          ? `Nenhum ${personType} cadastrado.`
                                          : `Nenhum ${personType} encontrado.`
                                        }
                                      </CommandEmpty>
                                      <CommandGroup>
                                        {people.map((person) => (
                                          <CommandItem
                                            key={person.id}
                                            value={person.name}
                                            onSelect={() => {
                                              field.onChange(person.id)
                                              setSearchValue("")
                                              setSearchOpen(false)
                                            }}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                field.value === person.id ? "opacity-100" : "opacity-0"
                                              )}
                                            />
                                            {person.name}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              {people.length === 0 && (
                                <p className="text-xs text-muted-foreground">
                                  Configure {isReceivable ? "clientes" : "fornecedores"} em {isReceivable ? "Clientes" : "Fornecedores"}
                                </p>
                              )}
                              <FormMessage />
                            </FormItem>
                          )
                        }}
                      />
                    </div>
                  </div>

                  {/* Financial Data Section */}
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-semibold mb-4">Dados Financeiros</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="chart_of_account_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Plano de Conta *</FormLabel>
                            <Popover open={chartAccountSearchOpen} onOpenChange={setChartAccountSearchOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={chartAccountSearchOpen}
                                    className={cn(
                                      "w-full justify-between",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value
                                      ? (() => {
                                          const account = chartOfAccounts.find((acc) => acc.id === field.value)
                                          return account ? `${account.account_code} - ${account.account_name}` : "Selecione o plano de conta"
                                        })()
                                      : "Selecione o plano de conta"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0 z-50 bg-background">
                                <Command>
                                  <CommandInput 
                                    placeholder="Buscar plano de conta..." 
                                    value={chartAccountSearchValue}
                                    onValueChange={setChartAccountSearchValue}
                                  />
                                  <CommandList>
                                    <CommandEmpty>
                                      {chartOfAccounts.length === 0 
                                        ? "Nenhum plano de conta cadastrado."
                                        : "Nenhum plano de conta encontrado."
                                      }
                                    </CommandEmpty>
                                    <CommandGroup>
                                      {chartOfAccounts.map((account) => (
                                        <CommandItem
                                          key={account.id}
                                          value={`${account.account_code} ${account.account_name}`}
                                          onSelect={() => {
                                            field.onChange(account.id)
                                            setChartAccountSearchValue("")
                                            setChartAccountSearchOpen(false)
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              field.value === account.id ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          <div className="flex flex-col">
                                            <span className="font-medium">{account.account_code}</span>
                                            <span className="text-sm text-muted-foreground">{account.account_name}</span>
                                          </div>
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

                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor (R$) *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="0,00"
                                value={amountDisplayValue}
                                onChange={(e) => handleAmountChange(e.target.value)}
                                onPaste={(e) => {
                                  e.preventDefault()
                                  const pastedText = e.clipboardData.getData("text")
                                  handleAmountChange(pastedText)
                                }}
                                className="text-right"
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
                              Digite apenas números. Ex: 250000 = R$ 2.500,00
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Dates and Status Section */}
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-semibold mb-4">Vencimentos e Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="competence_date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Data da Competência *</FormLabel>
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
                            <FormLabel>Data do Vencimento *</FormLabel>
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
                        name="is_settled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4">
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
                    </div>
                  </div>

                  {/* Mostrar Mais Campos Section */}
                  <Collapsible open={showMoreFields} onOpenChange={setShowMoreFields}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between">
                        Mostrar Mais Campos
                        {showMoreFields ? <ChevronUp /> : <ChevronDown />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-6 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="cost_center_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Centro de Custo * <span className="text-xs text-muted-foreground">(obrigatório)</span></FormLabel>
                              <Popover open={costCenterSearchOpen} onOpenChange={setCostCenterSearchOpen}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={costCenterSearchOpen}
                                      className={cn(
                                        "w-full justify-between",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value
                                        ? (() => {
                                            const center = getAvailableCostCenters().find((center) => center.id === field.value)
                                            return center ? `${center.code} - ${center.name}` : "Selecione o centro de custo"
                                          })()
                                        : "Selecione o centro de custo"}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0 z-50 bg-background">
                                  <Command>
                                    <CommandInput 
                                      placeholder="Buscar centro de custo..." 
                                      value={costCenterSearchValue}
                                      onValueChange={setCostCenterSearchValue}
                                    />
                                    <CommandList>
                                      <CommandEmpty>
                                        {getAvailableCostCenters().length === 0 
                                          ? "Nenhum centro de custo disponível."
                                          : "Nenhum centro de custo encontrado."
                                        }
                                      </CommandEmpty>
                                      <CommandGroup>
                                        {getAvailableCostCenters().map((center) => (
                                          <CommandItem
                                            key={center.id}
                                            value={`${center.code} ${center.name}`}
                                            onSelect={() => {
                                              field.onChange(center.id)
                                              setCostCenterSearchValue("")
                                              setCostCenterSearchOpen(false)
                                            }}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                field.value === center.id ? "opacity-100" : "opacity-0"
                                              )}
                                            />
                                            <div className="flex flex-col">
                                              <span className="font-medium">{center.code}</span>
                                              <span className="text-sm text-muted-foreground">{center.name}</span>
                                            </div>
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

                        <FormField
                          control={form.control}
                          name="group_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Grupo</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ex: Vendas, Marketing, Operacional"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="document_number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Documento</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Número do documento"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

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
                                      {getFormattedAccountName(account)}
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
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Parcelamento e Recorrência Section */}
                  <Collapsible open={showInstallments} onOpenChange={setShowInstallments}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between">
                        Parcelamento e Recorrência
                        {showInstallments ? <ChevronUp /> : <ChevronDown />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-6 pt-4">
                      <FormField
                        control={form.control}
                        name="installment_type"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Tipo de Parcelamento</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-col space-y-2"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="none" id="none" />
                                  <FormLabel htmlFor="none" className="font-normal">
                                    Não parcelar
                                  </FormLabel>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="manual" id="manual" />
                                  <FormLabel htmlFor="manual" className="font-normal">
                                    Configurar manualmente
                                  </FormLabel>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="automatic" id="automatic" />
                                  <FormLabel htmlFor="automatic" className="font-normal">
                                    Parcelamento automático
                                  </FormLabel>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="recurring" id="recurring" />
                                  <FormLabel htmlFor="recurring" className="font-normal">
                                    Recorrência automática
                                  </FormLabel>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch("installment_type") !== "none" && form.watch("installment_type") && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="installment_count"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Número de Parcelas</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="2"
                                    max="100"
                                    placeholder="Ex: 12"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="installment_interval"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Intervalo</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione o intervalo" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="monthly">Mensal</SelectItem>
                                    <SelectItem value="quarterly">Trimestral</SelectItem>
                                    <SelectItem value="semiannual">Semestral</SelectItem>
                                    <SelectItem value="annual">Anual</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Sticky Action Bar */}
                  <div className="sticky bottom-0 bg-background border-t pt-4 mt-6">
                    <div className="flex gap-3 justify-end">
                      <Button type="button" variant="outline">
                        Cancelar
                      </Button>
                      <Button type="button" variant="outline">
                        Voltar
                      </Button>
                      <Button type="submit">
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Lançamento
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Recent Entries List */}
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
        </TabsContent>

        <TabsContent value="listagem" className="space-y-6">
          <FinancialListingTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
