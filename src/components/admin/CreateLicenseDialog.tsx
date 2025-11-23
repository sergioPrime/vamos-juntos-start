import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useQueryClient } from "@tanstack/react-query"
import { addDays, addMonths, addYears } from "date-fns"

interface CreateLicenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateLicenseDialog({ open, onOpenChange }: CreateLicenseDialogProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    org_id: "",
    plan_type: "basic",
    duration: "1_month",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Calcular data de expiração
      const now = new Date()
      let expirationDate: Date

      switch (formData.duration) {
        case "7_days":
          expirationDate = addDays(now, 7)
          break
        case "1_month":
          expirationDate = addMonths(now, 1)
          break
        case "3_months":
          expirationDate = addMonths(now, 3)
          break
        case "6_months":
          expirationDate = addMonths(now, 6)
          break
        case "1_year":
          expirationDate = addYears(now, 1)
          break
        default:
          expirationDate = addMonths(now, 1)
      }

      const { error } = await supabase
        .from("subscriptions")
        .insert({
          org_id: formData.org_id,
          plan_type: formData.plan_type,
          status: "active",
          expiration_date: expirationDate.toISOString(),
        })

      if (error) throw error

      toast({
        title: "Licença criada com sucesso",
        description: `A licença foi criada e estará ativa até ${expirationDate.toLocaleDateString()}`,
      })

      queryClient.invalidateQueries({ queryKey: ["subscription-metrics"] })
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] })
      
      onOpenChange(false)
      setFormData({
        org_id: "",
        plan_type: "basic",
        duration: "1_month",
      })
    } catch (error) {
      console.error("Erro ao criar licença:", error)
      toast({
        title: "Erro ao criar licença",
        description: "Não foi possível criar a licença. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar Nova Licença</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org_id">ID da Organização</Label>
            <Input
              id="org_id"
              value={formData.org_id}
              onChange={(e) => setFormData({ ...formData, org_id: e.target.value })}
              placeholder="UUID da organização"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan_type">Tipo de Plano</Label>
            <Select
              value={formData.plan_type}
              onValueChange={(value) => setFormData({ ...formData, plan_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Básico</SelectItem>
                <SelectItem value="professional">Profissional</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duração</Label>
            <Select
              value={formData.duration}
              onValueChange={(value) => setFormData({ ...formData, duration: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7_days">7 dias (teste)</SelectItem>
                <SelectItem value="1_month">1 mês</SelectItem>
                <SelectItem value="3_months">3 meses</SelectItem>
                <SelectItem value="6_months">6 meses</SelectItem>
                <SelectItem value="1_year">1 ano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Licença"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
