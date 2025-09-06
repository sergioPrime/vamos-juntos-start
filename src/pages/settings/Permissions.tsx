import { PermissionsAndAccess } from "@/components/settings/PermissionsAndAccess"

export default function Permissions() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Permissões e Acessos</h1>
        <p className="text-muted-foreground">Gerencie permissões e controle de acesso do sistema</p>
      </div>
      
      <PermissionsAndAccess />
    </div>
  )
}