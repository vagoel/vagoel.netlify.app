import { certs, fmtDuration, fmtMonth, fmtRange, honors, profile, roles, sideQuest, skillGroups, stats } from './data/profile.ts';

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const chips = (items: string[]) => `<ul class="chips">${items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;

const roleHtml = (r: (typeof roles)[number], i: number) => `
  <article class="c-role${r.boss ? ' is-boss' : ''}">
    <p class="kicker"><b>Level ${String(i + 1).padStart(2, '0')}</b> · ${esc(r.city === r.country ? r.city : `${r.city}, ${r.country}`)}${r.boss ? ' <span class="boss">Boss</span>' : ''}</p>
    <h3>${esc(r.title)}</h3>
    <p class="company">${esc(r.company)}${r.org ? ` · ${esc(r.org)}` : ''}</p>
    <p class="meta"><span>${fmtRange(r)}</span><span>${fmtDuration(r)}</span><span>${esc(r.type)}</span></p>
    <p>${esc(r.summary)}</p>
    <ul class="bullets">${r.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
    ${chips(r.tech)}
    ${r.highlight ? `<p class="badge">★ ${esc(r.highlight)}</p>` : ''}
  </article>`;

export const renderClassic = () => `
<div id="classic" class="classic">
  <header class="c-hero">
    <p class="kicker">${esc(profile.location)}</p>
    <h1>${esc(profile.name)}</h1>
    <p class="c-headline">${esc(profile.headline)}</p>
    <p class="c-tag">${esc(profile.tagline)}</p>
    <p class="c-actions">
      <a class="btn btn--primary" href="?view=3d" data-enter3d hidden>Enter the 3D experience</a>
      ${Object.entries(profile.links).map(([k, v]) => `<a class="btn" href="${esc(v)}" rel="noopener" target="_blank">${esc(k === 'linkedin' ? 'LinkedIn' : k)}</a>`).join('')}
    </p>
  </header>
  <main>
    <section aria-labelledby="c-about">
      <h2 id="c-about">The story so far</h2>
      ${profile.about.map((p) => `<p>${esc(p)}</p>`).join('')}
      <ul class="c-stats">${stats().map((s) => `<li><b>${esc(s.value)}</b><span>${esc(s.label)}</span></li>`).join('')}</ul>
    </section>
    <section aria-labelledby="c-exp">
      <h2 id="c-exp">Experience</h2>
      <div class="c-roles">${roles.map(roleHtml).join('')}</div>
    </section>
    <section aria-labelledby="c-skills">
      <h2 id="c-skills">Skills</h2>
      <div class="c-groups">${skillGroups.map((g) => `<div class="c-group" style="--c:${g.color}"><h3>${esc(g.name)}</h3>${chips(g.skills)}</div>`).join('')}</div>
    </section>
    <section aria-labelledby="c-quest">
      <h2 id="c-quest">Side quest: ${esc(sideQuest.title)}</h2>
      <p>${esc(sideQuest.summary)}</p>
      ${chips(sideQuest.tech)}
    </section>
    <section aria-labelledby="c-honors">
      <h2 id="c-honors">Honors &amp; awards</h2>
      <ul class="c-list">${honors.map((h) => `<li><b>${esc(h.title)}</b> · ${esc(h.event)} <em>${esc(h.org)}${h.date ? `, ${fmtMonth(h.date)}` : ''}</em></li>`).join('')}</ul>
    </section>
    <section aria-labelledby="c-certs">
      <h2 id="c-certs">Certifications</h2>
      <ul class="c-list">${certs.map((c) => `<li><b>${esc(c.title)}</b> · ${esc(c.issuer)} <em>${fmtMonth(c.date)}</em></li>`).join('')}</ul>
    </section>
    <section aria-labelledby="c-contact">
      <h2 id="c-contact">Let’s build something</h2>
      <p>Open to conversations about UI architecture, trading platforms and AI engineering.</p>
      <p class="c-actions">${Object.entries(profile.links).map(([k, v]) => `<a class="btn btn--primary" href="${esc(v)}" rel="noopener" target="_blank">${esc(k === 'linkedin' ? 'Connect on LinkedIn' : k)}</a>`).join('')}</p>
      <p class="c-fine">${esc(profile.company)} · ${esc(profile.location)} · ${profile.languages.map(esc).join(' · ')}</p>
    </section>
  </main>
</div>`;

export const renderJsonLd = () =>
  `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.headline,
    url: profile.siteUrl,
    worksFor: { '@type': 'Organization', name: profile.company },
    address: { '@type': 'PostalAddress', addressLocality: 'Abu Dhabi', addressCountry: 'AE' },
    knowsLanguage: ['en', 'hi'],
    sameAs: Object.values(profile.links),
  }).replace(/</g, '\\u003c')}</script>`;
