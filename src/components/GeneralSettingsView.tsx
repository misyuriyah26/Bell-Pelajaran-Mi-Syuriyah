import React, { useState } from 'react';
import { 
  Settings, 
  Building2, 
  CalendarOff, 
  Volume2, 
  Save, 
  RotateCcw, 
  FileDown, 
  FileUp, 
  Check, 
  ShieldCheck,
  AlertTriangle,
  Info,
  Palette,
  Sparkles,
  CheckCircle2,
  Moon,
  Globe,
  RefreshCw,
  Sliders,
  Download,
  Monitor,
  Smartphone,
  Chrome
} from 'lucide-react';
import { SchoolProfile, BellSettings, BellEvent, BellLog, ThemePreset } from '../types';
import { 
  DEFAULT_SCHOOL_PROFILE, 
  DEFAULT_SETTINGS, 
  DEFAULT_BELL_SCHEDULES 
} from '../data/defaultSchedules';
import { exportAllDataAsJSON, downloadJSONBackup } from '../utils/storage';
import { 
  getStoredHijriAdjustment, 
  saveStoredHijriAdjustment, 
  syncHijriWithNuOnline, 
  calculateNuFalakiyahDate 
} from '../utils/hijriNuService';
import { FirestoreService, testFirestoreConnection } from '../lib/firebase';
import { getAllAudioFiles, saveMultipleAudioFiles } from '../utils/audioLibraryStorage';
import { Cloud, Database, UploadCloud, DownloadCloud } from 'lucide-react';

interface GeneralSettingsViewProps {
  profile: SchoolProfile;
  onSaveProfile: (profile: SchoolProfile) => void;
  settings: BellSettings;
  onSaveSettings: (settings: BellSettings) => void;
  schedules: BellEvent[];
  onSaveSchedules: (schedules: BellEvent[]) => void;
  logs: BellLog[];
  onSaveLogs: (logs: BellLog[]) => void;
}

const THEME_CARDS: {
  id: ThemePreset;
  title: string;
  subtitle: string;
  bgPreview: string;
  accentBadge: string;
  description: string;
}[] = [
  {
    id: 'professional_slate',
    title: 'Executive Slate & Emerald',
    subtitle: 'Tema Gelap Eksekutif Madrasah Modern',
    bgPreview: 'bg-slate-900 border-slate-700',
    accentBadge: 'bg-emerald-500 text-slate-950',
    description: 'Warna dasar slate arang dengan aksen hijau zamrud tajam dan teks berdaya kontras tinggi.'
  },
  {
    id: 'classic_emerald',
    title: 'Madrasah Emerald & Gold',
    subtitle: 'Nuansa Klasik Keislaman Hijau Emas',
    bgPreview: 'bg-[#041e15] border-emerald-700',
    accentBadge: 'bg-amber-400 text-slate-950',
    description: 'Dominasi warna hijau botol tua madrasah dipadukan dengan tipografi emas hangat nan agung.'
  },
  {
    id: 'deep_navy',
    title: 'Sapphire Midnight Navy',
    subtitle: 'Tema Biru Langit Malam Formal',
    bgPreview: 'bg-[#06101e] border-blue-800',
    accentBadge: 'bg-sky-400 text-slate-950',
    description: 'Nuansa biru navy resmi ala lembaga pendidikan formal dengan sorotan cyan modern.'
  },
  {
    id: 'clean_light',
    title: 'Clean Institutional Light',
    subtitle: 'Mode Terang Minimalis Siang Hari',
    bgPreview: 'bg-slate-100 border-slate-300 text-slate-900',
    accentBadge: 'bg-emerald-600 text-white',
    description: 'Tata letak putih bersih berlatar abu-abu netral yang sangat nyaman dipandang di ruang guru atau kelas.'
  },
];

export const GeneralSettingsView: React.FC<GeneralSettingsViewProps> = ({
  profile,
  onSaveProfile,
  settings,
  onSaveSettings,
  schedules,
  onSaveSchedules,
  logs,
  onSaveLogs
}) => {
  const [profileForm, setProfileForm] = useState<SchoolProfile>({ ...profile });
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [hijriAdjustment, setHijriAdjustment] = useState<number>(getStoredHijriAdjustment());
  const [isHijriSyncing, setIsHijriSyncing] = useState(false);
  const [hijriSyncMsg, setHijriSyncMsg] = useState<string | null>(null);

  // Cloud Sync State
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudMsg, setCloudMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePushToCloud = async () => {
    setIsCloudSyncing(true);
    setCloudMsg(null);
    try {
      await FirestoreService.saveSchoolProfile(profile);
      await FirestoreService.saveBellSettings(settings);
      await FirestoreService.batchSaveSchedules(schedules);
      
      // Also upload all local audio files to Firebase Cloud Firestore
      const localAudios = await getAllAudioFiles();
      if (localAudios && localAudios.length > 0) {
        await FirestoreService.saveMultipleAudioFiles(localAudios);
      }

      setCloudMsg({ type: 'success', text: `Semua jadwal, audio upload (${localAudios.length} file), pengaturan, dan profil berhasil diunggah ke Firebase Firestore!` });
      setTimeout(() => setCloudMsg(null), 4000);
    } catch (err: any) {
      console.error('Error uploading to cloud:', err);
      setCloudMsg({ type: 'error', text: 'Gagal mengunggah ke Cloud: ' + (err.message || 'Periksa koneksi internet.') });
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handlePullFromCloud = async () => {
    setIsCloudSyncing(true);
    setCloudMsg(null);
    try {
      const [remoteProfile, remoteSettings, remoteSchedules, remoteAudios] = await Promise.all([
        FirestoreService.getSchoolProfile(),
        FirestoreService.getBellSettings(),
        FirestoreService.getAllSchedules(),
        FirestoreService.getAudioFiles()
      ]);

      let pulledCount = 0;
      if (remoteProfile) {
        onSaveProfile(remoteProfile);
        setProfileForm(remoteProfile);
        pulledCount++;
      }
      if (remoteSettings) {
        onSaveSettings(remoteSettings);
        pulledCount++;
      }
      if (remoteSchedules && remoteSchedules.length > 0) {
        onSaveSchedules(remoteSchedules);
        pulledCount++;
      }
      if (remoteAudios && remoteAudios.length > 0) {
        await saveMultipleAudioFiles(remoteAudios);
        pulledCount += remoteAudios.length;
      }

      if (pulledCount > 0) {
        setCloudMsg({ type: 'success', text: `Berhasil mengunduh data dan file audio terbaru dari Firebase Firestore (${pulledCount} entitas & file)!` });
      } else {
        setCloudMsg({ type: 'success', text: 'Database Firebase masih kosong atau belum ada data tersimpan.' });
      }
      setTimeout(() => setCloudMsg(null), 4000);
    } catch (err: any) {
      console.error('Error pulling from cloud:', err);
      setCloudMsg({ type: 'error', text: 'Gagal mengunduh dari Cloud: ' + (err.message || 'Periksa koneksi.') });
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleHijriAdjustmentChange = async (val: number) => {
    setHijriAdjustment(val);
    saveStoredHijriAdjustment(val);
    setIsHijriSyncing(true);
    try {
      await syncHijriWithNuOnline(new Date(), true);
      setHijriSyncMsg('Koreksi hilal LF PBNU berhasil diperbarui!');
      setTimeout(() => setHijriSyncMsg(null), 3000);
    } finally {
      setIsHijriSyncing(false);
    }
  };

  const handleManualHijriSync = async () => {
    setIsHijriSyncing(true);
    setHijriSyncMsg(null);
    try {
      await syncHijriWithNuOnline(new Date(), true);
      setHijriSyncMsg('Sinkronisasi Kalender Hijriyah NU Online berhasil!');
      setTimeout(() => setHijriSyncMsg(null), 3000);
    } catch {
      setHijriSyncMsg('Sinkronisasi selesai dengan Hisab Falakiyah PBNU.');
      setTimeout(() => setHijriSyncMsg(null), 3000);
    } finally {
      setIsHijriSyncing(false);
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(profileForm);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  const handleExportFullBackup = () => {
    const json = exportAllDataAsJSON(schedules, settings, profile, logs);
    downloadJSONBackup(json, `backup-lengkap-mi-syuriyah-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const handleImportFullBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        if (data.profile) onSaveProfile(data.profile);
        if (data.settings) onSaveSettings(data.settings);
        if (data.schedules && Array.isArray(data.schedules)) onSaveSchedules(data.schedules);
        if (data.logs && Array.isArray(data.logs)) onSaveLogs(data.logs);
        alert('Data berhasil dipulihkan dari cadangan JSON!');
      } catch (err) {
        alert('Gagal memulihkan data: Format file JSON tidak valid.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleFactoryReset = () => {
    if (window.confirm('PERINGATAN: Apakah Anda yakin ingin mereset seluruh aplikasi ke data awal pabrik? Seluruh jadwal dan pengaturan akan kembali ke pengaturan default.')) {
      onSaveProfile(DEFAULT_SCHOOL_PROFILE);
      onSaveSettings(DEFAULT_SETTINGS);
      onSaveSchedules(DEFAULT_BELL_SCHEDULES);
      onSaveLogs([]);
      setProfileForm(DEFAULT_SCHOOL_PROFILE);
      alert('Aplikasi telah di-reset ke data bawaan pabrik MI Syuriyah Pebatan.');
    }
  };

  const currentTheme = settings.themePreset || 'professional_slate';

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      
      {/* Top Title Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-950 text-emerald-400 rounded-2xl border border-emerald-700/40">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">Pengaturan Umum &amp; Tema Profesional</h2>
            <p className="text-xs text-slate-400">Sesuaikan tema estetika madrasah, identitas profil, mode libur, serta pencadangan sistem</p>
          </div>
        </div>

        {isSavedNotice && (
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-600 text-xs font-semibold flex items-center gap-1.5 animate-fade-in shadow-md">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Tersimpan!</span>
          </div>
        )}
      </div>

      {/* Theme Selection Matrix */}
      <div id="theme-selector-panel" className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-950/80 text-amber-300 rounded-xl border border-amber-500/30">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Pilihan Tema Visual Profesional Madrasah</h3>
              <p className="text-xs text-slate-400">Pilih palet warna yang dirancang khusus untuk kenyamanan visual staf &amp; operator madrasah</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {THEME_CARDS.map((item) => {
            const isSelected = currentTheme === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSaveSettings({ ...settings, themePreset: item.id })}
                className={`text-left p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between group ${
                  isSelected 
                    ? 'ring-2 ring-emerald-500 bg-slate-950 border-emerald-500 shadow-xl' 
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide ${item.accentBadge}`}>
                      {item.id.replace('_', ' ')}
                    </span>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Aktif</span>
                      </span>
                    )}
                  </div>
                  
                  <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                {/* Color swatch bar */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                  <span>Pratinjau</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block border border-black/20" />
                    <span className="w-3 h-3 rounded-full bg-amber-400 inline-block border border-black/20" />
                    <span className="w-3 h-3 rounded-full bg-slate-800 inline-block border border-slate-600" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* School Profile Card (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Profil &amp; Identitas Lembaga</h3>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            
            {/* School Name & Level */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Madrasah / Lembaga:
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Jenjang:
                </label>
                <input
                  type="text"
                  value={profileForm.level}
                  onChange={(e) => setProfileForm({ ...profileForm, level: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>
            </div>

            {/* Tagline */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Slogan / Moto Madrasah:
              </label>
              <input
                type="text"
                value={profileForm.tagline}
                onChange={(e) => setProfileForm({ ...profileForm, tagline: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* NPSN & Academic Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  NPSN / NSM:
                </label>
                <input
                  type="text"
                  value={profileForm.npsn}
                  onChange={(e) => setProfileForm({ ...profileForm, npsn: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tahun Pelajaran:
                </label>
                <input
                  type="text"
                  value={profileForm.academicYear}
                  onChange={(e) => setProfileForm({ ...profileForm, academicYear: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Headmaster & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kepala Madrasah:
                </label>
                <input
                  type="text"
                  value={profileForm.headmaster}
                  onChange={(e) => setProfileForm({ ...profileForm, headmaster: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nomor Telepon:
                </label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Alamat Madrasah:
              </label>
              <textarea
                rows={2}
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan Profil</span>
              </button>
            </div>

          </form>
        </div>

        {/* Holiday Mode & System Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Kalender Hijriyah NU Online & LF PBNU Card */}
          <div id="nu-hijri-settings-card" className="bg-slate-900/90 border border-emerald-800/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Kalender Hijriyah NU Online</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1">
                <Globe className="w-3 h-3 text-emerald-400" />
                <span>LF PBNU</span>
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Sinkronisasi otomatis hisab &amp; rukyatul hilal Lembaga Falakiyah PBNU, pasaran Jawa (Weton), dan penanda puasa sunnah / PHBI.
            </p>

            {hijriSyncMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-600 text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{hijriSyncMsg}</span>
              </div>
            )}

            {/* Quick Sync Button */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <div>
                <span className="text-xs font-bold text-white block">Sinkronisasi Online</span>
                <span className="text-[10px] text-slate-400">Hubungkan dengan API Falakiyah NU Online</span>
              </div>
              <button
                type="button"
                onClick={handleManualHijriSync}
                disabled={isHijriSyncing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isHijriSyncing ? 'animate-spin' : ''}`} />
                <span>{isHijriSyncing ? 'Sinkronisasi...' : 'Sinkronkan'}</span>
              </button>
            </div>

            {/* Hilal Adjustment Selector */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Koreksi Ikhbar Hilal:</span>
                </span>
                <span className="font-mono text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800 text-[11px]">
                  {hijriAdjustment > 0 ? `+${hijriAdjustment}` : hijriAdjustment} Hari
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {[-2, -1, 0, 1, 2].map((adjVal) => (
                  <button
                    key={adjVal}
                    type="button"
                    onClick={() => handleHijriAdjustmentChange(adjVal)}
                    className={`py-1.5 text-[11px] font-bold rounded-xl border transition-all ${
                      hijriAdjustment === adjVal
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-1 ring-emerald-400'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    {adjVal === 0 ? '0' : adjVal > 0 ? `+${adjVal}` : `${adjVal}`}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-slate-500 block">
                Sesuaikan saat ada maklumat istikmal atau hisab khusus dari PBNU.
              </span>
            </div>
          </div>

          {/* Holiday Mode Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CalendarOff className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Mode Hari Libur</h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                settings.holidayMode ? 'bg-rose-950 text-rose-300 border border-rose-700' : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
              }`}>
                {settings.holidayMode ? 'LIBUR AKTIF' : 'KBM AKTIF'}
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Aktifkan mode libur saat hari libur nasional atau cuti bersama agar bel otomatis dijeda secara aman.
            </p>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <div>
                  <span className="text-xs font-bold text-white block">Status Libur Madrasah</span>
                  <span className="text-[10px] text-slate-400">Nonaktifkan bel terjadwal hari ini</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.holidayMode}
                  onChange={(e) => onSaveSettings({ ...settings, holidayMode: e.target.checked })}
                  className="w-5 h-5 accent-amber-500 rounded"
                />
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Catatan / Keterangan Libur:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Libur Nasional Isra Miraj Nabi Muhammad SAW"
                  value={settings.holidayNote}
                  onChange={(e) => onSaveSettings({ ...settings, holidayNote: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Master Volume & Visual Alert */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Volume &amp; Banner Tampilan</h3>
            </div>

            <div className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Volume Pengeras Suara Utama:</span>
                  <span className="font-clock text-emerald-400 font-bold">{Math.round(settings.masterVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.masterVolume}
                  onChange={(e) => onSaveSettings({ ...settings, masterVolume: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <div>
                  <span className="text-xs font-bold text-white block">Tampilkan Animasi Notifikasi Layar Penuh</span>
                  <span className="text-[10px] text-slate-400">Munculkan kartu informasi acara dan 3 bahasa saat bel berbunyi</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showVisualNotification}
                  onChange={(e) => onSaveSettings({ ...settings, showVisualNotification: e.target.checked })}
                  className="w-5 h-5 accent-emerald-500 rounded"
                />
              </label>
            </div>
          </div>

          {/* Chrome Download & PWA Card */}
          <div className="bg-slate-900/90 border border-amber-400/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <img 
                  src="/app-icon.jpg" 
                  alt="Logo Bel Syuriyah" 
                  className="w-10 h-10 rounded-xl border border-amber-400/60 shadow-md object-cover" 
                />
                <div>
                  <h3 className="text-sm font-bold text-white">Unduh Aplikasi di Google Chrome (PWA)</h3>
                  <p className="text-[11px] text-slate-400">Jalankan di Laptop, Komputer Sekolah, atau HP Android</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/60 flex items-center gap-1.5 shadow-inner">
                <Chrome className="w-3.5 h-3.5 text-amber-400" />
                <span>PWA Siap</span>
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Aplikasi ini mendukung Progressive Web App (PWA). Anda dapat memasang aplikasi langsung ke desktop tanpa harus membuka browser setiap hari, dan bel otomatis tetap beroperasi handal.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <Monitor className="w-4 h-4" />
                  <span>Di Laptop / PC (Chrome):</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Klik tombol <strong>"Install / Pasang Aplikasi"</strong> di bilah alamat URL atas Chrome (sebelah kanan icon bintang).
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <Smartphone className="w-4 h-4" />
                  <span>Di HP / Tablet Android:</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Buka menu titik 3 di pojok kanan atas Chrome, lalu pilih <strong>"Pasang aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Firebase Cloud Firestore Card */}
          <div className="bg-slate-900/90 border border-emerald-600/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Sinkronisasi Cloud Firebase</h3>
                  <p className="text-[11px] text-slate-400">Database Firestore Real-Time &amp; Cloud Backup</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-600/60 flex items-center gap-1.5 shadow-inner">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Terhubung</span>
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Sinkronkan jadwal bel madrasah, pengaturan sistem, profil sekolah, dan log bel otomatis ke cloud Firestore. Data tersimpan aman dan dapat diakses dari perangkat lain.
            </p>

            {cloudMsg && (
              <div className={`p-3 rounded-2xl text-xs font-medium flex items-center gap-2 ${
                cloudMsg.type === 'success' 
                  ? 'bg-emerald-950/80 border border-emerald-600 text-emerald-200' 
                  : 'bg-rose-950/80 border border-rose-600 text-rose-200'
              }`}>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{cloudMsg.text}</span>
              </div>
            )}

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                id="btn-upload-cloud-firestore"
                type="button"
                onClick={handlePushToCloud}
                disabled={isCloudSyncing}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <UploadCloud className={`w-4 h-4 ${isCloudSyncing ? 'animate-bounce' : ''}`} />
                <span>{isCloudSyncing ? 'Mengunggah ke Cloud...' : 'Unggah Data Lokal ke Cloud'}</span>
              </button>

              <button
                id="btn-pull-cloud-firestore"
                type="button"
                onClick={handlePullFromCloud}
                disabled={isCloudSyncing}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
              >
                <DownloadCloud className="w-4 h-4 text-emerald-400" />
                <span>Tarik Data Terbaru dari Cloud</span>
              </button>
            </div>
          </div>

          {/* Backup & Restore Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Cadangan &amp; Pemulihan Konfigurasi</h3>
            </div>

            <p className="text-xs text-slate-400">
              Amankan jadwal bel, audio mapping, dan identitas madrasah ke dalam file JSON terenkripsi lokal.
            </p>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={handleExportFullBackup}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
              >
                <FileDown className="w-4 h-4" />
                <span>Unduh Cadangan JSON</span>
              </button>

              <label className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-all cursor-pointer">
                <FileUp className="w-4 h-4" />
                <span>Pulihkan dari File</span>
                <input type="file" accept=".json" onChange={handleImportFullBackup} className="hidden" />
              </label>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={handleFactoryReset}
                className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Kembalikan ke Setelan Standar Pabrik</span>
              </button>
            </div>
          </div>

          {/* Account & Role Security Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Akun Petugas &amp; Keamanan Sesi</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                Lokal Enkripsi
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Daftar akun petugas madrasah yang dapat digunakan pada halaman login:
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>🏛️ Administrator</span>
                    <span className="text-[10px] text-emerald-400 font-mono">(admin)</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Sandi: <code className="text-amber-300 font-mono">admin123</code></div>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded font-semibold border border-emerald-800">
                  Full Akses
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>🔔 Petugas Piket</span>
                    <span className="text-[10px] text-amber-400 font-mono">(operator)</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Sandi: <code className="text-amber-300 font-mono">piket123</code></div>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-amber-950 text-amber-300 rounded font-semibold border border-amber-800">
                  Operator Bel
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>📺 Layar Publik</span>
                    <span className="text-[10px] text-sky-400 font-mono">(monitor)</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Sandi: <code className="text-amber-300 font-mono">monitor123</code></div>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-sky-950 text-sky-300 rounded font-semibold border border-sky-800">
                  Lihat Saja
                </span>
              </div>
            </div>
          </div>


        </div>

      </div>

    </div>
  );
};

