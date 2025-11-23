import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SystemConfig {
  id: string;
  config_key: string;
  config_value: any;
  description: string | null;
  is_public: boolean;
  updated_at: string;
  updated_by: string | null;
}

export function useSystemConfig() {
  const queryClient = useQueryClient();

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['system-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_config')
        .select('*')
        .order('config_key');

      if (error) throw error;
      return data as SystemConfig[];
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from('system_config')
        .upsert({
          config_key: key,
          config_value: value,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] });
      toast.success('Configuração atualizada com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar configuração: ' + error.message);
    },
  });

  const deleteConfigMutation = useMutation({
    mutationFn: async (key: string) => {
      const { error } = await supabase
        .from('system_config')
        .delete()
        .eq('config_key', key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] });
      toast.success('Configuração removida com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover configuração: ' + error.message);
    },
  });

  return {
    configs,
    isLoading,
    updateConfig: updateConfigMutation.mutate,
    deleteConfig: deleteConfigMutation.mutate,
    isUpdating: updateConfigMutation.isPending,
    isDeleting: deleteConfigMutation.isPending,
  };
}
