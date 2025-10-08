import React, { useState } from 'react';
import { Clock, Calendar, Volume2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { useOverdueAppointments } from '@/hooks/useOverdueAppointments';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { AppointmentForm } from './AppointmentForm';
import { type Appointment } from '@/hooks/useAppointments';

export function OverdueNotifications() {
  const { overdueAppointments, overdueCount, refreshCheck } = useOverdueAppointments();
  const [isOpen, setIsOpen] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const navigate = useNavigate();

  const handleViewAllAppointments = () => {
    setIsOpen(false);
    navigate('/cadastros/agendamentos');
  };

  const handleCreateAppointment = () => {
    setEditingAppointment(null);
    setShowAppointmentForm(true);
    setIsOpen(false);
  };

  const handleCloseForm = () => {
    setShowAppointmentForm(false);
    setEditingAppointment(null);
    refreshCheck(); // Refresh to update the list
  };

  const testNotificationSound = async () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume audio context if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
      console.log('Test notification sound played successfully');
    } catch (error) {
      console.warn('Failed to play test sound:', error);
    }
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Clock className="h-5 w-5" />
            {overdueCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {overdueCount > 99 ? '99+' : overdueCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-80 bg-background border shadow-lg">
          <DropdownMenuLabel className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-destructive" />
              Agendamentos
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleCreateAppointment}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <div className="max-h-96 overflow-y-auto">
            {overdueAppointments.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum compromisso atrasado</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 w-full"
                  onClick={handleCreateAppointment}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Agendamento
                </Button>
              </div>
            ) : (
              <div className="space-y-2 p-2">
                {overdueAppointments.map((appointment) => (
                  <Card key={appointment.id} className="border-l-4 border-l-destructive">
                    <CardContent className="p-3">
                      <div className="space-y-1">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm leading-tight">
                            {appointment.title}
                          </h4>
                          <Badge variant="destructive" className="text-xs">
                            {appointment.overdueDays === 0 
                              ? 'Hoje' 
                              : `${appointment.overdueDays}d atrasado`
                            }
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {format(new Date(appointment.appointment_date), 'dd/MM/yyyy', { locale: ptBR })} às{' '}
                            {format(new Date(`2000-01-01T${appointment.appointment_time}`), 'HH:mm')}
                          </span>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          Responsável: {appointment.responsible}
                        </div>
                        
                        {appointment.notes && (
                          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                            {appointment.notes}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          {overdueAppointments.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="p-2 space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleCreateAppointment}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Agendamento
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleViewAllAppointments}
                >
                  Ver todas as notificações
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full flex items-center gap-2"
                  onClick={testNotificationSound}
                >
                  <Volume2 className="h-4 w-4" />
                  Testar som
                </Button>
              </div>
            </>
          )}
          
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Appointment Form Modal */}
      {showAppointmentForm && (
        <AppointmentForm
          appointment={editingAppointment}
          onClose={handleCloseForm}
        />
      )}
    </>
  );
}