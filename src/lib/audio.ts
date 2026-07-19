type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

export class ArcadeSoundscape {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer: number | null = null;
  private step = 0;

  async start(): Promise<boolean> {
    if (this.context) {
      await this.context.resume();
      return true;
    }

    const AudioContextClass = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
    if (!AudioContextClass) {
      return false;
    }

    this.context = new AudioContextClass();
    this.master = this.context.createGain();
    this.master.gain.value = 0.045;
    this.master.connect(this.context.destination);
    this.pulse();
    this.timer = window.setInterval(() => this.pulse(), 720);
    return true;
  }

  async stop(): Promise<void> {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    if (this.context) {
      await this.context.close();
    }
    this.context = null;
    this.master = null;
  }

  private pulse(): void {
    if (!this.context || !this.master) {
      return;
    }
    const notes = [110, 146.83, 164.81, 220, 164.81, 146.83];
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = this.step % 3 === 0 ? "square" : "triangle";
    oscillator.frequency.value = notes[this.step % notes.length];
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(0.24, now + 0.018);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.21);
    oscillator.connect(envelope);
    envelope.connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + 0.24);
    this.step += 1;
  }
}
