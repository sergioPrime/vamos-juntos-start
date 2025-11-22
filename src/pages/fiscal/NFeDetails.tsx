import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Download, Mail, Printer, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { ResponsiveTable } from '@/components/ui/responsive-table'

interface NFe {
  id: string
  numero: string
  serie: string
  chave_acesso: string
  status: 'rascunho' | 'autorizada' | 'cancelada' | 'rejeitada'
  data_emissao: string
  valor_total: number
  destinatario_nome: string | null
  destinatario_documento: string | null
  destinatario_endereco: string | null
  destinatario_cidade: string | null
  destinatario_uf: string | null
  emitente_nome: string | null
  emitente_documento: string | null
  natureza_operacao: string | null
  modelo: string
  finalidade: string
  created_at: string
}

interface NFeItem {
  id: string
  produto_nome: string | null
  produto_codigo: string | null
  quantidade: number
  valor_unitario: number
  valor_total: number
  ncm: string | null
  cfop: string | null
  unidade: string | null
}

export default function NFeDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [nfe, setNfe] = useState<NFe | null>(null)
  const [items, setItems] = useState<NFeItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadNFeDetails()
    }
  }, [id])

  const loadNFeDetails = async () => {
    try {
      setLoading(true)

      // Buscar NFe
      const { data: nfeData, error: nfeError } = await supabase
        .from('nfe')
        .select('*')
        .eq('id', id)
        .single()

      if (nfeError) throw nfeError

      // Buscar itens
      const { data: itemsData, error: itemsError } = await supabase
        .from('nfe_items')
        .select('*')
        .eq('nfe_id', id)
        .order('created_at', { ascending: true })

      if (itemsError) throw itemsError

      setNfe(nfeData as any)
      setItems(itemsData as any || [])
    } catch (error) {
      console.error('Error loading NFe details:', error)
      toast.error('Erro ao carregar detalhes da NFe')
      navigate('/fiscal/nfe')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      autorizada: { variant: 'default', label: 'Autorizada' },
      rascunho: { variant: 'secondary', label: 'Rascunho' },
      cancelada: { variant: 'destructive', label: 'Cancelada' },
      rejeitada: { variant: 'destructive', label: 'Rejeitada' }
    }
    const config = variants[status] || { variant: 'secondary', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDocument = (doc: string) => {
    if (doc.length === 11) {
      return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  const formatAccessKey = (key: string) => {
    return key.replace(/(\d{4})/g, '$1 ').trim()
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Carregando...</div>
      </div>
    )
  }

  if (!nfe) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">NFe não encontrada</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header com botão voltar e ações */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/fiscal/nfe')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">NFe #{nfe.numero}</h1>
            <p className="text-muted-foreground">
              Série {nfe.serie} | {new Date(nfe.data_emissao).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {nfe.status === 'autorizada' && (
            <>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                XML
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                DANFE
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Enviar
              </Button>
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status e Chave de Acesso */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Status e Identificação</CardTitle>
            {getStatusBadge(nfe.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Chave de Acesso</p>
            <p className="font-mono text-lg">{formatAccessKey(nfe.chave_acesso)}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Modelo</p>
              <p className="font-medium">{nfe.modelo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Finalidade</p>
              <p className="font-medium capitalize">{nfe.finalidade}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Natureza da Operação</p>
              <p className="font-medium">{nfe.natureza_operacao || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emitente */}
        <Card>
          <CardHeader>
            <CardTitle>Emitente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Razão Social</p>
              <p className="font-medium">{nfe.emitente_nome || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CNPJ</p>
              <p className="font-medium">{nfe.emitente_documento ? formatDocument(nfe.emitente_documento) : '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Destinatário */}
        <Card>
          <CardHeader>
            <CardTitle>Destinatário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Nome/Razão Social</p>
              <p className="font-medium">{nfe.destinatario_nome || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CPF/CNPJ</p>
              <p className="font-medium">{nfe.destinatario_documento ? formatDocument(nfe.destinatario_documento) : '-'}</p>
            </div>
            {nfe.destinatario_endereco && (
              <div>
                <p className="text-sm text-muted-foreground">Endereço</p>
                <p className="font-medium">
                  {nfe.destinatario_endereco}
                  {nfe.destinatario_cidade && `, ${nfe.destinatario_cidade}`}
                  {nfe.destinatario_uf && ` - ${nfe.destinatario_uf}`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Itens da NFe */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos/Serviços</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-center">NCM</TableHead>
                  <TableHead className="text-center">CFOP</TableHead>
                  <TableHead className="text-center">Un.</TableHead>
                  <TableHead className="text-right">Qtd.</TableHead>
                  <TableHead className="text-right">Valor Unit.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.produto_codigo || '-'}</TableCell>
                    <TableCell>{item.produto_nome || '-'}</TableCell>
                    <TableCell className="text-center">{item.ncm || '-'}</TableCell>
                    <TableCell className="text-center">{item.cfop || '-'}</TableCell>
                    <TableCell className="text-center">{item.unidade || '-'}</TableCell>
                    <TableCell className="text-right">{item.quantidade}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.valor_unitario)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(item.valor_total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ResponsiveTable>
        </CardContent>
      </Card>

      {/* Totais */}
      <Card>
        <CardHeader>
          <CardTitle>Totais da NFe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium">Valor Total da NFe</span>
            <span className="text-2xl font-bold">{formatCurrency(nfe.valor_total)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
