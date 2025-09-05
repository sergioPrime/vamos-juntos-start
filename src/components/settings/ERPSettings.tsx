import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useSidebarConfig } from "@/contexts/SidebarConfigContext"

export function ERPSettings() {
  const { clickOnlyMode, setClickOnlyMode, lockNumberFields, setLockNumberFields } = useSidebarConfig()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações do ERP</CardTitle>
        <CardDescription>
          Personalize o comportamento do sistema conforme suas preferências
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="sidebar-click-mode" className="text-base">
              Abrir o menu lateral apenas no clique
            </Label>
            <p className="text-sm text-muted-foreground">
              Quando ativado, o menu lateral só abrirá quando clicado. 
              Quando desativado, o menu abrirá automaticamente ao passar o mouse.
            </p>
          </div>
          <Switch
            id="sidebar-click-mode"
            checked={clickOnlyMode}
            onCheckedChange={setClickOnlyMode}
          />
        </div>
        
        <Separator />
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="lock-number-fields" className="text-base">
              Bloquear o campo número em pedidos e orçamentos
            </Label>
            <p className="text-sm text-muted-foreground">
              Quando ativado, o campo número será bloqueado para edição mas permanecerá visível.
              Quando desativado, o campo permanece editável.
            </p>
          </div>
          <Switch
            id="lock-number-fields"
            checked={lockNumberFields}
            onCheckedChange={setLockNumberFields}
          />
        </div>
      </CardContent>
    </Card>
  )
}