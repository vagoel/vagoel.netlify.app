import type * as THREE from 'three';
import type { Chapter } from '../../data/chapters';

export interface PickInfo {
  title: string;
  subtitle?: string;
  body?: string;
  color?: string;
}

export type PickSource = PickInfo | ((hit: THREE.Intersection) => PickInfo | null);

export interface FrameCtx {
  t: number;
  dt: number;
  w: number;
  speed: number;
  local: THREE.Vector3;
}

export interface ChapterScene {
  group: THREE.Group;
  update?: (f: FrameCtx) => void;
}

export interface Kit {
  chapter: Chapter;
  accent: THREE.Color;
  accent2: THREE.Color;
  side: number;
  rand: () => number;
  tier: 0 | 1 | 2;
  pick: (target: THREE.Object3D, info: PickSource, hover?: (on: boolean) => void) => void;
}

export type Builder = (kit: Kit) => ChapterScene;
