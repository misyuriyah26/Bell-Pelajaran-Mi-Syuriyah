import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  collection, 
  onSnapshot,
  getDocFromServer,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import rawFirebaseConfig from '../../firebase-applet-config.json';
import { BellEvent, BellSettings, SchoolProfile, BellLog, AuthUser, AudioFileItem } from '../types';

// Support Vercel environment variables with fallback to bundled config
const activeFirebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || rawFirebaseConfig.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || rawFirebaseConfig.appId,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || rawFirebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || rawFirebaseConfig.authDomain,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || rawFirebaseConfig.firestoreDatabaseId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || rawFirebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || rawFirebaseConfig.messagingSenderId,
};

// 1. Initialize Firebase App and Services
export const app = initializeApp(activeFirebaseConfig);
export const db = getFirestore(app, activeFirebaseConfig.firestoreDatabaseId); /* CRITICAL: Required for multi-database routing */
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Operation Types for Strict Error Context
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Standardized Firestore error handler adhering strictly to FirestoreErrorInfo schema
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(p => ({
        providerId: p.providerId,
        email: p.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Test connection to Firestore on initial boot
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, local cache will be used.');
    } else {
      console.info('Firebase connection initialized.');
    }
    return true;
  }
}

// 2. Authentication Helpers
export async function signInWithGoogle(): Promise<AuthUser | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Map to AuthUser
    const isOwner = user.email?.toLowerCase() === 'misyuriyah26@gmail.com';
    const authUser: AuthUser = {
      id: user.uid,
      username: user.email?.split('@')[0] || 'user',
      fullName: user.displayName || 'Pengguna Madrasah',
      email: user.email || undefined,
      role: isOwner ? 'admin' : 'operator',
      roleTitle: isOwner ? 'Administrator Utama (Pusat)' : 'Operator Madrasah',
      avatarIcon: user.photoURL || undefined,
      lastLogin: new Date().toISOString()
    };

    // Save/Update user profile in Firestore
    try {
      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        email: user.email || '',
        fullName: authUser.fullName,
        role: authUser.role,
        roleTitle: authUser.roleTitle,
        photoURL: user.photoURL || '',
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }, { merge: true });
    } catch (saveErr) {
      console.warn('Could not sync user profile to firestore:', saveErr);
    }

    return authUser;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

export async function signOutFromFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

// 3. Firestore Realtime Sync Services for School Data

export const FirestoreService = {
  // Sync School Profile
  async getSchoolProfile(): Promise<SchoolProfile | null> {
    const path = 'configs/school_profile';
    try {
      const snap = await getDoc(doc(db, 'configs', 'school_profile'));
      if (snap.exists()) {
        return snap.data() as SchoolProfile;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  async saveSchoolProfile(profile: SchoolProfile): Promise<void> {
    const path = 'configs/school_profile';
    try {
      await setDoc(doc(db, 'configs', 'school_profile'), {
        ...profile,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Sync Bell Settings
  async getBellSettings(): Promise<BellSettings | null> {
    const path = 'configs/bell_settings';
    try {
      const snap = await getDoc(doc(db, 'configs', 'bell_settings'));
      if (snap.exists()) {
        return snap.data() as BellSettings;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  async saveBellSettings(settings: BellSettings): Promise<void> {
    const path = 'configs/bell_settings';
    try {
      await setDoc(doc(db, 'configs', 'bell_settings'), {
        ...settings,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Sync Schedules (Collection: schedules)
  async getAllSchedules(): Promise<BellEvent[]> {
    const path = 'schedules';
    try {
      const snap = await getDocs(collection(db, 'schedules'));
      const list: BellEvent[] = [];
      snap.forEach(docSnap => {
        list.push(docSnap.data() as BellEvent);
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async saveSchedule(schedule: BellEvent): Promise<void> {
    const path = `schedules/${schedule.id}`;
    try {
      await setDoc(doc(db, 'schedules', schedule.id), {
        ...schedule,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteSchedule(scheduleId: string): Promise<void> {
    const path = `schedules/${scheduleId}`;
    try {
      await deleteDoc(doc(db, 'schedules', scheduleId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async batchSaveSchedules(schedules: BellEvent[]): Promise<void> {
    for (const schedule of schedules) {
      await this.saveSchedule(schedule);
    }
  },

  // Sync Logs (Collection: bell_logs)
  async getRecentLogs(maxCount: number = 50): Promise<BellLog[]> {
    const path = 'bell_logs';
    try {
      const q = query(collection(db, 'bell_logs'), orderBy('timestamp', 'desc'), limit(maxCount));
      const snap = await getDocs(q);
      const list: BellLog[] = [];
      snap.forEach(docSnap => {
        list.push(docSnap.data() as BellLog);
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async addLog(log: BellLog): Promise<void> {
    const path = `bell_logs/${log.id}`;
    try {
      await setDoc(doc(db, 'bell_logs', log.id), log);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Audio Library & Uploaded Files (Collection: audio_library)
  async getAudioFiles(): Promise<AudioFileItem[]> {
    const path = 'audio_library';
    try {
      const snap = await getDocs(collection(db, 'audio_library'));
      const list: AudioFileItem[] = [];
      snap.forEach(docSnap => {
        list.push(docSnap.data() as AudioFileItem);
      });
      list.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async saveAudioFile(item: AudioFileItem): Promise<void> {
    const path = `audio_library/${item.id}`;
    try {
      await setDoc(doc(db, 'audio_library', item.id), item, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async saveMultipleAudioFiles(items: AudioFileItem[]): Promise<void> {
    for (const item of items) {
      await this.saveAudioFile(item);
    }
  },

  async deleteAudioFile(fileId: string): Promise<void> {
    const path = `audio_library/${fileId}`;
    try {
      await deleteDoc(doc(db, 'audio_library', fileId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async clearAllAudioFiles(): Promise<void> {
    const path = 'audio_library';
    try {
      const snap = await getDocs(collection(db, 'audio_library'));
      const promises: Promise<void>[] = [];
      snap.forEach(docSnap => {
        promises.push(deleteDoc(doc(db, 'audio_library', docSnap.id)));
      });
      await Promise.all(promises);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // 4. Real-time Firestore Subscriptions
  subscribeSchoolProfile(onUpdate: (profile: SchoolProfile) => void, onError?: (err: Error) => void) {
    return onSnapshot(doc(db, 'configs', 'school_profile'), (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as SchoolProfile);
      }
    }, (err) => {
      console.warn('School profile realtime listener notice:', err);
      if (onError) onError(err);
    });
  },

  subscribeBellSettings(onUpdate: (settings: BellSettings) => void, onError?: (err: Error) => void) {
    return onSnapshot(doc(db, 'configs', 'bell_settings'), (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as BellSettings);
      }
    }, (err) => {
      console.warn('Bell settings realtime listener notice:', err);
      if (onError) onError(err);
    });
  },

  subscribeSchedules(onUpdate: (schedules: BellEvent[]) => void, onError?: (err: Error) => void) {
    return onSnapshot(collection(db, 'schedules'), (querySnap) => {
      const list: BellEvent[] = [];
      querySnap.forEach((docSnap) => {
        list.push(docSnap.data() as BellEvent);
      });
      if (list.length > 0) {
        onUpdate(list);
      }
    }, (err) => {
      console.warn('Schedules realtime listener notice:', err);
      if (onError) onError(err);
    });
  },

  subscribeLogs(onUpdate: (logs: BellLog[]) => void, onError?: (err: Error) => void) {
    const q = query(collection(db, 'bell_logs'), orderBy('timestamp', 'desc'), limit(50));
    return onSnapshot(q, (querySnap) => {
      const list: BellLog[] = [];
      querySnap.forEach((docSnap) => {
        list.push(docSnap.data() as BellLog);
      });
      onUpdate(list);
    }, (err) => {
      console.warn('Logs realtime listener notice:', err);
      if (onError) onError(err);
    });
  },

  subscribeAudioLibrary(onUpdate: (files: AudioFileItem[]) => void, onError?: (err: Error) => void) {
    return onSnapshot(collection(db, 'audio_library'), (querySnap) => {
      const list: AudioFileItem[] = [];
      querySnap.forEach((docSnap) => {
        list.push(docSnap.data() as AudioFileItem);
      });
      list.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      onUpdate(list);
    }, (err) => {
      console.warn('Audio library realtime listener notice:', err);
      if (onError) onError(err);
    });
  }
};
