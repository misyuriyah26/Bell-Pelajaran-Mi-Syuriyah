import { BellEvent, BellSettings, SchoolProfile, BellLog } from '../types';
import { 
  DEFAULT_BELL_SCHEDULES, 
  DEFAULT_SETTINGS, 
  DEFAULT_SCHOOL_PROFILE 
} from '../data/defaultSchedules';

const KEYS = {
  SCHEDULES: 'mi_syuriyah_schedules_v1',
  SETTINGS: 'mi_syuriyah_settings_v1',
  PROFILE: 'mi_syuriyah_profile_v1',
  LOGS: 'mi_syuriyah_logs_v1',
};

export function loadSchedules(): BellEvent[] {
  try {
    const raw = localStorage.getItem(KEYS.SCHEDULES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load schedules from localStorage:', err);
  }
  return DEFAULT_BELL_SCHEDULES;
}

export function saveSchedules(schedules: BellEvent[]): void {
  try {
    localStorage.setItem(KEYS.SCHEDULES, JSON.stringify(schedules));
  } catch (err) {
    console.error('Failed to save schedules:', err);
  }
}

export function loadSettings(): BellSettings {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { 
        ...DEFAULT_SETTINGS, 
        ...parsed,
        echo: {
          ...DEFAULT_SETTINGS.echo,
          ...(parsed.echo || {})
        }
      };
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: BellSettings): void {
  try {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

export function loadSchoolProfile(): SchoolProfile {
  try {
    const raw = localStorage.getItem(KEYS.PROFILE);
    if (raw) {
      return { ...DEFAULT_SCHOOL_PROFILE, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Failed to load profile:', err);
  }
  return DEFAULT_SCHOOL_PROFILE;
}

export function saveSchoolProfile(profile: SchoolProfile): void {
  try {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save profile:', err);
  }
}

export function loadLogs(): BellLog[] {
  try {
    const raw = localStorage.getItem(KEYS.LOGS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load logs:', err);
  }
  return [];
}

export function saveLogs(logs: BellLog[]): void {
  try {
    // Keep max 100 recent logs
    const trimmed = logs.slice(0, 100);
    localStorage.setItem(KEYS.LOGS, JSON.stringify(trimmed));
  } catch (err) {
    console.error('Failed to save logs:', err);
  }
}

export function exportAllDataAsJSON(schedules: BellEvent[], settings: BellSettings, profile: SchoolProfile, logs: BellLog[]): string {
  const exportPayload = {
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    schoolName: profile.name,
    profile,
    settings,
    schedules,
    logs
  };
  return JSON.stringify(exportPayload, null, 2);
}

export function downloadJSONBackup(jsonData: string, filename: string = 'backup-bel-mi-syuriyah.json'): void {
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
