import { FANTASY_STORY_TRANSITION_MS, type FantasyStoryChapter } from "../data/signalStory";

type ScheduledSource = OscillatorNode | AudioBufferSourceNode;

type ActiveScore = {
  bus: GainNode;
  sources: ScheduledSource[];
  closeTimer: number;
};

type ScorePalette = {
  roots: readonly number[];
  mode: readonly number[];
  lead: OscillatorType;
  bass: OscillatorType;
  shimmer: number;
  drive: number;
};

const PALETTES: Record<FantasyStoryChapter["id"], ScorePalette> = {
  cabinet: { roots: [45, 41, 48, 43], mode: [0, 3, 7, 10, 12], lead: "triangle", bass: "sawtooth", shimmer: 0.7, drive: 0.38 },
  tollkeeper: { roots: [38, 41, 36, 43], mode: [0, 3, 5, 7, 10], lead: "square", bass: "triangle", shimmer: 0.38, drive: 0.58 },
  cat: { roots: [50, 45, 53, 48], mode: [0, 2, 4, 7, 9, 12], lead: "sine", bass: "triangle", shimmer: 0.92, drive: 0.32 },
  runt: { roots: [36, 43, 38, 41], mode: [0, 2, 5, 7, 10, 12], lead: "triangle", bass: "sawtooth", shimmer: 0.46, drive: 0.64 },
  garden: { roots: [53, 48, 55, 50], mode: [0, 2, 5, 7, 9, 12], lead: "sine", bass: "triangle", shimmer: 1, drive: 0.26 },
  dragon: { roots: [34, 37, 41, 32], mode: [0, 3, 5, 7, 10, 12], lead: "sawtooth", bass: "square", shimmer: 0.52, drive: 1 },
  dawn: { roots: [45, 50, 53, 48], mode: [0, 4, 7, 9, 12], lead: "triangle", bass: "sawtooth", shimmer: 0.88, drive: 0.76 },
  "six-lamp": { roots: [45, 52, 50, 48], mode: [0, 2, 4, 7, 9, 12], lead: "sine", bass: "triangle", shimmer: 0.94, drive: 0.42 },
};

export class FantasyTransmissionScore {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private active: ActiveScore | null = null;
  private narrationActive = false;

  async play(chapter: FantasyStoryChapter): Promise<boolean> {
    if (typeof window === "undefined" || typeof window.AudioContext === "undefined") return false;

    if (!this.context || this.context.state === "closed") this.createContext();
    const context = this.context;
    const master = this.master;
    if (!context || !master) return false;

    try {
      await context.resume();
    } catch {
      this.stop();
      return false;
    }

    this.silence();
    const bus = context.createGain();
    const color = context.createBiquadFilter();
    const delay = context.createDelay(1.2);
    const feedback = context.createGain();
    const wet = context.createGain();
    const sources: ScheduledSource[] = [];
    const start = context.currentTime + 0.05;
    const end = start + chapter.durationMs / 1000;

    color.type = "lowpass";
    color.frequency.value = chapter.id === "dragon" ? 5_200 : chapter.id === "garden" || chapter.id === "cat" ? 7_800 : 6_400;
    color.Q.value = 0.8;
    delay.delayTime.value = chapter.id === "garden" || chapter.id === "cat" ? 0.42 : 0.25;
    feedback.gain.value = chapter.id === "garden" || chapter.id === "cat" ? 0.32 : 0.2;
    wet.gain.value = chapter.id === "dragon" ? 0.12 : 0.2;

    bus.connect(color);
    color.connect(master);
    color.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(master);

    bus.gain.setValueAtTime(0.0001, start);
    bus.gain.exponentialRampToValueAtTime(0.78, start + 1.1);
    bus.gain.setValueAtTime(0.78, Math.max(start + 1.2, end - 1.4));
    bus.gain.exponentialRampToValueAtTime(0.0001, end);

    scheduleChapter(context, bus, chapter, start, sources);
    const closeTimer = window.setTimeout(() => {
      if (this.active?.bus !== bus) return;
      this.active = null;
      bus.disconnect();
    }, chapter.durationMs + 250);
    this.active = { bus, sources, closeTimer };
    return true;
  }

  playBridge(nextChapter: FantasyStoryChapter): void {
    const context = this.context;
    const master = this.master;
    if (!context || !master || context.state === "closed") return;

    this.silence();
    const bus = context.createGain();
    const sources: ScheduledSource[] = [];
    const noise = makeNoise(context, 0.25);
    const root = PALETTES[nextChapter.id].roots[0];
    const start = context.currentTime + 0.03;
    const duration = FANTASY_STORY_TRANSITION_MS / 1_000 - 0.1;
    bus.connect(master);
    bus.gain.setValueAtTime(0.0001, start);
    bus.gain.exponentialRampToValueAtTime(0.65, start + 0.08);
    bus.gain.exponentialRampToValueAtTime(0.32, start + 1.35);
    bus.gain.setValueAtTime(0.32, start + duration - 0.72);
    bus.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    noiseHit(context, bus, sources, noise, start, 0.055, 3_400);
    [0, 7, 12].forEach((interval, index) => {
      tone(context, bus, sources, {
        start: start + 0.16 + index * 0.18,
        duration: 1.08,
        midi: root + interval + 12,
        volume: 0.045,
        type: index === 1 ? "triangle" : "sine",
        pan: -0.55 + index * 0.55,
        attack: 0.025,
      });
    });
    [1.55, 2.75, 3.95, 5.1].forEach((offset, phrase) => {
      [0, 7].forEach((interval, index) => {
        tone(context, bus, sources, {
          start: start + offset + index * 0.1,
          duration: 1.15,
          midi: root + interval + 12 + (phrase % 2 ? 2 : 0),
          volume: 0.026,
          type: "sine",
          pan: index ? 0.45 : -0.45,
          attack: 0.12,
        });
      });
    });

    const closeTimer = window.setTimeout(() => {
      if (this.active?.bus !== bus) return;
      this.active = null;
      bus.disconnect();
    }, FANTASY_STORY_TRANSITION_MS);
    this.active = { bus, sources, closeTimer };
  }

  setNarrationActive(active: boolean): void {
    this.narrationActive = active;
    const context = this.context;
    const master = this.master;
    if (!context || !master || context.state === "closed") return;

    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(active ? 0.12 : 0.34, now, active ? 0.035 : 0.12);
  }

  silence(): void {
    const active = this.active;
    const context = this.context;
    this.active = null;
    if (!active) return;

    window.clearTimeout(active.closeTimer);
    if (!context || context.state === "closed") return;
    const now = context.currentTime;
    active.bus.gain.cancelScheduledValues(now);
    active.bus.gain.setTargetAtTime(0.0001, now, 0.025);
    for (const source of active.sources) {
      try {
        source.stop(now + 0.09);
      } catch {
        // A source that already ended needs no further cleanup.
      }
    }
    window.setTimeout(() => active.bus.disconnect(), 120);
  }

  stop(): void {
    this.silence();
    const context = this.context;
    this.context = null;
    this.master = null;
    if (context && context.state !== "closed") window.setTimeout(() => void context.close(), 130);
  }

  private createContext(): void {
    const context = new window.AudioContext();
    const master = context.createGain();
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -19;
    compressor.knee.value = 18;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.006;
    compressor.release.value = 0.24;
    master.gain.value = this.narrationActive ? 0.12 : 0.34;
    master.connect(compressor);
    compressor.connect(context.destination);
    this.context = context;
    this.master = master;
  }
}

function scheduleChapter(
  context: AudioContext,
  output: AudioNode,
  chapter: FantasyStoryChapter,
  start: number,
  sources: ScheduledSource[],
): void {
  const palette = PALETTES[chapter.id];
  const beat = 60 / chapter.bpm;
  const duration = chapter.durationMs / 1000;
  const noise = makeNoise(context, 0.6);

  for (let bar = 0; bar * beat * 4 < duration; bar += 1) {
    const barStart = start + bar * beat * 4;
    const root = palette.roots[bar % palette.roots.length];
    [0, 7, 12].forEach((interval, voice) => {
      tone(context, output, sources, {
        start: barStart,
        duration: Math.min(beat * 4.4, start + duration - barStart),
        midi: root + interval + 12,
        volume: 0.018 + palette.shimmer * 0.008,
        type: voice === 1 ? "sine" : "triangle",
        pan: -0.55 + voice * 0.55,
        attack: 0.65,
      });
    });
  }

  const totalBeats = Math.floor(duration / beat);
  for (let step = 0; step < totalBeats; step += 1) {
    const time = start + step * beat;
    const root = palette.roots[Math.floor(step / 4) % palette.roots.length];
    tone(context, output, sources, {
      start: time,
      duration: beat * 0.74,
      midi: root - 12 + (step % 4 === 3 ? 7 : 0),
      volume: 0.045 + palette.drive * 0.035,
      type: palette.bass,
      pan: step % 2 ? 0.08 : -0.08,
      attack: 0.025,
    });

    if (step % 4 === 0 || (palette.drive > 0.7 && step % 2 === 0)) kick(context, output, sources, time, 0.065 + palette.drive * 0.055);
    if (step % 4 === 2) noiseHit(context, output, sources, noise, time, 0.045 + palette.drive * 0.025, 2_100);
  }

  const subdivision = chapter.id === "dragon" ? 0.5 : chapter.id === "garden" ? 1 : 0.75;
  for (let step = 0; step * beat * subdivision < duration - 1; step += 1) {
    const time = start + 2.1 + step * beat * subdivision;
    if (time >= start + duration - 0.5) break;
    const root = palette.roots[Math.floor((time - start) / (beat * 4)) % palette.roots.length];
    const interval = palette.mode[(step * 3 + Math.floor(step / 5)) % palette.mode.length];
    const build = Math.min(1, (time - start) / 10);
    tone(context, output, sources, {
      start: time,
      duration: beat * (chapter.id === "garden" ? 1.7 : 0.38),
      midi: root + interval + 24,
      volume: (0.014 + palette.shimmer * 0.018) * (0.55 + build * 0.45),
      type: palette.lead,
      pan: Math.sin(step * 1.7) * 0.68,
      attack: chapter.id === "garden" ? 0.2 : 0.018,
    });
  }

  scheduleSignature(context, output, chapter, start, beat, noise, sources);
}

function scheduleSignature(
  context: AudioContext,
  output: AudioNode,
  chapter: FantasyStoryChapter,
  start: number,
  beat: number,
  noise: AudioBuffer,
  sources: ScheduledSource[],
): void {
  if (chapter.id === "cabinet") {
    [0.7, 1.12, 6.2, 6.62, 12.7, 13.12].forEach((offset, index) => {
      tone(context, output, sources, { start: start + offset, duration: 0.24, midi: index % 2 ? 57 : 45, volume: 0.075, type: "sine", pan: 0, attack: 0.008 });
    });
    return;
  }

  if (chapter.id === "tollkeeper") {
    for (let time = 2.5; time < 24; time += beat * 4) {
      kick(context, output, sources, start + time, 0.14);
      noiseHit(context, output, sources, noise, start + time + 0.08, 0.045, 480);
    }
    [13.1, 13.55, 14.05, 14.7].forEach((offset, index) => {
      tone(context, output, sources, { start: start + offset, duration: 0.18, midi: 62 + index * 2, volume: 0.055, type: "square", pan: -0.4 + index * 0.25, attack: 0.01 });
    });
    return;
  }

  if (chapter.id === "cat") {
    [2.4, 7.1, 13.9, 20.9].forEach((offset, phrase) => {
      [0, 4, 7, 14].forEach((interval, index) => {
        tone(context, output, sources, { start: start + offset + index * 0.16, duration: 1.8, midi: 74 + interval - phrase, volume: 0.026, type: "sine", pan: -0.72 + index * 0.48, attack: 0.025 });
      });
    });
    return;
  }

  if (chapter.id === "runt") {
    for (let offset = 1.1; offset < 26; offset += beat * 4) {
      kick(context, output, sources, start + offset, 0.145);
      tone(context, output, sources, { start: start + offset + 0.12, duration: 0.8, midi: 36, volume: 0.065, type: "triangle", pan: 0, attack: 0.015 });
    }
    [13.2, 13.5, 13.8].forEach((offset, index) => {
      tone(context, output, sources, { start: start + offset, duration: 1.1, midi: 79 + index * 3, volume: 0.025, type: "sine", pan: -0.45 + index * 0.45, attack: 0.018 });
    });
    return;
  }

  if (chapter.id === "garden") {
    for (let offset = 4.2; offset < 26; offset += beat * 2) {
      [72, 77, 81].forEach((midi, index) => {
        tone(context, output, sources, { start: start + offset + index * 0.12, duration: 2.1, midi, volume: 0.025, type: "sine", pan: -0.7 + index * 0.7, attack: 0.04 });
      });
    }
    return;
  }

  if (chapter.id === "dragon") {
    for (let offset = 13.6; offset < 27; offset += beat / 2) {
      if (Math.round(offset / (beat / 2)) % 2 === 0) kick(context, output, sources, start + offset, 0.13);
      noiseHit(context, output, sources, noise, start + offset, 0.025, 4_400);
    }
    [20.5, 20.75, 21, 21.5].forEach((offset, index) => {
      tone(context, output, sources, { start: start + offset, duration: 1.1, midi: 34 + [0, 7, 12, 19][index], volume: 0.1, type: "sawtooth", pan: -0.6 + index * 0.4, attack: 0.018 });
    });
    return;
  }

  if (chapter.id === "six-lamp") {
    [1.2, 7.4, 14.8, 22.3].forEach((offset, phrase) => {
      [69, 76].forEach((midi, index) => {
        tone(context, output, sources, { start: start + offset + index * 0.18, duration: 2.4, midi: midi + phrase * 2, volume: 0.042, type: "sine", pan: index ? 0.48 : -0.48, attack: 0.03 });
      });
    });
    [57, 60, 62, 64].forEach((midi, index) => {
      tone(context, output, sources, { start: start + 18.2 + index * 1.05, duration: 3.2, midi, volume: 0.022, type: "triangle", pan: -0.72 + index * 0.48, attack: 0.3 });
    });
    return;
  }

  [7.3, 14.8, 22.4].forEach((offset, phrase) => {
    [0, 4, 7, 12].forEach((interval, index) => {
      tone(context, output, sources, { start: start + offset + index * 0.13, duration: 2.7, midi: 69 + interval + phrase * 2, volume: 0.038, type: "triangle", pan: -0.75 + index * 0.5, attack: 0.035 });
    });
  });
}

type ToneOptions = {
  start: number;
  duration: number;
  midi: number;
  volume: number;
  type: OscillatorType;
  pan: number;
  attack: number;
};

function tone(context: AudioContext, output: AudioNode, sources: ScheduledSource[], options: ToneOptions): void {
  if (options.duration <= 0.03) return;
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  const panner = context.createStereoPanner();
  oscillator.type = options.type;
  oscillator.frequency.value = 440 * 2 ** ((options.midi - 69) / 12);
  panner.pan.value = options.pan;
  envelope.gain.setValueAtTime(0.0001, options.start);
  envelope.gain.exponentialRampToValueAtTime(options.volume, options.start + Math.min(options.attack, options.duration * 0.4));
  envelope.gain.exponentialRampToValueAtTime(0.0001, options.start + options.duration);
  oscillator.connect(envelope);
  envelope.connect(panner);
  panner.connect(output);
  oscillator.start(options.start);
  oscillator.stop(options.start + options.duration + 0.03);
  sources.push(oscillator);
}

function kick(context: AudioContext, output: AudioNode, sources: ScheduledSource[], start: number, volume: number): void {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(138, start);
  oscillator.frequency.exponentialRampToValueAtTime(42, start + 0.18);
  envelope.gain.setValueAtTime(volume, start);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
  oscillator.connect(envelope);
  envelope.connect(output);
  oscillator.start(start);
  oscillator.stop(start + 0.24);
  sources.push(oscillator);
}

function noiseHit(
  context: AudioContext,
  output: AudioNode,
  sources: ScheduledSource[],
  noise: AudioBuffer,
  start: number,
  volume: number,
  frequency: number,
): void {
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const envelope = context.createGain();
  source.buffer = noise;
  filter.type = frequency < 1_000 ? "lowpass" : "highpass";
  filter.frequency.value = frequency;
  envelope.gain.setValueAtTime(volume, start);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.11);
  source.connect(filter);
  filter.connect(envelope);
  envelope.connect(output);
  source.start(start, 0, 0.13);
  sources.push(source);
}

function makeNoise(context: AudioContext, seconds: number): AudioBuffer {
  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * seconds), context.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < channel.length; index += 1) channel[index] = Math.random() * 2 - 1;
  return buffer;
}
