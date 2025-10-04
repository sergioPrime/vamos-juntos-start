import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Trash2, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface UserPhotoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  avatarUrl?: string | null;
  onPhotoUpdate?: (url: string | null) => void;
}

export function UserPhotoDialog({ open, onOpenChange, avatarUrl, onPhotoUpdate }: UserPhotoDialogProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl || null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione uma imagem JPG, JPEG ou PNG.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (16MB)
    const maxSize = 16 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido é 16MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('avatars').remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setPreviewUrl(publicUrl);
      onPhotoUpdate?.(publicUrl);

      toast({
        title: "Foto atualizada",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Erro ao enviar foto",
        description: "Não foi possível atualizar sua foto de perfil.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!user || !avatarUrl) return;

    setIsUploading(true);

    try {
      // Delete from storage
      const filePath = avatarUrl.split('/').pop();
      if (filePath) {
        await supabase.storage.from('avatars').remove([`${user.id}/${filePath}`]);
      }

      // Update profile to remove avatar URL
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (error) throw error;

      setPreviewUrl(null);
      onPhotoUpdate?.(null);

      toast({
        title: "Foto removida",
        description: "Sua foto de perfil foi removida com sucesso.",
      });
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast({
        title: "Erro ao remover foto",
        description: "Não foi possível remover sua foto de perfil.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Foto do Usuário</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-6">
          <Avatar className="h-32 w-32">
            <AvatarImage src={previewUrl || undefined} />
            <AvatarFallback className="text-2xl">
              {user?.email ? getInitials(user.email) : <Camera className="h-12 w-12" />}
            </AvatarFallback>
          </Avatar>

          <div className="flex gap-3">
            <Button
              onClick={() => document.getElementById('photo-upload')?.click()}
              disabled={isUploading}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Selecionar Foto
            </Button>

            {previewUrl && (
              <Button
                variant="destructive"
                onClick={handleDeletePhoto}
                disabled={isUploading}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Remover
              </Button>
            )}
          </div>

          <input
            id="photo-upload"
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="text-sm text-muted-foreground border-l-2 border-primary pl-4">
            <p>Formatos aceitos: JPG, JPEG, PNG</p>
            <p>Tamanho máximo: 16MB</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
