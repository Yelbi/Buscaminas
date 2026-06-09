/* ============================================================
   Buscaminas — Audio engine
   All sound is synthesized with the Web Audio API (no asset
   files): SFX for flags/reveals/explosions/win/lose, plus a
   subtle looping arcade music bed. Browser autoplay rules mean
   the context only starts after the first user gesture — see
   unlock(). Preferences persist in localStorage.
   ============================================================ */

export type SfxName =
  | 'flagOn' | 'flagOff' | 'reveal' | 'open' | 'explode' | 'bigExplode'
  | 'win' | 'lose' | 'click' | 'start';

type Win = typeof window & { webkitAudioContext?: typeof AudioContext };

const MUSIC_KEY = 'buscaminas.audio.music';
const SFX_KEY = 'buscaminas.audio.sfx';
const MUSIC_LEVEL = 0.5; // music bus gain (note gains are small, so this must be sizeable)

function readPref(key: string, dflt: boolean): boolean {
  try { const v = localStorage.getItem(key); return v == null ? dflt : v === '1'; } catch { return dflt; }
}
function writePref(key: string, v: boolean): void {
  try { localStorage.setItem(key, v ? '1' : '0'); } catch { /* ignore */ }
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  musicEnabled = readPref(MUSIC_KEY, true);
  sfxEnabled = readPref(SFX_KEY, true);

  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private nextNoteTime = 0;
  private step = 0;
  private listeners = new Set<() => void>();

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private emit(): void { this.listeners.forEach((l) => l()); }

  private ensure(): boolean {
    if (this.ctx) return true;
    const W = window as Win;
    const Ctor = W.AudioContext || W.webkitAudioContext;
    if (!Ctor) return false;
    const ctx = new Ctor();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(ctx.destination);

    this.musicGain = ctx.createGain();
    this.musicGain.gain.value = this.musicEnabled ? MUSIC_LEVEL : 0;
    const warm = ctx.createBiquadFilter(); // soften the loop so it sits behind SFX
    warm.type = 'lowpass';
    warm.frequency.value = 2400;
    this.musicGain.connect(warm).connect(this.master);

    this.sfxGain = ctx.createGain();
    this.sfxGain.gain.value = this.sfxEnabled ? 0.9 : 0;
    this.sfxGain.connect(this.master);

    // Pre-bake a white-noise buffer for explosions.
    const buf = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buf;
    return true;
  }

  /** Call from the first user gesture: resumes the context and starts music. */
  unlock(): void {
    if (!this.ensure() || !this.ctx) return;
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    if (this.musicEnabled) this.startMusic();
  }

  setMusicEnabled(on: boolean): void {
    this.musicEnabled = on;
    writePref(MUSIC_KEY, on);
    if (this.ctx && this.musicGain) {
      const t = this.ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(t);
      this.musicGain.gain.linearRampToValueAtTime(on ? MUSIC_LEVEL : 0, t + 0.25);
    }
    if (on) this.startMusic(); else this.stopMusic();
    this.emit();
  }

  setSfxEnabled(on: boolean): void {
    this.sfxEnabled = on;
    writePref(SFX_KEY, on);
    if (this.ctx && this.sfxGain) this.sfxGain.gain.value = on ? 0.9 : 0;
    this.emit();
  }

  /* ---- SFX ---- */

  private tone(opts: {
    freq: number; dur: number; type?: OscillatorType; gain?: number;
    slideTo?: number; attack?: number; when?: number; dest?: AudioNode;
  }): void {
    if (!this.ctx || !this.sfxGain) return;
    const t0 = (opts.when ?? this.ctx.currentTime);
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = opts.type ?? 'triangle';
    osc.frequency.setValueAtTime(opts.freq, t0);
    if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.slideTo), t0 + opts.dur);
    const peak = opts.gain ?? 0.3;
    const atk = opts.attack ?? 0.005;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
    osc.connect(g).connect(opts.dest ?? this.sfxGain);
    osc.start(t0);
    osc.stop(t0 + opts.dur + 0.02);
  }

  private noise(opts: { dur: number; gain?: number; lpFrom?: number; lpTo?: number; when?: number }): void {
    if (!this.ctx || !this.sfxGain || !this.noiseBuffer) return;
    const t0 = (opts.when ?? this.ctx.currentTime);
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(opts.lpFrom ?? 1400, t0);
    lp.frequency.exponentialRampToValueAtTime(Math.max(60, opts.lpTo ?? 200), t0 + opts.dur);
    const g = this.ctx.createGain();
    const peak = opts.gain ?? 0.5;
    g.gain.setValueAtTime(peak, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
    src.connect(lp).connect(g).connect(this.sfxGain);
    src.start(t0);
    src.stop(t0 + opts.dur + 0.02);
  }

  /** count: for 'open'/'reveal', scales pitch by how many cells broke. */
  play(name: SfxName, count = 1): void {
    if (!this.sfxEnabled) return;
    if (!this.ensure() || !this.ctx) return;
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    const t = this.ctx.currentTime;
    switch (name) {
      case 'flagOn':
        this.tone({ freq: 660, slideTo: 1180, dur: 0.10, type: 'triangle', gain: 0.28 });
        break;
      case 'flagOff':
        this.tone({ freq: 760, slideTo: 420, dur: 0.10, type: 'triangle', gain: 0.22 });
        break;
      case 'reveal':
        this.tone({ freq: 1300, slideTo: 1500, dur: 0.045, type: 'square', gain: 0.10 });
        break;
      case 'open': {
        // A bigger "crumble" when a region opens; brighter the more cells.
        const n = Math.min(8, Math.max(2, count));
        this.noise({ dur: 0.16 + n * 0.01, gain: 0.18, lpFrom: 900 + n * 120, lpTo: 240 });
        this.tone({ freq: 480 + n * 30, slideTo: 220, dur: 0.14, type: 'sine', gain: 0.12 });
        break;
      }
      case 'explode':
        this.noise({ dur: 0.32, gain: 0.42, lpFrom: 1200, lpTo: 160 });
        this.tone({ freq: 90, slideTo: 40, dur: 0.30, type: 'sine', gain: 0.34 });
        break;
      case 'bigExplode':
        this.noise({ dur: 0.5, gain: 0.6, lpFrom: 1800, lpTo: 120 });
        this.tone({ freq: 120, slideTo: 32, dur: 0.5, type: 'sawtooth', gain: 0.4 });
        break;
      case 'win': {
        const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
        notes.forEach((f, i) => this.tone({ freq: f, dur: 0.18, type: 'triangle', gain: 0.26, when: t + i * 0.10 }));
        break;
      }
      case 'lose': {
        const notes = [392, 311, 247, 196];
        notes.forEach((f, i) => this.tone({ freq: f, dur: 0.34, type: 'sawtooth', gain: 0.22, when: t + i * 0.12 }));
        break;
      }
      case 'click':
        this.tone({ freq: 540, dur: 0.04, type: 'square', gain: 0.08 });
        break;
      case 'start':
        this.tone({ freq: 300, slideTo: 900, dur: 0.18, type: 'triangle', gain: 0.2 });
        break;
    }
  }

  /* ---- Music: subtle looping arcade bed ---- */

  // 16-step patterns over a neon minor vibe (Am–F–C–G feel). null = rest.
  private bass: Array<number | null> = [
    110, null, 110, 110, 87.31, null, 87.31, null, 130.81, null, 130.81, 130.81, 98, null, 98, null,
  ];
  private arp = [
    440, 523.25, 659.25, 880, 698.46, 523.25, 659.25, 880,
    523.25, 659.25, 783.99, 1046.5, 587.33, 783.99, 987.77, 587.33,
  ];
  private readonly stepDur = 0.1515; // ~ 99 BPM in 16ths

  startMusic(): void {
    if (!this.ensure() || !this.ctx || this.musicTimer) return;
    if (!this.musicEnabled) return;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.musicTimer = setInterval(() => this.scheduler(), 25);
  }

  stopMusic(): void {
    if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
  }

  private kick(when: number): void {
    this.tone({ freq: 155, slideTo: 46, dur: 0.14, type: 'sine', gain: 0.3, when, dest: this.musicGain ?? undefined });
  }

  private scheduler(): void {
    if (!this.ctx || !this.musicGain) return;
    const lookahead = 0.12;
    while (this.nextNoteTime < this.ctx.currentTime + lookahead) {
      const s = this.step % 16;
      const when = this.nextNoteTime;
      if (s % 4 === 0) this.kick(when);                      // soft pulse on quarter notes
      const b = this.bass[s];
      if (b) this.tone({ freq: b, dur: this.stepDur * 1.7, type: 'sawtooth', gain: 0.16, when, dest: this.musicGain });
      if (s % 2 === 0) {
        const a = this.arp[this.step % this.arp.length];
        if (a) this.tone({ freq: a, dur: this.stepDur * 0.85, type: 'triangle', gain: 0.12, when, dest: this.musicGain });
      }
      this.nextNoteTime += this.stepDur;
      this.step++;
    }
  }
}

export const audio = new AudioEngine();
