import React, { useState } from 'react';
import { 
  Bell, 
  Lock, 
  User, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  Moon, 
  ArrowRight, 
  Volume2, 
  Radio, 
  Info,
  Shield,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { SchoolProfile, AuthUser } from '../types';
import { authenticate, PRESET_USERS } from '../utils/auth';
import { formatIndonesianDate, getHijriDate, formatTime24 } from '../utils/dateUtils';
import { unlockAudioContext } from '../utils/audioEngine';

interface LoginViewProps {
  profile: SchoolProfile;
  currentTime: Date;
  onLoginSuccess: (user: AuthUser) => void;
  onUnlockAudio?: () => void;
  audioUnlocked?: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({
  profile,
  currentTime,
  onLoginSuccess,
  onUnlockAudio,
  audioUnlocked = false
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const indonesianDate = formatIndonesianDate(currentTime);
  const hijri = getHijriDate(currentTime);
  const timeFormatted = formatTime24(currentTime);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    // Auto unlock audio if not yet unlocked
    unlockAudioContext().catch(() => {});
    if (onUnlockAudio && !audioUnlocked) {
      onUnlockAudio();
    }

    setTimeout(() => {
      const result = authenticate(identifier, password);
      setIsLoading(false);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.message || 'Login gagal. Periksa kembali username dan kata sandi.');
      }
    }, 300);
  };

  const handleSelectPreset = (user: typeof PRESET_USERS[0]) => {
    setIdentifier(user.username);
    setPassword(user.passwordHash);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Precision Accent Top Line */}
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 via-amber-400 to-emerald-600 shadow-md relative z-10" />

      {/* Ambient Glow Backgrounds */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-slate-900/50 rounded-full blur-3xl pointer-events-none" />

      {/* Top Floating Status Bar */}
      <header className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-5 pb-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <img 
            src={profile.logoUrl || "/app-icon.jpg"} 
            alt={profile.name || "Logo Bel MI Syuriyah"} 
            className="w-9 h-9 rounded-xl border border-amber-400/60 shadow-md object-cover" 
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/app-icon.jpg";
            }}
          />
          <div>
            <div className="text-xs font-bold text-white tracking-wide">{profile.name}</div>
            <div className="text-[10px] text-slate-400">Sistem Bel Otomatis &amp; Siaran 3 Bahasa</div>
          </div>
        </div>

        {/* Live Clock Pill & Audio Unlock */}
        <div className="flex items-center gap-3">
          <button
            id="btn-unlock-audio-login"
            type="button"
            onClick={() => {
              unlockAudioContext().catch(() => {});
              if (onUnlockAudio) onUnlockAudio();
            }}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              audioUnlocked
                ? 'bg-emerald-950/70 border-emerald-600 text-emerald-300'
                : 'bg-amber-950/70 border-amber-600 text-amber-300 animate-pulse'
            }`}
            title="Aktivasi izin pemutaran audio browser"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{audioUnlocked ? 'Audio Aktif' : 'Aktifkan Audio'}</span>
          </button>

          <div className="hidden sm:flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs shadow-inner">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-clock">{timeFormatted.full} WIB</span>
            </div>
            <span className="text-slate-600">•</span>
            <div className="text-slate-300 font-medium text-[11px] flex items-center gap-1.5" title="Kalender Hijriyah Lembaga Falakiyah PBNU / NU Online">
              <Moon className="w-3 h-3 text-amber-400" />
              <span className="text-emerald-400 font-semibold">{hijri.weton},</span>
              <span>{hijri.formatted}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Login Center */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex items-center justify-center z-10">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Madrasah Presentation (5 cols) */}
          <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
            
            {/* Seal & Institution Header */}
            <div className="space-y-3">
              <div className="inline-flex items-center justify-center relative group">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-800 to-slate-950 p-1 border-2 border-amber-400/60 shadow-2xl shadow-emerald-950/80 flex items-center justify-center text-amber-300 transition-transform group-hover:scale-105">
                  <img 
                    src={profile.logoUrl || "/app-icon.jpg"} 
                    alt={profile.name || "Logo Bel MI Syuriyah"} 
                    className="w-full h-full rounded-2xl object-cover" 
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/app-icon.jpg";
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Portal Keamanan Operator</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
                  {profile.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md mx-auto lg:mx-0">
                  {profile.tagline || 'Membentuk Generasi Qurani, Cerdas, Berakhlak Mulia & Disiplin'}
                </p>
              </div>
            </div>

            {/* Quick Feature Badges */}
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto lg:mx-0 text-left">
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  <span>3 Bahasa Otomatis</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Pengumuman vokal Indonesia, English &amp; العربية
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sinkron Presisi WIB</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Penjadwalan akurat tanpa ketergantungan internet
                </p>
              </div>
            </div>

            {/* Account Credentials Reference Box */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-800/40 text-left space-y-2 max-w-md mx-auto lg:mx-0">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Daftar Akun Masuk Sistem:</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-slate-200 font-bold">1. Admin (Kepala)</div>
                  <div className="text-emerald-400 font-mono">User: <strong>admin</strong></div>
                  <div className="text-amber-400 font-mono">Pass: <strong>admin123</strong></div>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-slate-200 font-bold">2. Operator (Piket)</div>
                  <div className="text-emerald-400 font-mono">User: <strong>operator</strong></div>
                  <div className="text-amber-400 font-mono">Pass: <strong>piket123</strong></div>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-slate-200 font-bold">3. Dewan Guru</div>
                  <div className="text-emerald-400 font-mono">User: <strong>guru</strong></div>
                  <div className="text-amber-400 font-mono">Pass: <strong>guru123</strong></div>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-slate-200 font-bold">4. Monitor Kelas</div>
                  <div className="text-emerald-400 font-mono">User: <strong>monitor</strong></div>
                  <div className="text-amber-400 font-mono">Pass: <strong>monitor123</strong></div>
                </div>
              </div>
            </div>

            {/* Operational Info Note */}
            <div className="hidden lg:flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-slate-300">
              <Info className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Tahun Pelajaran <strong className="text-amber-300">{profile.academicYear}</strong> • NPSN: <strong className="text-slate-200">{profile.npsn}</strong>
              </span>
            </div>
          </div>

          {/* Right Column: Clean Secure Login Form (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
            
            {/* Ambient Corner Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                <span>Masuk ke Panel Bel Madrasah</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Silakan masukkan nama pengguna atau email dan kata sandi akun madrasah
              </p>
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/70 border border-rose-600/60 text-rose-200 text-xs font-medium flex items-center gap-2.5 animate-shake">
                <Shield className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Username Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Nama Pengguna / Email Madrasah
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="input-login-username"
                    type="text"
                    required
                    placeholder="Masukkan nama pengguna atau email..."
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Kata Sandi / PIN Keamanan
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    id="input-login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan kata sandi..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Option */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>Ingat sesi masuk di komputer ini</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                id="btn-submit-login"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Memverifikasi Akun...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Panel Bel</span>
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </>
                )}
              </button>

              {/* Quick Preset Accounts Section */}
              <div className="pt-2">
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400">
                    <span className="bg-slate-900/90 px-3">Pilih Cepat Akun Madrasah (1-Klik)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-1">
                  {PRESET_USERS.map((usr) => (
                    <button
                      key={usr.id}
                      type="button"
                      onClick={() => handleSelectPreset(usr)}
                      className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between ${
                        identifier === usr.username
                          ? 'bg-emerald-950/80 border-emerald-500 ring-1 ring-emerald-500'
                          : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{usr.avatarIcon}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          usr.role === 'admin' 
                            ? 'bg-emerald-900/80 text-emerald-300' 
                            : usr.role === 'operator'
                            ? 'bg-amber-900/80 text-amber-300'
                            : 'bg-sky-900/80 text-sky-300'
                        }`}>
                          {usr.role.toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-1">
                        <div className="text-xs font-bold text-white leading-tight truncate">{usr.username}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Sandi: {usr.passwordHash}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </form>

            {/* Security Indicator Footer */}
            <div className="mt-5 pt-3.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Autentikasi Internal Madrasah</span>
              </span>
              <span className="text-[11px] text-slate-400">
                MI Syuriyah Pebatan
              </span>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-300 border-t border-slate-800/80 z-10">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>© {new Date().getFullYear()} {profile.name} • Sistem Keamanan Mandiri</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-emerald-400 font-medium">🇮🇩 Indonesia • 🇬🇧 English • 🇸🇦 العربية</span>
          <span className="text-slate-300 font-mono">v2.5.0 Professional</span>
        </div>
      </footer>

    </div>
  );
};
