import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Plus, FileText, Calculator, User, MoreHorizontal, LogOut, Moon, Sun, Zap } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
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
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "@/hooks/useTheme"

export function AppHeader() {
  const navigate = useNavigate()
  const { signOut, user } = useAuth()
  const { toast } = useToast()
  const { theme, toggleTheme } = useTheme()
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
    <header className="h-14 sm:h-16 border-b bg-background flex items-center justify-between px-3 sm:px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-2 sm:gap-4">
        <SidebarTrigger />
        <h1 className="font-semibold text-sm sm:text-base lg:text-lg truncate">
          Vamos Juntos
        </h1>
      </div>
      
      {/* Desktop Actions */}
      <div className="hidden lg:flex items-center gap-2">
        <Button 
          onClick={() => navigate("/finance/receivables")}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Cobrança Pix
        </Button>
        
        <Button 
          variant="outline"
          onClick={() => navigate("/pdv")}
          size="sm"
        >
          <Zap className="h-4 w-4 mr-2" />
          PDV
        </Button>
        
        <Button 
          variant="outline"
          onClick={() => navigate("/nfse")}
          size="sm"
        >
          <FileText className="h-4 w-4 mr-2" />
          Emitir NFS-e
        </Button>
        
        <Button 
          variant="outline"
          onClick={() => navigate("/quotes")}
          size="sm"
        >
          <Calculator className="h-4 w-4 mr-2" />
          Orçamento
        </Button>
        
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
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile Actions */}
      <div className="flex lg:hidden items-center gap-2">
        <Button 
          onClick={() => navigate("/finance/receivables")}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline ml-2">Pix</span>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
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
  )
}