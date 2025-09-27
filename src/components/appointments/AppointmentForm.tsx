import React, { useState, useEffect } from 'react';
import { Calendar, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAppointments, type Appointment, type AppointmentFormData } from '@/hooks/useAppointments';
import { useAppointmentTypes } from '@/hooks/useAppointmentTypes';
import { usePessoas } from '@/hooks/usePessoas';

interface AppointmentFormProps {
  appointment?: Appointment | null;
  onClose: () => void;
}

export function AppointmentForm({ appointment, onClose }: AppointmentFormProps) {
  const { createAppointment, updateAppointment } = useAppointments();
  const { appointmentTypes } = useAppointmentTypes();
  const { pessoas } = usePessoas();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<AppointmentFormData>({
    title: '',
    responsible: '',
    appointment_date: '',
    appointment_time: '',
    is_task: false,
    is_completed: false,
    customer_id: '',
    opportunity: '',
    appointment_type_id: '',
    remind_responsible: false,
    notes: '',
  });

  useEffect(() => {
    if (appointment) {
      setFormData({
        title: appointment.title,
        responsible: appointment.responsible,
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
        is_task: appointment.is_task,
        is_completed: appointment.is_completed,
        customer_id: appointment.customer_id || '',
        opportunity: appointment.opportunity || '',
        appointment_type_id: appointment.appointment_type_id || '',
        remind_responsible: appointment.remind_responsible,
        notes: appointment.notes || '',
      });
    }
  }, [appointment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (appointment) {
        await updateAppointment(appointment.id, formData);
      } else {
        await createAppointment(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof AppointmentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Filter customers only - using pessoas data directly since they represent all people
  const customers = pessoas;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <DialogTitle>
                {appointment ? 'Editar Agendamento' : 'Novo Agendamento'}
              </DialogTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Primeira linha - Responsável, Data, Hora, É uma tarefa? */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="responsible">Responsável *</Label>
              <Input
                id="responsible"
                value={formData.responsible}
                onChange={(e) => handleChange('responsible', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="appointment_date">Data *</Label>
              <Input
                id="appointment_date"
                type="date"
                value={formData.appointment_date}
                onChange={(e) => handleChange('appointment_date', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="appointment_time">Hora *</Label>
              <Input
                id="appointment_time"
                type="time"
                value={formData.appointment_time}
                onChange={(e) => handleChange('appointment_time', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2 flex flex-col">
              <Label htmlFor="is_task" className="flex items-center gap-2">
                É uma tarefa?
              </Label>
              <Switch
                id="is_task"
                checked={formData.is_task}
                onCheckedChange={(checked) => handleChange('is_task', checked)}
              />
            </div>
          </div>

          {/* Segunda linha - Oportunidade, Cliente, Tipo de Compromisso, Lembrar o responsável? */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="opportunity">Oportunidade</Label>
              <Input
                id="opportunity"
                value={formData.opportunity}
                onChange={(e) => handleChange('opportunity', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customer_id">Cliente</Label>
              <Select
                value={formData.customer_id}
                onValueChange={(value) => handleChange('customer_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.nome_fantasia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="appointment_type_id">Tipo de Compromisso</Label>
              <Select
                value={formData.appointment_type_id}
                onValueChange={(value) => handleChange('appointment_type_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {appointmentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex flex-col">
              <Label htmlFor="remind_responsible">
                Lembrar o responsável?
              </Label>
              <Switch
                id="remind_responsible"
                checked={formData.remind_responsible}
                onCheckedChange={(checked) => handleChange('remind_responsible', checked)}
              />
            </div>
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
            />
          </div>

          {/* Anotação */}
          <div className="space-y-2">
            <Label htmlFor="notes">Anotação</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={4}
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Agendamento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}