import React from 'react';
import { Search, X, Edit, CheckCircle, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAppointments, type Appointment } from '@/hooks/useAppointments';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AppointmentsListProps {
  appointments: Appointment[];
  onEditAppointment: (appointment: Appointment) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export function AppointmentsList({ 
  appointments, 
  onEditAppointment, 
  onClose, 
  isModal = false 
}: AppointmentsListProps) {
  const { getAppointmentStatus, updateAppointment, deleteAppointment } = useAppointments();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 hover:bg-green-600';
      case 'pending':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'overdue':
        return 'bg-red-500 hover:bg-red-600';
      case 'not_task':
        return 'bg-gray-500 hover:bg-gray-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluída';
      case 'pending':
        return 'Pendente';
      case 'overdue':
        return 'Vencida';
      case 'not_task':
        return 'Não é tarefa';
      default:
        return 'Desconhecido';
    }
  };

  const handleCompleteAppointment = async (e: React.MouseEvent, appointment: Appointment) => {
    e.stopPropagation();
    await updateAppointment(appointment.id, { is_completed: true });
  };

  const handleDeleteAppointment = async (e: React.MouseEvent, appointmentId: string) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
      await deleteAppointment(appointmentId);
    }
  };

  const content = (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            <CardTitle>Consultar Agendamentos</CardTitle>
          </div>
          {isModal && onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Responsável</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Hora</TableHead>
              <TableHead>Tipo de Compromisso</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Título</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((appointment) => {
              const status = getAppointmentStatus(appointment);
              return (
                <TableRow 
                  key={appointment.id}
                  className="hover:bg-accent"
                >
                  <TableCell className="font-medium">
                    {appointment.responsible}
                  </TableCell>
                  <TableCell>
                    {appointment.customer_id ? 'Cliente vinculado' : '-'}
                  </TableCell>
                  <TableCell>
                    {format(new Date(appointment.appointment_date), 'dd/MM/yyyy', {
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell>
                    {format(new Date(`2000-01-01T${appointment.appointment_time}`), 'HH:mm')}
                  </TableCell>
                  <TableCell>
                    {appointment.appointment_types?.name || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${getStatusColor(status)}`}>
                      {getStatusLabel(status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{appointment.title}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditAppointment(appointment);
                        }}
                        title="Visualizar/Editar"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {status !== 'completed' && appointment.is_task && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={(e) => handleCompleteAppointment(e, appointment)}
                          title="Concluir"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => handleDeleteAppointment(e, appointment.id)}
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {appointments.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Nenhum agendamento encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  if (isModal && onClose) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Consultar Agendamentos</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return content;
}