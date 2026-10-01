import * as THREE from 'three';
import { chapters } from '../data/chapters';
import { lerp, smoothstep } from '../utils/math';

export interface Frame {
  pos: THREE.Vector3;
  fwd: THREE.Vector3;
  right: THREE.Vector3;
  yaw: number;
}

export interface Anchor extends Frame {
  u: number;
  p: number;
  dist: number;
}

const DWELL = 0.72;
const SCROLL_UNIT = 150;

export class Layout {
  readonly curve: THREE.CatmullRomCurve3;
  readonly length: number;
  readonly samples: THREE.Vector3[];
  readonly anchors: Anchor[] = [];
  private readonly tmp = new THREE.Vector3();

  constructor() {
    const n = chapters.length;
    const base: THREE.Vector3[] = [];
    let z = 0;
    chapters.forEach((c, i) => {
      const x = i === 0 ? 0 : Math.sin(i * 1.15) * 34 + Math.sin(i * 0.41 + 1) * 18;
      const y = c.elevation + (c.elevation < 1 ? Math.sin(i * 0.9) * 1.5 : Math.sin(i * 1.7) * 1.5);
      base.push(new THREE.Vector3(x, y, z));
      z -= c.gap;
    });

    const pts: THREE.Vector3[] = [new THREE.Vector3(base[0].x + 4, base[0].y, base[0].z + 90), new THREE.Vector3(base[0].x + 2, base[0].y, base[0].z + 40)];
    base.forEach((b, i) => {
      pts.push(b);
      if (i < n - 1) {
        const nx = base[i + 1];
        pts.push(new THREE.Vector3((b.x + nx.x) / 2 + (i % 2 ? 1 : -1) * 16, (b.y + nx.y) / 2, (b.z + nx.z) / 2));
      }
    });
    const last = base[n - 1];
    pts.push(new THREE.Vector3(last.x, last.y, last.z - 60), new THREE.Vector3(last.x, last.y, last.z - 120));

    this.curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    this.curve.arcLengthDivisions = 3000;
    this.length = this.curve.getLength();
    this.samples = this.curve.getSpacedPoints(Math.ceil(this.length / 2));

    const scrollLens = chapters.slice(0, n - 1).map((c) => c.gap / SCROLL_UNIT);
    const total = scrollLens.reduce((a, b) => a + b, 0);
    let acc = 0;
    chapters.forEach((_, i) => {
      const target = base[i];
      let best = 0;
      let bd = Infinity;
      this.samples.forEach((s, j) => {
        const d = s.distanceToSquared(target);
        if (d < bd) {
          bd = d;
          best = j;
        }
      });
      const u = best / (this.samples.length - 1);
      this.anchors.push({ ...this.frameAt(u), u, p: acc / total, dist: u * this.length });
      acc += scrollLens[i] ?? 0;
    });
  }

  frameAt(u: number): Frame {
    const uu = THREE.MathUtils.clamp(u, 0, 1);
    const pos = this.curve.getPointAt(uu);
    const t = this.curve.getTangentAt(uu, this.tmp);
    const fwd = new THREE.Vector3(t.x, 0, t.z).normalize();
    const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
    return { pos, fwd, right, yaw: Math.atan2(-fwd.x, -fwd.z) };
  }

  locate(p: number) {
    const a = this.anchors;
    const pc = THREE.MathUtils.clamp(p, 0, 1);
    let i = 0;
    while (i < a.length - 2 && pc >= a[i + 1].p) i++;
    const local = THREE.MathUtils.clamp((pc - a[i].p) / (a[i + 1].p - a[i].p || 1), 0, 1);
    const eased = lerp(local, smoothstep(0, 1, local), DWELL);
    return { seg: i, local, eased, u: lerp(a[i].u, a[i + 1].u, eased) };
  }

  nearestAnchor(u: number) {
    let best = 0;
    this.anchors.forEach((a, i) => {
      if (Math.abs(a.u - u) < Math.abs(this.anchors[best].u - u)) best = i;
    });
    return best;
  }

  nearest(p: number) {
    const { seg, local } = this.locate(p);
    return local < 0.5 ? seg : seg + 1;
  }
}
