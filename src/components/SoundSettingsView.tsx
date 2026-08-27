import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Volume2, 
  Play, 
  Sparkles, 
  Mic, 
  Square, 
  Languages, 
  Check, 
  Upload, 
  RefreshCw, 
  Headphones,
  Music,
  Radio,
  Disc,
  Waves,
  Building,
  VolumeX,
  Volume1,
  UserCheck,
  CheckCircle2,
  FileAudio,
  Trash2,
  FileCheck,
  FolderArchive,
  FolderUp
} from 'lucide-react';
import { BellSettings, ChimeType, EchoPreset, VoicePersona, BellEvent } from '../types';
import { 
  playChimeByType, 
  speakText, 
  getAvailableVoices, 
  executeFullBellSequence,
  playMicChirp,
  isHighQualityVoice
} from '../utils/audioEngine';
import { AudioRecorder } from '../utils/recorder';
import { AudioFolderLibrary } from './AudioFolderLibrary';
import { saveAudioFile, getAudioDuration, formatBytes, formatDurationSeconds } from '../utils/audioLibraryStorage';

interface SoundSettingsViewProps {
  settings: BellSettings;
  onSaveSettings: (settings: BellSettings) => void;
  schedules?: BellEvent[];
  onSaveSchedules?: (schedules: BellEvent[]) => void;
}

const ECHO_PRESETS_DATA: Record<EchoPreset, { name: string; desc: string; icon: string; delayTime: number; feedback: number; wetLevel: number; filterFreq: number }> = {
  hallway: {
    name: 'Lorong & Aula Madrasah',
    desc: 'Pantulan akustik khas lorong dan selasar ruang kelas madrasah',
    icon: '🏛️',
    delayTime: 0.28,
    feedback: 0.38,
    wetLevel: 0.32,
    filterFreq: 2400
  },
  courtyard: {
    name: 'Halaman & Masjid Madrasah',
    desc: 'Gema luas dan tebal seperti speaker sound system luar ruangan / TOA',
    icon: '🕌',
    delayTime: 0.42,
    feedback: 0.46,
    wetLevel: 0.38,
    filterFreq: 1800
  },
  classroom: {
    name: 'Speaker Ruang Kelas',
    desc: 'Echo renyah dan cepat, sangat jernih tanpa dengungan berlebih',
    icon: '🏫',
    delayTime: 0.14,
    feedback: 0.22,
    wetLevel: 0.24,
    filterFreq: 3400
  },
  studio: {
    name: 'Studio Jernih (Tanpa Gema)',
    desc: 'Suara langsung tanpa efek gema (Direct Sound)',
    icon: '🎛️',
    delayTime: 0.0,
    feedback: 0.0,
    wetLevel: 0.0,
    filterFreq: 8000
  },
  custom: {
    name: 'Kustom Manual',
    desc: 'Atur waktu delay, feedback, dan frekuensi filter secara manual',
    icon: '⚙️',
    delayTime: 0.25,
    feedback: 0.35,
    wetLevel: 0.30,
    filterFreq: 2500
  }
};

const VOICE_PERSONAS: Array<{ id: VoicePersona; title: string; subtitle: string; icon: string; rate: number; pitch: number }> = [
  {
    id: 'ustadz',
    title: 'Ustadz (Pria Berwibawa & Santun)',
    subtitle: 'Tempo tenang, nada khidmat dan santun khas Madrasah Ibtidaiyah',
    icon: '👨‍🏫',
    rate: 0.95,
    pitch: 0.95
  },
  {
    id: 'ustadzah',
    title: 'Ustadzah (Wanita Lembut & Jelas)',
    subtitle: 'Artikulasi ramah, lembut, dan sangat jelas didengar para siswa',
    icon: '👩‍🏫',
    rate: 0.98,
    pitch: 1.05
  },
  {
    id: 'formal',
    title: 'Penyiar Resmi Sekolah (Public Address)',
    subtitle: 'Gaya siaran formal dan tegas untuk instruksi pergantian jam',
    icon: '📢',
    rate: 1.02,
    pitch: 1.00
  },
  {
    id: 'santri',
    title: 'Santri Pelajar (Ceria & Bilingual)',
    subtitle: 'Suara aktif dan segar untuk pembiasaan bahasa santri',
    icon: '👦',
    rate: 1.05,
    pitch: 1.10
  },
  {
    id: 'custom',
    title: 'Kustom Manual',
    subtitle: 'Sesuaikan slider kecepatan (rate) dan nada (pitch) manual di bawah',
    icon: '⚙️',
    rate: 1.0,
    pitch: 1.0
  }
];

export const SoundSettingsView: React.FC<SoundSettingsViewProps> = ({
  settings,
  onSaveSettings,
  schedules = [],
  onSaveSchedules
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewChime, setPreviewChime] = useState<string | null>(null);

  type SoundSubTab = 'all' | 'folder_library' | 'echo_dsp' | 'chimes' | 'voices' | 'studio';
  const [activeSubTab, setActiveSubTab] = useState<SoundSubTab>('all');

  // Recorder state
  const [recorder] = useState(() => new AudioRecorder());
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);

  // Test phrases
  const [testTextId, setTestTextId] = useState('Selamat pagi seluruh santri MI Syuriyah Pebatan. Waktu belajar telah tiba.');
  const [testTextEn, setTestTextEn] = useState('Good morning all students of MI Syuriyah Pebatan. Time for classes has arrived.');
  const [testTextAr, setTestTextAr] = useState('صباح الخير لجميع تلاميذ وتلميذات مدرسة سورية بيباتان. حان وقت الدراسة.');

  useEffect(() => {
    getAvailableVoices().then(v => setVoices(v));

    const handleVoicesChanged = () => {
      getAvailableVoices().then(v => setVoices(v));
    };

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      }
    };
  }, []);

  const refreshVoicesList = () => {
    getAvailableVoices().then(v => setVoices(v));
  };

  const idVoices = voices.filter(v => v.lang.toLowerCase().startsWith('id') || v.lang.toLowerCase().includes('ind'));
  const enVoices = voices.filter(v => v.lang.toLowerCase().startsWith('en'));
  const arVoices = voices.filter(v => v.lang.toLowerCase().startsWith('ar'));

  const handlePlayChimeTest = async (type: ChimeType) => {
    setPreviewChime(type);
    try {
      await playChimeByType(type, settings, undefined, 1);
    } finally {
      setPreviewChime(null);
    }
  };

  const handleTestMicChirp = async () => {
    setPreviewChime('mic_chirp');
    try {
      await playMicChirp(settings.chimeVolume * settings.masterVolume, settings.echo);
    } finally {
      setPreviewChime(null);
    }
  };

  const handleTestSingleTTS = async (lang: 'id' | 'en' | 'ar') => {
    const text = lang === 'id' ? testTextId : lang === 'en' ? testTextEn : testTextAr;
    setIsPlayingPreview(true);
    try {
      await speakText(text, lang, settings);
    } finally {
      setIsPlayingPreview(false);
    }
  };

  const handleTestFullSequence = async () => {
    setIsPlayingPreview(true);
    try {
      await executeFullBellSequence(
        settings.defaultChimeType,
        {
          id: testTextId,
          en: testTextEn,
          ar: testTextAr
        },
        settings,
        {
          playChime: true,
          playTTS: true,
          repeatChime: 1
        }
      );
    } finally {
      setIsPlayingPreview(false);
    }
  };

  const handleApplyEchoPreset = (presetKey: EchoPreset) => {
    const preset = ECHO_PRESETS_DATA[presetKey];
    onSaveSettings({
      ...settings,
      echo: {
        ...settings.echo,
        enabled: presetKey !== 'studio',
        preset: presetKey,
        delayTime: preset.delayTime,
        feedback: preset.feedback,
        wetLevel: preset.wetLevel,
        filterFreq: preset.filterFreq
      }
    });
  };

  const handleApplyPersona = (persona: typeof VOICE_PERSONAS[0]) => {
    onSaveSettings({
      ...settings,
      voicePersona: persona.id,
      ttsRate: persona.rate,
      ttsPitch: persona.pitch
    });
  };

  // Recording controls
  const handleStartRecording = async () => {
    const ok = await recorder.start();
    if (ok) {
      setIsRecording(true);
      setRecordedAudioUrl(null);
    } else {
      alert('Gagal mengakses mikrofon. Pastikan izin mikrofon telah diberikan di browser.');
    }
  };

  const handleStopRecording = async () => {
    try {
      const base64 = await recorder.stop();
      setIsRecording(false);
      setRecordedAudioUrl(base64);
    } catch (err) {
      console.error(err);
      setIsRecording(false);
    }
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert('Ukuran file maksimal adalah 25 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setRecordedAudioUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleBellMp3Upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert('Ukuran file maksimal adalah 25 MB.');
      return;
    }

    const fileName = file.name;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      onSaveSettings({
        ...settings,
        customBellAudioUrl: dataUrl,
        customBellFileName: fileName,
        defaultChimeType: 'custom_audio'
      });

      // Also register to Firebase Cloud Firestore audio library
      try {
        const durationSec = await getAudioDuration(dataUrl);
        const cleanName = fileName.replace(/\.[^/.]+$/, "").replace(/[_.-]+/g, ' ').trim();
        await saveAudioFile({
          id: 'audio-custom-bell-' + Date.now(),
          name: 'Bel Utama: ' + cleanName,
          fileName: fileName,
          folderName: 'Bel Utama',
          fullRelativePath: fileName,
          size: file.size,
          sizeFormatted: formatBytes(file.size),
          type: file.type || 'audio/mpeg',
          url: dataUrl,
          duration: durationSec,
          durationFormatted: formatDurationSeconds(durationSec),
          uploadedAt: new Date().toISOString(),
          targetSlot: 'bell'
        });
      } catch (err) {
        console.warn('Could not sync custom bell to Firebase library:', err);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveCustomBell = () => {
    onSaveSettings({
      ...settings,
      customBellAudioUrl: undefined,
      customBellFileName: undefined,
      defaultChimeType: settings.defaultChimeType === 'custom_audio' ? 'westminster' : settings.defaultChimeType
    });
  };

  const handleSetStudioAudioAsDefaultBell = (audioUrl: string) => {
    onSaveSettings({
      ...settings,
      customBellAudioUrl: audioUrl,
      customBellFileName: 'rekaman_audio_madrasah.wav',
      defaultChimeType: 'custom_audio'
    });
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Top Header */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-950 text-emerald-400 rounded-xl border border-emerald-700/40">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Pengaturan Suara, Galeri MP3, Efek Echo, & TTS 3 Bahasa</h2>
            <p className="text-xs text-slate-400">Kelola folder MP3, efek gema (echo) speaker, karakter suara ustadz/ustadzah, dan synthesizer lonceng realistis</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            id="btn-test-full-sequence"
            onClick={handleTestFullSequence}
            disabled={isPlayingPreview}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition-transform active:scale-95 whitespace-nowrap"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{isPlayingPreview ? 'Sedang Memutar...' : 'Uji Rangkaian 3 Bahasa Lengkap'}</span>
          </button>
        </div>
      </div>

      {/* Subtabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveSubTab('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeSubTab === 'all'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700'
          }`}
        >
          <span>📋 Semua Modul</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('folder_library')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeSubTab === 'folder_library'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md ring-2 ring-amber-300/40'
              : 'bg-slate-800/80 hover:bg-slate-700/80 text-amber-300 border border-amber-500/40'
          }`}
        >
          <FolderArchive className="w-4 h-4" />
          <span>📁 Upload 1 Folder MP3 &amp; Galeri</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-300 text-slate-950 uppercase">
            BARU
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('echo_dsp')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeSubTab === 'echo_dsp'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700'
          }`}
        >
          <Waves className="w-3.5 h-3.5 text-amber-300" />
          <span>🎛️ DSP Echo &amp; Akustik</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('chimes')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeSubTab === 'chimes'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700'
          }`}
        >
          <Music className="w-3.5 h-3.5 text-emerald-400" />
          <span>🔔 Synthesizer Bel</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('voices')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeSubTab === 'voices'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700'
          }`}
        >
          <Languages className="w-3.5 h-3.5 text-emerald-400" />
          <span>🎙️ 3 Bahasa &amp; Persona</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('studio')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeSubTab === 'studio'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700'
          }`}
        >
          <Mic className="w-3.5 h-3.5 text-rose-400" />
          <span>🎧 Studio Rekaman</span>
        </button>
      </div>

      {/* 1. AUDIO FOLDER LIBRARY (Upload 1 Folder Sekaligus) */}
      {(activeSubTab === 'folder_library' || activeSubTab === 'all') && (
        <AudioFolderLibrary
          settings={settings}
          onSaveSettings={onSaveSettings}
          schedules={schedules}
          onSaveSchedules={onSaveSchedules}
        />
      )}

      {/* 2. FEATURE: Efek Echo & Akustik Speaker Madrasah */}
      {(activeSubTab === 'echo_dsp' || activeSubTab === 'all') && (
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950/40 border-2 border-emerald-600/60 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-300 rounded-2xl border border-amber-400/40 shadow-inner">
              <Waves className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Fitur Efek Echo & Akustik Speaker Madrasah</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950 uppercase tracking-wider">
                  FITUR BARU
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Menghadirkan pantulan gema realistis seperti suara pengeras suara lorong sekolah, masjid, dan ruang kelas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.echo?.enabled ?? true}
                onChange={(e) => {
                  onSaveSettings({
                    ...settings,
                    echo: {
                      ...settings.echo,
                      enabled: e.target.checked
                    }
                  });
                }}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
              <span className="text-xs font-bold text-white">
                {settings.echo?.enabled ? 'Echo Aktif' : 'Echo Nonaktif'}
              </span>
            </label>

            <button
              onClick={handleTestMicChirp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-semibold border border-emerald-500/40 transition-all shadow-sm"
              title="Dengarkan nada mic chirp dengan efek echo"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Tes Echo Mic</span>
            </button>
          </div>
        </div>

        {/* Preset Selector Grid */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-amber-300 block">
            Pilih Preset Ruang & Akustik Madrasah:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {(Object.keys(ECHO_PRESETS_DATA) as EchoPreset[]).map((presetKey) => {
              const preset = ECHO_PRESETS_DATA[presetKey];
              const isSelected = (settings.echo?.preset === presetKey) && (settings.echo?.enabled || presetKey === 'studio');

              return (
                <button
                  key={presetKey}
                  type="button"
                  onClick={() => handleApplyEchoPreset(presetKey)}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'bg-emerald-900/80 border-amber-400 text-white shadow-lg ring-2 ring-amber-400/30'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{preset.icon}</span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-amber-300" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">{preset.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{preset.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Echo Fine-Tuning Sliders */}
        {settings.echo?.enabled && (
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
              <span>Parameter Akustik Echo Detail</span>
              <span className="text-slate-400 font-normal">
                Preset Aktif: <strong className="text-amber-300">{ECHO_PRESETS_DATA[settings.echo.preset]?.name || 'Kustom'}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Delay Time */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Jarak Pantulan (Delay):</span>
                  <span className="font-mono text-emerald-400 font-bold">{Math.round((settings.echo.delayTime || 0.28) * 1000)} ms</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.6"
                  step="0.02"
                  value={settings.echo.delayTime || 0.28}
                  onChange={(e) => {
                    onSaveSettings({
                      ...settings,
                      echo: {
                        ...settings.echo,
                        preset: 'custom',
                        delayTime: parseFloat(e.target.value)
                      }
                    });
                  }}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <span className="text-[9px] text-slate-500">Waktu tunda gelombang suara kembali</span>
              </div>

              {/* Feedback / Resonansi */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Panjang Gema (Feedback):</span>
                  <span className="font-mono text-amber-400 font-bold">{Math.round((settings.echo.feedback || 0.38) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="0.75"
                  step="0.03"
                  value={settings.echo.feedback || 0.38}
                  onChange={(e) => {
                    onSaveSettings({
                      ...settings,
                      echo: {
                        ...settings.echo,
                        preset: 'custom',
                        feedback: parseFloat(e.target.value)
                      }
                    });
                  }}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <span className="text-[9px] text-slate-500">Berapa kali suara bergema sebelum menghilang</span>
              </div>

              {/* Wet Level */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Kekuatan Gema (Wet Mix):</span>
                  <span className="font-mono text-emerald-400 font-bold">{Math.round((settings.echo.wetLevel || 0.32) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="0.8"
                  step="0.03"
                  value={settings.echo.wetLevel || 0.32}
                  onChange={(e) => {
                    onSaveSettings({
                      ...settings,
                      echo: {
                        ...settings.echo,
                        preset: 'custom',
                        wetLevel: parseFloat(e.target.value)
                      }
                    });
                  }}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <span className="text-[9px] text-slate-500">Keseimbangan volume pantulan terhadap suara asli</span>
              </div>

            </div>
          </div>
        )}

      </div>
      )}

      {/* NEW FEATURE: Pilihan Karakter Suara Realistis (Voice Personas) */}
      {(activeSubTab === 'voices' || activeSubTab === 'all') && (
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-950 text-emerald-400 rounded-xl border border-emerald-700/40">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Karakter & Profil Suara Pengumuman (Voice Persona)</h3>
              <p className="text-xs text-slate-400">Pilih gaya pembawaan suara yang sesuai dengan suasana madrasah</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {VOICE_PERSONAS.slice(0, 4).map((persona) => {
            const isSelected = settings.voicePersona === persona.id;

            return (
              <button
                key={persona.id}
                type="button"
                onClick={() => handleApplyPersona(persona)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-emerald-950/90 border-emerald-500 text-white shadow-md ring-2 ring-emerald-500/30'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl">{persona.icon}</span>
                  {isSelected && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950">
                      Aktif
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-white">{persona.title}</h4>
                <p className="text-[10px] text-slate-400 mt-1">{persona.subtitle}</p>
              </button>
            );
          })}
        </div>

        {/* Pre-Announcement Mic Chirp Toggle */}
        <div className="pt-2">
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/80 cursor-pointer">
            <div className="flex items-center gap-3">
              <Volume1 className="w-5 h-5 text-amber-400" />
              <div>
                <span className="text-xs font-bold text-white block">
                  Bunyikan Nada Lonceng Mic ("Tung-Ting") Sebelum Pengumuman
                </span>
                <span className="text-[10px] text-slate-400">
                  Memberikan sinyal pemberitahuan sebelum suara bahasa Indonesia berbunyi (khas sistem PA modern)
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.playPreChirp ?? true}
              onChange={(e) => onSaveSettings({ ...settings, playPreChirp: e.target.checked })}
              className="w-5 h-5 accent-emerald-500 rounded"
            />
          </label>
        </div>
      </div>
      )}

      {/* Grid: Chimes Studio & TTS Settings */}
      {(activeSubTab === 'chimes' || activeSubTab === 'voices' || activeSubTab === 'all') && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chime Synthesizer Studio (5 cols) */}
        {(activeSubTab === 'chimes' || activeSubTab === 'all') && (
        <div className={`${activeSubTab === 'chimes' ? 'lg:col-span-12' : 'lg:col-span-5'} bg-slate-800/80 border border-slate-700/60 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Synthesizer & File MP3 Nada Bel (Chimes)</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              MP3 / Synthesizer
            </span>
          </div>

          {/* DEDICATED MP3 BELL FILE UPLOAD SECTION */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            settings.customBellAudioUrl 
              ? 'bg-gradient-to-r from-emerald-950/80 to-slate-900 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/30' 
              : 'bg-slate-950/60 border-slate-700/80'
          }`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <FileAudio className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Upload File MP3 Suara Bel Sekolah</h4>
                  <p className="text-[10px] text-slate-400">Gunakan file lagu/nada lonceng MP3 asli madrasah sebagai bel utama</p>
                </div>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500 text-slate-950">
                MP3 FILE
              </span>
            </div>

            {settings.customBellAudioUrl ? (
              <div className="mt-2.5 pt-2.5 border-t border-emerald-800/50 space-y-2.5">
                <div className="flex items-center justify-between gap-2 bg-slate-900/90 px-2.5 py-1.5 rounded-xl border border-emerald-700/40">
                  <div className="flex items-center gap-2 truncate">
                    <Music className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-xs font-mono text-emerald-300 font-semibold truncate">
                      {settings.customBellFileName || 'bell_sekolah_kustom.mp3'}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 shrink-0">
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Tersimpan</span>
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handlePlayChimeTest('custom_audio')}
                      disabled={previewChime === 'custom_audio'}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow transition-transform active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>{previewChime === 'custom_audio' ? 'Memutar...' : 'Putar Tes MP3'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSaveSettings({ ...settings, defaultChimeType: 'custom_audio' })}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        settings.defaultChimeType === 'custom_audio'
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                      }`}
                    >
                      {settings.defaultChimeType === 'custom_audio' ? '★ Default Aktif' : 'Jadikan Default'}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <label className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer border border-slate-700 transition-colors" title="Ganti file MP3">
                      <Upload className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept="audio/*,.mp3,.wav,.ogg,.m4a"
                        onChange={handleBellMp3Upload}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleRemoveCustomBell}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors"
                      title="Hapus file MP3 bel kustom"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <label className="mt-2 flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-700 hover:border-emerald-500 hover:bg-emerald-950/20 rounded-xl cursor-pointer transition-all">
                <Upload className="w-5 h-5 text-emerald-400 mb-1" />
                <span className="text-xs font-semibold text-slate-200">Pilih / Tarik File MP3 Suara Bel</span>
                <span className="text-[10px] text-slate-400">Mendukung format .mp3, .wav, .m4a, .ogg (Maks. 25 MB)</span>
                <input
                  type="file"
                  accept="audio/*,.mp3,.wav,.ogg,.m4a"
                  onChange={handleBellMp3Upload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <p className="text-xs text-slate-400 pt-1">
            Atau pilih dari variasi nada lonceng synthesizer akustik bawaan:
          </p>

          <div className="space-y-2.5">
            {[
              { 
                id: 'custom_audio', 
                name: 'File MP3 Bel Kustom Sendiri', 
                desc: settings.customBellFileName ? `File aktif: ${settings.customBellFileName}` : 'File MP3 lonceng madrasah yang Anda unggah', 
                tag: 'MP3 Upload',
                isCustomMp3: true
              },
              { id: 'westminster', name: 'Westminster Chimes', desc: 'Melodi lonceng Big Ben dengan resonansi katedral', tag: 'Populer' },
              { id: 'tubular', name: 'Tubular Bell (Lonceng Tabung)', desc: 'Lonceng tabung tembaga orkestra nada megah', tag: 'Realistis' },
              { id: 'three_tone', name: '3-Nada Ding Dong Dang', desc: 'Harmoni 3 nada modern (E5 - G5 - C6)', tag: 'Modern' },
              { id: 'dingdong', name: '2-Nada Ding Dong', desc: 'Lonceng klasik 2 nada singkat & jelas', tag: 'Klasik' },
              { id: 'mic_chirp', name: 'PA Mic Chime Chirp', desc: 'Nada sambung panggilan pengeras suara', tag: 'PA Chime' },
              { id: 'electric', name: 'Bel Listrik Sekolah', desc: 'Suara gong bel getar mekanik 880Hz', tag: 'Elektrik' },
              { id: 'soft', name: 'Soft Serene Chime', desc: 'Lonceng lembut dengan resonansi panjang', tag: 'Lembut' },
              { id: 'emergency', name: 'Sirine Darurat / Alarm', desc: 'Suara sirine frekuensi tinggi untuk siaga evakuasi', tag: 'Darurat' }
            ].map((chime) => {
              const isDefault = settings.defaultChimeType === chime.id;
              const isPlayingThis = previewChime === chime.id;

              return (
                <div
                  key={chime.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                    isDefault 
                      ? 'bg-emerald-950/70 border-emerald-600/60 ring-1 ring-emerald-500/30' 
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{chime.name}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                        chime.isCustomMp3 
                          ? 'bg-amber-950 text-amber-300 border-amber-700/60' 
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {chime.tag}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{chime.desc}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handlePlayChimeTest(chime.id as ChimeType)}
                      disabled={isPlayingThis || (chime.isCustomMp3 && !settings.customBellAudioUrl)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-700 disabled:opacity-40 text-slate-200 hover:text-white transition-all"
                      title={chime.isCustomMp3 && !settings.customBellAudioUrl ? 'Unggah file MP3 terlebih dahulu' : 'Dengarkan nada ini'}
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (chime.isCustomMp3 && !settings.customBellAudioUrl) {
                          alert('Silakan unggah file MP3 terlebih dahulu pada kotak upload di atas.');
                          return;
                        }
                        onSaveSettings({ ...settings, defaultChimeType: chime.id as ChimeType });
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                        isDefault 
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow' 
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-slate-700'
                      }`}
                    >
                      {isDefault ? 'Default' : 'Pilih'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* TTS & Voice Settings */}
        {(activeSubTab === 'voices' || activeSubTab === 'all') && (
        <div className={`${activeSubTab === 'voices' ? 'lg:col-span-12' : 'lg:col-span-7'} bg-slate-800/80 border border-slate-700/60 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Languages className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Pemilihan Suara Text-to-Speech (TTS) 3 Bahasa</h3>
            </div>
            <button
              onClick={refreshVoicesList}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-300 transition-colors"
              title="Perbarui daftar suara browser"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Deteksi Suara</span>
            </button>
          </div>

          {/* Voice Selectors */}
          <div className="space-y-3.5">
            
            {/* 1. Indonesian Voice */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                  <span>🇮🇩 Suara Bahasa Indonesia (id-ID):</span>
                </label>
                <button
                  onClick={() => handleTestSingleTTS('id')}
                  className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Play className="w-2.5 h-2.5" /> Uji Suara ID
                </button>
              </div>
              <select
                value={settings.preferredVoiceId}
                onChange={(e) => onSaveSettings({ ...settings, preferredVoiceId: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Otomatis (Suara Terbaik Bahasa Indonesia) --</option>
                {idVoices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {isHighQualityVoice(v) ? '✨ ' : ''}{v.name} ({v.lang}) {v.default ? '★ Bawaan' : ''}
                  </option>
                ))}
                {idVoices.length === 0 && (
                  <option value="" disabled>Gunakan sintesis bahasa bawaan sistem</option>
                )}
              </select>
            </div>

            {/* 2. English Voice */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <span>🇬🇧 Suara English (en-US / en-GB):</span>
                </label>
                <button
                  onClick={() => handleTestSingleTTS('en')}
                  className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                >
                  <Play className="w-2.5 h-2.5" /> Uji Suara EN
                </button>
              </div>
              <select
                value={settings.preferredVoiceEn}
                onChange={(e) => onSaveSettings({ ...settings, preferredVoiceEn: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Otomatis (Suara Terbaik English) --</option>
                {enVoices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {isHighQualityVoice(v) ? '✨ ' : ''}{v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Arabic Voice */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                  <span>🇸🇦 Suara Bahasa Arab (ar-SA / ar-EG):</span>
                </label>
                <button
                  onClick={() => handleTestSingleTTS('ar')}
                  className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Play className="w-2.5 h-2.5" /> Uji Suara AR
                </button>
              </div>
              <select
                value={settings.preferredVoiceAr}
                onChange={(e) => onSaveSettings({ ...settings, preferredVoiceAr: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Otomatis (Suara Terbaik Bahasa Arab / Fallback) --</option>
                {arVoices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {isHighQualityVoice(v) ? '✨ ' : ''}{v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Sliders: Speech Rate, Pitch, TTS Volume */}
          <div className="space-y-4 pt-3 border-t border-slate-700/60">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Rate */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Kecepatan Suara (Rate):</span>
                  <span className="font-mono text-emerald-400 font-bold">{settings.ttsRate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.3"
                  step="0.05"
                  value={settings.ttsRate}
                  onChange={(e) => onSaveSettings({ ...settings, ttsRate: parseFloat(e.target.value), voicePersona: 'custom' })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Pitch */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Nada Suara (Pitch):</span>
                  <span className="font-mono text-emerald-400 font-bold">{settings.ttsPitch.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.2"
                  step="0.05"
                  value={settings.ttsPitch}
                  onChange={(e) => onSaveSettings({ ...settings, ttsPitch: parseFloat(e.target.value), voicePersona: 'custom' })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

            </div>

            {/* Volume controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Volume Suara Pengumuman:</span>
                  <span className="font-mono text-emerald-400 font-bold">{Math.round(settings.ttsVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.ttsVolume}
                  onChange={(e) => onSaveSettings({ ...settings, ttsVolume: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Volume Nada Bel (Chime):</span>
                  <span className="font-mono text-amber-400 font-bold">{Math.round(settings.chimeVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.chimeVolume}
                  onChange={(e) => onSaveSettings({ ...settings, chimeVolume: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

          </div>

        </div>
        )}

      </div>
      )}

      {/* Voice Recorder & Custom Audio Tools Studio */}
      {(activeSubTab === 'studio' || activeSubTab === 'all') && (
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-950 text-emerald-400 rounded-xl border border-emerald-700/40">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Studio Rekam Suara & File Audio Mandiri</h3>
              <p className="text-xs text-slate-400">
                Rekam suara langsung melalui mikrofon atau unggah rekaman audio MP3/WAV pengumuman madrasah
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* In-Browser Microphone Recording */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Radio className="w-4 h-4 text-rose-400" />
              <span>1. Perekam Mikrofon Langsung</span>
            </div>
            
            <p className="text-xs text-slate-400">
              Rekam suara ustadz/ustadzah langsung di browser untuk menghasilkan pelafalan Arab/Indonesia yang fasih.
            </p>

            <div className="flex items-center gap-3">
              {!isRecording ? (
                <button
                  id="btn-start-record"
                  onClick={handleStartRecording}
                  className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
                >
                  <Mic className="w-4 h-4" />
                  <span>Mulai Merekam</span>
                </button>
              ) : (
                <button
                  id="btn-stop-record"
                  onClick={handleStopRecording}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-rose-400 font-bold text-xs rounded-xl shadow-md transition-all animate-pulse"
                >
                  <Square className="w-4 h-4 fill-rose-400" />
                  <span>Hentikan Rekaman</span>
                </button>
              )}

              {isRecording && (
                <span className="text-xs text-rose-400 font-semibold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
                  Merekam audio...
                </span>
              )}
            </div>

            {recordedAudioUrl && (
              <div className="mt-3 pt-3 border-t border-slate-800 space-y-2.5">
                <div className="text-xs text-emerald-400 font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    <span>Rekaman Siap Diputar:</span>
                  </span>
                  <button
                    onClick={() => handleSetStudioAudioAsDefaultBell(recordedAudioUrl)}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold rounded-lg shadow transition-all"
                  >
                    ★ Pasang Jadi Bel Utama
                  </button>
                </div>
                <audio controls src={recordedAudioUrl} className="w-full h-10 rounded-xl" />
              </div>
            )}
          </div>

          {/* Custom File Upload */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>2. Unggah File Audio (MP3 / WAV)</span>
            </div>

            <p className="text-xs text-slate-400">
              Pilih file audio dari komputer atau laptop untuk dipratinjau dan diuji di sistem bel sekolah.
            </p>

            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl cursor-pointer bg-slate-950/40 hover:bg-slate-900/80 transition-all">
              <Upload className="w-6 h-6 text-slate-400 mb-1" />
              <span className="text-xs font-medium text-slate-300">Pilih File Suara (Audio MP3/WAV)</span>
              <span className="text-[10px] text-slate-500 mt-0.5">Mendukung file .mp3, .wav, .ogg, .m4a (Maks. 25 MB)</span>
              <input type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a" onChange={handleCustomFileUpload} className="hidden" />
            </label>
          </div>

        </div>
      </div>
      )}

    </div>
  );
};
