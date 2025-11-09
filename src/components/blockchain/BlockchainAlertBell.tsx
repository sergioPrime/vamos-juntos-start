import { useBlockchainAlerts } from '@/hooks/useBlockchainAlerts'
import { Button } from '@/components/ui/button'
import { Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function BlockchainAlertBell() {
  const { unreadCount } = useBlockchainAlerts()
  const navigate = useNavigate()

  if (unreadCount === 0) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="relative"
            onClick={() => navigate('/settings/blockchain')}
          >
            <Shield className="h-4 w-4 text-red-500 animate-pulse" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">
            {unreadCount} {unreadCount === 1 ? 'alerta' : 'alertas'} de segurança blockchain
          </p>
          <p className="text-xs text-muted-foreground">
            Clique para ver detalhes
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
