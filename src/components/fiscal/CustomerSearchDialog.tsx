import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/integrations/supabase/client"
import { Search, Plus } from "lucide-react"
import { toast } from "sonner"

interface Customer {
  id: string
  razao_social: string
  documento: string
  email_geral: string | null
  telefones: string[] | null
  logradouro: string | null
  numero_endereco: string | null
  bairro: string | null
  cidade: string | null
  uf: string | null
  cep: string
}

interface CustomerSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectCustomer: (customer: Customer) => void
}

export function CustomerSearchDialog({
  open,
  onOpenChange,
  onSelectCustomer
}: CustomerSearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadCustomers()
    }
  }, [open])

  const loadCustomers = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('pessoas')
        .select('*')
        .eq('tipo', 'cliente')
        .eq('ativo', true)
        .order('nome')
        .limit(50)

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      toast.error('Erro ao carregar clientes')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.documento?.includes(searchTerm) ||
    customer.email_geral?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer)
    onOpenChange(false)
    setSearchTerm("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Buscar Cliente</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, documento ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="border rounded-lg overflow-auto max-h-[50vh]">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-muted-foreground">Carregando clientes...</div>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-muted-foreground">Nenhum cliente encontrado</div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Cidade/UF</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>{customer.razao_social}</TableCell>
                      <TableCell>{customer.documento || '-'}</TableCell>
                      <TableCell>
                        {customer.cidade && customer.uf 
                          ? `${customer.cidade}/${customer.uf}`
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleSelectCustomer(customer)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Selecionar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
