import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BellEvent, 
  BellSettings, 
  SchoolProfile, 
  BellLog, 
  ActivePlaybackState, 
  DayOfWeek,
  ChimeType,
  BellAnnouncement
} from './types';
import { 
  loadSchedules, 
  saveSchedules, 
  loadSettings, 
  saveSettings, 
  loadSchoolProfile, 
  saveSchoolProfile, 
  loadLogs, 
  saveLogs 
} from './utils/storage';
import { 
  unlockAudioContext, 
  executeFullBellSequence, 
  stopCurrentPlayback,
  playEmergencyChime,
  speakText
} from './utils/audioEngine';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ScheduleView } from './components/ScheduleView';
import { SoundSettingsView } from './components/SoundSettingsView';
import { GeneralSettingsView } from './components/GeneralSettingsView';
import { GuideView } from './components/GuideView';
import { ActiveBellOverlay } from './components/ActiveBellOverlay';
import { ManualAnnounceModal } from './components/ManualAnnounceModal';
import { LoginView } from './components/LoginView';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { formatIndonesianDate, formatTime24 } from './utils/dateUtils';
import { AuthUser } from './types';
import { getStoredUser, saveStoredUser, isScreenLocked, setScreenLock } from './utils/auth';
import { 
  FirestoreService, 
  testFirestoreConnection, 
  signOutFromFirebase,
  auth
} from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  // Authentication & Session State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getStoredUser());
  const [isLocked, setIsLocked] = useState<boolean>(() => isScreenLocked() || !getStoredUser());

  // App States
  const [schedules, setSchedules] = useState<BellEvent[]>(() => loadSchedules());
  const [settings, setSettings] = useState<BellSettings>(() => loadSettings());
  const [profile, setProfile] = useState<SchoolProfile>(() => loadSchoolProfile());
  const [logs, setLogs] = useState<BellLog[]>(() => loadLogs());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'schedule' | 'sounds' | 'settings' | 'guide'>('dashboard');
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');

  // Real-Time Clock State (updates every 1000ms)
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Dynamic Favicon & Tab Title Synchronization across all users
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // 1. Update Tab Favicon
    const targetFavicon = profile.faviconUrl || profile.logoUrl || '/icon-192.png';
    let iconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
    if (!iconLink) {
      iconLink = document.createElement('link');
      iconLink.rel = 'icon';
      document.head.appendChild(iconLink);
    }
    iconLink.href = targetFavicon;

    // Apple touch icon
    let appleIconLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null;
    if (!appleIconLink) {
      appleIconLink = document.createElement('link');
      appleIconLink.rel = 'apple-touch-icon';
      document.head.appendChild(appleIconLink);
    }
    appleIconLink.href = profile.logoUrl || targetFavicon;

    // 2. Update Browser Title
    if (profile.name) {
      document.title = `Bel Otomatis - ${profile.name}`;
    }
  }, [profile.faviconUrl, profile.logoUrl, profile.name]);

  // Playback Active State
  const [playbackState, setPlaybackState] = useState<ActivePlaybackState>({
    isPlaying: false,
    currentStep: 'idle',
    sourceType: 'auto'
  });

  // 1. Automatic Firebase Auth Listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const isOwner = firebaseUser.email?.toLowerCase() === 'misyuriyah26@gmail.com';
        const userObj: AuthUser = {
          id: firebaseUser.uid,
          username: firebaseUser.email?.split('@')[0] || 'user',
          fullName: firebaseUser.displayName || 'Pengguna Madrasah',
          email: firebaseUser.email || undefined,
          role: isOwner ? 'admin' : 'operator',
          roleTitle: isOwner ? 'Administrator Utama (Pusat)' : 'Operator Madrasah',
          avatarIcon: firebaseUser.photoURL || undefined,
          lastLogin: new Date().toISOString()
        };
        setCurrentUser(userObj);
        saveStoredUser(userObj);
        setIsLocked(false);
        setScreenLock(false);
      }
    });

    return () => unsubAuth();
  }, []);

  // 2. Automatic Cloud Firestore Real-Time Synchronization & Hydration
  useEffect(() => {
    let isMounted = true;
    const unsubscribers: (() => void)[] = [];

    async function initializeAutomaticCloudSync() {
      try {
        setCloudSyncStatus('syncing');
        await testFirestoreConnection();

        // 1. Initial One-time Read / Seeding
        const [remoteProfile, remoteSettings, remoteSchedules, remoteLogs] = await Promise.all([
          FirestoreService.getSchoolProfile().catch(() => null),
          FirestoreService.getBellSettings().catch(() => null),
          FirestoreService.getAllSchedules().catch(() => null),
          FirestoreService.getRecentLogs().catch(() => null)
        ]);

        if (!isMounted) return;

        if (remoteProfile) {
          setProfile(remoteProfile);
          saveSchoolProfile(remoteProfile);
        } else {
          FirestoreService.saveSchoolProfile(profile).catch(() => {});
        }

        if (remoteSettings) {
          setSettings(remoteSettings);
          saveSettings(remoteSettings);
        } else {
          FirestoreService.saveBellSettings(settings).catch(() => {});
        }

        if (remoteSchedules && remoteSchedules.length > 0) {
          setSchedules(remoteSchedules);
          saveSchedules(remoteSchedules);
        } else {
          FirestoreService.batchSaveSchedules(schedules).catch(() => {});
        }

        if (remoteLogs && remoteLogs.length > 0) {
          setLogs(remoteLogs);
          saveLogs(remoteLogs);
        }

        // 2. Establish Active Real-Time Listeners
        const unsubProfile = FirestoreService.subscribeSchoolProfile((liveProfile) => {
          if (!isMounted) return;
          setProfile(liveProfile);
          saveSchoolProfile(liveProfile);
          setCloudSyncStatus('synced');
        });
        unsubscribers.push(unsubProfile);

        const unsubSettings = FirestoreService.subscribeBellSettings((liveSettings) => {
          if (!isMounted) return;
          setSettings(liveSettings);
          saveSettings(liveSettings);
          setCloudSyncStatus('synced');
        });
        unsubscribers.push(unsubSettings);

        const unsubSchedules = FirestoreService.subscribeSchedules((liveSchedules) => {
          if (!isMounted) return;
          if (liveSchedules && liveSchedules.length > 0) {
            setSchedules(liveSchedules);
            saveSchedules(liveSchedules);
          }
          setCloudSyncStatus('synced');
        });
        unsubscribers.push(unsubSchedules);

        const unsubLogs = FirestoreService.subscribeLogs((liveLogs) => {
          if (!isMounted) return;
          if (liveLogs && liveLogs.length > 0) {
            setLogs(liveLogs);
            saveLogs(liveLogs);
          }
          setCloudSyncStatus('synced');
        });
        unsubscribers.push(unsubLogs);

        setCloudSyncStatus('synced');
      } catch (err) {
        console.warn('Auto Firebase Sync Notice:', err);
        if (isMounted) {
          setCloudSyncStatus('synced');
        }
      }
    }

    initializeAutomaticCloudSync();

    return () => {
      isMounted = false;
      unsubscribers.forEach((unsub) => unsub());
    };
  }, []);

  // Manual Cloud Sync Trigger
  const handleManualCloudSync = async () => {
    setCloudSyncStatus('syncing');
    try {
      await Promise.all([
        FirestoreService.saveSchoolProfile(profile),
        FirestoreService.saveBellSettings(settings),
        FirestoreService.batchSaveSchedules(schedules)
      ]);
      setCloudSyncStatus('synced');
    } catch (err) {
      console.error('Manual sync error:', err);
      setCloudSyncStatus('offline');
      setTimeout(() => setCloudSyncStatus('synced'), 3000);
    }
  };

  // Track the last triggered minute string e.g. "2026-08-15-07:00" to prevent double-firing within the same minute
  const lastTriggeredMinuteRef = useRef<string>('');

  // Persist State Changes
  const handleSaveSchedules = (newSchedules: BellEvent[]) => {
    setSchedules(newSchedules);
    saveSchedules(newSchedules);
    // Background cloud sync
    FirestoreService.batchSaveSchedules(newSchedules).catch(() => {});
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    const updated = schedules.filter(s => s.id !== scheduleId);
    setSchedules(updated);
    saveSchedules(updated);
    try {
      await FirestoreService.deleteSchedule(scheduleId);
      await FirestoreService.syncAllSchedules(updated);
    } catch (err) {
      console.warn('Schedule deletion cloud sync notice:', err);
    }
  };

  const handleSaveSettings = (newSettings: BellSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    // Background cloud sync
    FirestoreService.saveBellSettings(newSettings).catch(() => {});
  };

  const handleSaveProfile = (newProfile: SchoolProfile) => {
    setProfile(newProfile);
    saveSchoolProfile(newProfile);
    // Background cloud sync
    FirestoreService.saveSchoolProfile(newProfile).catch(() => {});
  };

  const handleSaveLogs = (newLogs: BellLog[]) => {
    setLogs(newLogs);
    saveLogs(newLogs);
  };

  // Add Log Entry
  const addLogEntry = (
    eventName: string, 
    type: 'auto' | 'manual' | 'emergency', 
    announcementText?: string
  ) => {
    const now = new Date();
    const newLog: BellLog = {
      id: 'log-' + Date.now(),
      timestamp: now.toISOString(),
      timeStr: formatTime24(now).full,
      dateStr: formatIndonesianDate(now),
      eventName,
      type,
      status: 'success',
      announcementText
    };
    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    saveLogs(updatedLogs);
    FirestoreService.addLog(newLog).catch(() => {});
  };

  // Unlock Audio Engine on user gesture
  const handleUnlockAudio = async () => {
    const ok = await unlockAudioContext();
    if (ok) {
      setAudioUnlocked(true);
      setSettings(prev => {
        const updated = { ...prev, autoPlayAudioUnlocked: true };
        saveSettings(updated);
        return updated;
      });
    }
  };

  // User Auth Handlers
  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setIsLocked(false);
    setScreenLock(false);
  };

  const handleLogout = () => {
    signOutFromFirebase().catch(() => {});
    saveStoredUser(null);
    setScreenLock(true);
    setCurrentUser(null);
    setIsLocked(true);
  };

  const handleSwitchAccount = () => {
    setScreenLock(true);
    setIsLocked(true);
  };

  const handleLockScreen = () => {
    setScreenLock(true);
    setIsLocked(true);
  };

  // Toggle Mute

  const handleToggleMute = () => {
    handleSaveSettings({
      ...settings,
      isMuted: !settings.isMuted
    });
  };

  // Clear Logs
  const handleClearLogs = () => {
    if (window.confirm('Hapus seluruh riwayat bel hari ini?')) {
      handleSaveLogs([]);
    }
  };

  // Stop current active bell
  const handleStopPlayback = () => {
    stopCurrentPlayback();
    setPlaybackState({
      isPlaying: false,
      currentStep: 'idle',
      sourceType: 'auto'
    });
  };

  // Core Execution of a Bell Event
  const triggerBellEvent = async (event: BellEvent, type: 'auto' | 'manual' | 'preview') => {
    if (settings.isMuted && type === 'auto') return;
    if (settings.holidayMode && type === 'auto') return;

    setPlaybackState({
      isPlaying: true,
      currentStep: 'chime',
      event,
      sourceType: type
    });

    addLogEntry(event.name, type === 'preview' ? 'manual' : type, event.announcements.id);

    try {
      await executeFullBellSequence(
        event.chimeType,
        event.announcements,
        settings,
        {
          playChime: event.playChime,
          playTTS: event.playTTS,
          repeatChime: event.repeatChime || 1,
          customAudio: event.customAudio,
          onStepChange: (step) => {
            if (step === 'finished') {
              setPlaybackState({
                isPlaying: false,
                currentStep: 'idle',
                sourceType: 'auto'
              });
            } else {
              setPlaybackState(prev => ({
                ...prev,
                currentStep: step
              }));
            }
          }
        }
      );
    } catch (err) {
      console.error('Bell execution failed:', err);
    } finally {
      setPlaybackState({
        isPlaying: false,
        currentStep: 'idle',
        sourceType: 'auto'
      });
    }
  };

  // Emergency Siren
  const handleEmergencyBell = async () => {
    if (window.confirm('PERINGATAN: Bunyikan Sirine Siaga / Darurat Madrasah sekarang?')) {
      const emergencyAnnouncements: BellAnnouncement = {
        id: 'Perhatian, ini adalah panggilan darurat madrasah. Seluruh siswa dan guru dimohon tetap tenang dan mengikuti petunjuk evakuasi dengan tertib.',
        en: 'Attention, this is a school emergency alert. All students and teachers please remain calm and follow evacuation procedures.',
        ar: 'انتباه، هذا إنذار طوارئ للمدرسة. يرجى من جميع الطلاب والمعلمين الهدوء واتباع إرشادات الإخلاء بنظام.'
      };

      setPlaybackState({
        isPlaying: true,
        currentStep: 'chime',
        manualTitle: 'SIRINE PERINGATAN DARURAT',
        manualAnnouncements: emergencyAnnouncements,
        sourceType: 'emergency'
      });

      addLogEntry('SIRINE PERINGATAN DARURAT', 'emergency', emergencyAnnouncements.id);

      try {
        await executeFullBellSequence(
          'emergency',
          emergencyAnnouncements,
          settings,
          {
            playChime: true,
            playTTS: true,
            repeatChime: 1,
            onStepChange: (step) => {
              if (step === 'finished') {
                setPlaybackState({
                  isPlaying: false,
                  currentStep: 'idle',
                  sourceType: 'auto'
                });
              } else {
                setPlaybackState(prev => ({ ...prev, currentStep: step }));
              }
            }
          }
        );
      } finally {
        setPlaybackState({
          isPlaying: false,
          currentStep: 'idle',
          sourceType: 'auto'
        });
      }
    }
  };

  // Quick Manual Triggers (Masuk, Istirahat, Dhuha, Dzuhur, Pulang, etc.)
  const handleQuickManualTrigger = (category: 'masuk' | 'istirahat' | 'ganti_jam' | 'dhuha' | 'dzuhur' | 'pulang' | 'emergency') => {
    if (category === 'emergency') {
      handleEmergencyBell();
      return;
    }

    // Find the best representative schedule item for this category
    const found = schedules.find(s => s.category === category && s.enabled) || schedules.find(s => s.category === category);
    
    if (found) {
      triggerBellEvent(found, 'manual');
    } else {
      // Default fallback event
      const fallback: BellEvent = {
        id: 'quick-' + Date.now(),
        time: formatTime24(new Date()).full.slice(0, 5),
        name: `Bel ${category.toUpperCase()} (Manual)`,
        category,
        days: [0, 1, 2, 3, 4, 5, 6],
        enabled: true,
        chimeType: settings.defaultChimeType,
        repeatChime: 1,
        playChime: true,
        playTTS: true,
        announcements: {
          id: `Perhatian seluruh siswa-siswi MI Syuriyah Pebatan, waktu ${category} telah tiba.`,
          en: `Attention all students, it is time for ${category}.`,
          ar: `انتباه لجميع الطلاب، حان الوقت الآن.`
        }
      };
      triggerBellEvent(fallback, 'manual');
    }
  };

  // Broadcast manual custom announcement
  const handleManualBroadcast = (
    title: string, 
    chimeType: ChimeType, 
    announcements: BellAnnouncement, 
    playChime: boolean
  ) => {
    setPlaybackState({
      isPlaying: true,
      currentStep: 'chime',
      manualTitle: title,
      manualAnnouncements: announcements,
      sourceType: 'manual'
    });

    addLogEntry(title, 'manual', announcements.id);

    executeFullBellSequence(
      chimeType,
      announcements,
      settings,
      {
        playChime,
        playTTS: true,
        repeatChime: 1,
        onStepChange: (step) => {
          if (step === 'finished') {
            setPlaybackState({
              isPlaying: false,
              currentStep: 'idle',
              sourceType: 'auto'
            });
          } else {
            setPlaybackState(prev => ({ ...prev, currentStep: step }));
          }
        }
      }
    );
  };

  // Main Timer & Bell Scheduler Loop (1 second interval)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      const currentDay = now.getDay() as DayOfWeek;
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = now.getSeconds();
      const timeStr = `${hours}:${minutes}`;
      const minuteKey = `${now.toISOString().slice(0, 10)}-${timeStr}`;

      // Check if it's the 00th second of the minute and we haven't fired for this minute yet
      if (seconds === 0 && lastTriggeredMinuteRef.current !== minuteKey) {
        lastTriggeredMinuteRef.current = minuteKey;

        // Skip if holiday mode or muted
        if (!settings.holidayMode && !settings.isMuted) {
          // Find matching event for today and this exact time
          const matchingEvent = schedules.find(
            item => item.enabled && item.days.includes(currentDay) && item.time === timeStr
          );

          if (matchingEvent) {
            triggerBellEvent(matchingEvent, 'auto');
          }
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [schedules, settings]);

  // Calculate Next Bell for Today
  const nextBell = useMemo(() => {
    if (settings.holidayMode) return null;

    const currentDay = currentTime.getDay() as DayOfWeek;
    const nowSeconds = currentTime.getHours() * 3600 + currentTime.getMinutes() * 60 + currentTime.getSeconds();

    const todayEvents = schedules
      .filter(s => s.enabled && s.days.includes(currentDay))
      .map(s => {
        const [h, m] = s.time.split(':').map(Number);
        const eventSeconds = h * 3600 + m * 60;
        return {
          event: s,
          diffSeconds: eventSeconds - nowSeconds
        };
      })
      .filter(item => item.diffSeconds > 0)
      .sort((a, b) => a.diffSeconds - b.diffSeconds);

    return todayEvents.length > 0 ? todayEvents[0] : null;
  }, [currentTime, schedules, settings.holidayMode]);

  const themeClass = settings.themePreset === 'clean_light'
    ? 'theme-clean_light bg-slate-100 text-slate-900 selection:bg-emerald-600 selection:text-white'
    : settings.themePreset === 'classic_emerald'
    ? 'theme-classic_emerald bg-[#04140f] text-emerald-50 selection:bg-amber-500 selection:text-slate-950'
    : settings.themePreset === 'deep_navy'
    ? 'theme-deep_navy bg-[#050b14] text-slate-100 selection:bg-sky-500 selection:text-white'
    : 'theme-professional_slate bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white';

  // If user is not logged in or screen is locked, display the Login View
  if (!currentUser || isLocked) {
    return (
      <div id="school-bell-login-screen" className={`min-h-screen ${themeClass} flex flex-col font-sans transition-colors duration-300`}>
        <PwaInstallPrompt />
        <LoginView
          profile={profile}
          currentTime={currentTime}
          onLoginSuccess={handleLoginSuccess}
          onUnlockAudio={handleUnlockAudio}
          audioUnlocked={audioUnlocked}
        />
        
        {/* Background automated bell overlay still functions safely if fired */}
        {settings.showVisualNotification && (
          <ActiveBellOverlay
            playbackState={playbackState}
            onStop={handleStopPlayback}
            logoUrl={profile.logoUrl}
          />
        )}
      </div>
    );
  }

  return (
    <div id="school-bell-app" className={`min-h-screen ${themeClass} flex flex-col font-sans transition-colors duration-300`}>
      
      {/* Header with Branding, User Account & Navigation Tabs */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
        audioUnlocked={audioUnlocked}
        onUnlockAudio={handleUnlockAudio}
        settings={settings}
        onToggleMute={handleToggleMute}
        onOpenManualModal={() => setIsManualModalOpen(true)}
        onEmergencyBell={handleEmergencyBell}
        onThemeChange={(newTheme) => handleSaveSettings({ ...settings, themePreset: newTheme })}
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchAccount={handleSwitchAccount}
        onLockScreen={handleLockScreen}
        cloudSyncStatus={cloudSyncStatus}
        onManualCloudSync={handleManualCloudSync}
      />

      {/* PWA Install Banner */}
      <PwaInstallPrompt />

      {/* Main Content Area */}
      <main id="main-content-container" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {activeTab === 'dashboard' && (
          <DashboardView
            currentTime={currentTime}
            schedules={schedules}
            logs={logs}
            settings={settings}
            profile={profile}
            audioUnlocked={audioUnlocked}
            onUnlockAudio={handleUnlockAudio}
            onTriggerBell={(event, type) => triggerBellEvent(event, type)}
            onQuickManualTrigger={handleQuickManualTrigger}
            onClearLogs={handleClearLogs}
            nextBell={nextBell}
            onEmergencyBell={handleEmergencyBell}
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleView
            schedules={schedules}
            onSaveSchedules={handleSaveSchedules}
            onDeleteSchedule={handleDeleteSchedule}
            onTriggerBell={(event, type) => triggerBellEvent(event, type)}
            settings={settings}
          />
        )}

        {activeTab === 'sounds' && (
          <SoundSettingsView
            settings={settings}
            onSaveSettings={handleSaveSettings}
            schedules={schedules}
            onSaveSchedules={handleSaveSchedules}
          />
        )}

        {activeTab === 'settings' && (
          <GeneralSettingsView
            profile={profile}
            onSaveProfile={handleSaveProfile}
            settings={settings}
            onSaveSettings={handleSaveSettings}
            schedules={schedules}
            onSaveSchedules={handleSaveSchedules}
            logs={logs}
            onSaveLogs={handleSaveLogs}
          />
        )}

        {activeTab === 'guide' && (
          <GuideView profile={profile} />
        )}

      </main>

      {/* Footer */}
      <footer id="app-footer" className="bg-slate-900/90 border-t border-slate-800 text-slate-400 text-xs py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-emerald-400">{profile.name}</span>
            <span>•</span>
            <span>{profile.address.split(',')[0]}</span>
          </div>
          <div className="text-slate-400">
            Aplikasi Bel Otomatis 3 Bahasa (ID • EN • AR) • TP {profile.academicYear}
          </div>
        </div>
      </footer>

      {/* Visual Ringing Bell Active Notification Overlay */}
      {settings.showVisualNotification && (
        <ActiveBellOverlay
          playbackState={playbackState}
          onStop={handleStopPlayback}
          logoUrl={profile.logoUrl}
        />
      )}

      {/* Manual Announcement Broadcast Modal */}
      <ManualAnnounceModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onBroadcast={handleManualBroadcast}
        settings={settings}
      />

    </div>
  );
}
