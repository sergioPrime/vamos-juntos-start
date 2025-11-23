import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePlans, SubscriptionPlan } from "@/hooks/usePlans"
import { CreatePlanDialog } from "./CreatePlanDialog"
import { EditPlanDialog } from "./EditPlanDialog"
import { PlanCard } from "./PlanCard"
import { Package } from "lucide-react"

export function PlanManagement() {
  const { plans, loading, createPlan, updatePlan, deletePlan, togglePlanStatus, getPlanStats } = usePlans()
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan)
    setEditDialogOpen(true)
  }

  const activePlans = plans.filter(p => p.is_active)
  const inactivePlans = plans.filter(p => !p.is_active)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Planos</CardTitle>
          <CardDescription>Carregando planos de assinatura...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Gerenciamento de Planos
            </CardTitle>
            <CardDescription>
              Configure e gerencie os planos de assinatura disponíveis no sistema
            </CardDescription>
          </div>
          <CreatePlanDialog onSubmit={createPlan} />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="active">
              Ativos ({activePlans.length})
            </TabsTrigger>
            <TabsTrigger value="inactive">
              Inativos ({inactivePlans.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            {activePlans.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhum plano ativo encontrado. Crie um novo plano para começar.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {activePlans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onEdit={handleEdit}
                    onDelete={deletePlan}
                    onToggleStatus={togglePlanStatus}
                    getPlanStats={getPlanStats}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inactive" className="mt-6">
            {inactivePlans.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhum plano inativo encontrado.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {inactivePlans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onEdit={handleEdit}
                    onDelete={deletePlan}
                    onToggleStatus={togglePlanStatus}
                    getPlanStats={getPlanStats}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <EditPlanDialog
          plan={editingPlan}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSubmit={updatePlan}
        />
      </CardContent>
    </Card>
  )
}
