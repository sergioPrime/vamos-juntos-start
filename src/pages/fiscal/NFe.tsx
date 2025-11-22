import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, Search } from "lucide-react"
import NFeActionsMenu from "@/components/fiscal/NFeActionsMenu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface NFe {
  id: string
  numero: string
  serie: string
  cliente: string
  data_emissao: string
  valor_total: number
  status: "autorizada" | "cancelada" | "pendente" | "rejeitada"
  chave_acesso: string
}

export default function NFe() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("todos")
  const [dateFilter, setDateFilter] = useState<string>("todos")
  const [nfeList, setNfeList] = useState<NFe[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadNFes = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('nfe')
        .select(`
          id,
          numero,
          serie,
          data_emissao,
          valor_total,
          status,
          chave_acesso,
          pessoas!nfe_destinatario_id_fkey(nome)
        `)
        .order('data_emissao', { ascending: false })

      if (error) throw error

      const formattedData = data?.map(nfe => ({
        id: nfe.id,
        numero: nfe.numero?.toString() || '',
        serie: nfe.serie || '1',
        cliente: (nfe.pessoas as any)?.nome || 'Cliente não identificado',
        data_emissao: nfe.data_emissao,
        valor_total: nfe.valor_total || 0,
        status: nfe.status as NFe["status"],
        chave_acesso: nfe.chave_acesso || ''
      })) || []

      setNfeList(formattedData)
    } catch (error) {
      console.error('Erro ao carregar NFes:', error)
      toast.error('Erro ao carregar NFes')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadNFes()
  }, [])

  const getStatusBadge = (status: NFe["status"]) => {
    const variants = {
      autorizada: "default",
      cancelada: "destructive",
      pendente: "secondary",
      rejeitada: "destructive",
    }

    return (
      <Badge variant={variants[status] as any}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const filteredNFes = nfeList.filter((nfe) => {
    const matchesSearch =
      nfe.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nfe.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nfe.chave_acesso.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === "todos" || nfe.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="container-comfortable">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="title-xl flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              Notas Fiscais Eletrônicas (NFe)
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie suas notas fiscais modelo 55
            </p>
          </div>
          <Button
            onClick={() => navigate("/fiscal/nfe/new")}
            size="lg"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova NFe
          </Button>
        </div>

        {/* Filtros */}
        <Card className="bg-level-2">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por número, cliente ou chave de acesso..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="autorizada">Autorizada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="rejeitada">Rejeitada</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Períodos</SelectItem>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="semana">Esta Semana</SelectItem>
                  <SelectItem value="mes">Este Mês</SelectItem>
                  <SelectItem value="ano">Este Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Resumo rápido */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Total de Notas</p>
                <p className="text-2xl font-bold">{nfeList.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Autorizadas</p>
                <p className="text-2xl font-bold text-green-600">
                  {nfeList.filter((n) => n.status === "autorizada").length}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {nfeList.filter((n) => n.status === "pendente").length}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold font-mono">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(
                    nfeList
                      .filter((n) => n.status === "autorizada")
                      .reduce((acc, n) => acc + n.valor_total, 0)
                  )}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabela */}
        <Card className="bg-level-2">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-muted-foreground">Carregando NFes...</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Série</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data Emissão</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNFes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-8"
                    >
                      Nenhuma nota fiscal encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNFes.map((nfe) => (
                    <TableRow key={nfe.id}>
                      <TableCell className="font-medium">{nfe.numero}</TableCell>
                      <TableCell>{nfe.serie}</TableCell>
                      <TableCell>{nfe.cliente}</TableCell>
                      <TableCell>
                        {new Date(nfe.data_emissao).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="font-mono">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(nfe.valor_total)}
                      </TableCell>
                      <TableCell>{getStatusBadge(nfe.status)}</TableCell>
                      <TableCell className="text-right">
                        <NFeActionsMenu
                          nfeId={nfe.id}
                          nfeNumero={nfe.numero}
                          status={nfe.status}
                          chaveAcesso={nfe.chave_acesso}
                          orgId="temp-org-id"
                          onView={() => navigate(`/fiscal/nfe/${nfe.id}`)}
                          onRefresh={loadNFes}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  )
}
