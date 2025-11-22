import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { Loader2, CheckCircle, XCircle, HelpCircle, AlertCircle } from "lucide-react"

interface NFeManifestacaoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nfeId: string
  nfeNumero: string
  onSuccess?: () => void
}

export function NFeManifestacaoDialog({
  open,
  onOpenChange,
  nfeId,
  nfeNumero,
  onSuccess
}: NFeManifestacaoDialogProps) {
  const [tipoManifestacao, setTipoManifestacao] = useState<string>("confirmacao_operacao")
  const [justificativa, setJustificativa] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const manifestacoes = [
    {
      value: "ciencia_operacao",
      label: "Ciência da Operação",
      icon: HelpCircle,
      description: "Indica apenas que tomou conhecimento da operação",
      requiresJustification: false
    },
    {
      value: "confirmacao_operacao",
      label: "Confirmação da Operação",
      icon: CheckCircle,
      description: "Confirma que a operação foi realizada conforme descrito na NFe",
      requiresJustification: false
    },
    {
      value: "desconhecimento_operacao",
      label: "Desconhecimento da Operação",
      icon: XCircle,
      description: "Declara não ter conhecimento da operação",
      requiresJustification: false
    },
    {
      value: "operacao_nao_realizada",
      label: "Operação Não Realizada",
      icon: AlertCircle,
      description: "Declara que a operação não foi realizada",
      requiresJustification: true
    }
  ]

  const selectedManifestacao = manifestacoes.find(m => m.value === tipoManifestacao)
  const requiresJustification = selectedManifestacao?.requiresJustification || false

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (requiresJustification && justificativa.length < 15) {
      toast.error('A justificativa deve ter no mínimo 15 caracteres')
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('manifestacao-destinatario', {
        body: { 
          nfeId, 
          tipoManifestacao,
          justificativa: requiresJustification ? justificativa : undefined
        }
      })

      if (error) throw error

      if (data.success) {
        toast.success('Manifestação registrada com sucesso')
        onSuccess?.()
        onOpenChange(false)
        setTipoManifestacao("confirmacao_operacao")
        setJustificativa("")
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Erro ao registrar manifestação:', error)
      toast.error('Erro ao registrar manifestação do destinatário')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manifestação do Destinatário - NFe {nfeNumero}</DialogTitle>
          <DialogDescription>
            Registre sua manifestação sobre esta nota fiscal eletrônica
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label>Tipo de Manifestação</Label>
              <RadioGroup value={tipoManifestacao} onValueChange={setTipoManifestacao}>
                {manifestacoes.map((manifest) => {
                  const Icon = manifest.icon
                  return (
                    <div key={manifest.value} className="flex items-start space-x-3 space-y-0">
                      <RadioGroupItem value={manifest.value} id={manifest.value} />
                      <Label 
                        htmlFor={manifest.value} 
                        className="flex-1 cursor-pointer font-normal"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="h-4 w-4" />
                          <span className="font-medium">{manifest.label}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {manifest.description}
                        </p>
                      </Label>
                    </div>
                  )
                })}
              </RadioGroup>
            </div>

            {requiresJustification && (
              <div className="space-y-2">
                <Label htmlFor="justificativa">
                  Justificativa <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="justificativa"
                  placeholder="Descreva o motivo da manifestação (mínimo 15 caracteres)"
                  value={justificativa}
                  onChange={(e) => setJustificativa(e.target.value)}
                  rows={4}
                  required={requiresJustification}
                />
                <p className="text-sm text-muted-foreground">
                  {justificativa.length}/255 caracteres (mínimo 15)
                </p>
              </div>
            )}

            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium mb-2">Atenção:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>A manifestação é registrada na SEFAZ e não pode ser alterada posteriormente</li>
                <li>O emitente será notificado sobre sua manifestação</li>
                <li>Escolha cuidadosamente a opção que representa sua situação</li>
              </ul>
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
            <Button 
              type="submit"
              disabled={isLoading || (requiresJustification && justificativa.length < 15)}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Manifestação
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
