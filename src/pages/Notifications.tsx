import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';

export default function Notifications() {
  // All users can view their notifications
  
  return (
    <div className="page-container space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notificações</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie todas as suas notificações
        </p>
      </div>

      <NotificationCenter />
    </div>
  );
}
