import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchStats, fetchTickets } from '../services/api';
import { STATUS_LABELS } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { useRealtimeTickets } from '../hooks/useRealtimeTickets';
import {
  Clock,
  Settings,
  Key,
  Check,
  X,
  BarChart3,
  AlertTriangle,
  ClipboardList,
  CheckCircle,
} from 'lucide-react';
import ProviderLogo from '../components/ProviderLogo';

// Design System Colors
const colors = {
  brand: {
    600: '#08083A',
    700: '#05052E',
    800: '#030324',
  },
  accent: {
    100: '#FFDDD5',
    400: '#E55539',
    500: '#D94325',
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
  status: {
    success: '#16A34A',
    warning: '#F59E0B',
    error: '#DC2626',
    info: '#0EA5E9',
  }
};

export default function DashboardPage() {
  // Subscribe to realtime ticket changes
  useRealtimeTickets();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
    refetchInterval: 30000,
  });

  const { data: urgentTickets } = useQuery({
    queryKey: ['urgentTickets'],
    queryFn: () => fetchTickets({ status: ['pending', 'otp_required'], limit: 5 }),
    refetchInterval: 10000,
  });

  const { data: recentTickets } = useQuery({
    queryKey: ['recentTickets'],
    queryFn: () => fetchTickets({ limit: 10 }),
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h2 className="text-3xl font-bold" style={{ color: colors.brand[600] }}>לוח בקרה</h2>
        <p className="mt-1" style={{ color: colors.neutral[500] }}>סקירה כללית של מצב הבקשות</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4" data-tutorial="stats-cards">
        <StatCard
          label="ממתינים"
          value={stats?.pending || 0}
          icon={<Clock className="w-5 h-5" />}
          variant="warning"
          loading={statsLoading}
        />
        <StatCard
          label="בטיפול"
          value={stats?.in_progress || 0}
          icon={<Settings className="w-5 h-5" />}
          variant="info"
          loading={statsLoading}
        />
        <StatCard
          label="ממתינים ל-OTP"
          value={stats?.otp_required || 0}
          icon={<Key className="w-5 h-5" />}
          variant="accent"
          highlight
          loading={statsLoading}
        />
        <StatCard
          label="הושלמו היום"
          value={stats?.completed_today || 0}
          icon={<Check className="w-5 h-5" />}
          variant="success"
          loading={statsLoading}
        />
        <StatCard
          label="נכשלו היום"
          value={stats?.failed_today || 0}
          icon={<X className="w-5 h-5" />}
          variant="error"
          loading={statsLoading}
        />
        <StatCard
          label="סה״כ החודש"
          value={stats?.total_this_month || 0}
          icon={<BarChart3 className="w-5 h-5" />}
          variant="primary"
          loading={statsLoading}
        />
      </div>

      {/* Two column layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Urgent tickets */}
        <div 
          className="bg-white rounded-[27px] p-7"
          style={{ border: `1px solid ${colors.neutral[200]}` }}
          data-tutorial="urgent-tickets"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: colors.accent[100] }}
              >
                <AlertTriangle className="w-5 h-5" style={{ color: colors.accent[500] }} />
              </div>
              <h3 className="text-xl font-semibold" style={{ color: colors.brand[600] }}>דורשים טיפול</h3>
            </div>
            <Link
              to="/tickets?status=pending,otp_required"
              className="text-sm font-medium"
              style={{ color: colors.brand[600] }}
            >
              ראה הכל
            </Link>
          </div>

          {urgentTickets?.tickets.length === 0 ? (
            <div className="text-center py-12" style={{ color: colors.neutral[500] }}>
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: colors.neutral[100] }}
              >
                <CheckCircle className="w-8 h-8" style={{ color: colors.status.success }} />
              </div>
              <p className="font-medium">אין בקשות דחופות</p>
            </div>
          ) : (
            <div className="space-y-3">
              {urgentTickets?.tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  to={`/tickets/${ticket.id}`}
                  className="flex items-center justify-between p-4 rounded-xl transition-colors"
                  style={{ 
                    backgroundColor: colors.neutral[50], 
                    border: `1px solid ${colors.neutral[200]}` 
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.neutral[100]}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.neutral[50]}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <ProviderLogo provider={ticket.provider} size="sm" />
                    <div>
                      <div className="font-medium" style={{ color: colors.brand[600] }}>
                        {ticket.provider_display_name || ticket.provider}
                      </div>
                      <div className="text-sm" style={{ color: colors.neutral[500] }}>
                        {ticket.user_name} | {ticket.report_month}/{ticket.report_year}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`status-${ticket.status} px-3 py-1 rounded-full text-xs font-medium`}>
                      {STATUS_LABELS[ticket.status]}
                    </span>
                    <span className="text-xs" style={{ color: colors.neutral[400] }}>
                      {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: he })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div 
          className="bg-white rounded-[27px] p-7"
          style={{ border: `1px solid ${colors.neutral[200]}` }}
          data-tutorial="recent-activity"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: colors.neutral[100] }}
              >
                <ClipboardList className="w-5 h-5" style={{ color: colors.brand[600] }} />
              </div>
              <h3 className="text-xl font-semibold" style={{ color: colors.brand[600] }}>פעילות אחרונה</h3>
            </div>
            <Link
              to="/tickets"
              className="text-sm font-medium"
              style={{ color: colors.brand[600] }}
            >
              ראה הכל
            </Link>
          </div>

          <div className="space-y-3">
            {recentTickets?.tickets.map((ticket) => (
              <Link
                key={ticket.id}
                to={`/tickets/${ticket.id}`}
                className="flex items-center justify-between p-4 rounded-xl transition-colors"
                style={{ 
                  backgroundColor: colors.neutral[50], 
                  border: `1px solid ${colors.neutral[200]}` 
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.neutral[100]}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.neutral[50]}
              >
                <div className="flex items-center gap-3">
                  <StatusDot status={ticket.status} />
                  <ProviderLogo provider={ticket.provider} size="sm" />
                  <div>
                    <div className="font-medium" style={{ color: colors.brand[600] }}>
                      {ticket.provider_display_name || ticket.provider}
                    </div>
                    <div className="text-sm" style={{ color: colors.neutral[500] }}>
                      {ticket.user_name}
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-sm" style={{ color: colors.neutral[600] }}>
                    {ticket.report_month}/{ticket.report_year}
                  </div>
                  <div className="text-xs" style={{ color: colors.neutral[400] }}>
                    {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true, locale: he })}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  variant,
  highlight,
  loading,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  variant: 'warning' | 'info' | 'accent' | 'success' | 'error' | 'primary';
  highlight?: boolean;
  loading?: boolean;
}) {
  const styles = {
    warning: {
      bg: '#FEF3C7',
      border: '#FDE68A',
      text: '#92400E',
      iconBg: '#FDE68A',
    },
    info: {
      bg: '#DBEAFE',
      border: '#BFDBFE',
      text: '#1E40AF',
      iconBg: '#BFDBFE',
    },
    accent: {
      bg: '#FFF4F2',
      border: '#FFDDD5',
      text: '#A32814',
      iconBg: '#FFDDD5',
    },
    success: {
      bg: '#D1FAE5',
      border: '#A7F3D0',
      text: '#065F46',
      iconBg: '#A7F3D0',
    },
    error: {
      bg: '#FEE2E2',
      border: '#FECACA',
      text: '#991B1B',
      iconBg: '#FECACA',
    },
    primary: {
      bg: '#E8E8F2',
      border: '#C8C8DB',
      text: '#08083A',
      iconBg: '#C8C8DB',
    },
  };

  const style = styles[variant];

  return (
    <div
      className="rounded-xl p-4"
      style={{
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
        boxShadow: highlight ? `0 0 0 2px ${colors.accent[400]}` : undefined,
        animation: highlight ? 'pulse 2s infinite' : undefined,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: style.iconBg, color: style.text }}
        >
          {icon}
        </div>
        {loading ? (
          <div className="w-8 h-8 rounded animate-pulse" style={{ backgroundColor: style.border }} />
        ) : (
          <span className="text-3xl font-bold" style={{ color: style.text }}>
            {value}
          </span>
        )}
      </div>
      <div className="text-sm font-medium" style={{ color: style.text }}>{label}</div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const statusColors: Record<string, string> = {
    pending: '#FBBF24',
    assigned: '#60A5FA',
    in_progress: '#A78BFA',
    otp_required: '#E55539',
    otp_received: '#22D3EE',
    completed: '#34D399',
    failed: '#F87171',
  };

  return (
    <span 
      className="w-3 h-3 rounded-full"
      style={{ 
        backgroundColor: statusColors[status] || '#9CA3AF',
        animation: status === 'otp_required' ? 'pulse 2s infinite' : undefined,
      }}
    />
  );
}
