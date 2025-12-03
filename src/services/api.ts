/**
 * API Service - Communication with backend
 */

import type { Ticket, TicketSummary, Worker, DashboardStats, ActivityLog, OtpResponse, TicketStatus } from '../types';

// Use environment variable or default to production
const API_BASE = import.meta.env.VITE_API_URL || 'https://commiq-server.fly.dev/helpdesk';

// Worker credentials (stored in localStorage for simplicity)
function getWorkerCredentials(): { workerId: string; workerName: string } {
  return {
    workerId: localStorage.getItem('worker_id') || '',
    workerName: localStorage.getItem('worker_name') || '',
  };
}

function getWorkerHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

// Add workerId to URL query params (backend expects this)
function addWorkerParams(url: string): string {
  const { workerId, workerName } = getWorkerCredentials();
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}workerId=${encodeURIComponent(workerId)}&workerName=${encodeURIComponent(workerName)}`;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }
  return response.json();
}

// ============================================
// Dashboard & Stats
// ============================================

export async function fetchStats(): Promise<DashboardStats> {
  const response = await fetch(addWorkerParams(`${API_BASE}/admin/stats`), {
    headers: getWorkerHeaders(),
  });
  return handleResponse(response);
}

// ============================================
// Tickets
// ============================================

export interface ListTicketsParams {
  status?: TicketStatus | TicketStatus[];
  provider?: string;
  assigned_to?: string;
  page?: number;
  limit?: number;
}

export interface ListTicketsResponse {
  tickets: TicketSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function fetchTickets(params: ListTicketsParams = {}): Promise<ListTicketsResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.status) {
    if (Array.isArray(params.status)) {
      params.status.forEach(s => searchParams.append('status', s));
    } else {
      searchParams.set('status', params.status);
    }
  }
  if (params.provider) searchParams.set('provider', params.provider);
  if (params.assigned_to) searchParams.set('assigned_to', params.assigned_to);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  
  const url = addWorkerParams(`${API_BASE}/admin/tickets?${searchParams.toString()}`);
  const response = await fetch(url, {
    headers: getWorkerHeaders(),
  });
  return handleResponse(response);
}

export async function fetchTicket(ticketId: string): Promise<{ ticket: Ticket; activity: ActivityLog[] }> {
  const response = await fetch(addWorkerParams(`${API_BASE}/admin/tickets/${ticketId}`), {
    headers: getWorkerHeaders(),
  });
  return handleResponse(response);
}

export async function assignTicket(ticketId: string): Promise<{ ticket: Ticket }> {
  const response = await fetch(addWorkerParams(`${API_BASE}/admin/tickets/${ticketId}/assign`), {
    method: 'POST',
    headers: getWorkerHeaders(),
    body: JSON.stringify({}),
  });
  return handleResponse(response);
}

export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus,
  notes?: string
): Promise<{ ticket: Ticket }> {
  const response = await fetch(addWorkerParams(`${API_BASE}/admin/tickets/${ticketId}/status`), {
    method: 'POST',
    headers: getWorkerHeaders(),
    body: JSON.stringify({ status, notes }),
  });
  return handleResponse(response);
}

export async function requestOtp(ticketId: string): Promise<void> {
  const response = await fetch(addWorkerParams(`${API_BASE}/admin/tickets/${ticketId}/request-otp`), {
    method: 'POST',
    headers: getWorkerHeaders(),
  });
  await handleResponse(response);
}

export async function getOtp(ticketId: string): Promise<OtpResponse> {
  const response = await fetch(addWorkerParams(`${API_BASE}/admin/tickets/${ticketId}/otp`), {
    headers: getWorkerHeaders(),
  });
  return handleResponse(response);
}

export async function waitForOtp(ticketId: string, timeoutMs: number = 30000): Promise<OtpResponse> {
  const response = await fetch(addWorkerParams(`${API_BASE}/admin/tickets/${ticketId}/otp/wait?timeout=${timeoutMs}`), {
    headers: getWorkerHeaders(),
  });
  return handleResponse(response);
}

export async function clearOtp(ticketId: string): Promise<void> {
  const response = await fetch(addWorkerParams(`${API_BASE}/admin/tickets/${ticketId}/clear-otp`), {
    method: 'POST',
    headers: getWorkerHeaders(),
  });
  await handleResponse(response);
}

export async function completeTicket(
  ticketId: string,
  filePath: string,
  fileName: string,
  fileSize: number,
  notes?: string
): Promise<{ ticket: Ticket }> {
  const response = await fetch(addWorkerParams(`${API_BASE}/admin/tickets/${ticketId}/complete`), {
    method: 'POST',
    headers: getWorkerHeaders(),
    body: JSON.stringify({
      file_path: filePath,
      file_name: fileName,
      file_size: fileSize,
      notes,
    }),
  });
  return handleResponse(response);
}

export async function failTicket(
  ticketId: string,
  errorMessage: string,
  notes?: string
): Promise<{ ticket: Ticket }> {
  const response = await fetch(addWorkerParams(`${API_BASE}/admin/tickets/${ticketId}/fail`), {
    method: 'POST',
    headers: getWorkerHeaders(),
    body: JSON.stringify({
      error_message: errorMessage,
      notes,
    }),
  });
  return handleResponse(response);
}

export async function fetchActivity(ticketId: string): Promise<{ activity: ActivityLog[] }> {
  const response = await fetch(addWorkerParams(`${API_BASE}/admin/tickets/${ticketId}/activity`), {
    headers: getWorkerHeaders(),
  });
  return handleResponse(response);
}

export async function getDownloadUrl(ticketId: string): Promise<{ url: string; file_name: string; expires_in: number }> {
  const response = await fetch(addWorkerParams(`${API_BASE}/admin/tickets/${ticketId}/download-url`), {
    headers: getWorkerHeaders(),
  });
  return handleResponse(response);
}

// ============================================
// Workers
// ============================================

export async function fetchWorkers(): Promise<{ workers: Worker[] }> {
  const response = await fetch(addWorkerParams(`${API_BASE}/admin/workers`), {
    headers: getWorkerHeaders(),
  });
  return handleResponse(response);
}

// ============================================
// Authentication (simple localStorage-based)
// ============================================

export function login(workerId: string, workerName: string): void {
  localStorage.setItem('worker_id', workerId);
  localStorage.setItem('worker_name', workerName);
}

export function logout(): void {
  localStorage.removeItem('worker_id');
  localStorage.removeItem('worker_name');
}

export function isLoggedIn(): boolean {
  return !!localStorage.getItem('worker_id');
}

export function getCurrentWorker(): { id: string; name: string } | null {
  const id = localStorage.getItem('worker_id');
  const name = localStorage.getItem('worker_name');
  
  if (!id || !name) return null;
  return { id, name };
}
