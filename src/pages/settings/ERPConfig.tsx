import { ERPSettings } from "@/components/settings/ERPSettings"
import { FiscalCertificateConfig } from "@/components/fiscal/FiscalCertificateConfig"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ERPConfig() {
  return (
    <div className="page-container space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações do ERP</h1>
        <p className="text-muted-foreground">Configure as regras e comportamentos do ERP</p>
      </div>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="fiscal">Certificado Fiscal</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <ERPSettings />
        </TabsContent>

        <TabsContent value="fiscal">
          <FiscalCertificateConfig />
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integrações</CardTitle>
              <CardDescription>
                Configure integrações com sistemas externos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Em breve: configurações de integrações com sistemas externos
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}