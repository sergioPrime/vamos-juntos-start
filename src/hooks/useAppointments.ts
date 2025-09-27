import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from '@/hooks/use-toast';

export interface Appointment {
  id: string;
  org_id: string;
  title: string;
  responsible: string;
  appointment_date: string;
  appointment_time: string;
  is_task: boolean;
  is_completed: boolean;
  customer_id?: string;
  opportunity?: string;
  appointment_type_id?: string;
  remind_responsible: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  appointment_types?: {
    name: string;
  };
}

export interface AppointmentFormData {
  title: string;
  responsible: string;
  appointment_date: string;
  appointment_time: string;
  is_task: boolean;
  is_completed?: boolean;
  customer_id?: string;
  opportunity?: string;
  appointment_type_id?: string;
  remind_responsible: boolean;
  notes?: string;
}

export const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentOrg } = useOrganization();

  const fetchAppointments = async () => {
    if (!currentOrg?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          appointment_types(name)
        `)
        .eq('org_id', currentOrg.id)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar agendamentos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAppointment = async (appointmentData: AppointmentFormData) => {
    if (!currentOrg?.id) return null;

    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          ...appointmentData,
          org_id: currentOrg.id,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Agendamento criado com sucesso",
      });

      fetchAppointments();
      return data;
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar agendamento",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateAppointment = async (id: string, appointmentData: Partial<AppointmentFormData>) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update(appointmentData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Agendamento atualizado com sucesso",
      });

      fetchAppointments();
      return true;
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar agendamento",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Agendamento excluído com sucesso",
      });

      fetchAppointments();
      return true;
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir agendamento",
        variant: "destructive",
      });
      return false;
    }
  };

  const getAppointmentStatus = (appointment: Appointment) => {
    if (!appointment.is_task) return 'not_task';
    
    const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
    const now = new Date();
    
    if (appointment.is_completed) return 'completed';
    if (appointmentDateTime < now) return 'overdue';
    return 'pending';
  };

  useEffect(() => {
    fetchAppointments();
  }, [currentOrg?.id]);

  return {
    appointments,
    loading,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointmentStatus,
    refetch: fetchAppointments,
  };
};