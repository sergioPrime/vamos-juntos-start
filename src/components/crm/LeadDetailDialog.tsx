import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Mail, Phone, Building, Briefcase, TrendingUp, DollarSign } from "lucide-react"

interface LeadDetailDialogProps {
  open: boolean
  onClose: () => void
  lead: any
}

export function LeadDetailDialog({ open, onClose, lead }: LeadDetailDialogProps) {
  if (!lead) return null

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getStatusVariant = (status: string) => {
    const variants: Record<string, any> = {
      novo: "default",
      qualificado: "secondary",
      negociacao: "outline",
      ganho: "default",
      perdido: "destructive"
    }
    return variants[status] || "default"
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{lead.name}</span>
            <Badge variant={getStatusVariant(lead.status)}>
              {lead.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground">Informações de Contato</h3>
              
              {lead.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">E-mail</p>
                    <p className="text-sm text-muted-foreground">{lead.email}</p>
                  </div>
                </div>
              )}

              {lead.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Telefone</p>
                    <p className="text-sm text-muted-foreground">{lead.phone}</p>
                  </div>
                </div>
              )}

              {lead.company && (
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Empresa</p>
                    <p className="text-sm text-muted-foreground">{lead.company}</p>
                  </div>
                </div>
              )}

              {lead.position && (
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Cargo</p>
                    <p className="text-sm text-muted-foreground">{lead.position}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground">Métricas</h3>
              
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Score</p>
                  <p className={`text-sm font-bold ${getScoreColor(lead.score || 0)}`}>
                    {lead.score || 0}/100
                  </p>
                </div>
              </div>

              {lead.estimated_value && (
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Valor Estimado</p>
                    <p className="text-sm font-bold text-green-600">
                      R$ {Number(lead.estimated_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              )}

              {lead.source && (
                <div>
                  <p className="text-sm font-medium mb-1">Origem</p>
                  <Badge variant="outline">{lead.source}</Badge>
                </div>
              )}
            </div>
          </div>

          {lead.notes && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Observações</h3>
                <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
              </div>
            </>
          )}

          <Separator />
          
          <div className="text-xs text-muted-foreground">
            <p>Criado em: {new Date(lead.created_at).toLocaleString('pt-BR')}</p>
            <p>Última atualização: {new Date(lead.updated_at).toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
