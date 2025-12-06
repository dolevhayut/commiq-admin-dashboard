import { TutorialStep } from '../components/Tutorial';

// Dashboard page tutorial steps
export const dashboardSteps: TutorialStep[] = [
  {
    id: 'dashboard-welcome',
    title: 'ברוכים הבאים למערכת Commiq Helpdesk!',
    description: 'בואו נכיר את המערכת. זהו לוח הבקרה הראשי שמציג לכם סקירה כללית של כל הבקשות.',
    position: 'center',
    route: '/',
  },
  {
    id: 'dashboard-stats',
    title: 'כרטיסי סטטיסטיקה',
    description: 'כאן תוכלו לראות את מספר הבקשות בכל סטטוס. הכרטיסים מתעדכנים בזמן אמת ומציגים את המצב הנוכחי של הבקשות.',
    target: '[data-tutorial="stats-cards"]',
    position: 'bottom',
  },
  {
    id: 'dashboard-urgent',
    title: 'בקשות דחופות',
    description: 'בקשות שדורשות טיפול מיידי מוצגות כאן. אלו הן בקשות במצב "ממתין" או "ממתין ל-OTP". לחצו על בקשה כדי לפתוח אותה.',
    target: '[data-tutorial="urgent-tickets"]',
    position: 'left',
  },
  {
    id: 'dashboard-recent',
    title: 'פעילות אחרונה',
    description: 'כאן תוכלו לראות את הבקשות שעודכנו לאחרונה. זה עוזר לעקוב אחר הפעילות במערכת.',
    target: '[data-tutorial="recent-activity"]',
    position: 'right',
  },
  {
    id: 'dashboard-navigation',
    title: 'ניווט במערכת',
    description: 'בסרגל הצדדי תוכלו לנווט בין הדפים השונים. לחצו על "כל הבקשות" כדי לראות את כל הבקשות במערכת.',
    target: '[data-tutorial="nav-tickets"]',
    position: 'left',
    action: 'click',
  },
];

// Tickets page tutorial steps
export const ticketsSteps: TutorialStep[] = [
  {
    id: 'tickets-welcome',
    title: 'דף כל הבקשות',
    description: 'כאן תוכלו לראות את כל הבקשות במערכת, לסנן אותן לפי סטטוס, ולנווט בין עמודים.',
    position: 'center',
    route: '/tickets',
  },
  {
    id: 'tickets-filters',
    title: 'סינון בקשות',
    description: 'השתמשו בכפתורי הסינון כדי לראות בקשות לפי סטטוס מסוים. לדוגמה, תוכלו לראות רק בקשות "ממתינים" או "הושלמו".',
    target: '[data-tutorial="status-filters"]',
    position: 'bottom',
  },
  {
    id: 'tickets-table',
    title: 'טבלת הבקשות',
    description: 'הטבלה מציגה את כל הפרטים החשובים על כל בקשה: פורטל, לקוח, תקופה, סטטוס, מטפל ותאריך יצירה.',
    target: '[data-tutorial="tickets-table"]',
    position: 'top',
  },
  {
    id: 'tickets-actions',
    title: 'צפייה בבקשה',
    description: 'לחצו על כפתור "צפייה" כדי לפתוח בקשה ולטפל בה. זה יוביל אתכם לדף פרטי הבקשה.',
    target: '[data-tutorial="view-button"]',
    position: 'left',
    action: 'click',
  },
  {
    id: 'tickets-pagination',
    title: 'ניווט בין עמודים',
    description: 'אם יש הרבה בקשות, תוכלו לנווט בין עמודים באמצעות כפתורי "הקודם" ו-"הבא".',
    target: '[data-tutorial="pagination"]',
    position: 'top',
  },
];

// Ticket detail page tutorial steps
export const ticketDetailSteps: TutorialStep[] = [
  {
    id: 'ticket-detail-welcome',
    title: 'דף פרטי בקשה',
    description: 'כאן תוכלו לראות את כל הפרטים של הבקשה ולטפל בה. התהליך מחולק לשלבים ברורים.',
    position: 'center',
  },
  {
    id: 'ticket-detail-progress',
    title: 'מעקב התקדמות',
    description: 'הסרגל העליון מציג את השלבים בתהליך הטיפול בבקשה. כל שלב מסומן כשהוא הושלם.',
    target: '[data-tutorial="progress-steps"]',
    position: 'bottom',
  },
  {
    id: 'ticket-detail-credentials',
    title: 'פרטי התחברות',
    description: 'כאן תוכלו לראות את פרטי ההתחברות של הלקוח. לחצו על כפתור ההעתקה כדי להעתיק את הפרטים.',
    target: '[data-tutorial="credentials"]',
    position: 'left',
  },
  {
    id: 'ticket-detail-client-info',
    title: 'פרטי לקוח',
    description: 'כאן מוצגים פרטי הלקוח: שם, אימייל, טלפון ותקופת הדוח המבוקש.',
    target: '[data-tutorial="client-info"]',
    position: 'right',
  },
  {
    id: 'ticket-detail-start',
    title: 'התחלת טיפול',
    description: 'לחצו על "קח בקשה והתחל" כדי לקחת את הבקשה ולהתחיל לטפל בה. זה יעביר את הבקשה למצב "בטיפול".',
    target: '[data-tutorial="start-button"]',
    position: 'top',
    action: 'click',
  },
  {
    id: 'ticket-detail-otp',
    title: 'קבלת קוד OTP',
    description: 'אם נדרש קוד OTP, תוכלו לבקש אותו מהלקוח. הקוד יופיע כאן ברגע שהלקוח יזין אותו.',
    target: '[data-tutorial="otp-section"]',
    position: 'bottom',
  },
  {
    id: 'ticket-detail-reports-info',
    title: 'מידע על הדוחות',
    description: 'כאן תוכלו לראות איזה דוחות צריך להעלות מהפורטל הספציפי. כל פורטל דורש דוחות שונים - חלקם דורשים דוח אחד וחלקם מספר דוחות. ודאו שהעליתם את כל הדוחות הנדרשים.',
    target: '[data-tutorial="reports-info"]',
    position: 'bottom',
  },
  {
    id: 'ticket-detail-upload',
    title: 'העלאת קובץ',
    description: 'לאחר קבלת ה-OTP, תוכלו להעלות את קובץ הדוח. גררו קובץ או לחצו על "בחר קובץ מהמחשב". אם יש מספר דוחות, תוכלו להעלות אותם אחד אחרי השני או כקובץ אחד מאוחד.',
    target: '[data-tutorial="upload-section"]',
    position: 'top',
  },
  {
    id: 'ticket-detail-complete',
    title: 'סיום הבקשה',
    description: 'לאחר העלאת הקובץ, לחצו על "סיים בהצלחה" כדי להשלים את הבקשה. הלקוח יקבל התראה שהדוח מוכן.',
    target: '[data-tutorial="complete-button"]',
    position: 'top',
  },
];

