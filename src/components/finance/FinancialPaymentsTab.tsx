import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CalendarIcon, Trash2, Edit, Printer, MessageSquare } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const paymentSchema = z.object({
  valor: z.string().min(1, "Valor é obrigatório"),
  multa: z.string().optional(),
  juros: z.string().optional(),
  data_pagamento: z.date(),
  payment_method_id: z.string().optional(),
  bank_account_id: z.string().optional(),
  documento: z.string().optional(),
})

interface Payment {
  id: string
  valor: number
  multa: number
  juros: number
  data_pagamento: string
  payment_method_id?: string
  payment_method_name?: string
  bank_account_id?: string
  bank_account_name?: string
  documento?: string
  total: number
  is_conciliated: boolean
}

interface FinancialPaymentsTabProps {
  selectedEntryId: string | null
}

export function FinancialPaymentsTab({ selectedEntryId }: FinancialPaymentsTabProps) {
  const organization = useOrganization()
  const { toast } = useToast()
  
  const [quitarLancamento, setQuitarLancamento] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [entryData, setEntryData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null)
  
  const [valorDisplay, setValorDisplay] = useState("")
  const [multaDisplay, setMultaDisplay] = useState("")
  const [jurosDisplay, setJurosDisplay] = useState("")
  
  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      valor: "",
      multa: "0",
      juros: "0",
      data_pagamento: new Date(),
      documento: "",
    },
  })

  useEffect(() => {
    if (organization?.currentOrg?.id && selectedEntryId) {
      void loadData()
      void loadPayments()
    }
  }, [organization, selectedEntryId])

  useEffect(() => {
    if (quitarLancamento && entryData) {
      const valorFormatado = formatCurrencyInput((entryData.amount * 100).toString())
      setValorDisplay(valorFormatado)
      form.setValue("valor", entryData.amount.toString())
    }
  }, [quitarLancamento, entryData, form])

  const loadData = async () => {
    if (!organization?.currentOrg?.id || !selectedEntryId) return

    try {
      setLoading(true)

      // @ts-ignore - Avoiding deep type instantiation error
      const entryResponse: any = await supabase
        .from("financial_entries")
        .select("*")
        .eq("id", selectedEntryId)
        .maybeSingle()

      if (entryResponse.error) throw entryResponse.error
      setEntryData(entryResponse.data)

      // @ts-ignore - Avoiding deep type instantiation error
      const methodsResponse: any = await supabase
        .from("payment_methods")
        .select("id, name")
        .eq("org_id", organization.currentOrg.id)
        .eq("active", true)

      if (methodsResponse.error) throw methodsResponse.error
      setPaymentMethods(methodsResponse.data || [])

      // @ts-ignore - Avoiding deep type instantiation error
      const accountsResponse: any = await supabase
        .from("bank_accounts")
        .select("id, bank_name, account_number")
        .eq("org_id", organization.currentOrg.id)
        .eq("is_active", true)

      if (accountsResponse.error) throw accountsResponse.error
      setBankAccounts(accountsResponse.data || [])

    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do lançamento",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadPayments = async () => {
    if (!selectedEntryId) return

    try {
      // @ts-ignore - Avoiding deep type instantiation error
      const paymentsResponse: any = await supabase
        .from("financial_entry_payments")
        .select("*")
        .eq("entry_id", selectedEntryId)
        .order("data_pagamento", { ascending: false })

      if (paymentsResponse.error) throw paymentsResponse.error

      const paymentsWithData = await Promise.all((paymentsResponse.data || []).map(async (payment: any) => {
        let paymentMethodName
        let bankAccountName

        if (payment.payment_method_id) {
          // @ts-ignore - Avoiding deep type instantiation error
          const pmResponse: any = await supabase
            .from("payment_methods")
            .select("name")
            .eq("id", payment.payment_method_id)
            .maybeSingle()
          paymentMethodName = pmResponse.data?.name
        }

        if (payment.bank_account_id) {
          // @ts-ignore - Avoiding deep type instantiation error
          const baResponse: any = await supabase
            .from("bank_accounts")
            .select("bank_name, account_number")
            .eq("id", payment.bank_account_id)
            .maybeSingle()
          bankAccountName = baResponse.data ? `${baResponse.data.bank_name} - ${baResponse.data.account_number}` : undefined
        }

        return { ...payment, paymentMethodName, bankAccountName }
      }))

      const formattedPayments = paymentsWithData.map((payment: any) => ({
        id: payment.id,
        valor: payment.valor || 0,
        multa: payment.multa || 0,
        juros: payment.juros || 0,
        data_pagamento: payment.data_pagamento,
        payment_method_id: payment.payment_method_id,
        payment_method_name: payment.paymentMethodName,
        bank_account_id: payment.bank_account_id,
        bank_account_name: payment.bankAccountName,
        documento: payment.documento,
        total: (payment.valor || 0) + (payment.multa || 0) + (payment.juros || 0),
        is_conciliated: payment.is_conciliated || false,
      }))

      setPayments(formattedPayments)
    } catch (error) {
      console.error("Error loading payments:", error)
    }
  }

  const formatCurrencyInput = (value: string) => {
    const numericValue = value.replace(/\D/g, "")
    if (!numericValue) return ""
    const numberValue = parseInt(numericValue, 10) / 100
    return numberValue.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const parseCurrencyValue = (formattedValue: string) => {
    if (!formattedValue) return 0
    const numericString = formattedValue.replace(/\./g, "").replace(",", ".")
    return parseFloat(numericString) || 0
  }

  const handleValorChange = (value: string) => {
    const formatted = formatCurrencyInput(value)
    setValorDisplay(formatted)
    const numericValue = parseCurrencyValue(formatted)
    form.setValue("valor", numericValue.toString())
  }

  const handleMultaChange = (value: string) => {
    const formatted = formatCurrencyInput(value)
    setMultaDisplay(formatted)
    const numericValue = parseCurrencyValue(formatted)
    form.setValue("multa", numericValue.toString())
  }

  const handleJurosChange = (value: string) => {
    const formatted = formatCurrencyInput(value)
    setJurosDisplay(formatted)
    const numericValue = parseCurrencyValue(formatted)
    form.setValue("juros", numericValue.toString())
  }

  const calculateTotal = () => {
    const valor = parseCurrencyValue(valorDisplay)
    const multa = parseCurrencyValue(multaDisplay)
    const juros = parseCurrencyValue(jurosDisplay)
    return valor + multa + juros
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const onSubmit = async (values: z.infer<typeof paymentSchema>) => {
    if (!organization?.currentOrg?.id || !selectedEntryId) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const paymentData = {
        entry_id: selectedEntryId,
        org_id: organization.currentOrg.id,
        valor: parseFloat(values.valor),
        multa: values.multa ? parseFloat(values.multa) : 0,
        juros: values.juros ? parseFloat(values.juros) : 0,
        data_pagamento: values.data_pagamento.toISOString().split('T')[0],
        payment_method_id: values.payment_method_id || null,
        bank_account_id: values.bank_account_id || null,
        documento: values.documento || null,
        is_conciliated: false,
        created_by: user?.id,
      }

      if (editingPayment) {
        const { error } = await supabase
          .from("financial_entry_payments")
          .update(paymentData)
          .eq("id", editingPayment.id)

        if (error) throw error

        toast({
          title: "Sucesso",
          description: "Pagamento atualizado com sucesso",
        })
      } else {
        const { error } = await supabase
          .from("financial_entry_payments")
          .insert([paymentData])

        if (error) throw error

        toast({
          title: "Sucesso",
          description: "Pagamento registrado com sucesso",
        })
      }

      await checkAndUpdateEntryStatus()

      form.reset({
        valor: "",
        multa: "0",
        juros: "0",
        data_pagamento: new Date(),
        documento: "",
      })
      setValorDisplay("")
      setMultaDisplay("")
      setJurosDisplay("")
      setEditingPayment(null)
      setQuitarLancamento(false)
      void loadPayments()
      void loadData()
    } catch (error) {
      console.error("Error saving payment:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar pagamento",
        variant: "destructive",
      })
    }
  }

  const checkAndUpdateEntryStatus = async () => {
    if (!selectedEntryId || !entryData) return

    try {
      // @ts-ignore - Avoiding deep type instantiation error
      const paymentsResponse: any = await supabase
        .from("financial_entry_payments")
        .select("valor, multa, juros")
        .eq("entry_id", selectedEntryId)

      if (paymentsResponse.error) throw paymentsResponse.error

      const totalPaid = (paymentsResponse.data || []).reduce((sum: number, payment: any) => {
        return sum + (payment.valor || 0) + (payment.multa || 0) + (payment.juros || 0)
      }, 0)

      if (totalPaid >= entryData.amount) {
        await supabase
          .from("financial_entries")
          .update({ 
            is_settled: true,
            settled_at: new Date().toISOString()
          })
          .eq("id", selectedEntryId)
      }
    } catch (error) {
      console.error("Error checking entry status:", error)
    }
  }

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment)
    setQuitarLancamento(true)
    
    const valorFormatado = formatCurrencyInput((payment.valor * 100).toString())
    const multaFormatado = formatCurrencyInput((payment.multa * 100).toString())
    const jurosFormatado = formatCurrencyInput((payment.juros * 100).toString())
    
    setValorDisplay(valorFormatado)
    setMultaDisplay(multaFormatado)
    setJurosDisplay(jurosFormatado)
    
    form.reset({
      valor: payment.valor.toString(),
      multa: payment.multa.toString(),
      juros: payment.juros.toString(),
      data_pagamento: new Date(payment.data_pagamento),
      payment_method_id: payment.payment_method_id || "",
      bank_account_id: payment.bank_account_id || "",
      documento: payment.documento || "",
    })
  }

  const handleDelete = async () => {
    if (!paymentToDelete) return

    try {
      const { error } = await supabase
        .from("financial_entry_payments")
        .delete()
        .eq("id", paymentToDelete.id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Pagamento excluído com sucesso",
      })

      void loadPayments()
      void loadData()
    } catch (error) {
      console.error("Error deleting payment:", error)
      toast({
        title: "Erro",
        description: "Erro ao excluir pagamento",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setPaymentToDelete(null)
    }
  }

  const handlePrint = (payment: Payment) => {
    toast({
      title: "Imprimir",
      description: "Funcionalidade de impressão em desenvolvimento",
    })
  }

  if (!selectedEntryId) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <p>Selecione um lançamento na aba "Listagem" para gerenciar seus pagamentos</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Pagamentos</CardTitle>
          <CardDescription>
            Lançamento: {entryData?.entry_code ? `#${entryData.entry_code}` : selectedEntryId.substring(0, 8)}
            {entryData && ` - ${formatCurrency(entryData.amount)}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-3">
            <Switch
              checked={quitarLancamento}
              onCheckedChange={setQuitarLancamento}
              id="quitar-lancamento"
            />
            <label
              htmlFor="quitar-lancamento"
              className="text-base font-semibold cursor-pointer"
            >
              Quitar Lançamento
            </label>
          </div>

          {quitarLancamento && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="valor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor (R$)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0,00"
                            value={valorDisplay}
                            onChange={(e) => handleValorChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="multa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Multa (R$)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0,00"
                            value={multaDisplay}
                            onChange={(e) => handleMultaChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="juros"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Juros (R$)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0,00"
                            value={jurosDisplay}
                            onChange={(e) => handleJurosChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="data_pagamento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy")
                                ) : (
                                  <span>Selecione</span>
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
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="payment_method_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forma de Pagamento</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
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
                    name="documento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Documento</FormLabel>
                        <FormControl>
                          <Input placeholder="Número do documento" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <FormLabel>Total (R$)</FormLabel>
                    <div className="mt-2">
                      <Input
                        value={formatCurrency(calculateTotal())}
                        readOnly
                        className="bg-muted text-lg font-semibold"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="mt-6"
                    disabled={!form.formState.isValid}
                  >
                    {editingPayment ? "Atualizar" : "Confirmar"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pagamentos Relacionados ao Lançamento</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum pagamento registrado para este lançamento</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Valor</th>
                    <th className="text-left p-3 font-semibold">Multa</th>
                    <th className="text-left p-3 font-semibold">Juros</th>
                    <th className="text-left p-3 font-semibold">Data Pagamento</th>
                    <th className="text-left p-3 font-semibold">Forma de Pagamento</th>
                    <th className="text-left p-3 font-semibold">Conta Bancária</th>
                    <th className="text-left p-3 font-semibold">Documento</th>
                    <th className="text-left p-3 font-semibold">Total</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                    <th className="text-right p-3 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">{formatCurrency(payment.valor)}</td>
                      <td className="p-3">{formatCurrency(payment.multa)}</td>
                      <td className="p-3">{formatCurrency(payment.juros)}</td>
                      <td className="p-3">{format(new Date(payment.data_pagamento), "dd/MM/yyyy")}</td>
                      <td className="p-3">{payment.payment_method_name || "-"}</td>
                      <td className="p-3">{payment.bank_account_name || "-"}</td>
                      <td className="p-3">{payment.documento || "-"}</td>
                      <td className="p-3 font-semibold">{formatCurrency(payment.total)}</td>
                      <td className="p-3">
                        <Badge variant={payment.is_conciliated ? "default" : "secondary"}>
                          {payment.is_conciliated ? "Conciliado" : "Não Conciliado"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(payment)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setPaymentToDelete(payment)
                              setDeleteDialogOpen(true)
                            }}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePrint(payment)}
                            title="Imprimir"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" disabled title="WhatsApp (em desenvolvimento)">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este pagamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
