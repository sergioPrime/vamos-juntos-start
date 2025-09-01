import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SubscriptionPlans } from "@/components/subscription/SubscriptionPlans"
import { PermissionsAndAccess } from "@/components/settings/PermissionsAndAccess"
import { CompaniesTab } from "@/components/settings/CompaniesTab"
import { APIIntegrations } from "@/components/integrations/APIIntegrations"

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState("permissions")

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setSearchParams(value === "permissions" ? {} : { tab: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="permissions">Permissões</TabsTrigger>
          <TabsTrigger value="companies">Multi-empresas</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="subscription">Planos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="permissions" className="space-y-6">
          <PermissionsAndAccess />
        </TabsContent>
        
        <TabsContent value="companies" className="space-y-6">
          <CompaniesTab />
        </TabsContent>
        
        <TabsContent value="integrations" className="space-y-6">
          <APIIntegrations />
        </TabsContent>
        
        <TabsContent value="subscription" className="space-y-6">
          <SubscriptionPlans />
        </TabsContent>
      </Tabs>
    </div>
  )
}