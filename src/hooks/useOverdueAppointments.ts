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

  const playNotificationSound = useCallback(async () => {
    try {
      // Create a simple notification sound using Web Audio API
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
      
      console.log('Notification sound played successfully');
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }, []);

  const checkOverdueAppointments = useCallback(() => {
    if (!appointments || appointments.length === 0) return;
    
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
          newlyOverdue.push(appointment.id);
        }
      }
    });

    // Update state only if there are changes
    setOverdueAppointments(prev => {
      const prevIds = prev.map(a => a.id).sort();
      const newIds = newOverdueAppointments.map(a => a.id).sort();
      
      // Only update if the lists are different
      if (JSON.stringify(prevIds) !== JSON.stringify(newIds)) {
        return newOverdueAppointments;
      }
      return prev;
    });

    // Play sound and mark as notified for newly overdue appointments
    if (newlyOverdue.length > 0) {
      console.log('Playing notification sound for newly overdue appointments:', newlyOverdue);
      playNotificationSound();
      setNotifiedAppointments(prev => {
        const newSet = new Set(prev);
        newlyOverdue.forEach(id => newSet.add(id));
        return newSet;
      });
    }

    setLastCheck(now);
  }, [appointments, playNotificationSound, notifiedAppointments]);

  // Initial check and setup interval
  useEffect(() => {
    if (appointments && appointments.length > 0) {
      checkOverdueAppointments();
    }
    
    // Check every 30 seconds for new overdue appointments
    const interval = setInterval(() => {
      if (appointments && appointments.length > 0) {
        checkOverdueAppointments();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [appointments, checkOverdueAppointments]);

  // Clean up notified appointments that are no longer overdue
  useEffect(() => {
    const currentOverdueIds = new Set(overdueAppointments.map(a => a.id));
    setNotifiedAppointments(prev => {
      const filtered = new Set<string>();
      prev.forEach(id => {
        if (currentOverdueIds.has(id)) {
          filtered.add(id);
        }
      });
      return filtered;
    });
  }, [overdueAppointments]);

  return {
    overdueAppointments,
    overdueCount: overdueAppointments.length,
    lastCheck,
    refreshCheck: checkOverdueAppointments
  };
};