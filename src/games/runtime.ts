export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export type GameStatus = "playing" | "paused" | "won" | "lost";

export type GameHud = {
  score: number;
  status: GameStatus;
  message?: string;
};

export type GameMountOptions = {
  soundEnabled: boolean;
  onHud: (hud: GameHud) => void;
};

export type GameController = {
  destroy: () => void;
  restart: () => void;
  setSoundEnabled: (enabled: boolean) => void;
  setInput: (key: string, active: boolean) => void;
  togglePause: () => void;
};

export class InputState {
  private readonly held = new Set<string>();
  private readonly pressed = new Set<string>();

  set(key: string, active: boolean): void {
    const normalized = normalizeKey(key);
    if (active) {
      if (!this.held.has(normalized)) this.pressed.add(normalized);
      this.held.add(normalized);
      return;
    }
    this.held.delete(normalized);
  }

  down(...keys: string[]): boolean {
    return keys.some((key) => this.held.has(normalizeKey(key)));
  }

  take(...keys: string[]): boolean {
    const match = keys.map(normalizeKey).find((key) => this.pressed.has(key));
    if (!match) return false;
    this.pressed.delete(match);
    return true;
  }

  clear(): void {
    this.held.clear();
    this.pressed.clear();
  }
}

export class FrameLoop {
  private animationFrame = 0;
  private lastTime = 0;
  private active = true;

  constructor(private readonly frame: (delta: number) => void) {
    this.animationFrame = requestAnimationFrame(this.run);
  }

  stop(): void {
    this.active = false;
    cancelAnimationFrame(this.animationFrame);
  }

  private readonly run = (time: number): void => {
    if (!this.active) return;
    const delta = this.lastTime ? Math.min((time - this.lastTime) / 1000, 0.034) : 0;
    this.lastTime = time;
    this.frame(delta);
    this.animationFrame = requestAnimationFrame(this.run);
  };
}

export class ArcadeSfx {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;

  constructor(private enabled: boolean) {}

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (enabled && this.context?.state === "suspended") void this.context.resume();
  }

  play(frequency: number, duration = 0.08, wave: OscillatorType = "square", volume = 0.08, endFrequency = frequency * 0.76): void {
    if (!this.enabled) return;
    const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    this.context ??= new AudioContextClass();
    if (this.context.state === "suspended") void this.context.resume();
    if (!this.master) {
      this.master = this.context.createGain();
      this.master.gain.value = 0.24;
      this.master.connect(this.context.destination);
    }
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(35, endFrequency), now + duration);
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(volume, now + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(envelope);
    envelope.connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  chord(frequencies: number[], duration = 0.16, wave: OscillatorType = "square", volume = 0.035): void {
    frequencies.forEach((frequency, index) => {
      window.setTimeout(() => this.play(frequency, duration, wave, volume), index * 18);
    });
  }

  noise(duration = 0.1, volume = 0.045): void {
    if (!this.enabled) return;
    const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    this.context ??= new AudioContextClass();
    if (!this.master) {
      this.master = this.context.createGain();
      this.master.gain.value = 0.24;
      this.master.connect(this.context.destination);
    }
    const frameCount = Math.max(1, Math.floor(this.context.sampleRate * duration));
    const buffer = this.context.createBuffer(1, frameCount, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const envelope = this.context.createGain();
    const now = this.context.currentTime;
    source.buffer = buffer;
    filter.type = "bandpass";
    filter.frequency.value = 850;
    filter.Q.value = 0.8;
    envelope.gain.setValueAtTime(volume, now);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.master);
    source.start(now);
  }

  destroy(): void {
    void this.context?.close();
    this.context = null;
    this.master = null;
  }
}

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
};

export function burst(particles: Particle[], x: number, y: number, color: string, count = 12, force = 170): void {
  for (let index = 0; index < count; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = force * (0.35 + Math.random() * 0.65);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.35 + Math.random() * 0.55,
      size: 2 + Math.random() * 5,
      color,
    });
  }
}

export function updateParticles(particles: Particle[], delta: number, gravity = 280): void {
  for (const particle of particles) {
    particle.x += particle.vx * delta;
    particle.y += particle.vy * delta;
    particle.vy += gravity * delta;
    particle.life -= delta;
  }
  for (let index = particles.length - 1; index >= 0; index -= 1) {
    if (particles[index].life <= 0) particles.splice(index, 1);
  }
}

export function drawParticles(context: CanvasRenderingContext2D, particles: Particle[]): void {
  for (const particle of particles) {
    context.globalAlpha = Math.min(1, particle.life * 2.5);
    context.fillStyle = particle.color;
    context.fillRect(Math.round(particle.x), Math.round(particle.y), particle.size, particle.size);
  }
  context.globalAlpha = 1;
}

export function prepareCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable");
  context.imageSmoothingEnabled = false;
  return context;
}

export function drawPixelText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size = 18,
  color = "#eaf6f2",
  align: CanvasTextAlign = "left",
): void {
  context.save();
  context.font = `700 ${size}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  context.textAlign = align;
  context.textBaseline = "top";
  context.fillStyle = "rgba(0, 0, 0, 0.72)";
  context.fillText(text, x + 3, y + 3);
  context.fillStyle = color;
  context.fillText(text, x, y);
  context.restore();
}

export function drawOverlay(context: CanvasRenderingContext2D, title: string, copy: string, color: string): void {
  context.fillStyle = "rgba(2, 7, 11, 0.82)";
  context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  context.strokeStyle = color;
  context.lineWidth = 3;
  context.strokeRect(240, 160, 480, 220);
  drawPixelText(context, title, GAME_WIDTH / 2, 205, 36, color, "center");
  drawPixelText(context, copy, GAME_WIDTH / 2, 270, 17, "#eaf6f2", "center");
  drawPixelText(context, "PRESS R TO RUN IT BACK", GAME_WIDTH / 2, 325, 14, "#9eb7bd", "center");
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

export function intersects(
  first: { x: number; y: number; width: number; height: number },
  second: { x: number; y: number; width: number; height: number },
): boolean {
  return first.x < second.x + second.width
    && first.x + first.width > second.x
    && first.y < second.y + second.height
    && first.y + first.height > second.y;
}

function normalizeKey(key: string): string {
  if (key === " ") return "space";
  return key.toLowerCase();
}
