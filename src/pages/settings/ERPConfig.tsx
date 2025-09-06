import { ERPSettings } from "@/components/settings/ERPSettings"

export default function ERPConfig() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações do ERP</h1>
        <p className="text-muted-foreground">Configure as regras e comportamentos do ERP</p>
      </div>
      
      <ERPSettings />
    </div>
  )
}