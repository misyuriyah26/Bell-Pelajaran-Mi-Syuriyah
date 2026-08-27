import { ChimeType, BellAnnouncement, CustomAudioUrls, BellSettings, EchoSettings, VoicePersona } from '../types';

let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export async function unlockAudioContext(): Promise<boolean> {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    // Play a tiny silent tone to unlock browser audio autoplay policy
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(0);
    osc.stop(ctx.currentTime + 0.05);
    return true;
  } catch (err) {
    console.warn('Could not unlock audio context:', err);
    return false;
  }
}

/**
 * Creates an audio FX bus with Delay / Reverb Echo, LowPass air dampening, and Master Gain
 */
export function createFxBus(ctx: AudioContext, echo?: EchoSettings, overallVolume: number = 1.0) {
  const inputNode = ctx.createGain();
  const masterGain = ctx.createGain();
  masterGain.gain.value = Math.max(0, Math.min(1, overallVolume));
  masterGain.connect(ctx.destination);

  // If echo is disabled or not configured, pass straight to master
  if (!echo || !echo.enabled || echo.preset === 'studio' || echo.wetLevel <= 0) {
    inputNode.connect(masterGain);
    return { inputNode, masterGain };
  }

  // Dry path
  const dryGain = ctx.createGain();
  dryGain.gain.value = 1.0;
  inputNode.connect(dryGain);
  dryGain.connect(masterGain);

  // Wet delay path (Echo Effect)
  const delayNode = ctx.createDelay(2.0);
  delayNode.delayTime.value = Math.max(0.04, Math.min(1.2, echo.delayTime));

  const filterNode = ctx.createBiquadFilter();
  filterNode.type = 'lowpass';
  filterNode.frequency.value = Math.max(400, Math.min(10000, echo.filterFreq || 2600));

  const feedbackGain = ctx.createGain();
  feedbackGain.gain.value = Math.max(0, Math.min(0.78, echo.feedback));

  const wetGain = ctx.createGain();
  wetGain.gain.value = Math.max(0, Math.min(0.85, echo.wetLevel));

  // Feedback loop: input -> delay -> filter -> feedback -> delay
  inputNode.connect(delayNode);
  delayNode.connect(filterNode);
  filterNode.connect(feedbackGain);
  feedbackGain.connect(delayNode);

  // Wet output to master
  filterNode.connect(wetGain);
  wetGain.connect(masterGain);

  return { inputNode, masterGain };
}

/**
 * Creates a rich bell note with strike hammer transient, metallic harmonics & echo
 */
function playBellNote(
  ctx: AudioContext, 
  freq: number, 
  startTime: number, 
  duration: number, 
  volume: number,
  echoSettings?: EchoSettings,
  strikeSharpness: number = 1.0
) {
  const fx = createFxBus(ctx, echoSettings, volume);

  const noteEnvelope = ctx.createGain();
  noteEnvelope.gain.setValueAtTime(0, startTime);
  noteEnvelope.gain.linearRampToValueAtTime(1.0, startTime + 0.008);
  noteEnvelope.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  noteEnvelope.connect(fx.inputNode);

  // 1. Initial metallic hammer strike impulse (brass strike transient)
  const strikeOsc = ctx.createOscillator();
  const strikeGain = ctx.createGain();
  strikeOsc.type = 'triangle';
  strikeOsc.frequency.setValueAtTime(freq * 3.8 * strikeSharpness, startTime);
  strikeOsc.frequency.exponentialRampToValueAtTime(freq * 0.8, startTime + 0.04);
  strikeGain.gain.setValueAtTime(0.35 * strikeSharpness, startTime);
  strikeGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.045);
  strikeOsc.connect(strikeGain);
  strikeGain.connect(noteEnvelope);
  strikeOsc.start(startTime);
  strikeOsc.stop(startTime + 0.05);

  // 2. Fundamental + physical partial harmonics (authentic school bell acoustics)
  const harmonics = [
    { mult: 1.0, gain: 0.7, decayFactor: 1.0 },       // Fundamental tone
    { mult: 2.0, gain: 0.35, decayFactor: 1.25 },     // Octave (Hum/Tierce)
    { mult: 2.76, gain: 0.22, decayFactor: 1.4 },     // Minor third (Metallic bell chime characteristic)
    { mult: 4.07, gain: 0.12, decayFactor: 1.8 },     // Prime quint
    { mult: 5.40, gain: 0.08, decayFactor: 2.2 },     // Super-octave
    { mult: 6.80, gain: 0.04, decayFactor: 2.6 }      // High chime shimmer
  ];

  harmonics.forEach(({ mult, gain: harmGain, decayFactor }) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * mult, startTime);

    gainNode.gain.setValueAtTime(harmGain, startTime);
    const partialDur = duration / Math.sqrt(decayFactor);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + partialDur);

    osc.connect(gainNode);
    gainNode.connect(noteEnvelope);

    osc.start(startTime);
    osc.stop(startTime + duration);
  });
}

/**
 * Synthesize Westminster Chimes (Big Ben school chime melody) with realistic harmonics & echo
 */
export async function playWestminsterChime(
  volume: number = 0.85, 
  repeats: number = 1,
  echoSettings?: EchoSettings
): Promise<void> {
  const ctx = getAudioContext();
  await ctx.resume();

  // Westminster 8-note sequence: E4, G#4, F#4, B3 -> E4, F#4, G#4, E4
  const notes = [
    { freq: 329.63, dur: 1.0 }, // E4
    { freq: 415.30, dur: 1.0 }, // G#4
    { freq: 369.99, dur: 1.0 }, // F#4
    { freq: 246.94, dur: 1.6 }, // B3
    { freq: 329.63, dur: 1.0 }, // E4
    { freq: 369.99, dur: 1.0 }, // F#4
    { freq: 415.30, dur: 1.0 }, // G#4
    { freq: 329.63, dur: 2.2 }  // E4
  ];

  const noteInterval = 0.68;
  const singlePassDuration = notes.length * noteInterval + 1.4;

  return new Promise((resolve) => {
    const now = ctx.currentTime + 0.05;

    for (let r = 0; r < repeats; r++) {
      const startOffset = now + (r * singlePassDuration);
      notes.forEach((note, idx) => {
        const noteStart = startOffset + (idx * noteInterval);
        playBellNote(ctx, note.freq, noteStart, note.dur + 1.4, volume, echoSettings, 1.1);
      });
    }

    const totalTimeMs = (repeats * singlePassDuration + 1.2) * 1000;
    setTimeout(() => resolve(), totalTimeMs);
  });
}

/**
 * Synthesize Orchestral Tubular Bell Chimes (Lonceng Tabung Nada Megah)
 */
export async function playTubularBell(
  volume: number = 0.85, 
  repeats: number = 1,
  echoSettings?: EchoSettings
): Promise<void> {
  const ctx = getAudioContext();
  await ctx.resume();

  // Majestic tubular progression: C5 -> E5 -> G5 -> C6
  const notes = [
    { freq: 523.25, dur: 1.4 }, // C5
    { freq: 659.25, dur: 1.4 }, // E5
    { freq: 783.99, dur: 1.4 }, // G5
    { freq: 1046.50, dur: 2.8 } // C6
  ];
  const step = 0.65;
  const loopDur = notes.length * step + 1.8;

  return new Promise((resolve) => {
    const now = ctx.currentTime + 0.05;
    for (let r = 0; r < repeats; r++) {
      const offset = now + (r * loopDur);
      notes.forEach((note, idx) => {
        playBellNote(ctx, note.freq, offset + idx * step, note.dur + 1.0, volume * 0.95, echoSettings, 1.2);
      });
    }
    setTimeout(() => resolve(), (repeats * loopDur + 0.8) * 1000);
  });
}

/**
 * Synthesize 3-Tone Ding-Dong-Dang (E5 -> G5 -> C6)
 */
export async function playThreeToneChime(
  volume: number = 0.85, 
  repeats: number = 1,
  echoSettings?: EchoSettings
): Promise<void> {
  const ctx = getAudioContext();
  await ctx.resume();

  const notes = [
    { freq: 659.25, dur: 1.2 }, // E5
    { freq: 783.99, dur: 1.2 }, // G5
    { freq: 1046.50, dur: 2.2 } // C6
  ];
  const step = 0.58;
  const loopDur = notes.length * step + 1.5;

  return new Promise((resolve) => {
    const now = ctx.currentTime + 0.05;
    for (let r = 0; r < repeats; r++) {
      const offset = now + (r * loopDur);
      notes.forEach((note, idx) => {
        playBellNote(ctx, note.freq, offset + idx * step, note.dur + 1.0, volume, echoSettings, 1.0);
      });
    }
    setTimeout(() => resolve(), (repeats * loopDur + 0.6) * 1000);
  });
}

/**
 * Synthesize 2-Tone Classic Ding-Dong (G5 -> D5)
 */
export async function playDingDongChime(
  volume: number = 0.85, 
  repeats: number = 2,
  echoSettings?: EchoSettings
): Promise<void> {
  const ctx = getAudioContext();
  await ctx.resume();

  const notes = [
    { freq: 783.99, dur: 1.3 }, // G5
    { freq: 587.33, dur: 2.2 }  // D5
  ];
  const step = 0.65;
  const loopDur = 2.1;

  return new Promise((resolve) => {
    const now = ctx.currentTime + 0.05;
    for (let r = 0; r < repeats; r++) {
      const offset = now + (r * loopDur);
      notes.forEach((note, idx) => {
        playBellNote(ctx, note.freq, offset + idx * step, note.dur + 0.8, volume, echoSettings, 1.0);
      });
    }
    setTimeout(() => resolve(), (repeats * loopDur + 0.6) * 1000);
  });
}

/**
 * Synthesize Pre-announcement PA Microphone Chirp ("Tung... Ting...")
 */
export async function playMicChirp(
  volume: number = 0.8,
  echoSettings?: EchoSettings
): Promise<void> {
  const ctx = getAudioContext();
  await ctx.resume();

  const notes = [
    { freq: 587.33, dur: 0.4 }, // D5
    { freq: 880.00, dur: 0.8 }  // A5
  ];

  return new Promise((resolve) => {
    const now = ctx.currentTime + 0.05;
    notes.forEach((note, idx) => {
      playBellNote(ctx, note.freq, now + (idx * 0.28), note.dur + 0.5, volume * 0.8, echoSettings, 1.3);
    });
    setTimeout(() => resolve(), 950);
  });
}

/**
 * Synthesize School Electric Ringing Bell (Mechanical Gong)
 */
export async function playElectricBell(
  volume: number = 0.85, 
  durationSec: number = 3.5,
  echoSettings?: EchoSettings
): Promise<void> {
  const ctx = getAudioContext();
  await ctx.resume();

  return new Promise((resolve) => {
    const now = ctx.currentTime + 0.05;
    const strokeRate = 20; // 20 hits per second
    const totalStrokes = Math.floor(durationSec * strokeRate);
    
    for (let i = 0; i < totalStrokes; i++) {
      const strokeTime = now + (i / strokeRate);
      playBellNote(ctx, 880 + (Math.sin(i * 1.5) * 18), strokeTime, 0.22, volume * 0.35, echoSettings, 1.4);
      playBellNote(ctx, 1320 + (Math.cos(i * 1.5) * 22), strokeTime, 0.18, volume * 0.3, echoSettings, 1.2);
    }

    setTimeout(() => resolve(), (durationSec + 0.8) * 1000);
  });
}

/**
 * Synthesize Soft Serene Chime (Nada Lembut & Tenang)
 */
export async function playSoftChime(
  volume: number = 0.85, 
  repeats: number = 1,
  echoSettings?: EchoSettings
): Promise<void> {
  const ctx = getAudioContext();
  await ctx.resume();

  const notes = [
    { freq: 523.25, dur: 2.8 }, // C5
    { freq: 659.25, dur: 2.8 }, // E5
    { freq: 783.99, dur: 3.5 }  // G5
  ];

  return new Promise((resolve) => {
    const now = ctx.currentTime + 0.05;
    for (let r = 0; r < repeats; r++) {
      const offset = now + (r * 3.6);
      notes.forEach((note, idx) => {
        playBellNote(ctx, note.freq, offset + (idx * 0.85), note.dur, volume * 0.85, echoSettings, 0.8);
      });
    }
    setTimeout(() => resolve(), (repeats * 3.6 + 1.0) * 1000);
  });
}

/**
 * Synthesize Emergency Alert Siren
 */
export async function playEmergencyChime(volume: number = 0.9, durationSec: number = 4): Promise<void> {
  const ctx = getAudioContext();
  await ctx.resume();

  return new Promise((resolve) => {
    const now = ctx.currentTime + 0.05;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    for (let t = 0; t < durationSec; t += 0.5) {
      osc.frequency.setValueAtTime(950, now + t);
      osc.frequency.exponentialRampToValueAtTime(550, now + t + 0.25);
      osc.frequency.exponentialRampToValueAtTime(950, now + t + 0.5);
    }

    gain.gain.setValueAtTime(volume * 0.7, now);
    gain.gain.setValueAtTime(volume * 0.7, now + durationSec);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + durationSec + 0.4);

    setTimeout(() => resolve(), (durationSec + 0.5) * 1000);
  });
}

/**
 * Play a custom audio file URL (uploaded MP3 / WAV / Base64 Data URL) with optional DSP Echo effect
 */
export async function playAudioUrl(
  url: string, 
  volume: number = 1.0, 
  echoSettings?: EchoSettings
): Promise<void> {
  if (!url) return;

  const ctx = getAudioContext();
  await ctx.resume();

  // Try decoding via Web Audio API for true real-time DSP Echo and filtering
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    return new Promise((resolve) => {
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      const fx = createFxBus(ctx, echoSettings, volume);
      source.connect(fx.inputNode);

      source.onended = () => {
        resolve();
      };

      source.start(0);
    });
  } catch (decodeErr) {
    // Fallback to HTML5 Audio element if decoding or data URL fetch fails
    return new Promise((resolve) => {
      try {
        const audio = new Audio(url);
        audio.volume = Math.max(0, Math.min(1, volume));
        audio.onended = () => resolve();
        audio.onerror = (e) => {
          console.warn('Audio playback error (fallback):', e);
          resolve(); // resolve so sequence does not stall
        };
        audio.play().catch(err => {
          console.warn('Audio play was prevented:', err);
          resolve();
        });
      } catch (err) {
        console.error('Audio playback exception:', err);
        resolve();
      }
    });
  }
}

/**
 * Get available speech synthesis voices with language prioritization
 */
export function getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    const onVoicesChanged = () => {
      const loadedVoices = window.speechSynthesis.getVoices();
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      resolve(loadedVoices);
    };

    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
    setTimeout(() => {
      resolve(window.speechSynthesis.getVoices());
    }, 1200);
  });
}

/**
 * Helper to identify high quality / natural neural voices
 */
export function isHighQualityVoice(voice: SpeechSynthesisVoice): boolean {
  const name = voice.name.toLowerCase();
  return (
    name.includes('natural') ||
    name.includes('neural') ||
    name.includes('online') ||
    name.includes('google') ||
    name.includes('premium') ||
    name.includes('enhanced') ||
    name.includes('siri') ||
    name.includes('wavenet')
  );
}

/**
 * Select the most suitable voice for language code ('id', 'en', 'ar')
 */
export function findBestVoice(
  voices: SpeechSynthesisVoice[], 
  langCode: 'id' | 'en' | 'ar', 
  preferredName?: string
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  if (preferredName) {
    const matched = voices.find(v => v.name === preferredName);
    if (matched) return matched;
  }

  const langPrefixes: Record<string, string[]> = {
    id: ['id-ID', 'id_ID', 'id', 'ind'],
    en: ['en-US', 'en-GB', 'en-AU', 'en'],
    ar: ['ar-SA', 'ar-EG', 'ar-AE', 'ar-QA', 'ar']
  };

  const prefixes = langPrefixes[langCode] || [langCode];

  // 1. First priority: High-quality / Natural / Google / Online voice in target language
  for (const prefix of prefixes) {
    const match = voices.find(v => v.lang.toLowerCase().startsWith(prefix.toLowerCase()) && isHighQualityVoice(v));
    if (match) return match;
  }

  // 2. Second priority: Any voice matching the target language code
  for (const prefix of prefixes) {
    const match = voices.find(v => v.lang.toLowerCase().startsWith(prefix.toLowerCase()));
    if (match) return match;
  }

  // 3. Fallback: default voice
  return voices.find(v => v.default) || voices[0] || null;
}

/**
 * Calculate persona-adjusted speech rate and pitch
 */
export function getPersonaAudioParameters(persona: VoicePersona, baseRate: number, basePitch: number) {
  switch (persona) {
    case 'ustadz':
      // Dignified, calm, measured tone for Islamic Madrasah
      return {
        rate: Math.max(0.7, Math.min(1.3, baseRate * 0.92)),
        pitch: Math.max(0.7, Math.min(1.2, basePitch * 0.92))
      };
    case 'ustadzah':
      // Articulate, warm, clear cadence
      return {
        rate: Math.max(0.7, Math.min(1.3, baseRate * 0.98)),
        pitch: Math.max(0.8, Math.min(1.3, basePitch * 1.06))
      };
    case 'formal':
      // Crisp public address announcer
      return {
        rate: Math.max(0.7, Math.min(1.4, baseRate * 1.02)),
        pitch: Math.max(0.8, Math.min(1.2, basePitch * 1.0))
      };
    case 'santri':
      // Energetic, friendly student voice
      return {
        rate: Math.max(0.8, Math.min(1.4, baseRate * 1.06)),
        pitch: Math.max(0.9, Math.min(1.3, basePitch * 1.12))
      };
    case 'custom':
    default:
      return {
        rate: Math.max(0.6, Math.min(1.4, baseRate)),
        pitch: Math.max(0.7, Math.min(1.3, basePitch))
      };
  }
}

/**
 * Refine and format text for natural cadence, realistic pauses, and authentic pronunciation
 */
export function enhanceRealisticAnnouncementText(text: string, lang: 'id' | 'en' | 'ar'): string {
  if (!text) return '';
  let formatted = text.trim();

  if (lang === 'id') {
    // Add natural rhythm pauses around school salutations and key phrases
    formatted = formatted
      .replace(/MI Syuriyah Pebatan/gi, 'Madrasah Ibtidaiyah Syuriyah Pebatan')
      .replace(/Assalamu['’]alaikum(?:\s+Warahmatullahi\s+Wabarakatuh)?/gi, 'Assalamu\'alaikum warahmatullahi wabarakatuh,')
      .replace(/Bapak(?:\/| dan )Ibu Guru/gi, 'Bapak dan Ibu Guru,')
      .replace(/santri dan santriwati/gi, 'santri, dan santriwati,')
      .replace(/waktu istirahat telah tiba/gi, 'waktu istirahat, telah tiba.')
      .replace(/seluruh siswa/gi, 'seluruh siswa dan siswi,');
  } else if (lang === 'en') {
    formatted = formatted
      .replace(/MI Syuriyah Pebatan/gi, 'MI Syuriyah Pebatan Islamic Elementary School')
      .replace(/Good morning/gi, 'Good morning,')
      .replace(/Good afternoon/gi, 'Good afternoon,')
      .replace(/Attention please/gi, 'Attention please,');
  } else if (lang === 'ar') {
    // Ensure respectful pausing on Arabic salutations
    formatted = formatted
      .replace(/السلام عليكم ورحمة الله وبركاته/g, 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَاتُهْ،')
      .replace(/صباح الخير/g, 'صَبَاحَ الْخَيْرِ،')
      .replace(/أيها الطلاب/g, 'أَيُّهَا الطُّلَّابُ وَالطَّالِبَاتُ،');
  }

  return formatted;
}

/**
 * Speak text using Web Speech API with promise and realistic cadence
 */
export function speakText(
  text: string, 
  lang: 'id' | 'en' | 'ar', 
  settings: BellSettings
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text.trim()) {
      resolve();
      return;
    }

    // Cancel any hanging speech
    window.speechSynthesis.cancel();

    const processedText = settings.realisticVoiceEnhance !== false
      ? enhanceRealisticAnnouncementText(text, lang)
      : text;

    const utterance = new SpeechSynthesisUtterance(processedText);
    const langTags: Record<string, string> = {
      id: 'id-ID',
      en: 'en-US',
      ar: 'ar-SA'
    };
    utterance.lang = langTags[lang] || 'id-ID';
    utterance.volume = Math.max(0, Math.min(1, settings.ttsVolume * settings.masterVolume));

    // Apply voice persona settings
    const personaParams = getPersonaAudioParameters(
      settings.voicePersona || 'ustadz', 
      settings.ttsRate, 
      settings.ttsPitch
    );
    utterance.rate = personaParams.rate;
    utterance.pitch = personaParams.pitch;

    const voices = window.speechSynthesis.getVoices();
    const preferred = lang === 'id' ? settings.preferredVoiceId 
                    : lang === 'en' ? settings.preferredVoiceEn 
                    : settings.preferredVoiceAr;
                    
    const voice = findBestVoice(voices, lang, preferred);
    if (voice) {
      utterance.voice = voice;
    }

    let isFinished = false;
    const finish = () => {
      if (!isFinished) {
        isFinished = true;
        resolve();
      }
    };

    utterance.onend = finish;
    utterance.onerror = (e) => {
      console.warn('TTS utterance error:', e);
      finish();
    };

    // Safety timeout in case browser TTS hangs on mobile / background
    const wordsCount = processedText.split(/\s+/).length;
    const estimatedMs = Math.max(4000, (wordsCount / 1.8) * 1000 + 4500);
    const timer = setTimeout(() => {
      finish();
    }, estimatedMs);

    const originalOnEnd = utterance.onend;
    utterance.onend = (e) => {
      clearTimeout(timer);
      if (typeof originalOnEnd === 'function') {
        originalOnEnd.call(utterance, e);
      }
      finish();
    };

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Dispatch the bell chime sound with echo acoustics
 */
export async function playChimeByType(
  chimeType: ChimeType, 
  settings: BellSettings, 
  customBellUrl?: string,
  repeats: number = 1
): Promise<void> {
  const vol = settings.chimeVolume * settings.masterVolume;
  if (settings.isMuted || vol <= 0) return;

  if (chimeType === 'custom_audio') {
    const audioUrl = customBellUrl || settings.customBellAudioUrl;
    if (audioUrl) {
      for (let i = 0; i < repeats; i++) {
        await playAudioUrl(audioUrl, vol, settings.echo);
        if (i < repeats - 1) {
          await new Promise(r => setTimeout(r, 600));
        }
      }
      return;
    }
  }

  const echo = settings.echo;

  switch (chimeType) {
    case 'westminster':
      await playWestminsterChime(vol, repeats, echo);
      break;
    case 'tubular':
      await playTubularBell(vol, repeats, echo);
      break;
    case 'three_tone':
      await playThreeToneChime(vol, repeats, echo);
      break;
    case 'dingdong':
      await playDingDongChime(vol, repeats, echo);
      break;
    case 'mic_chirp':
      await playMicChirp(vol, echo);
      break;
    case 'electric':
      await playElectricBell(vol, 3.5, echo);
      break;
    case 'soft':
      await playSoftChime(vol, repeats, echo);
      break;
    case 'emergency':
      await playEmergencyChime(vol, 4.0);
      break;
    default:
      await playWestminsterChime(vol, repeats, echo);
  }
}

export type PlaybackStepCallback = (step: 'idle' | 'chime' | 'tts_id' | 'tts_en' | 'tts_ar' | 'finished') => void;

let currentPlaybackController: { abort: boolean } | null = null;

export function stopCurrentPlayback() {
  if (currentPlaybackController) {
    currentPlaybackController.abort = true;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Orchestrate Full 3-Language Sequence:
 * 1. Play Chime (Web Audio Synthesizer with Echo or Custom Audio)
 * 2. Optional Pre-announcement Mic Chirp ("Tung... Ting...")
 * 3. Play Indonesian Announcement (TTS or Custom Audio)
 * 4. Play English Announcement (TTS or Custom Audio)
 * 5. Play Arabic Announcement (TTS or Custom Audio)
 */
export async function executeFullBellSequence(
  chimeType: ChimeType,
  announcements: BellAnnouncement,
  settings: BellSettings,
  options?: {
    playChime?: boolean;
    playTTS?: boolean;
    repeatChime?: number;
    customAudio?: CustomAudioUrls;
    onStepChange?: PlaybackStepCallback;
  }
): Promise<void> {
  const shouldPlayChime = options?.playChime ?? true;
  const shouldPlayTTS = options?.playTTS ?? true;
  const repeatCount = options?.repeatChime ?? 1;
  const customAudio = options?.customAudio;
  const onStep = options?.onStepChange;

  stopCurrentPlayback();
  const controller = { abort: false };
  currentPlaybackController = controller;

  const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

  try {
    // 1. STEP: Chime (Bel Sekolah dengan Efek Echo)
    if (shouldPlayChime && !controller.abort) {
      onStep?.('chime');
      await playChimeByType(chimeType, settings, customAudio?.bellAudioUrl, repeatCount);
      if (controller.abort) return;
      await wait(600); // Natural acoustic pause
    }

    if (!shouldPlayTTS) {
      onStep?.('finished');
      return;
    }

    // 2. Optional Pre-Chirp before voice announcement (Chirp Lonceng Mic PA)
    if (settings.playPreChirp && !shouldPlayChime && !controller.abort) {
      await playMicChirp(settings.chimeVolume * settings.masterVolume, settings.echo);
      await wait(400);
    }

    // 3. STEP: Indonesian Announcement (Bahasa Indonesia)
    if (announcements.id && announcements.id.trim() && !controller.abort) {
      onStep?.('tts_id');
      if (customAudio?.idAudioUrl) {
        await playAudioUrl(customAudio.idAudioUrl, settings.ttsVolume * settings.masterVolume, settings.echo);
      } else {
        await speakText(announcements.id, 'id', settings);
      }
      if (controller.abort) return;
      await wait(700);
    }

    // 4. STEP: English Announcement (English)
    if (announcements.en && announcements.en.trim() && !controller.abort) {
      onStep?.('tts_en');
      if (customAudio?.enAudioUrl) {
        await playAudioUrl(customAudio.enAudioUrl, settings.ttsVolume * settings.masterVolume, settings.echo);
      } else {
        await speakText(announcements.en, 'en', settings);
      }
      if (controller.abort) return;
      await wait(700);
    }

    // 5. STEP: Arabic Announcement (اللغة العربية)
    if (announcements.ar && announcements.ar.trim() && !controller.abort) {
      onStep?.('tts_ar');
      if (customAudio?.arAudioUrl) {
        await playAudioUrl(customAudio.arAudioUrl, settings.ttsVolume * settings.masterVolume, settings.echo);
      } else {
        await speakText(announcements.ar, 'ar', settings);
      }
      if (controller.abort) return;
      await wait(400);
    }

    onStep?.('finished');
  } catch (err) {
    console.error('Error executing bell sequence:', err);
    onStep?.('finished');
  } finally {
    if (currentPlaybackController === controller) {
      currentPlaybackController = null;
    }
  }
}
