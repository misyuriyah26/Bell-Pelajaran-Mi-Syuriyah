import React from 'react';
import { 
  Bell, 
  Volume2, 
  Square, 
  Sparkles, 
  Globe2, 
  Languages,
  CheckCircle
} from 'lucide-react';
import { ActivePlaybackState } from '../types';

interface ActiveBellOverlayProps {
  playbackState: ActivePlaybackState;
  onStop: () => void;
  logoUrl?: string;
}

export const ActiveBellOverlay: React.FC<ActiveBellOverlayProps> = ({
  playbackState,
  onStop,
  logoUrl = '/app-icon.jpg'
}) => {
  if (!playbackState.isPlaying) return null;

  const eventName = playbackState.event?.name || playbackState.manualTitle || 'Bel Sekolah Sedang Berbunyi';
  const announcements = playbackState.event?.announcements || playbackState.manualAnnouncements || {
    id: '',
    en: '',
    ar: ''
  };

  const currentStep = playbackState.currentStep;

  return (
    <div id="active-bell-overlay" className="fixed inset-x-0 top-4 z-50 flex justify-center px-4 pointer-events-none">
      <div className="w-full max-w-4xl bg-slate-900/95 border-2 border-emerald-500 rounded-3xl p-5 sm:p-6 shadow-[0_10px_50px_rgba(16,185,129,0.35)] backdrop-blur-md pointer-events-auto text-white space-y-4 animate-bounce-subtle ring-4 ring-emerald-500/20">
        
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4 border-b border-emerald-800/60 pb-3">
          
          <div className="flex items-center gap-3">
            {/* Animated ringing bell with official emblem */}
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 p-0.5 border border-amber-300 shadow-lg shadow-emerald-500/50 flex items-center justify-center animate-wiggle shrink-0 overflow-hidden">
              <img 
                src={logoUrl || "/app-icon.jpg"} 
                alt="Bel Sedang Berbunyi" 
                className="w-full h-full object-cover rounded-xl" 
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/app-icon.jpg";
                }}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-400 text-slate-950 tracking-wider">
                  BEL SEDANG BERBUNYI
                </span>
                <span className="text-xs text-emerald-300 font-medium hidden sm:inline">
                  MI Syuriyah Pebatan
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                {eventName}
              </h2>
            </div>
          </div>

          {/* Stop Button */}
          <button
            id="btn-stop-active-bell"
            onClick={onStop}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95 shrink-0"
          >
            <Square className="w-4 h-4 fill-white" />
            <span>Hentikan Bel</span>
          </button>

        </div>

        {/* Step Progression Badges (4 Steps) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          
          {/* Step 1: Chime */}
          <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
            currentStep === 'chime' 
              ? 'bg-amber-400 text-slate-950 font-bold border-amber-300 shadow-md ring-2 ring-amber-300/40' 
              : currentStep === 'tts_id' || currentStep === 'tts_en' || currentStep === 'tts_ar'
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <Volume2 className="w-4 h-4 shrink-0" />
            <div className="truncate">
              <span className="block text-[10px] uppercase opacity-80">Langkah 1</span>
              <span>Nada Bel</span>
            </div>
          </div>

          {/* Step 2: Bahasa Indonesia */}
          <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
            currentStep === 'tts_id' 
              ? 'bg-amber-400 text-slate-950 font-bold border-amber-300 shadow-md ring-2 ring-amber-300/40' 
              : currentStep === 'tts_en' || currentStep === 'tts_ar'
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <span className="text-base shrink-0">🇮🇩</span>
            <div className="truncate">
              <span className="block text-[10px] uppercase opacity-80">Langkah 2</span>
              <span>B. Indonesia</span>
            </div>
          </div>

          {/* Step 3: English */}
          <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
            currentStep === 'tts_en' 
              ? 'bg-amber-400 text-slate-950 font-bold border-amber-300 shadow-md ring-2 ring-amber-300/40' 
              : currentStep === 'tts_ar'
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <span className="text-base shrink-0">🇬🇧</span>
            <div className="truncate">
              <span className="block text-[10px] uppercase opacity-80">Langkah 3</span>
              <span>English</span>
            </div>
          </div>

          {/* Step 4: Arabic */}
          <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
            currentStep === 'tts_ar' 
              ? 'bg-amber-400 text-slate-950 font-bold border-amber-300 shadow-md ring-2 ring-amber-300/40' 
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <span className="text-base shrink-0">🇸🇦</span>
            <div className="truncate font-arabic">
              <span className="block text-[10px] uppercase opacity-80" dir="ltr">Langkah 4</span>
              <span>العربية</span>
            </div>
          </div>

        </div>

        {/* Dynamic Display of Spoken Text */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center space-y-1">
          {currentStep === 'chime' && (
            <div className="py-2 text-amber-300 font-semibold text-sm flex items-center justify-center gap-2">
              <Volume2 className="w-5 h-5 animate-pulse" />
              <span>Memutar nada lonceng bel sekolah...</span>
            </div>
          )}

          {currentStep === 'tts_id' && (
            <div className="py-1 space-y-1 animate-fade-in">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
                🇮🇩 PENGUMUMAN BAHASA INDONESIA:
              </span>
              <p className="text-base sm:text-lg font-bold text-white leading-relaxed">
                "{announcements.id || 'Perhatian seluruh siswa-siswi.'}"
              </p>
            </div>
          )}

          {currentStep === 'tts_en' && (
            <div className="py-1 space-y-1 animate-fade-in">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                🇬🇧 ENGLISH ANNOUNCEMENT:
              </span>
              <p className="text-base sm:text-lg font-bold text-white leading-relaxed italic">
                "{announcements.en || 'Attention all students.'}"
              </p>
            </div>
          )}

          {currentStep === 'tts_ar' && (
            <div className="py-1 space-y-1 animate-fade-in" dir="rtl">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block" dir="ltr">
                🇸🇦 الإعلان باللغة العربية:
              </span>
              <p className="text-lg sm:text-xl font-bold font-serif text-amber-200 leading-loose">
                « {announcements.ar || 'انتباه لجميع الطلاب'} »
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
