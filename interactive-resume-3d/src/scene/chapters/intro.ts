import * as THREE from 'three';
import { stats } from '../../data/profile';
import { label } from '../labels';
import { geo, holoMat } from '../shared';
import { groundPad, makePortal, mesh, put, tint } from './helpers';
import type { Builder } from './types';

export const hero: Builder = (kit) => {
  const group = new THREE.Group();
  const portal = makePortal(kit, 11.5);
  portal.group.position.set(0, 12.5, 40);
  group.add(portal.group, groundPad(kit, 9, 0, 0));

  const n = kit.tier === 0 ? 40 : 90;
  const shards = new THREE.InstancedMesh(geo.octa(), new THREE.MeshBasicMaterial({ color: '#ffffff' }), n);
  const halo = new THREE.Group();
  const m = new THREE.Matrix4();
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const a = kit.rand() * Math.PI * 2;
    const r = 17 + kit.rand() * 14;
    const s = 0.25 + kit.rand() * 0.8;
    m.compose(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, (kit.rand() - 0.5) * 10), new THREE.Quaternion().setFromEuler(new THREE.Euler(kit.rand() * 3, kit.rand() * 3, 0)), new THREE.Vector3(s, s * 1.8, s));
    shards.setMatrixAt(i, m);
    shards.setColorAt(i, c.copy(kit.rand() < 0.5 ? kit.accent : kit.accent2).multiplyScalar(1.4 + kit.rand() * 1.4));
  }
  shards.frustumCulled = false;
  halo.add(shards);
  halo.position.copy(portal.group.position);
  halo.scale.setScalar(0.85);
  group.add(halo);

  const sign = label('A LEVEL-BY-LEVEL JOURNEY', { size: 30, spacing: 8, color: '#ffffff', glow: `#${kit.accent.getHexString()}`, height: 1.2 });
  sign.position.set(0, 29, 40);
  group.add(sign);

  return {
    group,
    update: (f) => {
      portal.update(f.dt);
      halo.rotation.z += f.dt * 0.06;
    },
  };
};

export const about: Builder = (kit) => {
  const group = new THREE.Group();
  const center = new THREE.Group();
  center.position.set(kit.side * 16, 9, 0);
  group.add(center);

  const core = new THREE.Group();
  core.add(mesh(new THREE.OctahedronGeometry(3.6, 0), holoMat({ color: kit.accent, power: 1.6, scan: 1.2 })));
  const inner = mesh(new THREE.OctahedronGeometry(1.8, 0), new THREE.MeshBasicMaterial({ color: tint(kit.accent2, 2.4) }));
  core.add(inner);
  center.add(core);

  const rings: THREE.Mesh[] = [];
  [7, 9.6, 12.2].forEach((r, i) => {
    const ring = mesh(new THREE.TorusGeometry(r, 0.045, 8, 120), new THREE.MeshBasicMaterial({ color: tint(i % 2 ? kit.accent2 : kit.accent, 1.8), transparent: true, opacity: 0.7 }));
    ring.rotation.set(Math.PI / 2 + (i - 1) * 0.35, 0, i * 0.8);
    rings.push(ring);
    center.add(ring);
  });

  const orbit = new THREE.Group();
  center.add(orbit);
  const items = stats();
  const sats = items.map((s, i) => {
    const a = (i / items.length) * Math.PI * 2;
    const g = new THREE.Group();
    g.position.set(Math.cos(a) * 10.5, Math.sin(i * 2.1) * 3.2, Math.sin(a) * 10.5);
    const dot = mesh(geo.sphere(), new THREE.MeshBasicMaterial({ color: tint(i % 2 ? kit.accent2 : kit.accent, 2.2) }));
    dot.scale.setScalar(0.5);
    g.add(dot);
    const v = label(s.value, { size: 64, weight: 700, glow: `#${kit.accent.getHexString()}`, height: 1.9 });
    v.position.set(0, 1.8, 0);
    const l = label(s.label.toUpperCase(), { size: 24, spacing: 3, color: '#cfe3ff', height: 0.62 });
    l.position.set(0, 0.62, 0);
    g.add(v, l);
    orbit.add(g);
    return g;
  });

  const sparks = new THREE.InstancedMesh(geo.octa(), new THREE.MeshBasicMaterial({ color: '#ffffff' }), 40);
  const m = new THREE.Matrix4();
  const c = new THREE.Color();
  for (let i = 0; i < 40; i++) {
    const s = 0.12 + kit.rand() * 0.3;
    m.compose(new THREE.Vector3((kit.rand() - 0.5) * 34, (kit.rand() - 0.2) * 20, (kit.rand() - 0.5) * 34), new THREE.Quaternion(), new THREE.Vector3(s, s * 1.6, s));
    sparks.setMatrixAt(i, m);
    sparks.setColorAt(i, c.copy(kit.rand() < 0.5 ? kit.accent : kit.accent2).multiplyScalar(2));
  }
  center.add(sparks);
  center.add(groundPad(kit, 11, 0, 0).translateY(-10));

  kit.pick(center, { title: 'Fifteen years, four cities', subtitle: 'India · Singapore · UAE', body: 'From hybrid mobile in Pune to trading desks in Singapore and Abu Dhabi.' });

  return {
    group,
    update: (f) => {
      core.rotation.y += f.dt * 0.5;
      inner.rotation.x += f.dt * 0.9;
      orbit.rotation.y += f.dt * 0.16;
      rings.forEach((r, i) => (r.rotation.z += f.dt * 0.1 * (i % 2 ? -1 : 1)));
      sats.forEach((s, i) => (s.position.y = Math.sin(f.t * 0.8 + i * 2) * 1.2 + Math.sin(i * 2.1) * 3.2));
      put(core, 0, Math.sin(f.t * 0.9) * 0.4, 0);
    },
  };
};
