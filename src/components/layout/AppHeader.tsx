import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Plus, FileText, Calculator, User } from "lucide-react"
import { useNavigate } from "react-router-dom"

export function AppHeader() {
  const navigate = useNavigate()

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          onClick={() => navigate("/charges/new")}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Cobrança Pix
        </Button>
        
        <Button 
          variant="outline"
          onClick={() => navigate("/nfse")}
        >
          <FileText className="h-4 w-4 mr-2" />
          Emitir NFS-e
        </Button>
        
        <Button 
          variant="outline"
          onClick={() => navigate("/quotes/new")}
        >
          <Calculator className="h-4 w-4 mr-2" />
          Orçamento
        </Button>
        
        <Button variant="ghost" size="icon">
          <User className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}