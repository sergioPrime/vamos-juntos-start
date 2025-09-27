import React, { useState } from 'react';
import { Settings, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AppointmentTypeForm } from '@/components/appointments/AppointmentTypeForm';
import { useAppointmentTypes } from '@/hooks/useAppointmentTypes';
import type { AppointmentType } from '@/hooks/useAppointmentTypes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AppointmentTypes() {
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState<AppointmentType | null>(null);
  const { appointmentTypes, loading, deleteAppointmentType } = useAppointmentTypes();

  const handleEdit = (type: AppointmentType) => {
    setEditingType(type);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este tipo de compromisso?')) {
      await deleteAppointmentType(id);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingType(null);
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Tipos de Compromisso</h1>
        </div>
        
        <Button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Tipo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Tipos de Compromisso</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Tipo</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead>Última Alteração</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointmentTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell>
                    {format(new Date(type.created_at), 'dd/MM/yyyy HH:mm', {
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell>
                    {format(new Date(type.updated_at), 'dd/MM/yyyy HH:mm', {
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(type)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(type.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {appointmentTypes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nenhum tipo de compromisso cadastrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {showForm && (
        <AppointmentTypeForm
          appointmentType={editingType}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}