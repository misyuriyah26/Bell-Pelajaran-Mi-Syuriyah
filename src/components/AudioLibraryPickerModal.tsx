import React, { useState, useEffect, useMemo } from 'react';
import { 
  FolderArchive, 
  Search, 
  Play, 
  Square, 
  Check, 
  X, 
  Music, 
  FileAudio,
  FolderUp,
  RefreshCw
} from 'lucide-react';
import { AudioFileItem, BellSettings } from '../types';
import { getAllAudioFiles } from '../utils/audioLibraryStorage';
import { playAudioUrl, stopCurrentPlayback } from '../utils/audioEngine';

interface AudioLibraryPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAudio: (item: AudioFileItem) => void;
  slotTitle: string; // e.g. "Suara Bel Utama", "Pengumuman Bahasa Indonesia"
  settings: BellSettings;
}

export const AudioLibraryPickerModal: React.FC<AudioLibraryPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectAudio,
  slotTitle,
  settings
}) => {
  const [audioItems, setAudioItems] = useState<AudioFileItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadFiles();
    } else {
      stopCurrentPlayback();
      setPlayingId(null);
    }
  }, [isOpen]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const items = await getAllAudioFiles();
      setAudioItems(items);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePlay = async (item: AudioFileItem, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const filteredItems = useMemo(() => {
    return audioItems.filter(item => {
      return searchQuery === '' || 
        item.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.folderName && item.folderName.toLowerCase().includes(searchQuery.toLowerCase()));
    });
  }, [audioItems, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-emerald-600/60 rounded-3xl p-5 sm:p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <FolderArchive className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Pilih dari Galeri / Folder MP3
              </h3>
              <p className="text-xs text-emerald-400">
                Target: <span className="text-amber-300 font-semibold">{slotTitle}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari file MP3 dalam galeri..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Memuat berkas audio...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <FileAudio className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-400">
                {searchQuery 
                  ? 'Tidak ada file MP3 yang cocok dengan kata kunci.' 
                  : 'Belum ada file di Galeri Folder MP3.'}
              </p>
              <p className="text-[11px] text-slate-500">
                Anda dapat mengunggah folder MP3 pada tab "Pengaturan Suara" &gt; "Galeri &amp; Folder MP3".
              </p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isPlayingThis = playingId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    stopCurrentPlayback();
                    onSelectAudio(item);
                    onClose();
                  }}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/60 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/70 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => handleTogglePlay(item, e)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow transition-transform active:scale-95 ${
                        isPlayingThis
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-slate-800 group-hover:bg-emerald-600 text-slate-300 group-hover:text-white'
                      }`}
                      title={isPlayingThis ? 'Stop' : 'Putar pratinjau'}
                    >
                      {isPlayingThis ? <Square className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                    </button>

                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white group-hover:text-amber-300 font-mono truncate">
                        {item.fileName}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        {item.folderName && (
                          <span className="text-amber-400 font-medium">📁 {item.folderName}</span>
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

                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 opacity-90 group-hover:opacity-100 shadow transition-all"
                  >
                    Pilih File
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
          <span>{filteredItems.length} file tersedia di galeri</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
