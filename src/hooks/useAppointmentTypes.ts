import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from '@/hooks/use-toast';

export interface AppointmentType {
  id: string;
  org_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface AppointmentTypeFormData {
  name: string;
}

export const useAppointmentTypes = () => {
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentOrg } = useOrganization();

  const fetchAppointmentTypes = async () => {
    if (!currentOrg?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appointment_types')
        .select('*')
        .eq('org_id', currentOrg.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setAppointmentTypes(data || []);
    } catch (error) {
      console.error('Error fetching appointment types:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar tipos de compromisso",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAppointmentType = async (typeData: AppointmentTypeFormData) => {
    if (!currentOrg?.id) return null;

    try {
      const { data, error } = await supabase
        .from('appointment_types')
        .insert({
          ...typeData,
          org_id: currentOrg.id,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Tipo de compromisso criado com sucesso",
      });

      fetchAppointmentTypes();
      return data;
    } catch (error) {
      console.error('Error creating appointment type:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar tipo de compromisso",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateAppointmentType = async (id: string, typeData: AppointmentTypeFormData) => {
    try {
      const { error } = await supabase
        .from('appointment_types')
        .update(typeData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Tipo de compromisso atualizado com sucesso",
      });

      fetchAppointmentTypes();
      return true;
    } catch (error) {
      console.error('Error updating appointment type:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar tipo de compromisso",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteAppointmentType = async (id: string) => {
    try {
      const { error } = await supabase
        .from('appointment_types')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Tipo de compromisso excluído com sucesso",
      });

      fetchAppointmentTypes();
      return true;
    } catch (error) {
      console.error('Error deleting appointment type:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir tipo de compromisso",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchAppointmentTypes();
  }, [currentOrg?.id]);

  return {
    appointmentTypes,
    loading,
    createAppointmentType,
    updateAppointmentType,
    deleteAppointmentType,
    refetch: fetchAppointmentTypes,
  };
};