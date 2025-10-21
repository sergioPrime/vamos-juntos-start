import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldAlert, ArrowLeft, Mail } from 'lucide-react';
import { useState } from 'react';
import { RequestAccessDialog } from '@/components/permissions/RequestAccessDialog';

export default function AccessDenied() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  const state = location.state as any;
  const moduleKey = state?.moduleKey;
  const permission = state?.permission;

  const permissionText = permission
    ? {
        create: 'criar',
        read: 'visualizar',
        update: 'editar',
        delete: 'excluir',
      }[permission]
    : 'acessar';

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            {/* Ícone */}
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-6">
                <ShieldAlert className="h-16 w-16 text-destructive" />
              </div>
            </div>

            {/* Título */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Acesso Negado</h1>
              <p className="text-muted-foreground">
                {moduleKey && permission ? (
                  <>
                    Você não tem permissão para <strong>{permissionText}</strong>{' '}
                    no módulo <strong>{moduleKey}</strong>.
                  </>
                ) : (
                  'Você não tem permissão para acessar esta página.'
                )}
              </p>
            </div>

            {/* Descrição adicional */}
            <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground">
              <p>
                Se você acredita que deveria ter acesso a este recurso,
                entre em contato com seu administrador ou solicite acesso
                através do botão abaixo.
              </p>
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate('/dashboard')} size="lg">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Dashboard
              </Button>

              {moduleKey && (
                <Button
                  variant="outline"
                  onClick={() => setShowRequestDialog(true)}
                  size="lg"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Solicitar Acesso
                </Button>
              )}
            </div>

            {/* Informação de contato */}
            <p className="text-xs text-muted-foreground">
              Precisa de ajuda?{' '}
              <a href="mailto:suporte@empresa.com" className="underline hover:text-foreground">
                Entre em contato com o suporte
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {moduleKey && (
        <RequestAccessDialog
          open={showRequestDialog}
          onOpenChange={setShowRequestDialog}
          defaultModuleKey={moduleKey}
          defaultPermission={permission}
        />
      )}
    </div>
  );
}
