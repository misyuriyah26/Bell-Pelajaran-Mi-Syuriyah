import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  FolderUp, 
  Upload, 
  Music, 
  Play, 
  Square, 
  Trash2, 
  Check, 
  Sparkles, 
  Search, 
  Filter, 
  Volume2, 
  Calendar, 
  Tag, 
  Info, 
  RefreshCw, 
  FolderArchive,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileAudio,
  Sliders,
  ChevronDown
} from 'lucide-react';
import { AudioFileItem, BellEvent, BellSettings, BellCategory } from '../types';
import { 
  getAllAudioFiles, 
  saveMultipleAudioFiles, 
  deleteAudioFile, 
  clearAllAudioFiles, 
  processAudioFilesBatch,
  formatBytes,
  detectCategoryFromFileName
} from '../utils/audioLibraryStorage';
import { playAudioUrl, stopCurrentPlayback } from '../utils/audioEngine';

interface AudioFolderLibraryProps {
  settings: BellSettings;
  onSaveSettings: (settings: BellSettings) => void;
  schedules: BellEvent[];
  onSaveSchedules: (schedules: BellEvent[]) => void;
}

export const AudioFolderLibrary: React.FC<AudioFolderLibraryProps> = ({
  settings,
  onSaveSettings,
  schedules,
  onSaveSchedules
}) => {
  const [audioItems, setAudioItems] = useState<AudioFileItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  // Upload Processing Progress State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressInfo, setProgressInfo] = useState<{ current: number; total: number; fileName: string }>({
    current: 0,
    total: 0,
    fileName: ''
  });

  // Audio Playback State
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Auto-Match Suggestion Modal State
  const [showAutoMatchModal, setShowAutoMatchModal] = useState<boolean>(false);
  const [matchedMappings, setMatchedMappings] = useState<Array<{
    audioItem: AudioFileItem;
    targetSchedule: BellEvent;
    slot: 'bell' | 'id' | 'en' | 'ar';
    selected: boolean;
  }>>([]);

  // Hidden file input refs
  const folderInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);

  // Load files on mount
  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    setLoading(true);
    try {
      const items = await getAllAudioFiles();
      setAudioItems(items);
    } catch (err) {
      console.error('Failed to load audio library:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Folder Upload Input
  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await processFilesList(Array.from(files));
    e.target.value = '';
  };

  // Handle Multi-file Select
  const handleMultiFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await processFilesList(Array.from(files));
    e.target.value = '';
  };

  // Process Files List
  const processFilesList = async (files: File[]) => {
    setIsProcessing(true);
    setProgressInfo({ current: 0, total: files.length, fileName: 'Menyiapkan...' });

    try {
      const newItems = await processAudioFilesBatch(files, undefined, (curr, total, name) => {
        setProgressInfo({ current: curr, total, fileName: name });
      });

      if (newItems.length > 0) {
        await saveMultipleAudioFiles(newItems);
        const updated = await getAllAudioFiles();
        setAudioItems(updated);

        // Analyze auto-match with schedules
        generateAutoMatches(newItems);
      } else {
        alert('Tidak ditemukan file audio valid (.mp3, .wav, .ogg, .m4a) dalam folder yang dipilih.');
      }
    } catch (err) {
      console.error('Error processing audio folder:', err);
      alert('Terjadi kesalahan saat memproses folder audio.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Drag & Drop Handlers with folder recursion support
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    const extractedFiles: File[] = [];

    if (items && items.length > 0) {
      const queue: any[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const entry = (item as any).webkitGetAsEntry ? (item as any).webkitGetAsEntry() : null;
          if (entry) {
            queue.push(entry);
          } else {
            const file = item.getAsFile();
            if (file) extractedFiles.push(file);
          }
        }
      }

      while (queue.length > 0) {
        const entry = queue.shift();
        if (entry.isFile) {
          await new Promise<void>((resolve) => {
            entry.file((f: File) => {
              extractedFiles.push(f);
              resolve();
            }, () => resolve());
          });
        } else if (entry.isDirectory) {
          const reader = entry.createReader();
          await new Promise<void>((resolve) => {
            reader.readEntries((entries: any[]) => {
              for (const child of entries) {
                queue.push(child);
              }
              resolve();
            }, () => resolve());
          });
        }
      }
    } else if (e.dataTransfer.files) {
      extractedFiles.push(...(Array.from(e.dataTransfer.files) as File[]));
    }

    if (extractedFiles.length > 0) {
      await processFilesList(extractedFiles);
    }
  };

  // Playback Preview
  const handleTogglePlay = async (item: AudioFileItem) => {
    if (playingId === item.id) {
      stopCurrentPlayback();
      setPlayingId(null);
      return;
    }

    stopCurrentPlayback();
    setPlayingId(item.id);

    try {
      const vol = settings.chimeVolume * settings.masterVolume;
      await playAudioUrl(item.url, vol, settings.echo);
    } finally {
      setPlayingId(null);
    }
  };

  // Delete Single File
  const handleDeleteItem = async (id: string, name: string) => {
    if (window.confirm(`Hapus audio "${name}" dari perpustakaan?`)) {
      if (playingId === id) {
        stopCurrentPlayback();
        setPlayingId(null);
      }
      await deleteAudioFile(id);
      await loadLibrary();
    }
  };

  // Clear All
  const handleClearAll = async () => {
    if (window.confirm('PERINGATAN: Hapus SELURUH file MP3 dari Galeri Folder Audio Madrasah?')) {
      stopCurrentPlayback();
      setPlayingId(null);
      await clearAllAudioFiles();
      setAudioItems([]);
    }
  };

  // Set as Global Default Bell
  const handleSetAsDefaultBell = (item: AudioFileItem) => {
    onSaveSettings({
      ...settings,
      customBellAudioUrl: item.url,
      customBellFileName: item.fileName,
      defaultChimeType: 'custom_audio'
    });
    alert(`File "${item.fileName}" berhasil dijadikan Suara Bel Default Utama Madrasah!`);
  };

  // Assign to a Specific Schedule
  const handleAssignToSchedule = (item: AudioFileItem, scheduleId: string, slot: 'bell' | 'id' | 'en' | 'ar') => {
    const updated = schedules.map(s => {
      if (s.id === scheduleId) {
        const existingAudio = s.customAudio || {};
        const newAudio = {
          ...existingAudio,
          ...(slot === 'bell' ? { bellAudioUrl: item.url, bellFileName: item.fileName } : {}),
          ...(slot === 'id' ? { idAudioUrl: item.url, idFileName: item.fileName } : {}),
          ...(slot === 'en' ? { enAudioUrl: item.url, enFileName: item.fileName } : {}),
          ...(slot === 'ar' ? { arAudioUrl: item.url, arFileName: item.fileName } : {})
        };
        return {
          ...s,
          customAudio: newAudio,
          chimeType: slot === 'bell' ? ('custom_audio' as const) : s.chimeType
        };
      }
      return s;
    });

    onSaveSchedules(updated);
    const targetScheduleName = schedules.find(s => s.id === scheduleId)?.name || 'Jadwal';
    alert(`Audio "${item.fileName}" berhasil dipasangkan ke jadwal "${targetScheduleName}"!`);
  };

  // Generate Smart Auto-Matches between uploaded items and existing schedules
  const generateAutoMatches = (itemsToMatch: AudioFileItem[]) => {
    const matches: Array<{
      audioItem: AudioFileItem;
      targetSchedule: BellEvent;
      slot: 'bell' | 'id' | 'en' | 'ar';
      selected: boolean;
    }> = [];

    itemsToMatch.forEach(item => {
      const fileNameLower = item.fileName.toLowerCase();
      const { category, slot } = detectCategoryFromFileName(item.fileName);

      // Find matching schedule by category or name similarity
      const matchingSchedule = schedules.find(sch => {
        const schNameLower = sch.name.toLowerCase();
        
        // Exact category match
        if (category !== 'bel' && category !== 'lainnya' && category !== 'doa' && category !== 'lagu' && category !== 'pengumuman') {
          if (sch.category === category) return true;
        }

        // Substring checks
        if (fileNameLower.includes('masuk') && schNameLower.includes('masuk')) return true;
        if (fileNameLower.includes('istirahat') && (schNameLower.includes('istirahat') || sch.category === 'istirahat')) return true;
        if (fileNameLower.includes('dhuha') && (schNameLower.includes('dhuha') || sch.category === 'dhuha')) return true;
        if (fileNameLower.includes('dzuhur') && (schNameLower.includes('dzuhur') || sch.category === 'dzuhur')) return true;
        if (fileNameLower.includes('pulang') && (schNameLower.includes('pulang') || sch.category === 'pulang')) return true;
        if (fileNameLower.includes('upacara') && (schNameLower.includes('upacara') || sch.category === 'upacara')) return true;

        return false;
      });

      if (matchingSchedule) {
        matches.push({
          audioItem: item,
          targetSchedule: matchingSchedule,
          slot,
          selected: true
        });
      }
    });

    if (matches.length > 0) {
      setMatchedMappings(matches);
      setShowAutoMatchModal(true);
    }
  };

  // Apply Auto Matches
  const handleApplyAutoMatches = () => {
    let updatedSchedules = [...schedules];

    matchedMappings.filter(m => m.selected).forEach(m => {
      updatedSchedules = updatedSchedules.map(sch => {
        if (sch.id === m.targetSchedule.id) {
          const existingAudio = sch.customAudio || {};
          const newAudio = {
            ...existingAudio,
            ...(m.slot === 'bell' ? { bellAudioUrl: m.audioItem.url, bellFileName: m.audioItem.fileName } : {}),
            ...(m.slot === 'id' ? { idAudioUrl: m.audioItem.url, idFileName: m.audioItem.fileName } : {}),
            ...(m.slot === 'en' ? { enAudioUrl: m.audioItem.url, enFileName: m.audioItem.fileName } : {}),
            ...(m.slot === 'ar' ? { arAudioUrl: m.audioItem.url, arFileName: m.audioItem.fileName } : {})
          };
          return {
            ...sch,
            customAudio: newAudio,
            chimeType: m.slot === 'bell' ? ('custom_audio' as const) : sch.chimeType
          };
        }
        return sch;
      });
    });

    onSaveSchedules(updatedSchedules);
    setShowAutoMatchModal(false);
    alert(`Berhasil menerapkan ${matchedMappings.filter(m => m.selected).length} file MP3 ke jadwal bel madrasah!`);
  };

  // Filtered & Searched List
  const filteredItems = useMemo(() => {
    return audioItems.filter(item => {
      const matchesSearch = searchQuery === '' || 
        item.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.folderName && item.folderName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFilter = selectedFilter === 'all' || 
        item.detectedCategory === selectedFilter ||
        (selectedFilter === 'folder' && item.folderName);

      return matchesSearch && matchesFilter;
    });
  }, [audioItems, searchQuery, selectedFilter]);

  // Statistics
  const totalSize = useMemo(() => {
    return audioItems.reduce((acc, curr) => acc + curr.size, 0);
  }, [audioItems]);

  const uniqueFolders = useMemo(() => {
    const folders = new Set<string>();
    audioItems.forEach(i => {
      if (i.folderName) folders.add(i.folderName);
    });
    return Array.from(folders);
  }, [audioItems]);

  return (
    <div id="audio-folder-library" className="space-y-6">
      
      {/* Hidden File Inputs */}
      {/* Folder input with webkitdirectory */}
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFolderSelect}
        // @ts-ignore
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
      />
      {/* Multi-file audio input */}
      <input
        type="file"
        ref={multiFileInputRef}
        onChange={handleMultiFileSelect}
        accept="audio/*,.mp3,.wav,.ogg,.m4a"
        multiple
        className="hidden"
      />

      {/* HEADER & HERO SECTION */}
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-800/40 rounded-3xl p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-inner">
              <FolderArchive className="w-8 h-8 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Galeri & Folder Audio MP3 Madrasah
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Folder Batch Upload
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                Upload 1 folder berisi seluruh rekaman MP3 bel sekolah sekaligus. File tersimpan aman di peramban dan dapat dipasangkan ke jadwal secara otomatis atau manual.
              </p>
            </div>
          </div>

          {/* Quick Action Upload Buttons */}
          <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap sm:flex-nowrap">
            <button
              onClick={() => folderInputRef.current?.click()}
              disabled={isProcessing}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 transition-transform active:scale-95 disabled:opacity-50"
            >
              <FolderUp className="w-4 h-4 text-amber-300" />
              <span>Upload 1 Folder Penuh</span>
            </button>

            <button
              onClick={() => multiFileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold shadow transition-all disabled:opacity-50"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Pilih Banyak File MP3</span>
            </button>
          </div>
        </div>

        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-emerald-900/40">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3">
            <span className="text-[10px] text-slate-400 font-semibold block">Total File MP3</span>
            <span className="text-lg font-black text-white font-mono">{audioItems.length} File</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3">
            <span className="text-[10px] text-slate-400 font-semibold block">Ukuran Total</span>
            <span className="text-lg font-black text-emerald-400 font-mono">{formatBytes(totalSize)}</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3">
            <span className="text-[10px] text-slate-400 font-semibold block">Folder Terdeteksi</span>
            <span className="text-lg font-black text-amber-300 font-mono">{uniqueFolders.length} Folder</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3">
            <span className="text-[10px] text-slate-400 font-semibold block">Bel Utama Aktif</span>
            <span className="text-xs font-bold text-slate-200 truncate block mt-1" title={settings.customBellFileName || 'Default Westminster'}>
              {settings.customBellFileName || 'Westminster Chime'}
            </span>
          </div>
        </div>
      </div>

      {/* DRAG & DROP ZONE */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-6 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-amber-400 bg-amber-950/30 scale-[1.01]'
            : 'border-slate-700/80 bg-slate-900/40 hover:border-emerald-500/80 hover:bg-slate-900/80'
        }`}
        onClick={() => folderInputRef.current?.click()}
      >
        <div className="max-w-md mx-auto space-y-2 pointer-events-none">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 mx-auto flex items-center justify-center text-emerald-400 shadow-inner">
            <FolderUp className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">
            Tarik & Lepas (Drag & Drop) Folder Audio MP3 ke Sini
          </h3>
          <p className="text-xs text-slate-400">
            Atau klik area ini untuk memilih folder dari komputer / laptop Anda. Mendukung format <span className="text-amber-300 font-mono">.mp3</span>, <span className="text-amber-300 font-mono">.wav</span>, <span className="text-amber-300 font-mono">.ogg</span>, <span className="text-amber-300 font-mono">.m4a</span>.
          </p>
        </div>
      </div>

      {/* PROCESSING PROGRESS OVERLAY */}
      {isProcessing && (
        <div className="bg-emerald-950/80 border border-emerald-500/80 rounded-2xl p-4 shadow-xl animate-pulse space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
              <span>Mengimpor Folder Audio... ({progressInfo.current} / {progressInfo.total})</span>
            </span>
            <span className="text-amber-300 font-mono">{Math.round((progressInfo.current / (progressInfo.total || 1)) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-emerald-700/50">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-amber-400 h-full transition-all duration-200"
              style={{ width: `${(progressInfo.current / (progressInfo.total || 1)) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-emerald-300 truncate font-mono">
            File: {progressInfo.fileName}
          </p>
        </div>
      )}

      {/* TOOLBAR: SEARCH, FILTERS & SMART ACTIONS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama file MP3 / folder..."
            className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Category Pills & Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {/* Smart Match Button */}
          {audioItems.length > 0 && (
            <button
              onClick={() => generateAutoMatches(audioItems)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold whitespace-nowrap transition-all"
              title="Cocokkan nama file di folder secara cerdas dengan jadwal bel harian"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Cocokkan ke Jadwal</span>
            </button>
          )}

          {/* Clear Library */}
          {audioItems.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-700/50 text-xs font-medium whitespace-nowrap transition-all"
              title="Hapus seluruh koleksi library"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan</span>
            </button>
          )}
        </div>
      </div>

      {/* AUDIO ITEMS LIST / GRID */}
      {loading ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Memuat berkas MP3 dari penyimpanan...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-3">
          <div className="w-14 h-14 rounded-3xl bg-slate-800/80 mx-auto flex items-center justify-center text-slate-500">
            <FileAudio className="w-7 h-7" />
          </div>
          <h4 className="text-sm font-bold text-slate-300">
            {searchQuery ? 'Tidak ada file MP3 yang sesuai dengan pencarian' : 'Belum ada file MP3 yang diunggah'}
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Klik tombol "Upload 1 Folder Penuh" di atas untuk memasukkan seluruh koleksi MP3 lonceng madrasah Anda sekaligus.
          </p>
          <button
            onClick={() => folderInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow transition-all mt-2"
          >
            <FolderUp className="w-4 h-4 text-amber-300" />
            <span>Pilih Folder Audio Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredItems.map((item) => {
            const isPlayingThis = playingId === item.id;
            const isGlobalDefault = settings.customBellFileName === item.fileName;

            return (
              <div
                key={item.id}
                className={`bg-slate-900/90 border rounded-2xl p-4 transition-all hover:border-slate-600 shadow-md flex flex-col justify-between gap-3 ${
                  isGlobalDefault 
                    ? 'border-amber-500/80 bg-gradient-to-r from-amber-950/20 to-slate-900 ring-1 ring-amber-500/30' 
                    : 'border-slate-800'
                }`}
              >
                {/* File Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={() => handleTogglePlay(item)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow ${
                        isPlayingThis
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                      title={isPlayingThis ? 'Hentikan' : 'Putar audio'}
                    >
                      {isPlayingThis ? <Square className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate font-mono" title={item.fileName}>
                          {item.fileName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        {item.folderName && (
                          <span className="text-amber-400 font-medium truncate">📁 {item.folderName}</span>
                        )}
                        <span>•</span>
                        <span>{item.sizeFormatted}</span>
                        {item.durationFormatted && (
                          <>
                            <span>•</span>
                            <span className="font-mono">{item.durationFormatted}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status / Category Badge */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {isGlobalDefault && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-amber-500 text-slate-950 shadow-sm">
                        ★ BEL UTAMA
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-slate-800 text-emerald-300 border border-slate-700">
                      {item.detectedCategory?.toUpperCase() || 'AUDIO'}
                    </span>
                  </div>
                </div>

                {/* File Action Controls */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                  
                  {/* Assign to Schedule Dropdown */}
                  <div className="relative flex-1 max-w-[200px]">
                    <select
                      onChange={(e) => {
                        const scheduleId = e.target.value;
                        if (scheduleId) {
                          handleAssignToSchedule(item, scheduleId, item.targetSlot || 'bell');
                          e.target.value = '';
                        }
                      }}
                      defaultValue=""
                      className="w-full bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-emerald-500 truncate cursor-pointer transition-colors"
                    >
                      <option value="" disabled>Pasang ke Jadwal...</option>
                      {schedules.map(sch => (
                        <option key={sch.id} value={sch.id}>
                          {sch.time} - {sch.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Secondary buttons */}
                  <div className="flex items-center gap-1.5">
                    {/* Make global default */}
                    {!isGlobalDefault && (
                      <button
                        onClick={() => handleSetAsDefaultBell(item)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 text-[10px] font-bold border border-slate-700 transition-all"
                        title="Jadikan nada bel default seluruh madrasah"
                      >
                        Set Default
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteItem(item.id, item.fileName)}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors"
                      title="Hapus file ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AUTO-MATCH MODAL (CONFIRMATION TO MAP TO SCHEDULES) */}
      {showAutoMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-emerald-600/60 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Pencocokan Cerdas File Folder ke Jadwal
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ditemukan {matchedMappings.length} kecocokan otomatis antara file MP3 dan jadwal harian
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAutoMatchModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {matchedMappings.map((m, idx) => (
                <label
                  key={idx}
                  className={`flex items-center justify-between gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                    m.selected
                      ? 'bg-emerald-950/40 border-emerald-600/70 text-white'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={m.selected}
                      onChange={(e) => {
                        const updated = [...matchedMappings];
                        updated[idx].selected = e.target.checked;
                        setMatchedMappings(updated);
                      }}
                      className="w-4 h-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-900"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate font-mono">
                          🎵 {m.audioItem.fileName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium mt-0.5">
                        <span>➔</span>
                        <span>Jadwal:</span>
                        <span className="font-bold text-amber-300">
                          [{m.targetSchedule.time}] {m.targetSchedule.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-slate-800 text-slate-300 uppercase shrink-0">
                    Slot {m.slot}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAutoMatchModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApplyAutoMatches}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/60"
              >
                <Check className="w-4 h-4" />
                <span>Terapkan ke Jadwal ({matchedMappings.filter(m => m.selected).length})</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
