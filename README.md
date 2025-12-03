# Commiq Admin Dashboard

מערכת ניהול בקשות Helpdesk עבור Commiq

## התקנה

```bash
npm install
```

## הרצה מקומית

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Deploy to Vercel

הפרויקט מוכן ל-deploy ישיר ל-Vercel:

1. חבר את הrepo ל-Vercel
2. ההגדרות כבר מוגדרות ב-`vercel.json`
3. Deploy!

## הגדרות סביבה

צור קובץ `.env.local`:

```
VITE_API_URL=https://commiq-server.fly.dev/helpdesk
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
