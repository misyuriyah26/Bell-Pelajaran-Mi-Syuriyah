import { AudioFileItem, BellCategory } from '../types';
import { FirestoreService } from '../lib/firebase';

const DB_NAME = 'MISyuriyahBellAudioDB_v1';
const STORE_NAME = 'audioLibrary';
const DB_VERSION = 1;
const LOCALSTORAGE_BACKUP_KEY = 'mi_syuriyah_audio_meta_v1';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('fileName', 'fileName', { unique: false });
        store.createIndex('uploadedAt', 'uploadedAt', { unique: false });
        store.createIndex('detectedCategory', 'detectedCategory', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Format raw byte count to readable string (e.g., 2.4 MB)
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Intelligent categorization based on MP3 file name
 */
export function detectCategoryFromFileName(fileName: string): {
  category: BellCategory | 'bel' | 'pengumuman' | 'lagu' | 'doa' | 'lainnya';
  slot: 'bell' | 'id' | 'en' | 'ar';
} {
  const lower = fileName.toLowerCase();

  // Language Detection for Announcement
  if (lower.includes('_ar') || lower.includes('-ar') || lower.includes('arab') || lower.includes('arabic')) {
    return { category: 'pengumuman', slot: 'ar' };
  }
  if (lower.includes('_en') || lower.includes('-en') || lower.includes('english') || lower.includes('inggris')) {
    return { category: 'pengumuman', slot: 'en' };
  }
  if (lower.includes('_id') || lower.includes('-id') || lower.includes('indo') || lower.includes('indonesia')) {
    return { category: 'pengumuman', slot: 'id' };
  }

  // School Schedule Categories
  if (lower.includes('masuk') || lower.includes('awal') || lower.includes('pagi') || lower.includes('mulai')) {
    return { category: 'masuk', slot: 'bell' };
  }
  if (lower.includes('istirahat') || lower.includes('recess') || lower.includes('break') || lower.includes('snack')) {
    return { category: 'istirahat', slot: 'bell' };
  }
  if (lower.includes('dhuha') || lower.includes('duha')) {
    return { category: 'dhuha', slot: 'bell' };
  }
  if (lower.includes('dzuhur') || lower.includes('dhuhur') || lower.includes('zuhur') || lower.includes('sholat')) {
    return { category: 'dzuhur', slot: 'bell' };
  }
  if (lower.includes('pulang') || lower.includes('akhir') || lower.includes('selesai') || lower.includes('home')) {
    return { category: 'pulang', slot: 'bell' };
  }
  if (lower.includes('upacara') || lower.includes('apel') || lower.includes('flag') || lower.includes('indonesia_raya')) {
    return { category: 'upacara', slot: 'bell' };
  }
  if (lower.includes('ganti') || lower.includes('jam_ke') || lower.includes('jamke') || lower.includes('pelajaran')) {
    return { category: 'ganti_jam', slot: 'bell' };
  }
  if (lower.includes('doa') || lower.includes('tadarus') || lower.includes('asmaul') || lower.includes('al_quran')) {
    return { category: 'doa', slot: 'bell' };
  }
  if (lower.includes('lagu') || lower.includes('mars') || lower.includes('hymne') || lower.includes('nasional')) {
    return { category: 'lagu', slot: 'bell' };
  }
  if (lower.includes('bel') || lower.includes('bell') || lower.includes('chime') || lower.includes('lonceng') || lower.includes('ting')) {
    return { category: 'bel', slot: 'bell' };
  }

  return { category: 'lainnya', slot: 'bell' };
}

/**
 * Format duration in seconds to MM:SS
 */
export function formatDurationSeconds(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Extract audio duration asynchronously using Audio element
 */
export function getAudioDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    try {
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        resolve(audio.duration || 0);
      };
      audio.onerror = () => {
        resolve(0);
      };
      // Timeout fallback
      setTimeout(() => resolve(0), 3000);
      audio.src = url;
    } catch {
      resolve(0);
    }
  });
}

/**
 * Load all audio files from IndexedDB with optional Cloud Firestore fallback
 */
export async function getAllAudioFiles(): Promise<AudioFileItem[]> {
  let localResults: AudioFileItem[] = [];

  try {
    const db = await openDB();
    localResults = await new Promise<AudioFileItem[]>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = (request.result || []) as AudioFileItem[];
        results.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        resolve(results);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('IndexedDB read failed, checking localStorage fallback:', err);
    try {
      const raw = localStorage.getItem(LOCALSTORAGE_BACKUP_KEY);
      if (raw) localResults = JSON.parse(raw);
    } catch {
      // ignore
    }
  }

  // If local DB is empty, try fetching from Firebase Cloud Firestore to hydrate
  if (localResults.length === 0) {
    try {
      const cloudAudioFiles = await FirestoreService.getAudioFiles();
      if (cloudAudioFiles && cloudAudioFiles.length > 0) {
        // Cache to local IndexedDB for instantaneous future playback
        await saveMultipleAudioFilesLocalOnly(cloudAudioFiles);
        return cloudAudioFiles;
      }
    } catch (err) {
      console.warn('Could not fetch initial audio files from Firestore:', err);
    }
  }

  return localResults;
}

/**
 * Save to IndexedDB locally only (internal helper)
 */
async function saveMultipleAudioFilesLocalOnly(items: AudioFileItem[]): Promise<void> {
  if (items.length === 0) return;
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      items.forEach((item) => store.put(item));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.warn('Failed to cache audio files locally:', err);
  }
}

/**
 * Save / Insert multiple audio files to IndexedDB AND Cloud Firestore
 */
export async function saveMultipleAudioFiles(items: AudioFileItem[]): Promise<void> {
  if (items.length === 0) return;

  // 1. Save locally to IndexedDB
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      items.forEach((item) => {
        store.put(item);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => {
        console.error('Transaction error saving audio files locally:', transaction.error);
        reject(transaction.error);
      };
    });
  } catch (err) {
    console.error('Failed to save audio files to IndexedDB:', err);
  }

  // 2. Automatically sync / upload to Firebase Cloud Firestore
  try {
    await FirestoreService.saveMultipleAudioFiles(items);
  } catch (cloudErr) {
    console.warn('Notice: Background sync of audio files to Firebase Cloud Firestore:', cloudErr);
  }
}

/**
 * Save single audio file to IndexedDB AND Cloud Firestore
 */
export async function saveAudioFile(item: AudioFileItem): Promise<void> {
  return saveMultipleAudioFiles([item]);
}

/**
 * Delete audio file from IndexedDB AND Cloud Firestore
 */
export async function deleteAudioFile(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to delete audio file from IndexedDB:', err);
  }

  // Also delete from Firebase Cloud Firestore
  try {
    await FirestoreService.deleteAudioFile(id);
  } catch (cloudErr) {
    console.warn('Notice: Failed to delete audio file from Cloud Firestore:', cloudErr);
  }
}

/**
 * Clear all audio files from IndexedDB AND Cloud Firestore
 */
export async function clearAllAudioFiles(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to clear audio files from IndexedDB:', err);
  }

  // Clear from Firebase Cloud Firestore
  try {
    await FirestoreService.clearAllAudioFiles();
  } catch (cloudErr) {
    console.warn('Notice: Failed to clear audio files from Cloud Firestore:', cloudErr);
  }
}

/**
 * Helper to process File list (from folder input or drag-and-drop) into AudioFileItem array
 */
export async function processAudioFilesBatch(
  files: File[], 
  folderNameHint?: string,
  onProgress?: (processed: number, total: number, currentName: string) => void
): Promise<AudioFileItem[]> {
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.wma'];
  const validFiles = files.filter(f => {
    const name = f.name.toLowerCase();
    const isAudioType = f.type.startsWith('audio/') || audioExtensions.some(ext => name.endsWith(ext));
    return isAudioType && f.size > 0;
  });

  const results: AudioFileItem[] = [];

  for (let i = 0; i < validFiles.length; i++) {
    const file = validFiles[i];
    onProgress?.(i + 1, validFiles.length, file.name);

    const relativePath = (file as any).webkitRelativePath || file.name;
    const pathParts = relativePath.split('/');
    const detectedFolderName = pathParts.length > 1 ? pathParts[0] : (folderNameHint || 'Folder Audio');

    const cleanTitle = file.name
      .replace(/\.(mp3|wav|ogg|m4a|aac|flac|wma)$/i, '')
      .replace(/^[\d\s._-]+/, '') // remove leading track numbers like 01_ or 01 -
      .replace(/[_.-]+/g, ' ')
      .trim() || file.name;

    const { category, slot } = detectCategoryFromFileName(file.name);

    // Read to Base64 data URL
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Get duration
    const durationSec = await getAudioDuration(dataUrl);

    const item: AudioFileItem = {
      id: 'audio-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8),
      name: cleanTitle,
      fileName: file.name,
      folderName: detectedFolderName,
      fullRelativePath: relativePath,
      size: file.size,
      sizeFormatted: formatBytes(file.size),
      type: file.type || 'audio/mpeg',
      url: dataUrl,
      duration: durationSec,
      durationFormatted: formatDurationSeconds(durationSec),
      uploadedAt: new Date().toISOString(),
      detectedCategory: category,
      targetSlot: slot
    };

    results.push(item);
  }

  return results;
}
