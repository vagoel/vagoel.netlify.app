import * as THREE from 'three';
import { chapters, type PaletteDef } from '../data/chapters';
import { lerp } from '../utils/math';

export interface RuntimePalette {
  top: THREE.Color;
  horizon: THREE.Color;
  fog: THREE.Color;
  accent: THREE.Color;
  accent2: THREE.Color;
  sun: THREE.Color;
  stars: number;
  aurora: number;
  fogDensity: number;
}

const make = (d: PaletteDef): RuntimePalette => ({
  top: new THREE.Color(d.top),
  horizon: new THREE.Color(d.horizon),
  fog: new THREE.Color(d.fog),
  accent: new THREE.Color(d.accent),
  accent2: new THREE.Color(d.accent2),
  sun: new THREE.Color(d.sun),
  stars: d.stars,
  aurora: d.aurora,
  fogDensity: d.fogDensity,
});

export const chapterPalettes = chapters.map((c) => make(c.palette));
export const createPalette = () => make(chapters[0].palette);

export const blendPalette = (a: RuntimePalette, b: RuntimePalette, t: number, out: RuntimePalette) => {
  out.top.copy(a.top).lerp(b.top, t);
  out.horizon.copy(a.horizon).lerp(b.horizon, t);
  out.fog.copy(a.fog).lerp(b.fog, t);
  out.accent.copy(a.accent).lerp(b.accent, t);
  out.accent2.copy(a.accent2).lerp(b.accent2, t);
  out.sun.copy(a.sun).lerp(b.sun, t);
  out.stars = lerp(a.stars, b.stars, t);
  out.aurora = lerp(a.aurora, b.aurora, t);
  out.fogDensity = lerp(a.fogDensity, b.fogDensity, t);
  return out;
};
