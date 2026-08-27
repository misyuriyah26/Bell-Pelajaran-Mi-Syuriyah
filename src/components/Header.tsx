import React, { useState } from 'react';
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  Clock, 
  CalendarDays, 
  Sliders, 
  Settings as SettingsIcon, 
  HelpCircle, 
  Megaphone, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2,
  Palette,
  ChevronDown,
  Sun,
  Moon,
  Sparkle,
  User,
  LogOut,
  Lock,
  RefreshCw,
  ShieldCheck,
  Cloud,
  Database,
  Download
} from 'lucide-react';
import { SchoolProfile, BellSettings, ThemePreset, AuthUser } from '../types';

interface HeaderProps {
  activeTab: 'dashboard' | 'schedule' | 'sounds' | 'settings' | 'guide';
  setActiveTab: (tab: 'dashboard' | 'schedule' | 'sounds' | 'settings' | 'guide') => void;
  profile: SchoolProfile;
  audioUnlocked: boolean;
  onUnlockAudio: () => void;
  settings: BellSettings;
  onToggleMute: () => void;
  onOpenManualModal: () => void;
  onEmergencyBell: () => void;
  onThemeChange?: (theme: ThemePreset) => void;
  currentUser: AuthUser | null;
  onLogout: () => void;
  onSwitchAccount: () => void;
  onLockScreen: () => void;
  cloudSyncStatus?: 'synced' | 'syncing' | 'offline';
  onManualCloudSync?: () => void;
}

const THEME_OPTIONS: { id: ThemePreset; name: string; icon: string; previewClass: string }[] = [
  { 
    id: 'professional_slate', 
    name: 'Executive Slate & Emerald', 
    icon: '🏛️',
    previewClass: 'bg-slate-900 border-emerald-500 text-emerald-400' 
  },
  { 
    id: 'classic_emerald', 
    name: 'Madrasah Emerald & Gold', 
    icon: '🕌',
    previewClass: 'bg-emerald-950 border-amber-500 text-amber-300' 
  },
  { 
    id: 'deep_navy', 
    name: 'Sapphire Midnight Navy', 
    icon: '🌌',
    previewClass: 'bg-slate-950 border-sky-500 text-sky-300' 
  },
  { 
    id: 'clean_light', 
    name: 'Clean Institutional Light', 
    icon: '☀️',
    previewClass: 'bg-slate-100 border-emerald-600 text-emerald-700' 
  },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  profile,
  audioUnlocked,
  onUnlockAudio,
  settings,
  onToggleMute,
  onOpenManualModal,
  onEmergencyBell,
  onThemeChange,
  currentUser,
  onLogout,
  onSwitchAccount,
  onLockScreen,
  cloudSyncStatus = 'synced',
  onManualCloudSync
}) => {
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const currentTheme = settings.themePreset || 'professional_slate';

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin', color: 'bg-emerald-950 text-emerald-300 border-emerald-600/60' };
      case 'operator':
        return { label: 'Operator', color: 'bg-amber-950 text-amber-300 border-amber-600/60' };
      case 'viewer':
        return { label: 'Monitor', color: 'bg-sky-950 text-sky-300 border-sky-600/60' };
      default:
        return { label: 'Petugas', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const roleInfo = getRoleBadge(currentUser?.role);

  return (
    <header id="app-header" className="bg-slate-900/95 border-b border-slate-800/80 sticky top-0 z-40 shadow-xl backdrop-blur-md">
      {/* Precision Accent Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-600" />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6">
        {/* Top Primary Bar: Top-Left Navigation & Brand, Top-Right Utility Center */}
        <div className="flex flex-col lg:flex-row items-center justify-between py-2.5 gap-2.5">
          
          {/* Top-Left Section: School Seal + Primary Navigation Menus */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
            
            {/* School Brand Identity */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Official Seal Emblem */}
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-950 border border-emerald-500/40 shadow-md group transition-transform hover:scale-105 overflow-hidden">
                <img 
                  src="/app-icon.jpg" 
                  alt="Logo Bel MI Syuriyah" 
                  className="w-full h-full object-cover" 
                />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm sm:text-base font-extrabold tracking-tight text-white font-display">
                    {profile.name}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-600/50 uppercase">
                    {profile.level || 'MI'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium truncate max-w-[180px] sm:max-w-[220px]">
                  TP {profile.academicYear} • Bel 3 Bahasa
                </div>
              </div>
            </div>

            {/* Vertical Divider on Desktop */}
            <div className="hidden xl:block h-7 w-px bg-slate-800 shrink-0 mx-0.5" />

            {/* Top-Left Menu Navigation Tabs */}
            <nav id="main-nav-tabs" className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-1 w-full sm:w-auto">
              <button
                id="nav-tab-dashboard"
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-gradient-to-r from-emerald-900 to-emerald-950 text-amber-300 border border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                }`}
                title="Dashboard Utama & Jam Real-Time"
              >
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Dashboard</span>
              </button>

              <button
                id="nav-tab-schedule"
                onClick={() => setActiveTab('schedule')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                  activeTab === 'schedule'
                    ? 'bg-gradient-to-r from-emerald-900 to-emerald-950 text-amber-300 border border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                }`}
                title="Atur Jadwal Bel Madrasah"
              >
                <CalendarDays className="w-3.5 h-3.5 text-emerald-400" />
                <span>Jadwal Bel</span>
              </button>

              <button
                id="nav-tab-sounds"
                onClick={() => setActiveTab('sounds')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                  activeTab === 'sounds'
                    ? 'bg-gradient-to-r from-emerald-900 to-emerald-950 text-amber-300 border border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                }`}
                title="Galeri Rekaman MP3 & Suara Bel"
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span>Galeri MP3</span>
              </button>

              <button
                id="nav-tab-settings"
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                  activeTab === 'settings'
                    ? 'bg-gradient-to-r from-emerald-900 to-emerald-950 text-amber-300 border border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                }`}
                title="Pengaturan Profil & Sistem"
              >
                <SettingsIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pengaturan</span>
              </button>

              <button
                id="nav-tab-guide"
                onClick={() => setActiveTab('guide')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                  activeTab === 'guide'
                    ? 'bg-gradient-to-r from-emerald-900 to-emerald-950 text-amber-300 border border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                }`}
                title="Buku Panduan Madrasah"
              >
                <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Panduan</span>
              </button>
            </nav>

          </div>

          {/* Top-Right Section: Action Buttons, Audio Controls & User Account */}
          <div className="flex items-center gap-2 w-full lg:w-auto justify-end flex-wrap sm:flex-nowrap">
            
            {/* Real-Time Live Sync Status Pill */}
            <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-300 text-[11px]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-semibold text-white">WIB</span>
            </div>

            {/* Cloud Firestore Status Badge */}
            <button
              id="btn-cloud-sync-status"
              type="button"
              onClick={onManualCloudSync}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-semibold transition-all ${
                cloudSyncStatus === 'synced'
                  ? 'bg-slate-950/80 border-emerald-600/40 text-emerald-300 hover:bg-slate-900'
                  : cloudSyncStatus === 'syncing'
                  ? 'bg-amber-950/70 border-amber-500/50 text-amber-300 animate-pulse'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Status Sinkronisasi Cloud Firestore (Klik untuk Sinkronisasi Manual)"
            >
              <Cloud className={`w-3.5 h-3.5 ${cloudSyncStatus === 'syncing' ? 'animate-spin text-amber-400' : 'text-emerald-400'}`} />
              <span>{cloudSyncStatus === 'syncing' ? 'Sync Cloud...' : 'Cloud Aktif'}</span>
            </button>

            {/* Audio Engine Unlock Button */}
            {!audioUnlocked ? (
              <button
                id="btn-unlock-audio"
                onClick={onUnlockAudio}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-bold shadow-md transition-all active:scale-95 animate-bounce-subtle"
                title="Klik untuk mengaktifkan output suara otomatis di browser"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                <span>Aktifkan Audio</span>
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-950/70 border border-emerald-600/50 text-emerald-300 text-[11px] font-semibold shadow-inner">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Audio Siap</span>
              </div>
            )}

            {/* Manual Announcement Button */}
            <button
              id="btn-manual-broadcast"
              onClick={onOpenManualModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold border border-emerald-500/50 shadow-sm transition-all active:scale-95"
              title="Kirim Siaran Suara / Pengumuman 3 Bahasa Langsung"
            >
              <Megaphone className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Pengumuman</span>
            </button>

            {/* Emergency Siren Button */}
            <button
              id="btn-emergency-bell"
              onClick={onEmergencyBell}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-900 to-rose-950 hover:from-rose-800 hover:to-rose-900 text-rose-200 text-xs font-bold border border-rose-700/60 shadow-sm transition-all active:scale-95"
              title="Bunyikan Alarm Peringatan / Siaga Darurat Madrasah"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Darurat</span>
            </button>

            {/* Sound Toggle (Desktop & Mobile) */}
            <button
              id="btn-mute-desktop"
              onClick={onToggleMute}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                settings.isMuted 
                  ? 'bg-rose-950/80 border-rose-600 text-rose-300 hover:bg-rose-900 shadow-inner' 
                  : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-200'
              }`}
              title={settings.isMuted ? 'Bunyi Dimatikan (Klik untuk Aktifkan)' : 'Klik untuk Mute'}
            >
              {settings.isMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden md:inline">Muted</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden md:inline">{Math.round(settings.masterVolume * 100)}%</span>
                </>
              )}
            </button>

            {/* Theme Selector Dropdown */}
            {onThemeChange && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-medium text-slate-200 transition-colors shadow-sm"
                  title="Pilih Tema Tampilan"
                >
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {themeDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-fade-in space-y-1">
                    <div className="px-2.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      Pilihan Tema Profesional
                    </div>
                    {THEME_OPTIONS.map((theme) => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => {
                          onThemeChange(theme.id);
                          setThemeDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                          currentTheme === theme.id
                            ? 'bg-emerald-950 border border-emerald-600 text-emerald-300'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{theme.icon}</span>
                          <span>{theme.name}</span>
                        </div>
                        {currentTheme === theme.id && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* User Account & Role Dropdown */}
            <div className="relative">
              <button
                id="btn-user-profile-menu"
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-medium text-slate-200 transition-all shadow-sm group"
                title="Kelola Akun & Keamanan Sesi"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-950 border border-emerald-600/50 flex items-center justify-center text-xs">
                  {currentUser?.avatarIcon || '👤'}
                </div>
                <div className="hidden sm:flex flex-col items-start text-left">
                  <span className="text-[11px] font-bold text-white leading-tight truncate max-w-[90px] group-hover:text-emerald-300">
                    {currentUser?.username || 'Petugas'}
                  </span>
                  <span className={`text-[8px] font-bold px-1 rounded border leading-none ${roleInfo.color}`}>
                    {roleInfo.label}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-3 z-50 animate-fade-in space-y-3">
                  
                  {/* User Profile Header */}
                  <div className="flex items-center gap-3 pb-2.5 border-b border-slate-800">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-lg shadow-inner">
                      {currentUser?.avatarIcon || '👤'}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-white truncate">
                        {currentUser?.fullName || 'Pengguna Madrasah'}
                      </div>
                      <div className="text-[11px] text-amber-300 font-medium truncate">
                        {currentUser?.roleTitle || 'Operator Bel'}
                      </div>
                      {currentUser?.email && (
                        <div className="text-[10px] text-slate-400 truncate">
                          {currentUser.email}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Role Capabilities info */}
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-300 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">Hak Akses:</span>
                      <span className={`px-1.5 py-0.5 rounded font-extrabold uppercase text-[9px] border ${roleInfo.color}`}>
                        {roleInfo.label}
                      </span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      {currentUser?.role === 'admin' && 'Akses penuh ke seluruh konfigurasi, jadwal, audio MP3, profil & pemulihan data.'}
                      {currentUser?.role === 'operator' && 'Akses operasional harian, bunyikan bel manual, siaran 3 bahasa, dan alarm darurat.'}
                      {currentUser?.role === 'viewer' && 'Mode tampilan layar monitor tanpa izin perubahan jadwal.'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="space-y-1 pt-1">
                    <button
                      id="btn-lock-screen"
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLockScreen();
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-slate-800 transition-colors font-medium text-left"
                    >
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>Kunci Layar (Lock Screen)</span>
                    </button>

                    <button
                      id="btn-switch-account"
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onSwitchAccount();
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-slate-800 transition-colors font-medium text-left"
                    >
                      <RefreshCw className="w-4 h-4 text-emerald-400" />
                      <span>Ganti Akun Pengguna</span>
                    </button>

                    <button
                      id="btn-logout"
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-950/60 border border-transparent hover:border-rose-800 transition-colors font-medium text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      <span>Keluar (Logout)</span>
                    </button>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};


