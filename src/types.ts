export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Minggu, 1 = Senin, ... 6 = Sabtu

export type BellCategory = 
  | 'masuk' 
  | 'ganti_jam' 
  | 'istirahat' 
  | 'dhuha' 
  | 'dzuhur' 
  | 'pulang' 
  | 'upacara' 
  | 'custom';

export type ChimeType = 
  | 'westminster' 
  | 'tubular'
  | 'three_tone' 
  | 'dingdong' 
  | 'electric' 
  | 'soft' 
  | 'mic_chirp'
  | 'emergency' 
  | 'custom_audio';

export type EchoPreset = 'hallway' | 'courtyard' | 'classroom' | 'studio' | 'custom';

export interface EchoSettings {
  enabled: boolean;
  preset: EchoPreset;
  delayTime: number; // in seconds, e.g. 0.05 to 0.6s
  feedback: number;  // 0.0 to 0.75
  wetLevel: number;  // 0.0 to 0.8
  filterFreq: number; // in Hz, e.g. 800 to 6000Hz (for natural acoustic dampening)
}

export type VoicePersona = 'ustadz' | 'ustadzah' | 'formal' | 'santri' | 'custom';

export type ThemePreset = 'professional_slate' | 'classic_emerald' | 'deep_navy' | 'clean_light';

export interface BellAnnouncement {
  id: string; // Indonesian text
  en: string; // English text
  ar: string; // Arabic text
}

export interface CustomAudioUrls {
  bellAudioUrl?: string; // Base64 or Blob URL
  bellFileName?: string;
  idAudioUrl?: string;
  idFileName?: string;
  enAudioUrl?: string;
  enFileName?: string;
  arAudioUrl?: string;
  arFileName?: string;
}

export interface AudioFileItem {
  id: string;
  name: string; // Display name / title
  fileName: string; // Original file name e.g. "01_Masuk_Sekolah.mp3"
  folderName?: string; // Folder name if uploaded via folder picker
  fullRelativePath?: string; // e.g. "Bel_Sekolah/01_Masuk_Sekolah.mp3"
  size: number; // in bytes
  sizeFormatted: string; // e.g. "1.4 MB"
  type: string; // e.g. "audio/mpeg"
  url: string; // Data URL (Base64) or Blob URL
  duration?: number; // duration in seconds
  durationFormatted?: string; // "00:15"
  uploadedAt: string; // ISO date string
  detectedCategory?: BellCategory | 'bel' | 'pengumuman' | 'lagu' | 'doa' | 'lainnya';
  suggestedScheduleId?: string;
  targetSlot?: 'bell' | 'id' | 'en' | 'ar';
}

export interface BellEvent {
  id: string;
  time: string; // "07:00" in 24h format
  name: string; // e.g. "Bel Masuk Kelas & Doa Pagi"
  category: BellCategory;
  days: DayOfWeek[]; // Days when active (e.g., [1,2,3,4,5,6])
  enabled: boolean;
  chimeType: ChimeType;
  repeatChime: number; // 1, 2, or 3 times
  announcements: BellAnnouncement;
  playChime: boolean;
  playTTS: boolean;
  customAudio?: CustomAudioUrls;
}

export interface SchoolProfile {
  name: string;
  shortName?: string; // Short title for PWA app launcher / home screen icon
  tagline: string;
  level: string;
  npsn: string;
  address: string;
  headmaster: string;
  phone: string;
  academicYear: string;
  logoUrl?: string; // Custom app icon / logo (Base64 or URL)
  faviconUrl?: string; // Custom browser tab favicon (Base64 or URL)
}

export interface BellSettings {
  masterVolume: number; // 0.0 to 1.0
  chimeVolume: number;
  ttsVolume: number;
  ttsRate: number; // 0.8 - 1.2
  ttsPitch: number; // 0.8 - 1.2
  preferredVoiceId: string;
  preferredVoiceEn: string;
  preferredVoiceAr: string;
  voicePersona: VoicePersona;
  echo: EchoSettings;
  playPreChirp: boolean; // Play pleasant mic chirp "Tung-Ting" before announcements
  realisticVoiceEnhance: boolean; // Fine-tune natural cadences & tone
  defaultChimeType: ChimeType;
  customBellAudioUrl?: string; // Global custom uploaded bell MP3 / audio
  customBellFileName?: string;
  isMuted: boolean;
  holidayMode: boolean;
  holidayNote: string;
  holidayDates: string[]; // ['2026-08-17', ...]
  activePreset: 'standard' | 'jumat' | 'ujian' | 'ramadhan' | 'custom';
  themePreset?: ThemePreset;
  autoPlayAudioUnlocked: boolean;
  showVisualNotification: boolean;
}

export interface BellLog {
  id: string;
  timestamp: string; // ISO string
  timeStr: string; // "07:00:00"
  dateStr: string; // "Senin, 15 Agustus 2026"
  eventName: string;
  type: 'auto' | 'manual' | 'emergency';
  status: 'success' | 'cancelled' | 'error';
  announcementText?: string;
}

export interface ActivePlaybackState {
  isPlaying: boolean;
  currentStep: 'idle' | 'chime' | 'tts_id' | 'tts_en' | 'tts_ar' | 'finished';
  event?: BellEvent;
  manualTitle?: string;
  manualAnnouncements?: BellAnnouncement;
  customChimeType?: ChimeType;
  sourceType: 'auto' | 'manual' | 'emergency' | 'preview';
}

export type UserRole = 'admin' | 'operator' | 'viewer';

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  roleTitle: string;
  email?: string;
  avatarIcon?: string;
  lastLogin?: string;
}

export interface AuthSettings {
  requireLogin: boolean; // if false, allows guest bypass or auto-login
  autoLockMinutes: number; // 0 = never
}

