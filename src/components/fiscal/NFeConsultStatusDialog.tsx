import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

interface NFeConsultStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nfeId: string
  onSuccess?: () => void
}

export function NFeConsultStatusDialog({
  open,
  onOpenChange,
  nfeId,
  onSuccess
}: NFeConsultStatusDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    status: string
    protocolo: string
    dataAutorizacao: string
  } | null>(null)

  const handleConsult = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('consult-nfe-status', {
        body: { nfeId }
      })

      if (error) throw error

      if (data.success) {
        setResult({
          status: data.status,
          protocolo: data.protocolo,
          dataAutorizacao: data.dataAutorizacao
        })
        
        toast.success('Status consultado com sucesso')
        onSuccess?.()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Erro ao consultar status:', error)
      toast.error('Erro ao consultar status da NFe')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setResult(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Consultar Status da NFe</DialogTitle>
          <DialogDescription>
            Consulte o status atual desta NFe no SEFAZ
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {result.status === 'autorizada' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">
                Status: {result.status === 'autorizada' ? 'Autorizada' : result.status}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <strong>Protocolo:</strong> {result.protocolo}
              </div>
              <div>
                <strong>Data de Autorização:</strong>{' '}
                {new Date(result.dataAutorizacao).toLocaleString('pt-BR')}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Clique em "Consultar" para verificar o status atual da NFe no SEFAZ.
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Fechar
          </Button>
          {!result && (
            <Button onClick={handleConsult} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Consultar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
