import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Zap, Copy, QrCode, Check, Eye, Search, Filter } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { useNotifications } from "@/components/ui/notification-system"

const mockReceivables = [
  { id: 1, client: "João Silva", description: "Desenvolvimento de site", value: "R$ 2.500,00", dueDate: "2024-01-15", status: "pending" },
  { id: 2, client: "Maria Santos", description: "Consultoria em marketing", value: "R$ 1.200,00", dueDate: "2024-01-20", status: "paid" },
  { id: 3, client: "Empresa ABC", description: "Sistema de gestão", value: "R$ 5.000,00", dueDate: "2024-01-25", status: "overdue" },
]

export default function Receivables() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { addNotification } = useNotifications()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [showPixFlow, setShowPixFlow] = useState(false)
  const [pixCode, setPixCode] = useState("")
  const [animatingItems, setAnimatingItems] = useState<Set<number>>(new Set())

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-success/20 text-success border-success/30">Pago</Badge>
      case "pending":
        return <Badge className="bg-warning/20 text-warning border-warning/30">Pendente</Badge>
      case "overdue":
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Atrasado</Badge>
      default:
        return <Badge>-</Badge>
    }
  }

  const generatePixCode = () => {
    const randomCode = `00020126360014BR.GOV.BCB.PIX0114+5511999999999520400005303986540${Math.random().toString().slice(2,8)}.005802BR5925Nome do Recebedor6009SAO PAULO62070503***6304`
    setPixCode(randomCode)
  }

  const markAsPaid = (id: number) => {
    setAnimatingItems(prev => new Set(prev).add(id))
    
    setTimeout(() => {
      addNotification({
        type: 'success',
        title: '✅ Pagamento confirmado!',
        message: 'A cobrança foi marcada como paga.',
        duration: 4000
      })
      setAnimatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }, 400)
    
    setSelectedItem(null)
  }

  const handleRowClick = (item: any) => {
    setSelectedItem(item)
  }

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="p-2 hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bora cobrar? 💰</h1>
          <p className="text-muted-foreground">Seus recebimentos e cobranças</p>
        </div>
      </div>

      {/* Nova Cobrança Button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowPixFlow(true)} className="bg-primary hover:bg-primary/90">
          <Zap className="h-4 w-4 mr-2" />
          Nova Cobrança
        </Button>
      </div>

      {/* Search and Filters */}
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
                <TableRow 
                  key={item.id} 
                  className={`cursor-pointer hover:bg-accent/50 transition-all duration-300 ${
                    animatingItems.has(item.id) ? 'animate-slide-check' : ''
                  }`}
                  onClick={() => handleRowClick(item)}
                >
                  <TableCell className="font-medium">{item.client}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.value}</TableCell>
                  <TableCell>{new Date(item.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleRowClick(item); }}>
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      {item.status !== "paid" && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            markAsPaid(item.id); 
                          }}
                          className="relative"
                        >
                          {animatingItems.has(item.id) ? (
                            <Check className="h-3 w-3 mr-1 animate-check-bounce text-success" />
                          ) : (
                            <Check className="h-3 w-3 mr-1" />
                          )}
                          Marcar Pago
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* PIX Flow Dialog */}
      <Dialog open={showPixFlow} onOpenChange={setShowPixFlow}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Cobrança Pix</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
            
            {!pixCode ? (
              <Button onClick={generatePixCode} className="w-full bg-primary hover:bg-primary/90">
                <Zap className="h-4 w-4 mr-2" />
                Gerar Pix
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
                  <QrCode className="h-16 w-16 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Código PIX gerado!</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(pixCode)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copiar código
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Cobrança</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cliente</Label>
                  <p className="font-medium">{selectedItem.client}</p>
                </div>
                <div>
                  <Label>Valor</Label>
                  <p className="font-medium">{selectedItem.value}</p>
                </div>
                <div>
                  <Label>Vencimento</Label>
                  <p>{new Date(selectedItem.dueDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedItem.status)}</div>
                </div>
              </div>
              <div>
                <Label>Descrição</Label>
                <p>{selectedItem.description}</p>
              </div>
              
              {selectedItem.status !== "paid" && (
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => markAsPaid(selectedItem.id)}
                    className="bg-success hover:bg-success/90"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Marcar como Pago
                  </Button>
                  <Button variant="outline">
                    <Zap className="h-4 w-4 mr-2" />
                    Gerar novo Pix
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}