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
  Chrome,
  Image as ImageIcon,
  Upload,
  Trash2,
  Eye,
  ExternalLink,
  Copy,
  Layers,
  Flame,
  Cloud,
  Database,
  UploadCloud,
  DownloadCloud
} from 'lucide-react';
import { SchoolProfile, BellSettings, BellEvent, BellLog, ThemePreset } from '../types';
import { DEFAULT_SCHOOL_PROFILE, DEFAULT_SETTINGS, DEFAULT_BELL_SCHEDULES } from '../data/defaultSchedules';
import { exportAllDataAsJSON, downloadJSONBackup } from '../utils/storage';
import { getStoredHijriAdjustment, syncHijriWithNuOnline } from '../utils/dateUtils';
import { saveStoredHijriAdjustment } from '../utils/hijriNuService';
import { FirestoreService } from '../lib/firebase';
import { getAllAudioFiles, saveMultipleAudioFiles } from '../utils/audioLibraryStorage';
import { updateAppIconsAndManifest, generatePwaIcons } from '../utils/pwaManifest';

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

  // Sync internal state when external profile changes via Firestore
  React.useEffect(() => {
    setProfileForm({ ...profile });
  }, [profile]);

  // Hidden File Input Refs
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const faviconInputRef = React.useRef<HTMLInputElement>(null);

  // Cloud Sync State
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudMsg, setCloudMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Helper for image compression to ensure lightweight Firestore document storage
  const compressImage = (file: File, maxDim: number = 400): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(readerEvent.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const isTransparent = file.type === 'image/png' || file.type === 'image/svg+xml' || file.type === 'image/webp';
          const resultData = canvas.toDataURL(isTransparent ? 'image/png' : 'image/jpeg', 0.90);
          resolve(resultData);
        };
        img.onerror = () => resolve(readerEvent.target?.result as string);
        img.src = readerEvent.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const [isPwaSyncing, setIsPwaSyncing] = useState(false);
  const [pwaSyncNotice, setPwaSyncNotice] = useState<string | null>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, 400);
      const updated: SchoolProfile = { ...profileForm, logoUrl: dataUrl };
      setProfileForm(updated);
      onSaveProfile(updated);
      await updateAppIconsAndManifest(updated);
      setIsSavedNotice(true);
      setPwaSyncNotice('Logo baru berhasil dipasang dan disinkronkan ke Ikon Aplikasi PWA!');
      setTimeout(() => {
        setIsSavedNotice(false);
        setPwaSyncNotice(null);
      }, 4000);
    } catch (err) {
      console.error('Logo upload error:', err);
    }
    e.target.value = '';
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, 192);
      const updated: SchoolProfile = { ...profileForm, faviconUrl: dataUrl };
      setProfileForm(updated);
      onSaveProfile(updated);
      await updateAppIconsAndManifest(updated);
      setIsSavedNotice(true);
      setPwaSyncNotice('Favicon tab dan ikon PWA berhasil diperbarui!');
      setTimeout(() => {
        setIsSavedNotice(false);
        setPwaSyncNotice(null);
      }, 4000);
    } catch (err) {
      console.error('Favicon upload error:', err);
    }
    e.target.value = '';
  };

  const handleUseLogoAsFavicon = async () => {
    const targetLogo = profileForm.logoUrl || '/app-icon.jpg';
    const updated: SchoolProfile = { ...profileForm, faviconUrl: targetLogo };
    setProfileForm(updated);
    onSaveProfile(updated);
    await updateAppIconsAndManifest(updated);
    setIsSavedNotice(true);
    setPwaSyncNotice('Logo madrasah berhasil ditetapkan sebagai Favicon & Ikon PWA!');
    setTimeout(() => {
      setIsSavedNotice(false);
      setPwaSyncNotice(null);
    }, 4000);
  };

  const handleResetLogo = async () => {
    const updated: SchoolProfile = { ...profileForm, logoUrl: '/app-icon.jpg' };
    setProfileForm(updated);
    onSaveProfile(updated);
    await updateAppIconsAndManifest(updated);
    setIsSavedNotice(true);
    setPwaSyncNotice('Logo madrasah dikembalikan ke logo standar.');
    setTimeout(() => {
      setIsSavedNotice(false);
      setPwaSyncNotice(null);
    }, 3000);
  };

  const handleResetFavicon = async () => {
    const updated: SchoolProfile = { ...profileForm, faviconUrl: '/icon-192.png' };
    setProfileForm(updated);
    onSaveProfile(updated);
    await updateAppIconsAndManifest(updated);
    setIsSavedNotice(true);
    setPwaSyncNotice('Favicon dikembalikan ke standar.');
    setTimeout(() => {
      setIsSavedNotice(false);
      setPwaSyncNotice(null);
    }, 3000);
  };

  const handleForceSyncPwa = async () => {
    setIsPwaSyncing(true);
    try {
      await updateAppIconsAndManifest(profileForm);
      setPwaSyncNotice('Ikon aplikasi terpasang (PWA) & Web Manifest berhasil diperbarui!');
      setTimeout(() => setPwaSyncNotice(null), 4000);
    } catch (err: any) {
      setPwaSyncNotice('Gagal memperbarui ikon PWA: ' + err.message);
    } finally {
      setIsPwaSyncing(false);
    }
  };

  const handleDownloadCustomManifest = async () => {
    try {
      const targetIcon = profileForm.faviconUrl || profileForm.logoUrl || '/app-icon.jpg';
      const icons = await generatePwaIcons(targetIcon);
      const manifestObj = {
        name: profileForm.name || 'Bel Pelajaran MI Syuriyah Pebatan',
        short_name: profileForm.shortName || 'Bel Syuriyah',
        description: profileForm.tagline || 'Sistem Bel Otomatis 3 Bahasa dan Jadwal Pelajaran MI Syuriyah Pebatan',
        start_url: '/',
        id: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#020617',
        theme_color: '#059669',
        categories: ['education', 'productivity', 'utilities'],
        icons: [
          {
            src: icons.icon192,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: icons.icon512,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: icons.iconMaskable,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      };
      const blob = new Blob([JSON.stringify(manifestObj, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'manifest.json';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error('Download manifest error:', err);
    }
  };

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
    updateAppIconsAndManifest(profileForm).catch(() => {});
    setIsSavedNotice(true);
    setPwaSyncNotice('Profil madrasah, judul web, dan ikon PWA berhasil diperbarui!');
    setTimeout(() => {
      setIsSavedNotice(false);
      setPwaSyncNotice(null);
    }, 3000);
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

      {/* Cloud Branding: Upload Icon Aplikasi & Favicon (Connected to all users) */}
      <div id="branding-settings-panel" className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-950/90 text-emerald-300 rounded-2xl border border-emerald-500/30">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">Ikon Aplikasi &amp; Favicon Madrasah</h3>
                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-600/50 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                  <Cloud className="w-3 h-3 text-emerald-400" />
                  <span>Real-Time Cloud</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Upload logo resmi madrasah dan ikon favicon tab peramban. Terhubung langsung ke seluruh pengguna melalui Firebase Firestore secara otomatis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUseLogoAsFavicon}
              disabled={!profileForm.logoUrl}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              title="Salin logo aplikasi menjadi favicon tab browser"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-400" />
              <span>Samakan Favicon &amp; Logo</span>
            </button>
          </div>
        </div>

        {/* 2-Column Grid: App Icon & Tab Favicon */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 1. App Icon / Header Logo Panel */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>1. Ikon Aplikasi Web &amp; Logo Header</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                  Header &amp; PWA
                </span>
              </div>

              {/* Live Header Simulation Mockup */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-inner space-y-2">
                <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <Eye className="w-3 h-3 text-emerald-400" /> Pratinjau Tampilan Header Navigasi:
                </span>
                <div className="flex items-center gap-2.5 bg-slate-950/90 border border-slate-800 rounded-lg p-2">
                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-emerald-500/40 bg-slate-900 shrink-0 shadow-md">
                    <img 
                      src={profileForm.logoUrl || '/app-icon.jpg'} 
                      alt="Pratinjau Logo" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/app-icon.jpg';
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate font-display">
                      {profileForm.name || 'MI Syuriyah Pebatan'}
                    </div>
                    <div className="text-[9px] text-slate-400 truncate">
                      TP {profileForm.academicYear || '2026/2027'} • Bel 3 Bahasa
                    </div>
                  </div>
                </div>
              </div>

              {/* Large Image Details */}
              <div className="flex items-center gap-4 bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-emerald-500/50 bg-slate-950 shadow-lg shrink-0 flex items-center justify-center">
                  <img 
                    src={profileForm.logoUrl || '/app-icon.jpg'} 
                    alt="Logo Penuh" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/app-icon.jpg';
                    }}
                  />
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-slate-200">Rekomendasi Format Logo</p>
                  <p className="text-[11px] text-slate-400">PNG / JPG / WebP / SVG (Transparan / Persegi)</p>
                  <p className="text-[10px] text-emerald-400 font-medium">Otomatis dioptimalkan untuk penyimpanan cloud</p>
                </div>
              </div>
            </div>

            {/* Logo Actions */}
            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <input
                type="file"
                ref={logoInputRef}
                onChange={handleLogoUpload}
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="hidden"
              />
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Pilih &amp; Upload Logo</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetLogo}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                  title="Kembalikan ke logo resmi bawaan"
                >
                  Reset
                </button>
              </div>

              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...profileForm, logoUrl: '/app-icon.jpg' };
                    setProfileForm(updated);
                    onSaveProfile(updated);
                  }}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                >
                  Logo Hijau
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...profileForm, logoUrl: '/icon-192.png' };
                    setProfileForm(updated);
                    onSaveProfile(updated);
                  }}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                >
                  Ikon PWA
                </button>
              </div>
            </div>
          </div>

          {/* 2. Favicon / Browser Tab Icon Panel */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Chrome className="w-4 h-4 text-sky-400" />
                  <span>2. Ikon Favicon Tab Browser (Peramban)</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                  Tab 16x16 / 32x32
                </span>
              </div>

              {/* Realistic Browser Tab Simulation Mockup */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-inner space-y-2">
                <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-sky-400" /> Pratinjau Tampilan Tab Browser:
                </span>
                
                {/* Browser Tab Strip Mockup */}
                <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden shadow-md">
                  {/* Top Window Bar */}
                  <div className="bg-slate-900/90 px-3 py-1.5 border-b border-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    <span className="text-[9px] text-slate-500 ml-2 font-mono">Google Chrome / Edge / Safari</span>
                  </div>

                  {/* Active Tab */}
                  <div className="p-2 bg-slate-950 flex items-center">
                    <div className="bg-slate-900 border border-slate-800 rounded-t-lg px-2.5 py-1.5 flex items-center gap-2 max-w-[240px] shadow-sm">
                      <div className="w-4 h-4 rounded overflow-hidden shrink-0 bg-slate-800 flex items-center justify-center">
                        <img 
                          src={profileForm.faviconUrl || profileForm.logoUrl || '/icon-192.png'} 
                          alt="Favicon Tab" 
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/icon-192.png';
                          }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-200 truncate">
                        Bel Otomatis - {profileForm.name || 'MI Syuriyah'}
                      </span>
                      <span className="text-[10px] text-slate-500 hover:text-slate-300 ml-auto cursor-pointer">×</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Favicon Details */}
              <div className="flex items-center gap-4 bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-sky-500/50 bg-slate-950 shadow-lg shrink-0 flex items-center justify-center p-1">
                  <img 
                    src={profileForm.faviconUrl || profileForm.logoUrl || '/icon-192.png'} 
                    alt="Favicon Tab Penuh" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/icon-192.png';
                    }}
                  />
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-slate-200">Ikon Tab &amp; Pintasan Layar Utama</p>
                  <p className="text-[11px] text-slate-400">Format: PNG / ICO / SVG (Ukuran optimal 32x32 s/d 192x192)</p>
                  <p className="text-[10px] text-sky-400 font-medium">Berubah langsung pada tab semua laptop staf &amp; siswa</p>
                </div>
              </div>
            </div>

            {/* Favicon Actions */}
            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <input
                type="file"
                ref={faviconInputRef}
                onChange={handleFaviconUpload}
                accept="image/png,image/x-icon,image/svg+xml,image/jpeg,image/webp"
                className="hidden"
              />
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => faviconInputRef.current?.click()}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Favicon</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetFavicon}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                  title="Kembalikan ke favicon bawaan"
                >
                  Reset
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Auto-PWA Icon</span>
              </div>
            </div>
          </div>

        </div>

        {/* Multi-Device Cloud Synchronization Info Footer */}
        <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-700/40 flex items-start sm:items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-900/60 text-emerald-400 shrink-0 border border-emerald-600/40">
            <Cloud className="w-4 h-4" />
          </div>
          <div className="text-xs text-slate-300">
            <span className="font-bold text-white">Sinkronisasi Cloud Aktif: </span>
            Setiap perubahan logo atau favicon yang Anda simpan akan disiarkan (*broadcast*) secara instan ke seluruh tab browser dan layar monitor guru yang sedang membuka aplikasi ini.
          </div>
        </div>

        {/* PWA Installed App Icon Synchronization & Multi-Platform Preview Card */}
        <div id="pwa-icon-sync-panel" className="bg-slate-950/90 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-950 text-emerald-400 rounded-xl border border-emerald-600/40">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Pratinjau Ikon Aplikasi Terpasang (PWA / Desktop / Android / iOS)</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Otomatis Sinkron
                  </span>
                </h4>
                <p className="text-xs text-slate-400">
                  Ikon di bawah ini adalah tampilan resmi yang akan muncul di layar desktop komputer, menu Android, dan home screen iOS saat aplikasi di-instal.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleForceSyncPwa}
                disabled={isPwaSyncing}
                className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPwaSyncing ? 'animate-spin' : ''}`} />
                <span>{isPwaSyncing ? 'Menyinkronkan...' : 'Segarkan Ikon PWA'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCustomManifest}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 shrink-0"
                title="Unduh file manifest.json kustom"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Manifest</span>
              </button>
            </div>
          </div>

          {pwaSyncNotice && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-xs text-emerald-200 flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{pwaSyncNotice}</span>
            </div>
          )}

          {/* 4 Multi-Platform Icon Simulations */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-1">
            
            {/* 1. Desktop PC / Laptop Icon */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center text-center space-y-2.5">
              <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                <Monitor className="w-3 h-3 text-emerald-400" /> Windows / Mac Desktop
              </span>
              <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-amber-400/60 shadow-xl p-1.5 flex items-center justify-center relative group">
                <img 
                  src={profileForm.faviconUrl || profileForm.logoUrl || '/app-icon.jpg'} 
                  alt="Desktop Icon" 
                  className="w-full h-full object-contain rounded-xl"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/app-icon.jpg';
                  }}
                />
              </div>
              <div className="text-[11px] font-bold text-white truncate max-w-[120px]">
                {profileForm.shortName || 'Bel Syuriyah'}
              </div>
            </div>

            {/* 2. Android Adaptive Icon (Circle Mask) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center text-center space-y-2.5">
              <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-amber-400" /> Android Adaptive
              </span>
              <div className="w-14 h-14 rounded-full bg-slate-950 border-2 border-emerald-500/60 shadow-xl p-2.5 flex items-center justify-center overflow-hidden">
                <img 
                  src={profileForm.faviconUrl || profileForm.logoUrl || '/app-icon.jpg'} 
                  alt="Android Icon" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/app-icon.jpg';
                  }}
                />
              </div>
              <div className="text-[11px] font-bold text-white truncate max-w-[120px]">
                {profileForm.shortName || 'Bel Syuriyah'}
              </div>
            </div>

            {/* 3. iOS Safari Web Clip (Squircle) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center text-center space-y-2.5">
              <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-sky-400" /> iPhone / iPad (iOS)
              </span>
              <div className="w-14 h-14 rounded-[16px] bg-slate-950 border border-sky-400/60 shadow-xl p-1.5 flex items-center justify-center overflow-hidden">
                <img 
                  src={profileForm.faviconUrl || profileForm.logoUrl || '/app-icon.jpg'} 
                  alt="iOS Icon" 
                  className="w-full h-full object-contain rounded-[12px]"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/app-icon.jpg';
                  }}
                />
              </div>
              <div className="text-[11px] font-bold text-white truncate max-w-[120px]">
                {profileForm.shortName || 'Bel Syuriyah'}
              </div>
            </div>

            {/* 4. Browser Tab Favicon */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center text-center space-y-2.5">
              <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                <Chrome className="w-3 h-3 text-rose-400" /> Favicon Peramban
              </span>
              <div className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-800 shadow-xl flex items-center justify-center">
                <div className="w-8 h-8 rounded-md bg-slate-900 border border-slate-700 p-1 flex items-center justify-center">
                  <img 
                    src={profileForm.faviconUrl || profileForm.logoUrl || '/icon-192.png'} 
                    alt="Favicon" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/icon-192.png';
                    }}
                  />
                </div>
              </div>
              <div className="text-[11px] font-bold text-white truncate max-w-[120px]">
                Tab Browser (16px)
              </div>
            </div>

          </div>
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
            
            {/* School Name & Level & Short Name */}
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

            {/* Short Name for PWA */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nama Singkat Aplikasi / Pintasan Ikon Desktop &amp; HP (PWA):
              </label>
              <input
                type="text"
                value={profileForm.shortName || ''}
                placeholder="Contoh: Bel Syuriyah"
                onChange={(e) => setProfileForm({ ...profileForm, shortName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Nama pendek ini akan tampil di bawah ikon aplikasi saat di-instal di layar utama HP atau desktop.
              </p>
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

