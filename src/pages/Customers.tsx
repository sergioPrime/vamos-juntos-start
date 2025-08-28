import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import { Plus, Search, Phone, Mail, Calendar, DollarSign, FileText } from "lucide-react"

const mockCustomers = [
  { 
    id: 1, 
    name: "João Silva", 
    phone: "(11) 99999-9999", 
    email: "joao@email.com",
    lastInteraction: "2024-01-15", 
    tags: ["VIP", "Desenvolvimento"] 
  },
  { 
    id: 2, 
    name: "Maria Santos", 
    phone: "(11) 88888-8888", 
    email: "maria@email.com",
    lastInteraction: "2024-01-20", 
    tags: ["Marketing"] 
  },
  { 
    id: 3, 
    name: "Empresa ABC", 
    phone: "(11) 77777-7777", 
    email: "contato@empresaabc.com",
    lastInteraction: "2024-01-25", 
    tags: ["Corporativo", "Sistema"] 
  },
]

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<typeof mockCustomers[0] | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Gerencie seus clientes e relacionamentos</p>
        </div>
        
        <Drawer>
          <DrawerTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Novo Cliente</DrawerTitle>
            </DrawerHeader>
            <div className="p-6 space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input placeholder="Nome completo ou razão social" />
              </div>
              
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input placeholder="(11) 99999-9999" />
              </div>
              
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input type="email" placeholder="cliente@email.com" />
              </div>
              
              <div>
                <Label htmlFor="document">CPF/CNPJ</Label>
                <Input placeholder="000.000.000-00" />
              </div>
              
              <div className="pt-4">
                <Button className="w-full">Salvar Cliente</Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
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
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Última Interação</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{new Date(customer.lastInteraction).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {customer.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Drawer>
                      <DrawerTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedCustomer(customer)}>
                          Ver Detalhes
                        </Button>
                      </DrawerTrigger>
                      <DrawerContent>
                        <DrawerHeader>
                          <DrawerTitle>{selectedCustomer?.name}</DrawerTitle>
                        </DrawerHeader>
                        {selectedCustomer && (
                          <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{selectedCustomer.phone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{selectedCustomer.email}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>Última interação: {new Date(selectedCustomer.lastInteraction).toLocaleDateString()}</span>
                            </div>

                            <div className="space-y-3">
                              <h3 className="font-semibold">Ações Rápidas</h3>
                              <div className="flex flex-col gap-2">
                                <Button variant="outline" className="justify-start">
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  Nova Cobrança
                                </Button>
                                <Button variant="outline" className="justify-start">
                                  <FileText className="h-4 w-4 mr-2" />
                                  Novo Orçamento
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </DrawerContent>
                    </Drawer>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}