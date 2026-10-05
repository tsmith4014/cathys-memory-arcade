export const SIGNAL_TRANSMISSION_DURATION_MS = 24_000;

export const SIGNAL_MOMENTS = [
  { id: "wake", startsAt: 0, timecode: "00:00", line: "11:58 PM. One cabinet forgets to turn off." },
  { id: "tokens", startsAt: 5_600, timecode: "00:06", line: "Two tokens answer from the glass." },
  { id: "road", startsAt: 11_800, timecode: "00:12", line: "The aisle remembers a road through the mountains." },
  { id: "continue", startsAt: 18_200, timecode: "00:18", line: "The room does not close. It learns a new way to continue." },
] as const;

export type SignalMoment = (typeof SIGNAL_MOMENTS)[number];

export function getSignalMoment(elapsedMs: number): SignalMoment {
  return [...SIGNAL_MOMENTS].reverse().find((moment) => elapsedMs >= moment.startsAt) ?? SIGNAL_MOMENTS[0];
}

export class SignalTransmissionScore {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private closeTimer: number | null = null;

  async start(): Promise<boolean> {
    this.stop();
    if (typeof window === "undefined" || typeof window.AudioContext === "undefined") return false;

    const context = new window.AudioContext();
    const master = context.createGain();
    const compressor = context.createDynamicsCompressor();
    const delay = context.createDelay(1);
    const feedback = context.createGain();
    const echo = context.createGain();

    compressor.threshold.value = -18;
    compressor.knee.value = 16;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.008;
    compressor.release.value = 0.24;
    delay.delayTime.value = 0.27;
    feedback.gain.value = 0.26;
    echo.gain.value = 0.2;

    master.connect(compressor);
    master.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(echo);
    echo.connect(compressor);
    compressor.connect(context.destination);

    this.context = context;
    this.master = master;

    try {
      await context.resume();
    } catch {
      this.stop();
      return false;
    }

    const start = context.currentTime + 0.06;
    const end = start + SIGNAL_TRANSMISSION_DURATION_MS / 1000;
    master.gain.setValueAtTime(0.0001, start);
    master.gain.exponentialRampToValueAtTime(0.34, start + 1.2);
    master.gain.setValueAtTime(0.34, end - 1.4);
    master.gain.exponentialRampToValueAtTime(0.0001, end);

    scheduleScore(context, master, start);
    this.closeTimer = window.setTimeout(() => {
      if (this.context === context) {
        this.context = null;
        this.master = null;
        void context.close();
      }
    }, SIGNAL_TRANSMISSION_DURATION_MS + 350);
    return true;
  }

  stop(): void {
    if (this.closeTimer !== null) {
      window.clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
    const context = this.context;
    const master = this.master;
    this.context = null;
    this.master = null;
    if (!context || context.state === "closed") return;

    const now = context.currentTime;
    master?.gain.cancelScheduledValues(now);
    master?.gain.setTargetAtTime(0.0001, now, 0.025);
    window.setTimeout(() => void context.close(), 90);
  }
}

function scheduleScore(context: AudioContext, output: AudioNode, start: number): void {
  const beat = 60 / 112;
  const chords = [
    [50, 57, 60, 64],
    [45, 52, 55, 59],
    [53, 57, 60, 64],
    [48, 55, 59, 62],
  ];

  chords.forEach((chord, index) => {
    const chordStart = start + index * 6;
    chord.forEach((midi, voice) => scheduleTone(context, output, midiToHz(midi), chordStart, 6.4, 0.022, voice % 2 ? "sine" : "triangle", -0.45 + voice * 0.3));
  });

  for (let step = 0; step < 44; step += 1) {
    const time = start + 4.4 + step * beat;
    const chord = chords[Math.min(chords.length - 1, Math.floor((time - start) / 6))];
    const root = chord[0] - 12;
    scheduleTone(context, output, midiToHz(root), time, beat * 0.78, 0.075, "sawtooth", step % 4 < 2 ? -0.18 : 0.18);
  }

  for (let step = 0; step < 56; step += 1) {
    const time = start + 8.2 + step * beat * 0.5;
    if (time >= start + 22.2) break;
    const chord = chords[Math.min(chords.length - 1, Math.floor((time - start) / 6))];
    const note = chord[(step * 3) % chord.length] + 12;
    scheduleTone(context, output, midiToHz(note), time, beat * 0.34, 0.026, "square", step % 2 ? 0.36 : -0.36);
  }

  for (let step = 0; step < 27; step += 1) {
    const time = start + 9.6 + step * beat * 0.5;
    if (step % 2 === 0) scheduleKick(context, output, time);
    if (step % 4 === 2) scheduleNoiseHit(context, output, time, 0.055);
  }

  [0.8, 5.7, 11.9, 18.3, 21.6].forEach((offset, index) => {
    scheduleTone(context, output, midiToHz([74, 77, 81, 84, 86][index]), start + offset, 1.7, 0.038, "sine", index % 2 ? 0.65 : -0.65);
  });
  scheduleNoiseSweep(context, output, start + 11.2, 1.4);
  scheduleNoiseSweep(context, output, start + 17.7, 1.1);
}

function scheduleTone(
  context: AudioContext,
  output: AudioNode,
  frequency: number,
  start: number,
  duration: number,
  volume: number,
  type: OscillatorType,
  pan: number,
): void {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  const panner = context.createStereoPanner();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  panner.pan.value = pan;
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(volume, start + Math.min(0.12, duration * 0.2));
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(envelope);
  envelope.connect(panner);
  panner.connect(output);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
}

function scheduleKick(context: AudioContext, output: AudioNode, start: number): void {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(130, start);
  oscillator.frequency.exponentialRampToValueAtTime(42, start + 0.16);
  envelope.gain.setValueAtTime(0.12, start);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
  oscillator.connect(envelope);
  envelope.connect(output);
  oscillator.start(start);
  oscillator.stop(start + 0.22);
}

function scheduleNoiseHit(context: AudioContext, output: AudioNode, start: number, volume: number): void {
  const duration = 0.1;
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const envelope = context.createGain();
  source.buffer = noiseBuffer(context, duration);
  filter.type = "highpass";
  filter.frequency.value = 2_200;
  envelope.gain.setValueAtTime(volume, start);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter);
  filter.connect(envelope);
  envelope.connect(output);
  source.start(start);
}

function scheduleNoiseSweep(context: AudioContext, output: AudioNode, start: number, duration: number): void {
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const envelope = context.createGain();
  source.buffer = noiseBuffer(context, duration);
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(320, start);
  filter.frequency.exponentialRampToValueAtTime(5_200, start + duration);
  filter.Q.value = 0.8;
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(0.045, start + duration * 0.72);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter);
  filter.connect(envelope);
  envelope.connect(output);
  source.start(start);
}

function noiseBuffer(context: AudioContext, duration: number): AudioBuffer {
  const frameCount = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < frameCount; index += 1) data[index] = Math.random() * 2 - 1;
  return buffer;
}

function midiToHz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}
