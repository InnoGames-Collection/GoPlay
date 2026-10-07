class BubbleSortAudioController {
  private ctx: AudioContext | null = null;
  private isMusicMuted: boolean = false;
  private isSoundMuted: boolean = false;
  private bgmInterval: number | null = null;
  private bgmStep: number = 0;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setSoundMuted(muted: boolean) {
    this.isSoundMuted = muted;
  }

  public setMusicMuted(muted: boolean) {
    this.isMusicMuted = muted;
    if (muted) {
      this.stopBgm();
    } else {
      this.startBgm();
    }
  }

  public toggleSound(): boolean {
    this.isSoundMuted = !this.isSoundMuted;
    return this.isSoundMuted;
  }

  public toggleMusic(): boolean {
    this.isMusicMuted = !this.isMusicMuted;
    if (this.isMusicMuted) {
      this.stopBgm();
    } else {
      this.startBgm();
    }
    return this.isMusicMuted;
  }

  public getSoundMuted(): boolean {
    return this.isSoundMuted;
  }

  public getMusicMuted(): boolean {
    return this.isMusicMuted;
  }

  /**
   * Bubble selection / touch: Light watery droplet
   */
  public playTapSound() {
    if (this.isSoundMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {}
  }

  /**
   * Bubble merge sound: climbs with stage 2 (green), 3 (purple), 4 (orange)
   */
  public playMergeSound(stage: number) {
    if (this.isSoundMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const baseFreq = stage === 2 ? 440 : stage === 3 ? 554.37 : 659.25;
      const notes = stage === 2 ? [baseFreq, baseFreq * 1.25] : stage === 3 ? [baseFreq, baseFreq * 1.2, baseFreq * 1.5] : [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2];

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime + idx * 0.045;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.22);
      });
    } catch {}
  }

  /**
   * Praise celebratory sound: Amazing!, Well Done!, Perfect!, Cool!
   */
  public playPraiseSound() {
    if (this.isSoundMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const chords = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      chords.forEach((freq, idx) => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime + idx * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.05, now + 0.15);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
      });
    } catch {}
  }

  /**
   * Bubble pop / burst
   */
  public playBubblePopSound() {
    if (this.isSoundMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch {}
  }

  /**
   * Flying orb swoosh to progress bar
   */
  public playOrbFlySound() {
    if (this.isSoundMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.3);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  /**
   * Mismatch / error sound
   */
  public playErrorSound() {
    if (this.isSoundMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(160, now + 0.14);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {}
  }

  /**
   * Star reveal chime
   */
  public playStarSound(starIndex: number) {
    if (this.isSoundMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const freq = 659.25 * (1 + starIndex * 0.25);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {}
  }

  /**
   * Level Complete Fanfare
   */
  public playLevelCompleteSound() {
    if (this.isSoundMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime + idx * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.26, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.38);
      });
    } catch {}
  }

  /**
   * Ambient gentle underwater marimba / bubbling BGM loop
   */
  public startBgm() {
    if (this.isMusicMuted || this.bgmInterval !== null) return;
    this.initCtx();

    // Pentatonic watery notes: F4, G4, A4, C5, D5
    const notes = [349.23, 392.0, 440.0, 523.25, 587.33, 523.25, 440.0, 392.0];
    this.bgmStep = 0;

    this.bgmInterval = window.setInterval(() => {
      if (this.isMusicMuted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const freq = notes[this.bgmStep % notes.length];
        this.bgmStep++;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.025, now);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.35);
      } catch {}
    }, 420);
  }

  public stopBgm() {
    if (this.bgmInterval !== null) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const BubbleSortAudio = new BubbleSortAudioController();
