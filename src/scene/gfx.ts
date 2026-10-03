import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const DPR_CAP = [1, 1.5, 1.75] as const;

export class Gfx {
  readonly renderer: THREE.WebGLRenderer;
  tier: 0 | 1 | 2;
  pixelRatio = 1;
  onTier?: (tier: 0 | 1 | 2, pixelRatio: number) => void;
  private composer?: EffectComposer;
  private bloom?: UnrealBloomPass;
  private scene?: THREE.Scene;
  private camera?: THREE.Camera;
  private w = 1;
  private h = 1;
  private warm = 0;
  private acc = 0;
  private n = 0;

  constructor(
    canvas: HTMLCanvasElement,
    tier: 0 | 1 | 2,
    private readonly locked: boolean,
  ) {
    this.tier = tier;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: tier > 0, powerPreference: 'high-performance', alpha: false, stencil: false });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.92;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  attach(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene;
    this.camera = camera;
    const pm = new THREE.PMREMGenerator(this.renderer);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.3;
    pm.dispose();
    this.applyTier();
  }

  private buildComposer() {
    if (this.composer || !this.scene || !this.camera) return;
    const target = new THREE.WebGLRenderTarget(this.w, this.h, { type: THREE.HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(this.renderer, target);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(this.w, this.h), 0.3, 0.45, 1.0);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
  }

  private applyTier() {
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, DPR_CAP[this.tier]);
    if (this.tier === 2) this.buildComposer();
    this.setSize(this.w, this.h);
  }

  setSize(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(w, h, false);
    this.composer?.setPixelRatio(this.pixelRatio);
    this.composer?.setSize(w, h);
  }

  setTier(tier: 0 | 1 | 2) {
    if (tier === this.tier) return;
    this.tier = tier;
    this.applyTier();
    this.onTier?.(tier, this.pixelRatio);
  }

  render() {
    if (this.tier === 2 && this.composer) this.composer.render();
    else if (this.scene && this.camera) this.renderer.render(this.scene, this.camera);
  }

  govern(dt: number) {
    if (this.locked || this.tier === 0) return;
    if (this.warm++ < 60) return;
    this.acc += Math.min(dt, 0.25);
    if (++this.n < 100) return;
    if (this.acc / this.n > 1 / 38) {
      this.setTier((this.tier - 1) as 0 | 1);
      this.warm = 0;
    }
    this.acc = 0;
    this.n = 0;
  }
}
