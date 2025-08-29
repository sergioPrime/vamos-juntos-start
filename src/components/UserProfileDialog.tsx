import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/hooks/useAuth"
import { format } from "date-fns"
import { User, Mail, Calendar, Shield } from "lucide-react"

interface UserProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserProfileDialog({ open, onOpenChange }: UserProfileDialogProps) {
  const { user } = useAuth()

  if (!user) return null

  const getInitials = (email: string) => {
    return email.split('@')[0].substring(0, 2).toUpperCase()
  }

  const getUserRole = () => {
    return user.user_metadata?.role || 'Usuário'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Perfil do Usuário
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Avatar e informações básicas */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg font-semibold bg-primary text-primary-foreground">
                {getInitials(user.email || '')}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">
                {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {getUserRole()}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Informações detalhadas */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Cadastrado em</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(user.created_at), 'dd/MM/yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Status da conta</p>
                <Badge 
                  variant={user.email_confirmed_at ? "default" : "destructive"}
                  className="text-xs"
                >
                  {user.email_confirmed_at ? "Verificada" : "Não verificada"}
                </Badge>
              </div>
            </div>

            {user.last_sign_in_at && (
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Último acesso</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(user.last_sign_in_at), 'dd/MM/yyyy às HH:mm')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}