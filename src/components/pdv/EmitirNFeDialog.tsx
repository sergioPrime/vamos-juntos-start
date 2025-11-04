import { FileText, X, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface EmitirNFeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderNumber: string
  orderTotal: number
  customerName?: string
  onConfirm: () => void
  onCancel: () => void
}

export const EmitirNFeDialog = ({
  open,
  onOpenChange,
  orderNumber,
  orderTotal,
  customerName,
  onConfirm,
  onCancel
}: EmitirNFeDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Emitir Nota Fiscal
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">
              Venda Finalizada com Sucesso!
            </h3>
            <p className="text-sm text-muted-foreground">
              Deseja emitir a Nota Fiscal Eletrônica (NFe) para esta venda?
            </p>
          </div>

          <div className="bg-accent/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pedido:</span>
              <Badge variant="outline" className="font-mono">
                #{orderNumber}
              </Badge>
            </div>

            {customerName && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Cliente:</span>
                <span className="text-sm font-medium">{customerName}</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Valor Total:</span>
              <span className="text-lg font-bold text-primary">
                {orderTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium mb-1">💡 Dica:</p>
            <p className="text-xs">
              Você pode emitir a NFe agora ou depois através do menu Fiscal → NFe.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Não, obrigado
          </Button>
          <Button
            onClick={onConfirm}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            Sim, emitir NFe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
