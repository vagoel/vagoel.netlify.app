import * as THREE from 'three';
import { rng } from '../../utils/noise';
import { finishGlsl, fogGlsl, geo, hashGlsl, portalMat, shared, solidMat } from '../shared';
import { label } from '../labels';
import type { FrameCtx, Kit } from './types';

let dotTex: THREE.CanvasTexture | null = null;
export const softDot = () => {
  if (dotTex) return dotTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d')!;
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  dotTex = new THREE.CanvasTexture(c);
  return dotTex;
};

export const tint = (c: THREE.Color, k: number) => c.clone().multiplyScalar(k);

export const put = <T extends THREE.Object3D>(o: T, x = 0, y = 0, z = 0) => {
  o.position.set(x, y, z);
  return o;
};

export const mesh = (g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => put(new THREE.Mesh(g, m), x, y, z);

export const edgeLines = (g: THREE.BufferGeometry, color: THREE.ColorRepresentation, opacity = 1) =>
  new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }));

export const groundPad = (kit: Kit, radius: number, x = 0, z = 0) => {
  const g = new THREE.Group();
  const ring = mesh(new THREE.RingGeometry(radius * 0.94, radius, 72), new THREE.MeshBasicMaterial({ color: tint(kit.accent, 1.8), side: THREE.DoubleSide, transparent: true, opacity: 0.9 }));
  const fill = mesh(new THREE.CircleGeometry(radius, 72), new THREE.MeshBasicMaterial({ color: tint(kit.accent, 0.35), transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending }));
  const inner = mesh(new THREE.RingGeometry(radius * 0.55, radius * 0.56, 72), new THREE.MeshBasicMaterial({ color: tint(kit.accent2, 1.2), side: THREE.DoubleSide, transparent: true, opacity: 0.6 }));
  [ring, fill, inner].forEach((m) => (m.rotation.x = -Math.PI / 2));
  g.add(ring, fill, inner);
  g.position.set(x, 0.12, z);
  return g;
};

export const island = (kit: Kit, radius: number, x = 0, y = 0, z = 0) => {
  const g = new THREE.Group();
  const rock = solidMat('#141a30', 0.9, 0.1);
  g.add(mesh(new THREE.CylinderGeometry(radius, radius * 0.96, 1.2, 48), solidMat('#0e1226', 0.8, 0.3), 0, -0.6, 0));
  g.add(mesh(new THREE.CylinderGeometry(radius * 0.96, radius * 0.08, radius * 0.9, 11, 1), rock, 0, -1.2 - radius * 0.45, 0));
  const rim = mesh(new THREE.TorusGeometry(radius * 0.985, 0.16, 8, 96), new THREE.MeshBasicMaterial({ color: tint(kit.accent, 2.2) }), 0, 0, 0);
  rim.rotation.x = Math.PI / 2;
  g.add(rim);
  for (const k of [0.66, 0.33]) {
    const r = mesh(new THREE.RingGeometry(radius * k - 0.06, radius * k + 0.06, 80), new THREE.MeshBasicMaterial({ color: tint(kit.accent2, 0.9), transparent: true, opacity: 0.55, side: THREE.DoubleSide }), 0, 0.02, 0);
    r.rotation.x = -Math.PI / 2;
    g.add(r);
  }
  g.position.set(x, y, z);
  return g;
};

export const checkpoint = (kit: Kit, text: string) => {
  const g = new THREE.Group();
  const glow = new THREE.MeshBasicMaterial({ color: tint(kit.accent, 2.2) });
  const dark = solidMat('#10152a', 0.5, 0.6);
  for (const sd of [-1, 1]) {
    const p = mesh(geo.boxBase(), dark, sd * 6, 0, 0);
    p.scale.set(0.7, 8.2, 0.7);
    const cap = mesh(geo.box(), glow, sd * 6, 8.3, 0);
    cap.scale.set(0.95, 0.3, 0.95);
    const line = mesh(geo.boxBase(), glow, sd * 6, 0, 0.38);
    line.scale.set(0.12, 8, 0.05);
    g.add(p, cap, line);
  }
  const beam = mesh(geo.box(), glow, 0, 8.5, 0);
  beam.scale.set(12.7, 0.34, 0.34);
  const veil = mesh(
    geo.plane(),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: { ...shared, uGlow: { value: 0.2 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform vec3 uAccent; uniform float uGlow, uTime; varying vec2 vUv;
        void main(){ float a = pow(max(vUv.y, 0.0), 2.5) * uGlow * (0.8 + 0.2 * sin(vUv.x * 40.0 + uTime * 2.0)); gl_FragColor = vec4(uAccent * 1.4, a); ${finishGlsl} }`,
    }),
    0,
    4.2,
    0,
  );
  veil.scale.set(11.5, 8.4, 1);
  const tag = label(text, { size: 34, spacing: 5, color: '#ffffff', glow: `#${kit.accent.getHexString()}`, glowBlur: 18, height: 1.15 });
  tag.position.set(0, 10.4, 0);
  g.add(beam, veil, tag);
  const mat = veil.material as THREE.ShaderMaterial;
  return {
    group: g,
    update: (f: FrameCtx, z = -14) => {
      const near = Math.exp(-Math.pow(f.local.z - z, 2) / 260);
      glow.color.copy(kit.accent).multiplyScalar(1.6 + near * 2.4);
      mat.uniforms.uGlow.value = 0.12 + near * 0.55;
    },
  };
};

export const makePortal = (kit: Kit, radius: number) => {
  const g = new THREE.Group();
  const ring = mesh(new THREE.TorusGeometry(radius, radius * 0.04, 14, 120), new THREE.MeshBasicMaterial({ color: tint(kit.accent, 1.35) }));
  const ring2 = mesh(new THREE.TorusGeometry(radius * 1.2, radius * 0.01, 8, 120), new THREE.MeshBasicMaterial({ color: tint(kit.accent2, 1.7) }));
  const ring3 = mesh(new THREE.TorusGeometry(radius * 1.35, radius * 0.008, 8, 120), new THREE.MeshBasicMaterial({ color: tint(kit.accent, 1.6), transparent: true, opacity: 0.6 }));
  const disc = mesh(new THREE.CircleGeometry(radius * 0.96, 80), portalMat(kit.accent, kit.accent2));
  g.add(ring, ring2, ring3, disc);
  for (const sd of [-1, 1]) {
    const pylon = mesh(geo.boxBase(), solidMat('#10152a', 0.5, 0.6), sd * radius * 1.45, -radius, 0);
    pylon.scale.set(radius * 0.18, radius * 1.1, radius * 0.18);
    const light = mesh(geo.boxBase(), new THREE.MeshBasicMaterial({ color: tint(kit.accent2, 2.2) }), sd * radius * 1.45, -radius, radius * 0.1);
    light.scale.set(radius * 0.025, radius * 1.05, radius * 0.025);
    g.add(pylon, light);
  }
  return {
    group: g,
    update: (dt: number) => {
      ring2.rotation.z += dt * 0.25;
      ring3.rotation.z -= dt * 0.18;
    },
  };
};

export interface BurstOpts {
  count: number;
  bursts: number;
  gap: number;
  life: number;
  speed: number;
  gravity: number;
  size: number;
  colors: THREE.Color[];
  origin: (i: number, r: () => number) => THREE.Vector3;
  spherical?: boolean;
  seed?: number;
}

export const burst = (o: BurstOpts) => {
  const r = rng(o.seed ?? 3);
  const origin = new Float32Array(o.count * 3);
  const vel = new Float32Array(o.count * 3);
  const col = new Float32Array(o.count * 3);
  const start = new Float32Array(o.count);
  const per = Math.floor(o.count / o.bursts);
  const centers: THREE.Vector3[] = [];
  for (let b = 0; b < o.bursts; b++) centers.push(o.origin(b, r));
  for (let i = 0; i < o.count; i++) {
    const b = Math.min(o.bursts - 1, Math.floor(i / per));
    centers[b].toArray(origin, i * 3);
    const th = r() * Math.PI * 2;
    const ph = o.spherical === false ? r() * 0.9 : Math.acos(2 * r() - 1);
    const sp = o.speed * (0.35 + r() * 0.65);
    const v = o.spherical === false ? [Math.cos(th) * Math.sin(ph) * sp, Math.cos(ph) * sp + o.speed * 0.5, Math.sin(th) * Math.sin(ph) * sp] : [Math.cos(th) * Math.sin(ph) * sp, Math.cos(ph) * sp, Math.sin(th) * Math.sin(ph) * sp];
    vel.set(v, i * 3);
    o.colors[(b + (i % 3)) % o.colors.length].toArray(col, i * 3);
    start[i] = b * o.gap + r() * 0.15;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(origin, 3));
  g.setAttribute('aVel', new THREE.BufferAttribute(vel, 3));
  g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aStart', new THREE.BufferAttribute(start, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { ...shared, uCycle: { value: o.bursts * o.gap }, uLife: { value: o.life }, uGravity: { value: o.gravity }, uSize: { value: o.size }, uOn: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute vec3 aVel; attribute vec3 aColor; attribute float aStart;
      uniform float uTime, uCycle, uLife, uGravity, uSize, uOn, uPx;
      varying vec3 vC; varying float vA;
      void main() {
        float t = mod(uTime - aStart, uCycle);
        float alive = step(t, uLife);
        vec3 p = position + aVel * t - vec3(0.0, uGravity, 0.0) * 0.5 * t * t;
        vA = alive * (1.0 - t / uLife) * uOn;
        vC = aColor;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uPx * uSize * clamp(220.0 / -mv.z, 0.4, 2.6) * (0.35 + 0.65 * vA);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vC; varying float vA;
      void main() { float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)); gl_FragColor = vec4(vC * 2.0, a * vA); ${finishGlsl} }`,
  });
  const points = new THREE.Points(g, mat);
  points.frustumCulled = false;
  return { points, setOn: (v: number) => (mat.uniforms.uOn.value = v) };
};

export interface Building {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
}

export const skyline = (b: Building[], color: THREE.ColorRepresentation, warm = 0.35) => {
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...shared, uTint: { value: new THREE.Color(color) }, uWarm: { value: warm } },
    vertexShader: /* glsl */ `
      varying vec3 vW; varying vec3 vN; varying float vDepth; varying float vInst; varying float vLocalY;
      void main() {
        vec4 lp = vec4(position, 1.0);
        vLocalY = position.y + 0.5;
        #ifdef USE_INSTANCING
          lp = instanceMatrix * lp; vInst = float(gl_InstanceID);
        #else
          vInst = 0.0;
        #endif
        vec4 wp = modelMatrix * lp; vec4 mv = viewMatrix * wp;
        vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uTint; uniform float uWarm, uTime;
      varying vec3 vW; varying vec3 vN; varying float vDepth; varying float vInst; varying float vLocalY;
      ${fogGlsl}
      ${hashGlsl}
      void main() {
        float hc = abs(vN.x) > 0.5 ? vW.z : vW.x;
        vec2 cell = vec2(hc / 2.2, vW.y / 3.0);
        vec2 id = floor(cell); vec2 f = fract(cell);
        float win = step(0.2, f.x) * step(f.x, 0.8) * step(0.28, f.y) * step(f.y, 0.72);
        float on = step(0.6, hash21(id + vec2(vInst * 7.7, 3.1)));
        float flick = 0.85 + 0.15 * sin(uTime * 2.0 + hash21(id) * 40.0);
        float roof = step(0.8, vN.y);
        vec3 wc = mix(uTint, vec3(1.0, 0.82, 0.55), uWarm * hash21(id * 1.7 + 4.0));
        vec3 col = vec3(0.012, 0.015, 0.035) + uTint * 0.03 * (0.5 + vLocalY);
        col += win * on * wc * 1.5 * flick * (1.0 - roof);
        col += roof * uTint * 0.5 + uTint * pow(max(vLocalY, 0.0), 14.0) * 0.4 * (1.0 - roof);
        col = mix(col, uFogColor, fogAmount(vDepth));
        gl_FragColor = vec4(col, 1.0);
        ${finishGlsl}
      }`,
  });
  const im = new THREE.InstancedMesh(geo.box(), mat, b.length);
  const m = new THREE.Matrix4();
  b.forEach((s, i) => {
    m.compose(new THREE.Vector3(s.x, s.h / 2, s.z), new THREE.Quaternion(), new THREE.Vector3(s.w, s.h, s.d));
    im.setMatrixAt(i, m);
  });
  im.frustumCulled = false;
  return im;
};

export const scatterBuildings = (kit: Kit, count: number, cx: number, cz: number, rMin: number, rMax: number, hMin: number, hMax: number, accept: (x: number, z: number) => boolean = () => true): Building[] => {
  const out: Building[] = [];
  for (let i = 0; i < count * 6 && out.length < count; i++) {
    const a = kit.rand() * Math.PI * 2;
    const r = rMin + Math.sqrt(kit.rand()) * (rMax - rMin);
    const x = cx + Math.cos(a) * r;
    const z = cz + Math.sin(a) * r;
    if (!accept(x, z)) continue;
    const near = 1 - r / rMax;
    out.push({ x, z, w: 3 + kit.rand() * 5, d: 3 + kit.rand() * 5, h: hMin + (hMax - hMin) * Math.pow(kit.rand(), 1.6) * (0.5 + near) });
  }
  return out;
};

export const beamMat = (color: THREE.ColorRepresentation, strength = 0.35) =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color(color) }, uStrength: { value: strength } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 uColor; uniform float uStrength; varying vec2 vUv; void main(){ gl_FragColor = vec4(uColor * 1.6, pow(max(vUv.y, 0.0), 1.6) * uStrength); ${finishGlsl} }`,
  });

