import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qrcfnsmotffomtjusimg.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyY2Zuc21vdGZmb210anVzaW1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MTIzNTksImV4cCI6MjA3Mjk4ODM1OX0.-AsnN33cCh7AXbmxkHLqRUFKiRgQP4GJqavOb_g0iFs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Types for realtime payloads
export interface TicketPayload {
  id: string;
  user_id: string | null;
  user_name: string;
  user_email: string | null;
  provider: string;
  provider_display_name: string | null;
  report_month: number;
  report_year: number;
  credential_username: string | null;
  credential_password: string | null;
  status: string;
  assigned_to: string | null;
  worker_name: string | null;
  otp_code: string | null;
  otp_requested_at: string | null;
  result_file_path: string | null;
  result_file_name: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityPayload {
  id: string;
  ticket_id: string;
  action: string;
  actor_type: string;
  actor_id: string | null;
  actor_name: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

// Subscribe to ticket changes
export function subscribeToTickets(
  onInsert?: (ticket: TicketPayload) => void,
  onUpdate?: (ticket: TicketPayload) => void,
  onDelete?: (ticket: TicketPayload) => void
) {
  const channel = supabase
    .channel('tickets-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'download_tickets',
      },
      (payload) => {
        console.log('New ticket:', payload.new);
        onInsert?.(payload.new as TicketPayload);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'download_tickets',
      },
      (payload) => {
        console.log('Ticket updated:', payload.new);
        onUpdate?.(payload.new as TicketPayload);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'download_tickets',
      },
      (payload) => {
        console.log('Ticket deleted:', payload.old);
        onDelete?.(payload.old as TicketPayload);
      }
    )
    .subscribe((status) => {
      console.log('Tickets subscription status:', status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

// Subscribe to a specific ticket (for OTP updates)
export function subscribeToTicket(
  ticketId: string,
  onUpdate: (ticket: TicketPayload) => void
) {
  const channel = supabase
    .channel(`ticket-${ticketId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'download_tickets',
        filter: `id=eq.${ticketId}`,
      },
      (payload) => {
        console.log('Ticket update:', payload.new);
        onUpdate(payload.new as TicketPayload);
      }
    )
    .subscribe((status) => {
      console.log(`Ticket ${ticketId} subscription status:`, status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

// Subscribe to activity log for a ticket
export function subscribeToTicketActivity(
  ticketId: string,
  onNewActivity: (activity: ActivityPayload) => void
) {
  const channel = supabase
    .channel(`activity-${ticketId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'ticket_activity_log',
        filter: `ticket_id=eq.${ticketId}`,
      },
      (payload) => {
        console.log('New activity:', payload.new);
        onNewActivity(payload.new as ActivityPayload);
      }
    )
    .subscribe((status) => {
      console.log(`Activity ${ticketId} subscription status:`, status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

// Get signed URL for downloading a file
export async function getSignedUrl(filePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('reports')
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (error) {
    console.error('Error getting signed URL:', error);
    return null;
  }

  return data.signedUrl;
}

// Upload a file to storage
export async function uploadFile(
  filePath: string,
  file: File
): Promise<{ path: string } | null> {
  const { data, error } = await supabase.storage
    .from('reports')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Error uploading file:', error);
    return null;
  }

  return data;
}
