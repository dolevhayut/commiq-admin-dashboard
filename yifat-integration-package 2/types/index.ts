// Re-export types from backend (simplified for frontend)

export type TicketStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'otp_required'
  | 'otp_received'
  | 'completed'
  | 'failed';

export interface Ticket {
  id: string;
  user_name: string;
  user_email: string | null;
  user_phone: string | null;
  provider: string;
  provider_display_name: string | null;
  report_month: number;
  report_year: number;
  status: TicketStatus;
  credential_username: string | null;
  credential_password: string | null;
  credential_extra: Record<string, any>;
  assigned_to: string | null;
  assigned_at: string | null;
  otp_code: string | null;
  otp_submitted_at: string | null;
  result_file_path: string | null;
  result_file_name: string | null;
  result_file_size: number | null;
  completed_at: string | null;
  error_message: string | null;
  worker_notes: string | null;
  client_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketSummary {
  id: string;
  user_name: string;
  user_email: string | null;
  provider: string;
  provider_display_name: string | null;
  report_month: number;
  report_year: number;
  status: TicketStatus;
  has_otp: boolean;
  otp_submitted_at: string | null;
  result_file_name: string | null;
  created_at: string;
  updated_at: string;
  worker_name: string | null;
  worker_email: string | null;
  assigned_at: string | null;
}

export interface Worker {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
}

export interface DashboardStats {
  pending: number;
  in_progress: number;
  otp_required: number;
  completed_today: number;
  failed_today: number;
  total_this_month: number;
}

export interface ActivityLog {
  id: string;
  ticket_id: string;
  action: string;
  actor_type: 'client' | 'worker' | 'system';
  actor_id: string | null;
  actor_name: string | null;
  old_value: string | null;
  new_value: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface OtpResponse {
  has_otp: boolean;
  otp_code: string | null;
  otp_submitted_at: string | null;
  otp_expires_at: string | null;
  expired?: boolean;
  timeout?: boolean;
}

// Status display helpers
export const STATUS_LABELS: Record<TicketStatus, string> = {
  pending: 'ממתין',
  assigned: 'הוקצה',
  in_progress: 'בטיפול',
  otp_required: 'ממתין ל-OTP',
  otp_received: 'OTP התקבל',
  completed: 'הושלם',
  failed: 'נכשל',
};

export const STATUS_COLORS: Record<TicketStatus, string> = {
  pending: 'yellow',
  assigned: 'blue',
  in_progress: 'purple',
  otp_required: 'orange',
  otp_received: 'cyan',
  completed: 'green',
  failed: 'red',
};
