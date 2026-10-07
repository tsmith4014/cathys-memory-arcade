type NarratorCallbacks = {
  onSpeakingChange?: (speaking: boolean) => void;
  onVoiceChange?: (voiceName: string) => void;
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

  constructor(callbacks: NarratorCallbacks = {}) {
    this.callbacks = callbacks;
  }

  static isSupported(): boolean {
    return typeof window !== "undefined"
      && "speechSynthesis" in window
      && typeof window.SpeechSynthesisUtterance !== "undefined";
  }

  speak(text: string, rate = 0.92): boolean {
    if (!BrowserStoryNarrator.isSupported()) return false;

    this.cancel();
    const generation = ++this.generation;
    const utterance = new window.SpeechSynthesisUtterance(text);
    const voice = selectNarrationVoice(window.speechSynthesis.getVoices());

    utterance.rate = rate;
    utterance.pitch = 0.96;
    utterance.volume = 1;
    utterance.lang = voice?.lang || "en-US";
    if (voice) utterance.voice = voice;

    this.callbacks.onVoiceChange?.(voice?.name || "Best available English voice");
    utterance.onstart = () => {
      if (generation === this.generation) this.setSpeaking(true);
    };
    utterance.onend = () => {
      if (generation === this.generation) this.setSpeaking(false);
    };
    utterance.onerror = () => {
      if (generation === this.generation) this.setSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
    return true;
  }

  cancel(): void {
    this.generation += 1;
    if (BrowserStoryNarrator.isSupported()) window.speechSynthesis.cancel();
    this.setSpeaking(false);
  }

  private setSpeaking(speaking: boolean): void {
    if (this.speaking === speaking) return;
    this.speaking = speaking;
    this.callbacks.onSpeakingChange?.(speaking);
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
