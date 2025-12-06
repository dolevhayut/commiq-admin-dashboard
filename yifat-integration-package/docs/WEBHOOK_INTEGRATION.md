# 🔔 Webhook Integration - Make.com

## 📋 סקירה

המערכת שולחת אוטומטית התראות ל-Make.com webhook עבור אירועים חשובים:
- ✅ בקשה חדשה נוצרה
- ✅ שינוי סטטוס
- ✅ OTP התקבל

---

## 🔗 Webhook URL

```
https://hook.eu1.make.com/cnl5cf547ie9l3aoz3jmk4ir4oy6jlnm
```

---

## 🚀 התקנה

### הרץ את הSQL ב-Supabase:

```sql
-- קובץ: sql/add_webhook_notification.sql
```

או הרץ ישירות:

1. פתח את Supabase Dashboard
2. עבור ל-SQL Editor
3. הדבק את התוכן של `sql/add_webhook_notification.sql`
4. הרץ

---

## 📨 אירועים נשלחים

### 1. בקשה חדשה (new_download_ticket)

**מתי**: כאשר נוצרת בקשה חדשה

**Payload**:
```json
{
  "event": "new_download_ticket",
  "ticket_id": "c4fae532-ef15-4e32-a40c-e78fb00f12a7",
  "timestamp": "2024-12-06T21:30:00Z",
  "ticket": {
    "id": "c4fae532-ef15-4e32-a40c-e78fb00f12a7",
    "user_name": "ישראל ישראלי",
    "user_email": "israel@example.com",
    "user_phone": "0501234567",
    "provider": "migdal",
    "provider_display_name": "מגדל",
    "report_month": 11,
    "report_year": 2024,
    "status": "pending",
    "credential_username": "123456789",
    "created_at": "2024-12-06T21:30:00Z"
  }
}
```

### 2. שינוי סטטוס (ticket_status_changed)

**מתי**: כאשר הסטטוס משתנה

**Payload**:
```json
{
  "event": "ticket_status_changed",
  "ticket_id": "c4fae532-ef15-4e32-a40c-e78fb00f12a7",
  "timestamp": "2024-12-06T21:35:00Z",
  "old_status": "pending",
  "new_status": "otp_required",
  "ticket": {
    "id": "c4fae532-ef15-4e32-a40c-e78fb00f12a7",
    "user_name": "ישראל ישראלי",
    "provider": "migdal",
    "status": "otp_required",
    ...
  }
}
```

### 3. OTP התקבל (otp_received)

**מתי**: כאשר לקוח הזין את קוד ה-OTP

**Payload**:
```json
{
  "event": "otp_received",
  "ticket_id": "c4fae532-ef15-4e32-a40c-e78fb00f12a7",
  "timestamp": "2024-12-06T21:40:00Z",
  "otp_code": "123456",
  "ticket": {
    "id": "c4fae532-ef15-4e32-a40c-e78fb00f12a7",
    "user_name": "ישראל ישראלי",
    "provider": "migdal",
    "otp_submitted_at": "2024-12-06T21:40:00Z",
    "assigned_to": "worker-uuid",
    ...
  }
}
```

---

## 🔧 שימושים ב-Make.com

### תרחיש 1: התראת WhatsApp לעובד

```
Webhook → Filter (event = otp_received)
       → WhatsApp: "OTP התקבל! קוד: {{otp_code}}"
```

### תרחיש 2: עדכון ב-CRM

```
Webhook → Filter (event = new_download_ticket)
       → CRM: Create/Update contact
       → Add note: "בקשת דוח חדשה"
```

### תרחיש 3: התראת Email

```
Webhook → Filter (event = ticket_status_changed, new_status = completed)
       → Email: "הדוח מוכן להורדה"
```

### תרחיש 4: Slack Notification

```
Webhook → Filter (event = new_download_ticket)
       → Slack: "🆕 בקשה חדשה: {{ticket.provider}} - {{ticket.user_name}}"
```

---

## 🧪 בדיקת הWebhook

### אופציה 1: יצירת בקשה מהממשק

1. התחבר למערכת
2. צור בקשה חדשה
3. בדוק ב-Make.com שהwebhook התקבל

### אופציה 2: בדיקה ישירה מ-SQL

```sql
-- Create test ticket
INSERT INTO download_tickets (
  user_name,
  user_email,
  provider,
  provider_display_name,
  report_month,
  report_year,
  credential_username,
  status
) VALUES (
  'Test User',
  'test@example.com',
  'migdal',
  'מגדל',
  12,
  2024,
  '123456789',
  'pending'
);

-- Check Make.com for the webhook!
```

---

## 📊 ניטור Webhooks

### בדיקת שגיאות:

```sql
-- Check pg_net logs (if available)
SELECT * FROM net._http_response 
ORDER BY created_at DESC 
LIMIT 10;
```

### מניעת כפילויות:

ה-triggers מוגדרים כך:
- `new_download_ticket` - רק ב-INSERT
- `ticket_status_changed` - רק אם הסטטוס השתנה
- `otp_received` - רק אם OTP התווסף (NULL → ערך)

---

## 🔐 אבטחה

### המלצות:

1. **Validate webhook source** ב-Make.com:
   - בדוק IP source
   - השתמש ב-secret token (אופציונלי)

2. **Rate limiting**:
   - הגבל מספר requests לדקה

3. **Retry logic**:
   - אם webhook נכשל, Make.com יכול לנסות שוב

---

## 🛠️ התאמות אישיות

### שינוי URL

ערוך את הפונקציה:

```sql
-- Change webhook URL
CREATE OR REPLACE FUNCTION notify_new_download_ticket()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'YOUR_NEW_WEBHOOK_URL'; -- שנה כאן
...
```

### הוספת שדות נוספים

```sql
payload := jsonb_build_object(
  'event', 'new_download_ticket',
  'ticket_id', NEW.id,
  'timestamp', NOW(),
  'custom_field', 'custom_value', -- הוסף כאן
  'ticket', jsonb_build_object(...)
);
```

### הסרת triggers

```sql
-- Disable webhook for new tickets
DROP TRIGGER IF EXISTS on_new_download_ticket ON download_tickets;

-- Disable webhook for status changes
DROP TRIGGER IF EXISTS on_ticket_status_change ON download_tickets;

-- Disable webhook for OTP
DROP TRIGGER IF EXISTS on_otp_received ON download_tickets;
```

---

## 📱 דוגמת Scenario ב-Make.com

```
1. Webhook Trigger
   └─ Listen to: https://hook.eu1.make.com/...

2. Router
   ├─ Route 1: event = "new_download_ticket"
   │   └─ Slack: Post message
   │   └─ Google Sheets: Add row
   │
   ├─ Route 2: event = "otp_received"
   │   └─ WhatsApp: Send to worker
   │   └─ Email: Notify worker
   │
   └─ Route 3: event = "ticket_status_changed" + status = "completed"
       └─ Email: Notify client
       └─ CRM: Update contact
```

---

## 🎯 Use Cases מומלצים

### 1. התראות לעובדים
```
בקשה חדשה → Slack/Email לעובד התורן
OTP התקבל → WhatsApp לעובד המטפל
```

### 2. עדכון לקוחות
```
הושלם → Email ללקוח: "הדוח מוכן!"
נכשל → SMS ללקוח: "אנא בדוק credentials"
```

### 3. Analytics
```
כל אירוע → Google Sheets
         → Data warehouse
         → Dashboard
```

### 4. אוטומציות
```
בקשה חדשה → הקצה לעובד זמין
            → צור משימה ב-Asana
            → עדכן CRM
```

---

## ✅ Checklist התקנה

- [ ] הורד את `sql/add_webhook_notification.sql`
- [ ] התחבר ל-Supabase של יפעת (zwqfkmgflzywtmyoosow)
- [ ] הרץ את הSQL
- [ ] בדוק שלא היו שגיאות
- [ ] צור בקשה חדשה (test)
- [ ] בדוק ב-Make.com שהwebhook התקבל
- [ ] הגדר את הscenario ב-Make.com
- [ ] בדוק את כל האירועים
- [ ] ✅ מוכן!

---

## 📞 תמיכה

אם הwebhook לא עובד:
1. בדוק שהextension `pg_net` מותקן
2. בדוק שה-triggers נוצרו
3. בדוק את ה-Supabase logs
4. בדוק את ה-Make.com execution history

---

## 🎉 סיכום

```
✅ 3 triggers מוכנים
✅ 3 סוגי אירועים
✅ JSON מובנה
✅ Async execution
✅ מוכן לשימוש!
```

**הwebhook יתחיל לעבוד מיד אחרי הרצת ה-SQL! 🚀**

