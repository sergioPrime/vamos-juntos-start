import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OrganizationsTab } from './OrganizationsTab'
import { MembersTab } from './MembersTab'

export function PermissionsAndAccess() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissões e Acessos</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="empresas" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="empresas">Empresas</TabsTrigger>
            <TabsTrigger value="membros">Membros</TabsTrigger>
          </TabsList>
          
          <TabsContent value="empresas" className="mt-6">
            <OrganizationsTab />
          </TabsContent>
          
          <TabsContent value="membros" className="mt-6">
            <MembersTab />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}