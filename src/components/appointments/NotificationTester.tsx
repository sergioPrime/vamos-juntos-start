import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, Volume2, TestTube } from 'lucide-react';
import { useAppointments } from '@/hooks/useAppointments';
import { format, addMinutes, subMinutes } from 'date-fns';

export function NotificationTester() {
  const { createAppointment } = useAppointments();
  const [testMinutes, setTestMinutes] = useState(1);

  const createTestOverdueAppointment = async () => {
    const now = new Date();
    const testDate = subMinutes(now, testMinutes);
    
    const testAppointment = {
      title: `Teste - Compromisso vencido há ${testMinutes} minutos`,
      responsible: 'Usuário Teste',
      appointment_date: format(testDate, 'yyyy-MM-dd'),
      appointment_time: format(testDate, 'HH:mm'),
      is_task: true,
      is_completed: false,
      remind_responsible: true,
      notes: 'Este é um compromisso de teste para demonstrar as notificações.',
    };

    await createAppointment(testAppointment);
  };

  const createTestFutureAppointment = async () => {
    const now = new Date();
    const futureDate = addMinutes(now, 1); // 1 minuto no futuro
    
    const testAppointment = {
      title: 'Teste - Compromisso que vencerá em 1 minuto',
      responsible: 'Usuário Teste',
      appointment_date: format(futureDate, 'yyyy-MM-dd'),
      appointment_time: format(futureDate, 'HH:mm'),
      is_task: true,
      is_completed: false,
      remind_responsible: true,
      notes: 'Este compromisso vencerá em 1 minuto e deve tocar o alarme.',
    };

    await createAppointment(testAppointment);
  };

  const playTestSound = async () => {
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
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Testador de Notificações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="testMinutes">Minutos atrás para o teste:</Label>
          <Input
            id="testMinutes"
            type="number"
            value={testMinutes}
            onChange={(e) => setTestMinutes(Number(e.target.value))}
            min="1"
            max="60"
          />
        </div>

        <div className="space-y-2">
          <Button 
            onClick={createTestOverdueAppointment}
            className="w-full flex items-center gap-2"
            variant="outline"
          >
            <Clock className="h-4 w-4" />
            Criar Compromisso Atrasado
          </Button>
          
          <Button 
            onClick={createTestFutureAppointment}
            className="w-full flex items-center gap-2"
            variant="outline"
          >
            <Clock className="h-4 w-4" />
            Criar Compromisso (vence em 1min)
          </Button>
          
          <Button 
            onClick={playTestSound}
            className="w-full flex items-center gap-2"
            variant="secondary"
          >
            <Volume2 className="h-4 w-4" />
            Testar Som de Alerta
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• O compromisso atrasado aparecerá imediatamente no ícone de notificações</p>
          <p>• O compromisso futuro tocará o alarme quando vencer (1 minuto)</p>
          <p>• Use o botão de som para testar o áudio</p>
        </div>
      </CardContent>
    </Card>
  );
}