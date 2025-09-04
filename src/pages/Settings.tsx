import { PermissionsAndAccess } from "@/components/settings/PermissionsAndAccess"
import { CompaniesTab } from "@/components/settings/CompaniesTab"
import { APIIntegrations } from "@/components/integrations/APIIntegrations"
import { ERPSettings } from "@/components/settings/ERPSettings"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4">
        <AccordionItem value="permissions" className="border rounded-lg">
          <AccordionTrigger className="px-6">Permissões e Acessos</AccordionTrigger>
          <AccordionContent className="px-6">
            <PermissionsAndAccess />
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="companies" className="border rounded-lg">
          <AccordionTrigger className="px-6">Empresas</AccordionTrigger>
          <AccordionContent className="px-6">
            <CompaniesTab />
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="integrations" className="border rounded-lg">
          <AccordionTrigger className="px-6">Integrações</AccordionTrigger>
          <AccordionContent className="px-6">
            <APIIntegrations />
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="erp-config" className="border rounded-lg">
          <AccordionTrigger className="px-6">Configurações do ERP</AccordionTrigger>
          <AccordionContent className="px-6">
            <ERPSettings />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}