import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface CreateLicenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateLicenseDialog({ open, onOpenChange }: CreateLicenseDialogProps) {
  const [loading, setLoading] = useState(false)
  const [orgId, setOrgId] = useState('')
  const [planType, setPlanType] = useState<'free' | 'basic' | 'professional' | 'enterprise'>('basic')
  const [expiresAt, setExpiresAt] = useState<Date>()
  const queryClient = useQueryClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!orgId || !expiresAt) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          org_id: orgId,
          plan_type: planType,
          status: 'active',
          expiration_date: expiresAt.toISOString(),
        })

      if (error) throw error

      toast.success('Licença cadastrada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['subscription-metrics'] })
      onOpenChange(false)
      
      // Reset form
      setOrgId('')
      setPlanType('basic')
      setExpiresAt(undefined)
    } catch (error: any) {
      console.error('Error creating license:', error)
      toast.error(error.message || 'Erro ao cadastrar licença')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cadastrar Nova Licença</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org_id">ID da Organização *</Label>
            <Input
              id="org_id"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              placeholder="UUID da organização"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan_type">Tipo de Plano *</Label>
            <Select value={planType} onValueChange={(value: any) => setPlanType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Gratuito</SelectItem>
                <SelectItem value="basic">Básico</SelectItem>
                <SelectItem value="professional">Profissional</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data de Vencimento *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !expiresAt && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expiresAt ? format(expiresAt, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expiresAt}
                  onSelect={setExpiresAt}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
