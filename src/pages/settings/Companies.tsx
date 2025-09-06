import { CompaniesTab } from "@/components/settings/CompaniesTab"

export default function Companies() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Empresas</h1>
        <p className="text-muted-foreground">Gerencie as empresas do sistema</p>
      </div>
      
      <CompaniesTab />
    </div>
  )
}