import type { Chapter } from '../../data/chapters';
import { roles } from '../../data/profile';
import { about, hero } from './intro';
import { adia, cat, client360, components, hackathon, hy5, offline } from './roles';
import { certsRing, contact, honorsRoom, quest, skills } from './bonus';
import { checkpoint } from './helpers';
import type { Builder, ChapterScene, Kit } from './types';

const roleBuilders: Record<string, Builder> = { hy5, offline, hackathon, client360, components, cat, adia };

const builderFor = (c: Chapter): Builder => {
  switch (c.kind) {
    case 'hero':
      return hero;
    case 'about':
      return about;
    case 'role':
      return roleBuilders[c.role!.scene];
    case 'skills':
      return skills;
    case 'quest':
      return quest;
    case 'honors':
      return honorsRoom;
    case 'certs':
      return certsRing;
    case 'contact':
      return contact;
  }
};

const gateText = (c: Chapter) => {
  if (c.kind === 'role') return `LEVEL ${String(roles.findIndex((r) => r.id === c.id) + 1).padStart(2, '0')}`;
  return { about: 'ORIGIN', skills: 'BONUS STAGE', quest: 'SIDE QUEST', honors: 'TROPHY ROOM', certs: 'BADGES', hero: '', contact: '' }[c.kind];
};

export const buildChapter = (kit: Kit): ChapterScene => {
  const scene = builderFor(kit.chapter)(kit);
  const text = gateText(kit.chapter);
  if (!text) return scene;
  const gate = checkpoint(kit, text);
  gate.group.position.z = -14;
  scene.group.add(gate.group);
  const inner = scene.update;
  scene.update = (f) => {
    gate.update(f);
    inner?.(f);
  };
  return scene;
};
