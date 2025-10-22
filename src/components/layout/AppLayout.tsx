import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { AppHeader } from "./AppHeader"
import { SubscriptionBlocker } from "@/components/subscription/SubscriptionBlocker"
import { ExpirationAlert } from "@/components/subscription/ExpirationAlert"
import backgroundWallpaper from "@/assets/background-wallpaper.jpg"

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
      <div 
        className="min-h-screen flex w-full relative"
        style={{
          backgroundImage: `url(${backgroundWallpaper})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0"> {/* min-w-0 prevents overflow */}
          <AppHeader />
          <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto" style={{ paddingTop: 'var(--page-top-offset)' }}>
            <ExpirationAlert />
            {children}
          </main>
        </div>
        <SubscriptionBlocker />
      </div>
    </SidebarProvider>
  )
}