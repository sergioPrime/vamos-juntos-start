import React, { useState } from 'react';
import { Calendar, List, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppointmentForm } from '@/components/appointments/AppointmentForm';
import { AppointmentsList } from '@/components/appointments/AppointmentsList';
import { AppointmentCalendar } from '@/components/appointments/AppointmentCalendar';
import { useAppointments } from '@/hooks/useAppointments';
import type { Appointment } from '@/hooks/useAppointments';

export default function Appointments() {
  const [showForm, setShowForm] = useState(false);
  const [showList, setShowList] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const { appointments, loading } = useAppointments();

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingAppointment(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Agenda de Tarefas</h1>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowList(true)}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Consultar Agendamentos
          </Button>
          
          <Button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo
          </Button>
        </div>
      </div>

      {/* Legenda de Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500 hover:bg-green-600">
                Tarefa concluída
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500 hover:bg-blue-600">
                Tarefa não concluída
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-red-500 hover:bg-red-600">
                Tarefa vencida
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                Não é tarefa
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Abas de Visualização */}
      <Tabs defaultValue="month" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="month">Mês</TabsTrigger>
          <TabsTrigger value="week">Semana</TabsTrigger>
          <TabsTrigger value="day">Dia</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
        </TabsList>
        
        <TabsContent value="month" className="mt-6">
          <AppointmentCalendar 
            appointments={appointments}
            view="month"
            onEditAppointment={handleEditAppointment}
          />
        </TabsContent>
        
        <TabsContent value="week" className="mt-6">
          <AppointmentCalendar 
            appointments={appointments}
            view="week"
            onEditAppointment={handleEditAppointment}
          />
        </TabsContent>
        
        <TabsContent value="day" className="mt-6">
          <AppointmentCalendar 
            appointments={appointments}
            view="day"
            onEditAppointment={handleEditAppointment}
          />
        </TabsContent>
        
        <TabsContent value="list" className="mt-6">
          <AppointmentsList 
            appointments={appointments}
            onEditAppointment={handleEditAppointment}
          />
        </TabsContent>
      </Tabs>

      {/* Modal de Formulário */}
      {showForm && (
        <AppointmentForm
          appointment={editingAppointment}
          onClose={handleFormClose}
        />
      )}

      {/* Modal de Lista */}
      {showList && (
        <AppointmentsList
          appointments={appointments}
          onEditAppointment={handleEditAppointment}
          onClose={() => setShowList(false)}
          isModal={true}
        />
      )}
    </div>
  );
}