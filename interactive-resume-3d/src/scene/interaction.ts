import * as THREE from 'three';
import type { PickInfo, PickSource } from './chapters/types';

interface Entry {
  object: THREE.Object3D;
  source: PickSource;
  hover?: (on: boolean) => void;
  chapter: number;
}

export interface PickResult {
  info: PickInfo;
  entry: Entry;
}

export class Picker {
  private readonly entries: Entry[] = [];
  private readonly ray = new THREE.Raycaster();
  private readonly active = new Set<number>();
  private hovered: Entry | null = null;

  register(chapter: number, object: THREE.Object3D, source: PickSource, hover?: (on: boolean) => void) {
    this.entries.push({ object, source, hover, chapter });
  }

  setActive(chapters: number[]) {
    this.active.clear();
    chapters.forEach((c) => this.active.add(c));
  }

  pick(ndc: THREE.Vector2, camera: THREE.Camera): PickResult | null {
    this.ray.setFromCamera(ndc, camera);
    let best: { d: number; res: PickResult } | null = null;
    for (const e of this.entries) {
      if (!this.active.has(e.chapter)) continue;
      const hits = this.ray.intersectObject(e.object, true);
      for (const h of hits) {
        const info = typeof e.source === 'function' ? e.source(h) : e.source;
        if (info && (!best || h.distance < best.d)) best = { d: h.distance, res: { info, entry: e } };
        if (info) break;
      }
    }
    const next = best?.res.entry ?? null;
    if (next !== this.hovered) {
      this.hovered?.hover?.(false);
      next?.hover?.(true);
      this.hovered = next;
    }
    return best?.res ?? null;
  }

  clear() {
    this.hovered?.hover?.(false);
    this.hovered = null;
  }
}
