import { clamp, easeInOutCubic } from '../utils/math';

export class ScrollDriver {
  onProgress?: (p: number) => void;
  onTourEnd?: () => void;
  touring = false;
  private max = 1;
  private raf = 0;
  private timer = 0;

  constructor(
    private readonly space: HTMLElement,
    private readonly anchors: number[],
    private readonly screens: number,
  ) {
    this.layout();
    addEventListener('scroll', () => this.onProgress?.(this.progress), { passive: true });
    for (const ev of ['wheel', 'touchstart', 'keydown'] as const) addEventListener(ev, () => this.interrupt(), { passive: true });
  }

  get progress() {
    return clamp(scrollY / this.max);
  }

  layout() {
    const p = this.progress;
    this.space.style.height = `${Math.round(innerHeight * this.screens)}px`;
    this.max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    this.set(p);
  }

  set(p: number) {
    scrollTo(0, clamp(p) * this.max);
    this.onProgress?.(this.progress);
  }

  to(p: number, ms?: number, done?: () => void) {
    cancelAnimationFrame(this.raf);
    const from = scrollY;
    const dest = clamp(p) * this.max;
    const dur = ms ?? clamp((Math.abs(dest - from) / (innerHeight * 3.5)) * 1000 + 700, 900, 3200);
    const t0 = performance.now();
    const step = (now: number) => {
      const k = clamp((now - t0) / dur);
      scrollTo(0, from + (dest - from) * easeInOutCubic(k));
      if (k < 1) this.raf = requestAnimationFrame(step);
      else done?.();
    };
    this.raf = requestAnimationFrame(step);
  }

  chapter(i: number) {
    this.to(this.anchors[clamp(i, 0, this.anchors.length - 1)]);
  }

  step(dir: 1 | -1) {
    const p = this.progress;
    const eps = 0.003;
    let i = -1;
    if (dir > 0) i = this.anchors.findIndex((a) => a > p + eps);
    else for (let k = this.anchors.length - 1; k >= 0; k--) if (this.anchors[k] < p - eps) { i = k; break; }
    if (i >= 0) this.chapter(i);
  }

  interrupt() {
    if (this.touring) this.tour(false);
    cancelAnimationFrame(this.raf);
  }

  tour(on: boolean) {
    const was = this.touring;
    this.touring = on;
    clearTimeout(this.timer);
    if (!on) {
      cancelAnimationFrame(this.raf);
      if (was) this.onTourEnd?.();
      return;
    }
    const next = () => {
      if (!this.touring) return;
      const p = this.progress;
      const i = this.anchors.findIndex((a) => a > p + 0.003);
      if (i < 0) return this.tour(false);
      this.to(this.anchors[i], 2800, () => {
        this.timer = window.setTimeout(next, i === this.anchors.length - 1 ? 0 : 5600);
      });
    };
    next();
  }
}
