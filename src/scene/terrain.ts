import * as THREE from 'three';
import { chapters } from '../data/chapters';
import { smoothstep } from '../utils/math';
import { yieldToMain } from '../utils/async';
import { fbm, ridged, rng } from '../utils/noise';
import type { Layout } from './layout';
import { finishGlsl, fogGlsl, geo, shared } from './shared';

export const ROAD_WIDTH = 7;

export class PathField {
  readonly cell = 6;
  readonly R = 160;
  private readonly x0: number;
  private readonly z0: number;
  private readonly w: number;
  private readonly h: number;
  private readonly d2: Float32Array;

  constructor(samples: THREE.Vector3[]) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const s of samples) {
      minX = Math.min(minX, s.x);
      maxX = Math.max(maxX, s.x);
      minZ = Math.min(minZ, s.z);
      maxZ = Math.max(maxZ, s.z);
    }
    this.x0 = minX - this.R;
    this.z0 = minZ - this.R;
    this.w = Math.ceil((maxX - minX + this.R * 2) / this.cell) + 1;
    this.h = Math.ceil((maxZ - minZ + this.R * 2) / this.cell) + 1;
    this.d2 = new Float32Array(this.w * this.h).fill(this.R * this.R);
    const r = Math.ceil(this.R / this.cell);
    for (let k0 = 0; k0 < samples.length; k0 += 2) {
      const s = samples[k0];
      const ci = Math.round((s.x - this.x0) / this.cell);
      const cj = Math.round((s.z - this.z0) / this.cell);
      for (let j = Math.max(0, cj - r); j <= Math.min(this.h - 1, cj + r); j++) {
        const dz = this.z0 + j * this.cell - s.z;
        for (let i = Math.max(0, ci - r); i <= Math.min(this.w - 1, ci + r); i++) {
          const dx = this.x0 + i * this.cell - s.x;
          const d2 = dx * dx + dz * dz;
          const k = j * this.w + i;
          if (d2 < this.d2[k]) this.d2[k] = d2;
        }
      }
    }
  }

  at(x: number, z: number) {
    const fx = THREE.MathUtils.clamp((x - this.x0) / this.cell, 0, this.w - 1.001);
    const fz = THREE.MathUtils.clamp((z - this.z0) / this.cell, 0, this.h - 1.001);
    const i = Math.floor(fx);
    const j = Math.floor(fz);
    const tx = fx - i;
    const tz = fz - j;
    const k = j * this.w + i;
    const a = Math.sqrt(this.d2[k]);
    const b = Math.sqrt(this.d2[k + 1]);
    const c = Math.sqrt(this.d2[k + this.w]);
    const d = Math.sqrt(this.d2[k + this.w + 1]);
    return (a * (1 - tx) + b * tx) * (1 - tz) + (c * (1 - tx) + d * tx) * tz;
  }
}

export const makeHeightFn = (field: PathField) => (x: number, z: number) => {
  const d = field.at(x, z);
  const m = smoothstep(55, 150, d);
  const peaks = Math.pow(ridged(x * 0.0032 + 11, z * 0.0032 + 7, 4), 2.3);
  const roll = (fbm(x * 0.013, z * 0.013, 3) - 0.5) * 16 * smoothstep(20, 60, d);
  return roll + m * (8 + 170 * peaks);
};

const terrainMaterial = () =>
  new THREE.ShaderMaterial({
    uniforms: { ...shared },
    vertexShader: /* glsl */ `
      varying vec3 vW; varying float vDepth;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vec4 mv = viewMatrix * wp;
        vW = wp.xyz; vDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uAccent, uAccent2, uPlayer; uniform float uTime;
      varying vec3 vW; varying float vDepth;
      ${fogGlsl}
      float grid(vec2 p, float s, float w) {
        vec2 q = p / s; vec2 fw = max(fwidth(q), vec2(1e-4));
        vec2 g = abs(fract(q - 0.5) - 0.5) / fw;
        float l = min(g.x, g.y);
        return (1.0 - clamp(l / w, 0.0, 1.0)) * (1.0 - smoothstep(0.18, 0.45, max(fw.x, fw.y)));
      }
      void main() {
        vec3 cr = cross(dFdx(vW), dFdy(vW));
        vec3 n = dot(cr, cr) > 1e-12 ? normalize(cr) : vec3(0.0, 1.0, 0.0);
        if (n.y < 0.0) n = -n;
        float light = dot(n, normalize(vec3(-0.35, 0.8, -0.45))) * 0.5 + 0.5;
        float h = vW.y;
        vec3 base = mix(vec3(0.012, 0.014, 0.034), uFogColor * 0.55, (0.15 + 0.85 * light) * smoothstep(-6.0, 110.0, h) * 0.9 + 0.08);
        float g1 = grid(vW.xz, 8.0, 1.1);
        float g2 = grid(vW.xz, 40.0, 1.5);
        float fade = 1.0 - smoothstep(260.0, 640.0, vDepth);
        vec3 col = base + (uAccent * g1 * 0.16 + uAccent2 * g2 * 0.6) * fade * (0.35 + light * 0.9);
        col += uAccent2 * smoothstep(20.0, 150.0, h) * 0.07;
        float pd = distance(vW.xz, uPlayer.xz);
        float ring = pd - mod(uTime * 38.0, 300.0);
        col += uAccent * exp(-ring * ring * 0.02) * (g1 * 0.6 + g2 * 0.9 + 0.008) * fade;
        col = mix(col, uFogColor, fogAmount(vDepth));
        gl_FragColor = vec4(col, 1.0);
        ${finishGlsl}
      }`,
  });

export const buildTerrain = async (layout: Layout, heightAt: (x: number, z: number) => number, tier: number) => {
  const group = new THREE.Group();
  const mat = terrainMaterial();
  const size = 320;
  const seg = tier === 0 ? 40 : 64;
  const zs = layout.samples.map((s) => s.z);
  const zMin = Math.min(...zs) - 420;
  const zMax = Math.max(...zs) + 420;
  const xMax = 560;
  for (let cz = Math.floor(zMin / size); cz < Math.ceil(zMax / size); cz++) {
    for (let cx = Math.floor(-xMax / size); cx < Math.ceil(xMax / size); cx++) {
      const g = new THREE.PlaneGeometry(size, size, seg, seg);
      g.rotateX(-Math.PI / 2);
      const p = g.attributes.position as THREE.BufferAttribute;
      const ox = cx * size + size / 2;
      const oz = cz * size + size / 2;
      for (let i = 0; i < p.count; i++) p.setY(i, heightAt(ox + p.getX(i), oz + p.getZ(i)));
      g.computeBoundingSphere();
      const m = new THREE.Mesh(g, mat);
      m.position.set(ox, 0, oz);
      group.add(m);
    }
    await yieldToMain();
  }
  return group;
};

export const buildRoad = (layout: Layout) => {
  const s = layout.samples;
  const n = s.length;
  const pos = new Float32Array(n * 2 * 3);
  const len = new Float32Array(n * 2);
  const side = new Float32Array(n * 2);
  let acc = 0;
  const t = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    if (i) acc += s[i].distanceTo(s[i - 1]);
    t.subVectors(s[Math.min(n - 1, i + 1)], s[Math.max(0, i - 1)]);
    t.y = 0;
    t.normalize();
    const rx = -t.z;
    const rz = t.x;
    for (let k = 0; k < 2; k++) {
      const sd = k ? 1 : -1;
      const o = (i * 2 + k) * 3;
      pos[o] = s[i].x + rx * sd * (ROAD_WIDTH / 2);
      pos[o + 1] = s[i].y + 0.06;
      pos[o + 2] = s[i].z + rz * sd * (ROAD_WIDTH / 2);
      len[i * 2 + k] = acc;
      side[i * 2 + k] = sd;
    }
  }
  const idx: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aLen', new THREE.BufferAttribute(len, 1));
  g.setAttribute('aSide', new THREE.BufferAttribute(side, 1));
  g.setIndex(idx);
  g.computeBoundingSphere();
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...shared },
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      attribute float aLen; attribute float aSide;
      varying float vLen; varying float vSide; varying float vDepth;
      void main() {
        vLen = aLen; vSide = aSide;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vDepth = -mv.z; gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uAccent, uAccent2; uniform float uTime, uPlayerLen;
      varying float vLen; varying float vSide; varying float vDepth;
      ${fogGlsl}
      void main() {
        float a = abs(vSide);
        float lit = smoothstep(uPlayerLen + 4.0, uPlayerLen - 10.0, vLen);
        float edge = smoothstep(0.80, 0.90, a) * (1.0 - smoothstep(0.96, 1.0, a));
        float dash = step(0.5, fract(vLen / 7.0)) * (1.0 - smoothstep(0.03, 0.07, a));
        float pulse = pow(max(0.5 + 0.5 * sin(vLen * 0.09 - uTime * 3.2), 0.0), 10.0) * (1.0 - a) * 0.5;
        vec3 col = vec3(0.012, 0.016, 0.04) + vec3(0.02) * (1.0 - a);
        col += uAccent * edge * (0.45 + 2.2 * lit);
        col += uAccent2 * dash * (0.25 + 1.4 * lit);
        col += uAccent * pulse * (0.3 + lit);
        col += uAccent * 0.05 * lit * (1.0 - a);
        col = mix(col, uFogColor, fogAmount(vDepth));
        gl_FragColor = vec4(col, 1.0);
        ${finishGlsl}
      }`,
  });
  return new THREE.Mesh(g, mat);
};

const accentAt = (u: number, layout: Layout, out: THREE.Color) => {
  const a = layout.anchors;
  let i = 0;
  while (i < a.length - 2 && u >= a[i + 1].u) i++;
  const t = THREE.MathUtils.clamp((u - a[i].u) / (a[i + 1].u - a[i].u || 1), 0, 1);
  const c0 = new THREE.Color(chapters[i].palette.accent);
  const c1 = new THREE.Color(chapters[i + 1].palette.accent);
  return out.copy(c0).lerp(c1, smoothstep(0.3, 0.7, t));
};

export const buildScenery = (layout: Layout, heightAt: (x: number, z: number) => number, tier: number) => {
  const group = new THREE.Group();
  const rand = rng(7);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const col = new THREE.Color();
  const tmpA = new THREE.Color();
  const tmpB = new THREE.Color();
  const n = layout.samples.length;

  const lampSpacing = 11;
  const lampCount = Math.floor(n / lampSpacing);
  const poles = new THREE.InstancedMesh(geo.boxBase(), new THREE.MeshStandardMaterial({ color: '#1a2036', roughness: 0.6, metalness: 0.5 }), lampCount);
  const heads = new THREE.InstancedMesh(geo.sphere(), new THREE.MeshBasicMaterial({ color: '#ffffff' }), lampCount);
  const tri = new THREE.Vector3();
  for (let k = 0; k < lampCount; k++) {
    const i = k * lampSpacing + 3;
    const a = layout.samples[i];
    tri.subVectors(layout.samples[Math.min(n - 1, i + 1)], layout.samples[Math.max(0, i - 1)]).setY(0).normalize();
    const sd = k % 2 ? 1 : -1;
    p.set(a.x + -tri.z * sd * (ROAD_WIDTH / 2 + 1.2), a.y, a.z + tri.x * sd * (ROAD_WIDTH / 2 + 1.2));
    m.compose(p, q.identity(), s.set(0.16, 3.4, 0.16));
    poles.setMatrixAt(k, m);
    m.compose(p.setY(p.y + 3.55), q.identity(), s.set(0.26, 0.26, 0.26));
    heads.setMatrixAt(k, m);
    accentAt(i / (n - 1), layout, col).multiplyScalar(1.5);
    heads.setColorAt(k, col);
  }
  group.add(poles, heads);

  const crystalN = [90, 180, 260][tier];
  const crystals = new THREE.InstancedMesh(geo.octa(), new THREE.MeshBasicMaterial({ color: '#ffffff' }), crystalN);
  const rockN = [60, 120, 190][tier];
  const rocks = new THREE.InstancedMesh(geo.ico(), new THREE.MeshStandardMaterial({ color: '#1b2036', roughness: 0.9, metalness: 0.1, flatShading: true }), rockN);
  let ci = 0;
  let ri = 0;
  const fwd = new THREE.Vector3();
  for (let tries = 0; tries < 2000 && (ci < crystalN || ri < rockN); tries++) {
    const i = Math.floor(rand() * (n - 2)) + 1;
    const a = layout.samples[i];
    fwd.subVectors(layout.samples[i + 1], layout.samples[i - 1]).setY(0).normalize();
    const sd = rand() < 0.5 ? -1 : 1;
    const d = 30 + Math.pow(rand(), 1.3) * 120;
    const x = a.x - fwd.z * sd * d;
    const z = a.z + fwd.x * sd * d;
    const elevated = a.y > 6;
    const accent = accentAt(i / (n - 1), layout, tmpA);
    if (!elevated && heightAt(x, z) > 60) continue;
    if (ci < crystalN && rand() < 0.55) {
      const w = 0.6 + rand() * 1.3;
      const hgt = w * (3 + rand() * 7);
      const y = elevated ? a.y - 8 + rand() * 55 : heightAt(x, z);
      p.set(x, y + (elevated ? 0 : hgt * 0.7), z);
      e.set(0, rand() * 6.28, elevated ? (rand() - 0.5) * 1.4 : 0);
      m.compose(p, q.setFromEuler(e), s.set(w, hgt, w));
      crystals.setMatrixAt(ci, m);
      const near = chapters[layout.nearestAnchor(i / (n - 1))];
      crystals.setColorAt(ci, col.copy(accent).lerp(tmpB.set(near.palette.accent2), rand() * 0.6).multiplyScalar(0.9 + rand() * 0.7));
      ci++;
    } else if (ri < rockN && !elevated) {
      const r = 1.5 + rand() * 4.5;
      p.set(x, heightAt(x, z) + r * 0.2, z);
      e.set(rand() * 3, rand() * 6, rand() * 3);
      m.compose(p, q.setFromEuler(e), s.set(r * (0.8 + rand() * 0.8), r * (0.5 + rand() * 0.6), r * (0.8 + rand() * 0.8)));
      rocks.setMatrixAt(ri++, m);
    }
  }
  crystals.count = ci;
  rocks.count = ri;
  group.add(crystals, rocks);

  const pillars: THREE.Matrix4[] = [];
  for (let i = 0; i < n; i += 16) {
    const a = layout.samples[i];
    if (a.y > 5) pillars.push(new THREE.Matrix4().compose(new THREE.Vector3(a.x, 0, a.z), new THREE.Quaternion(), new THREE.Vector3(0.9, a.y, 0.9)));
  }
  if (pillars.length) {
    const sup = new THREE.InstancedMesh(geo.boxBase(), new THREE.MeshBasicMaterial({ color: new THREE.Color('#6f5cff').multiplyScalar(0.45) }), pillars.length);
    pillars.forEach((pm, i) => sup.setMatrixAt(i, pm));
    group.add(sup);
  }

  [poles, heads, crystals, rocks].forEach((o) => {
    o.instanceMatrix.needsUpdate = true;
    if (o.instanceColor) o.instanceColor.needsUpdate = true;
    o.frustumCulled = false;
  });
  return group;
};
