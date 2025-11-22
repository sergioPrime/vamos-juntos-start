import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface NFeEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nfeId: string
  defaultEmail?: string
  onSuccess?: () => void
}

export function NFeEmailDialog({
  open,
  onOpenChange,
  nfeId,
  defaultEmail = "",
  onSuccess
}: NFeEmailDialogProps) {
  const [email, setEmail] = useState(defaultEmail)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !email.includes('@')) {
      toast.error('Digite um email válido')
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('send-nfe-email', {
        body: { nfeId, email }
      })

      if (error) throw error

      if (data.success) {
        toast.success('Email enviado com sucesso')
        onSuccess?.()
        onOpenChange(false)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Erro ao enviar email:', error)
      toast.error('Erro ao enviar email')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar NFe por Email</DialogTitle>
          <DialogDescription>
            Envie a NFe e o DANFE por email para o cliente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email do destinatário</Label>
              <Input
                id="email"
                type="email"
                placeholder="cliente@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Email
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
