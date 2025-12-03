import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTicket,
  assignTicket,
  updateTicketStatus,
  requestOtp,
  getOtp,
  clearOtp,
  completeTicket,
  failTicket,
  getCurrentWorker,
  getDownloadUrl,
} from '../services/api';
import { STATUS_LABELS, TicketStatus } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { useRealtimeTicket } from '../hooks/useRealtimeTickets';
import {
  ArrowRight,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  Smartphone,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Clock,
  User,
  FileText,
  Calendar,
  Mail,
  Phone,
  X,
  Upload,
  File,
  ArrowLeft,
  Play,
  Shield,
} from 'lucide-react';
import { uploadFile } from '../lib/supabase';

// Wizard Steps
type WizardStep = 'details' | 'otp' | 'upload' | 'complete';

const STEPS: { id: WizardStep; label: string; icon: React.ReactNode }[] = [
  { id: 'details', label: 'פרטי הבקשה', icon: <FileText className="w-5 h-5" /> },
  { id: 'otp', label: 'קבלת OTP', icon: <Shield className="w-5 h-5" /> },
  { id: 'upload', label: 'העלאת קבצים', icon: <Upload className="w-5 h-5" /> },
  { id: 'complete', label: 'סיום', icon: <CheckCircle className="w-5 h-5" /> },
];

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const worker = getCurrentWorker();

  const [currentStep, setCurrentStep] = useState<WizardStep>('details');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [otpNotification, setOtpNotification] = useState<string | null>(null);
  
  // File upload state
  const [uploadedFile, setUploadedFile] = useState<{
    path: string;
    name: string;
    size: number;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Fail state
  const [showFailInput, setShowFailInput] = useState(false);
  const [failReason, setFailReason] = useState('');
  
  // Download state
  const [downloading, setDownloading] = useState(false);

  // Realtime subscription for this ticket
  const handleOtpReceived = useCallback((otp: string) => {
    setOtpNotification(otp);
    // Play notification sound
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {}
    // Show browser notification
    if (Notification.permission === 'granted') {
      new Notification('OTP התקבל!', {
        body: `קוד OTP: ${otp}`,
        icon: '/favicon.ico',
      });
    }
  }, []);

  useRealtimeTicket(id, handleOtpReceived);

  // Request notification permission on mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => fetchTicket(id!),
    enabled: !!id,
    refetchInterval: 5000,
  });

  const ticket = data?.ticket;
  const activity = data?.activity || [];

  // OTP polling
  const { data: otpData } = useQuery({
    queryKey: ['otp', id],
    queryFn: () => getOtp(id!),
    enabled: ticket?.status === 'otp_required' || ticket?.status === 'otp_received',
    refetchInterval: 2000,
  });

  // Auto-advance to OTP step when assigned
  useEffect(() => {
    if (ticket) {
      if (ticket.status === 'pending') {
        setCurrentStep('details');
      } else if (['assigned', 'in_progress', 'otp_required'].includes(ticket.status)) {
        if (currentStep === 'details') setCurrentStep('otp');
      } else if (ticket.status === 'otp_received') {
        if (currentStep === 'otp') setCurrentStep('upload');
      } else if (ticket.status === 'completed') {
        setCurrentStep('complete');
      }
    }
  }, [ticket?.status]);

  // Mutations
  const assignMutation = useMutation({
    mutationFn: () => assignTicket(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      setCurrentStep('otp');
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: TicketStatus) => updateTicketStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    },
  });

  const requestOtpMutation = useMutation({
    mutationFn: () => requestOtp(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    },
  });

  const clearOtpMutation = useMutation({
    mutationFn: () => clearOtp(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['otp', id] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (data: { filePath: string; fileName: string; fileSize: number }) =>
      completeTicket(id!, data.filePath, data.fileName, data.fileSize),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      setCurrentStep('complete');
    },
  });

  const failMutation = useMutation({
    mutationFn: (errorMessage: string) => failTicket(id!, errorMessage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    },
  });

  // Copy to clipboard
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // File upload handlers
  const handleFileSelect = async (file: File) => {
    if (!ticket) return;
    
    setUploading(true);
    setUploadError(null);

    try {
      const timestamp = Date.now();
      const ext = file.name.split('.').pop() || 'xlsx';
      const fileName = `report_${ticket.report_month}_${ticket.report_year}_${timestamp}.${ext}`;
      const filePath = `${ticket.provider}/${ticket.report_year}/${ticket.report_month}/${fileName}`;

      const result = await uploadFile(filePath, file);

      if (result) {
        setUploadedFile({
          path: result.path,
          name: file.name,
          size: file.size,
        });
      } else {
        setUploadError('שגיאה בהעלאת הקובץ. נסה שוב.');
      }
    } catch (err: any) {
      setUploadError(err.message || 'שגיאה בהעלאת הקובץ');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleComplete = () => {
    if (uploadedFile) {
      completeMutation.mutate({
        filePath: uploadedFile.path,
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size,
      });
    }
  };

  const handleDownload = async () => {
    if (!ticket?.result_file_path) return;
    
    setDownloading(true);
    try {
      const { url, file_name } = await getDownloadUrl(id!);
      
      // Open download in new tab
      const link = document.createElement('a');
      link.href = url;
      link.download = file_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(err.message || 'שגיאה בהורדת הקובץ');
    } finally {
      setDownloading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span>טוען...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !ticket) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-700 mb-2">שגיאה בטעינת הבקשה</h3>
        <p className="text-red-600">{(error as Error)?.message || 'הבקשה לא נמצאה'}</p>
        <Link to="/tickets" className="mt-4 inline-flex items-center gap-2 text-red-600 hover:underline">
          <ArrowRight className="w-4 h-4" />
          חזרה לרשימה
        </Link>
      </div>
    );
  }

  const hasOtp = otpData?.has_otp && otpData.otp_code;
  const isCompleted = ticket.status === 'completed';
  const isFailed = ticket.status === 'failed';
  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/tickets" className="text-gray-400 hover:text-gray-600 flex items-center gap-1">
            <ArrowRight className="w-4 h-4" />
            חזרה
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {ticket.provider_display_name || ticket.provider}
            </h2>
            <p className="text-gray-500">
              {ticket.user_name} • {ticket.report_month}/{ticket.report_year}
            </p>
          </div>
        </div>
        <span className={`status-${ticket.status} px-4 py-2 rounded-lg text-sm font-semibold`}>
          {STATUS_LABELS[ticket.status]}
        </span>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6" data-tutorial="progress-steps">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = index < currentStepIndex || ticket.status === 'completed';
            const isCurrent = index === currentStepIndex;
            
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isCurrent
                        ? 'bg-[#08083A] text-white'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-6 h-6" /> : step.icon}
                  </div>
                  <span
                    className={`mt-2 text-sm font-medium ${
                      isCurrent ? 'text-[#08083A]' : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 rounded ${
                      index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Step 1: Details */}
        {currentStep === 'details' && (
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <FileText className="w-6 h-6 text-gray-500" />
              פרטי הבקשה
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Credentials */}
              <div className="space-y-4" data-tutorial="credentials">
                <h4 className="font-medium text-gray-700 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  פרטי התחברות
                </h4>
                <CredentialField
                  label="שם משתמש / ת.ז."
                  value={ticket.credential_username}
                  copied={copiedField === 'username'}
                  onCopy={() => copyToClipboard(ticket.credential_username || '', 'username')}
                />
                <CredentialField
                  label="סיסמה / טלפון"
                  value={ticket.credential_password}
                  isPassword
                  copied={copiedField === 'password'}
                  onCopy={() => copyToClipboard(ticket.credential_password || '', 'password')}
                />
              </div>

              {/* Client Info */}
              <div className="space-y-4" data-tutorial="client-info">
                <h4 className="font-medium text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  פרטי לקוח
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">שם:</span>
                    <span className="font-medium">{ticket.user_name}</span>
                  </div>
                  {ticket.user_email && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> אימייל:
                      </span>
                      <span>{ticket.user_email}</span>
                    </div>
                  )}
                  {ticket.user_phone && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> טלפון:
                      </span>
                      <span dir="ltr">{ticket.user_phone}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> תקופה:
                    </span>
                    <span>{ticket.report_month}/{ticket.report_year}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="mt-8 flex justify-between items-center pt-6 border-t">
              <div />
              <button
                onClick={() => {
                  if (ticket.status === 'pending') {
                    assignMutation.mutate();
                  } else {
                    setCurrentStep('otp');
                  }
                }}
                disabled={assignMutation.isPending}
                className="px-6 py-3 rounded-xl font-medium flex items-center gap-2 text-white transition-colors"
                style={{ backgroundColor: '#E55539' }}
                data-tutorial="start-button"
              >
                {assignMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
                {ticket.status === 'pending' ? 'קח בקשה והתחל' : 'המשך'}
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: OTP */}
        {currentStep === 'otp' && (
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Shield className="w-6 h-6 text-gray-500" />
              קבלת קוד OTP
            </h3>

            {/* OTP Status */}
            <div className={`rounded-xl p-6 mb-6 ${hasOtp ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`} data-tutorial="otp-section">
              {hasOtp ? (
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <div className="text-lg font-medium text-green-800 mb-4">OTP התקבל!</div>
                  <div
                    className="text-5xl font-mono font-bold tracking-widest bg-white px-8 py-6 rounded-xl border-2 border-green-300 inline-block cursor-pointer hover:bg-green-100 transition-colors"
                    onClick={() => copyToClipboard(otpData.otp_code!, 'otp')}
                  >
                    {otpData.otp_code}
                  </div>
                  <div className="mt-4 flex justify-center gap-4">
                    <button
                      onClick={() => copyToClipboard(otpData.otp_code!, 'otp')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                        copiedField === 'otp'
                          ? 'bg-green-200 text-green-800'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {copiedField === 'otp' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedField === 'otp' ? 'הועתק!' : 'העתק קוד'}
                    </button>
                  </div>
                  <div className="text-sm text-gray-500 mt-4 flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4" />
                    התקבל: {otpData.otp_submitted_at && formatDistanceToNow(new Date(otpData.otp_submitted_at), { addSuffix: true, locale: he })}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  {ticket.status === 'otp_required' ? (
                    <>
                      <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
                      <div className="text-lg font-medium text-orange-800">ממתין לקוד OTP מהלקוח...</div>
                      <div className="text-sm text-orange-600 mt-2">הלקוח יקבל הודעה להזין את הקוד</div>
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                      <div className="text-lg font-medium text-orange-800 mb-4">נדרש קוד OTP?</div>
                      <button
                        onClick={() => requestOtpMutation.mutate()}
                        disabled={requestOtpMutation.isPending}
                        className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors flex items-center gap-2 mx-auto"
                      >
                        {requestOtpMutation.isPending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Smartphone className="w-5 h-5" />
                        )}
                        בקש OTP מהלקוח
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-6 border-t">
              <button
                onClick={() => setCurrentStep('details')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                חזרה
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentStep('upload')}
                  className="px-6 py-3 rounded-xl font-medium flex items-center gap-2 text-white transition-colors"
                  style={{ backgroundColor: '#08083A' }}
                >
                  {hasOtp ? 'המשך להעלאת קבצים' : 'דלג (ללא OTP)'}
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Upload */}
        {currentStep === 'upload' && (
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Upload className="w-6 h-6 text-gray-500" />
              העלאת קובץ הדוח
            </h3>

            {/* Upload Area */}
            {!uploadedFile ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                  isDragging
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                data-tutorial="upload-section"
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-12 h-12 animate-spin text-[#08083A]" />
                    <span className="text-gray-600 text-lg">מעלה קובץ...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 text-lg mb-2">גרור קובץ לכאן</p>
                    <p className="text-gray-400 mb-4">או</p>
                    <label className="cursor-pointer">
                      <span
                        className="px-6 py-3 rounded-xl text-sm font-medium text-white inline-block"
                        style={{ backgroundColor: '#08083A' }}
                      >
                        בחר קובץ מהמחשב
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".xlsx,.xls,.pdf,.csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(file);
                        }}
                      />
                    </label>
                    <p className="text-xs text-gray-400 mt-4">
                      תומך ב-Excel, PDF, CSV
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
                    <File className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-green-800 text-lg">{uploadedFile.name}</div>
                    <div className="text-sm text-green-600">
                      {(uploadedFile.size / 1024).toFixed(1)} KB • הועלה בהצלחה
                    </div>
                  </div>
                  <button
                    onClick={() => setUploadedFile(null)}
                    className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-green-700" />
                  </button>
                </div>
              </div>
            )}

            {uploadError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                {uploadError}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center pt-6 mt-6 border-t">
              <button
                onClick={() => setCurrentStep('otp')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                חזרה
              </button>
              <button
                onClick={handleComplete}
                disabled={!uploadedFile || completeMutation.isPending}
                className="px-8 py-3 rounded-xl font-medium flex items-center gap-2 text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#16A34A' }}
                data-tutorial="complete-button"
              >
                {completeMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                סיים בהצלחה
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {currentStep === 'complete' && (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-green-800 mb-2">הבקשה הושלמה בהצלחה!</h3>
            <p className="text-gray-600 mb-8">הקובץ נשמר והלקוח יקבל התראה</p>
            
            {ticket.result_file_name && (
              <div className="bg-green-50 rounded-xl p-4 inline-block mb-8">
                <div className="flex items-center gap-3">
                  <File className="w-6 h-6 text-green-600" />
                  <div className="text-right">
                    <div className="font-medium text-green-800">{ticket.result_file_name}</div>
                    {ticket.result_file_size && (
                      <div className="text-sm text-green-600">
                        {(ticket.result_file_size / 1024).toFixed(1)} KB
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={handleDownload}
                disabled={downloading || !ticket.result_file_path}
                className="px-6 py-3 rounded-xl font-medium text-white inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    מוריד...
                  </>
                ) : (
                  <>
                    <File className="w-5 h-5" />
                    הורד קובץ
                  </>
                )}
              </button>
              <Link
                to="/tickets"
                className="px-6 py-3 rounded-xl font-medium text-white inline-flex items-center gap-2"
                style={{ backgroundColor: '#08083A' }}
              >
                <ArrowRight className="w-5 h-5" />
                חזרה לרשימת הבקשות
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Fail Option */}
      {!isCompleted && !isFailed && currentStep !== 'complete' && (
        <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-4">
          {!showFailInput ? (
            <button
              onClick={() => setShowFailInput(true)}
              className="text-red-600 text-sm hover:text-red-700 flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              לא הצלחת? סמן ככישלון
            </button>
          ) : (
            <div className="space-y-3">
              <textarea
                value={failReason}
                onChange={(e) => setFailReason(e.target.value)}
                placeholder="תאר את הבעיה..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none h-24"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowFailInput(false);
                    setFailReason('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  ביטול
                </button>
                <button
                  onClick={() => failMutation.mutate(failReason)}
                  disabled={!failReason || failMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {failMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  סמן ככישלון
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Failed State */}
      {isFailed && (
        <div className="mt-6 bg-red-50 rounded-2xl border border-red-200 p-6 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-800 mb-2">הבקשה נכשלה</h3>
          {ticket.error_message && (
            <p className="text-red-600 mb-4">{ticket.error_message}</p>
          )}
          <Link
            to="/tickets"
            className="px-6 py-3 rounded-xl font-medium text-white inline-flex items-center gap-2 bg-red-600 hover:bg-red-700"
          >
            <ArrowRight className="w-5 h-5" />
            חזרה לרשימת הבקשות
          </Link>
        </div>
      )}
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

function CredentialField({
  label,
  value,
  isPassword,
  copied,
  onCopy,
}: {
  label: string;
  value: string | null;
  isPassword?: boolean;
  copied: boolean;
  onCopy: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);

  if (!value) return null;

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div>
        <div className="text-xs text-gray-500 mb-1">{label}</div>
        <div className="font-mono text-lg" dir="ltr">
          {isPassword && !showPassword ? '••••••••' : value}
        </div>
      </div>
      <div className="flex gap-2">
        {isPassword && (
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
        <button
          onClick={onCopy}
          className="p-2 rounded"
          style={{ 
            backgroundColor: copied ? '#dcfce7' : '#fef2f2', 
            color: copied ? '#166534' : '#E55539' 
          }}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
