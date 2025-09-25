import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Plus, FileText, Calculator, User, MoreHorizontal, LogOut, Moon, Sun, Zap, Shield } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { AlertNotificationBell } from "@/components/inventory/AlertNotificationBell"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { UserProfileDialog } from "@/components/UserProfileDialog"
import { useAuth } from "@/hooks/useAuth"
import { NotificationCenter } from "@/components/dashboard/NotificationCenter"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "@/hooks/useTheme"
import { useSuperAdmin } from "@/hooks/useSuperAdmin"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function AppHeader() {
  const navigate = useNavigate()
  const { signOut, user } = useAuth()
  const { toast } = useToast()
  const { theme, toggleTheme } = useTheme()
  const { isSuperAdmin } = useSuperAdmin()
  const [showProfile, setShowProfile] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      })
      navigate("/")
    } catch (error) {
      toast({
        title: "Erro no logout",
        description: "Ocorreu um erro ao tentar desconectar.",
        variant: "destructive",
      })
    }
  }

  return (
    <TooltipProvider>
      <header className="fixed top-0 left-0 right-0 h-14 sm:h-16 border-b bg-background/80 backdrop-blur-sm flex items-center justify-between px-3 sm:px-4 lg:px-6 shrink-0 z-40">
        <div className="flex items-center gap-2 sm:gap-4">
          <SidebarTrigger />
          <h1 className="font-semibold text-sm sm:text-base lg:text-lg truncate">
            Vamos Juntos
          </h1>
        </div>
        
        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={() => navigate("/finance/receivables")}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Cobrança Pix</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline"
                onClick={() => navigate("/pdv")}
                size="icon"
              >
                <Zap className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>PDV</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline"
                onClick={() => navigate("/nfse")}
                size="icon"
              >
                <FileText className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Emitir NFS-e</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline"
                onClick={() => navigate("/quotes")}
                size="icon"
              >
                <Calculator className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Orçamento</p>
            </TooltipContent>
          </Tooltip>
          
          {/* Notification Center */}
          <NotificationCenter />
          
          {/* Alert Notification Bell */}
          <AlertNotificationBell />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setShowProfile(true)}>
              <User className="h-4 w-4 mr-2" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center space-x-2">
                  {theme === 'dark' ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                  <span className="text-sm">Modo Dark</span>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                />
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isSuperAdmin && (
              <>
                <DropdownMenuItem onClick={() => navigate("/admin")}>
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

        {/* Mobile Actions */}
        <div className="flex lg:hidden items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={() => navigate("/finance/receivables")}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Cobrança Pix</p>
            </TooltipContent>
          </Tooltip>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate("/pdv")}>
              <Zap className="h-4 w-4 mr-2" />
              PDV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/nfse")}>
              <FileText className="h-4 w-4 mr-2" />
              Emitir NFS-e
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/quotes")}>
              <Calculator className="h-4 w-4 mr-2" />
              Orçamento
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowProfile(true)}>
              <User className="h-4 w-4 mr-2" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {theme === 'dark' ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                  <span className="text-sm">Modo Dark</span>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                />
              </div>
            </div>
            <DropdownMenuSeparator />
            {isSuperAdmin && (
              <>
                <DropdownMenuItem onClick={() => navigate("/admin")}>
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <UserProfileDialog 
          open={showProfile} 
          onOpenChange={setShowProfile}
        />
      </header>
    </TooltipProvider>
  )
}