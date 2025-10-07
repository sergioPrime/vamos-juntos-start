import { useState, useEffect } from "react"
import { User, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { supabase } from "@/integrations/supabase/client"
import { useOrganization } from "@/hooks/useOrganization"

interface Customer {
  id: string
  name: string
  document?: string
  phone?: string
  email?: string
}

interface CustomerSelectorProps {
  selectedCustomer: Customer | null
  onCustomerChange: (customer: Customer | null) => void
}

export const CustomerSelector = ({ selectedCustomer, onCustomerChange }: CustomerSelectorProps) => {
  const { currentOrg } = useOrganization()
  const [searchTerm, setSearchTerm] = useState("")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchCustomers()
    } else {
      setCustomers([])
    }
  }, [searchTerm])

  const searchCustomers = async () => {
    if (!currentOrg?.id) return

    try {
      const { data, error } = await supabase
        .from('pessoas')
        .select('id, nome_fantasia, documento, telefone_celular, email_geral')
        .eq('org_id', currentOrg.id)
        .eq('ativo', true)
        .or(`nome_fantasia.ilike.%${searchTerm}%,documento.ilike.%${searchTerm}%`)
        .limit(10)

      if (error) throw error
      const mappedData = data?.map(p => ({
        id: p.id,
        name: p.nome_fantasia || '',
        document: p.documento,
        phone: p.telefone_celular,
        email: p.email_geral
      })) || []
      setCustomers(mappedData)
      setShowSuggestions(true)
    } catch (error) {
      console.error('Error searching customers:', error)
    }
  }

  const selectCustomer = (customer: Customer) => {
    onCustomerChange(customer)
    setSearchTerm(customer.name)
    setShowSuggestions(false)
  }

  const clearCustomer = () => {
    onCustomerChange(null)
    setSearchTerm("")
  }

  return (
    <div className="space-y-2 relative">
      <Label className="flex items-center gap-2">
        <User className="h-4 w-4" />
        Cliente (F3)
      </Label>
      <div className="relative">
        <Input
          placeholder="Digite para buscar cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
          className="pr-8"
        />
        <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      {showSuggestions && customers.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-auto shadow-lg">
          <div className="divide-y">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="p-3 hover:bg-accent cursor-pointer transition-colors"
                onClick={() => selectCustomer(customer)}
              >
                <div className="font-medium">{customer.name}</div>
                <div className="text-sm text-muted-foreground">
                  {customer.document && `CPF/CNPJ: ${customer.document}`}
                  {customer.phone && ` • ${customer.phone}`}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {selectedCustomer && (
        <Card className="p-3 bg-accent/50">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-medium">{selectedCustomer.name}</div>
              <div className="text-sm text-muted-foreground">
                {selectedCustomer.document && `CPF/CNPJ: ${selectedCustomer.document}`}
                {selectedCustomer.phone && ` • Tel: ${selectedCustomer.phone}`}
              </div>
            </div>
            <button
              onClick={clearCustomer}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
        </Card>
      )}
    </div>
  )
}
