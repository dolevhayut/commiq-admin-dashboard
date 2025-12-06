/**
 * Downloads Page - Example for Yifat's System
 * 
 * This is a ready-to-use example page that can be copied directly
 * to commiq-ifat/src/pages/Downloads.jsx
 * 
 * Prerequisites:
 * 1. Run sql/setup_download_wizard_for_yifat.sql in Supabase
 * 2. Copy required components (see YIFAT_INTEGRATION_QUICK_START.md)
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Eye, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  FileText,
  Calendar,
  User
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/api/supabaseClient';
import MultiScreenHeader from '@/components/MultiScreenHeader';
import ProviderLogo from '@/components/ProviderLogo';
import { useToast } from '@/components/ui/use-toast';

export default function Downloads() {
  const [showWizard, setShowWizard] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const { toast } = useToast();

  // Fetch statistics
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['download-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('download_tickets')
        .select('status, completed_at');
      
      if (error) throw error;

      const today = new Date().toDateString();
      
      return {
        pending: data?.filter(t => t.status === 'pending').length || 0,
        in_progress: data?.filter(t => t.status === 'in_progress').length || 0,
        otp_required: data?.filter(t => t.status === 'otp_required').length || 0,
        completed_today: data?.filter(t => 
          t.status === 'completed' && 
          t.completed_at &&
          new Date(t.completed_at).toDateString() === today
        ).length || 0,
        total: data?.length || 0,
      };
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch recent tickets
  const { data: tickets, isLoading, refetch: refetchTickets } = useQuery({
    queryKey: ['download-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('download_tickets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('download-tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'download_tickets',
        },
        (payload) => {
          console.log('Download ticket changed:', payload);
          refetchStats();
          refetchTickets();
          
          // Show notification for OTP
          if (payload.new?.otp_code && !payload.old?.otp_code) {
            toast({
              title: 'OTP התקבל!',
              description: `קוד: ${payload.new.otp_code}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchStats, refetchTickets, toast]);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    otp_required: 'bg-orange-100 text-orange-800',
    otp_received: 'bg-cyan-100 text-cyan-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };

  const statusLabels = {
    pending: 'ממתין',
    in_progress: 'בטיפול',
    otp_required: 'ממתין ל-OTP',
    otp_received: 'OTP התקבל',
    completed: 'הושלם',
    failed: 'נכשל',
  };

  return (
    <div>
      <MultiScreenHeader 
        title="הורדת דוחות מפורטלים"
        subtitle="ניהול בקשות הורדת דוחות עמלות עם Wizard מודרך"
        pageName="Downloads"
      />

      <div className="p-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">ממתינים</p>
                  <p className="text-3xl font-bold">{stats?.pending || 0}</p>
                </div>
                <Clock className="w-10 h-10 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">בטיפול</p>
                  <p className="text-3xl font-bold text-blue-600">{stats?.in_progress || 0}</p>
                </div>
                <FileText className="w-10 h-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">ממתינים ל-OTP</p>
                  <p className="text-3xl font-bold text-orange-600">{stats?.otp_required || 0}</p>
                </div>
                <AlertTriangle className="w-10 h-10 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">הושלמו היום</p>
                  <p className="text-3xl font-bold text-green-600">{stats?.completed_today || 0}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* New Download Button */}
        <Button 
          onClick={() => {
            setSelectedTicketId(null);
            setShowWizard(true);
          }}
          size="lg" 
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
        >
          <Download className="w-5 h-5 ml-2" />
          בקשת הורדה חדשה
        </Button>

        {/* Tickets List */}
        <Card>
          <CardHeader>
            <CardTitle>בקשות אחרונות</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : tickets?.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Download className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">אין בקשות עדיין</p>
                <p className="text-sm">לחץ על "בקשת הורדה חדשה" כדי להתחיל</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tickets?.map(ticket => (
                  <div 
                    key={ticket.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <ProviderLogo provider={ticket.provider} size="md" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {ticket.provider_display_name || ticket.provider}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {ticket.user_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {ticket.report_month}/{ticket.report_year}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[ticket.status]}`}>
                        {statusLabels[ticket.status]}
                      </span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedTicketId(ticket.id);
                          setShowWizard(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Download Wizard Dialog */}
      <Dialog open={showWizard} onOpenChange={setShowWizard}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTicketId ? 'צפייה בבקשה' : 'בקשת הורדה חדשה'}
            </DialogTitle>
          </DialogHeader>
          
          {/* Option 1: Use iframe (quickest) */}
          <iframe 
            src={`https://admin-dashboard-olive.vercel.app${selectedTicketId ? `/tickets/${selectedTicketId}` : ''}`}
            className="w-full h-[80vh] border-0 rounded"
            allow="clipboard-write"
          />
          
          {/* Option 2: Use the actual component (after copying files) */}
          {/* <DownloadWizard 
            ticketId={selectedTicketId}
            onComplete={() => {
              setShowWizard(false);
              refetchTickets();
              toast({ title: 'הבקשה הושלמה בהצלחה!' });
            }}
            onCancel={() => setShowWizard(false)}
          /> */}
        </DialogContent>
      </Dialog>
    </div>
  );
}

