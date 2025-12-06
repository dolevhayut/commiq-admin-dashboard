/**
 * Provider Reports Information
 * This file contains information about which reports need to be downloaded for each provider
 */

export interface ProviderReportInfo {
  provider: string;
  displayName: string;
  reports: string[];
  notes?: string;
}

export const providerReports: ProviderReportInfo[] = [
  {
    provider: 'migdal',
    displayName: 'מגדל',
    reports: [
      'משולמים בעלים',
      'עמלה מדמי ניהול',
      'עמלה מצבירה',
    ],
    notes: 'כל הדוחות נמצאים תחת: כלים > דוחות > הסכמים ועמלות',
  },
  {
    provider: 'phoenix',
    displayName: 'פניקס',
    reports: [
      'עמלות נפרעים חא"ט',
      'עמלות נפרעים גמל - דוח 1',
      'עמלות נפרעים גמל - דוח 2',
    ],
    notes: 'דוח 2 נקרא "דוח עמלות גמל מורחב"',
  },
  {
    provider: 'clal',
    displayName: 'כלל',
    reports: [
      'פנסיה - עמיתים',
      'עמלות שוטפות חיים - פוליסה',
      'עמלת ניהול חיים - פוליסה',
      'בריאות',
      'גמל - עמיתים',
    ],
    notes: 'כל הדוחות נמצאים בדף עמלות, יש לפתוח את העץ ולבחור כל קטגוריה',
  },
  {
    provider: 'hachshara_secure',
    displayName: 'הכשרה ביטוח',
    reports: [
      'דוח תשלומים לסוכן',
      'נפרעים-פרמיה',
      'בסט אינווסט - עמלות נפרעים',
    ],
    notes: 'כל הדוחות נמצאים תחת תפריט "דוחות"',
  },
  {
    provider: 'menorah',
    displayName: 'מנורה מבטחים',
    reports: [
      'דוח עמלות',
    ],
    notes: 'דוח אחד בלבד - דוח עמלות סוכן',
  },
  {
    provider: 'analyst',
    displayName: 'אנאליסט',
    reports: [
      'דוח עמלות',
    ],
    notes: 'דוח אחד בלבד - יש ללחוץ על "הפקת דוחות" ואז "הפק דוח"',
  },
  {
    provider: 'meitav',
    displayName: 'מיטב דש',
    reports: [
      'דוח עמלות',
    ],
    notes: 'דוח אחד בלבד - דוח עמלות עם בחירת תאריך',
  },
  {
    provider: 'mor',
    displayName: 'מור השקעות',
    reports: [
      'דוח עמלות',
    ],
    notes: 'דוח אחד בלבד - דוח חישוב תגמול עם בחירת חודש',
  },
  {
    provider: 'yellin_lapidot',
    displayName: 'ילין לפידות',
    reports: [
      'דוח עמלות',
    ],
    notes: 'דוח אחד בלבד - דוח עמלות',
  },
  {
    provider: 'harel',
    displayName: 'הראל ביטוח',
    reports: [
      'דוח עמלות',
    ],
    notes: 'דוח אחד בלבד - דוח עמלות',
  },
];

/**
 * Get report information for a specific provider
 */
export function getProviderReports(provider: string): ProviderReportInfo | undefined {
  return providerReports.find(p => p.provider === provider);
}

/**
 * Get all report names for a provider as a formatted string
 */
export function getProviderReportsText(provider: string): string {
  const info = getProviderReports(provider);
  if (!info) {
    return 'דוח עמלות';
  }
  
  if (info.reports.length === 1) {
    return info.reports[0];
  }
  
  return info.reports.join(', ');
}

