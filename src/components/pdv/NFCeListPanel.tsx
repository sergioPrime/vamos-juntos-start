import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Eye, Printer, Download, Search, RefreshCw, XCircle, AlertCircle } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useOrganization } from "@/hooks/useOrganization"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { NFCeViewDialog } from "@/components/fiscal/NFCeViewDialog"
import { CancelNFCeDialog } from "@/components/fiscal/CancelNFCeDialog"
import { NFCeStatusDialog } from "@/components/fiscal/NFCeStatusDialog"

const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    autorizada: { label: "Autorizada", variant: "default" },
    cancelada: { label: "Cancelada", variant: "secondary" },
    rejeitada: { label: "Rejeitada", variant: "destructive" },
    pendente: { label: "Pendente", variant: "outline" },
    contingencia: { label: "Contingência", variant: "outline" },
  }
  
  const config = statusMap[status] || { label: status, variant: "outline" }
  
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export const NFCeListPanel = () => {
  const { currentOrg } = useOrganization()
  const { toast } = useToast()
  const [nfceList, setNfceList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedNFCe, setSelectedNFCe] = useState<any>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)

  const loadNFCe = async () => {
    if (!currentOrg) return

    setLoading(true)
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('nfce')
        .select('*')
        .eq('org_id', currentOrg.id)
        .gte('data_emissao', today.toISOString())
        .order('data_emissao', { ascending: false })
        .limit(50)

      if (error) throw error

      setNfceList(data || [])
    } catch (error: any) {
      console.error('Error loading NFCe:', error)
      toast({
        title: "Erro ao carregar NFC-e",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNFCe()
  }, [currentOrg])

  const filteredList = nfceList.filter(nfce =>
    nfce.numero.toString().includes(searchTerm) ||
    nfce.chave_acesso.includes(searchTerm) ||
    nfce.destinatario_nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleView = (nfce: any) => {
    setSelectedNFCe(nfce)
    setIsViewDialogOpen(true)
  }

  const handleCancel = (nfce: any) => {
    setSelectedNFCe(nfce)
    setIsCancelDialogOpen(true)
  }

  const handleQueryStatus = (nfce: any) => {
    setSelectedNFCe(nfce)
    setIsStatusDialogOpen(true)
  }

  const handlePrint = (nfce: any) => {
    toast({
      title: "Impressão",
      description: `Imprimindo NFC-e ${nfce.numero}...`,
    })
    // TODO: Implementar impressão
  }

  const handleDownloadXML = (nfce: any) => {
    if (!nfce.xml_content) {
      toast({
        title: "XML não disponível",
        description: "Esta NFC-e não possui XML disponível.",
        variant: "destructive",
      })
      return
    }

    const blob = new Blob([nfce.xml_content], { type: 'application/xml' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `NFCe_${nfce.numero}_${nfce.serie}.xml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              NFC-e Emitidas Hoje
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadNFCe}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, chave ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Nenhuma NFC-e encontrada com os filtros aplicados.' : 'Nenhuma NFC-e emitida hoje.'}
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Série</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredList.map((nfce) => (
                    <TableRow key={nfce.id}>
                      <TableCell className="font-mono font-bold">{nfce.numero}</TableCell>
                      <TableCell className="font-mono">{nfce.serie}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(nfce.data_emissao), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell>{nfce.destinatario_nome}</TableCell>
                      <TableCell className="font-bold">
                        {nfce.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(nfce.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(nfce)}
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQueryStatus(nfce)}
                            title="Consultar Status"
                          >
                            <AlertCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePrint(nfce)}
                            title="Imprimir"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadXML(nfce)}
                            disabled={!nfce.xml_content}
                            title="Download XML"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {nfce.status === 'autorizada' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancel(nfce)}
                              title="Cancelar NFC-e"
                              className="text-destructive hover:text-destructive"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Resumo */}
          {!loading && filteredList.length > 0 && (
            <div className="grid grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold">{filteredList.length}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {filteredList.filter(n => n.status === 'autorizada').length}
                </div>
                <div className="text-sm text-muted-foreground">Autorizadas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {filteredList.filter(n => n.status === 'rejeitada').length}
                </div>
                <div className="text-sm text-muted-foreground">Rejeitadas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {filteredList
                    .filter(n => n.status === 'autorizada')
                    .reduce((sum, n) => sum + n.valor_total, 0)
                    .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <div className="text-sm text-muted-foreground">Total Vendido</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {selectedNFCe && (
        <>
          <NFCeViewDialog
            open={isViewDialogOpen}
            onOpenChange={setIsViewDialogOpen}
            nfce={selectedNFCe}
          />
          
          <CancelNFCeDialog
            open={isCancelDialogOpen}
            onOpenChange={setIsCancelDialogOpen}
            nfce={selectedNFCe}
            onSuccess={() => {
              loadNFCe()
              setIsCancelDialogOpen(false)
            }}
          />
          
          <NFCeStatusDialog
            open={isStatusDialogOpen}
            onOpenChange={setIsStatusDialogOpen}
            nfce={selectedNFCe}
          />
        </>
      )}
    </>
  )
}
