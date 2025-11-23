import { useState, useEffect } from 'react'
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Users, FileText, UserCheck, Power, PowerOff } from "lucide-react"
import { SubscriptionPlan } from '@/hooks/usePlans'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface PlanCardProps {
  plan: SubscriptionPlan
  onEdit: (plan: SubscriptionPlan) => void
  onDelete: (id: string) => Promise<boolean>
  onToggleStatus: (id: string, isActive: boolean) => Promise<boolean>
  getPlanStats: (planId: string) => Promise<{ totalSubscriptions: number; activeSubscriptions: number }>
}

export function PlanCard({ plan, onEdit, onDelete, onToggleStatus, getPlanStats }: PlanCardProps) {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [stats, setStats] = useState({ totalSubscriptions: 0, activeSubscriptions: 0 })

  useEffect(() => {
    loadStats()
  }, [plan.id])

  const loadStats = async () => {
    const data = await getPlanStats(plan.id)
    setStats(data)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const formatLimit = (limit: number | null) => {
    if (limit === null || limit === -1) return 'Ilimitado'
    return limit.toString()
  }

  const getBillingCycleLabel = (cycle: string) => {
    const labels: Record<string, string> = {
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      yearly: 'Anual'
    }
    return labels[cycle] || cycle
  }

  const handleDelete = async () => {
    setDeleting(true)
    const success = await onDelete(plan.id)
    setDeleting(false)
    if (success) {
      setShowDeleteAlert(false)
    }
  }

  const handleToggleStatus = async () => {
    setToggling(true)
    await onToggleStatus(plan.id, plan.is_active || false)
    setToggling(false)
  }

  return (
    <>
      <Card className={!plan.is_active ? 'opacity-60' : ''}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <Badge variant={plan.is_active ? "default" : "secondary"}>
                  {plan.is_active ? "Ativo" : "Inativo"}
                </Badge>
                <Badge variant="outline">{getBillingCycleLabel(plan.billing_cycle)}</Badge>
              </div>
              {plan.description && (
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              )}
              <p className="text-3xl font-bold text-primary mt-3">
                {formatPrice(plan.price)}
                <span className="text-sm font-normal text-muted-foreground">/mês</span>
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Features */}
          {plan.features && plan.features.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 text-sm">Recursos:</h4>
              <ul className="space-y-1">
                {plan.features.map((feature, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start">
                    <span className="mr-2">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Limits */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3 text-sm">Limites:</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                <Users className="h-4 w-4 mb-1 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Usuários</span>
                <span className="font-semibold mt-1">{formatLimit(plan.max_users)}</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                <FileText className="h-4 w-4 mb-1 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Faturas</span>
                <span className="font-semibold mt-1">{formatLimit(plan.max_invoices)}</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                <UserCheck className="h-4 w-4 mb-1 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Clientes</span>
                <span className="font-semibold mt-1">{formatLimit(plan.max_customers)}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Assinaturas Ativas:</span>
              <Badge variant="secondary">{stats.activeSubscriptions}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-muted-foreground">Total de Assinaturas:</span>
              <Badge variant="outline">{stats.totalSubscriptions}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-muted-foreground">Ordem de Exibição:</span>
              <span className="font-medium">{plan.sort_order}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(plan)}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleStatus}
            disabled={toggling}
            className="flex-1"
          >
            {plan.is_active ? (
              <>
                <PowerOff className="h-4 w-4 mr-2" />
                Desativar
              </>
            ) : (
              <>
                <Power className="h-4 w-4 mr-2" />
                Ativar
              </>
            )}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteAlert(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o plano "{plan.name}"?
              {stats.activeSubscriptions > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Este plano possui {stats.activeSubscriptions} assinatura(s) ativa(s) e não poderá ser excluído.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting || stats.activeSubscriptions > 0}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
