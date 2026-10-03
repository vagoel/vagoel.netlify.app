import * as THREE from 'three';
import { certs, fmtMonth, honors, sideQuest, skillGroups } from '../../data/profile';
import { damp, smoothstep } from '../../utils/math';
import { label } from '../labels';
import { basicMat, geo, holoMat, solidMat } from '../shared';
import { burst, groundPad, island, makePortal, mesh, put, softDot, tint } from './helpers';
import { makeTrophy, type TrophyTier } from './trophy';
import type { Builder, Kit } from './types';

const hex = (kit: Kit) => `#${kit.accent.getHexString()}`;

const heading = (kit: Kit, text: string, sub: string) => {
  const g = new THREE.Group();
  const a = label(text, { size: 52, weight: 700, glow: hex(kit), height: 2.4 });
  const b = label(sub.toUpperCase(), { size: 24, spacing: 4, color: '#cfe3ff', height: 0.85 });
  b.position.y = -1.9;
  g.add(a, b);
  return g;
};

export const skills: Builder = (kit) => {
  const group = new THREE.Group();
  const total = skillGroups.reduce((n, g) => n + g.skills.length, 0);
  const nodes = new THREE.InstancedMesh(geo.sphere(), new THREE.MeshBasicMaterial({ color: '#ffffff' }), total);
  nodes.frustumCulled = false;
  interface Node {
    name: string;
    group: string;
    color: THREE.Color;
    base: THREE.Vector3;
    sprite: THREE.Sprite;
  }
  const list: Node[] = [];
  const hubs: THREE.Vector3[] = [];
  const link: number[] = [];
  const treeLink: number[] = [];

  skillGroups.forEach((g, gi) => {
    const z = 50 - gi * 25;
    const hub = new THREE.Vector3((gi % 2 ? 1 : -1) * 20, 7 + -z * 0.1 + gi * 0.8, z);
    hubs.push(hub);
    const color = new THREE.Color(g.color);
    const core = mesh(geo.sphere(), new THREE.MeshBasicMaterial({ color: tint(color, 2.6) }), hub.x, hub.y, hub.z);
    core.scale.setScalar(1.35);
    const shell = mesh(geo.sphere(), holoMat({ color, power: 1.4 }), hub.x, hub.y, hub.z);
    shell.scale.setScalar(2.4);
    const name = label(g.name, { size: 46, weight: 700, color: '#ffffff', glow: g.color, glowBlur: 20, height: 1.9 });
    name.position.set(hub.x, hub.y + 4.6, hub.z);
    group.add(core, shell, name);
    const k = g.skills.length;
    g.skills.forEach((s, si) => {
      const t = (si + 0.5) / k;
      const y = 1 - 2 * t;
      const r = Math.sqrt(1 - y * y);
      const a = si * 2.399963 + gi;
      const base = new THREE.Vector3(Math.cos(a) * r, y * 0.8, Math.sin(a) * r).multiplyScalar(7.6).add(hub);
      const sprite = label(s, { size: 28, weight: 600, color: '#ffffff', glow: g.color, glowBlur: 10, height: 1.0 });
      sprite.position.copy(base).add(new THREE.Vector3(0, 1.15, 0));
      group.add(sprite);
      link.push(hub.x, hub.y, hub.z, base.x, base.y, base.z);
      list.push({ name: s, group: g.name, color, base, sprite });
    });
    if (gi) treeLink.push(hubs[gi - 1].x, hubs[gi - 1].y, hubs[gi - 1].z, hub.x, hub.y, hub.z);
  });
  const segs = (arr: number[], c: THREE.Color, o: number) => {
    const l = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)), new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: o }));
    l.frustumCulled = false;
    return l;
  };
  group.add(nodes, segs(link, tint(kit.accent, 1.4), 0.28), segs(treeLink, new THREE.Color('#ffffff'), 0.55));

  const dust = new Float32Array(300 * 3);
  for (let i = 0; i < 300; i++) dust.set([(kit.rand() - 0.5) * 90, -6 + kit.rand() * 42, (kit.rand() - 0.5) * 150], i * 3);
  const stars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(dust, 3)), new THREE.PointsMaterial({ color: tint(kit.accent, 1.8), size: 0.9, map: softDot(), transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
  stars.frustumCulled = false;
  group.add(stars, put(heading(kit, 'Skill constellation', 'walk through the branches'), 0, 30, 12));

  kit.pick(nodes, (hit) => {
    const n = hit.instanceId != null ? list[hit.instanceId] : null;
    return n ? { title: n.name, subtitle: n.group, color: `#${n.color.getHexString()}` } : null;
  });

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const c = new THREE.Color();
  return {
    group,
    update: (f) => {
      list.forEach((n, i) => {
        const d = f.local.distanceTo(n.base);
        const lit = smoothstep(52, 9, d);
        p.copy(n.base);
        p.y += Math.sin(f.t * 0.9 + i * 1.7) * 0.35;
        s.setScalar(0.4 + lit * 0.45);
        nodes.setMatrixAt(i, m.compose(p, q, s));
        nodes.setColorAt(i, c.copy(n.color).multiplyScalar(0.35 + lit * 2.4));
        n.sprite.visible = d < 56;
        n.sprite.material.opacity = smoothstep(56, 30, d);
        n.sprite.position.y = p.y + 1.15 + lit * 0.2;
      });
      nodes.instanceMatrix.needsUpdate = true;
      if (nodes.instanceColor) nodes.instanceColor.needsUpdate = true;
    },
  };
};

export const quest: Builder = (kit) => {
  const group = new THREE.Group();
  const wrap = new THREE.Group();
  wrap.position.set(kit.side * 14, 9, 0);
  wrap.rotation.y = -kit.side * (Math.PI / 2);
  wrap.scale.setScalar(0.78);
  group.add(wrap, island(kit, 13, kit.side * 14, -0.4, 0));

  const orb = mesh(geo.sphere(), holoMat({ color: kit.accent, power: 1.3 }));
  orb.scale.setScalar(3.1);
  const core = mesh(geo.sphere(), basicMat(kit.accent2, 2.6));
  core.scale.setScalar(1.5);
  wrap.add(orb, core);

  const N = 72;
  const bars = new THREE.InstancedMesh(geo.boxBase(), new THREE.MeshBasicMaterial({ color: '#ffffff' }), N);
  bars.frustumCulled = false;
  const col = new THREE.Color();
  for (let i = 0; i < N; i++) bars.setColorAt(i, col.copy(kit.accent).lerp(kit.accent2, 0.5 + 0.5 * Math.sin((i / N) * Math.PI * 4)).multiplyScalar(2.2));
  wrap.add(bars);

  const waves = [0, 1, 2].map(() => {
    const w = mesh(new THREE.TorusGeometry(1, 0.03, 6, 80), new THREE.MeshBasicMaterial({ color: tint(kit.accent, 2), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    wrap.add(w);
    return w;
  });

  const chips = new THREE.Group();
  wrap.add(chips);
  const chipList = sideQuest.prompts.map((t, i) => {
    const s = label(t, { size: 30, weight: 600, pill: 'rgba(8,18,36,0.82)', pillBorder: hex(kit), glow: hex(kit), glowBlur: 8, height: 1.5 });
    chips.add(s);
    return { s, a: (i / sideQuest.prompts.length) * Math.PI * 2, y: (i - 1) * 2.4 };
  });
  wrap.add(put(heading(kit, sideQuest.title, 'say it · the web does it'), 0, 11.5, 0));
  kit.pick(wrap, { title: sideQuest.title, subtitle: sideQuest.context, body: sideQuest.summary, color: hex(kit) });

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  return {
    group,
    update: (f) => {
      const voice = 0.35 + 0.65 * Math.max(0, Math.sin(f.t * 1.1)) ** 1.5;
      core.scale.setScalar(1.5 + voice * 0.5);
      for (let i = 0; i < N; i++) {
        const th = (i / N) * Math.PI * 2;
        const amp = (0.5 + 0.5 * Math.sin(f.t * 5 + th * 5)) * (0.55 + 0.45 * Math.sin(f.t * 1.9 + th * 2));
        const len = 0.5 + amp * 3.8 * voice;
        q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), th - Math.PI / 2);
        m.compose(p.set(Math.cos(th) * 5.4, Math.sin(th) * 5.4, 0), q, s.set(0.3, len, 0.3));
        bars.setMatrixAt(i, m);
      }
      bars.instanceMatrix.needsUpdate = true;
      waves.forEach((w, i) => {
        const ph = (f.t * 0.32 + i / 3) % 1;
        w.scale.setScalar(6.5 + ph * 11);
        (w.material as THREE.MeshBasicMaterial).opacity = (1 - ph) * 0.55 * voice;
      });
      chipList.forEach((c) => {
        const a = c.a + f.t * 0.3;
        c.s.position.set(Math.cos(a) * 10.5, c.y + Math.sin(f.t + c.a) * 0.4, Math.sin(a) * 10.5);
      });
    },
  };
};

export const honorsRoom: Builder = (kit) => {
  const group = new THREE.Group();
  const tierRank: Record<TrophyTier, number> = { gold: 0, silver: 1, star: 2 };
  const sorted = [...honors].sort((a, b) => tierRank[a.tier] - tierRank[b.tier]);
  const cx = kit.side * 20;
  group.add(island(kit, 34, cx, -0.4, 0));
  const ped = solidMat('#141a34', 0.4, 0.6);
  const ringMat = new THREE.MeshBasicMaterial({ color: tint(kit.accent, 2.2) });
  const scales: Record<TrophyTier, number> = { gold: 0.7, silver: 0.55, star: 0.5 };
  const targets: number[] = [];
  const holders = sorted.map((h, i) => {
    const z = (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 6.8 * (i === 0 ? 0 : 1);
    const x = cx + Math.abs(z) * 0.14;
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.add(mesh(new THREE.CylinderGeometry(1.5, 1.85, 1.6, 24), ped, 0, 0.8, 0));
    const r = mesh(new THREE.TorusGeometry(1.52, 0.06, 6, 40), ringMat, 0, 1.62, 0);
    r.rotation.x = Math.PI / 2;
    const t = makeTrophy(h.tier);
    const pivot = new THREE.Group();
    pivot.position.y = 1.7;
    pivot.scale.setScalar(scales[h.tier]);
    pivot.add(t.group);
    const tag = label(`${h.title}\n${h.org}`, { size: 26, weight: 600, color: '#ffffff', glow: hex(kit), glowBlur: 8, height: 1.7, lineHeight: 1.3 });
    tag.position.set(0, 6.2 + (h.tier === 'gold' ? 0.8 : 0), 0);
    g.add(r, pivot, tag);
    group.add(g);
    targets.push(1);
    kit.pick(g, { title: h.title, subtitle: `${h.event} · ${h.org}${h.date ? ` · ${fmtMonth(h.date)}` : ''}`, body: h.note, color: hex(kit) }, (on) => (targets[i] = on ? 1.25 : 1));
    return { g, pivot, spin: t.spin, tag };
  });
  const fx = burst({
    count: kit.tier === 0 ? 100 : 200,
    bursts: 6,
    gap: 0.9,
    life: 2.6,
    speed: 6,
    gravity: 3,
    size: 4,
    colors: [new THREE.Color('#ffd54a'), kit.accent.clone(), new THREE.Color('#ffffff')],
    origin: (_, r) => new THREE.Vector3(cx + (r() - 0.5) * 8, 6 + r() * 4, (r() - 0.5) * 24),
    seed: 5,
  });
  group.add(fx.points, put(heading(kit, 'Trophy room', `${honors.length} honors collected`), cx, 14.5, 0));

  return {
    group,
    update: (f) => {
      holders.forEach((h, i) => {
        h.spin.rotation.y += f.dt * 0.9;
        h.pivot.position.y = 1.7 + Math.sin(f.t * 1.2 + i) * 0.12;
        const k = damp(h.g.scale.x, targets[i], 8, f.dt);
        h.g.scale.setScalar(k);
        const d = f.local.distanceTo(h.g.position);
        h.tag.material.opacity = smoothstep(26, 11, d);
        h.tag.visible = d < 28;
      });
      fx.setOn(smoothstep(0.1, 0.5, f.w));
    },
  };
};

const coinTexture = (short: string, date: string, accent: string) => {
  const S = 512;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const x = cv.getContext('2d')!;
  const g = x.createRadialGradient(S / 2, S / 2, 20, S / 2, S / 2, S / 2);
  g.addColorStop(0, '#16213f');
  g.addColorStop(1, '#070b1a');
  x.fillStyle = g;
  x.fillRect(0, 0, S, S);
  x.strokeStyle = accent;
  x.lineWidth = 14;
  x.beginPath();
  x.arc(S / 2, S / 2, S / 2 - 20, 0, Math.PI * 2);
  x.stroke();
  x.lineWidth = 3;
  x.globalAlpha = 0.6;
  x.beginPath();
  x.arc(S / 2, S / 2, S / 2 - 52, 0, Math.PI * 2);
  x.stroke();
  x.globalAlpha = 1;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillStyle = '#ffffff';
  x.shadowColor = accent;
  x.shadowBlur = 24;
  const size = short.length > 6 ? 92 : short.length > 4 ? 120 : 160;
  x.font = `700 ${size}px "Space Grotesk Variable", system-ui, sans-serif`;
  x.fillText(short, S / 2, S / 2 - 6);
  x.shadowBlur = 0;
  x.fillStyle = accent;
  x.font = '600 38px "Space Grotesk Variable", system-ui, sans-serif';
  x.fillText('CERTIFIED', S / 2, 120);
  x.fillStyle = '#b8c7e8';
  x.font = '600 44px "Space Grotesk Variable", system-ui, sans-serif';
  x.fillText(fmtMonth(date).toUpperCase(), S / 2, S - 118);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
};

export const certsRing: Builder = (kit) => {
  const group = new THREE.Group();
  const center = new THREE.Group();
  center.position.y = 8;
  group.add(center, groundPad(kit, 20));
  const spin = new THREE.Group();
  center.add(spin);
  const body = solidMat('#c9a24a', 0.3, 0.9, '#8a5a00', 0.2);
  const bodyGeo = new THREE.CylinderGeometry(1.95, 1.95, 0.3, 48);
  bodyGeo.rotateX(Math.PI / 2);
  const faceGeo = new THREE.CircleGeometry(1.86, 56);
  const R = 20;
  const targets: number[] = certs.map(() => 1);
  const pivots = certs.map((c, i) => {
    const a = (i / certs.length) * Math.PI * 2;
    const pv = new THREE.Group();
    pv.position.set(Math.cos(a) * R, 0, Math.sin(a) * R);
    pv.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a));
    const tex = coinTexture(c.short, c.date, hex(kit));
    const face = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, color: new THREE.Color(1.35, 1.35, 1.35) });
    const front = mesh(faceGeo, face, 0, 0, 0.16);
    const back = mesh(faceGeo, face, 0, 0, -0.16);
    back.rotation.y = Math.PI;
    const inner = new THREE.Group();
    inner.add(mesh(bodyGeo, body), front, back);
    pv.add(inner);
    spin.add(pv);
    kit.pick(pv, { title: c.title, subtitle: `${c.issuer} · ${fmtMonth(c.date)}`, color: hex(kit) }, (on) => (targets[i] = on ? 1.2 : 1));
    return { pv, inner };
  });
  center.add(put(heading(kit, 'Certifications', `${certs.length} badges unlocked`), 0, 9, -R * 0.8));
  const sparks = new Float32Array(240 * 3);
  for (let i = 0; i < 240; i++) {
    const a = kit.rand() * Math.PI * 2;
    const r = 6 + kit.rand() * 18;
    sparks.set([Math.cos(a) * r, -7 + kit.rand() * 22, Math.sin(a) * r], i * 3);
  }
  const dust = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(sparks, 3)), new THREE.PointsMaterial({ color: tint(kit.accent2, 1.8), size: 0.8, map: softDot(), transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
  center.add(dust);

  return {
    group,
    update: (f) => {
      spin.rotation.y += f.dt * 0.1;
      pivots.forEach((p, i) => {
        p.inner.position.y = Math.sin(f.t * 1.1 + i * 0.9) * 0.45;
        p.inner.rotation.z = Math.sin(f.t * 0.6 + i) * 0.06;
        p.inner.scale.setScalar(damp(p.inner.scale.x, targets[i], 8, f.dt));
      });
    },
  };
};

export const contact: Builder = (kit) => {
  const group = new THREE.Group();
  const portal = makePortal(kit, 11);
  portal.group.position.set(0, 12.5, -34);
  group.add(portal.group, island(kit, 30, 0, -0.4, -12));
  const fx = burst({
    count: kit.tier === 0 ? 240 : 560,
    bursts: 8,
    gap: 0.85,
    life: 2.6,
    speed: 15,
    gravity: 6,
    size: 6,
    colors: [kit.accent.clone(), kit.accent2.clone(), new THREE.Color('#ffd54a'), new THREE.Color('#ffffff')],
    origin: (_, r) => new THREE.Vector3((r() - 0.5) * 60, 20 + r() * 16, -34 - r() * 12),
    seed: 21,
  });
  const top = label('LEVEL COMPLETE', { size: 64, weight: 700, spacing: 12, glow: hex(kit), glowBlur: 30, height: 3 });
  top.position.set(0, 31, -34);
  const sub = label('THANKS FOR PLAYING', { size: 26, spacing: 8, color: '#cfe3ff', height: 1 });
  sub.position.set(0, 27.6, -34);
  group.add(fx.points, top, sub);
  return {
    group,
    update: (f) => {
      portal.update(f.dt);
      fx.setOn(smoothstep(0.3, 0.8, f.w));
    },
  };
};
