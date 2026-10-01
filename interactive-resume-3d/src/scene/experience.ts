import * as THREE from 'three';
import { chapters } from '../data/chapters';
import { yieldToMain as tick } from '../utils/async';
import { clamp, damp, lerpAngle, smoothstep } from '../utils/math';
import { rng } from '../utils/noise';
import type { Capabilities } from '../utils/device';
import { Avatar } from './avatar';
import { CameraRig, presetFor } from './camera';
import { buildChapter } from './chapters';
import type { ChapterScene, FrameCtx, PickInfo } from './chapters/types';
import { FONT } from './labels';
import { Gfx } from './gfx';
import { Picker } from './interaction';
import { Layout } from './layout';
import { blendPalette, chapterPalettes, createPalette } from './palette';
import { shared } from './shared';
import { Dust, Sky } from './sky';
import { PathField, buildRoad, buildScenery, buildTerrain, makeHeightFn } from './terrain';

export interface FrameState {
  p: number;
  target: number;
  speed: number;
  nearest: number;
  dist: number;
  seg: number;
  tier: 0 | 1 | 2;
}

export interface CreateOptions {
  canvas: HTMLCanvasElement;
  caps: Capabilities;
  tier?: 0 | 1 | 2;
  locked: boolean;
  initialP: number;
  progress: (fraction: number, message: string) => void;
}

const WORLD_SPEED_REF = 24;
const CHAPTER_VISIBLE = 520;

export class Experience {
  readonly state: FrameState;
  readonly layout: Layout;
  onFrame?: (s: FrameState) => void;
  onHover?: (info: PickInfo | null) => void;
  onTier?: (tier: 0 | 1 | 2) => void;

  private readonly gfx: Gfx;
  private readonly scene = new THREE.Scene();
  private readonly rig: CameraRig;
  private readonly avatar = new Avatar();
  private readonly sky: Sky;
  private readonly picker = new Picker();
  private readonly presets = chapters.map(presetFor);
  private readonly scenes: ChapterScene[] = [];
  private readonly pal = createPalette();
  private readonly sun: THREE.DirectionalLight;
  private readonly hemi: THREE.HemisphereLight;
  private readonly ndc = new THREE.Vector2(10, 10);
  private readonly local = new THREE.Vector3();
  private readonly ctx: FrameCtx = { t: 0, dt: 0, w: 0, speed: 0, local: this.local };
  private hover: PickInfo | null = null;
  private pointerDirty = false;
  private t = 0;
  private last = 0;
  private uPrev = 0;
  private facingBack = false;
  private yaw = 0;
  private running = false;
  private raf = 0;

  private constructor(private readonly canvas: HTMLCanvasElement, gfx: Gfx, layout: Layout, sky: Sky, initialP: number) {
    this.gfx = gfx;
    this.layout = layout;
    this.sky = sky;
    this.rig = new CameraRig(canvas.clientWidth / Math.max(1, canvas.clientHeight));
    this.rig.resize(canvas.clientWidth || 1, canvas.clientHeight || 1);
    this.state = { p: initialP, target: initialP, speed: 0, nearest: 0, dist: 0, seg: 0, tier: gfx.tier };
    this.hemi = new THREE.HemisphereLight('#9fb4ff', '#1a1030', 0.9);
    this.sun = new THREE.DirectionalLight('#ffffff', 2.2);
    this.scene.add(this.hemi, this.sun, this.sun.target);
    this.scene.fog = new THREE.FogExp2('#2a0f3d', 0.0042);
    this.uPrev = layout.locate(initialP).u;
  }

  static async create(o: CreateOptions): Promise<Experience> {
    const { canvas, caps, progress } = o;
    const tier = o.tier ?? caps.tier;
    progress(0.04, 'Loading fonts');
    await Promise.all([document.fonts.load(`700 48px ${FONT}`), document.fonts.load(`600 48px ${FONT}`)]).catch(() => undefined);

    progress(0.1, 'Surveying the route');
    await tick();
    const layout = new Layout();
    await tick();
    const field = new PathField(layout.samples);
    const heightAt = makeHeightFn(field);
    await tick();

    const gfx = new Gfx(canvas, tier, o.locked);
    gfx.setSize(canvas.clientWidth, canvas.clientHeight);
    shared.uPx.value = gfx.pixelRatio;
    await tick();
    const sky = new Sky(gfx.pixelRatio);
    const dust = new Dust([250, 500, 800][tier], gfx.pixelRatio);
    const exp = new Experience(canvas, gfx, layout, sky, o.initialP);
    await tick();
    gfx.attach(exp.scene, exp.rig.camera);
    await tick();

    progress(0.2, 'Raising mountains');
    await tick();
    exp.scene.add(await buildTerrain(layout, heightAt, tier), buildRoad(layout));

    progress(0.45, 'Lighting the path');
    await tick();
    exp.scene.add(buildScenery(layout, heightAt, tier), sky.group, dust.points, exp.avatar.group);

    for (let i = 0; i < chapters.length; i++) {
      progress(0.55 + (i / chapters.length) * 0.35, `Building level ${i + 1} of ${chapters.length}`);
      await tick();
      exp.addChapter(i);
    }

    progress(0.93, 'Compiling shaders');
    exp.update(0.016, true);
    exp.scenes.forEach((s) => (s.group.visible = true));
    await gfx.renderer.compileAsync(exp.scene, exp.rig.camera).catch(() => undefined);
    exp.update(0.016, true);
    exp.gfx.render();
    progress(1, 'Ready');
    return exp;
  }

  private addChapter(i: number) {
    const c = chapters[i];
    const anchor = this.layout.anchors[i];
    const scene = buildChapter({
      chapter: c,
      accent: new THREE.Color(c.palette.accent),
      accent2: new THREE.Color(c.palette.accent2),
      side: c.side,
      rand: rng(1000 + i * 17),
      tier: this.gfx.tier,
      pick: (target, source, hover) => this.picker.register(i, target, source, hover),
    });
    scene.group.position.copy(anchor.pos);
    scene.group.rotation.y = anchor.yaw;
    this.scenes.push(scene);
    this.scene.add(scene.group);
  }

  setTarget(p: number) {
    this.state.target = clamp(p, 0, 1);
  }

  setPointer(clientX: number, clientY: number) {
    const r = this.canvas.getBoundingClientRect();
    this.ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this.rig.mouse.set(this.ndc.x, this.ndc.y);
    this.pointerDirty = true;
  }

  leavePointer() {
    this.ndc.set(10, 10);
    this.rig.mouse.set(0, 0);
    this.pointerDirty = true;
  }

  resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.gfx.setSize(w, h);
    this.rig.resize(w, h);
    shared.uPx.value = this.gfx.pixelRatio;
    this.sky.setPixelRatio(this.gfx.pixelRatio);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.gfx.onTier = (tier) => {
      this.state.tier = tier;
      shared.uPx.value = this.gfx.pixelRatio;
      this.sky.setPixelRatio(this.gfx.pixelRatio);
      this.onTier?.(tier);
    };
    this.last = performance.now();
    const loop = (now: number) => {
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.update(dt, false);
      this.gfx.render();
      this.gfx.govern(dt);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private update(dt: number, snap: boolean) {
    const s = this.state;
    this.t += dt;
    shared.uTime.value = this.t;
    const prev = s.p;
    s.p = snap ? s.target : damp(s.p, s.target, 5.2, dt);
    if (Math.abs(s.p - s.target) < 2e-5) s.p = s.target;

    const loc = this.layout.locate(s.p);
    const frame = this.layout.frameAt(loc.u);
    const worldSpeed = (Math.abs(loc.u - this.uPrev) * this.layout.length) / Math.max(dt, 1e-4);
    this.uPrev = loc.u;
    s.speed = snap ? 0 : damp(s.speed, clamp(worldSpeed / WORLD_SPEED_REF), 9, dt);
    if (s.speed > 0.06 && Math.abs(s.p - prev) > 1e-6) this.facingBack = s.p < prev;
    if (s.speed < 0.02) this.facingBack = false;
    this.yaw = snap ? frame.yaw : lerpAngle(this.yaw, frame.yaw + (this.facingBack ? Math.PI : 0), 1 - Math.exp(-9 * dt));
    s.seg = loc.seg;

    blendPalette(chapterPalettes[loc.seg], chapterPalettes[loc.seg + 1], loc.eased, this.pal);
    shared.uAccent.value.copy(this.pal.accent);
    shared.uAccent2.value.copy(this.pal.accent2);
    shared.uFogColor.value.copy(this.pal.fog);
    shared.uFogDensity.value = this.pal.fogDensity;
    shared.uPlayer.value.copy(frame.pos);
    shared.uPlayerLen.value = loc.u * this.layout.length;
    const fog = this.scene.fog as THREE.FogExp2;
    fog.color.copy(this.pal.fog);
    fog.density = this.pal.fogDensity;
    this.gfx.renderer.setClearColor(this.pal.fog);
    this.hemi.color.copy(this.pal.accent).lerp(this.pal.top, 0.5).lerp(new THREE.Color('#ffffff'), 0.35);
    this.hemi.groundColor.copy(this.pal.fog);
    this.sun.color.copy(this.pal.sun).lerp(this.pal.accent2, 0.35);
    this.sun.position.copy(frame.pos).add(new THREE.Vector3(-30, 60, -40));
    this.sun.target.position.copy(frame.pos);

    this.avatar.group.position.copy(frame.pos);
    this.avatar.group.rotation.y = this.yaw;
    const celebrate = smoothstep(0.985, 1, s.p);
    this.avatar.update(dt, s.speed, this.t, celebrate, this.rig.mouse.x);

    this.rig.update(dt, this.t, frame, this.presets[loc.seg], this.presets[loc.seg + 1], loc.eased, s.speed);
    this.sky.update(this.rig.camera.position, this.pal);

    const playerDist = loc.u * this.layout.length;
    const near: number[] = [];
    let nearest = 0;
    let best = Infinity;
    this.scenes.forEach((cs, i) => {
      const d = Math.abs(playerDist - this.layout.anchors[i].dist);
      if (d < best) {
        best = d;
        nearest = i;
      }
      const visible = d < CHAPTER_VISIBLE;
      cs.group.visible = visible;
      if (!visible) return;
      const w = 1 - smoothstep(30, 150, d);
      if (w > 0.2) near.push(i);
      this.local.copy(frame.pos);
      cs.group.worldToLocal(this.local);
      this.ctx.t = this.t;
      this.ctx.dt = dt;
      this.ctx.w = w;
      this.ctx.speed = s.speed;
      cs.update?.(this.ctx);
    });
    s.nearest = nearest;
    s.dist = best;
    this.picker.setActive(near);

    if (this.pointerDirty && !snap) {
      this.pointerDirty = false;
      const hit = this.ndc.x > 1 ? null : this.picker.pick(this.ndc, this.rig.camera);
      const info = hit?.info ?? null;
      if (info !== this.hover) {
        this.hover = info;
        this.onHover?.(info);
      }
    }
    s.tier = this.gfx.tier;
    this.onFrame?.(s);
  }
}
