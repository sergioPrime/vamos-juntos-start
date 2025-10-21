import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Plus, User, MoreHorizontal, LogOut, Moon, Sun, Zap, Shield, Settings, Lock, Link2, Camera, DollarSign, UserCog, ChevronDown, UserPlus, Truck, Package, Wrench, TrendingUp, Sparkles } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { UserPhotoDialog } from "@/components/UserPhotoDialog"
import { UserDataDialog } from "@/components/UserDataDialog"
import { UserCommissionDialog } from "@/components/UserCommissionDialog"
import { UserPasswordDialog } from "@/components/UserPasswordDialog"
import { QuickCustomerDialog } from "@/components/QuickCustomerDialog"
import { supabase } from "@/integrations/supabase/client"
import { AlertNotificationBell } from "@/components/inventory/AlertNotificationBell"
import { OverdueNotifications } from "@/components/appointments/OverdueNotifications"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/hooks/useAuth"
import { NotificationCenter } from "@/components/dashboard/NotificationCenter"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "@/hooks/useTheme"
import { useSuperAdmin } from "@/hooks/useSuperAdmin"
import { useRoleCheck } from "@/hooks/useRoleCheck"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AIAssistantDialog } from "@/components/ai/AIAssistantDialog"

export function AppHeader() {
  const navigate = useNavigate()
  const { signOut, user } = useAuth()
  const { toast } = useToast()
  const { theme, toggleTheme } = useTheme()
  const { isSuperAdmin } = useSuperAdmin()
  const { role } = useRoleCheck()
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false)
  const [dataDialogOpen, setDataDialogOpen] = useState(false)
  const [commissionDialogOpen, setCommissionDialogOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [quickCustomerDialogOpen, setQuickCustomerDialogOpen] = useState(false)
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  
  useEffect(() => {
    if (user?.id) {
      const fetchAvatar = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single()
        
        if (data?.avatar_url) {
          setAvatarUrl(data.avatar_url)
        }
      }
      fetchAvatar()
    }
  }, [user?.id])
  
  const getInitials = (email: string) => {
    return email.split('@')[0].substring(0, 2).toUpperCase()
  }
  
  const getRoleLabel = () => {
    if (role === 'superadmin') return 'Super Admin'
    if (role === 'admin') return 'Administrador'
    return 'Membro Normal'
  }
  
  const appVersion = "3.2.100.0"

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
          <h1 
            className="font-semibold text-sm sm:text-base lg:text-lg truncate cursor-pointer hover:text-primary transition-colors"
            onClick={() => navigate("/dashboard")}
          >
            Vamos Juntos
          </h1>
          
          {/* Botão Atalhos */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 font-medium gap-1"
              >
                ATALHOS
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-background/95 backdrop-blur-sm">
              <DropdownMenuItem 
                onClick={() => setQuickCustomerDialogOpen(true)} 
                className="cursor-pointer"
              >
                <UserPlus className="h-4 w-4 mr-3 text-cyan-400" />
                <span>Novo Cliente</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/suppliers")} className="cursor-pointer">
                <Truck className="h-4 w-4 mr-3 text-cyan-400" />
                <span>Novo Fornecedor</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/products")} className="cursor-pointer">
                <Package className="h-4 w-4 mr-3 text-cyan-400" />
                <span>Novo Produto</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/products")} className="cursor-pointer">
                <Wrench className="h-4 w-4 mr-3 text-cyan-400" />
                <span>Novo Serviço</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/finance/lancamentos")} className="cursor-pointer">
                <TrendingUp className="h-4 w-4 mr-3 text-cyan-400" />
                <span>Novo Lançamento</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setAiDialogOpen(true)}
                className="gap-2 bg-gradient-to-br from-primary to-purple-600 text-white hover:from-primary/90 hover:to-purple-700"
                size="sm"
              >
                <Sparkles className="h-4 w-4" />
                <span>IA</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Assistente Inteligente</p>
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
          
           {/* Notification Center */}
           <NotificationCenter />
           
           {/* Overdue Appointments */}
           <OverdueNotifications />
           
           {/* Alert Notification Bell */}
           <AlertNotificationBell />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Avatar className="h-8 w-8">
                  {avatarUrl && <img src={avatarUrl} alt="Avatar" className="object-cover" />}
                  <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                    {getInitials(user?.email || '')}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <div className="flex flex-col items-center gap-2 p-4">
                <Avatar className="h-16 w-16">
                  {avatarUrl && <img src={avatarUrl} alt="Avatar" className="object-cover" />}
                  <AvatarFallback className="text-lg font-semibold bg-primary text-primary-foreground">
                    {getInitials(user?.email || '')}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <p className="text-sm font-medium">{user?.email}</p>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {getRoleLabel()}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">Versão {appVersion}</p>
                </div>
              </div>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => setPhotoDialogOpen(true)}>
                <Camera className="h-4 w-4 mr-2" />
                Foto Usuário
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setCommissionDialogOpen(true)}>
                <DollarSign className="h-4 w-4 mr-2" />
                Configurações de Comissões
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setDataDialogOpen(true)}>
                <UserCog className="h-4 w-4 mr-2" />
                Alterar meus Dados
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setPasswordDialogOpen(true)}>
                <Lock className="h-4 w-4 mr-2" />
                Alterar Senha
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <Link2 className="h-4 w-4 mr-2" />
                Gerar Link de Acesso Temporário
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
              
              {isSuperAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <Shield className="h-4 w-4 mr-2" />
                    Admin
                  </DropdownMenuItem>
                </>
              )}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair do ERP
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
      </div>

        {/* Mobile Actions */}
        <div className="flex lg:hidden items-center gap-2">
           {/* Overdue Appointments Mobile */}
           <OverdueNotifications />
           
           <Tooltip>
             <TooltipTrigger asChild>
               <Button
                 onClick={() => setAiDialogOpen(true)}
                 className="bg-gradient-to-br from-primary to-purple-600 text-white hover:from-primary/90 hover:to-purple-700"
                 size="icon"
               >
                 <Sparkles className="h-4 w-4" />
               </Button>
             </TooltipTrigger>
             <TooltipContent>
               <p>Assistente IA</p>
             </TooltipContent>
           </Tooltip>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <div className="flex flex-col items-center gap-2 p-4">
                <Avatar className="h-16 w-16">
                  {avatarUrl && <img src={avatarUrl} alt="Avatar" className="object-cover" />}
                  <AvatarFallback className="text-lg font-semibold bg-primary text-primary-foreground">
                    {getInitials(user?.email || '')}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <p className="text-sm font-medium">{user?.email}</p>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {getRoleLabel()}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">Versão {appVersion}</p>
                </div>
              </div>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => navigate("/pdv")}>
                <Zap className="h-4 w-4 mr-2" />
                PDV
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => setPhotoDialogOpen(true)}>
                <Camera className="h-4 w-4 mr-2" />
                Foto Usuário
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setCommissionDialogOpen(true)}>
                <DollarSign className="h-4 w-4 mr-2" />
                Configurações de Comissões
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setDataDialogOpen(true)}>
                <UserCog className="h-4 w-4 mr-2" />
                Alterar meus Dados
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setPasswordDialogOpen(true)}>
                <Lock className="h-4 w-4 mr-2" />
                Alterar Senha
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <Link2 className="h-4 w-4 mr-2" />
                Gerar Link de Acesso Temporário
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
              
              {isSuperAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <Shield className="h-4 w-4 mr-2" />
                    Admin
                  </DropdownMenuItem>
                </>
              )}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair do ERP
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <UserPhotoDialog 
          open={photoDialogOpen} 
          onOpenChange={setPhotoDialogOpen}
          avatarUrl={avatarUrl}
          onPhotoUpdate={setAvatarUrl}
        />
        
        <UserDataDialog
          open={dataDialogOpen}
          onOpenChange={setDataDialogOpen}
        />
        
      <UserCommissionDialog
        open={commissionDialogOpen}
        onOpenChange={setCommissionDialogOpen}
      />
      <UserPasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />
      <QuickCustomerDialog
        open={quickCustomerDialogOpen}
        onOpenChange={setQuickCustomerDialogOpen}
      />
      
      <AIAssistantDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
      />
      </header>
    </TooltipProvider>
  )
}