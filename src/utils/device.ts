export interface Capabilities {
  webgl: boolean;
  reducedMotion: boolean;
  coarsePointer: boolean;
  smallScreen: boolean;
  cores: number;
  memory: number;
  tier: 0 | 1 | 2;
}

const hasWebGL2 = () => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') as WebGL2RenderingContext | null);
  } catch {
    return false;
  }
};

export const detectCapabilities = (): Capabilities => {
  const coarsePointer = matchMedia('(pointer: coarse)').matches;
  const smallScreen = Math.min(innerWidth, innerHeight) < 600;
  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  let tier: 0 | 1 | 2 = 2;
  if (coarsePointer || smallScreen) tier = 1;
  if ((coarsePointer || smallScreen) && (cores <= 4 || memory <= 2)) tier = 0;
  if (cores <= 2 || memory <= 1) tier = 0;
  return {
    webgl: hasWebGL2(),
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    coarsePointer,
    smallScreen,
    cores,
    memory,
    tier,
  };
};
