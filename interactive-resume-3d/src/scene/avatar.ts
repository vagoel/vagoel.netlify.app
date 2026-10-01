import * as THREE from 'three';
import { damp, lerp } from '../utils/math';
import { shared } from './shared';

export class Avatar {
  readonly group = new THREE.Group();
  private readonly root = new THREE.Group();
  private readonly head = new THREE.Group();
  private readonly legs: THREE.Group[] = [];
  private readonly arms: THREE.Group[] = [];
  private readonly visor: THREE.MeshBasicMaterial;
  private readonly strip: THREE.MeshBasicMaterial;
  private readonly ring: THREE.Mesh;
  private phase = 0;
  private lean = 0;

  constructor() {
    const suit = new THREE.MeshStandardMaterial({ color: '#e3eaf8', roughness: 0.42, metalness: 0.12, flatShading: true });
    const dark = new THREE.MeshStandardMaterial({ color: '#151a2d', roughness: 0.55, metalness: 0.45, flatShading: true });
    this.visor = new THREE.MeshBasicMaterial({ color: '#37e8ff' });
    this.strip = new THREE.MeshBasicMaterial({ color: '#37e8ff' });

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.5, 4, 10), suit);
    torso.position.y = 1.45;
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.26, 0.1), dark);
    plate.position.set(0, 1.55, -0.33);
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.1, 12), dark);
    belt.position.y = 1.06;
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.72, 0.26), dark);
    pack.position.set(0, 1.5, 0.4);
    const stripMesh = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.04), this.strip);
    stripMesh.position.set(0, 1.3, 0.54);
    const stripMesh2 = stripMesh.clone();
    stripMesh2.position.y = 1.7;

    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 14), suit);
    const visorMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), this.visor);
    visorMesh.scale.set(0.25, 0.13, 0.09);
    visorMesh.position.set(0, 0.02, -0.25);
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.25, 6), dark);
    antenna.position.set(0.14, 0.4, 0.02);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), this.strip);
    bulb.position.set(0.14, 0.54, 0.02);
    this.head.add(skull, visorMesh, antenna, bulb);
    this.head.position.y = 2.15;

    for (const sd of [-1, 1]) {
      const leg = new THREE.Group();
      leg.position.set(sd * 0.17, 0.98, 0);
      const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.45, 4, 8), suit);
      thigh.position.y = -0.36;
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.15, 0.36), dark);
      boot.position.set(0, -0.76, -0.05);
      leg.add(thigh, boot);
      this.legs.push(leg);

      const arm = new THREE.Group();
      arm.position.set(sd * 0.47, 1.8, 0);
      const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.42, 4, 8), suit);
      upper.position.y = -0.3;
      const glove = new THREE.Mesh(new THREE.SphereGeometry(0.105, 10, 8), dark);
      glove.position.y = -0.64;
      arm.add(upper, glove);
      this.arms.push(arm);
    }

    this.root.add(torso, plate, belt, pack, stripMesh, stripMesh2, this.head, ...this.legs, ...this.arms);
    this.root.scale.setScalar(1.45);
    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(0.65, 0.8, 40),
      new THREE.MeshBasicMaterial({ color: '#37e8ff', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    );
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.1;
    this.group.add(this.root, this.ring);
  }

  update(dt: number, speed: number, time: number, celebrate: number, lookX: number) {
    const s = Math.min(1, speed);
    this.phase += dt * (2 + s * 11);
    const swing = Math.sin(this.phase) * 0.95 * s;
    this.lean = damp(this.lean, s, 6, dt);
    this.legs[0].rotation.x = swing;
    this.legs[1].rotation.x = -swing;
    const wave = Math.sin(time * 6) * 0.25 * celebrate;
    this.arms[0].rotation.set(-swing * 0.9 * (1 - celebrate), 0, lerp(0.05, -2.7 + wave, celebrate));
    this.arms[1].rotation.set(swing * 0.9 * (1 - celebrate), 0, lerp(-0.05, 2.7 - wave, celebrate));
    this.root.position.y = Math.abs(Math.sin(this.phase)) * 0.13 * s + Math.sin(time * 1.7) * 0.02 + celebrate * Math.abs(Math.sin(time * 5)) * 0.25;
    this.root.rotation.x = -0.2 * this.lean;
    this.head.rotation.y = damp(this.head.rotation.y, lookX * 0.6 * (1 - s), 5, dt);
    const accent = shared.uAccent.value;
    this.visor.color.copy(accent).multiplyScalar(2.2);
    this.strip.color.copy(shared.uAccent2.value).multiplyScalar(2.2);
    (this.ring.material as THREE.MeshBasicMaterial).color.copy(accent).multiplyScalar(1.6);
    this.ring.scale.setScalar(1 + Math.sin(time * 3) * 0.06 + s * 0.2);
  }
}
