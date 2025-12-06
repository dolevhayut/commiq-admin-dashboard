# 🔗 מדריך אינטגרציה - Commiq Admin Dashboard & Yifat System

## 📋 סקירה כללית

מערכת Admin Dashboard של Commiq מספקת ממשק wizard מודרך להורדת דוחות מפורטלים. המערכת כוללת:
- ✅ Wizard מודרך עם 4 שלבים (פרטי בקשה → OTP → העלאת קבצים → סיום)
- ✅ ניהול בקשות בזמן אמת (Realtime)
- ✅ מעקב סטטוס אוטומטי
- ✅ הדגמה/טוטוריאל לעובדים חדשים
- ✅ הצגת לוגואים של הפורטלים
- ✅ רמזים על הדוחות הנדרשים לכל פורטל

---

## 🎯 הבנת המערכות

### 🔵 מערכת יפעת (היעד - לשם רוצים לשלב)
- **URL**: https://commiq-ifat.vercel.app
- **Supabase Project ID**: `zwqfkmgflzywtmyoosow`
- **מצב נוכחי**: מערכת ניהול עמלות מלאה, **ללא** wizard להורדת דוחות
- **מה חסר**: רכיב Download Wizard

### 🟢 מערכת דולב (המקור - משם לוקחים)
- **URL**: https://commiq-ai.vercel.app
- **Supabase Project ID**: `qrcfnsmotffomtjusimg`
- **מצב נוכחי**: Helpdesk Dashboard עם Wizard עובד מושלם ✨
- **מה יש**: כל הרכיבים מוכנים ועובדים

### 🎯 המטרה
לשלב את ה-Download Wizard **במערכת של יפעת** (commiq-ifat) תוך שימוש ב-Supabase שלה (zwqfkmgflzywtmyoosow).

---

## 📊 מבנה הדאטהבייס הנדרש

### 1. טבלת `download_tickets`

הטבלה הראשית לניהול בקשות הורדת דוחות:

```sql
CREATE TABLE IF NOT EXISTS download_tickets (
  -- מזהה ייחודי
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- פרטי משתמש
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_email TEXT,
  user_phone TEXT,
  
  -- פרטי פורטל
  provider TEXT NOT NULL, -- migdal, phoenix, clal, etc.
  provider_display_name TEXT,
  report_month INTEGER NOT NULL,
  report_year INTEGER NOT NULL,
  
  -- פרטי התחברות (מוצפנים)
  credential_username TEXT,
  credential_password TEXT,
  credential_extra JSONB DEFAULT '{}'::jsonb,
  
  -- סטטוס
  status TEXT NOT NULL DEFAULT 'pending',
  -- ערכים אפשריים: pending, assigned, in_progress, otp_required, otp_received, completed, failed
  
  -- הקצאה לעובד
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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
  
  -- שגיאות
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- הערות
  worker_notes TEXT,
  client_notes TEXT,
  
  -- מטא-דאטה
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- אינדקסים לביצועים
  CONSTRAINT status_check CHECK (status IN (
    'pending', 'assigned', 'in_progress', 
    'otp_required', 'otp_received', 
    'completed', 'failed'
  ))
);

-- Indexes for performance
CREATE INDEX idx_download_tickets_status ON download_tickets(status);
CREATE INDEX idx_download_tickets_assigned_to ON download_tickets(assigned_to);
CREATE INDEX idx_download_tickets_provider ON download_tickets(provider);
CREATE INDEX idx_download_tickets_created_at ON download_tickets(created_at DESC);
CREATE INDEX idx_download_tickets_user_id ON download_tickets(user_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_download_tickets_updated_at 
  BEFORE UPDATE ON download_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE download_tickets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own tickets
CREATE POLICY "Users can view own tickets"
  ON download_tickets FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Workers can view all tickets
CREATE POLICY "Workers can view all tickets"
  ON download_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_id = auth.uid()
      AND permission_key IN ('admin', 'helpdesk_worker')
    )
  );

-- Policy: Workers can update tickets
CREATE POLICY "Workers can update tickets"
  ON download_tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_id = auth.uid()
      AND permission_key IN ('admin', 'helpdesk_worker')
    )
  );
```

### 2. טבלת `ticket_activity_log`

לוג פעילות על בקשות:

```sql
CREATE TABLE IF NOT EXISTS ticket_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES download_tickets(id) ON DELETE CASCADE,
  
  action TEXT NOT NULL,
  actor_type TEXT NOT NULL, -- 'client', 'worker', 'system'
  actor_id UUID,
  actor_name TEXT,
  
  old_value TEXT,
  new_value TEXT,
  
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT actor_type_check CHECK (actor_type IN ('client', 'worker', 'system'))
);

CREATE INDEX idx_ticket_activity_log_ticket_id ON ticket_activity_log(ticket_id);
CREATE INDEX idx_ticket_activity_log_created_at ON ticket_activity_log(created_at DESC);

-- Enable RLS
ALTER TABLE ticket_activity_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view activity for their own tickets
CREATE POLICY "Users can view own ticket activity"
  ON ticket_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM download_tickets
      WHERE id = ticket_activity_log.ticket_id
      AND user_id = auth.uid()
    )
  );

-- Policy: Workers can view all activity
CREATE POLICY "Workers can view all activity"
  ON ticket_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_id = auth.uid()
      AND permission_key IN ('admin', 'helpdesk_worker')
    )
  );
```

### 3. Storage Bucket: `reports`

```sql
-- Create bucket for storing downloaded reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', false);

-- Storage policies
CREATE POLICY "Workers can upload reports"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'reports' AND
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_id = auth.uid()
      AND permission_key IN ('admin', 'helpdesk_worker')
    )
  );

CREATE POLICY "Users can download their reports"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'reports' AND
    (
      -- Workers can see all
      EXISTS (
        SELECT 1 FROM user_permissions
        WHERE user_id = auth.uid()
        AND permission_key IN ('admin', 'helpdesk_worker')
      )
      OR
      -- Users can see their own (path contains their user_id or ticket_id)
      EXISTS (
        SELECT 1 FROM download_tickets dt
        WHERE dt.user_id = auth.uid()
        AND name LIKE '%' || dt.id || '%'
      )
    )
  );
```

---

## 🚀 שילוב ה-Wizard במערכת של יפעת

### שלב 1: העתקת הקומפוננטות

העתק את הקבצים הבאים למערכת של יפעת:

```bash
# From: commiq-admin-dashboard-new
# To: commiq-ifat

# 1. קומפוננטות ליבה
src/pages/TicketDetailPage.tsx → src/components/downloads/DownloadWizard.tsx
src/components/Tutorial.tsx → src/components/tutorials/Tutorial.tsx
src/contexts/TutorialContext.tsx → src/contexts/TutorialContext.tsx

# 2. קבצי נתונים
src/data/providerReports.ts → src/lib/provider-reports.ts
src/data/providerLogos.ts → src/lib/provider-logos.ts (already exists as insurance-logos.ts)
src/data/tutorialSteps.ts → src/lib/tutorial-steps.ts

# 3. קומפוננטות עזר
src/components/ProviderLogo.tsx → src/components/ProviderLogo.tsx
```

### שלב 2: עדכון ה-API Client

הוסף למערכת של יפעת את הפונקציות הבאות (ב-`src/api/functions.js`):

```javascript
/**
 * Download Tickets API
 */

// Create a download ticket
export async function createDownloadTicket({
  provider,
  report_month,
  report_year,
  credential_username,
  credential_password,
  user_name,
  user_email,
  user_phone,
}) {
  const { data, error } = await supabase
    .from('download_tickets')
    .insert({
      provider,
      provider_display_name: getProviderDisplayName(provider),
      report_month,
      report_year,
      credential_username,
      credential_password,
      user_name,
      user_email,
      user_phone,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get ticket by ID
export async function getDownloadTicket(ticketId) {
  const { data, error } = await supabase
    .from('download_tickets')
    .select(`
      *,
      activity:ticket_activity_log(*)
    `)
    .eq('id', ticketId)
    .single();

  if (error) throw error;
  return data;
}

// Update ticket status
export async function updateTicketStatus(ticketId, status, notes) {
  const { data, error } = await supabase
    .from('download_tickets')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', ticketId)
    .select()
    .single();

  if (error) throw error;

  // Log activity
  await supabase.from('ticket_activity_log').insert({
    ticket_id: ticketId,
    action: 'status_changed',
    actor_type: 'worker',
    actor_id: supabase.auth.user()?.id,
    old_value: null,
    new_value: status,
    details: { notes },
  });

  return data;
}

// Request OTP
export async function requestOtp(ticketId) {
  const { data, error } = await supabase
    .from('download_tickets')
    .update({ 
      status: 'otp_required',
      updated_at: new Date().toISOString()
    })
    .eq('id', ticketId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Submit OTP (from client side)
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

  if (error) throw error;
  return data;
}

// Complete ticket
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

  if (error) throw error;
  return data;
}
```

### שלב 3: הוספת הרכיב לממשק

הוסף את הרכיב לדף הפורטלים הקיים (`src/pages/PortalsHub.jsx`):

```jsx
import { useState } from 'react';
import { DownloadWizard } from '@/components/downloads/DownloadWizard';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export default function PortalsHub() {
  const [showWizard, setShowWizard] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);

  return (
    <div>
      {/* כפתור להורדת דוח */}
      <Button 
        onClick={() => setShowWizard(true)}
        className="flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        הורד דוח חדש
      </Button>

      {/* Wizard */}
      {showWizard && (
        <DownloadWizard
          provider={selectedProvider}
          onComplete={() => {
            setShowWizard(false);
            // Refresh data
          }}
          onCancel={() => setShowWizard(false)}
        />
      )}
    </div>
  );
}
```

---

## 🔌 API Endpoints

### Base URL
```
https://commiq-server.fly.dev/helpdesk
```

### דוגמאות שימוש

#### 1. יצירת בקשה חדשה

```javascript
POST /helpdesk/tickets
Body: {
  "user_name": "ישראל ישראלי",
  "user_email": "israel@example.com",
  "user_phone": "0501234567",
  "provider": "migdal",
  "report_month": 11,
  "report_year": 2024,
  "credential_username": "123456789",
  "credential_password": "0501234567"
}
```

#### 2. קבלת רשימת בקשות

```javascript
GET /helpdesk/admin/tickets?status=pending&page=1&limit=20
Query Params:
  - workerId: worker-id
  - workerName: Worker Name
  - status: pending | in_progress | completed (optional)
  - provider: migdal | phoenix | clal (optional)
  - page: 1
  - limit: 20
```

#### 3. בקשת OTP

```javascript
POST /helpdesk/admin/tickets/{ticketId}/request-otp
Query Params:
  - workerId: worker-id
  - workerName: Worker Name
```

#### 4. העלאת קובץ והשלמת בקשה

```javascript
// Upload to Supabase Storage first
const { data } = await supabase.storage
  .from('reports')
  .upload('path/to/file.xlsx', file);

// Then complete the ticket
POST /helpdesk/admin/tickets/{ticketId}/complete
Body: {
  "file_path": "path/to/file.xlsx",
  "file_name": "report_11_2024.xlsx",
  "file_size": 12345
}
```

---

## 🎨 שילוב הממשק במערכת יפעת

### אופציה 1: שילוב מלא ב-Portal Credentials Manager

```jsx
// src/pages/PortalCredentialsManager.jsx

import { DownloadWizard } from '@/components/downloads/DownloadWizard';

function PortalCredentialsManager() {
  const [showDownloadWizard, setShowDownloadWizard] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedCredential, setSelectedCredential] = useState(null);

  const handleDownloadReport = (provider, credential) => {
    setSelectedProvider(provider);
    setSelectedCredential(credential);
    setShowDownloadWizard(true);
  };

  return (
    <div>
      {/* רשימת הפורטלים */}
      {providers.map(provider => (
        <Card key={provider.key}>
          <CardHeader>
            <CardTitle>{provider.display_name}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* רשימת Credentials */}
            {credentials.map(cred => (
              <div key={cred.id}>
                <Button onClick={() => handleDownloadReport(provider, cred)}>
                  הורד דוח
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Download Wizard */}
      {showDownloadWizard && (
        <DownloadWizard
          provider={selectedProvider.key}
          credential={selectedCredential}
          onComplete={() => {
            setShowDownloadWizard(false);
            toast({ title: 'הדוח הורד בהצלחה!' });
          }}
          onCancel={() => setShowDownloadWizard(false)}
        />
      )}
    </div>
  );
}
```

### אופציה 2: דף נפרד להורדות

```jsx
// src/pages/DownloadReports.jsx

import { DownloadTicketsList } from '@/components/downloads/DownloadTicketsList';
import { DownloadWizard } from '@/components/downloads/DownloadWizard';

export default function DownloadReports() {
  return (
    <div className="space-y-6">
      {/* כותרת */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">בקשות הורדת דוחות</h1>
        <Button onClick={() => setShowWizard(true)}>
          + בקשה חדשה
        </Button>
      </div>

      {/* רשימת בקשות */}
      <DownloadTicketsList />

      {/* Wizard */}
      {showWizard && (
        <DownloadWizard
          onComplete={handleComplete}
          onCancel={() => setShowWizard(false)}
        />
      )}
    </div>
  );
}
```

---

## 📱 Realtime Updates

המערכת משתמשת ב-Supabase Realtime למעקב בזמן אמת:

```javascript
// Subscribe to ticket changes
import { supabase } from '@/lib/supabase';

const channel = supabase
  .channel('download-tickets')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'download_tickets',
      filter: `id=eq.${ticketId}`
    },
    (payload) => {
      console.log('Ticket updated:', payload.new);
      
      // Check for OTP
      if (payload.new.otp_code) {
        showNotification('OTP התקבל!', payload.new.otp_code);
      }
      
      // Update UI
      refreshTicket();
    }
  )
  .subscribe();
```

---

## 🎓 טוטוריאל/הדגמה

המערכת כוללת מערכת הדגמה מובנית. לשילוב במערכת של יפעת:

```jsx
// src/App.jsx

import { TutorialProvider } from '@/contexts/TutorialContext';

function App() {
  return (
    <TutorialProvider>
      {/* שאר האפליקציה */}
      <YourApp />
    </TutorialProvider>
  );
}
```

הוסף כפתור להפעלת ההדגמה:

```jsx
import { useTutorial } from '@/contexts/TutorialContext';
import { PlayCircle } from 'lucide-react';

function Header() {
  const { startTutorial } = useTutorial();

  return (
    <Button onClick={startTutorial}>
      <PlayCircle className="w-4 h-4" />
      הדגמה
    </Button>
  );
}
```

---

## 🔐 הרשאות נדרשות

### יצירת תפקיד Helpdesk Worker

```sql
-- Add to user_permissions table
INSERT INTO user_permissions (user_id, permission_key, permission_value)
VALUES 
  ('user-uuid-here', 'helpdesk_worker', true),
  ('user-uuid-here', 'can_view_tickets', true),
  ('user-uuid-here', 'can_update_tickets', true);
```

---

## 📋 רשימת פורטלים נתמכים

המערכת תומכת ב-10 פורטלים:

| Provider | Display Name | דוחות | הערות |
|----------|--------------|--------|-------|
| `migdal` | מגדל | 3 דוחות | משולמים בעלים, עמלה מדמי ניהול, עמלה מצבירה |
| `phoenix` | פניקס | 3 דוחות | עמלות נפרעים חא"ט, גמל (2 דוחות) |
| `clal` | כלל | 5 דוחות | פנסיה, חיים, בריאות, גמל |
| `hachshara_secure` | הכשרה ביטוח | 3 דוחות | תשלומים לסוכן, נפרעים, בסט אינווסט |
| `menorah` | מנורה מבטחים | 1 דוח | דוח עמלות |
| `analyst` | אנאליסט | 1 דוח | דוח עמלות |
| `meitav` | מיטב דש | 1 דוח | דוח עמלות |
| `mor` | מור השקעות | 1 דוח | דוח עמלות |
| `yellin_lapidot` | ילין לפידות | 1 דוח | דוח עמלות |
| `harel` | הראל ביטוח | 1 דוח | דוח עמלות |

---

## 🎨 עיצוב והתאמות

### צבעים

המערכת משתמשת בצבעים הבאים (ניתן להתאים למערכת של יפעת):

```css
:root {
  --brand-600: #08083A;
  --brand-700: #05052E;
  --accent-400: #E55539;
  --accent-500: #D94325;
  --neutral-50: #F8F8FF;
  --neutral-100: #EDEDF5;
  --neutral-200: #D4D4DF;
}
```

### פונטים

המערכת משתמשת ב-SimplerPro (הפונט כבר קיים במערכת של יפעת).

---

## 🔗 התממשקות עם מערכת הקיימת

### חיבור לטבלת Customers (במערכת יפעת)

```javascript
// When creating a download ticket in Yifat's system
import { Customer } from '@/api/entities'; // Existing in Yifat's system

// Link to existing customer
const customer = await Customer.filter({ 
  customer_name: userName 
}).then(res => res[0]);

const ticket = await createDownloadTicket({
  ...ticketData,
  user_id: customer?.id || null, // Use Yifat's customer ID
});
```

### חיבור לטבלת Agents Registry (במערכת יפעת)

```javascript
// Link downloaded reports to agents in Yifat's system
import { AgentsRegistry, ProcessingBatches } from '@/api/entities';

const agent = await AgentsRegistry.filter({
  agent_name: agentName
}).then(res => res[0]);

// After download completes, import to processing_batches
// This connects the downloaded report to Yifat's existing pipeline
await ProcessingBatches.create({
  agent_number: agent.agent_number,
  company_id: providerToCompanyId(provider),
  batch_file_url: result_file_path,
  status: 'pending',
  source: 'manual_download', // Mark as manual download
  created_via: 'download_wizard',
});

// Log the activity
await supabase.from('ticket_activity_log').insert({
  ticket_id: ticketId,
  action: 'imported_to_processing',
  actor_type: 'system',
  details: { 
    batch_id: batch.id,
    agent_number: agent.agent_number 
  },
});
```

---

## 📊 דשבורד סטטיסטיקות

הוסף widget לדשבורד הראשי:

```jsx
// src/pages/Dashboard.jsx

import { useQuery } from '@tanstack/react-query';

function DownloadTicketsWidget() {
  const { data: stats } = useQuery({
    queryKey: ['download-stats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('download_tickets')
        .select('status', { count: 'exact' });
      
      return {
        pending: data.filter(t => t.status === 'pending').length,
        otp_required: data.filter(t => t.status === 'otp_required').length,
        completed_today: data.filter(t => 
          t.status === 'completed' && 
          isToday(new Date(t.completed_at))
        ).length,
      };
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>בקשות הורדת דוחות</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>ממתינים:</span>
            <span className="font-bold">{stats?.pending || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>ממתינים ל-OTP:</span>
            <span className="font-bold text-orange-600">{stats?.otp_required || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>הושלמו היום:</span>
            <span className="font-bold text-green-600">{stats?.completed_today || 0}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 🔔 התראות

### התראות דפדפן (Browser Notifications)

```javascript
// Request permission
if (Notification.permission === 'default') {
  Notification.requestPermission();
}

// Show notification when OTP received
if (Notification.permission === 'granted') {
  new Notification('OTP התקבל!', {
    body: `קוד OTP: ${otpCode}`,
    icon: '/favicon.ico',
  });
}
```

### התראות WhatsApp (אופציונלי)

ניתן לשלב עם מערכת WhatsApp הקיימת של יפעת:

```javascript
// After ticket completed
await sendWhatsAppMessage({
  to: ticket.user_phone,
  message: `שלום ${ticket.user_name}, הדוח שלך מחודש ${ticket.report_month}/${ticket.report_year} מוכן להורדה!`
});
```

---

## 📦 קבצים לייבוא

### רשימת קבצים מלאה להעתקה:

```
From commiq-admin-dashboard-new:

1. Components:
   ├── src/components/ProviderLogo.tsx
   ├── src/components/Tutorial.tsx
   └── src/components/Layout.tsx (לדוגמה בלבד)

2. Pages:
   ├── src/pages/DashboardPage.tsx (לדוגמה)
   ├── src/pages/TicketsPage.tsx (לדוגמה)
   └── src/pages/TicketDetailPage.tsx (הליבה של ה-Wizard)

3. Data & Utils:
   ├── src/data/providerReports.ts
   ├── src/data/providerLogos.ts
   ├── src/data/tutorialSteps.ts
   └── src/types/index.ts

4. Contexts & Hooks:
   ├── src/contexts/TutorialContext.tsx
   └── src/hooks/useRealtimeTickets.ts

5. Services:
   ├── src/services/api.ts
   └── src/lib/supabase.ts (התאמות)
```

---

## ⚙️ הגדרות סביבה

הוסף ל-`.env.local` במערכת של יפעת:

```bash
# Supabase (already exists)
VITE_SUPABASE_URL=https://zwqfkmgflzywtmyoosow.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Commiq Server API (NEW)
VITE_COMMIQ_API_URL=https://commiq-server.fly.dev/helpdesk
```

---

## 🚦 צעדי הטמעה מומלצים

### Phase 1: Setup (יום 1)
1. ✅ הרצת סקריפט יצירת הטבלאות (למעלה)
2. ✅ העתקת קבצי ה-types וה-data
3. ✅ בדיקת חיבור ל-API

### Phase 2: Integration (יום 2-3)
1. ✅ העתקת קומפוננטת ה-Wizard
2. ✅ שילוב ב-Portal Credentials Manager
3. ✅ בדיקות אינטגרציה

### Phase 3: Enhancement (יום 4)
1. ✅ הוספת טוטוריאל
2. ✅ שילוב התראות
3. ✅ dashboard widgets

### Phase 4: Testing & Launch (יום 5)
1. ✅ בדיקות משתמשים
2. ✅ תיקון באגים
3. ✅ שחרור לפרודקשן

---

## 🎁 יתרונות השילוב

1. **ממשק מודרך** - Wizard ברור ופשוט לשימוש
2. **מעקב בזמן אמת** - עדכונים אוטומטיים ללא רענון דף
3. **ניהול OTP** - טיפול אוטומטי בקודי OTP
4. **הדגמה מובנית** - onboarding לעובדים חדשים
5. **לוגואים ויזואליים** - זיהוי מהיר של פורטלים
6. **רמזים על דוחות** - מידע מובנה על הדוחות הנדרשים

---

## 💡 המלצות נוספות

### 1. אוטומציה של ההורדה
במקום הורדה ידנית, ניתן לשלב עם backend של commiq-server:

```javascript
// Trigger automatic download
POST https://commiq-server.fly.dev/helpdesk/tickets
Body: {
  "provider": "migdal",
  "credentials": {...},
  "auto_download": true  // Backend will handle the download automatically
}
```

### 2. שילוב עם Processing Pipeline
לאחר הורדת הדוח, הזן אוטומטית ל-processing:

```javascript
// After download completes
await supabase.rpc('process_downloaded_report', {
  ticket_id: ticketId,
  file_path: result_file_path,
});
```

### 3. דוחות חודשיים אוטומטיים
הגדר cron job להורדה חודשית:

```sql
-- In Supabase: Database > Extensions > pg_cron
SELECT cron.schedule(
  'monthly-reports-download',
  '0 0 5 * *', -- 5th of each month
  $$
  INSERT INTO download_tickets (provider, report_month, report_year, ...)
  SELECT ...
  $$
);
```

---

## 📞 תמיכה וקשר

- **Repository**: `/Users/dolevhayut/Documents/GitHub/commiq-admin-dashboard-new`
- **API Server**: `https://commiq-server.fly.dev/helpdesk`
- **Demo**: `https://commiq-ai.vercel.app` (המערכת של יפעת)

---

## 🎉 סיכום

האינטגרציה תספק למערכת של יפעת:
- ✨ ממשק wizard מודרך להורדת דוחות
- ✨ ניהול בקשות בזמן אמת
- ✨ טיפול אוטומטי ב-OTP
- ✨ הדגמה לעובדים חדשים
- ✨ ויזואליזציה משופרת עם לוגואים

**כל הקוד מוכן לשימוש - רק צריך להעתיק ולהתאים!** 🚀

