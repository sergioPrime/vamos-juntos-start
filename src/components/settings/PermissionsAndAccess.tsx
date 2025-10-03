import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MembersTab } from './MembersTab'
import { RoleManagement } from './RoleManagement'
import { UserPermissionsMatrix } from '@/components/permissions/UserPermissionsMatrix'
import { Users, Shield, Lock } from 'lucide-react'

export function PermissionsAndAccess() {
  return (
    <Tabs defaultValue="members" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="members" className="gap-2">
          <Users className="w-4 h-4" />
          Membros por Organização
        </TabsTrigger>
        <TabsTrigger value="roles" className="gap-2">
          <Shield className="w-4 h-4" />
          Permissões Globais
        </TabsTrigger>
        <TabsTrigger value="modules" className="gap-2">
          <Lock className="w-4 h-4" />
          Permissões por Módulo
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="members" className="mt-6">
        <MembersTab />
      </TabsContent>
      
      <TabsContent value="roles" className="mt-6">
        <RoleManagement />
      </TabsContent>
      
      <TabsContent value="modules" className="mt-6">
        <UserPermissionsMatrix />
      </TabsContent>
    </Tabs>
  )
}