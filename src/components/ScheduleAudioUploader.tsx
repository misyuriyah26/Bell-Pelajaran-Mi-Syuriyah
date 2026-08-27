import React, { useState } from 'react';
import { 
  Upload, 
  Mic, 
  Square, 
  Play, 
  Trash2, 
  Check, 
  Volume2, 
  Waves, 
  Music, 
  Languages, 
  AlertCircle,
  FileAudio,
  FolderArchive
} from 'lucide-react';
import { CustomAudioUrls, BellSettings, AudioFileItem } from '../types';
import { AudioRecorder } from '../utils/recorder';
import { playAudioUrl } from '../utils/audioEngine';
import { AudioLibraryPickerModal } from './AudioLibraryPickerModal';
import { saveAudioFile, formatBytes, formatDurationSeconds, getAudioDuration } from '../utils/audioLibraryStorage';

interface ScheduleAudioUploaderProps {
  customAudio: CustomAudioUrls | undefined;
  onChangeCustomAudio: (updated: CustomAudioUrls | undefined) => void;
  settings: BellSettings;
}

type AudioSlotKey = 'bellAudioUrl' | 'idAudioUrl' | 'enAudioUrl' | 'arAudioUrl';

const AUDIO_SLOTS: Array<{
  key: AudioSlotKey;
  label: string;
  subLabel: string;
  langTag: string;
  icon: string;
}> = [
  {
    key: 'bellAudioUrl',
    label: 'Audio Nada Lonceng / Bel Kustom',
    subLabel: 'Ganti nada bel synthesizer dengan file MP3/WAV lonceng sekolah pilihan Anda',
    langTag: 'BEL',
    icon: '🔔'
  },
  {
    key: 'idAudioUrl',
    label: 'Rekaman Suara Pengumuman Bahasa Indonesia',
    subLabel: 'Ganti suara robot/TTS Indonesia dengan rekaman suara ustadz/ustadzah asli',
    langTag: '🇮🇩 ID',
    icon: '🎙️'
  },
  {
    key: 'enAudioUrl',
    label: 'Rekaman Suara Pengumuman English',
    subLabel: 'Ganti suara TTS English dengan file rekaman suara asli',
    langTag: '🇬🇧 EN',
    icon: '🎙️'
  },
  {
    key: 'arAudioUrl',
    label: 'Rekaman Suara Pengumuman Bahasa Arab',
    subLabel: 'Ganti suara TTS Arab dengan rekaman fashih ustadz/qari madrasah',
    langTag: '🇸🇦 AR',
    icon: '🎙️'
  }
];

export const ScheduleAudioUploader: React.FC<ScheduleAudioUploaderProps> = ({
  customAudio = {} as CustomAudioUrls,
  onChangeCustomAudio,
  settings
}) => {
  const [activeSlotRecording, setActiveSlotRecording] = useState<AudioSlotKey | null>(null);
  const [recorder] = useState(() => new AudioRecorder());
  const [playingSlot, setPlayingSlot] = useState<AudioSlotKey | null>(null);
  const [previewWithEcho, setPreviewWithEcho] = useState<boolean>(true);
  const [recordDuration, setRecordDuration] = useState<number>(0);
  const [timerRef, setTimerRef] = useState<any>(null);

  // Picker Modal State
  const [pickerTargetSlot, setPickerTargetSlot] = useState<{
    slot: AudioSlotKey;
    title: string;
  } | null>(null);

  const handleFileUpload = (slot: AudioSlotKey, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert('Ukuran file maksimal adalah 25 MB.');
      return;
    }

    const fileName = file.name;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const fileNameKey = slot === 'bellAudioUrl' ? 'bellFileName' 
                        : slot === 'idAudioUrl' ? 'idFileName'
                        : slot === 'enAudioUrl' ? 'enFileName' 
                        : 'arFileName';

      const updated: CustomAudioUrls = {
        ...customAudio,
        [slot]: base64,
        [fileNameKey]: fileName
      };
      onChangeCustomAudio(updated);

      // Register uploaded file to shared library & Firebase Cloud Firestore
      try {
        const durationSec = await getAudioDuration(base64);
        const slotType = slot === 'bellAudioUrl' ? 'bell' : slot === 'idAudioUrl' ? 'id' : slot === 'enAudioUrl' ? 'en' : 'ar';
        const cleanName = fileName.replace(/\.[^/.]+$/, "").replace(/[_.-]+/g, ' ').trim();

        await saveAudioFile({
          id: 'audio-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          name: cleanName,
          fileName: fileName,
          folderName: 'Upload Jadwal',
          fullRelativePath: fileName,
          size: file.size,
          sizeFormatted: formatBytes(file.size),
          type: file.type || 'audio/mpeg',
          url: base64,
          duration: durationSec,
          durationFormatted: formatDurationSeconds(durationSec),
          uploadedAt: new Date().toISOString(),
          targetSlot: slotType
        });
      } catch (err) {
        console.warn('Could not register uploaded audio to shared library:', err);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSelectFromLibrary = (item: AudioFileItem) => {
    if (!pickerTargetSlot) return;
    const slot = pickerTargetSlot.slot;
    const fileNameKey = slot === 'bellAudioUrl' ? 'bellFileName' 
                      : slot === 'idAudioUrl' ? 'idFileName'
                      : slot === 'enAudioUrl' ? 'enFileName' 
                      : 'arFileName';

    const updated: CustomAudioUrls = {
      ...customAudio,
      [slot]: item.url,
      [fileNameKey]: item.fileName
    };
    onChangeCustomAudio(updated);
    setPickerTargetSlot(null);
  };

  const handleStartRecord = async (slot: AudioSlotKey) => {
    const ok = await recorder.start();
    if (ok) {
      setActiveSlotRecording(slot);
      setRecordDuration(0);
      const interval = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);
      setTimerRef(interval);
    } else {
      alert('Gagal mengakses mikrofon browser. Mohon izinkan akses mikrofon pada peramban Anda.');
    }
  };

  const handleStopRecord = async (slot: AudioSlotKey) => {
    if (timerRef) {
      clearInterval(timerRef);
      setTimerRef(null);
    }

    try {
      const base64 = await recorder.stop();
      setActiveSlotRecording(null);
      const updated: CustomAudioUrls = {
        ...customAudio,
        [slot]: base64
      };
      onChangeCustomAudio(updated);
    } catch (err) {
      console.error('Record stop error:', err);
      setActiveSlotRecording(null);
    }
  };

  const handleClearSlot = (slot: AudioSlotKey) => {
    const copy = { ...customAudio };
    delete copy[slot];
    const hasKeys = Object.keys(copy).some(k => !!copy[k as AudioSlotKey]);
    onChangeCustomAudio(hasKeys ? copy : undefined);
  };

  const handlePlayPreview = async (slot: AudioSlotKey) => {
    const url = customAudio[slot];
    if (!url) return;

    setPlayingSlot(slot);
    try {
      const echoToUse = previewWithEcho && settings.echo.enabled ? settings.echo : undefined;
      await playAudioUrl(url, 1.0, echoToUse);
    } finally {
      setPlayingSlot(null);
    }
  };

  const totalCustomAudios = Object.values(customAudio || {}).filter(Boolean).length;

  return (
    <div className="space-y-4 pt-3 border-t border-slate-800">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-950 text-emerald-400 rounded-lg border border-emerald-700/40">
            <Upload className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <span>Upload / Rekam File Audio Kustom</span>
              {totalCustomAudios > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-slate-950">
                  {totalCustomAudios} Audio Aktif
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-400">
              Opsional: Unggah file MP3/WAV atau rekam suara ustadz/ustadzah langsung untuk menggantikan TTS bawaan
            </p>
          </div>
        </div>

        <label className="flex items-center gap-2 text-[11px] text-slate-300 bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-700 cursor-pointer self-start sm:self-auto">
          <input
            type="checkbox"
            checked={previewWithEcho}
            onChange={(e) => setPreviewWithEcho(e.target.checked)}
            className="w-3.5 h-3.5 accent-emerald-500 rounded"
          />
          <span className="flex items-center gap-1 font-medium">
            <Waves className="w-3 h-3 text-amber-400" />
            <span>Echo Akustik Aktif Saat Tes</span>
          </span>
        </label>
      </div>

      {/* Slots List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {AUDIO_SLOTS.map((slot) => {
          const hasAudio = !!customAudio[slot.key];
          const isRecordingThis = activeSlotRecording === slot.key;
          const isPlayingThis = playingSlot === slot.key;

          return (
            <div
              key={slot.key}
              className={`p-3.5 rounded-2xl border transition-all ${
                hasAudio 
                  ? 'bg-emerald-950/40 border-emerald-600/70 shadow-sm' 
                  : 'bg-slate-900/70 border-slate-800'
              }`}
            >
              {/* Title row */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{slot.icon}</span>
                  <div>
                    <span className="text-xs font-bold text-white block leading-tight">
                      {slot.label}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {slot.subLabel}
                    </span>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-emerald-300 border border-slate-700 whitespace-nowrap shrink-0">
                  {slot.langTag}
                </span>
              </div>

              {/* Status / Player controls */}
              {hasAudio ? (
                <div className="mt-2.5 pt-2.5 border-t border-emerald-800/40 space-y-2">
                  {/* File name info if available */}
                  {(() => {
                    const fileName = slot.key === 'bellAudioUrl' ? customAudio.bellFileName
                                  : slot.key === 'idAudioUrl' ? customAudio.idFileName
                                  : slot.key === 'enAudioUrl' ? customAudio.enFileName
                                  : customAudio.arFileName;
                    return fileName ? (
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-300 bg-slate-900/90 px-2 py-1 rounded-lg border border-emerald-700/40 truncate">
                        <FileAudio className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate font-mono">{fileName}</span>
                      </div>
                    ) : null;
                  })()}

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => handlePlayPreview(slot.key)}
                        disabled={isPlayingThis}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow transition-transform active:scale-95 whitespace-nowrap"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>{isPlayingThis ? 'Memutar...' : 'Putar Audio'}</span>
                      </button>
                      <span className="text-[10px] text-emerald-300 font-medium truncate flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>Tersimpan</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Pick from Library */}
                      <button
                        type="button"
                        onClick={() => setPickerTargetSlot({ slot: slot.key, title: slot.label })}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-900/60 text-slate-300 hover:text-emerald-300 border border-slate-700 transition-colors"
                        title="Pilih dari Galeri / Folder MP3"
                      >
                        <FolderArchive className="w-3.5 h-3.5 text-amber-300" />
                      </button>

                      {/* Re-upload */}
                      <label className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer border border-slate-700 transition-colors" title="Ganti file MP3/audio">
                        <Upload className="w-3.5 h-3.5" />
                        <input
                          type="file"
                          accept="audio/*,.mp3,.wav,.ogg,.m4a"
                          onChange={(e) => handleFileUpload(slot.key, e)}
                          className="hidden"
                        />
                      </label>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleClearSlot(slot.key)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors"
                        title="Hapus file audio kustom (kembali ke default)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Upload or Record buttons */
                <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-1.5">
                    {/* Pick from Library Button */}
                    <button
                      type="button"
                      onClick={() => setPickerTargetSlot({ slot: slot.key, title: slot.label })}
                      className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-950/60 hover:border-emerald-500/70 border border-slate-700 text-amber-300 text-xs font-semibold transition-all"
                    >
                      <FolderArchive className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pilih dari Galeri Folder</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* File Upload Button */}
                    <label className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-all">
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Upload File</span>
                      <input
                        type="file"
                        accept="audio/*,.mp3,.wav,.ogg,.m4a"
                        onChange={(e) => handleFileUpload(slot.key, e)}
                        className="hidden"
                      />
                    </label>

                    {/* Mic Record Button */}
                    {!isRecordingThis ? (
                      <button
                        type="button"
                        onClick={() => handleStartRecord(slot.key)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 border border-slate-700 hover:border-rose-700 text-rose-300 text-xs font-semibold transition-all"
                      >
                        <Mic className="w-3.5 h-3.5 text-rose-400" />
                        <span>Rekam Mic</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStopRecord(slot.key)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow transition-all animate-pulse"
                      >
                        <Square className="w-3.5 h-3.5 fill-white" />
                        <span>Stop ({recordDuration}s)</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Audio Library Picker Modal */}
      {pickerTargetSlot && (
        <AudioLibraryPickerModal
          isOpen={!!pickerTargetSlot}
          onClose={() => setPickerTargetSlot(null)}
          onSelectAudio={handleSelectFromLibrary}
          slotTitle={pickerTargetSlot.title}
          settings={settings}
        />
      )}

    </div>
  );
};
