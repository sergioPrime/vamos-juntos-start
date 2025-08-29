import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Search, Phone, Mail, Calendar, DollarSign, FileText, Plus, Eye } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { ResponsiveTable } from "@/components/ui/responsive-table"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

const mockCustomers = [
  { 
    id: 1, 
    name: "João Silva", 
    phone: "(11) 99999-9999", 
    email: "joao@email.com",
    lastInteraction: "2024-01-15", 
    tags: ["VIP", "Desenvolvimento"],
    totalSpent: "R$ 8.500,00",
    services: [
      { date: "2024-01-15", service: "Website corporativo", value: "R$ 3.500,00", status: "completed" },
      { date: "2024-01-10", service: "Sistema de vendas", value: "R$ 5.000,00", status: "completed" }
    ]
  },
  { 
    id: 2, 
    name: "Maria Santos", 
    phone: "(11) 88888-8888", 
    email: "maria@email.com",
    lastInteraction: "2024-01-20", 
    tags: ["Marketing"],
    totalSpent: "R$ 2.200,00",
    services: [
      { date: "2024-01-20", service: "Consultoria em marketing", value: "R$ 1.200,00", status: "completed" },
      { date: "2024-01-05", service: "Logo e identidade visual", value: "R$ 1.000,00", status: "completed" }
    ]
  },
  { 
    id: 3, 
    name: "Empresa ABC", 
    phone: "(11) 77777-7777", 
    email: "contato@empresaabc.com",
    lastInteraction: "2024-01-25", 
    tags: ["Corporativo", "Sistema"],
    totalSpent: "R$ 15.000,00",
    services: [
      { date: "2024-01-25", service: "Sistema de gestão completo", value: "R$ 15.000,00", status: "in_progress" }
    ]
  },
]

export default function Customers() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [visibleItems, setVisibleItems] = useState<number[]>([])
  
  // New customer form states
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    document: ""
  })

  // Load customers from database
  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setCustomers(data || [])
    } catch (error) {
      console.error('Error loading customers:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os clientes",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  // Staggered animation for customer list
  useEffect(() => {
    const timer = setTimeout(() => {
      customers.forEach((_, index) => {
        setTimeout(() => {
          setVisibleItems(prev => [...prev, index])
        }, index * 100) // 0.1s delay between each item
      })
    }, 200) // Initial delay

    return () => clearTimeout(timer)
  }, [customers])

  const getServiceStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success/20 text-success border-success/30">Concluído</Badge>
      case "in_progress":
        return <Badge className="bg-primary/20 text-primary border-primary/30">Em Andamento</Badge>
      case "pending":
        return <Badge className="bg-warning/20 text-warning border-warning/30">Pendente</Badge>
      default:
        return <Badge>-</Badge>
    }
  }

  const handleCustomerClick = (customer: any) => {
    setSelectedCustomer(customer)
  }

  const handleSaveCustomer = async () => {
    if (!newCustomer.name.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o nome do cliente",
        variant: "destructive"
      })
      return
    }
    
    try {
      const { error } = await supabase
        .from('customers')
        .insert([{
          name: newCustomer.name,
          phone: newCustomer.phone,
          email: newCustomer.email,
          document: newCustomer.document,
          tags: [],
          total_spent: 0,
          last_interaction: new Date().toISOString()
        }])
      
      if (error) throw error
      
      // Reset form and close dialog
      setNewCustomer({
        name: "",
        phone: "",
        email: "",
        document: ""
      })
      setShowNewCustomer(false)
      
      // Reload customers list
      await loadCustomers()
      
      toast({
        title: "Sucesso!",
        description: "Cliente salvo com sucesso!"
      })
    } catch (error) {
      console.error('Error saving customer:', error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar o cliente",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Back Navigation */}
      <div className="flex items-center gap-2 sm:gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="p-1 sm:p-2 hover:bg-accent"
          size="sm"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">Seus clientes especiais 👥</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Relacionamentos que geram resultados</p>
        </div>
      </div>

      {/* New Customer Button */}
      <div className="flex justify-center sm:justify-end">
        <Button 
          onClick={() => setShowNewCustomer(true)} 
          className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Customers List */}
      <Card>
        <CardHeader>
          <div className="p-3 sm:p-0">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Carregando clientes...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Nenhum cliente encontrado. Que tal adicionar o primeiro?</p>
            </div>
          ) : (
            <ResponsiveTable>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Gasto Total</TableHead>
                    <TableHead>Última Interação</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers
                    .filter(customer => 
                      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((customer, index) => (
                      <TableRow 
                        key={customer.id} 
                        className={`cursor-pointer hover:bg-accent/50 transition-all duration-300 ${
                          visibleItems.includes(index) 
                            ? 'opacity-100 translate-y-0' 
                            : 'opacity-0 translate-y-4'
                        }`}
                        style={{
                          transitionDelay: visibleItems.includes(index) ? '0ms' : `${index * 100}ms`
                        }}
                        onClick={() => handleCustomerClick(customer)}
                      >
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.phone || '-'}</TableCell>
                        <TableCell className="font-medium">
                          R$ {customer.total_spent?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                        </TableCell>
                        <TableCell>
                          {customer.last_interaction ? new Date(customer.last_interaction).toLocaleDateString('pt-BR') : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {customer.tags?.map((tag: string) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            )) || <span className="text-muted-foreground text-sm">-</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleCustomerClick(customer); 
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </ResponsiveTable>
          )}
        </CardContent>
      </Card>

      {/* New Customer Dialog */}
      <Dialog open={showNewCustomer} onOpenChange={setShowNewCustomer}>
        <DialogContent className="mx-4 max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input 
                id="name"
                placeholder="Nome completo ou razão social" 
                value={newCustomer.name}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input 
                id="phone"
                placeholder="(11) 99999-9999" 
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email"
                type="email" 
                placeholder="cliente@email.com" 
                value={newCustomer.email}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="document">CPF/CNPJ</Label>
              <Input 
                id="document"
                placeholder="000.000.000-00" 
                value={newCustomer.document}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, document: e.target.value }))}
              />
            </div>
            
            <div className="pt-4 flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowNewCustomer(false)}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1"
                onClick={handleSaveCustomer}
              >
                Salvar Cliente
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Detail Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="mx-4 max-w-2xl sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCustomer?.name}</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Customer Info */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm sm:text-base">
                 <div className="flex items-center gap-2">
                   <Phone className="h-4 w-4 text-muted-foreground" />
                   <span>{selectedCustomer.phone || '-'}</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <Mail className="h-4 w-4 text-muted-foreground" />
                   <span>{selectedCustomer.email || '-'}</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <DollarSign className="h-4 w-4 text-muted-foreground" />
                   <span className="font-medium">
                     Total: R$ {selectedCustomer.total_spent?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                   </span>
                 </div>
                 <div className="flex items-center gap-2">
                   <Calendar className="h-4 w-4 text-muted-foreground" />
                   <span>
                     Última interação: {selectedCustomer.last_interaction ? 
                       new Date(selectedCustomer.last_interaction).toLocaleDateString('pt-BR') : '-'}
                   </span>
                 </div>
               </div>

              {/* Tags */}
               <div>
                 <Label className="text-sm font-medium">Tags</Label>
                 <div className="flex gap-2 mt-1">
                   {selectedCustomer.tags?.length > 0 ? 
                     selectedCustomer.tags.map((tag: string) => (
                       <Badge key={tag} variant="secondary">{tag}</Badge>
                     )) : 
                     <span className="text-muted-foreground text-sm">Nenhuma tag adicionada</span>
                   }
                 </div>
               </div>

              {/* Service History */}
               <div>
                 <Label className="text-sm font-medium">Histórico de Serviços</Label>
                 <div className="mt-2">
                   <div className="text-center p-4 text-muted-foreground">
                     <p>Histórico de serviços em desenvolvimento</p>
                     <p className="text-xs mt-1">Em breve você poderá visualizar todos os serviços prestados</p>
                   </div>
                 </div>
               </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button 
                  onClick={() => {
                    setSelectedCustomer(null)
                    navigate("/nfse")
                  }}
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Emitir Nota
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedCustomer(null)
                    navigate("/finance/receivables")
                  }}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Nova Cobrança
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}