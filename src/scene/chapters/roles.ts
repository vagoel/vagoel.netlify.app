import * as THREE from 'three';
import { fmtRange, type Role } from '../../data/profile';
import { lerp, smoothstep } from '../../utils/math';
import { label } from '../labels';
import { basicMat, finishGlsl, fogGlsl, geo, hashGlsl, holoMat, shared, solidMat } from '../shared';
import { beamMat, burst, edgeLines, groundPad, mesh, put, scatterBuildings, skyline, tint } from './helpers';
import { makeTrophy } from './trophy';
import type { Builder, Kit } from './types';

const glowText = (kit: Kit) => `#${kit.accent.getHexString()}`;

const rolePick = (kit: Kit, target: THREE.Object3D) => {
  const r = kit.chapter.role as Role;
  kit.pick(target, { title: r.company, subtitle: `${r.title} · ${fmtRange(r)}`, body: r.highlight ?? r.bullets[0], color: glowText(kit) });
};

const stage = (kit: Kit, dist = 19) => {
  const group = new THREE.Group();
  const c = new THREE.Group();
  c.position.set(kit.side * dist, 0, 0);
  group.add(c);
  return { group, c };
};

const title = (kit: Kit, text: string, sub: string, y: number, k = 1) => {
  const g = new THREE.Group();
  const a = label(text, { size: 52, weight: 700, glow: glowText(kit), height: 2.4 * k });
  const b = label(sub.toUpperCase(), { size: 24, spacing: 4, color: '#cfe3ff', height: 0.85 * k });
  a.position.y = y;
  b.position.y = y - 1.9 * k;
  g.add(a, b);
  return g;
};

export const hy5: Builder = (kit) => {
  const { group, c } = stage(kit, 15);
  c.add(groundPad(kit, 12));
  const hub = new THREE.Group();
  hub.position.y = 8;
  c.add(hub);
  const spin = new THREE.Group();
  const inner = mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), basicMat(kit.accent2, 2.4));
  spin.add(mesh(new THREE.BoxGeometry(3.6, 3.6, 3.6), holoMat({ color: kit.accent, power: 1.3 })), inner, edgeLines(new THREE.BoxGeometry(3.7, 3.7, 3.7), tint(kit.accent, 2.4)));
  hub.add(spin);

  const screen = new THREE.MeshBasicMaterial({ color: tint(kit.accent2, 1.7) });
  const dark = solidMat('#10152a', 0.4, 0.6);
  const specs = [
    { w: 1.5, h: 2.9, r: 7.5, s: 0.55, ph: 0, y: 2.2 },
    { w: 3.4, h: 2.4, r: 9.6, s: -0.4, ph: 2.1, y: -1.4 },
    { w: 4.8, h: 2.9, r: 11.8, s: 0.3, ph: 4.2, y: 0.8 },
  ];
  const devices = specs.map((s) => {
    const d = new THREE.Group();
    d.add(mesh(new THREE.BoxGeometry(s.w, s.h, 0.2), dark), mesh(new THREE.PlaneGeometry(s.w * 0.88, s.h * 0.86), screen, 0, 0, 0.11));
    hub.add(d);
    return d;
  });
  const beamPos = new Float32Array(specs.length * 6);
  const beamGeo = new THREE.BufferGeometry();
  beamGeo.setAttribute('position', new THREE.BufferAttribute(beamPos, 3));
  const beams = new THREE.LineSegments(beamGeo, new THREE.LineBasicMaterial({ color: tint(kit.accent, 2), transparent: true, opacity: 0.55 }));
  beams.frustumCulled = false;
  hub.add(beams);
  c.add(put(title(kit, 'Hy5 Canvas', 'one codebase · every device', 0), 0, 17, 0));
  rolePick(kit, c);

  return {
    group,
    update: (f) => {
      spin.rotation.y += f.dt * 0.5;
      spin.rotation.x += f.dt * 0.2;
      inner.scale.setScalar(1 + Math.sin(f.t * 3) * 0.12);
      specs.forEach((s, i) => {
        const a = f.t * s.s + s.ph;
        const d = devices[i];
        d.position.set(Math.cos(a) * s.r, s.y + Math.sin(f.t * 1.2 + i) * 0.5, Math.sin(a) * s.r);
        d.rotation.y = Math.PI / 2 - a;
        beamPos.set([0, 0, 0, d.position.x, d.position.y, d.position.z], i * 6);
      });
      beamGeo.attributes.position.needsUpdate = true;
    },
  };
};

export const offline: Builder = (kit) => {
  const { group, c } = stage(kit, 15);
  c.add(groundPad(kit, 11));
  const dbMat = solidMat('#121a32', 0.4, 0.6);
  const ringMat = new THREE.MeshBasicMaterial({ color: tint(kit.accent, 2.2) });
  for (let i = 0; i < 4; i++) {
    c.add(mesh(new THREE.CylinderGeometry(2.7, 2.7, 0.95, 40), dbMat, 0, 1 + i * 1.45, 0));
    const r = mesh(new THREE.TorusGeometry(2.72, 0.08, 8, 56), ringMat, 0, 1.5 + i * 1.45, 0);
    r.rotation.x = Math.PI / 2;
    c.add(r);
  }
  const cloudMat = holoMat({ color: kit.accent, power: 1.2, alpha: 1 });
  const cloud = new THREE.Group();
  cloud.position.y = 14.5;
  [
    [0, 0, 0, 2.7],
    [-2.6, -0.6, 0.3, 2],
    [2.6, -0.5, -0.2, 2.1],
    [-1.3, 1, 0.4, 1.8],
    [1.4, 1.1, -0.3, 1.7],
  ].forEach(([x, y, z, s]) => {
    const m = mesh(geo.sphere(), cloudMat, x, y, z);
    m.scale.setScalar(s);
    cloud.add(m);
  });
  c.add(cloud);
  const column = mesh(new THREE.CylinderGeometry(0.06, 0.06, 7.5, 8), new THREE.MeshBasicMaterial({ color: tint(kit.accent, 1.5), transparent: true, opacity: 0.4 }), 0, 10, 0);
  c.add(column);

  const N = 28;
  const packets = new THREE.InstancedMesh(geo.box(), new THREE.MeshBasicMaterial({ color: tint(kit.accent2, 2.4) }), N);
  packets.frustumCulled = false;
  const cur = Array.from({ length: N }, () => new THREE.Vector3(0, 6.2, 0));
  const tgt = new THREE.Vector3();
  const m = new THREE.Matrix4();
  const off = label('OFFLINE', { size: 40, weight: 700, spacing: 6, color: '#ff5470', glow: '#ff5470', height: 1.7 });
  const on = label('SYNCING', { size: 40, weight: 700, spacing: 6, color: '#ffffff', glow: glowText(kit), height: 1.7 });
  off.position.set(0, 19.6, 0);
  on.position.copy(off.position);
  c.add(packets, off, on, put(title(kit, 'Offline-first', 'store locally · sync later', 0), 0, 22.8, 0));
  rolePick(kit, c);
  const dim = new THREE.Color('#ff5470');
  const col = new THREE.Color();

  return {
    group,
    update: (f) => {
      const online = f.t % 8 > 3.6;
      for (let i = 0; i < N; i++) {
        if (online) {
          const s = (f.t * 0.45 + i / N) % 1;
          tgt.set(Math.sin(s * 9 + i) * 0.6 * (1 - s), lerp(6.4, 13.2, s), Math.cos(s * 9 + i) * 0.6 * (1 - s));
        } else {
          const a = i * 0.7 + f.t * 0.35;
          const r = 1.6 + (i % 3) * 0.55;
          tgt.set(Math.cos(a) * r, 6.7 + (i % 4) * 0.4 + Math.sin(f.t * 3 + i) * 0.12, Math.sin(a) * r);
        }
        cur[i].lerp(tgt, 1 - Math.exp(-6 * f.dt));
        m.makeScale(0.5, 0.5, 0.5).setPosition(cur[i]);
        packets.setMatrixAt(i, m);
      }
      packets.instanceMatrix.needsUpdate = true;
      off.visible = !online;
      on.visible = online;
      (cloudMat.uniforms.uColor.value as THREE.Color).copy(col.copy(kit.accent).lerp(dim, online ? 0 : 0.85));
      cloud.scale.setScalar(1 + Math.sin(f.t * 2) * 0.02);
    },
  };
};

export const hackathon: Builder = (kit) => {
  const { group, c } = stage(kit, 14);
  c.scale.setScalar(1.25);
  c.add(groundPad(kit, 12));
  const podium = [
    { x: -3.8, h: 3, n: '2', tier: 'silver' as const, k: 0.95 },
    { x: 0, h: 4.6, n: '1', tier: 'gold' as const, k: 1.3 },
    { x: 3.8, h: 2.2, n: '3', tier: 'star' as const, k: 0.9 },
  ];
  const baseMat = solidMat('#171c36', 0.45, 0.55);
  const plate = new THREE.MeshBasicMaterial({ color: tint(kit.accent, 2.2) });
  const spinners: THREE.Object3D[] = [];
  const beamsM = beamMat(new THREE.Color('#fff3c0'), 0.14);
  const cones: THREE.Mesh[] = [];
  podium.forEach((p) => {
    const b = mesh(geo.boxBase(), baseMat, p.x, 0, 0);
    b.scale.set(3.4, p.h, 3.4);
    const top = mesh(geo.box(), plate, p.x, p.h, 0);
    top.scale.set(3.5, 0.14, 3.5);
    const num = label(p.n, { size: 70, weight: 700, glow: glowText(kit), height: 1.6 });
    num.position.set(p.x, p.h * 0.5, 1.9);
    const t = makeTrophy(p.tier);
    t.group.scale.setScalar(p.k * 0.55);
    t.group.position.set(p.x, p.h + 0.1, 0);
    spinners.push(t.spin);
    const cone = mesh(new THREE.ConeGeometry(2.2, 13, 28, 1, true), beamsM, p.x, p.h + 6.5, 0);
    cone.scale.set(1, 1, 1);
    cones.push(cone);
    c.add(b, top, num, t.group, cone);
  });
  const fx = burst({
    count: kit.tier === 0 ? 120 : 260,
    bursts: 5,
    gap: 1.0,
    life: 3.4,
    speed: 7,
    gravity: 5,
    size: 5,
    colors: [new THREE.Color('#ffd54a'), kit.accent.clone(), kit.accent2.clone(), new THREE.Color('#ffffff')],
    origin: (_, r) => new THREE.Vector3((r() - 0.5) * 8, 9 + r() * 3, (r() - 0.5) * 3),
    spherical: false,
    seed: 11,
  });
  c.add(fx.points, put(title(kit, 'Hackathon champion', 'Adobe · Overall winner', 0), 0, 13, 0));
  rolePick(kit, c);

  return {
    group,
    update: (f) => {
      spinners.forEach((s, i) => (s.rotation.y += f.dt * (0.8 + i * 0.1)));
      cones.forEach((k, i) => {
        k.rotation.z = Math.sin(f.t * 0.7 + i * 2) * 0.12;
        k.rotation.x = Math.cos(f.t * 0.6 + i) * 0.1;
      });
      fx.setOn(smoothstep(0.1, 0.5, f.w));
    },
  };
};

const cardMat = (color: THREE.Color) =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: color } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 uColor; varying vec2 vUv;
      void main(){
        float b = min(min(vUv.x, 1.0 - vUv.x) * 2.6, min(vUv.y, 1.0 - vUv.y) * 1.7);
        float edge = 1.0 - smoothstep(0.02, 0.06, b);
        float head = step(0.78, vUv.y) * 0.45;
        float line = (step(0.12, vUv.x) * step(vUv.x, 0.88)) * (step(0.5, fract(vUv.y * 4.5)) * step(vUv.y, 0.7) * step(0.14, vUv.y)) * 0.18;
        float a = 0.08 + edge * 0.9 + head + line;
        gl_FragColor = vec4(uColor * 1.6, a); ${finishGlsl}
      }`,
  });

export const client360: Builder = (kit) => {
  const { group, c } = stage(kit, 16);
  c.add(groundPad(kit, 12));
  const hub = new THREE.Group();
  hub.position.y = 9;
  c.add(hub);
  const globe = mesh(new THREE.SphereGeometry(4, 28, 18), new THREE.MeshBasicMaterial({ color: tint(kit.accent, 1.3), wireframe: true, transparent: true, opacity: 0.45 }));
  const shell = mesh(new THREE.SphereGeometry(3.7, 32, 20), holoMat({ color: kit.accent, power: 1.6 }));
  const core = mesh(geo.sphere(), basicMat(kit.accent2, 2.6));
  core.scale.setScalar(1.3);
  hub.add(globe, shell, core);
  const matA = cardMat(kit.accent);
  const matB = cardMat(kit.accent2);
  const N = 14;
  const ring = new THREE.Group();
  hub.add(ring);
  const cards = Array.from({ length: N }, (_, i) => {
    const card = mesh(new THREE.PlaneGeometry(2.8, 1.8), i % 2 ? matA : matB);
    ring.add(card);
    return card;
  });
  [8.2, 10].forEach((r, i) => {
    const t = mesh(new THREE.TorusGeometry(r, 0.04, 6, 100), new THREE.MeshBasicMaterial({ color: tint(kit.accent, 1.6), transparent: true, opacity: 0.45 }));
    t.rotation.x = Math.PI / 2 + (i ? 0.25 : -0.2);
    hub.add(t);
  });
  c.add(put(title(kit, '360° client view', 'every product · one picture', 0), 0, 17.5, 0));
  rolePick(kit, c);

  return {
    group,
    update: (f) => {
      globe.rotation.y += f.dt * 0.25;
      core.scale.setScalar(1.3 + Math.sin(f.t * 2.4) * 0.12);
      cards.forEach((card, i) => {
        const a = (i / N) * Math.PI * 2 + f.t * 0.22;
        card.position.set(Math.cos(a) * 9.1, Math.sin(i * 1.7 + f.t * 0.5) * 2.1, Math.sin(a) * 9.1);
        card.rotation.y = Math.PI / 2 - a;
      });
    },
  };
};

export const components: Builder = (kit) => {
  const { group, c } = stage(kit, 18);
  const wall = new THREE.Group();
  wall.rotation.y = -kit.side * (Math.PI / 2);
  c.add(wall);
  const cols = 6;
  const rows = 4;
  const N = cols * rows;
  const blocks = new THREE.InstancedMesh(geo.box(), new THREE.MeshBasicMaterial({ color: '#ffffff' }), N);
  blocks.frustumCulled = false;
  const palette = [tint(kit.accent, 1.5), tint(kit.accent2, 1.2), new THREE.Color('#e7ecff'), new THREE.Color('#1b2140'), new THREE.Color('#2a3260')];
  const target: THREE.Vector3[] = [];
  const offset: THREE.Vector3[] = [];
  const delay: number[] = [];
  const depth: number[] = [];
  for (let r = 0; r < rows; r++) {
    for (let k = 0; k < cols; k++) {
      const i = r * cols + k;
      target.push(new THREE.Vector3((k - (cols - 1) / 2) * 2.75, 1.8 + r * 2.75, 0));
      offset.push(new THREE.Vector3((kit.rand() - 0.5) * 40, (kit.rand() - 0.2) * 34, 14 + kit.rand() * 30));
      delay.push((k + r) / (cols + rows) * 0.5);
      depth.push(0.5 + kit.rand() * 1.5);
      blocks.setColorAt(i, palette[Math.floor(kit.rand() * palette.length)]);
    }
  }
  wall.add(blocks);
  const frame = edgeLines(new THREE.BoxGeometry(cols * 2.75 + 0.6, rows * 2.75 + 0.6, 0.2), tint(kit.accent, 1.6), 0.6);
  frame.position.set(0, 1.8 + ((rows - 1) * 2.75) / 2, -0.4);
  wall.add(frame);
  wall.add(groundPad(kit, 14).translateY(0));
  c.add(put(title(kit, 'Component library', 'accessible · testable · composable', 0), 0, 17.5, 0));
  rolePick(kit, c);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();

  return {
    group,
    update: (f) => {
      const assemble = smoothstep(0.1, 0.8, f.w);
      for (let i = 0; i < N; i++) {
        const a = smoothstep(0, 1, (assemble - delay[i]) / 0.5);
        const inv = 1 - a;
        p.copy(target[i]).addScaledVector(offset[i], inv);
        p.y += Math.sin(f.t * 1.2 + i) * 0.06 * a;
        e.set(inv * 2.4 * Math.sin(i), inv * 3 * Math.cos(i * 1.3), 0);
        q.setFromEuler(e);
        s.set(2.45, 2.45, depth[i]);
        m.compose(p, q, s);
        blocks.setMatrixAt(i, m);
      }
      blocks.instanceMatrix.needsUpdate = true;
    },
  };
};

const barsMat = (a: THREE.Color, b: THREE.Color) =>
  new THREE.ShaderMaterial({
    uniforms: { ...shared, uA: { value: a }, uB: { value: b } },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying float vY; varying float vH; varying float vDepth;
      void main() {
        vec3 ip = instanceMatrix[3].xyz;
        float w = sin(uTime * 0.9 + ip.x * 0.45 + ip.z * 0.37) * sin(uTime * 0.6 + ip.z * 0.5 - ip.x * 0.2);
        float h = 0.6 + 12.0 * pow(max(0.5 + 0.5 * w, 0.0), 2.0);
        vH = h / 12.6; vY = position.y;
        vec3 lp = vec3(position.x, position.y * h, position.z);
        vec4 wp = modelMatrix * instanceMatrix * vec4(lp, 1.0);
        vec4 mv = viewMatrix * wp; vDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uA, uB; varying float vY; varying float vH; varying float vDepth;
      ${fogGlsl}
      void main() {
        float top = smoothstep(0.9, 1.0, vY);
        vec3 col = mix(uA, uB, vH) * (0.07 + 0.38 * vY * vY) + top * mix(uA, uB, vH) * 1.4;
        col = mix(col, uFogColor, fogAmount(vDepth));
        gl_FragColor = vec4(col, 1.0); ${finishGlsl}
      }`,
  });

const panelMat = (a: THREE.Color, b: THREE.Color, seed: number) =>
  new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    uniforms: { ...shared, uA: { value: a }, uB: { value: b }, uSeed: { value: seed } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: /* glsl */ `
      uniform float uTime, uSeed; uniform vec3 uA, uB; varying vec2 vUv;
      ${hashGlsl}
      float price(float i) { return 0.5 + 0.22 * sin(i * 0.31 + uSeed) + 0.13 * sin(i * 0.83 + uSeed * 2.0) + 0.12 * (hash11(i + uSeed * 7.0) - 0.5); }
      void main() {
        vec2 uv = vUv;
        vec3 col = vec3(0.008, 0.03, 0.055);
        vec2 gq = uv * vec2(24.0, 9.0); vec2 gf = abs(fract(gq - 0.5) - 0.5);
        col += uA * 0.06 * (1.0 - smoothstep(0.0, 0.04, min(gf.x, gf.y)));
        float cols = 28.0; float t = uTime * 0.55 + uSeed;
        float cc = floor(uv.x * cols + fract(t)); float fx = fract(uv.x * cols + fract(t));
        float i = cc + floor(t);
        float o = price(i); float c2 = price(i + 1.0);
        float yo = 0.1 + o * 0.75; float yc = 0.1 + c2 * 0.75;
        float yh = max(yo, yc) + 0.03 * hash11(i * 3.1); float yl = min(yo, yc) - 0.03 * hash11(i * 5.7);
        float body = step(0.16, fx) * step(fx, 0.84) * step(min(yo, yc), uv.y) * step(uv.y, max(yo, yc));
        float wick = step(0.46, fx) * step(fx, 0.54) * step(yl, uv.y) * step(uv.y, yh);
        vec3 cand = c2 >= o ? uB : vec3(1.0, 0.25, 0.35);
        col = mix(col, cand * 1.5, max(body, wick * 0.85) * step(uv.y, 0.88));
        col += uA * 0.35 * step(0.9, uv.y) * (0.6 + 0.4 * step(0.5, fract(uv.x * 9.0)));
        float b = min(min(uv.x, 1.0 - uv.x) * 14.0, min(uv.y, 1.0 - uv.y) * 8.5);
        col += uA * 1.8 * (1.0 - smoothstep(0.06, 0.14, b));
        gl_FragColor = vec4(col, 0.93); ${finishGlsl}
      }`,
  });

export const cat: Builder = (kit) => {
  const { group, c } = stage(kit, 21);
  c.add(groundPad(kit, 15));
  const n = 11;
  const bars = new THREE.InstancedMesh(geo.boxBase(), barsMat(kit.accent, kit.accent2), n * n);
  bars.frustumCulled = false;
  const m = new THREE.Matrix4();
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) bars.setMatrixAt(i * n + j, m.compose(new THREE.Vector3((i - (n - 1) / 2) * 1.6, 0, (j - (n - 1) / 2) * 1.6), new THREE.Quaternion(), new THREE.Vector3(1.05, 1, 1.05)));
  c.add(bars);

  const far = kit.side;
  const panels: THREE.Mesh[] = [];
  for (let k = 0; k < 5; k++) {
    const phi = (k - 2) * 0.5;
    const dir = new THREE.Vector3(Math.cos(phi) * far, 0, Math.sin(phi));
    const p = mesh(new THREE.PlaneGeometry(14, 8.5), panelMat(kit.accent, kit.accent2, k * 3.7 + 1));
    p.position.copy(dir).multiplyScalar(22).setY(10 + (k % 2) * 1.2);
    p.rotation.y = Math.atan2(-dir.x, -dir.z);
    panels.push(p);
    c.add(p);
  }
  const bossTag = label('BOSS LEVEL', { size: 56, weight: 700, spacing: 10, color: '#ffffff', glow: '#ff3d5a', glowBlur: 26, height: 2.6 });
  bossTag.position.set(far * 8, 26, 0);
  const sub = label('COGNITIVE ALGORITHMIC TRADING', { size: 26, spacing: 5, color: '#cfe3ff', glow: glowText(kit), height: 1 });
  sub.position.set(far * 8, 23.2, 0);
  c.add(bossTag, sub);
  const city = skyline(scatterBuildings(kit, kit.tier === 0 ? 14 : 30, far * 40, 0, 40, 95, 10, 34, (x) => far * x > 12), kit.accent, 0.2);
  c.add(city);
  rolePick(kit, c);

  return {
    group,
    update: (f) => {
      bossTag.material.opacity = 0.75 + 0.25 * Math.sin(f.t * 5) * Math.sin(f.t * 1.7);
      panels.forEach((p, i) => (p.position.y = 10 + (i % 2) * 1.2 + Math.sin(f.t * 0.8 + i) * 0.35));
    },
  };
};

export const adia: Builder = (kit) => {
  const { group, c } = stage(kit, 32);
  c.add(groundPad(kit, 20));
  const H = 66;
  const tower = mesh(geo.boxBase(), holoMat({ color: kit.accent, power: 2, scan: 1.4, alpha: 0.5, intensity: 0.8 }));
  tower.scale.set(8.5, H, 8.5);
  const coreMat = new THREE.MeshBasicMaterial({ color: tint(kit.accent, 1.1) });
  const core = mesh(geo.boxBase(), coreMat);
  core.scale.set(1.8, H, 1.8);
  c.add(tower, core);
  const floors = new THREE.InstancedMesh(geo.box(), new THREE.MeshBasicMaterial({ color: tint(kit.accent, 1.1) }), 11);
  const m = new THREE.Matrix4();
  for (let i = 0; i < 11; i++) floors.setMatrixAt(i, m.compose(new THREE.Vector3(0, 5 + i * 5.6, 0), new THREE.Quaternion(), new THREE.Vector3(9.1, 0.18, 9.1)));
  c.add(floors);

  const crown = new THREE.Group();
  crown.position.y = H + 8;
  const nodes: THREE.Vector3[] = [];
  const NN = 44;
  for (let i = 0; i < NN; i++) {
    const y = 1 - (i / (NN - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const a = i * 2.399963;
    nodes.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r).multiplyScalar(7.5));
  }
  const edgePos: number[] = [];
  for (let i = 0; i < NN; i++) for (let j = i + 1; j < NN; j++) if (nodes[i].distanceTo(nodes[j]) < 4.7) edgePos.push(...nodes[i].toArray(), ...nodes[j].toArray());
  const lines = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(edgePos, 3)), new THREE.LineBasicMaterial({ color: tint(kit.accent2, 1.8), transparent: true, opacity: 0.6 }));
  const dots = new THREE.InstancedMesh(geo.sphere(), new THREE.MeshBasicMaterial({ color: tint(kit.accent, 2.6) }), NN);
  nodes.forEach((p, i) => dots.setMatrixAt(i, m.compose(p, new THREE.Quaternion(), new THREE.Vector3(0.38, 0.38, 0.38))));
  const aiCore = mesh(geo.ico(), basicMat(kit.accent2, 2.8));
  aiCore.scale.setScalar(2.2);
  crown.add(lines, dots, aiCore);
  c.add(crown);

  const rings = [20, 38, 56].map((y, i) => {
    const r = mesh(new THREE.TorusGeometry(10 + i * 1.8, 0.1, 8, 96), new THREE.MeshBasicMaterial({ color: tint(i % 2 ? kit.accent2 : kit.accent, 2), transparent: true, opacity: 0.8 }), 0, y, 0);
    r.rotation.x = Math.PI / 2 + (i - 1) * 0.12;
    c.add(r);
    return r;
  });
  const spire = mesh(new THREE.CylinderGeometry(0.22, 0.22, 420, 8, 1, true), beamMat(kit.accent2, 0.9), 0, H + 8 + 210, 0);
  c.add(spire);

  const buildings = scatterBuildings(kit, kit.tier === 0 ? 22 : 48, 0, 0, 20, 85, 6, 28, (x, z) => kit.side * x > -16 && Math.hypot(x, z) > 14);
  c.add(skyline(buildings, kit.accent, 0.75));
  const tag = title(kit, 'ADIA', 'senior specialist · present day', 0, 1.9);
  tag.position.set(-kit.side * 14, 36, 0);
  c.add(tag);
  rolePick(kit, c);

  return {
    group,
    update: (f) => {
      crown.rotation.y += f.dt * 0.3;
      crown.rotation.x = Math.sin(f.t * 0.4) * 0.1;
      aiCore.scale.setScalar(2.2 + Math.sin(f.t * 3) * 0.25);
      aiCore.rotation.y += f.dt;
      coreMat.color.copy(kit.accent).multiplyScalar(0.9 + Math.sin(f.t * 2) * 0.25);
      rings.forEach((r, i) => (r.rotation.z += f.dt * (0.25 + i * 0.1) * (i % 2 ? -1 : 1)));
    },
  };
};
