import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAccessRequests } from '@/hooks/useAccessRequests';
import { ModuleKey, PermissionType, MODULES } from '@/constants/permissions';
import { Loader2, Send } from 'lucide-react';

interface RequestAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultModuleKey?: ModuleKey;
  defaultPermission?: PermissionType;
}

export function RequestAccessDialog({ 
  open, 
  onOpenChange,
  defaultModuleKey,
  defaultPermission
}: RequestAccessDialogProps) {
  const { toast } = useToast();
  const { createRequest, loading } = useAccessRequests();

  const [moduleKey, setModuleKey] = useState<ModuleKey | ''>(defaultModuleKey || '');
  const [permissions, setPermissions] = useState({
    can_create: defaultPermission === 'create',
    can_read: defaultPermission === 'read' || !defaultPermission,
    can_update: defaultPermission === 'update',
    can_delete: defaultPermission === 'delete',
  });
  const [justification, setJustification] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!moduleKey) {
      toast({
        title: 'Módulo não selecionado',
        description: 'Por favor, selecione um módulo.',
        variant: 'destructive',
      });
      return;
    }

    if (!Object.values(permissions).some(v => v)) {
      toast({
        title: 'Nenhuma permissão selecionada',
        description: 'Por favor, selecione pelo menos uma permissão.',
        variant: 'destructive',
      });
      return;
    }

    if (!justification.trim()) {
      toast({
        title: 'Justificativa obrigatória',
        description: 'Por favor, forneça uma justificativa para sua solicitação.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createRequest({
        module_key: moduleKey,
        permissions,
        justification: justification.trim(),
      });

      toast({
        title: 'Solicitação enviada!',
        description: 'Sua solicitação foi enviada ao administrador e será analisada em breve.',
      });

      // Reset form
      setModuleKey('');
      setPermissions({
        can_create: false,
        can_read: true,
        can_update: false,
        can_delete: false,
      });
      setJustification('');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar solicitação:', error);
      toast({
        title: 'Erro ao enviar solicitação',
        description: 'Não foi possível enviar sua solicitação. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Solicitar Acesso</DialogTitle>
          <DialogDescription>
            Preencha o formulário abaixo para solicitar acesso a um módulo. 
            Sua solicitação será analisada por um administrador.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seleção de Módulo */}
          <div className="space-y-2">
            <Label htmlFor="module">Módulo *</Label>
            <Select value={moduleKey} onValueChange={(value) => setModuleKey(value as ModuleKey)}>
              <SelectTrigger id="module">
                <SelectValue placeholder="Selecione um módulo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MODULES).map(([key, module]) => (
                  <SelectItem key={key} value={key}>
                    {module.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Permissões */}
          <div className="space-y-3">
            <Label>Permissões Solicitadas *</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="can_read"
                  checked={permissions.can_read}
                  onCheckedChange={(checked) =>
                    setPermissions({ ...permissions, can_read: checked as boolean })
                  }
                />
                <label htmlFor="can_read" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Visualizar (Leitura)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="can_create"
                  checked={permissions.can_create}
                  onCheckedChange={(checked) =>
                    setPermissions({ ...permissions, can_create: checked as boolean })
                  }
                />
                <label htmlFor="can_create" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Criar
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="can_update"
                  checked={permissions.can_update}
                  onCheckedChange={(checked) =>
                    setPermissions({ ...permissions, can_update: checked as boolean })
                  }
                />
                <label htmlFor="can_update" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Editar
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="can_delete"
                  checked={permissions.can_delete}
                  onCheckedChange={(checked) =>
                    setPermissions({ ...permissions, can_delete: checked as boolean })
                  }
                />
                <label htmlFor="can_delete" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Excluir
                </label>
              </div>
            </div>
          </div>

          {/* Justificativa */}
          <div className="space-y-2">
            <Label htmlFor="justification">Justificativa *</Label>
            <Textarea
              id="justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Por favor, explique por que você precisa deste acesso..."
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              Seja específico sobre como você usará este acesso e por que ele é necessário.
            </p>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Solicitar
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
