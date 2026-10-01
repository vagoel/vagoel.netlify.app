const PENTATONIC = [0, 2, 4, 7, 9];

export class Sound {
  on = false;
  private ctx?: AudioContext;
  private master?: GainNode;
  private wind?: GainNode;

  private init() {
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const pad = ctx.createGain();
    pad.gain.value = 0.05;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 520;
    filter.connect(pad).connect(master);
    [110, 164.81, 220, 277.18].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i % 2 ? 'sine' : 'sawtooth';
      o.frequency.value = f;
      o.detune.value = (i - 1.5) * 6;
      o.connect(filter);
      o.start();
    });
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.07;
    lfoGain.gain.value = 260;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();

    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) d[i] = last = (last + (Math.random() * 2 - 1) * 0.05) / 1.02;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 700;
    band.Q.value = 0.6;
    this.wind = ctx.createGain();
    this.wind.gain.value = 0;
    noise.connect(band).connect(this.wind).connect(master);
    noise.start();

    this.ctx = ctx;
    this.master = master;
  }

  toggle() {
    if (!this.ctx) this.init();
    const ctx = this.ctx!;
    this.on = !this.on;
    void ctx.resume();
    this.master!.gain.cancelScheduledValues(ctx.currentTime);
    this.master!.gain.linearRampToValueAtTime(this.on ? 0.7 : 0, ctx.currentTime + 0.6);
    return this.on;
  }

  setSpeed(s: number) {
    if (!this.on || !this.ctx || !this.wind) return;
    this.wind.gain.setTargetAtTime(Math.min(1, s) * 0.22, this.ctx.currentTime, 0.2);
  }

  ping(i: number) {
    if (!this.on || !this.ctx || !this.master) return;
    const ctx = this.ctx;
    [0, 1, 2].forEach((k) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const semi = PENTATONIC[(i + k * 2) % 5] + 12 * (1 + Math.floor((i + k * 2) / 5) % 2);
      o.type = 'sine';
      o.frequency.value = 220 * Math.pow(2, semi / 12);
      const t = ctx.currentTime + k * 0.09;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.14, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
      o.connect(g).connect(this.master!);
      o.start(t);
      o.stop(t + 1.2);
    });
  }
}
