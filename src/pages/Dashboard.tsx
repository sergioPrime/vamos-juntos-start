import { AlertsSection } from "@/components/dashboard/AlertsSection"

export default function Dashboard() {
  return (
    <div className="page-container space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">
          Dashboard ERP
        </h1>
        <p className="text-xl text-muted-foreground">
          Central de monitoramento e alertas do seu negócio
        </p>
      </div>

      <AlertsSection />
    </div>
  )
}