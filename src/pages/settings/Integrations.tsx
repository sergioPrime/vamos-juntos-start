import { APIIntegrations } from "@/components/integrations/APIIntegrations"

export default function Integrations() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrações</h1>
        <p className="text-muted-foreground">Configure as integrações do sistema</p>
      </div>
      
      <APIIntegrations />
    </div>
  )
}