import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Plus, FileText, Calculator, User, MoreHorizontal } from "lucide-react"
import { useNavigate } from "react-router-dom"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function AppHeader() {
  const navigate = useNavigate()

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
        
        <Button variant="ghost" size="icon">
          <User className="h-4 w-4" />
        </Button>
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
            <DropdownMenuItem onClick={() => navigate("/nfse")}>
              <FileText className="h-4 w-4 mr-2" />
              Emitir NFS-e
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/quotes")}>
              <Calculator className="h-4 w-4 mr-2" />
              Orçamento
            </DropdownMenuItem>
            <DropdownMenuItem>
              <User className="h-4 w-4 mr-2" />
              Perfil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}