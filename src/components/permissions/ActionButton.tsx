import { ReactNode } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { ModuleKey, PermissionType } from '@/constants/permissions';

interface ActionButtonProps extends ButtonProps {
  moduleKey: ModuleKey;
  permission: PermissionType;
  children: ReactNode;
  tooltipMessage?: string;
}

export function ActionButton({ 
  moduleKey, 
  permission, 
  children, 
  tooltipMessage,
  disabled,
  ...buttonProps 
}: ActionButtonProps) {
  const { hasPermission, loading } = usePermissionGuard();

  const hasAccess = hasPermission(moduleKey, permission);
  const isDisabled = disabled || !hasAccess || loading;

  const defaultTooltipMessage = `Você não tem permissão para ${
    permission === 'create' ? 'criar' :
    permission === 'update' ? 'editar' :
    permission === 'delete' ? 'excluir' :
    'visualizar'
  } neste módulo`;

  const button = (
    <Button 
      {...buttonProps} 
      disabled={isDisabled}
    >
      {children}
    </Button>
  );

  if (!hasAccess && !loading) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipMessage || defaultTooltipMessage}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
