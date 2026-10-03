import { esc } from '../classic';
import { chapters, cities, cityToNav } from '../data/chapters';
import { profile } from '../data/profile';
import type { FrameState } from '../scene/experience';
import type { PickInfo } from '../scene/chapters/types';
import { buildCards } from './cards';
import type { Sound } from './audio';
import type { ScrollDriver } from './scroll';

const SHOW_DIST = 50;
const HIDE_DIST = 66;

export class Hud {
  private readonly cards: HTMLElement[];
  private readonly rail: HTMLElement;
  private readonly dots: HTMLElement[];
  private readonly cityEls: HTMLElement[];
  private readonly tourBtn: HTMLButtonElement;
  private readonly soundBtn: HTMLButtonElement;
  private readonly tip: HTMLElement;
  private readonly root: HTMLElement;
  private readonly quality: HTMLElement;
  private readonly live: HTMLElement;
  private active = -1;
  private chapter = -1;
  private lastP = -1;
  private cityIdx = -1;

  constructor(
    hud: HTMLElement,
    cardsRoot: HTMLElement,
    tip: HTMLElement,
    private readonly scroll: ScrollDriver,
    private readonly sound: Sound,
    private readonly anchorsP: number[],
    private readonly onClassic: () => void,
  ) {
    this.root = hud;
    this.tip = tip;
    hud.innerHTML = `
      <header class="hud__top">
        <button class="brand" data-act="top" title="Back to the start"><span class="brand__mark">${esc(profile.initials)}</span><span class="brand__name">${esc(profile.name)}</span></button>
        <ol class="cities" aria-label="Career route">${cities.map((c) => `<li>${esc(c)}</li>`).join('')}</ol>
        <div class="tools">
          <button class="pill" data-act="tour" aria-pressed="false"><i class="ico ico--play"></i><span>Autopilot</span></button>
          <button class="pill" data-act="sound" aria-pressed="false"><i class="ico ico--sound"></i><span>Sound off</span></button>
          <button class="pill" data-act="classic"><i class="ico ico--doc"></i><span>Classic</span></button>
        </div>
      </header>
      <nav class="rail" aria-label="Chapters">
        <div class="rail__track"><i class="rail__fill"></i></div>
        <ol class="rail__list">${chapters
          .map((c, i) => `<li style="left:${(this.anchorsP[i] * 100).toFixed(3)}%"><button class="dot" data-act="go" data-i="${i}" aria-label="${esc(c.label)}${c.year ? ` ${c.year}` : ''}: ${esc(c.title)}"><b></b><span>${esc(c.label)}${c.year ? `<small>${c.year}</small>` : ''}</span></button></li>`)
          .join('')}</ol>
      </nav>
      <div class="badge-quality" aria-hidden="true"></div>
      <p class="sr-only" aria-live="polite"></p>`;
    this.cards = buildCards(cardsRoot, chapters);
    this.rail = hud.querySelector('.rail')!;
    this.dots = Array.from(hud.querySelectorAll<HTMLElement>('.dot'));
    this.cityEls = Array.from(hud.querySelectorAll<HTMLElement>('.cities li'));
    this.tourBtn = hud.querySelector('[data-act="tour"]')!;
    this.soundBtn = hud.querySelector('[data-act="sound"]')!;
    this.quality = hud.querySelector('.badge-quality')!;
    this.live = hud.querySelector('.sr-only')!;

    const act = (e: Event) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
      if (!el) return;
      switch (el.dataset.act) {
        case 'go':
          this.scroll.tour(false);
          this.scroll.chapter(Number(el.dataset.i));
          break;
        case 'start':
          this.scroll.chapter(1);
          break;
        case 'top':
        case 'replay':
          this.scroll.to(0, 2600);
          break;
        case 'tour':
          this.scroll.tour(!this.scroll.touring);
          this.setTour(this.scroll.touring);
          break;
        case 'sound': {
          const on = this.sound.toggle();
          this.soundBtn.setAttribute('aria-pressed', String(on));
          this.soundBtn.querySelector('span')!.textContent = on ? 'Sound on' : 'Sound off';
          this.soundBtn.classList.toggle('is-on', on);
          break;
        }
        case 'classic':
          this.onClassic();
          break;
      }
    };
    hud.addEventListener('click', act);
    cardsRoot.addEventListener('click', act);
    this.scroll.onTourEnd = () => this.setTour(false);
    hud.hidden = false;
    cardsRoot.hidden = false;
  }

  syncSound(on: boolean) {
    this.soundBtn.setAttribute('aria-pressed', String(on));
    this.soundBtn.querySelector('span')!.textContent = on ? 'Sound on' : 'Sound off';
    this.soundBtn.classList.toggle('is-on', on);
  }

  private setTour(on: boolean) {
    this.tourBtn.setAttribute('aria-pressed', String(on));
    this.tourBtn.classList.toggle('is-on', on);
    this.tourBtn.querySelector('span')!.textContent = on ? 'Stop autopilot' : 'Autopilot';
  }

  frame(s: FrameState) {
    if (Math.abs(s.p - this.lastP) > 0.0004) {
      this.lastP = s.p;
      this.rail.style.setProperty('--p', s.p.toFixed(4));
      this.dots.forEach((d, i) => d.classList.toggle('is-passed', this.anchorsP[i] <= s.p + 0.001));
    }
    this.sound.setSpeed(s.speed);

    if (s.nearest !== this.chapter && s.dist < SHOW_DIST) {
      this.chapter = s.nearest;
      const c = chapters[s.nearest];
      this.root.style.setProperty('--accent', c.palette.accent);
      this.root.style.setProperty('--accent2', c.palette.accent2);
      document.documentElement.style.setProperty('--accent', c.palette.accent);
      this.dots.forEach((d, i) => d.classList.toggle('is-current', i === s.nearest));
      this.sound.ping(s.nearest);
      const ci = c.city ? cities.indexOf(cityToNav(c.city)) : s.nearest === 0 ? -1 : this.cityIdx;
      if (ci !== this.cityIdx) {
        this.cityIdx = ci;
        this.cityEls.forEach((el, i) => {
          el.classList.toggle('is-current', i === ci);
          el.classList.toggle('is-past', i < ci);
        });
      }
    }

    const want = s.dist < (this.active === s.nearest ? HIDE_DIST : SHOW_DIST) ? s.nearest : -1;
    if (want !== this.active) {
      if (this.active >= 0) this.setCard(this.active, false);
      if (want >= 0) {
        this.setCard(want, true);
        this.live.textContent = `${chapters[want].title}. ${chapters[want].subtitle}`;
      }
      this.active = want;
    }
  }

  tier(t: 0 | 1 | 2) {
    this.quality.textContent = t === 0 ? 'Battery saver graphics' : t === 1 ? 'Balanced graphics' : '';
    this.quality.classList.toggle('is-on', t < 2);
    setTimeout(() => this.quality.classList.remove('is-on'), 4000);
  }

  private setCard(i: number, on: boolean) {
    const el = this.cards[i];
    el.classList.toggle('is-active', on);
    el.setAttribute('aria-hidden', String(!on));
  }

  showTip(info: PickInfo | null, x: number, y: number) {
    const t = this.tip;
    if (!info) {
      t.classList.remove('is-on');
      return;
    }
    t.innerHTML = `<b>${esc(info.title)}</b>${info.subtitle ? `<span>${esc(info.subtitle)}</span>` : ''}${info.body ? `<p>${esc(info.body)}</p>` : ''}`;
    if (info.color) t.style.setProperty('--tip', info.color);
    this.moveTip(x, y);
    t.classList.add('is-on');
  }

  moveTip(x: number, y: number) {
    const w = this.tip.offsetWidth || 260;
    const h = this.tip.offsetHeight || 80;
    const px = Math.min(x + 18, innerWidth - w - 12);
    const py = y + 22 + h > innerHeight ? y - h - 14 : y + 22;
    this.tip.style.transform = `translate(${Math.max(8, px)}px, ${Math.max(8, py)}px)`;
  }
}
