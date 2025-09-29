import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/useAuth"
import { useOrganization } from "@/hooks/useOrganization"
import { supabase } from "@/integrations/supabase/client"

interface CaixaMovimentacao {
  id: string
  tipo: string
  valor: number
  descricao: string
  observacoes?: string
  created_at: string
}

interface HistoricoCaixaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const HistoricoCaixaDialog = ({ open, onOpenChange }: HistoricoCaixaDialogProps) => {
  const { currentOrg } = useOrganization()
  
  const [movimentacoes, setMovimentacoes] = useState<CaixaMovimentacao[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadMovimentacoes()
    }
  }, [open, currentOrg])

  const loadMovimentacoes = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('caixa_movimentacoes')
        .select('*')
        .eq('org_id', currentOrg?.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setMovimentacoes(data || [])
    } catch (error) {
      console.error('Error loading movements:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'abertura': return 'bg-green-100 text-green-700'
      case 'fechamento': return 'bg-red-100 text-red-700'
      case 'suprimento': return 'bg-blue-100 text-blue-700'
      case 'sangria': return 'bg-orange-100 text-orange-700'
      case 'venda': return 'bg-purple-100 text-purple-700'
      case 'devolucao': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'abertura': return 'Abertura'
      case 'fechamento': return 'Fechamento'
      case 'suprimento': return 'Suprimento'
      case 'sangria': return 'Sangria'
      case 'venda': return 'Venda'
      case 'devolucao': return 'Devolução'
      default: return tipo
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Histórico do Caixa</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Carregando movimentações...</div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {movimentacoes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma movimentação encontrada
                  </div>
                ) : (
                  movimentacoes.map(mov => (
                    <div key={mov.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getTipoColor(mov.tipo)}>
                            {getTipoLabel(mov.tipo)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(mov.created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <p className="font-medium">{mov.descricao}</p>
                        {mov.observacoes && (
                          <p className="text-sm text-muted-foreground">{mov.observacoes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          ['suprimento', 'abertura', 'venda'].includes(mov.tipo) 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {['suprimento', 'abertura', 'venda'].includes(mov.tipo) ? '+' : '-'}
                          R$ {mov.valor.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
          
          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}