import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchTickets } from '../services/api';
import { TicketStatus, STATUS_LABELS } from '../types';
import { formatDistanceToNow, format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useRealtimeTickets } from '../hooks/useRealtimeTickets';
import { RefreshCw, Inbox, Eye, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import ProviderLogo from '../components/ProviderLogo';

// Design System Colors
const colors = {
  brand: {
    600: '#08083A',
    700: '#05052E',
  },
  neutral: {
    50: '#F8F8FF',
    100: '#EDEDF5',
    200: '#D4D4DF',
    400: '#B9B9C9',
    500: '#8A8A99',
    600: '#5C5C6B',
    700: '#3B3B4D',
  },
};

export default function TicketsPage() {
  // Subscribe to realtime ticket changes
  useRealtimeTickets();

  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tickets', statusFilter, page],
    queryFn: () =>
      fetchTickets({
        status: statusFilter || undefined,
        page,
        limit: 20,
      }),
    refetchInterval: 15000,
  });

  const statuses: Array<{ value: TicketStatus | ''; label: string }> = [
    { value: '', label: 'הכל' },
    { value: 'pending', label: 'ממתינים' },
    { value: 'assigned', label: 'הוקצו' },
    { value: 'in_progress', label: 'בטיפול' },
    { value: 'otp_required', label: 'ממתינים ל-OTP' },
    { value: 'otp_received', label: 'OTP התקבל' },
    { value: 'completed', label: 'הושלמו' },
    { value: 'failed', label: 'נכשלו' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold" style={{ color: colors.brand[600] }}>כל הבקשות</h2>
          <p className="mt-1" style={{ color: colors.neutral[500] }}>
            {data?.total || 0} בקשות בסה"כ
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
          style={{ border: `1px solid ${colors.neutral[200]}`, color: colors.neutral[600] }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.neutral[100]}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
        >
          <RefreshCw className="w-4 h-4" />
          רענן
        </button>
      </div>

      {/* Filters */}
      <div 
        className="bg-white rounded-[27px] p-5"
        style={{ border: `1px solid ${colors.neutral[200]}` }}
        data-tutorial="status-filters"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium ml-2" style={{ color: colors.neutral[600] }}>סינון לפי סטטוס:</span>
          {statuses.map((status) => (
            <button
              key={status.value}
              onClick={() => {
                setStatusFilter(status.value);
                setPage(1);
              }}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                backgroundColor: statusFilter === status.value ? colors.brand[600] : colors.neutral[100],
                color: statusFilter === status.value ? 'white' : colors.neutral[600],
              }}
              onMouseEnter={(e) => {
                if (statusFilter !== status.value) {
                  e.currentTarget.style.backgroundColor = colors.neutral[200];
                }
              }}
              onMouseLeave={(e) => {
                if (statusFilter !== status.value) {
                  e.currentTarget.style.backgroundColor = colors.neutral[100];
                }
              }}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div 
        className="bg-white rounded-[27px] overflow-hidden"
        style={{ border: `1px solid ${colors.neutral[200]}` }}
        data-tutorial="tickets-table"
      >
        {isLoading ? (
          <div className="p-12 text-center" style={{ color: colors.neutral[500] }}>
            <Loader2 
              className="w-10 h-10 animate-spin mx-auto mb-4"
              style={{ color: colors.brand[600] }}
            />
            <p>טוען...</p>
          </div>
        ) : data?.tickets.length === 0 ? (
          <div className="p-12 text-center" style={{ color: colors.neutral[500] }}>
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: colors.neutral[100] }}
            >
              <Inbox className="w-8 h-8" style={{ color: colors.neutral[400] }} />
            </div>
            <p className="font-medium">לא נמצאו בקשות</p>
          </div>
        ) : (
          <table className="w-full">
            <thead style={{ backgroundColor: colors.neutral[50], borderBottom: `1px solid ${colors.neutral[200]}` }}>
              <tr>
                <th className="text-right px-5 py-4 text-sm font-semibold" style={{ color: colors.neutral[700] }}>
                  פורטל
                </th>
                <th className="text-right px-5 py-4 text-sm font-semibold" style={{ color: colors.neutral[700] }}>
                  לקוח
                </th>
                <th className="text-right px-5 py-4 text-sm font-semibold" style={{ color: colors.neutral[700] }}>
                  תקופה
                </th>
                <th className="text-right px-5 py-4 text-sm font-semibold" style={{ color: colors.neutral[700] }}>
                  סטטוס
                </th>
                <th className="text-right px-5 py-4 text-sm font-semibold" style={{ color: colors.neutral[700] }}>
                  מטפל
                </th>
                <th className="text-right px-5 py-4 text-sm font-semibold" style={{ color: colors.neutral[700] }}>
                  נוצר
                </th>
                <th className="text-right px-5 py-4 text-sm font-semibold" style={{ color: colors.neutral[700] }}>
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.tickets.map((ticket) => (
                <tr 
                  key={ticket.id} 
                  className="transition-colors"
                  style={{ borderBottom: `1px solid ${colors.neutral[100]}` }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.neutral[50]}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <ProviderLogo provider={ticket.provider} size="sm" />
                      <div className="font-medium" style={{ color: colors.brand[600] }}>
                        {ticket.provider_display_name || ticket.provider}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div style={{ color: colors.brand[600] }}>{ticket.user_name}</div>
                    {ticket.user_email && (
                      <div className="text-sm" style={{ color: colors.neutral[500] }}>{ticket.user_email}</div>
                    )}
                  </td>
                  <td className="px-5 py-4" style={{ color: colors.neutral[600] }}>
                    {ticket.report_month}/{ticket.report_year}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`status-${ticket.status} px-3 py-1 rounded-full text-xs font-medium`}
                    >
                      {STATUS_LABELS[ticket.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4" style={{ color: colors.neutral[600] }}>
                    {ticket.worker_name || '-'}
                  </td>
                  <td className="px-5 py-4 text-sm" style={{ color: colors.neutral[500] }}>
                    <div>
                      {format(new Date(ticket.created_at), 'dd/MM/yy')}
                    </div>
                    <div className="text-xs" style={{ color: colors.neutral[400] }}>
                      {formatDistanceToNow(new Date(ticket.created_at), {
                        addSuffix: true,
                        locale: he,
                      })}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      to={`/tickets/${ticket.id}`}
                      className="px-4 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-2 transition-colors text-white"
                      style={{ backgroundColor: colors.brand[600] }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.brand[700]}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.brand[600]}
                      data-tutorial="view-button"
                    >
                      <Eye className="w-4 h-4" />
                      צפייה
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div 
            className="flex items-center justify-between px-5 py-4"
            style={{ borderTop: `1px solid ${colors.neutral[200]}`, backgroundColor: colors.neutral[50] }}
            data-tutorial="pagination"
          >
            <div className="text-sm" style={{ color: colors.neutral[500] }}>
              עמוד {page} מתוך {data.totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white rounded-xl text-sm disabled:opacity-50 transition-colors flex items-center gap-2"
                style={{ border: `1px solid ${colors.neutral[200]}` }}
              >
                <ChevronRight className="w-4 h-4" />
                הקודם
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="px-4 py-2 bg-white rounded-xl text-sm disabled:opacity-50 transition-colors flex items-center gap-2"
                style={{ border: `1px solid ${colors.neutral[200]}` }}
              >
                הבא
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
