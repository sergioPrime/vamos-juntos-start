import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MembersTab } from './MembersTab'
import { RoleManagement } from './RoleManagement'
import { Users, Shield } from 'lucide-react'

export function PermissionsAndAccess() {
  return (
    <Tabs defaultValue="members" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="members" className="gap-2">
          <Users className="w-4 h-4" />
          Membros por Organização
        </TabsTrigger>
        <TabsTrigger value="roles" className="gap-2">
          <Shield className="w-4 h-4" />
          Permissões Globais
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="members" className="mt-6">
        <MembersTab />
      </TabsContent>
      
      <TabsContent value="roles" className="mt-6">
        <RoleManagement />
      </TabsContent>
    </Tabs>
  )
}