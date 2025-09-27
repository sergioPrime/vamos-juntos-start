import React, { useState, useEffect } from 'react';
import { Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAppointmentTypes, type AppointmentType, type AppointmentTypeFormData } from '@/hooks/useAppointmentTypes';

interface AppointmentTypeFormProps {
  appointmentType?: AppointmentType | null;
  onClose: () => void;
}

export function AppointmentTypeForm({ appointmentType, onClose }: AppointmentTypeFormProps) {
  const { createAppointmentType, updateAppointmentType } = useAppointmentTypes();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<AppointmentTypeFormData>({
    name: '',
  });

  useEffect(() => {
    if (appointmentType) {
      setFormData({
        name: appointmentType.name,
      });
    }
  }, [appointmentType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (appointmentType) {
        await updateAppointmentType(appointmentType.id, formData);
      } else {
        await createAppointmentType(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving appointment type:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof AppointmentTypeFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <DialogTitle>
                {appointmentType ? 'Editar Tipo de Compromisso' : 'Novo Tipo de Compromisso'}
              </DialogTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Ex: Visita, Ligação, Reunião..."
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}