import React, { useState } from 'react';
import { 
  CalendarDays, 
  Plus, 
  Play, 
  Edit3, 
  Trash2, 
  Copy, 
  Check, 
  Sparkles, 
  FileDown, 
  FileUp, 
  RotateCcw, 
  Volume2, 
  Layers, 
  Clock, 
  Languages, 
  X,
  Upload,
  Mic,
  BookOpen,
  Waves,
  Music
} from 'lucide-react';
import { BellEvent, BellCategory, ChimeType, DayOfWeek, BellSettings, CustomAudioUrls } from '../types';
import { 
  DEFAULT_BELL_SCHEDULES, 
  PRESET_EXAM_SCHEDULES, 
  PRESET_RAMADHAN_SCHEDULES 
} from '../data/defaultSchedules';
import { downloadJSONBackup } from '../utils/storage';
import { ScheduleAudioUploader } from './ScheduleAudioUploader';

interface ScheduleViewProps {
  schedules: BellEvent[];
  onSaveSchedules: (newSchedules: BellEvent[]) => void;
  onDeleteSchedule?: (id: string) => void;
  onTriggerBell: (event: BellEvent, type: 'manual') => void;
  settings: BellSettings;
}

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const DAY_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

// Template presets for quick autofill
const TEMPLATES: Record<string, { name: string; category: BellCategory; id: string; en: string; ar: string }> = {
  masuk_awal: {
    name: 'Bel Masuk Jam Ke-1 & Doa Pagi',
    category: 'masuk',
    id: 'Bel masuk kelas telah berbunyi. Jam pelajaran pertama segera dimulai. Mari kita awali pembelajaran hari ini dengan membaca doa bersama.',
    en: 'The school bell has rung. The first lesson is about to begin. Let us start our learning today by reciting prayers together.',
    ar: 'دق جرس الدخول. ستبدأ الحصة الأولى الآن. هيا بنا نفتتح درسنا اليوم بقراءة الدعاء معًا.'
  },
  ganti_jam: {
    name: 'Bel Ganti Jam Pelajaran',
    category: 'ganti_jam',
    id: 'Jam pelajaran telah selesai. Sekarang masuk jam pelajaran berikutnya. Bapak dan ibu guru dipersilakan menuju ruang kelas.',
    en: 'The lesson period is finished. Now entering the next lesson period. Teachers, please proceed to your classrooms.',
    ar: 'انتهت الحصة الدراسية. حان الآن وقت الحصة التالية. يتفضل المعلمون بالتوجه إلى الفصول.'
  },
  dhuha_istirahat: {
    name: 'Bel Sholat Dhuha & Istirahat 1',
    category: 'dhuha',
    id: 'Waktu sholat dhuha berjamaah dan istirahat pertama telah tiba. Mari bersama-sama menuju musholla madrasah dengan tertib untuk menunaikan sholat dhuha.',
    en: 'It is now time for the Dhuha congregational prayer and first break. Let us proceed to the school prayer hall with good manner.',
    ar: 'حان الآن وقت صلاة الضحى جماعة والاستراحة الأولى. هيا بنا نتوجه إلى مصلى المدرسة بنظام لأداء صلاة الضحى.'
  },
  masuk_istirahat: {
    name: 'Bel Masuk Pasca Istirahat',
    category: 'masuk',
    id: 'Waktu istirahat telah selesai. Seluruh siswa dipersilakan masuk kembali ke kelas masing-masing dengan tertib.',
    en: 'The break time is finished. All students are kindly requested to enter their classrooms in an orderly manner.',
    ar: 'انتهت الاستراحة. يرجى من جميع التلاميذ والتلميذات الدخول إلى فصولهم بنظام.'
  },
  dzuhur_istirahat: {
    name: 'Bel Sholat Dzuhur & Istirahat 2',
    category: 'dzuhur',
    id: 'Waktu sholat dzuhur berjamaah telah tiba. Mari mengambil air wudhu dan bersiap menuju musholla madrasah untuk sholat dzuhur berjamaah.',
    en: 'It is now time for the Zuhr congregational prayer. Please perform ablution and prepare for the congregational prayer.',
    ar: 'حان الآن وقت صلاة الظهر جماعة. فلنتوضأ ونستعد للتوجه إلى المصلى لأداء صلاة الظهر جماعة.'
  },
  pulang_standar: {
    name: 'Bel Pelajaran Selesai & Doa Pulang',
    category: 'pulang',
    id: 'Alhamdulillah, kegiatan belajar mengajar hari ini telah selesai. Rapikan perlengkapan sekolah kalian, berdoalah bersama bapak dan ibu guru, dan berhati-hatilah di jalan pulang. Wassalamu\'alaikum warahmatullahi wabarakatuh.',
    en: 'Alhamdulillah, school activities for today have concluded. Please tidy up your belongings, recite prayers together, and be safe on your way home. Wassalamu\'alaikum warahmatullahi wabarakatuh.',
    ar: 'الحمد لله، انتهت الأنشطة التعليمية لهذا اليوم. رتبوا أدواتكم المدرسية، وادعوا الله مع المعلمين، وكونوا حذرين في طريق عودتكم. والسلام عليكم ورحمة الله وبركاته.'
  },
  pulang_jumat: {
    name: 'Bel Pulang Khusus Hari Jumat',
    category: 'pulang',
    id: 'Pelajaran hari Jumat telah selesai. Bersiaplah untuk menunaikan ibadah sholat Jumat di masjid masing-masing. Berhati-hatilah di jalan pulang. Wassalamu\'alaikum warahmatullah.',
    en: 'Friday classes have ended. Prepare for the Friday congregational prayer at the mosque. Have a safe journey home. Wassalamu\'alaikum warahmatullah.',
    ar: 'انتهت دروس يوم الجمعة. استعدوا لأداء صلاة الجمعة في المسجد. رافقتكم السلامة في طريقكم. والسلام عليكم ورحمة الله.'
  },
  ujian_mulai: {
    name: 'Bel Mulai Pengerjaan Ujian',
    category: 'custom',
    id: 'Waktu pengerjaan ujian dimulai. Kerjakan soal dengan jujur, teliti, dan mandiri. Selamat mengerjakan.',
    en: 'The examination session has begun. Work on your papers honestly, carefully, and independently. Good luck.',
    ar: 'بدأ وقت الامتحان. أرجو الإجابة بأمانة ودقة وتوكل على الله. بالتوفيق والنجاح.'
  }
};

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  schedules,
  onSaveSchedules,
  onDeleteSchedule,
  onTriggerBell,
  settings
}) => {
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | 'all'>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BellEvent | null>(null);
  const [resetConfirmType, setResetConfirmType] = useState<'reset' | 'clear' | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'info'; message: string } | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Omit<BellEvent, 'id'>>({
    time: '07:00',
    name: '',
    category: 'masuk',
    days: [1, 2, 3, 4, 5, 6],
    enabled: true,
    chimeType: 'westminster',
    repeatChime: 1,
    playChime: true,
    playTTS: true,
    announcements: {
      id: '',
      en: '',
      ar: ''
    }
  });

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // Filtered schedules
  const filteredSchedules = schedules.filter(item => {
    const matchDay = selectedDayFilter === 'all' || item.days.includes(selectedDayFilter as DayOfWeek);
    const matchCategory = selectedCategoryFilter === 'all' || item.category === selectedCategoryFilter;
    return matchDay && matchCategory;
  }).sort((a, b) => a.time.localeCompare(b.time));

  // Toggle single item active status
  const handleToggleEnable = (id: string) => {
    const targetItem = schedules.find(s => s.id === id);
    const updated = schedules.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s);
    onSaveSchedules(updated);
    showToast(`Jadwal "${targetItem?.name || ''}" ${targetItem?.enabled ? 'dinonaktifkan' : 'diaktifkan'}.`, 'info');
  };

  // Delete item - open confirmation modal
  const handlePromptDelete = (item: BellEvent) => {
    setDeleteTarget(item);
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const deletedName = deleteTarget.name;
    const targetId = deleteTarget.id;
    const updated = schedules.filter(s => s.id !== targetId);

    if (onDeleteSchedule) {
      onDeleteSchedule(targetId);
    } else {
      onSaveSchedules(updated);
    }

    setDeleteTarget(null);
    if (editingId === targetId) {
      setIsModalOpen(false);
      setEditingId(null);
    }
    showToast(`Jadwal "${deletedName}" berhasil dihapus.`, 'success');
  };

  // Duplicate item
  const handleDuplicate = (item: BellEvent) => {
    const duplicated: BellEvent = {
      ...item,
      id: 'bell-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      name: `${item.name} (Salinan)`,
      time: item.time
    };
    onSaveSchedules([...schedules, duplicated]);
    showToast(`Jadwal "${item.name}" berhasil diduplikat.`, 'success');
  };

  // Open modal for new item
  const handleAddNew = () => {
    setEditingId(null);
    setFormError(null);
    setFormData({
      time: '07:00',
      name: 'Bel Masuk Jam Ke-1 & Doa Pagi',
      category: 'masuk',
      days: [1, 2, 3, 4, 5, 6],
      enabled: true,
      chimeType: 'westminster',
      repeatChime: 1,
      playChime: true,
      playTTS: true,
      announcements: {
        id: TEMPLATES.masuk_awal.id,
        en: TEMPLATES.masuk_awal.en,
        ar: TEMPLATES.masuk_awal.ar
      }
    });
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleEdit = (item: BellEvent) => {
    setEditingId(item.id);
    setFormError(null);
    setFormData({
      time: item.time,
      name: item.name,
      category: item.category,
      days: item.days.length > 0 ? [...item.days] : [1, 2, 3, 4, 5, 6],
      enabled: item.enabled,
      chimeType: item.chimeType,
      repeatChime: item.repeatChime,
      playChime: item.playChime,
      playTTS: item.playTTS,
      announcements: { ...item.announcements },
      customAudio: item.customAudio ? { ...item.customAudio } : undefined
    });
    setIsModalOpen(true);
  };

  // Apply template
  const handleApplyTemplate = (key: string) => {
    const tmpl = TEMPLATES[key];
    if (tmpl) {
      setFormData(prev => ({
        ...prev,
        name: tmpl.name,
        category: tmpl.category,
        announcements: {
          id: tmpl.id,
          en: tmpl.en,
          ar: tmpl.ar
        }
      }));
    }
  };

  // Save form modal
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Mohon masukkan nama jadwal / acara bel.');
      return;
    }
    if (!formData.time.trim()) {
      setFormError('Mohon tentukan waktu bel (format JJ:MM).');
      return;
    }
    if (formData.days.length === 0) {
      setFormError('Pilih minimal 1 hari aktif berlakunya bel.');
      return;
    }

    if (editingId) {
      const updatedItem: BellEvent = { ...formData, id: editingId };
      const updated = schedules.map(s => s.id === editingId ? updatedItem : s);
      onSaveSchedules(updated);
      showToast(`Jadwal "${formData.name}" berhasil diperbarui.`);
    } else {
      const newEvent: BellEvent = {
        ...formData,
        id: 'bell-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7)
      };
      onSaveSchedules([...schedules, newEvent]);
      showToast(`Jadwal "${formData.name}" berhasil ditambahkan.`);
    }
    setIsModalOpen(false);
  };

  // Preset switchers
  const handleLoadPreset = (presetType: 'standard' | 'ujian' | 'ramadhan') => {
    let target = DEFAULT_BELL_SCHEDULES;
    let label = 'Standar MI Syuriyah';
    if (presetType === 'ujian') {
      target = PRESET_EXAM_SCHEDULES;
      label = 'Mode Ujian / Asesmen';
    } else if (presetType === 'ramadhan') {
      target = PRESET_RAMADHAN_SCHEDULES;
      label = 'Mode Khusus Ramadhan';
    }

    onSaveSchedules(target);
    showToast(`Jadwal berhasil diganti ke preset "${label}".`);
  };

  // Export / Import
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(schedules, null, 2);
    downloadJSONBackup(jsonStr, 'jadwal-bel-mi-syuriyah.json');
    showToast('File backup jadwal berhasil diekspor.');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        const list = Array.isArray(parsed) ? parsed : parsed.schedules;
        if (Array.isArray(list) && list.length > 0) {
          onSaveSchedules(list);
          showToast(`Berhasil mengimpor ${list.length} jadwal bel!`);
        } else {
          setFormError('Format file JSON tidak valid.');
        }
      } catch (err) {
        setFormError('Gagal membaca file JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      
      {/* Top Header & Actions Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-950 text-emerald-400 rounded-2xl border border-emerald-700/40">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Manajemen Jadwal Bel Madrasah</h2>
              <p className="text-xs text-slate-400">Atur waktu bel presisi, hari aktif, suara nada, serta teks pengumuman 3 bahasa</p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-end">
          <button
            id="btn-add-schedule"
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jadwal</span>
          </button>

          <button
            id="btn-export-schedules"
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-all"
            title="Download cadangan jadwal dalam format JSON"
          >
            <FileDown className="w-4 h-4" />
            <span>Ekspor</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-all cursor-pointer">
            <FileUp className="w-4 h-4" />
            <span>Impor</span>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>
        </div>
      </div>

      {/* Preset Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex items-center gap-2 text-slate-300 font-semibold">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Preset Jadwal Cepat:</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleLoadPreset('standard')}
            className="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50 transition-all font-semibold"
          >
            Standar MI Syuriyah (Default)
          </button>
          <button
            onClick={() => handleLoadPreset('ujian')}
            className="px-3 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/50 transition-all font-semibold"
          >
            Mode Ujian / Asesmen
          </button>
          <button
            onClick={() => handleLoadPreset('ramadhan')}
            className="px-3 py-1.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700/50 transition-all font-semibold"
          >
            Mode Ramadhan
          </button>
          <button
            onClick={() => setResetConfirmType('reset')}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 transition-all flex items-center gap-1 font-medium"
            title="Reset ke pengaturan pabrik"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Awal</span>
          </button>
          <button
            onClick={() => setResetConfirmType('clear')}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 transition-all flex items-center gap-1 font-medium"
            title="Hapus / Kosongkan semua jadwal"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Kosongkan Semua</span>
          </button>
        </div>
      </div>

      {/* Day & Category Filters */}
      <div className="space-y-3">
        {/* Day of Week Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            id="filter-day-all"
            onClick={() => setSelectedDayFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedDayFilter === 'all'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            Semua Hari ({schedules.length})
          </button>

          {[1, 2, 3, 4, 5, 6].map((dayIdx) => {
            const count = schedules.filter(s => s.days.includes(dayIdx as DayOfWeek)).length;
            return (
              <button
                key={dayIdx}
                id={`filter-day-${dayIdx}`}
                onClick={() => setSelectedDayFilter(dayIdx)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedDayFilter === dayIdx
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                {DAY_NAMES[dayIdx]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Schedule Table / Cards List */}
      <div className="space-y-3">
        {filteredSchedules.length === 0 ? (
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-12 text-center text-slate-400">
            <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="font-semibold text-sm text-slate-300">Tidak ada jadwal bel yang sesuai dengan filter.</p>
            <p className="text-xs text-slate-500 mt-1">Klik tombol "Tambah Jadwal" untuk membuat waktu bel baru.</p>
          </div>
        ) : (
          filteredSchedules.map((item) => (
            <div
              key={item.id}
              className={`bg-slate-800/80 border rounded-2xl p-4 sm:p-5 transition-all shadow-md ${
                item.enabled 
                  ? 'border-slate-700/80 hover:border-emerald-700/60' 
                  : 'border-slate-800/60 opacity-60 bg-slate-900/60'
              }`}
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                
                {/* Left info: Time, Name, Days */}
                <div className="flex items-start sm:items-center gap-3.5 w-full lg:w-auto">
                  {/* Time Badge */}
                  <div className={`font-mono text-lg font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shrink-0 ${
                    item.enabled 
                      ? 'bg-emerald-950 text-amber-300 border border-emerald-700/60 shadow-sm' 
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span>{item.time}</span>
                  </div>

                  {/* Title & details */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-white text-sm sm:text-base">
                        {item.name}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        item.category === 'masuk' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        item.category === 'dhuha' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        item.category === 'dzuhur' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' :
                        item.category === 'istirahat' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        item.category === 'pulang' ? 'bg-teal-950 text-teal-300 border border-teal-800' :
                        item.category === 'ganti_jam' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                        'bg-purple-950 text-purple-300 border border-purple-800'
                      }`}>
                        {item.category.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Active Days Pills & Custom Audio Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                      <span className="text-slate-400 font-medium mr-0.5">Hari:</span>
                      {[1, 2, 3, 4, 5, 6].map((dayIdx) => {
                        const isActive = item.days.includes(dayIdx as DayOfWeek);
                        return (
                          <span
                            key={dayIdx}
                            className={`px-1.5 py-0.5 rounded font-bold ${
                              isActive 
                                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50' 
                                : 'bg-slate-900/50 text-slate-600'
                            }`}
                          >
                            {DAY_SHORT[dayIdx]}
                          </span>
                        );
                      })}

                      {/* Custom Audio Badges */}
                      {item.customAudio?.bellAudioUrl && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-950/70 border border-amber-600/60 text-amber-300 font-bold flex items-center gap-1">
                          <Music className="w-2.5 h-2.5" />
                          <span>Bel Kustom</span>
                        </span>
                      )}
                      {item.customAudio?.idAudioUrl && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-600/60 text-emerald-300 font-bold flex items-center gap-0.5">
                          <span>🎙️ ID</span>
                        </span>
                      )}
                      {item.customAudio?.enAudioUrl && (
                        <span className="px-1.5 py-0.5 rounded bg-sky-950/70 border border-sky-600/60 text-sky-300 font-bold flex items-center gap-0.5">
                          <span>🎙️ EN</span>
                        </span>
                      )}
                      {item.customAudio?.arAudioUrl && (
                        <span className="px-1.5 py-0.5 rounded bg-teal-950/70 border border-teal-600/60 text-teal-300 font-bold flex items-center gap-0.5">
                          <span>🎙️ AR</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right controls: Play test, Enable toggle, Edit, Delete */}
                <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-700/60">
                  
                  {/* Test Play */}
                  <button
                    onClick={() => onTriggerBell(item, 'manual')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-emerald-700 text-slate-200 hover:text-white text-xs font-semibold transition-all shadow-sm"
                    title="Uji bunyikan jadwal ini (Bel + 3 Bahasa)"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Uji Suara</span>
                  </button>

                  {/* Toggle Active Switch */}
                  <button
                    onClick={() => handleToggleEnable(item.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      item.enabled 
                        ? 'bg-emerald-950/70 border-emerald-600 text-emerald-300 hover:bg-emerald-900' 
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {item.enabled ? 'Aktif' : 'Nonaktif'}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 rounded-xl bg-slate-700/80 hover:bg-slate-600 text-slate-300 hover:text-white transition-all"
                    title="Edit jadwal"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Duplicate */}
                  <button
                    onClick={() => handleDuplicate(item)}
                    className="p-2 rounded-xl bg-slate-700/80 hover:bg-slate-600 text-slate-300 hover:text-white transition-all"
                    title="Duplikat jadwal"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handlePromptDelete(item)}
                    className="p-2 rounded-xl bg-slate-700/80 hover:bg-rose-900/80 text-slate-300 hover:text-rose-200 transition-all"
                    title="Hapus jadwal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>

              {/* Collapsible / preview 3-language announcement box */}
              <div className="mt-3 pt-3 border-t border-slate-700/50 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                    🇮🇩 Bahasa Indonesia:
                  </span>
                  <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-2">
                    {item.announcements.id || '(Tidak ada teks)'}
                  </p>
                </div>

                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                    🇬🇧 English:
                  </span>
                  <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-2">
                    {item.announcements.en || '(Tidak ada teks)'}
                  </p>
                </div>

                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-right" dir="rtl">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1" dir="ltr">
                    🇸🇦 العربية:
                  </span>
                  <p className="text-slate-200 text-xs font-serif leading-relaxed line-clamp-2">
                    {item.announcements.ar || '(لا يوجد نص)'}
                  </p>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Floating Toast Notification */}
      {feedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
          <div className={`px-4 py-2.5 rounded-2xl shadow-2xl border flex items-center gap-2.5 text-xs font-bold text-white ${
            feedbackToast.type === 'success' 
              ? 'bg-emerald-900/90 border-emerald-500 text-emerald-100 shadow-emerald-950/60' 
              : 'bg-slate-800/95 border-slate-600 text-slate-100'
          }`}>
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackToast.message}</span>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Schedule */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-800/60 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-950/80 text-rose-400 rounded-2xl border border-rose-700/50">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Hapus Jadwal Bel?</h3>
                <p className="text-xs text-slate-400">Tindakan ini akan menghapus jadwal dari daftar dan sinkronisasi cloud</p>
              </div>
            </div>

            <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-3.5 text-xs space-y-1">
              <div className="flex items-center gap-2 text-amber-300 font-bold font-mono text-sm">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Pukul {deleteTarget.time} WIB</span>
              </div>
              <p className="text-white font-semibold">{deleteTarget.name}</p>
              <p className="text-slate-400 text-[11px]">Kategori: {deleteTarget.category.replace('_', ' ')}</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Jadwal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Reset or Clear All */}
      {resetConfirmType && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-800/60 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-950/80 text-rose-400 rounded-2xl border border-rose-700/50">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {resetConfirmType === 'reset' ? 'Reset ke Jadwal Bawaan?' : 'Kosongkan Semua Jadwal?'}
                </h3>
                <p className="text-xs text-slate-400">
                  {resetConfirmType === 'reset' 
                    ? 'Seluruh jadwal saat ini akan digantikan dengan jadwal standar resmi MI Syuriyah Pebatan' 
                    : 'Seluruh jadwal bel aktif akan dihapus dari daftar'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setResetConfirmType(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (resetConfirmType === 'reset') {
                    onSaveSchedules(DEFAULT_BELL_SCHEDULES);
                    showToast('Jadwal berhasil di-reset ke bawaan resmi.');
                  } else {
                    onSaveSchedules([]);
                    showToast('Seluruh jadwal berhasil dikosongkan.', 'info');
                  }
                  setResetConfirmType(null);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{resetConfirmType === 'reset' ? 'Ya, Reset Bawaan' : 'Ya, Kosongkan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Schedule Item */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-emerald-700/60 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-950 text-emerald-400 rounded-xl border border-emerald-700/40">
                  {editingId ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingId ? 'Edit Jadwal Bel' : 'Tambah Jadwal Bel Baru'}
                  </h3>
                  <p className="text-xs text-slate-400">Atur waktu, suara bel, dan teks pengumuman 3 bahasa</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inline Form Error Notice */}
            {formError && (
              <div className="bg-rose-950/80 border border-rose-700/60 text-rose-200 text-xs px-3.5 py-2.5 rounded-2xl flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span>{formError}</span>
              </div>
            )}

            {/* Quick Template Selector */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pilih Template Teks Pengumuman Cepat:</span>
              </div>
              <select
                onChange={(e) => {
                  if (e.target.value) handleApplyTemplate(e.target.value);
                }}
                defaultValue=""
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="" disabled>-- Pilih Template Pengumuman Madrasah --</option>
                <option value="masuk_awal">Bel Masuk Jam Ke-1 & Doa Pagi</option>
                <option value="ganti_jam">Bel Ganti Jam Pelajaran</option>
                <option value="dhuha_istirahat">Bel Sholat Dhuha & Istirahat 1</option>
                <option value="masuk_istirahat">Bel Masuk Pasca Istirahat</option>
                <option value="dzuhur_istirahat">Bel Sholat Dzuhur & Istirahat 2</option>
                <option value="pulang_standar">Bel Selesai Pelajaran & Doa Pulang</option>
                <option value="pulang_jumat">Bel Pulang Khusus Hari Jumat</option>
                <option value="ujian_mulai">Bel Mulai Pengerjaan Ujian</option>
              </select>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveModal} className="space-y-4">
              
              {/* Row 1: Time & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Waktu Bel (Format 24 Jam):
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Kategori Acara:
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as BellCategory })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="masuk">Bel Masuk Kelas</option>
                    <option value="ganti_jam">Ganti Jam Pelajaran</option>
                    <option value="istirahat">Istirahat Umum</option>
                    <option value="dhuha">Sholat Dhuha & Istirahat</option>
                    <option value="dzuhur">Sholat Dzuhur & Istirahat</option>
                    <option value="pulang">Bel Pulang Sekolah</option>
                    <option value="upacara">Upacara / Tadarus / Apel</option>
                    <option value="custom">Kustom / Khusus</option>
                  </select>
                </div>
              </div>

              {/* Event Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nama Event / Acara:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bel Masuk Jam Ke-1 & Doa Pagi"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Active Days Checkboxes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Hari Aktif (Pilih Hari Berlakunya Bel):
                  </label>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, days: [1, 2, 3, 4, 5, 6] })}
                      className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-emerald-950 text-slate-400 hover:text-emerald-300 border border-slate-700 transition-colors font-medium"
                    >
                      Sen-Sab
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, days: [1, 2, 3, 4] })}
                      className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-emerald-950 text-slate-400 hover:text-emerald-300 border border-slate-700 transition-colors font-medium"
                    >
                      Sen-Kam
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, days: [5] })}
                      className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-emerald-950 text-slate-400 hover:text-emerald-300 border border-slate-700 transition-colors font-medium"
                    >
                      Jumat Saja
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((dayIdx) => {
                    const checked = formData.days.includes(dayIdx as DayOfWeek);
                    return (
                      <label
                        key={dayIdx}
                        className={`flex items-center justify-center p-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                          checked 
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-600' 
                            : 'bg-slate-800/60 text-slate-500 border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, days: [...formData.days, dayIdx as DayOfWeek] });
                            } else {
                              setFormData({ ...formData, days: formData.days.filter(d => d !== dayIdx) });
                            }
                          }}
                          className="hidden"
                        />
                        <span>{DAY_NAMES[dayIdx]}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Chime selector & options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Jenis Suara Bel:
                  </label>
                  <select
                    value={formData.chimeType}
                    onChange={(e) => setFormData({ ...formData, chimeType: e.target.value as ChimeType })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="westminster">Westminster Chime (Melodi Big Ben)</option>
                    <option value="tubular">Tubular Bell (Lonceng Tabung Megah)</option>
                    <option value="three_tone">3-Nada (Ding Dong Dang Modern)</option>
                    <option value="dingdong">2-Nada (Ding Dong Klasik)</option>
                    <option value="mic_chirp">PA Mic Chime Chirp (Nada Pengeras Suara)</option>
                    <option value="electric">Bel Listrik / Elektrik Sekolah</option>
                    <option value="soft">Soft Serene Chime</option>
                    <option value="emergency">Sirine Darurat / Siaga</option>
                    <option value="custom_audio">🎵 File MP3 Kustom Sendiri (Upload MP3 di bawah)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Opsi Bunyi:
                  </label>
                  <div className="flex items-center gap-3 pt-1 text-xs text-slate-300">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.playChime}
                        onChange={(e) => setFormData({ ...formData, playChime: e.target.checked })}
                        className="rounded accent-emerald-500"
                      />
                      <span>Bunyikan Bel</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.playTTS}
                        onChange={(e) => setFormData({ ...formData, playTTS: e.target.checked })}
                        className="rounded accent-emerald-500"
                      />
                      <span>Suara 3 Bahasa</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 3-Language Text Announcements */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Languages className="w-4 h-4 text-emerald-400" />
                  <span>Teks Pengumuman Suara 3 Bahasa:</span>
                </div>

                {/* 1. Indonesian */}
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-300 mb-1">
                    🇮🇩 1. Bahasa Indonesia:
                  </label>
                  <textarea
                    rows={2}
                    value={formData.announcements.id}
                    onChange={(e) => setFormData({
                      ...formData,
                      announcements: { ...formData.announcements, id: e.target.value }
                    })}
                    placeholder="Teks pengumuman dalam Bahasa Indonesia..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* 2. English */}
                <div>
                  <label className="block text-[11px] font-semibold text-amber-300 mb-1">
                    🇬🇧 2. English:
                  </label>
                  <textarea
                    rows={2}
                    value={formData.announcements.en}
                    onChange={(e) => setFormData({
                      ...formData,
                      announcements: { ...formData.announcements, en: e.target.value }
                    })}
                    placeholder="Announcement text in English..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* 3. Arabic */}
                <div dir="rtl">
                  <label className="block text-[11px] font-semibold text-emerald-300 mb-1 text-right" dir="ltr">
                    🇸🇦 3. اللغة العربية (Bahasa Arab):
                  </label>
                  <textarea
                    rows={2}
                    value={formData.announcements.ar}
                    onChange={(e) => setFormData({
                      ...formData,
                      announcements: { ...formData.announcements, ar: e.target.value }
                    })}
                    placeholder="نص الإعلان باللغة العربية..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm font-serif text-white focus:outline-none focus:border-emerald-500 text-right"
                  />
                </div>
              </div>

              {/* Upload / Record Custom Audio for this Schedule */}
              <ScheduleAudioUploader
                customAudio={formData.customAudio}
                onChangeCustomAudio={(customAudio) => {
                  const hasBellMp3 = !!customAudio?.bellAudioUrl;
                  setFormData({ 
                    ...formData, 
                    customAudio,
                    chimeType: hasBellMp3 ? 'custom_audio' : formData.chimeType
                  });
                }}
                settings={settings}
              />

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
                {editingId ? (
                  <button
                    type="button"
                    onClick={() => {
                      const item = schedules.find(s => s.id === editingId);
                      if (item) {
                        setDeleteTarget(item);
                      }
                    }}
                    className="px-3.5 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Hapus Jadwal</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Simpan Jadwal</span>
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
