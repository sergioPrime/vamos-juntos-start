import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MembersTab } from './MembersTab'

export function PermissionsAndAccess() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissões e Acessos</CardTitle>
      </CardHeader>
      <CardContent>
        <MembersTab />
      </CardContent>
    </Card>
  )
}