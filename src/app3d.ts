import { chapters } from './data/chapters';
import { Experience } from './scene/experience';
import { Sound } from './ui/audio';
import { Hud } from './ui/hud';
import { ScrollDriver } from './ui/scroll';
import type { Capabilities } from './utils/device';
import { clamp } from './utils/math';

export interface Loader {
  set(fraction: number, message: string): void;
  hide(): void;
}

export const boot3D = async (caps: Capabilities, params: URLSearchParams, loader: Loader, goClassic: () => void) => {
  document.documentElement.classList.add('is-3d');
  const canvas = document.getElementById('gl') as HTMLCanvasElement;
  const q = params.get('q');
  const exp = await Experience.create({
    canvas,
    caps,
    tier: q != null ? (clamp(Math.round(Number(q)), 0, 2) as 0 | 1 | 2) : undefined,
    locked: q != null,
    initialP: clamp(Number(params.get('p')) || 0),
    progress: loader.set,
  });

  const anchors = exp.layout.anchors.map((a) => a.p);
  const gaps = chapters.slice(0, -1).reduce((a, c) => a + c.gap, 0) / 150;
  const scroll = new ScrollDriver(document.getElementById('scroll-space')!, anchors, 1 + gaps * 0.72);
  scroll.onProgress = (p) => exp.setTarget(p);
  scroll.set(clamp(Number(params.get('p')) || 0));

  const sound = new Sound();
  const hud = new Hud(document.getElementById('hud')!, document.getElementById('cards')!, document.getElementById('tip')!, scroll, sound, anchors, goClassic);
  // Enable sound on first user gesture (must be a user-activation event for AudioContext)
  const enableSound = () => {
    if (!sound.on) sound.toggle();
    hud.syncSound(true);
    for (const ev of ['pointerdown', 'keydown', 'touchstart'] as const) removeEventListener(ev, enableSound);
  };
  for (const ev of ['pointerdown', 'keydown', 'touchstart'] as const) addEventListener(ev, enableSound, { once: false });
  exp.onFrame = (s) => hud.frame(s);
  exp.onTier = (t) => hud.tier(t);

  let px = 0;
  let py = 0;
  let tipTimer = 0;
  exp.onHover = (info) => {
    hud.showTip(info, px, py);
    if (info) {
      clearTimeout(tipTimer);
      if (matchMedia('(pointer: coarse)').matches) tipTimer = window.setTimeout(() => hud.showTip(null, 0, 0), 3600);
    }
  };
  addEventListener('pointermove', (e) => {
    px = e.clientX;
    py = e.clientY;
    exp.setPointer(px, py);
    hud.moveTip(px, py);
  });
  addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    exp.setPointer(e.clientX, e.clientY);
    px = e.clientX;
    py = e.clientY;
  });
  document.documentElement.addEventListener('pointerleave', () => exp.leavePointer());

  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target as HTMLElement;
    if (t.closest('button, a, input, textarea') && (e.key === ' ' || e.key === 'Enter')) return;
    const next = ['ArrowRight', 'ArrowUp', 'PageUp'].includes(e.key) || (e.key === ' ' && !e.shiftKey);
    const prev = ['ArrowLeft', 'ArrowDown', 'PageDown'].includes(e.key) || (e.key === ' ' && e.shiftKey);
    if (next || prev) {
      e.preventDefault();
      scroll.step(next ? 1 : -1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      scroll.chapter(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      scroll.chapter(chapters.length - 1);
    }
  });

  let resizeTimer = 0;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      exp.resize();
      scroll.layout();
    }, 120);
  });

  if (params.has('debug')) (window as unknown as { __resume: unknown }).__resume = { exp, scroll };

  exp.start();
  loader.hide();
};
