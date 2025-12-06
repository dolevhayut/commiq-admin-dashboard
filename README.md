# 📥 Commiq Admin Dashboard

מערכת ניהול בקשות Helpdesk עבור Commiq - עם Wizard מודרך להורדת דוחות

## ✨ תכונות

- 📋 **Wizard מודרך** - 4 שלבים ברורים (פרטי בקשה → OTP → העלאה → סיום)
- ⚡ **Realtime Updates** - מעקב בזמן אמת אחר שינויים
- 🎓 **טוטוריאל מובנה** - onboarding לעובדים חדשים
- 🖼️ **לוגואים של פורטלים** - זיהוי ויזואלי מהיר
- 💡 **רמזים אוטומטיים** - מידע על הדוחות הנדרשים לכל פורטל
- 📱 **התראות** - OTP notifications בדפדפן

## 🚀 התקנה

```bash
npm install
```

## 🏃 הרצה מקומית

```bash
npm run dev
```

הממשק יהיה זמין ב: `http://localhost:5180`

## 🏗️ Build

```bash
npm run build
```

## 🌐 Deploy to Vercel

הפרויקט מוכן ל-deploy ישיר ל-Vercel:

1. חבר את ה-repo ל-Vercel
2. ההגדרות כבר מוגדרות ב-`vercel.json`
3. Deploy!

**Live Demo**: https://admin-dashboard-olive.vercel.app

## ⚙️ הגדרות סביבה

צור קובץ `.env.local`:

```bash
VITE_API_URL=https://commiq-server.fly.dev/helpdesk
VITE_SUPABASE_URL=https://qrcfnsmotffomtjusimg.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🔗 אינטגרציה עם מערכת יפעת

### 📚 מסמכים זמינים:

1. **`FOR_YIFAT.md`** ⭐ - **התחל כאן!** - סקירה כללית וקצרה
2. **`YIFAT_INTEGRATION_QUICK_START.md`** - התחלה מהירה (15 דקות)
3. **`INTEGRATION_GUIDE.md`** - מדריך מלא ומפורט
4. **`ARCHITECTURE_OVERVIEW.md`** - הבנת המערכות והארכיטקטורה
5. **`sql/setup_download_wizard_for_yifat.sql`** - SQL מוכן להרצה

### 🎯 מידע על המערכות

| פרט | מערכת יפעת | מערכת דולב |
|-----|-----------|-----------|
| URL | commiq-ifat.vercel.app | commiq-ai.vercel.app |
| Supabase | `zwqfkmgflzywtmyoosow` | `qrcfnsmotffomtjusimg` |
| מצב | אין Wizard | ✅ Wizard עובד |

---

## 📁 מבנה הפרויקט

```
src/
├── components/
│   ├── Layout.tsx              # Layout ראשי עם sidebar
│   ├── ProviderLogo.tsx        # קומפוננטת לוגו פורטל
│   └── Tutorial.tsx            # קומפוננטת הטוטוריאל
├── contexts/
│   └── TutorialContext.tsx     # ניהול מצב הטוטוריאל
├── data/
│   ├── providerReports.ts      # מידע על דוחות לכל פורטל
│   ├── providerLogos.ts        # URLs של לוגואים
│   └── tutorialSteps.ts        # שלבי הטוטוריאל
├── hooks/
│   └── useRealtimeTickets.ts   # Realtime subscriptions
├── lib/
│   └── supabase.ts             # Supabase client
├── pages/
│   ├── DashboardPage.tsx       # דף Dashboard
│   ├── TicketsPage.tsx         # רשימת בקשות
│   ├── TicketDetailPage.tsx    # Wizard להורדת דוח
│   └── LoginPage.tsx           # התחברות
├── services/
│   └── api.ts                  # API client
└── types/
    └── index.ts                # TypeScript types
```

---

## 🎯 פורטלים נתמכים (10)

| פורטל | שם | דוחות |
|-------|-----|--------|
| `migdal` | מגדל | 3 |
| `phoenix` | פניקס | 3 |
| `clal` | כלל | 5 |
| `hachshara_secure` | הכשרה | 3 |
| `menorah` | מנורה | 1 |
| `analyst` | אנאליסט | 1 |
| `meitav` | מיטב דש | 1 |
| `mor` | מור | 1 |
| `yellin_lapidot` | ילין לפידות | 1 |
| `harel` | הראל | 1 |

---

## 🔧 API Endpoints

**Base URL**: `https://commiq-server.fly.dev/helpdesk`

### עיקריים:
- `GET /admin/tickets` - רשימת בקשות
- `GET /admin/tickets/:id` - פרטי בקשה
- `POST /admin/tickets/:id/assign` - קח בקשה
- `POST /admin/tickets/:id/request-otp` - בקש OTP
- `POST /admin/tickets/:id/complete` - סיים בקשה

**לפרטים מלאים**: ראה `INTEGRATION_GUIDE.md`

---

## 🎓 הפעלת הטוטוריאל

1. התחבר למערכת
2. לחץ על כפתור "הדגמה" ב-header
3. עקוב אחר ההוראות המודרכות

---

## 📞 תמיכה

- **Repository**: `commiq-admin-dashboard-new`
- **API Server**: `commiq-server.fly.dev`
- **Demo Live**: https://admin-dashboard-olive.vercel.app

---

## 🎉 מוכן לשימוש!

המערכת עובדת מושלם ב-`commiq-ai.vercel.app` - רק צריך לשלב! 🚀

