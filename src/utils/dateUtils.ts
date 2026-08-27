/**
 * Islamic Hijri Date and Indonesian Date calculations & formatters
 */

import { 
  calculateNuFalakiyahDate, 
  getStoredHijriAdjustment, 
  getPasaranJawa,
  HijriNuDate,
  syncHijriWithNuOnline
} from './hijriNuService';

export { 
  calculateNuFalakiyahDate, 
  getStoredHijriAdjustment, 
  getPasaranJawa,
  syncHijriWithNuOnline 
};
export type { HijriNuDate };

const ISLAMIC_MONTHS = [
  'Muharram', 'Shafar', 'Rabi\'ul Awwal', 'Rabi\'uts Tsani',
  'Jumadal Ula', 'Jumadal Akhirah', 'Rajab', 'Sya\'ban',
  'Ramadhan', 'Syawwal', 'Dzulqa\'dah', 'Dzulhijjah'
];

const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const INDO_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Calculates Hijri date according to Lembaga Falakiyah PBNU / NU Online standards
 */
export function getHijriDate(date: Date = new Date(), adjustmentDays?: number): {
  day: number;
  monthName: string;
  year: number;
  formatted: string;
  weton?: string;
  pasaranJawa?: string;
  islamicEvent?: string | null;
  sunnahFasting?: string | null;
} {
  const adj = adjustmentDays !== undefined ? adjustmentDays : getStoredHijriAdjustment();
  const nuDate = calculateNuFalakiyahDate(date, adj);
  
  return {
    day: nuDate.day,
    monthName: nuDate.monthName,
    year: nuDate.year,
    formatted: nuDate.formatted,
    weton: nuDate.weton,
    pasaranJawa: nuDate.pasaranJawa,
    islamicEvent: nuDate.islamicEvent,
    sunnahFasting: nuDate.sunnahFasting
  };
}

export function formatIndonesianDate(date: Date = new Date()): string {
  const dayName = INDO_DAYS[date.getDay()];
  const day = date.getDate();
  const monthName = INDO_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName}, ${day} ${monthName} ${year}`;
}

export function formatTime24(date: Date = new Date()): {
  hours: string;
  minutes: string;
  seconds: string;
  full: string;
} {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return {
    hours: h,
    minutes: m,
    seconds: s,
    full: `${h}:${m}:${s}`
  };
}

/**
 * Parses "HH:MM" into seconds from midnight
 */
export function timeStringToSeconds(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 3600 + (m || 0) * 60;
}

/**
 * Returns formatted countdown like "01j 24m 30d" or "04m 12d"
 */
export function formatCountdown(diffSeconds: number): string {
  if (diffSeconds <= 0) return '00:00:00';
  const h = Math.floor(diffSeconds / 3600);
  const m = Math.floor((diffSeconds % 3600) / 60);
  const s = diffSeconds % 60;

  if (h > 0) {
    return `${String(h).padStart(2, '0')}j ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}d`;
  }
  return `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}d`;
}
