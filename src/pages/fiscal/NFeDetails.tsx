import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Download, Mail, Printer, FileText } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { usePrintDANFE } from "@/hooks/usePrintDANFE"
import NFeActionsMenu from "@/components/fiscal/NFeActionsMenu"

export default function NFeDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [nfe, setNfe] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { printDANFE } = usePrintDANFE()

  useEffect(() => {
    loadNFeDetails()
  }, [id])

  const loadNFeDetails = async () => {
    try {
      setLoading(true)

      // Buscar dados da NFe
      const { data: nfeData, error: nfeError } = await supabase
        .from('nfe')
        .select('*, pessoas!nfe_destinatario_id_fkey(nome, documento, email)')
        .eq('id', id)
        .single()

      if (nfeError) throw nfeError

      setNfe(nfeData)

      // Buscar itens
      const { data: itemsData, error: itemsError } = await supabase
        .from('nfe_itens')
        .select('*')
        .eq('nfe_id', id)
        .order('numero_item')

      if (itemsError) {
        console.warn('Erro ao carregar itens:', itemsError)
      } else {
        setItems(itemsData || [])
      }
    } catch (error) {
      console.error('Erro ao carregar NFe:', error)
      toast.error('Erro ao carregar detalhes da NFe')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      autorizada: { variant: "default", label: "Autorizada" },
      cancelada: { variant: "destructive", label: "Cancelada" },
      pendente: { variant: "secondary", label: "Pendente" },
      rejeitada: { variant: "outline", label: "Rejeitada" },
    }

    const config = variants[status] || { variant: "outline", label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDocument = (doc: string) => {
    if (!doc) return ''
    if (doc.length === 11) {
      return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    } else if (doc.length === 14) {
      return doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
    return doc
  }

  if (loading) {
    return (
      <div className="container-comfortable">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!nfe) {
    return (
      <div className="container-comfortable">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">NFe não encontrada</p>
          <Button onClick={() => navigate('/fiscal/nfe')} className="mt-4">
            Voltar para Listagem
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container-comfortable">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/fiscal/nfe')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </div>
            <h1 className="title-xl">
              NFe Nº {nfe.numero} - Série {nfe.serie}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              {getStatusBadge(nfe.status)}
              {nfe.protocolo_autorizacao && (
                <span className="text-sm text-muted-foreground">
                  Protocolo: {nfe.protocolo_autorizacao}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => printDANFE(nfe.id)}
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir DANFE
            </Button>
            <NFeActionsMenu
              nfeId={nfe.id}
              nfeNumero={nfe.numero}
              status={nfe.status}
              chaveAcesso={nfe.chave_acesso}
              orgId={nfe.org_id}
              onView={() => navigate(`/fiscal/nfe/${nfe.id}`)}
              onRefresh={loadNFeDetails}
            />
          </div>
        </div>

        {/* Informações Gerais */}
        <Card className="p-6">
          <h2 className="title-md mb-4">Informações Gerais</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Data de Emissão</p>
              <p className="font-medium">
                {new Date(nfe.data_emissao).toLocaleString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Natureza da Operação</p>
              <p className="font-medium">{nfe.natureza_operacao}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Chave de Acesso</p>
              <p className="font-mono text-xs">{nfe.chave_acesso}</p>
            </div>
          </div>
        </Card>

        {/* Destinatário */}
        <Card className="p-6">
          <h2 className="title-md mb-4">Destinatário</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Razão Social</p>
              <p className="font-medium">{nfe.razao_social_destinatario}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CPF/CNPJ</p>
              <p className="font-medium">
                {formatDocument(nfe.documento_destinatario)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Endereço</p>
              <p className="font-medium">{nfe.endereco_destinatario}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Município/UF</p>
              <p className="font-medium">
                {nfe.municipio_destinatario} - {nfe.uf_destinatario}
              </p>
            </div>
          </div>
        </Card>

        {/* Produtos/Serviços */}
        <Card className="p-6">
          <h2 className="title-md mb-4">Produtos e Serviços</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 text-sm font-medium">Código</th>
                  <th className="text-left p-2 text-sm font-medium">Descrição</th>
                  <th className="text-right p-2 text-sm font-medium">Qtde.</th>
                  <th className="text-right p-2 text-sm font-medium">Valor Unit.</th>
                  <th className="text-right p-2 text-sm font-medium">Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {items.length > 0 ? (
                  items.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-2 text-sm">{item.codigo_produto}</td>
                      <td className="p-2 text-sm">{item.descricao}</td>
                      <td className="p-2 text-sm text-right">
                        {item.quantidade} {item.unidade}
                      </td>
                      <td className="p-2 text-sm text-right">
                        {formatCurrency(item.valor_unitario)}
                      </td>
                      <td className="p-2 text-sm text-right">
                        {formatCurrency(item.valor_total)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                      Nenhum item cadastrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Totais */}
        <Card className="p-6">
          <h2 className="title-md mb-4">Valores Totais</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Valor dos Produtos</p>
              <p className="font-medium">{formatCurrency(nfe.valor_produtos)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor do Frete</p>
              <p className="font-medium">{formatCurrency(nfe.valor_frete)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor do Desconto</p>
              <p className="font-medium">{formatCurrency(nfe.valor_desconto)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Total da NFe</p>
              <p className="font-bold text-lg">{formatCurrency(nfe.valor_total)}</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">ICMS</p>
              <p className="font-medium">{formatCurrency(nfe.valor_icms)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">IPI</p>
              <p className="font-medium">{formatCurrency(nfe.valor_ipi)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">PIS</p>
              <p className="font-medium">{formatCurrency(nfe.valor_pis)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">COFINS</p>
              <p className="font-medium">{formatCurrency(nfe.valor_cofins)}</p>
            </div>
          </div>
        </Card>

        {/* Informações Adicionais */}
        {nfe.informacoes_complementares && (
          <Card className="p-6">
            <h2 className="title-md mb-4">Informações Complementares</h2>
            <p className="text-sm whitespace-pre-wrap">
              {nfe.informacoes_complementares}
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
