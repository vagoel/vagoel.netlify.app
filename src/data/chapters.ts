import { certs, fmtRange, honors, profile, roles, sideQuest, skillGroups, type Role } from './profile';

export interface PaletteDef {
  top: string;
  horizon: string;
  fog: string;
  accent: string;
  accent2: string;
  sun: string;
  stars: number;
  aurora: number;
  fogDensity: number;
}

export type ChapterKind = 'hero' | 'about' | 'role' | 'skills' | 'quest' | 'honors' | 'certs' | 'contact';

export interface Chapter {
  id: string;
  kind: ChapterKind;
  index: number;
  label: string;
  kicker: string;
  title: string;
  subtitle: string;
  city?: string;
  year?: string;
  side: -1 | 0 | 1;
  gap: number;
  elevation: number;
  palette: PaletteDef;
  role?: Role;
}

const P = (
  top: string,
  horizon: string,
  fog: string,
  accent: string,
  accent2: string,
  sun: string,
  stars = 0.6,
  aurora = 0,
  fogDensity = 0.0042,
): PaletteDef => ({ top, horizon, fog, accent, accent2, sun, stars, aurora, fogDensity });

export const palettes = {
  hero: P('#0a0520', '#ff4d8d', '#2a0f3d', '#37e8ff', '#ff3d9a', '#ffb347', 0.9),
  about: P('#0c1030', '#7a4dff', '#1b1346', '#9a86ff', '#37e8ff', '#ff8fd0', 0.8),
  tcs: P('#1b0f2e', '#ff9a3c', '#4a2236', '#ffb347', '#ff5e5e', '#ffd27a', 0.35),
  extentia: P('#06192b', '#2fd6a3', '#0b2b33', '#2fd6a3', '#3bb2ff', '#c8ffe9', 0.5),
  adobe: P('#1a0508', '#ff3d3d', '#3a0f14', '#ff4757', '#ffd166', '#ff9a7a', 0.45),
  scbDev: P('#04122b', '#2a7fff', '#08203f', '#4dabff', '#00e0b0', '#9fd0ff', 0.6),
  aviva: P('#0c1030', '#6a5cff', '#171a4a', '#ffd23f', '#7d6bff', '#ffe58a', 0.6),
  cat: P('#02101c', '#00d4ff', '#03253a', '#00e5ff', '#00ff9d', '#b8f6ff', 0.7, 0, 0.0048),
  adia: P('#0c0a1e', '#f5b942', '#2a2112', '#f5c542', '#ffffff', '#ffe29a', 0.7, 0, 0.0042),
  skills: P('#050314', '#7a2cff', '#120a2e', '#b388ff', '#37e8ff', '#e0c8ff', 1, 0.5, 0.0034),
  quest: P('#03060f', '#00d9a0', '#04141a', '#00ffa3', '#00b8ff', '#aaffe6', 1, 0.7, 0.0034),
  honors: P('#0a0712', '#ffb800', '#241504', '#ffcc33', '#ff7a00', '#fff0b0', 1, 0.3, 0.0034),
  certs: P('#06101a', '#36e2c4', '#08222a', '#36e2c4', '#ffd166', '#c8fff4', 1, 0.5, 0.0034),
  contact: P('#02030a', '#0ff0b3', '#041420', '#00f5d4', '#9b5cff', '#7cffe0', 1, 1, 0.0034),
};

const byId = (id: string) => roles.find((r) => r.id === id)!;

const roleChapter = (id: string, palette: PaletteDef, side: -1 | 1, elevation: number): Omit<Chapter, 'index'> => {
  const r = byId(id);
  return {
    id,
    kind: 'role',
    label: r.short,
    kicker: r.city === r.country ? r.city : `${r.city}, ${r.country}`,
    title: r.title,
    subtitle: `${r.company}${r.org ? ` · ${r.org}` : ''}`,
    city: r.city,
    year: r.start.slice(0, 4),
    side,
    gap: r.boss ? 220 : 160,
    elevation,
    palette,
    role: r,
  };
};

const defs: Omit<Chapter, 'index'>[] = [
  {
    id: 'hero',
    kind: 'hero',
    label: 'Start',
    kicker: profile.location,
    title: profile.name,
    subtitle: profile.headline,
    side: 0,
    gap: 140,
    elevation: 0,
    palette: palettes.hero,
  },
  {
    id: 'about',
    kind: 'about',
    label: 'Story',
    kicker: 'The story so far',
    title: 'Hello, world',
    subtitle: profile.tagline,
    side: 1,
    gap: 150,
    elevation: 0,
    palette: palettes.about,
  },
  roleChapter('tcs', palettes.tcs, -1, 0),
  roleChapter('extentia', palettes.extentia, 1, 0),
  roleChapter('adobe', palettes.adobe, -1, 0),
  roleChapter('scb-dev', palettes.scbDev, 1, 0),
  roleChapter('aviva', palettes.aviva, -1, 0),
  roleChapter('scb-cat', palettes.cat, 1, 0),
  roleChapter('adia', palettes.adia, -1, 0),
  {
    id: 'skills',
    kind: 'skills',
    label: 'Skills',
    kicker: 'Bonus stage · The skill tree',
    title: 'Skill constellation',
    subtitle: `${skillGroups.reduce((n, g) => n + g.skills.length, 0)} abilities across ${skillGroups.length} branches`,
    side: 0,
    gap: 210,
    elevation: 26,
    palette: palettes.skills,
  },
  {
    id: 'quest',
    kind: 'quest',
    label: 'Side quest',
    kicker: `Side quest · ${sideQuest.context}`,
    title: sideQuest.title,
    subtitle: sideQuest.subtitle,
    side: 1,
    gap: 170,
    elevation: 44,
    palette: palettes.quest,
  },
  {
    id: 'honors',
    kind: 'honors',
    label: 'Trophies',
    kicker: 'Trophy room',
    title: 'Honors & awards',
    subtitle: `${honors.length} trophies collected`,
    side: -1,
    gap: 170,
    elevation: 48,
    palette: palettes.honors,
  },
  {
    id: 'certs',
    kind: 'certs',
    label: 'Badges',
    kicker: 'Collectibles',
    title: 'Certifications',
    subtitle: `${certs.length} badges unlocked`,
    side: 0,
    gap: 170,
    elevation: 50,
    palette: palettes.certs,
  },
  {
    id: 'contact',
    kind: 'contact',
    label: 'Contact',
    kicker: 'Level complete',
    title: 'Let’s build something',
    subtitle: 'Open to conversations about UI architecture, trading platforms and AI engineering',
    side: 0,
    gap: 0,
    elevation: 52,
    palette: palettes.contact,
  },
];

export const chapters: Chapter[] = defs.map((d, index) => ({ ...d, index }));

export const cities = ['India', 'Singapore', 'Abu Dhabi'];

const INDIA_CITIES = new Set(['Pune', 'Noida']);
export const cityToNav = (city: string): string => INDIA_CITIES.has(city) ? 'India' : city;

export const rangeOf = (c: Chapter) => (c.role ? fmtRange(c.role) : '');
