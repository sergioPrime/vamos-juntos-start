import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Filter } from "lucide-react"

const mockReceivables = [
  { id: 1, client: "João Silva", description: "Desenvolvimento de site", value: "R$ 2.500,00", dueDate: "2024-01-15", status: "pending" },
  { id: 2, client: "Maria Santos", description: "Consultoria em marketing", value: "R$ 1.200,00", dueDate: "2024-01-20", status: "paid" },
  { id: 3, client: "Empresa ABC", description: "Sistema de gestão", value: "R$ 5.000,00", dueDate: "2024-01-25", status: "overdue" },
]

export default function Receivables() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Pago</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendente</Badge>
      case "overdue":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Atrasado</Badge>
      default:
        return <Badge>-</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bora cobrar? 💰</h1>
          <p className="text-muted-foreground">Seus recebimentos e cobranças</p>
        </div>
        
        <Drawer>
          <DrawerTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Cobrança
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Nova Cobrança</DrawerTitle>
            </DrawerHeader>
            <div className="p-6 space-y-4">
              <div>
                <Label htmlFor="client">Cliente</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="joao">João Silva</SelectItem>
                    <SelectItem value="maria">Maria Santos</SelectItem>
                    <SelectItem value="empresa">Empresa ABC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="description">Descrição do Serviço</Label>
                <Input placeholder="Ex: Desenvolvimento de sistema" />
              </div>
              
              <div>
                <Label htmlFor="value">Valor</Label>
                <Input placeholder="R$ 0,00" />
              </div>
              
              <div>
                <Label htmlFor="dueDate">Vencimento</Label>
                <Input type="date" />
              </div>
              
              <div className="pt-4 space-y-2">
                <Button className="w-full">Gerar Pix</Button>
                <Button variant="outline" className="w-full">Salvar Cobrança</Button>
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
                placeholder="Buscar por cliente ou descrição"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="overdue">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockReceivables.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.client}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.value}</TableCell>
                  <TableCell>{new Date(item.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Ver</Button>
                      {item.status !== "paid" && (
                        <Button variant="outline" size="sm">Marcar Pago</Button>
                      )}
                    </div>
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