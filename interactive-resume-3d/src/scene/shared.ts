import * as THREE from 'three';

export const shared = {
  uTime: { value: 0 },
  uFogColor: { value: new THREE.Color('#2a0f3d') },
  uFogDensity: { value: 0.0042 },
  uPlayer: { value: new THREE.Vector3() },
  uPlayerLen: { value: 0 },
  uPx: { value: 1 },
  uAccent: { value: new THREE.Color('#37e8ff') },
  uAccent2: { value: new THREE.Color('#ff3d9a') },
};

export const fogGlsl = /* glsl */ `
uniform vec3 uFogColor;
uniform float uFogDensity;
float fogAmount(float depth) { float f = uFogDensity * depth; return 1.0 - exp(-f * f); }
`;

export const hashGlsl = /* glsl */ `
float hash11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float hash21(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
`;

export const finishGlsl = /* glsl */ `
#include <tonemapping_fragment>
#include <colorspace_fragment>
`;

const cache = new Map<string, THREE.Material>();
const memo = <T extends THREE.Material>(key: string, make: () => T): T => {
  let m = cache.get(key);
  if (!m) cache.set(key, (m = make()));
  return m as T;
};

export const basicMat = (color: THREE.ColorRepresentation, intensity = 1) =>
  memo(`b:${new THREE.Color(color).getHexString()}:${intensity}`, () => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity) }));

export const solidMat = (color: THREE.ColorRepresentation, roughness = 0.5, metalness = 0.25, emissive?: THREE.ColorRepresentation, emissiveIntensity = 0.6) =>
  memo(
    `s:${new THREE.Color(color).getHexString()}:${roughness}:${metalness}:${emissive ?? ''}:${emissiveIntensity}`,
    () => new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading: true, emissive: emissive ?? '#000000', emissiveIntensity }),
  );

export interface HoloOpts {
  color: THREE.ColorRepresentation;
  power?: number;
  alpha?: number;
  scan?: number;
  intensity?: number;
}

export const holoMat = ({ color, power = 2.2, alpha = 1, scan = 0, intensity = 1.6 }: HoloOpts) =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      ...shared,
      uColor: { value: new THREE.Color(color) },
      uPower: { value: power },
      uAlpha: { value: alpha },
      uScan: { value: scan },
      uIntensity: { value: intensity },
    },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV; varying vec3 vW; varying float vDepth;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vec4 mv = viewMatrix * wp;
        vN = normalize(mat3(modelMatrix) * normal);
        vV = normalize(cameraPosition - wp.xyz);
        vW = wp.xyz; vDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uPower, uAlpha, uScan, uTime, uIntensity;
      varying vec3 vN; varying vec3 vV; varying vec3 vW; varying float vDepth;
      ${fogGlsl}
      void main() {
        float f = pow(clamp(1.0 - abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0), uPower);
        float scan = uScan > 0.0 ? 0.6 + 0.4 * sin(vW.y * uScan - uTime * 2.0) : 1.0;
        float a = (f * 0.95 + 0.07) * uAlpha * scan * (1.0 - fogAmount(vDepth));
        gl_FragColor = vec4(uColor * (0.5 + f * uIntensity), a);
        ${finishGlsl}
      }`,
  });

export const additiveMat = (color: THREE.ColorRepresentation, opacity = 1) =>
  new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });

export const portalMat = (a: THREE.ColorRepresentation, b: THREE.ColorRepresentation) =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { ...shared, uA: { value: new THREE.Color(a) }, uB: { value: new THREE.Color(b) } },
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying float vDepth;
      void main() { vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform vec3 uA, uB; varying vec2 vUv; varying float vDepth;
      ${fogGlsl}
      void main() {
        vec2 p = vUv * 2.0 - 1.0; float r = length(p); float a = atan(p.y, p.x);
        float s = sin(a * 5.0 + r * 9.0 - uTime * 2.0) * 0.5 + 0.5;
        float s2 = sin(a * 3.0 - r * 13.0 + uTime * 1.3) * 0.5 + 0.5;
        vec3 col = mix(uA, uB, s * s2) * (0.35 + (1.0 - r) * 0.7);
        float alpha = smoothstep(1.0, 0.8, r) * (0.14 + 0.32 * s * s2) * (1.0 - fogAmount(vDepth));
        gl_FragColor = vec4(col, alpha);
        ${finishGlsl}
      }`,
  });

const geoCache = new Map<string, THREE.BufferGeometry>();
const gmemo = (key: string, make: () => THREE.BufferGeometry) => {
  let g = geoCache.get(key);
  if (!g) geoCache.set(key, (g = make()));
  return g;
};

export const geo = {
  box: () => gmemo('box', () => new THREE.BoxGeometry(1, 1, 1)),
  boxBase: () => gmemo('boxBase', () => new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0)),
  sphere: () => gmemo('sphere', () => new THREE.SphereGeometry(1, 20, 14)),
  ico: () => gmemo('ico', () => new THREE.IcosahedronGeometry(1, 0)),
  octa: () => gmemo('octa', () => new THREE.OctahedronGeometry(1, 0)),
  cyl: () => gmemo('cyl', () => new THREE.CylinderGeometry(1, 1, 1, 32, 1)),
  plane: () => gmemo('plane', () => new THREE.PlaneGeometry(1, 1)),
};
