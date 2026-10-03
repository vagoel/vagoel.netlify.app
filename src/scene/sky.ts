import * as THREE from 'three';
import { rng } from '../utils/noise';
import type { RuntimePalette } from './palette';
import { finishGlsl, shared } from './shared';

export class Sky {
  readonly group = new THREE.Group();
  private readonly dome: THREE.Mesh;
  private readonly stars: THREE.Points;
  private readonly domeMat: THREE.ShaderMaterial;
  private readonly starMat: THREE.ShaderMaterial;

  constructor(pixelRatio: number) {
    this.domeMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uTime: shared.uTime,
        uAccent: shared.uAccent,
        uAccent2: shared.uAccent2,
        uTop: { value: new THREE.Color() },
        uHorizon: { value: new THREE.Color() },
        uSun: { value: new THREE.Color() },
        uSunDir: { value: new THREE.Vector3(0.5, 0.12, -1).normalize() },
        uAurora: { value: 0 },
      },
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() { vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uTop, uHorizon, uSun, uSunDir, uAccent, uAccent2; uniform float uTime, uAurora;
        varying vec3 vDir;
        void main() {
          vec3 d = normalize(vDir);
          float h = clamp(d.y, 0.0, 1.0);
          vec3 col = mix(uHorizon * 0.8, uTop, pow(h, 0.42));
          col += uHorizon * exp(-abs(d.y) * 16.0) * 0.4;
          col = mix(col, uHorizon * 0.35, smoothstep(0.0, -0.25, d.y));
          float sd = dot(d, uSunDir);
          float sy = (d.y - uSunDir.y) / 0.05;
          float stripes = sy < 0.0 ? step(fract(-sy * 6.0), clamp(1.0 + sy * 0.85, 0.0, 1.0)) : 1.0;
          float disc = smoothstep(0.9962, 0.9972, sd) * stripes;
          float halo = pow(max(sd, 0.0), 60.0) * 0.6 + pow(max(sd, 0.0), 7.0) * 0.12;
          col += uSun * (disc * 1.8 + halo);
          if (uAurora > 0.001) {
            vec2 q = d.xz / (d.y + 0.28);
            float a = 0.0;
            for (int i = 0; i < 3; i++) {
              float fi = float(i);
              float w = sin(q.x * (1.3 + fi * 0.7) + sin(q.y * (1.1 + fi) + uTime * 0.12 * (fi + 1.0)) * 2.2 + uTime * 0.08 * (fi + 1.0)) * 0.5 + 0.5;
              a += smoothstep(0.6, 1.0, w) * (0.7 - fi * 0.18);
            }
            vec3 ac = mix(uAccent, uAccent2, clamp(q.y * 0.35 + 0.5, 0.0, 1.0));
            col += ac * a * uAurora * smoothstep(0.03, 0.3, d.y) * (1.0 - smoothstep(0.5, 0.95, d.y)) * 0.42;
          }
          gl_FragColor = vec4(col, 1.0);
          ${finishGlsl}
        }`,
    });
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(900, 40, 24), this.domeMat);
    this.dome.renderOrder = -10;
    this.dome.frustumCulled = false;

    const n = 2200;
    const r = rng(42);
    const pos = new Float32Array(n * 3);
    const info = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      const y = r() * 1.05 - 0.05;
      const a = r() * Math.PI * 2;
      const rr = Math.sqrt(1 - Math.min(1, y * y));
      pos.set([Math.cos(a) * rr * 850, y * 850, Math.sin(a) * rr * 850], i * 3);
      info[i * 2] = 0.8 + Math.pow(r(), 3) * 2.4;
      info[i * 2 + 1] = r() * 100;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aInfo', new THREE.BufferAttribute(info, 2));
    this.starMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
      uniforms: { uTime: shared.uTime, uAlpha: { value: 1 }, uPx: { value: pixelRatio } },
      vertexShader: /* glsl */ `
        attribute vec2 aInfo; uniform float uTime, uPx; varying float vTw;
        void main() {
          vTw = 0.55 + 0.45 * sin(uTime * (0.8 + fract(aInfo.y) * 2.0) + aInfo.y);
          gl_PointSize = aInfo.x * uPx * (0.8 + vTw * 0.5);
          vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uAlpha; varying float vTw;
        void main() { vec2 c = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.0, length(c)); gl_FragColor = vec4(vec3(0.85, 0.9, 1.0) * 1.6, a * vTw * uAlpha);
          ${finishGlsl}
        }`,
    });
    this.stars = new THREE.Points(g, this.starMat);
    this.stars.renderOrder = -9;
    this.stars.frustumCulled = false;
    this.group.add(this.dome, this.stars);
  }

  setPixelRatio(px: number) {
    this.starMat.uniforms.uPx.value = px;
  }

  update(cam: THREE.Vector3, pal: RuntimePalette) {
    this.group.position.copy(cam);
    const u = this.domeMat.uniforms;
    u.uTop.value.copy(pal.top);
    u.uHorizon.value.copy(pal.horizon);
    u.uSun.value.copy(pal.sun);
    u.uAurora.value = pal.aurora;
    this.starMat.uniforms.uAlpha.value = pal.stars;
  }
}

export class Dust {
  readonly points: THREE.Points;

  constructor(count: number, pixelRatio: number) {
    const r = rng(9);
    const box = new THREE.Vector3(140, 60, 140);
    const pos = new Float32Array(count * 3);
    const info = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      pos.set([r() * box.x, r() * box.y, r() * box.z], i * 3);
      info[i * 2] = 0.6 + r() * 1.8;
      info[i * 2 + 1] = r() * 50;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aInfo', new THREE.BufferAttribute(info, 2));
    this.points = new THREE.Points(
      g,
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { ...shared, uBox: { value: box }, uPx: { value: pixelRatio } },
        vertexShader: /* glsl */ `
          attribute vec2 aInfo; uniform vec3 uPlayer, uBox; uniform float uTime, uPx; varying float vA; varying float vDepth;
          void main() {
            vec3 p = position + vec3(sin(uTime * 0.3 + aInfo.y) * 3.0, uTime * 0.8 * (0.3 + aInfo.x * 0.2), cos(uTime * 0.25 + aInfo.y) * 3.0);
            vec3 half_ = uBox * 0.5;
            p = mod(p - uPlayer + half_, uBox) - half_ + uPlayer;
            vec4 mv = viewMatrix * vec4(p, 1.0);
            vDepth = -mv.z;
            gl_PointSize = aInfo.x * uPx * clamp(260.0 / vDepth, 0.6, 5.0);
            vA = 0.35 + 0.65 * sin(uTime * 1.3 + aInfo.y * 3.0) * 0.5 + 0.325;
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uAccent, uAccent2, uFogColor; uniform float uFogDensity; varying float vA; varying float vDepth;
          void main() {
            vec2 c = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.05, length(c));
            float f = uFogDensity * vDepth; float fog = 1.0 - exp(-f * f);
            gl_FragColor = vec4(mix(uAccent2, uAccent, 0.5) * 2.0, a * vA * (1.0 - fog) * 0.8);
            ${finishGlsl}
          }`,
      }),
    );
    this.points.frustumCulled = false;
  }
}
