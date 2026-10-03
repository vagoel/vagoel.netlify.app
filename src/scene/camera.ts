import * as THREE from 'three';
import type { Chapter } from '../data/chapters';
import { damp, lerp } from '../utils/math';
import type { Frame } from './layout';

export interface Preset {
  az: number;
  el: number;
  dist: number;
  fr: number;
  fu: number;
  ff: number;
  fov: number;
  shift: number;
  lift: number;
}

const P = (az: number, el: number, dist: number, fr: number, fu: number, ff: number, fov: number, shift = 0, lift = 0): Preset => ({ az, el, dist, fr, fu, ff, fov, shift, lift });

export const presetFor = (c: Chapter): Preset => {
  const s = c.side;
  const free = -s * 0.17;
  switch (c.kind) {
    case 'hero':
      return P(2.95, 0.06, 17, 0, 5.2, 0, 50, 0, 0.11);
    case 'skills':
      return P(-0.15, 0.2, 26, 0, 10, -10, 62, -0.15);
    case 'certs':
      return P(0.2, 0.18, 14, 0, 8, -6, 64, -0.15);
    case 'contact':
      return P(0.22, 0.14, 26, 0, 10, -18, 58, -0.12);
    case 'honors':
      return P(0.45, 0.18, 24, s * 11, 7, 0, 60, free);
    default: {
      if (c.id === 'adia') return P(-0.5 * s, 0.24, 52, s * 18, 22, -2, 62, free);
      if (c.kind === 'quest') return P(-0.5 * s, 0.18, 25, s * 11.5, 8.5, -2, 58, free * 0.8);
      if (c.role?.boss) return P(-0.5 * s, 0.2, 34, s * 12, 12, -4, 60, free);
      return P(-0.5 * s, 0.18, 25, s * 9, 8.5, -2, 58, free);
    }
  }
};

export class CameraRig {
  readonly camera: THREE.PerspectiveCamera;
  readonly mouse = new THREE.Vector2();
  private readonly pos = new THREE.Vector3();
  private readonly look = new THREE.Vector3();
  private readonly want = new THREE.Vector3();
  private readonly wantLook = new THREE.Vector3();
  private readonly m = new THREE.Vector2();
  private ready = false;
  private fov = 50;
  private w = 1;
  private h = 1;
  private shift = 0;
  private lift = 0;

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.5, 2200);
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.camera.aspect = w / Math.max(1, h);
    this.applyView();
  }

  private applyView() {
    if (this.w < 800) this.camera.setViewOffset(this.w, this.h, 0, Math.max(Math.abs(this.shift) > 0.02 ? this.h * 0.22 : 0, this.lift * this.h * 1.8), this.w, this.h);
    else this.camera.setViewOffset(this.w, this.h, this.shift * this.w, this.lift * this.h, this.w, this.h);
  }

  update(dt: number, time: number, frame: Frame, a: Preset, b: Preset, t: number, speed: number) {
    const k = (key: keyof Preset) => lerp(a[key], b[key], t);
    const az = k('az');
    const el = k('el');
    const portrait = this.camera.aspect < 1 ? 1 + (1 - this.camera.aspect) * 0.95 : 1;
    const dist = k('dist') * portrait;
    const r = dist * Math.cos(el);
    this.m.x = damp(this.m.x, this.mouse.x, 3, dt);
    this.m.y = damp(this.m.y, this.mouse.y, 3, dt);

    this.wantLook.copy(frame.pos).addScaledVector(frame.right, k('fr') * portrait).addScaledVector(frame.fwd, k('ff') * portrait);
    this.wantLook.y += k('fu') * (1 + (portrait - 1) * 0.5);
    this.want.copy(this.wantLook).addScaledVector(frame.right, r * Math.sin(az)).addScaledVector(frame.fwd, -r * Math.cos(az));
    this.want.y += dist * Math.sin(el);

    this.want.addScaledVector(frame.right, this.m.x * 2.4 + Math.sin(time * 0.37) * 0.25);
    this.want.y += this.m.y * 1.4 + Math.sin(time * 0.53) * 0.18;
    this.wantLook.addScaledVector(frame.right, this.m.x * 1.2);
    this.wantLook.y += this.m.y * 0.6;

    if (!this.ready) {
      this.pos.copy(this.want);
      this.look.copy(this.wantLook);
      this.fov = k('fov');
      this.ready = true;
    }
    const f = 1 - Math.exp(-9 * dt);
    this.pos.lerp(this.want, f);
    this.look.lerp(this.wantLook, f);
    this.fov = damp(this.fov, k('fov') + Math.min(1, speed) * 7, 4, dt);

    this.shift = damp(this.shift, k('shift'), 4, dt);
    this.lift = damp(this.lift, k('lift'), 4, dt);
    this.camera.position.copy(this.pos);
    this.camera.lookAt(this.look);
    this.camera.fov = this.fov;
    this.applyView();
  }
}
