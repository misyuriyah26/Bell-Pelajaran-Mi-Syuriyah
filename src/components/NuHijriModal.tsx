import React, { useState } from 'react';
import { 
  X, 
  Moon, 
  RefreshCw, 
  CheckCircle2, 
  Sparkles, 
  Calendar, 
  Compass, 
  Globe, 
  Sliders, 
  Info,
  Clock,
  BookOpen
} from 'lucide-react';
import { 
  HijriNuDate, 
  syncHijriWithNuOnline, 
  getStoredHijriAdjustment, 
  saveStoredHijriAdjustment,
  NU_ISLAMIC_MONTHS
} from '../utils/hijriNuService';

interface NuHijriModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTime: Date;
  hijriData: HijriNuDate;
  onUpdateHijriData: (data: HijriNuDate) => void;
}

export const NuHijriModal: React.FC<NuHijriModalProps> = ({
  isOpen,
  onClose,
  currentTime,
  hijriData,
  onUpdateHijriData
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [adjustment, setAdjustment] = useState<number>(getStoredHijriAdjustment());

  if (!isOpen) return null;

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncStatusMsg(null);
    try {
      const updated = await syncHijriWithNuOnline(currentTime, true);
      onUpdateHijriData(updated);
      setSyncStatusMsg('Sinkronisasi Kalender Hijriyah NU Online berhasil!');
      setTimeout(() => setSyncStatusMsg(null), 3500);
    } catch (err) {
      setSyncStatusMsg('Sinkronisasi selesai menggunakan Hisab Falakiyah PBNU.');
      setTimeout(() => setSyncStatusMsg(null), 3500);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAdjustmentChange = async (newAdj: number) => {
    setAdjustment(newAdj);
    saveStoredHijriAdjustment(newAdj);
    setIsSyncing(true);
    try {
      const updated = await syncHijriWithNuOnline(currentTime, true);
      onUpdateHijriData(updated);
    } finally {
      setIsSyncing(false);
    }
  };

  // Generate 12 months overview for reference
  const currentMonthIndex = hijriData.month;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-emerald-600/50 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-950 border border-emerald-500/50 text-amber-300 flex items-center justify-center shadow-md">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white font-display">
                  Kalender Hijriyah Lembaga Falakiyah NU
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-600/50 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-emerald-400" />
                  <span>NU Online Sync</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sinkronisasi hisab &amp; rukyat Imkanur Rukyah MABIMS / LF PBNU
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scrollable Body */}
        <div className="overflow-y-auto no-scrollbar py-4 space-y-5 flex-1 relative z-10">
          
          {/* Main Hijri Date Banner */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-950/80 via-slate-950 to-emerald-950/60 border border-emerald-600/40 shadow-inner space-y-3 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase">
                  Weton &amp; Penanggalan Hijriyah Hari Ini
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-display mt-0.5">
                  {hijriData.formattedFull}
                </h2>
                <div className="text-xs text-slate-300 mt-1 font-arabic text-lg text-emerald-300">
                  {hijriData.day} {hijriData.monthNameArabic} {hijriData.year} هـ
                </div>
              </div>

              {/* Sync Status Badge */}
              <div className="flex flex-col items-center sm:items-end gap-1.5 shrink-0">
                <button
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
                  title="Sinkronkan tanggal dengan server Falakiyah NU Online"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Menghubungkan...' : 'Sinkronkan Sekarang'}</span>
                </button>
                <span className="text-[10px] text-slate-400">
                  Status: <strong className="text-emerald-400">
                    {hijriData.source === 'nu_online_api' ? 'Terkoneksi API Falakiyah' : 'Hisab LF PBNU (Otomatis)'}
                  </strong>
                </span>
              </div>
            </div>

            {/* Sync Feedback Alert */}
            {syncStatusMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-600 text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{syncStatusMsg}</span>
              </div>
            )}

            {/* Event or Sunnah Fasting Badges */}
            {(hijriData.islamicEvent || hijriData.sunnahFasting) && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-800/40">
                {hijriData.islamicEvent && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-200 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{hijriData.islamicEvent}</span>
                  </span>
                )}
                {hijriData.sunnahFasting && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-900/60 border border-emerald-500/50 text-emerald-300 text-xs font-semibold">
                    <Moon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{hijriData.sunnahFasting}</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Ikhbar Rukyatul Hilal Calibration */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs sm:text-sm font-bold text-white">
                  Penyesuaian Ikhbar Rukyatul Hilal LF PBNU
                </h4>
              </div>
              <span className="text-[11px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                Koreksi: {adjustment > 0 ? `+${adjustment}` : adjustment} Hari
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Jika Lembaga Falakiyah PBNU mengumumkan Ikhbar resmi awal bulan Hijriyah (misal hilal tidak terlihat dan istikmal 30 hari), Anda dapat menyesuaikan koreksi tanggal di sini:
            </p>

            <div className="grid grid-cols-5 gap-2">
              {[-2, -1, 0, 1, 2].map((adjVal) => (
                <button
                  key={adjVal}
                  type="button"
                  onClick={() => handleAdjustmentChange(adjVal)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    adjustment === adjVal
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-1 ring-emerald-400'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  {adjVal === 0 ? 'Standar (0)' : adjVal > 0 ? `+${adjVal} Hari` : `${adjVal} Hari`}
                </button>
              ))}
            </div>
          </div>

          {/* 12 Islamic Months LF PBNU Almanac Reference */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Daftar 12 Bulan Kalender Hijriyah Falakiyah NU:</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {NU_ISLAMIC_MONTHS.map((m) => {
                const isCurrent = m.index === currentMonthIndex;
                return (
                  <div
                    key={m.index}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                      isCurrent
                        ? 'bg-emerald-950 border-emerald-500 text-amber-300 font-bold shadow-sm'
                        : 'bg-slate-950/80 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] text-slate-500 mr-1.5">{m.index}.</span>
                      <span>{m.name}</span>
                    </div>
                    <span className="font-arabic text-xs text-slate-500">{m.arabic}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Falakiyah Method Note */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Kalender ini berpedoman pada metode <strong>Lembaga Falakiyah Pengurus Besar Nahdlatul Ulama (LF PBNU)</strong> dengan kriteria Imkanur Rukyah MABIMS Baru (Tinggi Hilal minimal 3°, Elongasi minimal 6,4°) dan pasaran Pancawara Jawa (Legi, Pahing, Pon, Wage, Kliwon).
            </span>
          </div>

        </div>

        {/* Footer Close */}
        <div className="pt-3 border-t border-slate-800 flex justify-end relative z-10">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
