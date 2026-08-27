import React, { useState } from 'react';
import { 
  Megaphone, 
  X, 
  Play, 
  Sparkles, 
  Languages, 
  Volume2,
  Send,
  MessageSquare
} from 'lucide-react';
import { ChimeType, BellAnnouncement, BellSettings } from '../types';

interface ManualAnnounceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBroadcast: (title: string, chimeType: ChimeType, announcements: BellAnnouncement, playChime: boolean) => void;
  settings: BellSettings;
}

const BROADCAST_PRESETS: Array<{ title: string; id: string; en: string; ar: string }> = [
  {
    title: 'Panggilan Guru / Rapat',
    id: 'Perhatian kepada seluruh Bapak dan Ibu Guru MI Syuriyah Pebatan, dimohon untuk berkumpul di ruang guru sekarang.',
    en: 'Attention to all respected teachers of MI Syuriyah Pebatan, please gather in the teachers room now.',
    ar: 'انتباه لجميع السادة المعلمين والمعلمات، يرجى التجمع في غرفة المعلمين الآن.'
  },
  {
    title: 'Persiapan Sholat Berjamaah',
    id: 'Waktu sholat berjamaah telah tiba. Seluruh siswa-siswi dipersilakan segera berwudhu dan menuju ke musholla madrasah.',
    en: 'Congregational prayer time has arrived. All students please perform ablution and proceed to the prayer hall.',
    ar: 'حان وقت الصلاة جماعة. يرجى من جميع الطلاب الوضوء والتوجه إلى مصلى المدرسة فورًا.'
  },
  {
    title: 'Operasi Semut / Kebersihan Kelas',
    id: 'Waktunya kegiatan kebersihan kelas dan lingkungan madrasah. Mari bersihkan dan rapikan sampah di sekitar kita.',
    en: 'It is time for classroom cleanliness. Let us clean and tidy up our surroundings.',
    ar: 'حان وقت النظافة المدرسية. هيا بنا ننظف ونرتب الفصول وساحة المدرسة.'
  },
  {
    title: 'Siswa Pulang Lebih Awal',
    id: 'Pengumuman untuk seluruh siswa-siswi MI Syuriyah Pebatan, hari ini pembelajaran selesai lebih awal. Selamat pulang dan hati-hati di jalan.',
    en: 'Announcement for all students, today school dismisses early. Have a safe trip home.',
    ar: 'إعلان لجميع الطلاب، تنتهي الدروس اليوم في وقت مبكر. نتمنى لكم عودة آمنة إلى بيوتكم.'
  }
];

export const ManualAnnounceModal: React.FC<ManualAnnounceModalProps> = ({
  isOpen,
  onClose,
  onBroadcast,
  settings
}) => {
  const [title, setTitle] = useState('Pengumuman Khusus Madrasah');
  const [chimeType, setChimeType] = useState<ChimeType>(settings.defaultChimeType);
  const [playChime, setPlayChime] = useState(true);
  
  const [announcements, setAnnouncements] = useState<BellAnnouncement>({
    id: 'Perhatian seluruh siswa-siswi MI Syuriyah Pebatan...',
    en: 'Attention all students of MI Syuriyah Pebatan...',
    ar: 'انتباه لجميع تلاميذ وتلميذات مدرسة سورية بيباتان...'
  });

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof BROADCAST_PRESETS[0]) => {
    setTitle(preset.title);
    setAnnouncements({
      id: preset.id,
      en: preset.en,
      ar: preset.ar
    });
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcements.id.trim()) {
      alert('Mohon isi teks pengumuman bahasa Indonesia.');
      return;
    }
    onBroadcast(title, chimeType, announcements, playChime);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-emerald-600/60 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-950 text-emerald-400 rounded-xl border border-emerald-700/40">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Siarkan Pengumuman Suara (3 Bahasa)</h3>
              <p className="text-xs text-slate-400">Kirim siaran suara langsung ke speaker sekolah dengan nada lonceng pembuka</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Preset Buttons */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pilih Pengumuman Cepat:</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {BROADCAST_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-left text-xs transition-all hover:border-emerald-500 flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-slate-200 truncate">{p.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSendBroadcast} className="space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Judul Pengumuman:
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nada Bel Pembuka:
              </label>
              <select
                value={chimeType}
                onChange={(e) => setChimeType(e.target.value as ChimeType)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="westminster">Westminster Chime (Big Ben)</option>
                <option value="tubular">Tubular Bell (Lonceng Tabung)</option>
                <option value="three_tone">3-Nada (Ding Dong Dang)</option>
                <option value="dingdong">2-Nada (Ding Dong)</option>
                <option value="mic_chirp">PA Mic Chime Chirp</option>
                <option value="electric">Bel Elektrik</option>
                <option value="soft">Soft Chime</option>
                <option value="emergency">Sirine Darurat / Siaga</option>
                <option value="custom_audio">🎵 File MP3 Kustom Sendiri</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Opsi Bunyi:
              </label>
              <label className="flex items-center gap-2 pt-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={playChime}
                  onChange={(e) => setPlayChime(e.target.checked)}
                  className="rounded accent-emerald-500"
                />
                <span>Bunyikan nada lonceng sebelum pengumuman</span>
              </label>
            </div>
          </div>

          {/* 3 Languages Input */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-emerald-300 mb-1">
                🇮🇩 1. Teks Bahasa Indonesia:
              </label>
              <textarea
                rows={2}
                required
                value={announcements.id}
                onChange={(e) => setAnnouncements({ ...announcements, id: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-300 mb-1">
                🇬🇧 2. Teks English (Opsional):
              </label>
              <textarea
                rows={2}
                value={announcements.en}
                onChange={(e) => setAnnouncements({ ...announcements, en: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div dir="rtl">
              <label className="block text-xs font-semibold text-emerald-300 mb-1 text-right" dir="ltr">
                🇸🇦 3. النص العربي (Bahasa Arab):
              </label>
              <textarea
                rows={2}
                value={announcements.ar}
                onChange={(e) => setAnnouncements({ ...announcements, ar: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm font-serif text-white focus:outline-none focus:border-emerald-500 text-right"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Siarkan Sekarang ke Speaker</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
