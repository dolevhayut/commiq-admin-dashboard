# 📑 מפתח קבצים - Download Wizard Package

## 🗂️ מבנה התיקייה

```
yifat-integration-package/
│
├── 📄 START_HERE.md ⭐⭐⭐
│   └─ הקובץ הראשון לקריאה! סקירה כללית וקצרה
│
├── 📄 README.md
│   └─ מידע על תוכן החבילה
│
├── 📄 FILE_INDEX.md (הקובץ הזה)
│   └─ מפתח מפורט לכל הקבצים
│
├── 📁 docs/ - מסמכי הדרכה
│   ├── FOR_YIFAT.md (5 דקות קריאה)
│   │   └─ סקירה כללית, מה יש בחבילה, איך להתחיל
│   │
│   ├── YIFAT_INTEGRATION_QUICK_START.md ⭐ (15 דקות)
│   │   └─ מדריך מעשי צעד אחר צעד
│   │   └─ כולל: SQL, קוד לדוגמה, אופציות שילוב
│   │
│   ├── INTEGRATION_GUIDE.md (30 דקות)
│   │   └─ מדריך מקיף ומפורט
│   │   └─ כולל: API endpoints, Realtime, RLS policies
│   │
│   └── ARCHITECTURE_OVERVIEW.md (10 דקות)
│       └─ הבנת המערכות והארכיטקטורה
│       └─ דיאגרמות ותרשימי זרימה
│
├── 📁 sql/ - סקריפטים מוכנים להרצה
│   └── setup_download_wizard_for_yifat.sql ⭐⭐⭐
│       └─ יוצר את כל הטבלאות והפוליסים
│       └─ הרץ ב: https://supabase.com/dashboard/project/zwqfkmgflzywtmyoosow/sql
│       └─ זמן ריצה: ~30 שניות
│
├── 📁 examples/ - דוגמאות מוכנות
│   └── Downloads.example.jsx ⭐
│       └─ עמוד מוכן להעתקה ישירות
│       └─ העתק ל: src/pages/Downloads.jsx
│       └─ כולל: stats, realtime, wizard dialog
│
├── 📁 components/ - קומפוננטות React
│   ├── ProviderLogo.tsx
│   │   └─ מציג לוגו של הפורטל (או initials)
│   │   └─ תומך בגדלים: xs, sm, md, lg
│   │
│   ├── Tutorial.tsx
│   │   └─ מערכת הטוטוריאל עם spotlight
│   │   └─ tooltips מודרכים, ניווט בין שלבים
│   │
│   └── Layout.tsx (לדוגמה)
│       └─ Layout עם sidebar, header, profile menu
│
├── 📁 pages/ - דפים מלאים
│   ├── TicketDetailPage.tsx ⭐⭐⭐
│   │   └─ הWizard הראשי! ליבת המערכת
│   │   └─ 4 שלבים: Details → OTP → Upload → Complete
│   │
│   ├── TicketsPage.tsx
│   │   └─ רשימת בקשות עם סינון ו-pagination
│   │
│   ├── DashboardPage.tsx
│   │   └─ Dashboard עם stats cards ורשימות
│   │
│   └── LoginPage.tsx
│       └─ דף התחברות פשוט
│
├── 📁 data/ - קבצי נתונים
│   ├── providerReports.ts ⭐
│   │   └─ מידע על הדוחות הנדרשים לכל פורטל
│   │   └─ 10 פורטלים, כולל הערות והנחיות
│   │
│   ├── providerLogos.ts
│   │   └─ URLs של לוגואים לכל פורטל
│   │   └─ fallback ל-initials
│   │
│   └── tutorialSteps.ts
│       └─ שלבי הטוטוריאל לכל דף
│       └─ כולל: target selectors, positions, descriptions
│
├── 📁 hooks/ - React Hooks
│   └── useRealtimeTickets.ts ⭐
│       └─ Realtime subscriptions ל-Supabase
│       └─ עדכונים אוטומטיים של בקשות
│       └─ התראות על OTP
│
├── 📁 contexts/ - React Contexts
│   └── TutorialContext.tsx
│       └─ ניהול מצב הטוטוריאל
│       └─ זיהוי דף נוכחי וטעינת שלבים
│
├── 📁 services/ - API Services
│   └── api.ts ⭐
│       └─ כל ה-API endpoints
│       └─ פונקציות: fetch, assign, update, complete
│
├── 📁 types/ - TypeScript Types
│   └── index.ts
│       └─ הגדרות טיפוסים: Ticket, Activity, OTP, Stats
│
└── 📁 lib/ - Utilities
    └── supabase.ts
        └─ Supabase client configuration
        └─ Realtime subscriptions
```

---

## 🎯 מה להעתיק לאן?

### שילוב מהיר (10 דקות):
```
1. sql/setup_download_wizard_for_yifat.sql
   → הרץ ב-Supabase של יפעת

2. examples/Downloads.example.jsx
   → העתק ל: commiq-ifat/src/pages/Downloads.jsx

3. הוסף Route ב-App.jsx
   → <Route path="/downloads" element={<Downloads />} />
```

### שילוב מלא (יום עבודה):
```
components/ → commiq-ifat/src/components/
pages/      → commiq-ifat/src/pages/ או src/components/downloads/
data/       → commiq-ifat/src/lib/downloads/
hooks/      → commiq-ifat/src/hooks/
contexts/   → commiq-ifat/src/contexts/
services/   → commiq-ifat/src/api/
types/      → commiq-ifat/src/types/
```

---

## ⭐ קבצים קריטיים (חובה)

### 1. SQL
- `sql/setup_download_wizard_for_yifat.sql` - **הכי חשוב!**

### 2. הWizard עצמו
- `pages/TicketDetailPage.tsx` - הליבה של המערכת

### 3. נתונים
- `data/providerReports.ts` - מידע על דוחות
- `data/providerLogos.ts` - לוגואים

### 4. Realtime
- `hooks/useRealtimeTickets.ts` - עדכונים בזמן אמת

---

## 📊 סטטיסטיקה

- **קבצים**: 22 קבצים
- **גודל לא דחוס**: 260KB
- **גודל דחוס (ZIP)**: 67KB
- **מסמכים**: 5 קבצי markdown
- **קבצי קוד**: 17 קבצים
- **SQL**: 1 סקריפט מוכן

---

## 🔍 איפה למצוא מה?

### רוצה להבין את הארכיטקטורה?
→ `docs/ARCHITECTURE_OVERVIEW.md`

### רוצה להתחיל מהר?
→ `START_HERE.md` + `examples/Downloads.example.jsx`

### רוצה מדריך צעד אחר צעד?
→ `docs/YIFAT_INTEGRATION_QUICK_START.md`

### רוצה את כל הפרטים הטכניים?
→ `docs/INTEGRATION_GUIDE.md`

### רוצה לראות את הקוד?
→ `pages/TicketDetailPage.tsx` (הWizard)

---

## 💡 טיפ חשוב

התחילי עם **האופציה המהירה** (iframe) כדי לראות שהכל עובד, ואז תחליטי אם לעשות שילוב מלא.

---

**כל הקבצים מסודרים ומוכנים! 🎉**

