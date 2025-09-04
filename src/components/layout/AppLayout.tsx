import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { AppHeader } from "./AppHeader"
import { SubscriptionBlocker } from "@/components/subscription/SubscriptionBlocker"
import { ExpirationAlert } from "@/components/subscription/ExpirationAlert"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider
      defaultOpen={true} // Keep sidebar open by default
      style={{
        "--sidebar-width": "240px",
        "--sidebar-width-mobile": "280px",
      } as React.CSSProperties}
    >
      <div className="min-h-screen flex w-full relative">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0"> {/* min-w-0 prevents overflow */}
          <AppHeader />
          <main className="flex-1 p-3 sm:p-4 lg:p-6 pt-[4.5rem] sm:pt-20 bg-muted/30 overflow-auto">
            <ExpirationAlert />
            {children}
          </main>
        </div>
        <SubscriptionBlocker />
      </div>
    </SidebarProvider>
  )
}