import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Bell, 
  Play, 
  Sparkles, 
  CheckCircle2, 
  Calendar, 
  Volume2, 
  Moon, 
  BookOpen, 
  SunMedium, 
  Compass, 
  LogOut, 
  AlertTriangle,
  History,
  Trash2,
  CalendarOff,
  Flame,
  Radio,
  Sliders,
  ChevronRight,
  ShieldCheck,
  Globe,
  RefreshCw
} from 'lucide-react';
import { BellEvent, BellLog, BellSettings, SchoolProfile } from '../types';
import { formatIndonesianDate, calculateNuFalakiyahDate, syncHijriWithNuOnline, HijriNuDate, getStoredHijriAdjustment } from '../utils/dateUtils';
import { NuHijriModal } from './NuHijriModal';

interface DashboardViewProps {
  currentTime: Date;
  schedules: BellEvent[];
  logs: BellLog[];
  settings: BellSettings;
  profile: SchoolProfile;
  audioUnlocked: boolean;
  onUnlockAudio: () => void;
  onTriggerBell: (event: BellEvent, type: 'manual' | 'auto') => void;
  onQuickManualTrigger: (category: 'masuk' | 'istirahat' | 'ganti_jam' | 'dhuha' | 'dzuhur' | 'pulang' | 'emergency') => void;
  onClearLogs: () => void;
  nextBell: { event: BellEvent; diffSeconds: number } | null;
  onEmergencyBell: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentTime,
  schedules,
  logs,
  settings,
  profile,
  audioUnlocked,
  onUnlockAudio,
  onTriggerBell,
  onQuickManualTrigger,
  onClearLogs,
  nextBell,
  onEmergencyBell
}) => {
  const currentDay = currentTime.getDay(); // 0-6
  const indonesianDate = formatIndonesianDate(currentTime);

  // NU Hijri Live State
  const [hijriNuData, setHijriNuData] = useState<HijriNuDate>(() => {
    return calculateNuFalakiyahDate(currentTime, getStoredHijriAdjustment());
  });
  const [isNuModalOpen, setIsNuModalOpen] = useState(false);
  const [isQuickSyncing, setIsQuickSyncing] = useState(false);

  // Synchronize on mount and on date change
  useEffect(() => {
    let isMounted = true;
    syncHijriWithNuOnline(currentTime).then((data) => {
      if (isMounted) {
        setHijriNuData(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [currentTime.getDate(), currentTime.getMonth(), currentTime.getFullYear()]);

  const handleQuickSync = async () => {
    setIsQuickSyncing(true);
    try {
      const data = await syncHijriWithNuOnline(currentTime, true);
      setHijriNuData(data);
    } finally {
      setTimeout(() => setIsQuickSyncing(false), 500);
    }
  };

  const hoursStr = String(currentTime.getHours()).padStart(2, '0');
  const minutesStr = String(currentTime.getMinutes()).padStart(2, '0');
  const secondsStr = String(currentTime.getSeconds()).padStart(2, '0');

  // Filter schedules active for today
  const todaySchedules = schedules
    .filter(s => s.days.includes(currentDay as any) && s.enabled)
    .sort((a, b) => a.time.localeCompare(b.time));

  const currentSeconds = currentTime.getHours() * 3600 + currentTime.getMinutes() * 60 + currentTime.getSeconds();

  // Helper for quick countdown format
  const formatSecToCountdown = (sec: number) => {
    if (sec <= 0) return '00:00:00';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isTodayHoliday = settings.holidayMode;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Audio Engine Notice Banner if not unlocked */}
      {!audioUnlocked && (
        <div id="audio-unlock-banner" className="bg-gradient-to-r from-amber-500/15 via-amber-500/25 to-amber-500/15 border border-amber-400/50 rounded-2xl p-4 sm:p-5 text-amber-100 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="p-3 bg-amber-500/20 rounded-xl text-amber-300 border border-amber-400/30">
              <Sparkles className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h3 className="font-bold text-amber-200 text-sm sm:text-base">Aktivasi Izin Audio Browser Diperlukan</h3>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Klik tombol di samping agar browser mengizinkan pemutaran bel otomatis dan suara 3 bahasa tanpa hambatan.
              </p>
            </div>
          </div>
          <button
            id="btn-banner-unlock-audio"
            onClick={onUnlockAudio}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Volume2 className="w-4 h-4" />
            <span>Aktifkan Audio Bel Sekarang</span>
          </button>
        </div>
      )}

      {/* Holiday Notification Banner */}
      {isTodayHoliday && (
        <div id="holiday-alert-banner" className="bg-rose-950/40 border border-rose-600/50 rounded-2xl p-4 text-rose-200 flex items-center gap-3 shadow-md">
          <CalendarOff className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="text-xs sm:text-sm">
            <span className="font-bold text-rose-300">Mode Hari Libur Aktif:</span> {settings.holidayNote || 'Bel otomatis dijeda sementara untuk menghormati hari libur madrasah.'}
          </div>
        </div>
      )}

      {/* Islamic Events / Sunnah Fasting Highlight Banner */}
      {(hijriNuData.islamicEvent || hijriNuData.sunnahFasting) && (
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border border-emerald-600/40 rounded-2xl px-4 py-3 text-white flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-900/80 border border-emerald-500/50 text-amber-300 flex items-center justify-center">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-300 flex items-center gap-2">
                <span>Almanak Falakiyah NU Hari Ini</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-900 text-[10px] text-emerald-300 border border-emerald-600/50">
                  {hijriNuData.weton}
                </span>
              </div>
              <div className="text-xs text-slate-300 font-medium">
                {hijriNuData.islamicEvent && <span className="text-amber-200 font-semibold">{hijriNuData.islamicEvent}</span>}
                {hijriNuData.islamicEvent && hijriNuData.sunnahFasting && <span> • </span>}
                {hijriNuData.sunnahFasting && <span className="text-emerald-300">{hijriNuData.sunnahFasting}</span>}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsNuModalOpen(true)}
            className="text-xs font-bold text-emerald-300 hover:text-emerald-200 flex items-center gap-1 transition-colors px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-700/50 hover:bg-emerald-900"
          >
            <span>Buka Kalender NU</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Grid: Master High-Precision Digital Clock & Next Bell Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Large Digital Clock Card (7 cols on lg) */}
        <div 
          id="digital-clock-card" 
          className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col justify-between"
        >
          {/* Subtle Ambient Light Accents */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-60 h-60 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Top Bar: Gregorian Date & Interactive NU Hijri Badge */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs sm:text-sm">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>{indonesianDate}</span>
              <span className="hidden sm:inline text-slate-400 font-normal">({hijriNuData.pasaranJawa})</span>
            </div>
            
            {/* Interactive NU Hijri Date Badge */}
            <div className="flex items-center gap-2">
              <button
                id="btn-open-hijri-nu"
                type="button"
                onClick={() => setIsNuModalOpen(true)}
                className="group flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-600/50 text-amber-300 text-xs font-semibold transition-all hover:scale-105 shadow-sm"
                title="Klik untuk membuka Kalender Hijriyah NU Online & Ikhbar Falakiyah"
              >
                <Moon className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
                <span className="font-medium text-emerald-300">{hijriNuData.weton},</span>
                <span className="font-bold text-amber-300">{hijriNuData.formatted}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1" />
              </button>

              <button
                type="button"
                onClick={handleQuickSync}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-emerald-300 transition-colors border border-slate-700"
                title="Sinkronkan Kalender NU Online"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isQuickSyncing ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Master Digital Clock Display */}
          <div className="py-6 sm:py-9 text-center flex flex-col items-center justify-center">
            <div className="font-clock text-6xl sm:text-7xl md:text-8xl font-black tracking-tight text-white flex items-center justify-center drop-shadow-[0_2px_16px_rgba(16,185,129,0.15)]">
              <span>{hoursStr}</span>
              <span className="text-emerald-400 animate-pulse mx-1 sm:mx-2 font-light">:</span>
              <span>{minutesStr}</span>
              <span className="text-emerald-400 animate-pulse mx-1 sm:mx-2 font-light">:</span>
              <span className="text-emerald-400 text-4xl sm:text-5xl md:text-6xl font-bold self-end mb-2 sm:mb-3">
                {secondsStr}
              </span>
            </div>
            <div className="text-[11px] font-bold text-slate-400 mt-2 tracking-widest uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />
              <span>Waktu Indonesia Barat (WIB) • Terkoneksi Falakiyah NU Online</span>
            </div>
          </div>

          {/* Bottom Card Bar: Madrasah Info & Operational State */}
          <div className="border-t border-slate-800/80 pt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Status Operasional: </span>
              <span className="font-bold text-emerald-300">
                {isTodayHoliday ? 'Mode Libur Aktif' : 'Otomatis Sesuai Jadwal'}
              </span>
            </div>
            <div className="text-slate-400 font-medium">
              Jadwal Hari Ini: <span className="font-bold text-amber-300">{todaySchedules.length} Waktu</span>
            </div>
          </div>
        </div>

        {/* Next Bell & Countdown Card (5 cols on lg) */}
        <div 
          id="next-bell-card" 
          className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/70 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <img 
                src={profile.logoUrl || "/app-icon.jpg"} 
                alt="Logo Bel" 
                className="w-6 h-6 rounded-lg object-cover border border-amber-400/50 shadow-sm" 
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/app-icon.jpg";
                }}
              />
              <span>Bel Berikutnya Hari Ini</span>
            </div>
            {nextBell && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                Pukul {nextBell.event.time} WIB
              </span>
            )}
          </div>

          {/* Main Info */}
          {nextBell ? (
            <div className="py-5 space-y-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
                  {nextBell.event.name}
                </h3>
                <p className="text-xs text-emerald-400/90 mt-1 font-medium flex items-center gap-1.5">
                  <span>3 Bahasa:</span>
                  <span className="text-slate-300 font-normal">Indonesia • Inggris • Arab</span>
                </p>
              </div>

              {/* Countdown Digital Timer */}
              <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 text-center shadow-inner">
                <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                  Hitung Mundur Bel Berbunyi:
                </div>
                <div className="font-clock text-3xl sm:text-4xl font-extrabold text-amber-300 tracking-wider">
                  {formatSecToCountdown(nextBell.diffSeconds)}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  id="btn-preview-next-bell"
                  onClick={() => onTriggerBell(nextBell.event, 'manual')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Uji Bunyikan Sekarang</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <div className="text-sm font-bold text-slate-200">
                {isTodayHoliday ? 'Hari Ini Mode Libur Madrasah' : 'Semua Bel Hari Ini Telah Berbunyi'}
              </div>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Sistem terjadwal akan aktif kembali secara otomatis pada hari sekolah berikutnya.
              </p>
            </div>
          )}

          {/* Bottom helper */}
          <div className="text-xs text-slate-400 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span>Volume Utama: <strong className="text-slate-200">{Math.round(settings.masterVolume * 100)}%</strong></span>
            <span>Gaya Nada: <strong className="text-slate-200 uppercase">{settings.defaultChimeType}</strong></span>
          </div>
        </div>
      </div>

      {/* Quick Action Matrix: Manual Bell Triggers for Emergency & Fast Actions */}
      <div id="quick-manual-triggers" className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-950/80 text-emerald-400 rounded-xl border border-emerald-600/30">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Pusat Bunyi Bel Spontan (Manual Action)</h2>
              <p className="text-xs text-slate-400">Tekan tombol di bawah untuk membunyikan bel sewaktu-waktu tanpa menunggu jadwal</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          
          {/* Masuk Kelas */}
          <button
            id="quick-bell-masuk"
            onClick={() => onQuickManualTrigger('masuk')}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-700/40 text-emerald-200 transition-all hover:scale-[1.02] active:scale-95 group shadow-sm"
          >
            <BookOpen className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs text-white text-center">Bel Masuk</span>
            <span className="text-[10px] text-emerald-400/80">Mulai KBM</span>
          </button>

          {/* Sholat Dhuha & Istirahat 1 */}
          <button
            id="quick-bell-dhuha"
            onClick={() => onQuickManualTrigger('dhuha')}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-700/40 text-amber-200 transition-all hover:scale-[1.02] active:scale-95 group shadow-sm"
          >
            <SunMedium className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs text-white text-center">Sholat Dhuha</span>
            <span className="text-[10px] text-amber-400/80">Istirahat 1</span>
          </button>

          {/* Ganti Jam */}
          <button
            id="quick-bell-ganti-jam"
            onClick={() => onQuickManualTrigger('ganti_jam')}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-700/40 text-cyan-200 transition-all hover:scale-[1.02] active:scale-95 group shadow-sm"
          >
            <Clock className="w-5 h-5 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs text-white text-center">Ganti Jam</span>
            <span className="text-[10px] text-cyan-400/80">Pergantian Kelas</span>
          </button>

          {/* Sholat Dzuhur & Istirahat 2 */}
          <button
            id="quick-bell-dzuhur"
            onClick={() => onQuickManualTrigger('dzuhur')}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-700/40 text-indigo-200 transition-all hover:scale-[1.02] active:scale-95 group shadow-sm"
          >
            <Compass className="w-5 h-5 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs text-white text-center">Sholat Dzuhur</span>
            <span className="text-[10px] text-indigo-400/80">Istirahat 2</span>
          </button>

          {/* Pulang Sekolah */}
          <button
            id="quick-bell-pulang"
            onClick={() => onQuickManualTrigger('pulang')}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-teal-950/40 hover:bg-teal-900/50 border border-teal-700/40 text-teal-200 transition-all hover:scale-[1.02] active:scale-95 group shadow-sm"
          >
            <LogOut className="w-5 h-5 text-teal-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs text-white text-center">Bel Pulang</span>
            <span className="text-[10px] text-teal-400/80">KBM Selesai</span>
          </button>

          {/* Darurat / Peringatan */}
          <button
            id="quick-bell-darurat"
            onClick={onEmergencyBell}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-rose-950/50 hover:bg-rose-900/60 border border-rose-700/50 text-rose-200 transition-all hover:scale-[1.02] active:scale-95 group shadow-sm"
          >
            <AlertTriangle className="w-5 h-5 text-rose-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs text-white text-center">Siaga Darurat</span>
            <span className="text-[10px] text-rose-400/80">Sirine Evakuasi</span>
          </button>

        </div>
      </div>

      {/* Two Column Layout: Today's Timeline & Bell Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Today's Schedule Timeline (7 cols) */}
        <div id="today-timeline-card" className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Jadwal Bel Aktif Hari Ini ({indonesianDate.split(',')[0]})</h2>
            </div>
            <span className="text-xs text-slate-400 font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700">
              {todaySchedules.length} Acara
            </span>
          </div>

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {todaySchedules.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                Tidak ada jadwal aktif untuk hari ini.
              </div>
            ) : (
              todaySchedules.map((item) => {
                const itemSeconds = parseInt(item.time.split(':')[0], 10) * 3600 + parseInt(item.time.split(':')[1], 10) * 60;
                const isPassed = currentSeconds > itemSeconds + 59;
                const isNext = nextBell?.event.id === item.id;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      isNext 
                        ? 'bg-emerald-950/80 border-amber-400/60 shadow-lg shadow-emerald-950/40 ring-1 ring-amber-400/40' 
                        : isPassed 
                        ? 'bg-slate-950/40 border-slate-800/80 text-slate-400 opacity-70' 
                        : 'bg-slate-950/80 border-slate-800 text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Time pill */}
                      <div className={`font-clock text-xs sm:text-sm font-bold px-2.5 py-1 rounded-xl ${
                        isNext 
                          ? 'bg-amber-400 text-slate-950 shadow-sm' 
                          : isPassed 
                          ? 'bg-slate-800 text-slate-400' 
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-600/40'
                      }`}>
                        {item.time}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs sm:text-sm font-bold ${isNext ? 'text-amber-200' : 'text-white'}`}>
                            {item.name}
                          </span>
                          {isNext && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/40 animate-pulse">
                              BERIKUTNYA
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md mt-0.5">
                          {item.announcements.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPassed ? (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-slate-400 font-semibold px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Sudah</span>
                        </span>
                      ) : null}

                      <button
                        id={`btn-play-schedule-${item.id}`}
                        onClick={() => onTriggerBell(item, 'manual')}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-700 text-slate-300 hover:text-white transition-all shadow-sm active:scale-95"
                        title="Uji bunyikan jadwal ini"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Today's Bell Activity Logs (5 cols) */}
        <div id="bell-logs-card" className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white">Log Aktivitas Bel Hari Ini</h2>
              </div>
              {logs.length > 0 && (
                <button
                  id="btn-clear-logs"
                  onClick={onClearLogs}
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition-colors"
                  title="Hapus riwayat hari ini"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="mt-3 space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Belum ada riwayat bunyi bel yang tercatat hari ini.
                </div>
              ) : (
                logs.slice(0, 15).map((log) => (
                  <div 
                    key={log.id} 
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <span>{log.eventName}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                          log.type === 'auto' 
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                            : log.type === 'emergency' 
                            ? 'bg-rose-950 text-rose-300 border border-rose-800' 
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          {log.type}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-clock">
                        {log.timeStr} • {log.dateStr.split(',')[0]}
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">
                      Selesai
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Tercatat: <strong className="text-slate-300">{logs.length} kali</strong></span>
            <span className="text-emerald-400 font-medium">Audit Trail Otomatis</span>
          </div>
        </div>

      </div>

      {/* Lembaga Falakiyah NU Online Calendar Modal */}
      <NuHijriModal
        isOpen={isNuModalOpen}
        onClose={() => setIsNuModalOpen(false)}
        currentTime={currentTime}
        hijriData={hijriNuData}
        onUpdateHijriData={(updated) => setHijriNuData(updated)}
      />

    </div>
  );
};

