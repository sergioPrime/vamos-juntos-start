import { useState, useEffect, useCallback } from 'react';
import { useAppointments, type Appointment } from './useAppointments';

export interface OverdueAppointment extends Appointment {
  overdueDays: number;
}

export const useOverdueAppointments = () => {
  const { appointments } = useAppointments();
  const [overdueAppointments, setOverdueAppointments] = useState<OverdueAppointment[]>([]);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [notifiedAppointments, setNotifiedAppointments] = useState<Set<string>>(new Set());

  const playNotificationSound = useCallback(() => {
    try {
      // Create a simple notification sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
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
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }, []);

  const checkOverdueAppointments = useCallback(() => {
    const now = new Date();
    const newOverdueAppointments: OverdueAppointment[] = [];
    const newlyOverdue: string[] = [];

    appointments.forEach(appointment => {
      if (!appointment.is_task || appointment.is_completed) return;

      const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
      
      if (appointmentDateTime < now) {
        const overdueDays = Math.floor((now.getTime() - appointmentDateTime.getTime()) / (1000 * 60 * 60 * 24));
        newOverdueAppointments.push({
          ...appointment,
          overdueDays
        });

        // Check if this appointment is newly overdue (not notified before)
        if (!notifiedAppointments.has(appointment.id)) {
          // Check if it became overdue in the last check interval (1 minute)
          const oneMinuteAgo = new Date(now.getTime() - 60000);
          if (appointmentDateTime >= oneMinuteAgo && appointmentDateTime <= now) {
            newlyOverdue.push(appointment.id);
          }
        }
      }
    });

    // Play sound for newly overdue appointments
    if (newlyOverdue.length > 0) {
      playNotificationSound();
      setNotifiedAppointments(prev => {
        const newSet = new Set(prev);
        newlyOverdue.forEach(id => newSet.add(id));
        return newSet;
      });
    }

    setOverdueAppointments(newOverdueAppointments);
    setLastCheck(now);
  }, [appointments, playNotificationSound, notifiedAppointments]);

  useEffect(() => {
    checkOverdueAppointments();
    
    // Check every minute for new overdue appointments
    const interval = setInterval(checkOverdueAppointments, 60000);
    
    return () => clearInterval(interval);
  }, [checkOverdueAppointments]);

  // Clear notification tracking when appointments are completed or updated
  useEffect(() => {
    setNotifiedAppointments(prev => {
      const currentOverdueIds = new Set(overdueAppointments.map(a => a.id));
      const newSet = new Set<string>();
      prev.forEach(id => {
        if (currentOverdueIds.has(id)) {
          newSet.add(id);
        }
      });
      return newSet;
    });
  }, [overdueAppointments]);

  return {
    overdueAppointments,
    overdueCount: overdueAppointments.length,
    lastCheck,
    refreshCheck: checkOverdueAppointments
  };
};