import * as THREE from 'three';
import { solidMat } from '../shared';

export type TrophyTier = 'gold' | 'silver' | 'star';

const cupProfile = [
  [0.001, 0],
  [0.85, 0],
  [0.85, 0.18],
  [0.5, 0.3],
  [0.28, 0.45],
  [0.26, 1.0],
  [0.6, 1.15],
  [1.15, 2.2],
  [1.2, 3.0],
  [1.0, 3.0],
  [0.9, 2.3],
  [0.001, 2.0],
].map(([x, y]) => new THREE.Vector2(x, y));

const starShape = () => {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.62 : 1.45;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i) s.lineTo(x, y);
    else s.moveTo(x, y);
  }
  s.closePath();
  return s;
};

let cupGeo: THREE.LatheGeometry | null = null;
let starGeo: THREE.ExtrudeGeometry | null = null;
let handleGeo: THREE.TorusGeometry | null = null;

export const makeTrophy = (tier: TrophyTier) => {
  const g = new THREE.Group();
  const gold = solidMat('#ffc933', 0.28, 0.95, '#ff9d00', 0.28);
  const silver = solidMat('#d4dcec', 0.3, 0.95, '#8aa0c0', 0.18);
  const copper = solidMat('#ee9a55', 0.3, 0.9, '#ff7a00', 0.22);
  if (tier === 'star') {
    starGeo ??= new THREE.ExtrudeGeometry(starShape(), { depth: 0.4, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 1 }).center();
    const star = new THREE.Mesh(starGeo, copper);
    star.position.y = 1.9;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.3, 0.7, 10), silver);
    stem.position.y = 0.35;
    g.add(star, stem);
    return { group: g, spin: star };
  }
  const metal = tier === 'gold' ? gold : silver;
  cupGeo ??= new THREE.LatheGeometry(cupProfile, 36);
  handleGeo ??= new THREE.TorusGeometry(0.55, 0.07, 8, 20, Math.PI);
  const cup = new THREE.Mesh(cupGeo, metal);
  (cup.material as THREE.Material).side = THREE.DoubleSide;
  const holder = new THREE.Group();
  holder.add(cup);
  for (const sd of [-1, 1]) {
    const h = new THREE.Mesh(handleGeo, metal);
    h.rotation.z = (-sd * Math.PI) / 2;
    h.position.set(sd * 1.1, 2.0, 0);
    holder.add(h);
  }
  g.add(holder);
  return { group: g, spin: holder };
};
