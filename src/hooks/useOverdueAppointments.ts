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

  // Notification sound removed as per user request

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

    // Mark as notified for newly overdue appointments (sound removed)
    if (newlyOverdue.length > 0) {
      setNotifiedAppointments(prev => {
        const newSet = new Set(prev);
        newlyOverdue.forEach(id => newSet.add(id));
        return newSet;
      });
    }

    setLastCheck(now);
  }, [appointments, notifiedAppointments]);

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