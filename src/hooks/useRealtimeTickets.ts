import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribeToTickets, subscribeToTicket, TicketPayload } from '../lib/supabase';

// Hook to subscribe to all ticket changes
export function useRealtimeTickets() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = subscribeToTickets(
      // On insert - invalidate queries
      (ticket) => {
        console.log('New ticket received via realtime:', ticket.id);
        queryClient.invalidateQueries({ queryKey: ['tickets'] });
        queryClient.invalidateQueries({ queryKey: ['urgentTickets'] });
        queryClient.invalidateQueries({ queryKey: ['recentTickets'] });
        queryClient.invalidateQueries({ queryKey: ['stats'] });
      },
      // On update - invalidate queries
      (ticket) => {
        console.log('Ticket updated via realtime:', ticket.id, ticket.status);
        queryClient.invalidateQueries({ queryKey: ['tickets'] });
        queryClient.invalidateQueries({ queryKey: ['urgentTickets'] });
        queryClient.invalidateQueries({ queryKey: ['recentTickets'] });
        queryClient.invalidateQueries({ queryKey: ['stats'] });
        queryClient.invalidateQueries({ queryKey: ['ticket', ticket.id] });
      },
      // On delete - invalidate queries
      (ticket) => {
        console.log('Ticket deleted via realtime:', ticket.id);
        queryClient.invalidateQueries({ queryKey: ['tickets'] });
        queryClient.invalidateQueries({ queryKey: ['urgentTickets'] });
        queryClient.invalidateQueries({ queryKey: ['recentTickets'] });
        queryClient.invalidateQueries({ queryKey: ['stats'] });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [queryClient]);
}

// Hook to subscribe to a specific ticket (for OTP updates)
export function useRealtimeTicket(
  ticketId: string | undefined,
  onOtpReceived?: (otp: string) => void,
  onStatusChange?: (status: string) => void
) {
  const queryClient = useQueryClient();

  const handleUpdate = useCallback(
    (ticket: TicketPayload) => {
      console.log('Ticket update received:', ticket.id, {
        status: ticket.status,
        otp: ticket.otp_code,
      });

      // Invalidate the specific ticket query
      queryClient.invalidateQueries({ queryKey: ['ticket', ticket.id] });

      // Check for OTP
      if (ticket.otp_code && onOtpReceived) {
        onOtpReceived(ticket.otp_code);
      }

      // Check for status change
      if (onStatusChange) {
        onStatusChange(ticket.status);
      }
    },
    [queryClient, onOtpReceived, onStatusChange]
  );

  useEffect(() => {
    if (!ticketId) return;

    const unsubscribe = subscribeToTicket(ticketId, handleUpdate);

    return () => {
      unsubscribe();
    };
  }, [ticketId, handleUpdate]);
}
