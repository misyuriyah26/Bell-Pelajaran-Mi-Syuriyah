import React from 'react';
import { 
  HelpCircle, 
  Tv, 
  Volume2, 
  Languages, 
  Calendar, 
  CheckCircle2, 
  Waves,
  UserCheck,
  Music,
  Radio,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { SchoolProfile } from '../types';

interface GuideViewProps {
  profile: SchoolProfile;
}

export const GuideView: React.FC<GuideViewProps> = ({ profile }) => {
  return (
    <div className="space-y-6 pb-16">
      
      {/* Top Header */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-5 sm:p-6 shadow-xl flex items-center gap-3.5">
        <img 
          src="/app-icon.jpg" 
          alt="Logo Bel MI Syuriyah" 
          className="w-12 h-12 rounded-2xl border border-amber-400/60 shadow-md object-cover shrink-0" 
        />
        <div>
          <h2 className="text-lg font-bold text-white">Panduan Pengoperasian Bel Otomatis & Akustik {profile.name}</h2>
          <p className="text-xs text-slate-400">Petunjuk teknis instalasi speaker, efek echo madrasah, karakter suara ustadz/ustadzah, dan 3 bahasa</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Step 1: Hardware Setup */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-700">
            <Tv className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">1. Koneksi Perangkat ke Speaker Sekolah</h3>
          </div>

          <ul className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
              <span>
                <strong>Sambungkan Laptop/PC Operator ke Amplifier:</strong> Hubungkan port jack audio 3.5mm (Headphone Out) laptop ke input AUX/Line In pada amplifier pusat ruang TU/Madrasah.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
              <span>
                <strong>Atur Volume Amplifier:</strong> Set volume master laptop pada 80-90% dan sesuaikan gain amplifier agar suara bel terdengar jernih di seluruh ruang kelas dan halaman.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
              <span>
                <strong>Gunakan Fitur "Tetap Terbuka":</strong> Pastikan laptop tidak masuk mode <em>Sleep / Hibernate</em> otomatis saat dinyalakan seharian.
              </span>
            </li>
          </ul>
        </div>

        {/* Step 2: Efek Echo & Akustik Speaker */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-700">
            <Waves className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">2. Fitur Efek Echo & Akustik Speaker Madrasah</h3>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Sistem dilengkapi efek pemrosesan sinyal digital (DSP Echo & Filter) Web Audio API untuk mensimulasikan akustik pengeras suara nyata:
          </p>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="font-bold text-emerald-300 block">🏛️ Preset Lorong & Aula Madrasah:</span>
              <span className="text-slate-400 text-[11px]">Memberikan pantulan gema khas selasar lorong kelas yang jernih dan berwibawa.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="font-bold text-amber-300 block">🕌 Preset Halaman & Masjid Madrasah:</span>
              <span className="text-slate-400 text-[11px]">Gema luas dan tebal seperti speaker outdoor TOA saat doa dan panggilan sholat.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="font-bold text-cyan-300 block">🏫 Preset Speaker Ruang Kelas:</span>
              <span className="text-slate-400 text-[11px]">Echo cepat dan renyah tanpa dengungan, cocok untuk speaker gantung di dalam kelas.</span>
            </div>
          </div>
        </div>

        {/* Step 3: Karakter Suara Realistis & 3 Bahasa */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-700">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">3. Pilihan Karakter Suara Realistis & 3 Bahasa</h3>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Pilih persona pengumuman yang sesuai di menu <strong>"Pengaturan Suara"</strong>:
          </p>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
              <span className="text-xl">👨‍🏫</span>
              <div>
                <span className="font-bold text-emerald-400 block">Ustadz (Pria Berwibawa & Santun)</span>
                <span className="text-slate-400 text-[11px]">Tempo tenang, artikulasi santun dan berbobot.</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
              <span className="text-xl">👩‍🏫</span>
              <div>
                <span className="font-bold text-amber-300 block">Ustadzah (Wanita Lembut & Jelas)</span>
                <span className="text-slate-400 text-[11px]">Nada ramah dan artikulasi sangat jernih didengar anak-anak.</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
              <span className="text-xl">📢</span>
              <div>
                <span className="font-bold text-cyan-300 block">Penyiar Resmi Sekolah</span>
                <span className="text-slate-400 text-[11px]">Gaya siaran formal instruksional dengan nada tegas.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Special Modes & Backup */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-700">
            <Calendar className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">4. Mode Libur, Ujian, & Cadangan Data</h3>
          </div>

          <ul className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
            <li className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Mode Ujian / Asesmen:</strong> Buka tab "Jadwal Bel" dan klik preset "Mode Ujian" untuk memuat sesi asesmen.</span>
            </li>
            <li className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Mode Ramadhan:</strong> Beralih ke jadwal khusus bulan suci dengan durasi pembelajaran ringkas.</span>
            </li>
            <li className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span><strong>Mode Libur:</strong> Buka tab "Pengaturan Umum" dan centang "Status Hari Libur" saat libur nasional.</span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span><strong>Pencadangan JSON:</strong> Seluruh konfigurasi jadwal dapat diunduh dan dipulihkan dengan 1 kali klik.</span>
            </li>
          </ul>
        </div>

      </div>

    </div>
  );
};
