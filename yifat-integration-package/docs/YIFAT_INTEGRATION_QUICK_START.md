# 🚀 התחלה מהירה - שילוב Download Wizard במערכת של יפעת

## 🎯 הבנת המערכות

### מערכת יפעת (היעד)
- **URL**: https://commiq-ifat.vercel.app
- **Supabase**: `zwqfkmgflzywtmyoosow`
- **מצב**: אין עדיין wizard להורדת דוחות

### מערכת דולב (המקור)
- **URL**: https://commiq-ai.vercel.app
- **Supabase**: `qrcfnsmotffomtjusimg`
- **מצב**: ה-Helpdesk Dashboard עובד מושלם

### המטרה
לשלב את ה-Download Wizard של דולב **במערכת של יפעת** (commiq-ifat).

---

## ⚡ שלבי השילוב

### שלב 1: הוספת טבלאות ל-Supabase של יפעת

התחבר ל-Supabase של יפעת (`zwqfkmgflzywtmyoosow`) והרץ:

```sql
-- טבלת בקשות הורדת דוחות
CREATE TABLE download_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- פרטי משתמש
  user_id UUID,
  user_name TEXT NOT NULL,
  user_email TEXT,
  user_phone TEXT,
  
  -- פרטי פורטל
  provider TEXT NOT NULL,
  provider_display_name TEXT,
  report_month INTEGER NOT NULL,
  report_year INTEGER NOT NULL,
  
  -- פרטי התחברות
  credential_username TEXT,
  credential_password TEXT,
  credential_extra JSONB DEFAULT '{}'::jsonb,
  
  -- סטטוס
  status TEXT DEFAULT 'pending',
  assigned_to UUID,
  assigned_at TIMESTAMPTZ,
  
  -- OTP
  otp_code TEXT,
  otp_submitted_at TIMESTAMPTZ,
  otp_expires_at TIMESTAMPTZ,
  
  -- תוצאות
  result_file_path TEXT,
  result_file_name TEXT,
  result_file_size INTEGER,
  completed_at TIMESTAMPTZ,
  
  -- שגיאות ומצב
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  worker_notes TEXT,
  client_notes TEXT,
  
  -- מטא-דאטה
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- אינדקסים
CREATE INDEX idx_download_tickets_status ON download_tickets(status);
CREATE INDEX idx_download_tickets_provider ON download_tickets(provider);
CREATE INDEX idx_download_tickets_created_at ON download_tickets(created_at DESC);

-- טבלת לוג פעילות
CREATE TABLE ticket_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES download_tickets(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  actor_id UUID,
  actor_name TEXT,
  old_value TEXT,
  new_value TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ticket_activity_log_ticket_id ON ticket_activity_log(ticket_id);

-- Storage bucket לדוחות
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies (התאם לפי הצורך)
ALTER TABLE download_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_activity_log ENABLE ROW LEVEL SECURITY;

-- דוגמה לפוליסי: כולם יכולים לקרוא (התאם לפי הצורך)
CREATE POLICY "Enable read for authenticated users" 
  ON download_tickets FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" 
  ON download_tickets FOR ALL
  USING (auth.role() = 'authenticated');
```

### שלב 2: העתקת הקבצים למערכת יפעת

```bash
# Navigate to commiq-ifat project
cd /Users/dolevhayut/Documents/GitHub/commiq-ifat

# Create directories if needed
mkdir -p src/components/downloads
mkdir -p src/contexts
mkdir -p src/lib/downloads

# Copy files from commiq-admin-dashboard-new
# Components
cp ../commiq-admin-dashboard-new/src/components/ProviderLogo.tsx src/components/
cp ../commiq-admin-dashboard-new/src/components/Tutorial.tsx src/components/tutorials/

# Pages (the wizard itself)
cp ../commiq-admin-dashboard-new/src/pages/TicketDetailPage.tsx src/components/downloads/DownloadWizard.tsx
cp ../commiq-admin-dashboard-new/src/pages/TicketsPage.tsx src/pages/DownloadTickets.jsx
cp ../commiq-admin-dashboard-new/src/pages/DashboardPage.tsx src/pages/DownloadDashboard.jsx

# Data & Utilities
cp ../commiq-admin-dashboard-new/src/data/providerReports.ts src/lib/downloads/provider-reports.ts
cp ../commiq-admin-dashboard-new/src/data/tutorialSteps.ts src/lib/downloads/tutorial-steps.ts

# Note: providerLogos.ts already exists as insurance-logos.ts

# Contexts & Hooks
cp ../commiq-admin-dashboard-new/src/contexts/TutorialContext.tsx src/contexts/
cp ../commiq-admin-dashboard-new/src/hooks/useRealtimeTickets.ts src/hooks/
```

### שלב 3: עדכון ה-API במערכת יפעת

הוסף את הפונקציות הבאות ל-`src/api/entities.js`:

```javascript
// Add to entities.js
export const DownloadTickets = createEntityAPI('download_tickets');
export const TicketActivityLog = createEntityAPI('ticket_activity_log');
```

הוסף פונקציות ל-`src/api/functions.js`:

```javascript
/**
 * Download Tickets Management
 */

// Create download ticket
export async function createDownloadTicket(ticketData) {
  const { data, error } = await supabase
    .from('download_tickets')
    .insert(ticketData)
    .select()
    .single();
  
  if (error) throw error;
  return { data, error: null };
}

// Get ticket with activity
export async function getDownloadTicket(ticketId) {
  const [ticketRes, activityRes] = await Promise.all([
    supabase.from('download_tickets').select('*').eq('id', ticketId).single(),
    supabase.from('ticket_activity_log').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: false }),
  ]);

  return {
    data: {
      ticket: ticketRes.data,
      activity: activityRes.data || [],
    },
    error: ticketRes.error || activityRes.error,
  };
}

// Update ticket status
export async function updateTicketStatus(ticketId, status, notes) {
  const { data, error } = await supabase
    .from('download_tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', ticketId)
    .select()
    .single();

  // Log activity
  if (!error) {
    await supabase.from('ticket_activity_log').insert({
      ticket_id: ticketId,
      action: 'status_changed',
      actor_type: 'worker',
      new_value: status,
      details: { notes },
    });
  }

  return { data, error };
}

// Request OTP
export async function requestOtp(ticketId) {
  return updateTicketStatus(ticketId, 'otp_required', 'OTP requested by worker');
}

// Submit OTP (from client)
export async function submitOtp(ticketId, otpCode) {
  const { data, error } = await supabase
    .from('download_tickets')
    .update({
      otp_code: otpCode,
      otp_submitted_at: new Date().toISOString(),
      status: 'otp_received',
      updated_at: new Date().toISOString()
    })
    .eq('id', ticketId)
    .select()
    .single();

  return { data, error };
}

// Complete ticket with file
export async function completeDownloadTicket(ticketId, filePath, fileName, fileSize) {
  const { data, error } = await supabase
    .from('download_tickets')
    .update({
      result_file_path: filePath,
      result_file_name: fileName,
      result_file_size: fileSize,
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', ticketId)
    .select()
    .single();

  return { data, error };
}

// Fail ticket
export async function failDownloadTicket(ticketId, errorMessage) {
  const { data, error } = await supabase
    .from('download_tickets')
    .update({
      error_message: errorMessage,
      status: 'failed',
      updated_at: new Date().toISOString()
    })
    .eq('id', ticketId)
    .select()
    .single();

  return { data, error };
}
```

### שלב 4: הוספת נתיב חדש במערכת יפעת

ערוך את `src/App.jsx`:

```jsx
// Import the new pages
import DownloadDashboard from './pages/DownloadDashboard';
import DownloadTickets from './pages/DownloadTickets';
import DownloadWizard from './components/downloads/DownloadWizard';

// Add routes
<Route path="/downloads" element={<DownloadDashboard />} />
<Route path="/downloads/tickets" element={<DownloadTickets />} />
<Route path="/downloads/:id" element={<DownloadWizard />} />
```

### שלב 5: הוספת קישור בתפריט

ערוך את `src/components/Navigation.jsx`:

```jsx
const menuItems = [
  // ... existing items
  {
    name: 'הורדת דוחות',
    icon: Download,
    path: '/downloads',
    permissions: ['can_download_reports'],
  },
];
```

---

## 🎯 אופציה מהירה: Widget בעמוד ראשי

אם רוצים להתחיל מהר, הוסף widget לדף הבית:

```jsx
// src/pages/Dashboard.jsx או src/pages/Home.jsx

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function Dashboard() {
  const [showDownloadWizard, setShowDownloadWizard] = useState(false);

  return (
    <div>
      {/* Widget חדש */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            הורדת דוחות מפורטלים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            הורד דוחות עמלות מכל הפורטלים בצורה מודרכת עם Wizard ייעודי
          </p>
          <Button onClick={() => setShowDownloadWizard(true)} className="w-full">
            <Download className="w-4 h-4 ml-2" />
            התחל הורדת דוח
          </Button>
        </CardContent>
      </Card>

      {/* Dialog עם הWizard */}
      <Dialog open={showDownloadWizard} onOpenChange={setShowDownloadWizard}>
        <DialogContent className="max-w-6xl h-[90vh] p-0">
          {/* אפשרות 1: Iframe */}
          <iframe 
            src="https://admin-dashboard-olive.vercel.app"
            className="w-full h-full rounded-lg"
            allow="clipboard-write"
          />
          
          {/* אפשרות 2: הרכיב עצמו (אחרי העתקת הקבצים) */}
          {/* <DownloadWizard onComplete={() => setShowDownloadWizard(false)} /> */}
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

## 📊 הבדלים בין המערכות

| פרט | מערכת יפעת | מערכת דולב |
|-----|-----------|-----------|
| **URL** | commiq-ifat.vercel.app | commiq-ai.vercel.app |
| **Supabase ID** | zwqfkmgflzywtmyoosow | qrcfnsmotffomtjusimg |
| **מטרה** | מערכת ניהול עמלות מלאה | Helpdesk להורדת דוחות |
| **Download Wizard** | ❌ לא קיים | ✅ קיים ועובד |
| **טבלאות** | customers, commissions, etc. | download_tickets |

---

## 🔧 התאמת הקוד למערכת יפעת

### 1. עדכון Supabase Client

ב-`src/lib/downloads/supabase.ts` (קובץ חדש):

```typescript
import { createClient } from '@supabase/supabase-js';

// Supabase של יפעת
const supabaseUrl = 'https://zwqfkmgflzywtmyoosow.supabase.co';
const supabaseAnonKey = 'YOUR_YIFAT_ANON_KEY'; // מתוך הגדרות Supabase של יפעת

export const downloadsSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
```

### 2. התממשקות עם טבלאות קיימות

```javascript
// חיבור לטבלת לקוחות קיימת
import { Customer } from '@/api/entities';

async function createDownloadFromCustomer(customerId, provider, month, year) {
  // 1. קבל פרטי לקוח מהטבלה הקיימת
  const customer = await Customer.get(customerId);
  
  // 2. צור בקשת הורדה
  const { data: ticket } = await downloadsSupabase
    .from('download_tickets')
    .insert({
      user_id: customer.id,
      user_name: customer.customer_name,
      user_email: customer.email,
      user_phone: customer.phone,
      provider: provider,
      report_month: month,
      report_year: year,
    })
    .select()
    .single();
  
  return ticket;
}
```

### 3. חיבור ל-Portal Credentials הקיים

```javascript
// במקום PortalCredentials stub, חבר לטבלה אמיתית או השתמש ב-credentials ישירים

// Option A: אם יש טבלת portal_credentials
import { PortalCredentials } from '@/api/entities';

const credentials = await PortalCredentials.filter({
  company_id: providerToCompanyId(provider)
});

// Option B: אם משתמשים ב-credentials מהמשתמש
// העובד מזין את ה-credentials ישירות ב-Wizard
```

---

## 📦 קבצים להעתקה (רשימה מדויקת)

### מתיקיית `commiq-admin-dashboard-new` → `commiq-ifat`:

```
1. Components:
   src/components/ProviderLogo.tsx → src/components/ProviderLogo.tsx
   src/components/Tutorial.tsx → src/components/tutorials/Tutorial.tsx

2. Pages (להמרה ל-JSX):
   src/pages/TicketDetailPage.tsx → src/components/downloads/DownloadWizard.jsx
   src/pages/TicketsPage.tsx → src/pages/DownloadTicketsList.jsx
   src/pages/DashboardPage.tsx → src/pages/DownloadsDashboard.jsx

3. Data Files:
   src/data/providerReports.ts → src/lib/downloads/provider-reports.js
   src/data/tutorialSteps.ts → src/lib/downloads/tutorial-steps.js
   
   Note: providerLogos.ts כבר קיים כ-insurance-logos.ts

4. Hooks & Contexts:
   src/hooks/useRealtimeTickets.ts → src/hooks/useRealtimeDownloads.js
   src/contexts/TutorialContext.tsx → src/contexts/TutorialContext.jsx

5. Types (להמרה ל-JSDoc):
   src/types/index.ts → src/types/downloads.js
```

---

## 🎨 שילוב בעמוד הפורטלים הקיים

### אופציה 1: הוספת כפתור בעמוד הפורטלים

ערוך את `src/pages/PortalsHub.jsx`:

```jsx
import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import DownloadWizard from '@/components/downloads/DownloadWizard';

export default function PortalsHub() {
  const [showDownloadWizard, setShowDownloadWizard] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);

  return (
    <div>
      {/* כפתור חדש בראש הדף */}
      <div className="flex justify-between items-center mb-6">
        <h1>פורטלים</h1>
        <Button onClick={() => setShowDownloadWizard(true)}>
          <Download className="w-4 h-4 ml-2" />
          הורד דוח מפורטל
        </Button>
      </div>

      {/* רשימת הפורטלים הקיימת */}
      <YourExistingPortalsContent />

      {/* Download Wizard */}
      {showDownloadWizard && (
        <Dialog open={showDownloadWizard} onOpenChange={setShowDownloadWizard}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DownloadWizard 
              provider={selectedProvider}
              onComplete={(ticket) => {
                setShowDownloadWizard(false);
                // אופציונלי: ייבא אוטומטית לprocessing
                importDownloadedReport(ticket);
              }}
              onCancel={() => setShowDownloadWizard(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
```

### אופציה 2: כרטיס בכל פורטל

הוסף כפתור "הורד דוח" לכל פורטל:

```jsx
// בכל כרטיס פורטל
<Card>
  <CardHeader>
    <CardTitle>
      <ProviderLogo provider="migdal" size="sm" />
      מגדל
    </CardTitle>
  </CardHeader>
  <CardContent>
    {/* כפתור חדש */}
    <Button 
      onClick={() => {
        setSelectedProvider('migdal');
        setShowDownloadWizard(true);
      }}
      variant="outline"
      className="w-full"
    >
      <Download className="w-4 h-4 ml-2" />
      הורד דוח
    </Button>
  </CardContent>
</Card>
```

---

## 🔄 Realtime Subscriptions

הוסף את ה-Realtime לעמוד העיקרי:

```jsx
// src/hooks/useRealtimeDownloads.js

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { downloadsSupabase } from '@/lib/downloads/supabase';

export function useRealtimeDownloads() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = downloadsSupabase
      .channel('download-tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'download_tickets',
        },
        (payload) => {
          console.log('Download ticket changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['download-tickets'] });
        }
      )
      .subscribe();

    return () => {
      downloadsSupabase.removeChannel(channel);
    };
  }, [queryClient]);
}
```

---

## 🎯 דוגמה מלאה: עמוד חדש בתפריט

צור `src/pages/Downloads.jsx`:

```jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Eye, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { downloadsSupabase } from '@/lib/downloads/supabase';
import DownloadWizard from '@/components/downloads/DownloadWizard';
import { useRealtimeDownloads } from '@/hooks/useRealtimeDownloads';
import MultiScreenHeader from '@/components/MultiScreenHeader';

export default function Downloads() {
  const [showWizard, setShowWizard] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Subscribe to realtime updates
  useRealtimeDownloads();

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['download-stats'],
    queryFn: async () => {
      const { data } = await downloadsSupabase
        .from('download_tickets')
        .select('status');
      
      return {
        pending: data?.filter(t => t.status === 'pending').length || 0,
        otp_required: data?.filter(t => t.status === 'otp_required').length || 0,
        completed_today: data?.filter(t => 
          t.status === 'completed' && 
          new Date(t.completed_at).toDateString() === new Date().toDateString()
        ).length || 0,
      };
    },
    refetchInterval: 10000,
  });

  // Fetch tickets
  const { data: tickets, isLoading } = useQuery({
    queryKey: ['download-tickets'],
    queryFn: async () => {
      const { data } = await downloadsSupabase
        .from('download_tickets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    refetchInterval: 5000,
  });

  return (
    <div>
      <MultiScreenHeader 
        title="הורדת דוחות מפורטלים"
        subtitle="ניהול בקשות הורדת דוחות עמלות"
        pageName="Downloads"
      />

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        {/* כפתור יצירת בקשה */}
        <Button onClick={() => setShowWizard(true)} size="lg" className="w-full">
          <Download className="w-5 h-5 ml-2" />
          בקשת הורדה חדשה
        </Button>

        {/* רשימת בקשות */}
        <Card>
          <CardHeader>
            <CardTitle>בקשות אחרונות</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>טוען...</p>
            ) : tickets?.length === 0 ? (
              <p className="text-center text-gray-500 py-8">אין בקשות</p>
            ) : (
              <div className="space-y-2">
                {tickets?.map(ticket => (
                  <div 
                    key={ticket.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <ProviderLogo provider={ticket.provider} size="sm" />
                      <div>
                        <p className="font-medium">{ticket.provider_display_name}</p>
                        <p className="text-sm text-gray-600">
                          {ticket.user_name} • {ticket.report_month}/{ticket.report_year}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`status-${ticket.status} px-3 py-1 rounded-full text-xs`}>
                        {ticket.status}
                      </span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedTicket(ticket.id)}
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

      {/* Wizard Dialog */}
      <Dialog open={showWizard} onOpenChange={setShowWizard}>
        <DialogContent className="max-w-4xl">
          <DownloadWizard 
            ticketId={selectedTicket}
            onComplete={() => setShowWizard(false)}
            onCancel={() => setShowWizard(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

## 🔗 חיבור לתפריט הראשי

ערוך את `src/components/utils/pageMeta.jsx`:

```javascript
export const PAGE_METADATA = {
  // ... existing pages
  Downloads: {
    title: "הורדת דוחות",
    description: "הורדת דוחות עמלות מפורטלים",
    icon: "📥",
    category: "ניהול",
    permissions: ["can_download_reports"],
  },
};
```

---

## 🎓 הוספת הטוטוריאל

ב-`src/App.jsx`, עטוף הכל ב-`TutorialProvider`:

```jsx
import { TutorialProvider } from '@/contexts/TutorialContext';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TutorialProvider>
          <BrowserRouter>
            {/* שאר האפליקציה */}
          </BrowserRouter>
        </TutorialProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

הוסף כפתור "הדגמה" ב-Header:

```jsx
import { useTutorial } from '@/contexts/TutorialContext';
import { PlayCircle } from 'lucide-react';

function Header() {
  const { startTutorial } = useTutorial();

  return (
    <Button onClick={startTutorial} variant="outline">
      <PlayCircle className="w-4 h-4 ml-2" />
      הדגמה
    </Button>
  );
}
```

---

## ⚙️ Environment Variables

הוסף ל-`.env.local` של יפעת:

```bash
# Supabase של יפעת (כבר קיים)
VITE_SUPABASE_URL=https://zwqfkmgflzywtmyoosow.supabase.co
VITE_SUPABASE_ANON_KEY=your-yifat-anon-key

# API של דולב (לשימוש ב-downloads)
VITE_DOWNLOADS_API_URL=https://commiq-server.fly.dev/helpdesk
```

---

## 🧪 בדיקה

אחרי ההתקנה:

1. ✅ גש ל-`/downloads` במערכת של יפעת
2. ✅ לחץ על "בקשת הורדה חדשה"
3. ✅ עבור את ה-Wizard:
   - בחר פורטל (מגדל)
   - הזן credentials
   - בקש OTP
   - העלה קובץ
   - סיים
4. ✅ בדוק ש-Realtime עובד (פתח בכרטיסיה נוספת)
5. ✅ הרץ את הטוטוריאל

---

## 🎁 יתרונות השילוב

### למערכת יפעת:
1. ✅ ממשק מקצועי להורדת דוחות
2. ✅ מעקב וניהול בקשות
3. ✅ אוטומציה של תהליך ה-OTP
4. ✅ הדרכה מובנית לעובדים
5. ✅ חיבור לטבלאות הקיימות (customers, processing_batches)

### למשתמשים:
1. ✅ תהליך פשוט וברור
2. ✅ מעקב סטטוס בזמן אמת
3. ✅ התראות על OTP
4. ✅ היסטוריה של בקשות

---

## 📞 קבלת עזרה

- **קבצים**: `/Users/dolevhayut/Documents/GitHub/commiq-admin-dashboard-new`
- **מדריך מלא**: `INTEGRATION_GUIDE.md`
- **Demo**: https://admin-dashboard-olive.vercel.app

---

## 🚀 סיכום

השלבים:
1. ✅ הרץ SQL ב-Supabase של יפעת (2 דקות)
2. ✅ העתק קבצים (5 דקות)
3. ✅ הוסף נתיב ב-Router (2 דקות)
4. ✅ הוסף כפתור בתפריט (1 דקה)
5. ✅ בדוק שהכל עובד (5 דקות)

**סה"כ: ~15 דקות להתחלה מהירה!** ⚡

**הצלחה! 🎉**
