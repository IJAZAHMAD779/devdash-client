/**
 * Lightweight 8-bit sound effects synthesizer using native Web Audio API.
 * Zero external audio files, zero latency, works completely offline.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;

  constructor() {
    if (typeof window !== "undefined") {
      // Default to muted to avoid surprising developers in quiet environments
      const saved = localStorage.getItem("devdash_games_muted");
      this.isMuted = saved !== null ? saved === "true" : true;
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== "undefined") {
      localStorage.setItem("devdash_games_muted", String(muted));
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Classic jump beep (rising frequency)
   */
  public playJump() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {
      // AudioContext interaction safeguard
    }
  }

  /**
   * Positive score / coin / merge chime (two harmonic tones)
   */
  public playScore() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      [
        { freq: 523.25, time: 0 },
        { freq: 659.25, time: 0.08 },
      ].forEach(({ freq, time }) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0.08, now + time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + 0.15);
      });
    } catch {
      // AudioContext interaction safeguard
    }
  }

  /**
   * Balloon pop sound (short noise burst)
   */
  public playPop() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(450, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch {
      // AudioContext interaction safeguard
    }
  }

  /**
   * Tile slide or tick click
   */
  public playClick() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.03);
    } catch {
      // AudioContext interaction safeguard
    }
  }

  /**
   * Game over sound (descending tones)
   */
  public playGameOver() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      [
        { freq: 330, time: 0 },
        { freq: 294, time: 0.1 },
        { freq: 261, time: 0.2 },
        { freq: 196, time: 0.3 },
      ].forEach(({ freq, time }) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0.06, now + time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + 0.18);
      });
    } catch {
      // AudioContext interaction safeguard
    }
  }

  /**
   * Coin flip metallic chime
   */
  public playCoinFlip() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(987.77, this.ctx.currentTime); // B5
      osc.frequency.exponentialRampToValueAtTime(1318.51, this.ctx.currentTime + 0.25); // E6

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch {
      // AudioContext interaction safeguard
    }
  }

  /**
   * Dice rolling rattle
   */
  public playDiceRoll() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      for (let i = 0; i < 5; i++) {
        const time = i * 0.05;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(300 + Math.random() * 200, now + time);

        gain.gain.setValueAtTime(0.04, now + time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + 0.04);
      }
    } catch {
      // AudioContext interaction safeguard
    }
  }
}

export const sounds = new SoundManager();
