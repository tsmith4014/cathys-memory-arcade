type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

export type JukeboxTrackId = "fillmore-drive" | "moxies-midnight-run" | "mountain-king-86";

export type JukeboxTrack = {
  id: JukeboxTrackId;
  title: string;
  style: string;
  credit: string;
  stepMs: number;
};

export const JUKEBOX_TRACKS: JukeboxTrack[] = [
  {
    id: "fillmore-drive",
    title: "Fillmore Drive",
    style: "Original neon road anthem",
    credit: "Original procedural composition",
    stepMs: 138,
  },
  {
    id: "moxies-midnight-run",
    title: "Moxie's Midnight Run",
    style: "Original fast arpeggio chase",
    credit: "Original procedural composition",
    stepMs: 112,
  },
  {
    id: "mountain-king-86",
    title: "Mountain King '86",
    style: "Public-domain melody remix",
    credit: "Edvard Grieg composition // new browser arrangement",
    stepMs: 124,
  },
];

const trackById = new Map(JUKEBOX_TRACKS.map((track) => [track.id, track]));

export class ArcadeSoundscape {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: GainNode | null = null;
  private ambience: GainNode | null = null;
  private ambienceOscillator: OscillatorNode | null = null;
  private timer: number | null = null;
  private step = 0;
  private trackId: JukeboxTrackId = "fillmore-drive";
  private ducked = false;

  async start(trackId: JukeboxTrackId = this.trackId): Promise<boolean> {
    this.trackId = trackId;
    if (this.context) {
      await this.context.resume();
      this.schedule();
      return true;
    }

    const AudioContextClass = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
    if (!AudioContextClass) return false;

    this.context = new AudioContextClass();
    this.master = this.context.createGain();
    this.music = this.context.createGain();
    this.ambience = this.context.createGain();
    this.master.gain.value = 0.7;
    this.music.gain.value = 0.12;
    this.ambience.gain.value = 0.018;
    this.music.connect(this.master);
    this.ambience.connect(this.master);
    this.master.connect(this.context.destination);
    this.startAmbience();
    this.schedule();
    return true;
  }

  setTrack(trackId: JukeboxTrackId): void {
    if (!trackById.has(trackId)) return;
    this.trackId = trackId;
    this.step = 0;
    if (this.context) this.schedule();
  }

  setDucked(ducked: boolean): void {
    this.ducked = ducked;
    if (!this.context || !this.master) return;
    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.linearRampToValueAtTime(ducked ? 0.26 : 0.7, now + 0.18);
  }

  async stop(): Promise<void> {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    this.ambienceOscillator?.stop();
    this.ambienceOscillator = null;
    if (this.context) await this.context.close();
    this.context = null;
    this.master = null;
    this.music = null;
    this.ambience = null;
    this.step = 0;
  }

  private schedule(): void {
    if (!this.context) return;
    if (this.timer !== null) window.clearInterval(this.timer);
    const track = trackById.get(this.trackId) ?? JUKEBOX_TRACKS[0];
    this.pulse();
    this.timer = window.setInterval(() => this.pulse(), track.stepMs);
  }

  private startAmbience(): void {
    if (!this.context || !this.ambience) return;
    const oscillator = this.context.createOscillator();
    const filter = this.context.createBiquadFilter();
    oscillator.type = "sawtooth";
    oscillator.frequency.value = 55;
    filter.type = "lowpass";
    filter.frequency.value = 180;
    oscillator.connect(filter);
    filter.connect(this.ambience);
    oscillator.start();
    this.ambienceOscillator = oscillator;
  }

  private pulse(): void {
    if (!this.context || !this.music) return;
    const now = this.context.currentTime;
    if (this.trackId === "fillmore-drive") this.playFillmoreDrive(now);
    else if (this.trackId === "moxies-midnight-run") this.playMoxiesRun(now);
    else this.playMountainKing(now);
    this.step += 1;
  }

  private playFillmoreDrive(now: number): void {
    const lead = [220, 277.18, 329.63, 440, 329.63, 277.18, 246.94, 329.63, 369.99, 493.88, 369.99, 329.63, 277.18, 246.94, 220, 164.81];
    const bass = [55, 55, 65.41, 65.41, 73.42, 73.42, 65.41, 49];
    const index = this.step % lead.length;
    if (index % 2 === 0 || index === 3 || index === 11) this.tone(lead[index], now, 0.13, "square", 0.09, lead[index] * 0.995);
    if (index % 2 === 0) this.tone(bass[Math.floor(index / 2)], now, 0.24, "triangle", 0.12);
    if (index % 4 === 0) this.kick(now, 0.12);
    if (index % 4 === 2) this.hat(now, 0.025);
  }

  private playMoxiesRun(now: number): void {
    const chords = [
      [110, 138.59, 164.81, 220],
      [98, 123.47, 146.83, 196],
      [130.81, 164.81, 196, 261.63],
      [82.41, 110, 130.81, 164.81],
    ];
    const chord = chords[Math.floor(this.step / 8) % chords.length];
    const note = chord[this.step % chord.length] * (this.step % 8 >= 4 ? 2 : 1);
    this.tone(note, now, 0.09, "square", 0.075, note * 1.01);
    if (this.step % 4 === 0) this.tone(chord[0] / 2, now, 0.2, "sawtooth", 0.08);
    if (this.step % 8 === 0 || this.step % 8 === 5) this.kick(now, 0.1);
    if (this.step % 2 === 1) this.hat(now, 0.02);
  }

  private playMountainKing(now: number): void {
    const melody = [
      146.83, 164.81, 174.61, 196, 220, 174.61, 220, 233.08,
      164.81, 184.99, 196, 220, 246.94, 196, 246.94, 261.63,
    ];
    const index = this.step % melody.length;
    const octave = Math.floor(this.step / melody.length) % 2 === 0 ? 1 : 2;
    this.tone(melody[index] * octave, now, 0.11, "square", 0.085);
    if (index % 4 === 0) this.tone(melody[index] / 2, now, 0.28, "triangle", 0.1);
    if (index % 4 === 0) this.kick(now, 0.11);
    if (index % 4 === 2) this.hat(now, 0.024);
  }

  private tone(frequency: number, now: number, duration: number, wave: OscillatorType, volume: number, endFrequency = frequency): void {
    if (!this.context || !this.music) return;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, endFrequency), now + duration);
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(volume, now + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(envelope);
    envelope.connect(this.music);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  private kick(now: number, volume: number): void {
    if (!this.context || !this.music) return;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(125, now);
    oscillator.frequency.exponentialRampToValueAtTime(42, now + 0.1);
    envelope.gain.setValueAtTime(volume, now);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
    oscillator.connect(envelope);
    envelope.connect(this.music);
    oscillator.start(now);
    oscillator.stop(now + 0.12);
  }

  private hat(now: number, volume: number): void {
    if (!this.context || !this.music) return;
    const buffer = this.context.createBuffer(1, Math.floor(this.context.sampleRate * 0.045), this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const envelope = this.context.createGain();
    source.buffer = buffer;
    filter.type = "highpass";
    filter.frequency.value = 4200;
    envelope.gain.setValueAtTime(volume, now);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.music);
    source.start(now);
  }
}
