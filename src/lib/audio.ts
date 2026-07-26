type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

export type JukeboxTrackId =
  | "fillmore-drive"
  | "moxies-midnight-run"
  | "garden-static"
  | "open-road-86"
  | "mountain-king-86"
  | "free-play-forever";

export type JukeboxTrack = {
  id: JukeboxTrackId;
  title: string;
  style: string;
  credit: string;
  bpm: number;
  mood: string;
  layers: string[];
};

type Step = number | null;

type Arrangement = {
  swing: number;
  bass: Step[];
  lead: Step[];
  chords: number[][];
  kick: number[];
  snare: number[];
  hats: number[];
  wave: OscillatorType;
  leadCutoff: number;
  leadGain?: number;
  leadLift?: boolean;
  formBars?: number;
};

export const JUKEBOX_TRACKS: JukeboxTrack[] = [
  {
    id: "fillmore-drive",
    title: "Fillmore After Dark",
    style: "Slow-burn neon road anthem",
    credit: "Original procedural composition",
    bpm: 104,
    mood: "Streetlights / last game",
    layers: ["analog bass", "glass lead", "night-drive drums", "arcade room"],
  },
  {
    id: "moxies-midnight-run",
    title: "Moxie's Midnight Run",
    style: "Long-build mountain rave",
    credit: "Original procedural composition",
    bpm: 142,
    mood: "Patient fuse / heavy drop",
    layers: ["slow-bloom pads", "rising pulse", "sub-bass drop", "warehouse hats"],
  },
  {
    id: "garden-static",
    title: "Garden Static",
    style: "After-hours ambient synth",
    credit: "Original procedural composition",
    bpm: 88,
    mood: "Quiet / growing",
    layers: ["warm pad", "bell melody", "soft pulse", "summer static"],
  },
  {
    id: "open-road-86",
    title: "Open Road '86",
    style: "Chrome-and-coral outrun",
    credit: "Original procedural composition",
    bpm: 118,
    mood: "Wild heart / horizon",
    layers: ["motor bass", "brass lead", "tom fill", "mountain air"],
  },
  {
    id: "mountain-king-86",
    title: "Mountain King '86",
    style: "Public-domain melody reimagined",
    credit: "Edvard Grieg composition / original browser arrangement",
    bpm: 126,
    mood: "Dungeon / rising danger",
    layers: ["pizzicato pulse", "8-bit melody", "march drums", "stone reverb"],
  },
  {
    id: "free-play-forever",
    title: "Free Play Forever",
    style: "Formant-voice after-hours rave",
    credit: "Original procedural composition and synthetic voice",
    bpm: 132,
    mood: "Club lights / one more continue",
    layers: ["acid pulse", "formant voice", "sub pressure", "laser percussion"],
  },
];

const trackById = new Map(JUKEBOX_TRACKS.map((track) => [track.id, track]));

const arrangements: Record<JukeboxTrackId, Arrangement> = {
  "fillmore-drive": {
    swing: 0.08,
    bass: [40, null, 40, null, 43, null, 47, null, 40, null, 40, 43, 38, null, 35, null, 40, null, 47, null, 48, null, 47, null, 43, null, 40, 38, 35, null, 38, null],
    lead: [59, null, null, null, 62, null, null, null, 64, null, null, 62, null, null, 57, null, null, null, 59, null, null, null, 64, null, 62, null, null, null, 57, null, null, null],
    chords: [[52, 55, 59], [55, 59, 62], [48, 52, 55], [50, 54, 57]],
    kick: [0, 8, 14, 16, 24, 30],
    snare: [4, 12, 20, 28],
    hats: [2, 6, 10, 14, 18, 22, 26, 30],
    wave: "triangle",
    leadCutoff: 1450,
    leadGain: 0.044,
    leadLift: false,
  },
  "moxies-midnight-run": {
    swing: 0.13,
    bass: [45, null, 45, 52, 43, null, 43, 50, 41, null, 48, null, 40, 40, 43, null, 45, null, 52, 57, 43, null, 50, 55, 41, null, 48, 53, 40, null, 43, 47],
    lead: [69, 72, 76, 81, 67, 71, 74, 79, 65, 69, 72, 77, 64, 67, 71, 76, 81, 76, 72, 69, 79, 74, 71, 67, 77, 72, 69, 65, 76, 71, 67, 64],
    chords: [[57, 60, 64], [55, 59, 62], [53, 57, 60], [52, 55, 59]],
    kick: [0, 6, 8, 14, 16, 22, 24, 29],
    snare: [4, 12, 20, 28],
    hats: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
    wave: "square",
    leadCutoff: 3600,
    leadGain: 0.062,
    formBars: 24,
  },
  "garden-static": {
    swing: 0.04,
    bass: [36, null, null, null, 43, null, null, null, 45, null, null, null, 40, null, null, null, 36, null, null, 43, 45, null, null, 48, 43, null, null, 40, 38, null, null, null],
    lead: [72, null, null, 76, null, null, 79, null, 76, null, null, 72, null, 69, null, null, 67, null, null, 72, null, 76, null, null, 74, null, 72, null, 69, null, 67, null],
    chords: [[48, 52, 55, 59], [55, 59, 62, 67], [57, 60, 64, 69], [52, 55, 59, 64]],
    kick: [0, 16],
    snare: [8, 24],
    hats: [6, 14, 22, 30],
    wave: "sine",
    leadCutoff: 1800,
  },
  "open-road-86": {
    swing: 0.06,
    bass: [38, null, 38, 45, 50, null, 45, null, 36, null, 36, 43, 48, null, 43, null, 38, null, 45, 50, 53, null, 50, 45, 36, null, 43, 48, 50, 48, 45, 43],
    lead: [62, null, 65, 69, 74, null, 72, 69, 60, null, 64, 67, 72, null, 69, 67, 74, 72, 69, 65, 76, 74, 72, 69, 67, 65, 64, 62, 60, null, 62, 65],
    chords: [[50, 53, 57], [48, 52, 55], [46, 50, 53], [43, 47, 50]],
    kick: [0, 7, 8, 14, 16, 23, 24, 30],
    snare: [4, 12, 20, 28],
    hats: [2, 6, 10, 14, 18, 22, 26, 30],
    wave: "sawtooth",
    leadCutoff: 2600,
  },
  "mountain-king-86": {
    swing: 0.02,
    bass: [38, null, 38, null, 38, null, 38, null, 40, null, 40, null, 40, null, 40, null, 41, null, 41, null, 41, null, 41, null, 43, null, 43, null, 45, null, 45, null],
    lead: [62, 64, 65, 67, 69, 65, 69, 70, 64, 66, 67, 69, 71, 67, 71, 72, 65, 67, 69, 70, 72, 69, 72, 74, 67, 69, 70, 72, 74, 70, 74, 75],
    chords: [[50, 53, 57], [52, 55, 59], [53, 57, 60], [55, 58, 62]],
    kick: [0, 8, 16, 24],
    snare: [4, 12, 20, 28],
    hats: [2, 6, 10, 14, 18, 22, 26, 30],
    wave: "square",
    leadCutoff: 3000,
  },
  "free-play-forever": {
    swing: 0.035,
    bass: [36, null, 36, 43, 36, null, 48, null, 34, null, 34, 41, 34, null, 46, null, 36, null, 43, 48, 36, null, 48, 51, 34, null, 41, 46, 34, 36, 41, 43],
    lead: [72, null, 75, null, 79, null, 82, null, 70, null, 74, null, 77, null, 81, null, 84, 82, 79, 75, 82, 79, 75, 72, 81, 77, 74, 70, 75, null, 79, null],
    chords: [[48, 51, 55, 58], [46, 50, 53, 58], [43, 46, 51, 55], [41, 46, 50, 53]],
    kick: [0, 4, 8, 12, 16, 20, 24, 28],
    snare: [4, 12, 20, 28],
    hats: [2, 6, 10, 14, 18, 22, 26, 30],
    wave: "sawtooth",
    leadCutoff: 3100,
    leadGain: 0.052,
    formBars: 16,
  },
};

export class ArcadeSoundscape {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: GainNode | null = null;
  private ambience: GainNode | null = null;
  private delay: DelayNode | null = null;
  private reverb: ConvolverNode | null = null;
  private timer: number | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private ambienceSources: AudioScheduledSourceNode[] = [];
  private nextStepTime = 0;
  private step = 0;
  private trackId: JukeboxTrackId = "fillmore-drive";

  async start(trackId: JukeboxTrackId = this.trackId): Promise<boolean> {
    this.trackId = trackId;
    if (this.context) {
      await this.context.resume();
      this.restartTransport();
      return true;
    }

    const AudioContextClass = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
    if (!AudioContextClass) return false;

    this.context = new AudioContextClass();
    this.buildSignalPath();
    this.startAmbience();
    this.restartTransport();
    return true;
  }

  setTrack(trackId: JukeboxTrackId): void {
    if (!trackById.has(trackId)) return;
    this.trackId = trackId;
    if (this.context) this.restartTransport();
  }

  setDucked(ducked: boolean): void {
    if (!this.context || !this.master) return;
    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(ducked ? 0.2 : 0.62, now + 0.22);
  }

  async stop(): Promise<void> {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    for (const source of this.ambienceSources) {
      try {
        source.stop();
      } catch {
        // A source can already be stopped while the context is closing.
      }
    }
    this.ambienceSources = [];
    if (this.context) await this.context.close();
    this.context = null;
    this.master = null;
    this.music = null;
    this.ambience = null;
    this.delay = null;
    this.reverb = null;
    this.noiseBuffer = null;
    this.step = 0;
  }

  private buildSignalPath(): void {
    if (!this.context) return;

    const master = this.context.createGain();
    const compressor = this.context.createDynamicsCompressor();
    const music = this.context.createGain();
    const ambience = this.context.createGain();
    const delay = this.context.createDelay(1);
    const delayFeedback = this.context.createGain();
    const delayWet = this.context.createGain();
    const reverb = this.context.createConvolver();
    const reverbWet = this.context.createGain();

    master.gain.value = 0.62;
    music.gain.value = 0.7;
    ambience.gain.value = 0.028;
    compressor.threshold.value = -18;
    compressor.knee.value = 14;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.006;
    compressor.release.value = 0.24;
    delay.delayTime.value = 0.285;
    delayFeedback.gain.value = 0.22;
    delayWet.gain.value = 0.17;
    reverb.buffer = this.createImpulse(1.75, 2.8);
    reverbWet.gain.value = 0.13;

    music.connect(master);
    ambience.connect(master);
    delay.connect(delayFeedback);
    delayFeedback.connect(delay);
    delay.connect(delayWet);
    delayWet.connect(master);
    reverb.connect(reverbWet);
    reverbWet.connect(master);
    master.connect(compressor);
    compressor.connect(this.context.destination);

    this.master = master;
    this.music = music;
    this.ambience = ambience;
    this.delay = delay;
    this.reverb = reverb;
    this.noiseBuffer = this.createNoiseBuffer(2);
  }

  private restartTransport(): void {
    if (!this.context) return;
    if (this.timer !== null) window.clearInterval(this.timer);
    this.step = 0;
    this.nextStepTime = this.context.currentTime + 0.06;
    this.schedulerTick();
    this.timer = window.setInterval(() => this.schedulerTick(), 25);
  }

  private schedulerTick(): void {
    if (!this.context) return;
    const track = trackById.get(this.trackId) ?? JUKEBOX_TRACKS[0];
    const arrangement = arrangements[this.trackId];
    const baseStepDuration = 60 / track.bpm / 4;
    while (this.nextStepTime < this.context.currentTime + 0.14) {
      this.scheduleStep(this.nextStepTime, this.step, arrangement, baseStepDuration);
      const swing = this.step % 2 === 0 ? 1 + arrangement.swing : 1 - arrangement.swing;
      this.nextStepTime += baseStepDuration * swing;
      this.step += 1;
    }
  }

  private scheduleStep(when: number, absoluteStep: number, arrangement: Arrangement, stepDuration: number): void {
    if (this.trackId === "moxies-midnight-run") {
      this.scheduleMoxieStep(when, absoluteStep, arrangement, stepDuration);
      return;
    }
    if (this.trackId === "free-play-forever") {
      this.scheduleFreePlayStep(when, absoluteStep, arrangement, stepDuration);
      return;
    }
    const patternStep = absoluteStep % 32;
    const bar = Math.floor(absoluteStep / 16) % (arrangement.formBars ?? 8);
    const phraseBuild = bar >= 2;
    const fullBand = bar >= 4;
    const breakdown = bar === 6;
    const bassNote = arrangement.bass[patternStep];
    const leadNote = arrangement.lead[patternStep];

    if (patternStep % 16 === 0) {
      const chord = arrangement.chords[Math.floor(absoluteStep / 16) % arrangement.chords.length];
      this.playChord(chord, when, stepDuration * 14, breakdown ? 0.026 : 0.038);
    }
    if (bassNote !== null && !breakdown) this.playBass(bassNote, when, stepDuration * 1.7);
    if (leadNote !== null && phraseBuild && (!breakdown || patternStep % 4 === 0)) {
      const lift = arrangement.leadLift !== false && fullBand && patternStep % 8 === 6 ? 12 : 0;
      this.playLead(leadNote + lift, when, stepDuration * 0.86, arrangement);
    }
    if (arrangement.leadLift !== false && fullBand && patternStep % 16 === 15) {
      this.playLead(arrangement.lead[(patternStep + 1) % 32] ?? 72, when, stepDuration * 1.8, arrangement, -0.35);
    }
    if (arrangement.kick.includes(patternStep) && !breakdown) this.kick(when, fullBand ? 0.19 : 0.15);
    if (arrangement.snare.includes(patternStep) && phraseBuild) this.snare(when, fullBand ? 0.1 : 0.075);
    if (arrangement.hats.includes(patternStep) && (bar > 0 || patternStep % 4 === 2)) this.hat(when, fullBand ? 0.038 : 0.027, patternStep % 8 === 6);
    if (bar === 7 && patternStep >= 28) this.tom(when, 62 - (patternStep - 28) * 7, 0.07);
  }

  private scheduleMoxieStep(when: number, absoluteStep: number, arrangement: Arrangement, stepDuration: number): void {
    const patternStep = absoluteStep % 32;
    const stepInBar = absoluteStep % 16;
    const bar = Math.floor(absoluteStep / 16) % 24;
    const bassNote = arrangement.bass[patternStep];
    const leadNote = arrangement.lead[patternStep];
    const chord = arrangement.chords[bar % arrangement.chords.length];

    if (stepInBar === 0) {
      const chordVolume = bar < 3 ? 0.034 : bar < 9 ? 0.026 : bar < 12 ? 0.022 : bar < 20 ? 0.038 : 0.032;
      this.playChord(chord, when, stepDuration * 15, chordVolume);
    }

    if (bar < 3) {
      if (stepInBar === 0) this.playBass((bassNote ?? 45) - 12, when, stepDuration * 5);
      if (bar === 2 && stepInBar === 12) this.hat(when, 0.018, true);
      return;
    }

    if (bar < 6) {
      if (bassNote !== null && stepInBar % 4 === 0) this.playBass(bassNote - 12, when, stepDuration * 2.8);
      if (stepInBar === 0 || stepInBar === 8) this.kick(when, 0.1 + (bar - 3) * 0.015);
      if (bar === 5 && stepInBar % 4 === 2) this.hat(when, 0.019, false);
      return;
    }

    if (bar < 9) {
      if (bassNote !== null && patternStep % 2 === 0) this.playBass(bassNote - (bar === 6 ? 12 : 0), when, stepDuration * 1.8);
      if ([0, 8].includes(stepInBar)) this.kick(when, 0.145);
      if ([4, 12].includes(stepInBar)) this.snare(when, 0.065);
      if (stepInBar % 2 === 0) this.hat(when, 0.023, stepInBar === 14);
      return;
    }

    if (bar < 12) {
      if (stepInBar === 0) this.playRiser(when, stepDuration * 15, (bar - 8) / 3);
      if (bassNote !== null && stepInBar % 2 === 0) this.playBass(bassNote, when, stepDuration * 1.3);
      if ([0, 6, 8, 14].includes(stepInBar)) this.kick(when, 0.16 + (bar - 9) * 0.012);
      if ([4, 12].includes(stepInBar)) this.snare(when, 0.078);
      if (stepInBar % 2 === 0) this.hat(when, 0.028 + (bar - 9) * 0.004, stepInBar === 14);
      if (bar === 11 && stepInBar >= 12) this.tom(when, 105 - (stepInBar - 12) * 16, 0.08);
      return;
    }

    if (bar < 20) {
      if (bassNote !== null) this.playBass(bassNote, when, stepDuration * 1.55);
      if (leadNote !== null && (stepInBar % 2 === 0 || bar % 2 === 1)) this.playLead(leadNote, when, stepDuration * 0.78, arrangement, bar % 2 ? 0.28 : -0.28);
      if (stepInBar % 4 === 0) this.kick(when, 0.24);
      if (stepInBar === 0 || stepInBar === 8) this.subImpact(when, 0.18);
      if ([4, 12].includes(stepInBar)) this.snare(when, 0.11);
      if (stepInBar % 2 === 0) this.hat(when, 0.042, stepInBar === 14);
      if (bar % 4 === 3 && stepInBar >= 12) this.tom(when, 88 - (stepInBar - 12) * 12, 0.075);
      return;
    }

    if (bar < 22) {
      if (stepInBar === 0) this.playBass((bassNote ?? 41) - 12, when, stepDuration * 5);
      if (bar === 21 && stepInBar >= 8 && stepInBar % 2 === 0) this.hat(when, 0.02 + (stepInBar - 8) * 0.003, false);
      return;
    }

    if (bassNote !== null && stepInBar % 2 === 0) this.playBass(bassNote, when, stepDuration * 1.45);
    if ([0, 8, 12].includes(stepInBar)) this.kick(when, 0.17);
    if ([4, 12].includes(stepInBar)) this.snare(when, 0.082);
    if (stepInBar % 2 === 0) this.hat(when, 0.032, stepInBar === 14);
    if (bar === 23 && stepInBar === 0) this.playRiser(when, stepDuration * 15, 1);
  }

  private scheduleFreePlayStep(when: number, absoluteStep: number, arrangement: Arrangement, stepDuration: number): void {
    const patternStep = absoluteStep % 32;
    const stepInBar = absoluteStep % 16;
    const bar = Math.floor(absoluteStep / 16) % 16;
    const bassNote = arrangement.bass[patternStep];
    const leadNote = arrangement.lead[patternStep];
    const fullDrop = bar >= 8 && bar < 14;

    if (stepInBar === 0) {
      const chord = arrangement.chords[bar % arrangement.chords.length];
      this.playChord(chord, when, stepDuration * 14, bar < 2 || bar === 14 ? 0.032 : 0.026);
    }
    if (bar >= 2 && bar !== 14 && bassNote !== null && (fullDrop || patternStep % 2 === 0)) {
      this.playBass(bassNote, when, stepDuration * (fullDrop ? 1.45 : 1.8));
    }
    if (bar >= 4 && bar !== 14 && stepInBar % 4 === 0) this.kick(when, fullDrop ? 0.23 : 0.15);
    if (bar >= 4 && bar !== 14 && [4, 12].includes(stepInBar)) this.snare(when, fullDrop ? 0.105 : 0.074);
    if (bar >= 3 && bar !== 14 && stepInBar % 2 === 0) this.hat(when, fullDrop ? 0.04 : 0.026, stepInBar === 14);
    if (fullDrop && leadNote !== null && stepInBar % 2 === 0) this.playLead(leadNote, when, stepDuration * 0.72, arrangement, stepInBar < 8 ? -0.32 : 0.32);
    if (fullDrop && (stepInBar === 0 || stepInBar === 8)) this.subImpact(when, 0.16);
    if ([4, 7, 8, 11, 13, 15].includes(bar) && (stepInBar === 0 || stepInBar === 8)) {
      const vowel = (bar + stepInBar) % 3 === 0 ? "ah" : (bar + stepInBar) % 3 === 1 ? "oh" : "ee";
      this.playFormantVoice(when, vowel, stepDuration * (stepInBar === 0 ? 5.6 : 3.2), 0.07 + (fullDrop ? 0.018 : 0));
    }
    if ((bar === 7 || bar === 15) && stepInBar === 0) this.playRiser(when, stepDuration * 15, 1);
  }

  private playRiser(when: number, duration: number, intensity: number): void {
    if (!this.context || !this.music || !this.noiseBuffer) return;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const envelope = this.context.createGain();
    const end = when + duration;
    source.buffer = this.noiseBuffer;
    source.loop = true;
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(280 + intensity * 180, when);
    filter.frequency.exponentialRampToValueAtTime(4200 + intensity * 2600, end);
    filter.Q.setValueAtTime(0.7, when);
    filter.Q.linearRampToValueAtTime(4.2, end);
    envelope.gain.setValueAtTime(0.0001, when);
    envelope.gain.exponentialRampToValueAtTime(0.026 + intensity * 0.03, when + duration * 0.72);
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.music);
    if (this.reverb) envelope.connect(this.reverb);
    source.start(when, Math.random());
    source.stop(end + 0.02);
  }

  private subImpact(when: number, volume: number): void {
    if (!this.context || !this.music) return;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(72, when);
    oscillator.frequency.exponentialRampToValueAtTime(28, when + 0.42);
    envelope.gain.setValueAtTime(volume, when);
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + 0.52);
    oscillator.connect(envelope);
    envelope.connect(this.music);
    oscillator.start(when);
    oscillator.stop(when + 0.54);
  }

  private playFormantVoice(when: number, vowel: "ah" | "oh" | "ee", duration: number, volume: number): void {
    if (!this.context || !this.music) return;
    const formants = {
      ah: [760, 1160, 2850],
      oh: [480, 820, 2550],
      ee: [310, 2250, 3020],
    }[vowel];
    const oscillator = this.context.createOscillator();
    const vibrato = this.context.createOscillator();
    const vibratoDepth = this.context.createGain();
    const envelope = this.context.createGain();
    const panner = this.context.createStereoPanner();
    const end = when + Math.max(0.18, duration);

    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(vowel === "oh" ? 92.5 : 110, when);
    oscillator.frequency.linearRampToValueAtTime(vowel === "ee" ? 123.47 : 104, end);
    vibrato.type = "sine";
    vibrato.frequency.value = 5.2;
    vibratoDepth.gain.value = 4.8;
    vibrato.connect(vibratoDepth);
    vibratoDepth.connect(oscillator.frequency);
    envelope.gain.setValueAtTime(0.0001, when);
    envelope.gain.exponentialRampToValueAtTime(volume, when + Math.min(0.08, duration * 0.18));
    envelope.gain.setValueAtTime(volume * 0.72, when + duration * 0.58);
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);
    panner.pan.setValueAtTime(vowel === "ah" ? -0.18 : vowel === "ee" ? 0.2 : 0, when);

    formants.forEach((frequency, index) => {
      const filter = this.context!.createBiquadFilter();
      const bandGain = this.context!.createGain();
      filter.type = "bandpass";
      filter.frequency.value = frequency;
      filter.Q.value = 7 + index * 2;
      bandGain.gain.value = [0.95, 0.5, 0.22][index];
      oscillator.connect(filter);
      filter.connect(bandGain);
      bandGain.connect(envelope);
    });
    envelope.connect(panner);
    panner.connect(this.music);
    if (this.delay) panner.connect(this.delay);
    if (this.reverb) panner.connect(this.reverb);
    oscillator.start(when);
    vibrato.start(when);
    oscillator.stop(end + 0.03);
    vibrato.stop(end + 0.03);
  }

  private startAmbience(): void {
    if (!this.context || !this.ambience || !this.noiseBuffer) return;
    const roomNoise = this.context.createBufferSource();
    const roomFilter = this.context.createBiquadFilter();
    const hum = this.context.createOscillator();
    const upperHum = this.context.createOscillator();
    const humGain = this.context.createGain();

    roomNoise.buffer = this.noiseBuffer;
    roomNoise.loop = true;
    roomFilter.type = "bandpass";
    roomFilter.frequency.value = 820;
    roomFilter.Q.value = 0.38;
    hum.type = "sine";
    hum.frequency.value = 58;
    upperHum.type = "sine";
    upperHum.frequency.value = 116.4;
    humGain.gain.value = 0.28;

    roomNoise.connect(roomFilter);
    roomFilter.connect(this.ambience);
    hum.connect(humGain);
    upperHum.connect(humGain);
    humGain.connect(this.ambience);
    roomNoise.start();
    hum.start();
    upperHum.start();
    this.ambienceSources = [roomNoise, hum, upperHum];
  }

  private playLead(note: number, when: number, duration: number, arrangement: Arrangement, pan = 0.2): void {
    this.synthNote(note, when, duration, arrangement.wave, arrangement.leadGain ?? 0.075, arrangement.leadCutoff, pan, 5, true);
  }

  private playBass(note: number, when: number, duration: number): void {
    this.synthNote(note, when, duration, "sawtooth", 0.09, 520, -0.12, -4, false);
    this.synthNote(note - 12, when, duration * 0.9, "sine", 0.055, 280, 0, 0, false);
  }

  private playChord(notes: number[], when: number, duration: number, volume: number): void {
    notes.forEach((note, index) => {
      this.synthNote(note, when + index * 0.012, duration, index % 2 === 0 ? "triangle" : "sawtooth", volume, 920, (index - 1.5) * 0.22, index * 3 - 4, true);
    });
  }

  private synthNote(
    note: number,
    when: number,
    duration: number,
    wave: OscillatorType,
    volume: number,
    cutoff: number,
    pan: number,
    detune: number,
    effects: boolean,
  ): void {
    if (!this.context || !this.music) return;
    const oscillator = this.context.createOscillator();
    const filter = this.context.createBiquadFilter();
    const envelope = this.context.createGain();
    const panner = this.context.createStereoPanner();
    const end = when + Math.max(0.05, duration);

    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(midiToFrequency(note), when);
    oscillator.detune.value = detune;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(cutoff, when);
    filter.frequency.exponentialRampToValueAtTime(Math.max(180, cutoff * 0.42), end);
    filter.Q.value = 1.4;
    panner.pan.value = pan;
    envelope.gain.setValueAtTime(0.0001, when);
    envelope.gain.exponentialRampToValueAtTime(volume, when + Math.min(0.018, duration * 0.2));
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(filter);
    filter.connect(envelope);
    envelope.connect(panner);
    panner.connect(this.music);
    if (effects) {
      if (this.delay) panner.connect(this.delay);
      if (this.reverb) panner.connect(this.reverb);
    }
    oscillator.start(when);
    oscillator.stop(end + 0.03);
  }

  private kick(when: number, volume: number): void {
    if (!this.context || !this.music) return;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(148, when);
    oscillator.frequency.exponentialRampToValueAtTime(42, when + 0.13);
    envelope.gain.setValueAtTime(volume, when);
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + 0.15);
    oscillator.connect(envelope);
    envelope.connect(this.music);
    oscillator.start(when);
    oscillator.stop(when + 0.16);
  }

  private snare(when: number, volume: number): void {
    this.noiseHit(when, 0.16, 1150, volume);
    this.tom(when, 176, volume * 0.45);
  }

  private hat(when: number, volume: number, open: boolean): void {
    this.noiseHit(when, open ? 0.11 : 0.045, 5200, volume);
  }

  private tom(when: number, frequency: number, volume: number): void {
    if (!this.context || !this.music) return;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, when);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(38, frequency * 0.58), when + 0.12);
    envelope.gain.setValueAtTime(volume, when);
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + 0.14);
    oscillator.connect(envelope);
    envelope.connect(this.music);
    oscillator.start(when);
    oscillator.stop(when + 0.15);
  }

  private noiseHit(when: number, duration: number, highpass: number, volume: number): void {
    if (!this.context || !this.music || !this.noiseBuffer) return;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const envelope = this.context.createGain();
    source.buffer = this.noiseBuffer;
    filter.type = "highpass";
    filter.frequency.value = highpass;
    envelope.gain.setValueAtTime(volume, when);
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.music);
    source.start(when, Math.random(), duration);
  }

  private createNoiseBuffer(duration: number): AudioBuffer {
    if (!this.context) throw new Error("Audio context is required");
    const buffer = this.context.createBuffer(1, Math.floor(this.context.sampleRate * duration), this.context.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let index = 0; index < data.length; index += 1) {
      const white = Math.random() * 2 - 1;
      last = last * 0.985 + white * 0.015;
      data[index] = white * 0.42 + last * 0.58;
    }
    return buffer;
  }

  private createImpulse(duration: number, decay: number): AudioBuffer {
    if (!this.context) throw new Error("Audio context is required");
    const length = Math.floor(this.context.sampleRate * duration);
    const impulse = this.context.createBuffer(2, length, this.context.sampleRate);
    for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
      const data = impulse.getChannelData(channel);
      for (let index = 0; index < length; index += 1) {
        data[index] = (Math.random() * 2 - 1) * Math.pow(1 - index / length, decay);
      }
    }
    return impulse;
  }
}

function midiToFrequency(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}
