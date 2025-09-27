import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addWeeks, subWeeks, startOfWeek, endOfWeek, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppointments, type Appointment } from '@/hooks/useAppointments';

interface AppointmentCalendarProps {
  appointments: Appointment[];
  view: 'month' | 'week' | 'day';
  onEditAppointment: (appointment: Appointment) => void;
}

export function AppointmentCalendar({ appointments, view, onEditAppointment }: AppointmentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { getAppointmentStatus } = useAppointments();

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

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(appointment => 
      isSameDay(new Date(appointment.appointment_date), date)
    );
  };

  const navigatePrevious = () => {
    switch (view) {
      case 'month':
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case 'day':
        setCurrentDate(subDays(currentDate, 1));
        break;
    }
  };

  const navigateNext = () => {
    switch (view) {
      case 'month':
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case 'day':
        setCurrentDate(addDays(currentDate, 1));
        break;
    }
  };

  const getTitle = () => {
    switch (view) {
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: ptBR });
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
        return `${format(weekStart, 'dd MMM', { locale: ptBR })} - ${format(weekEnd, 'dd MMM yyyy', { locale: ptBR })}`;
      case 'day':
        return format(currentDate, 'dd MMMM yyyy', { locale: ptBR });
    }
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Cabeçalho dos dias da semana */}
        {['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'].map((day) => (
          <div key={day} className="p-2 text-center font-medium text-sm bg-primary text-primary-foreground">
            {day}
          </div>
        ))}
        
        {/* Dias do calendário */}
        {days.map((day) => {
          const dayAppointments = getAppointmentsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          
          return (
            <Card key={day.toISOString()} className={`min-h-[120px] ${!isCurrentMonth ? 'opacity-50' : ''}`}>
              <CardContent className="p-2">
                <div className="text-sm font-medium mb-2">
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayAppointments.map((appointment) => {
                    const status = getAppointmentStatus(appointment);
                    return (
                      <Badge
                        key={appointment.id}
                        className={`text-xs cursor-pointer block w-full text-left ${getStatusColor(status)}`}
                        onClick={() => onEditAppointment(appointment)}
                      >
                        {format(new Date(`2000-01-01T${appointment.appointment_time}`), 'HH:mm')} {appointment.title}
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dayAppointments = getAppointmentsForDay(day);
          
          return (
            <Card key={day.toISOString()} className="min-h-[400px]">
              <CardContent className="p-4">
                <div className="text-center font-medium mb-4">
                  <div className="text-sm text-muted-foreground">
                    {format(day, 'EEE', { locale: ptBR })}
                  </div>
                  <div className="text-lg">
                    {format(day, 'd')}
                  </div>
                </div>
                <div className="space-y-2">
                  {dayAppointments.map((appointment) => {
                    const status = getAppointmentStatus(appointment);
                    return (
                      <Badge
                        key={appointment.id}
                        className={`text-xs cursor-pointer block w-full text-left p-2 ${getStatusColor(status)}`}
                        onClick={() => onEditAppointment(appointment)}
                      >
                        <div>{format(new Date(`2000-01-01T${appointment.appointment_time}`), 'HH:mm')}</div>
                        <div className="font-medium">{appointment.title}</div>
                        <div className="text-xs opacity-90">{appointment.responsible}</div>
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dayAppointments = getAppointmentsForDay(currentDate);
    
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {dayAppointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum agendamento para este dia
              </p>
            ) : (
              dayAppointments.map((appointment) => {
                const status = getAppointmentStatus(appointment);
                return (
                  <div
                    key={appointment.id}
                    className="flex items-start gap-4 p-4 border rounded-lg cursor-pointer hover:bg-accent"
                    onClick={() => onEditAppointment(appointment)}
                  >
                    <div className="text-sm font-mono">
                      {format(new Date(`2000-01-01T${appointment.appointment_time}`), 'HH:mm')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{appointment.title}</h3>
                        <Badge className={`text-xs ${getStatusColor(status)}`}>
                          {status === 'completed' && 'Concluída'}
                          {status === 'pending' && 'Pendente'}
                          {status === 'overdue' && 'Vencida'}
                          {status === 'not_task' && 'Não é tarefa'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Responsável: {appointment.responsible}
                      </p>
                      {appointment.notes && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {appointment.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho de navegação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={navigatePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <h2 className="text-xl font-semibold">{getTitle()}</h2>
        
        <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
          Hoje
        </Button>
      </div>

      {/* Renderização baseada na visualização */}
      {view === 'month' && renderMonthView()}
      {view === 'week' && renderWeekView()}
      {view === 'day' && renderDayView()}
    </div>
  );
}