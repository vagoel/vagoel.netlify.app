import * as THREE from 'three';

export const FONT = '"Space Grotesk Variable", "Space Grotesk", system-ui, sans-serif';

export interface LabelOpts {
  size?: number;
  color?: string;
  weight?: number;
  height?: number;
  glow?: string;
  glowBlur?: number;
  pill?: string;
  pillBorder?: string;
  spacing?: number;
  lineHeight?: number;
}

const cache = new Map<string, { tex: THREE.CanvasTexture; aspect: number }>();

const render = (text: string, o: Required<Pick<LabelOpts, 'size' | 'color' | 'weight' | 'glowBlur' | 'spacing' | 'lineHeight'>> & LabelOpts) => {
  const scale = 2;
  const lines = text.split('\n');
  const px = o.size * scale;
  const pad = (o.pill ? o.size * 0.7 : o.size * 0.5) * scale;
  const measure = document.createElement('canvas').getContext('2d')!;
  const font = `${o.weight} ${px}px ${FONT}`;
  measure.font = font;
  (measure as unknown as { letterSpacing: string }).letterSpacing = `${o.spacing * scale}px`;
  const w = Math.ceil(Math.max(...lines.map((l) => measure.measureText(l).width)) + pad * 2);
  const lh = px * o.lineHeight;
  const h = Math.ceil(lh * lines.length + pad * 1.2);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.font = font;
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${o.spacing * scale}px`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (o.pill) {
    const r = Math.min(h / 2, px);
    ctx.beginPath();
    ctx.roundRect(2, 2, w - 4, h - 4, r);
    ctx.fillStyle = o.pill;
    ctx.fill();
    if (o.pillBorder) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = o.pillBorder;
      ctx.stroke();
    }
  }
  ctx.fillStyle = o.color;
  if (o.glow) {
    ctx.shadowColor = o.glow;
    ctx.shadowBlur = o.glowBlur * scale;
  }
  lines.forEach((l, i) => ctx.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * lh));
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.generateMipmaps = true;
  return { tex, aspect: w / h };
};

export const label = (text: string, opts: LabelOpts = {}) => {
  const o = { size: 36, color: '#ffffff', weight: 600, glowBlur: 14, spacing: 0, lineHeight: 1.25, ...opts };
  const key = JSON.stringify([text, o]);
  let entry = cache.get(key);
  if (!entry) cache.set(key, (entry = render(text, o)));
  const mat = new THREE.SpriteMaterial({ map: entry.tex, transparent: true, depthWrite: false, toneMapped: false, fog: false });
  const sprite = new THREE.Sprite(mat);
  const height = o.height ?? 1.6;
  sprite.scale.set(height * entry.aspect, height, 1);
  sprite.renderOrder = 5;
  return sprite;
};
