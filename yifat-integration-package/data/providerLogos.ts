/**
 * Provider Logos Mapping
 * Maps provider names to their logo URLs
 * Based on insurance-logos.ts from commiq project
 */

// לוגואים של חברות הביטוח - מעודכנים מהמערכת הישנה
const INSURANCE_LOGOS: Record<string, string> = {
  // חברות ביטוח גדולות
  'harel': 'https://base44.app/api/apps/68497c49fcee73e6e3bf5bb9/files/33289acbf_harel_logo.png',
  'migdal': 'https://base44.app/api/apps/68497c49fcee73e6e3bf5bb9/files/f7e4df8f0_migdal_logo.png',
  'menorah': 'https://base44.app/api/apps/68497c49fcee73e6e3bf5bb9/files/01e087f19_menora_logo.png',
  'menora': 'https://base44.app/api/apps/68497c49fcee73e6e3bf5bb9/files/01e087f19_menora_logo.png',
  'hachshara_secure': 'https://base44.app/api/apps/68497c49fcee73e6e3bf5bb9/files/c4f161aac_hachshara_logo.png',
  'hachshara': 'https://base44.app/api/apps/68497c49fcee73e6e3bf5bb9/files/c4f161aac_hachshara_logo.png',
  'phoenix': 'https://base44.app/api/apps/68497c49fcee73e6e3bf5bb9/files/1a868e332_phoenix_logo.png',
  'fnx': 'https://base44.app/api/apps/68497c49fcee73e6e3bf5bb9/files/1a868e332_phoenix_logo.png',
  'clal': 'https://base44.app/api/apps/68497c49fcee73e6e3bf5bb9/files/97678f42b_clal_logo.png',
  
  // בתי השקעות
  'analyst': 'https://dn.analyst.co.il/wp-content/uploads/2020/06/Untitled-2-1.png',
  'meitav': 'https://base44.app/api/apps/68497c49fcee73e6e3bf5bb9/files/c3de7ee2a_meitav_dash_logo.webp',
  'mor': 'https://www.more.co.il/images/logo_mor.png',
  'more': 'https://www.more.co.il/images/logo_mor.png',
  'yellin_lapidot': 'https://www.yl-invest.co.il/wp-content/themes/yl-invest/img/logo.svg',
  'yelin': 'https://www.yl-invest.co.il/wp-content/themes/yl-invest/img/logo.svg',
};

/**
 * Get logo URL for a provider
 */
export function getProviderLogoUrl(provider: string): string | null {
  const normalizedProvider = provider.toLowerCase();
  return INSURANCE_LOGOS[normalizedProvider] || null;
}

/**
 * Get provider display name
 */
export function getProviderDisplayName(provider: string): string {
  const names: Record<string, string> = {
    migdal: 'מגדל',
    phoenix: 'פניקס',
    clal: 'כלל',
    hachshara_secure: 'הכשרה ביטוח',
    menorah: 'מנורה מבטחים',
    analyst: 'אנאליסט',
    meitav: 'מיטב דש',
    mor: 'מור השקעות',
    yellin_lapidot: 'ילין לפידות',
    harel: 'הראל ביטוח',
  };
  
  return names[provider] || provider;
}

/**
 * Get initials for a provider (fallback when logo not available)
 */
export function getProviderInitials(provider: string): string {
  const displayName = getProviderDisplayName(provider);
  const name = displayName
    .replace(/חברה|חברת|לביטוח|ביטוח|גמל|פנסיה|בית השקעות|בע"?מ/g, '')
    .trim();
  const parts = name.split(/\s+/).filter(Boolean);
  
  if (parts.length >= 2) {
    return `${parts[0][0] || ''}${parts[1][0] || ''}`;
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2);
  }
  return 'לג';
}
