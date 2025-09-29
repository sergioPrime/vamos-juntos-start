import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  CashRegister, 
  Plus, 
  Minus, 
  RotateCcw, 
  AlertTriangle, 
  Clock,
  DollarSign,
  Eye,
  Calendar
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useOrganization } from "@/hooks/useOrganization"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { FecharCaixaDialog } from "@/components/pdv/FecharCaixaDialog"
import { AbrirCaixaDialog } from "@/components/pdv/AbrirCaixaDialog"
import { SuprimentoDialog } from "@/components/pdv/SuprimentoDialog"
import { SangriaDialog } from "@/components/pdv/SangriaDialog"
import { DevolucaoDialog } from "@/components/pdv/DevolucaoDialog"
import { HistoricoCaixaDialog } from "@/components/pdv/HistoricoCaixaDialog"

interface CaixaStatus {
  id: string
  status: 'aberto' | 'fechado'
  valor_inicial: number
  valor_atual: number
  abertura_em: string
  fechamento_em?: string
  usuario_abertura: string
  usuario_fechamento?: string
}

const OperacoesPDV = () => {
  const { user } = useAuth()
  const { currentOrg } = useOrganization()
  const { toast } = useToast()
  
  const [caixaStatus, setCaixaStatus] = useState<CaixaStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFecharCaixa, setShowFecharCaixa] = useState(false)
  const [showAbrirCaixa, setShowAbrirCaixa] = useState(false)
  const [showSuprimento, setShowSuprimento] = useState(false)
  const [showSangria, setShowSangria] = useState(false)
  const [showDevolucao, setShowDevolucao] = useState(false)
  const [showHistorico, setShowHistorico] = useState(false)

  useEffect(() => {
    if (currentOrg?.id) {
      loadCaixaStatus()
    }
  }, [currentOrg])

  const loadCaixaStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('caixa_sessoes')
        .select('*')
        .eq('org_id', currentOrg?.id)
        .eq('status', 'aberto')
        .order('abertura_em', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      setCaixaStatus(data)
    } catch (error) {
      console.error('Error loading caixa status:', error)
    } finally {
      setLoading(false)
    }
  }

  const vendaHoje = async () => {
    const hoje = new Date().toISOString().split('T')[0]
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('org_id', currentOrg?.id)
        .eq('status', 'completed')
        .gte('created_at', `${hoje}T00:00:00.000Z`)
        .lte('created_at', `${hoje}T23:59:59.999Z`)

      if (error) throw error
      return data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
    } catch (error) {
      console.error('Error getting today sales:', error)
      return 0
    }
  }

  const [vendasHoje, setVendasHoje] = useState(0)

  useEffect(() => {
    vendaHoje().then(setVendasHoje)
  }, [currentOrg])

  if (loading) {
    return <div className="p-6">Carregando...</div>
  }

  const caixaAberto = caixaStatus?.status === 'aberto'

  return (
    <div className="page-container container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Operações do PDV</h1>
        <div className="flex items-center gap-2">
          <Badge variant={caixaAberto ? "default" : "secondary"} className="text-sm px-3 py-1">
            <Clock className="h-4 w-4 mr-2" />
            Caixa {caixaAberto ? 'Aberto' : 'Fechado'}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('pt-BR')} - {new Date().toLocaleTimeString('pt-BR')}
          </span>
        </div>
      </div>

      {/* Status do Caixa */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CashRegister className="h-5 w-5" />
            Status do Caixa
          </CardTitle>
        </CardHeader>
        <CardContent>
          {caixaAberto ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Valor Inicial</p>
                <p className="text-2xl font-bold text-primary">R$ {caixaStatus?.valor_inicial?.toFixed(2) || '0,00'}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Valor Atual</p>
                <p className="text-2xl font-bold text-green-600">R$ {caixaStatus?.valor_atual?.toFixed(2) || '0,00'}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Vendas Hoje</p>
                <p className="text-2xl font-bold text-blue-600">R$ {vendasHoje.toFixed(2)}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
              <p className="text-lg font-medium mb-2">Caixa está fechado</p>
              <p className="text-muted-foreground">Abra o caixa para começar as operações do PDV</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Operações */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Abrir/Fechar Caixa */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
              caixaAberto ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
            }`}>
              <CashRegister className="h-8 w-8" />
            </div>
            <h3 className="font-semibold mb-2">
              {caixaAberto ? 'Fechar Caixa' : 'Abrir Caixa'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {caixaAberto ? 'Encerre as operações do dia' : 'Inicie as operações do dia'}
            </p>
            <Button 
              className="w-full" 
              variant={caixaAberto ? "destructive" : "default"}
              onClick={() => caixaAberto ? setShowFecharCaixa(true) : setShowAbrirCaixa(true)}
            >
              {caixaAberto ? 'Fechar' : 'Abrir'}
            </Button>
          </CardContent>
        </Card>

        {/* Suprimento */}
        <Card className={`cursor-pointer hover:shadow-md transition-shadow ${!caixaAberto ? 'opacity-50' : ''}`}>
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
              <Plus className="h-8 w-8" />
            </div>
            <h3 className="font-semibold mb-2">Suprimento</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Adicionar dinheiro ao caixa
            </p>
            <Button 
              className="w-full" 
              disabled={!caixaAberto}
              onClick={() => setShowSuprimento(true)}
            >
              Adicionar
            </Button>
          </CardContent>
        </Card>

        {/* Sangria */}
        <Card className={`cursor-pointer hover:shadow-md transition-shadow ${!caixaAberto ? 'opacity-50' : ''}`}>
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 text-orange-600 mb-4">
              <Minus className="h-8 w-8" />
            </div>
            <h3 className="font-semibold mb-2">Sangria</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Retirar dinheiro do caixa
            </p>
            <Button 
              className="w-full" 
              variant="outline"
              disabled={!caixaAberto}
              onClick={() => setShowSangria(true)}
            >
              Retirar
            </Button>
          </CardContent>
        </Card>

        {/* Devolução */}
        <Card className={`cursor-pointer hover:shadow-md transition-shadow ${!caixaAberto ? 'opacity-50' : ''}`}>
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-purple-600 mb-4">
              <RotateCcw className="h-8 w-8" />
            </div>
            <h3 className="font-semibold mb-2">Devolução</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Processar devolução de produtos
            </p>
            <Button 
              className="w-full" 
              variant="outline"
              disabled={!caixaAberto}
              onClick={() => setShowDevolucao(true)}
            >
              Devolver
            </Button>
          </CardContent>
        </Card>

        {/* Histórico */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-600 mb-4">
              <Eye className="h-8 w-8" />
            </div>
            <h3 className="font-semibold mb-2">Histórico</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ver movimentações do caixa
            </p>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => setShowHistorico(true)}
            >
              Visualizar
            </Button>
          </CardContent>
        </Card>

        {/* Relatório do Dia */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 mb-4">
              <Calendar className="h-8 w-8" />
            </div>
            <h3 className="font-semibold mb-2">Relatório do Dia</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Resumo das operações
            </p>
            <Button 
              className="w-full" 
              variant="outline"
            >
              Gerar
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <FecharCaixaDialog 
        open={showFecharCaixa} 
        onOpenChange={setShowFecharCaixa}
        caixaStatus={caixaStatus}
        onSuccess={loadCaixaStatus}
      />
      
      <AbrirCaixaDialog 
        open={showAbrirCaixa} 
        onOpenChange={setShowAbrirCaixa}
        onSuccess={loadCaixaStatus}
      />
      
      <SuprimentoDialog 
        open={showSuprimento} 
        onOpenChange={setShowSuprimento}
        caixaStatus={caixaStatus}
        onSuccess={loadCaixaStatus}
      />
      
      <SangriaDialog 
        open={showSangria} 
        onOpenChange={setShowSangria}
        caixaStatus={caixaStatus}
        onSuccess={loadCaixaStatus}
      />
      
      <DevolucaoDialog 
        open={showDevolucao} 
        onOpenChange={setShowDevolucao}
        onSuccess={loadCaixaStatus}
      />
      
      <HistoricoCaixaDialog 
        open={showHistorico} 
        onOpenChange={setShowHistorico}
      />
    </div>
  )
}

export default OperacoesPDV