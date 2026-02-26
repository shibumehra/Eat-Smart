export const REGIONS = [
  { code: 'IN', label: '🇮🇳 India', authority: 'FSSAI', tz: 'Asia/Kolkata' },
  { code: 'US', label: '🇺🇸 USA', authority: 'FDA', tz: 'America/New_York' },
  { code: 'UK', label: '🇬🇧 UK', authority: 'FSA', tz: 'Europe/London' },
  { code: 'EU', label: '🇪🇺 EU', authority: 'EFSA', tz: 'Europe/Berlin' },
  { code: 'AU', label: '🇦🇺 Australia', authority: 'FSANZ', tz: 'Australia/Sydney' },
  { code: 'CA', label: '🇨🇦 Canada', authority: 'CFIA', tz: 'America/Toronto' },
] as const;

export type RegionCode = typeof REGIONS[number]['code'];

export function detectRegion(): RegionCode {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.startsWith('Asia/Kolkata') || tz.startsWith('Asia/Calcutta')) return 'IN';
    if (tz.startsWith('America/') && !tz.includes('Toronto')) return 'US';
    if (tz.startsWith('Europe/London')) return 'UK';
    if (tz.startsWith('Europe/')) return 'EU';
    if (tz.startsWith('Australia/')) return 'AU';
    if (tz.includes('Toronto') || tz.includes('Vancouver')) return 'CA';
  } catch {}
  return 'IN';
}
