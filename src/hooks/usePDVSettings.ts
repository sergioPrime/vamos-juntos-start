import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PDVSettings {
  auto_emit_nfce: boolean;
  print_after_emit: boolean;
  require_customer_data: boolean;
  default_payment_method: string;
}

const DEFAULT_SETTINGS: PDVSettings = {
  auto_emit_nfce: false,
  print_after_emit: true,
  require_customer_data: false,
  default_payment_method: 'dinheiro',
};

/**
 * Hook for managing PDV settings related to NFC-e
 */
export function usePDVSettings(orgId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get PDV settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['pdv-settings', orgId],
    queryFn: async (): Promise<PDVSettings> => {
      // For now, use localStorage
      // In production, should be stored in database per organization
      const stored = localStorage.getItem(`pdv-settings-${orgId}`);
      
      if (stored) {
        return JSON.parse(stored);
      }

      return DEFAULT_SETTINGS;
    },
    enabled: !!orgId,
  });

  // Update PDV settings
  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<PDVSettings>) => {
      const currentSettings = settings || DEFAULT_SETTINGS;
      const updated = { ...currentSettings, ...newSettings };
      
      // Save to localStorage
      localStorage.setItem(`pdv-settings-${orgId}`, JSON.stringify(updated));
      
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdv-settings', orgId] });
      toast({
        title: "Configurações salvas",
        description: "As configurações do PDV foram atualizadas",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  return {
    settings: settings || DEFAULT_SETTINGS,
    isLoading,
    updateSettings: updateSettings.mutate,
    isUpdating: updateSettings.isPending,
  };
}
