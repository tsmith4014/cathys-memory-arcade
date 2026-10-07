type NarratorCallbacks = {
  onSpeakingChange?: (speaking: boolean) => void;
  onVoiceChange?: (voiceName: string) => void;
  onError?: (message: string | null) => void;
};

type VoiceLike = Pick<SpeechSynthesisVoice, "default" | "lang" | "localService" | "name">;

const PREFERRED_VOICE_NAMES = [
  /natural/i,
  /premium/i,
  /enhanced/i,
  /ava/i,
  /samantha/i,
  /zoe/i,
  /serena/i,
  /daniel/i,
  /karen/i,
  /microsoft (aria|jenny|guy)/i,
  /google (us|uk) english/i,
] as const;

export class BrowserStoryNarrator {
  private callbacks: NarratorCallbacks;
  private generation = 0;
  private speaking = false;
  private utterance: SpeechSynthesisUtterance | null = null;
  private recording: HTMLAudioElement | null = null;
  private startWatchdog: number | null = null;

  constructor(callbacks: NarratorCallbacks = {}) {
    this.callbacks = callbacks;
  }

  static isSupported(): boolean {
    return typeof window !== "undefined"
      && (typeof window.Audio !== "undefined" || BrowserStoryNarrator.hasDeviceSpeech());
  }

  private static hasDeviceSpeech(): boolean {
    return typeof window !== "undefined"
      && "speechSynthesis" in window
      && typeof window.SpeechSynthesisUtterance !== "undefined";
  }

  speak(text: string, rate = 0.92, recordingUrl?: string): boolean {
    if (recordingUrl && typeof window !== "undefined" && typeof window.Audio !== "undefined") {
      this.cancel();
      return this.playRecording(text, rate, recordingUrl);
    }

    return this.speakWithDevice(text, rate);
  }

  private playRecording(text: string, fallbackRate: number, recordingUrl: string): boolean {
    const generation = ++this.generation;
    const recording = this.recording ?? new window.Audio();
    let fallbackStarted = false;
    this.recording = recording;
    recording.preload = "auto";
    recording.src = recordingUrl;
    recording.playbackRate = 1;
    recording.currentTime = 0;
    this.callbacks.onError?.(null);
    this.callbacks.onVoiceChange?.("Danielle // recorded generative voice");

    const fallbackToDevice = () => {
      if (generation !== this.generation || fallbackStarted) return;
      fallbackStarted = true;
      this.clearRecordingHandlers(recording);
      this.recording = null;
      this.setSpeaking(false);
      if (!this.speakWithDevice(text, fallbackRate)) {
        this.callbacks.onError?.("Recorded narration could not start in this browser. Captions remain available below the film.");
      }
    };

    recording.onplay = () => {
      if (generation === this.generation) this.setSpeaking(true);
    };
    recording.onended = () => {
      if (generation !== this.generation) return;
      this.clearRecordingHandlers(recording);
      this.setSpeaking(false);
    };
    recording.onerror = fallbackToDevice;

    try {
      const playback = recording.play();
      void playback?.catch(fallbackToDevice);
    } catch {
      fallbackToDevice();
    }
    return true;
  }

  private speakWithDevice(text: string, rate: number): boolean {
    if (!BrowserStoryNarrator.hasDeviceSpeech()) return false;

    const synthesis = window.speechSynthesis;
    this.clearWatchdog();
    if (this.utterance || synthesis.speaking || synthesis.pending) {
      this.generation += 1;
      synthesis.cancel();
      this.utterance = null;
      this.setSpeaking(false);
    }

    const generation = ++this.generation;
    const utterance = new window.SpeechSynthesisUtterance(text);
    const voice = selectNarrationVoice(synthesis.getVoices());

    utterance.rate = rate;
    utterance.pitch = 0.96;
    utterance.volume = 1;
    utterance.lang = voice?.lang || "en-US";
    if (voice) utterance.voice = voice;

    this.utterance = utterance;
    this.callbacks.onError?.(null);
    this.callbacks.onVoiceChange?.(voice?.name || "Best available English voice");
    utterance.onstart = () => {
      if (generation !== this.generation) return;
      this.clearWatchdog();
      this.setSpeaking(true);
    };
    utterance.onend = () => {
      if (generation !== this.generation) return;
      this.utterance = null;
      this.clearWatchdog();
      this.setSpeaking(false);
    };
    utterance.onerror = (event) => {
      if (generation !== this.generation) return;
      this.utterance = null;
      this.clearWatchdog();
      this.setSpeaking(false);
      if (event.error !== "canceled" && event.error !== "interrupted") {
        this.callbacks.onError?.("The browser blocked its voice. Press Hear voice once, then play the story again.");
      }
    };

    if (synthesis.paused) synthesis.resume();
    synthesis.speak(utterance);

    // Safari can leave a queued utterance paused unless it is nudged shortly
    // after a user gesture. Retaining the utterance also prevents early GC.
    this.startWatchdog = window.setTimeout(() => {
      if (generation !== this.generation || this.speaking) return;
      synthesis.resume();
      this.startWatchdog = window.setTimeout(() => {
        if (generation === this.generation && !this.speaking) {
          this.callbacks.onError?.("No voice started. Press Hear voice to unlock narration in this browser.");
        }
      }, 1_800);
    }, 450);
    return true;
  }

  cancel(): void {
    this.generation += 1;
    this.clearWatchdog();
    if (this.recording) {
      this.clearRecordingHandlers(this.recording);
      this.recording.pause();
      this.recording.currentTime = 0;
      this.recording = null;
    }
    if (BrowserStoryNarrator.hasDeviceSpeech()) window.speechSynthesis.cancel();
    this.utterance = null;
    this.setSpeaking(false);
  }

  dispose(): void {
    this.cancel();
  }

  private setSpeaking(speaking: boolean): void {
    if (this.speaking === speaking) return;
    this.speaking = speaking;
    this.callbacks.onSpeakingChange?.(speaking);
  }

  private clearWatchdog(): void {
    if (this.startWatchdog !== null) window.clearTimeout(this.startWatchdog);
    this.startWatchdog = null;
  }

  private clearRecordingHandlers(recording: HTMLAudioElement): void {
    recording.onplay = null;
    recording.onended = null;
    recording.onerror = null;
  }
}

export function selectNarrationVoice<T extends VoiceLike>(voices: readonly T[]): T | null {
  const englishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));
  if (englishVoices.length === 0) return null;

  return [...englishVoices].sort((left, right) => scoreVoice(right) - scoreVoice(left))[0];
}

function scoreVoice(voice: VoiceLike): number {
  const preferredIndex = PREFERRED_VOICE_NAMES.findIndex((pattern) => pattern.test(voice.name));
  let score = preferredIndex === -1 ? 0 : 1_000 - preferredIndex * 45;
  if (voice.lang.toLowerCase() === "en-us") score += 90;
  else if (voice.lang.toLowerCase().startsWith("en")) score += 45;
  if (voice.localService) score += 20;
  if (voice.default) score += 10;
  if (/compact|espeak/i.test(voice.name)) score -= 1_200;
  return score;
}
