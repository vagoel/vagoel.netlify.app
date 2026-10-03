import { esc } from '../classic';
import type { Chapter } from '../data/chapters';
import { certs, fmtDuration, fmtMonth, fmtRange, honors, profile, roles, sideQuest, skillGroups, stats } from '../data/profile';

const chips = (items: string[], cls = '') => `<ul class="chips ${cls}">${items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;

const heroCard = (c: Chapter) => `
  <div class="hero__top">
    <p class="kicker">${esc(c.kicker)}</p>
    <h1 id="t-${c.id}">${esc(profile.name)}</h1>
    <p class="hero__headline">${esc(profile.headline)}</p>
    <p class="hero__tag">${esc(profile.tagline)}</p>
  </div>
  <div class="hero__bottom">
    <div class="hero__cta">
      <button class="btn btn--primary" data-act="start">Begin the journey</button>
      <button class="btn" data-act="classic">Classic résumé</button>
    </div>
    <p class="hero__hint"><span class="mouse" aria-hidden="true"></span><span class="t-mouse">Scroll, or press <kbd>←</kbd> <kbd>→</kbd> to run</span><span class="t-touch">Swipe up to run</span></p>
  </div>`;

const aboutCard = (c: Chapter) => `
  <p class="kicker">${esc(c.kicker)}</p>
  <h2 id="t-${c.id}">${esc(c.title)}</h2>
  ${profile.about.map((p) => `<p class="summary">${esc(p)}</p>`).join('')}
  <ul class="stats">${stats().map((s) => `<li><b>${esc(s.value)}</b><span>${esc(s.label)}</span></li>`).join('')}</ul>`;

const roleCard = (c: Chapter) => {
  const r = c.role!;
  const level = String(roles.findIndex((x) => x.id === r.id) + 1).padStart(2, '0');
  return `
  <p class="kicker"><b>Level ${level}</b> · ${esc(c.kicker)}${r.boss ? ' <span class="boss">Boss</span>' : ''}</p>
  <h2 id="t-${c.id}">${esc(r.title)}</h2>
  <p class="company">${esc(c.subtitle)}</p>
  <p class="meta"><span>${fmtRange(r)}</span><span>${fmtDuration(r)}</span><span>${esc(r.type)}</span></p>
  <p class="summary">${esc(r.summary)}</p>
  <ul class="bullets">${r.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
  ${chips(r.tech, 'chips--tight')}
  ${r.highlight ? `<p class="badge">★ ${esc(r.highlight)}</p>` : ''}`;
};

const skillsCard = (c: Chapter) => `
  <p class="kicker">${esc(c.kicker)}</p>
  <h2 id="t-${c.id}">${esc(c.title)}</h2>
  <p class="summary">${esc(c.subtitle)}. Run through the constellation and watch each node light up.</p>
  <div class="groups">${skillGroups.map((g) => `<div class="group" style="--c:${g.color}"><h3>${esc(g.name)}</h3>${chips(g.skills, 'chips--tight')}</div>`).join('')}</div>`;

const questCard = (c: Chapter) => `
  <p class="kicker">${esc(c.kicker)}</p>
  <h2 id="t-${c.id}">${esc(sideQuest.title)}</h2>
  <p class="company">${esc(sideQuest.subtitle)}</p>
  <p class="summary">${esc(sideQuest.summary)}</p>
  ${chips(sideQuest.prompts, 'chips--prompt')}
  ${chips(sideQuest.tech, 'chips--tight')}`;

const honorsCard = (c: Chapter) => `
  <p class="kicker">${esc(c.kicker)}</p>
  <h2 id="t-${c.id}">${esc(c.title)}</h2>
  <ul class="rows">${honors.map((h) => `<li class="tier-${h.tier}"><i></i><span><b>${esc(h.title)}</b> · ${esc(h.event)}</span><em>${esc(h.org)}</em></li>`).join('')}</ul>`;

const certsCard = (c: Chapter) => `
  <p class="kicker">${esc(c.kicker)}</p>
  <h2 id="t-${c.id}">${esc(c.title)}</h2>
  <ul class="rows rows--certs">${certs.map((x) => `<li><i></i><span><b>${esc(x.title)}</b> · ${esc(x.issuer)}</span><em>${fmtMonth(x.date)}</em></li>`).join('')}</ul>`;

const contactCard = (c: Chapter) => `
  <p class="kicker">${esc(c.kicker)}</p>
  <h2 id="t-${c.id}">${esc(c.title)}</h2>
  <p class="summary">${esc(c.subtitle)}.</p>
  <div class="hero__cta">
    ${Object.entries(profile.links).map(([k, v]) => `<a class="btn btn--primary" href="${esc(v)}" target="_blank" rel="noopener">${esc(k === 'linkedin' ? 'Connect on LinkedIn' : k)}</a>`).join('')}
    <button class="btn" data-act="replay">Run it again</button>
    <button class="btn" data-act="classic">Classic résumé</button>
  </div>
  <p class="fine">${esc(profile.company)} · ${esc(profile.location)}<br />${profile.languages.map(esc).join(' · ')}</p>`;

const bodies: Record<Chapter['kind'], (c: Chapter) => string> = {
  hero: heroCard,
  about: aboutCard,
  role: roleCard,
  skills: skillsCard,
  quest: questCard,
  honors: honorsCard,
  certs: certsCard,
  contact: contactCard,
};

export const buildCards = (root: HTMLElement, list: Chapter[]) => {
  root.innerHTML = list
    .map((c) => {
      const place = c.kind === 'hero' ? 'hero' : c.side < 0 ? 'right' : 'left';
      return `<article class="card card--${place}${c.role?.boss ? ' card--boss' : ''}" data-i="${c.index}" style="--accent:${c.palette.accent};--accent2:${c.palette.accent2}" aria-hidden="true" aria-labelledby="t-${c.id}">${bodies[c.kind](c)}</article>`;
    })
    .join('');
  return Array.from(root.querySelectorAll<HTMLElement>('.card'));
};
