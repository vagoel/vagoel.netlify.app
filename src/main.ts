import '@fontsource-variable/space-grotesk';
import './style.css';
import { detectCapabilities } from './utils/device';

const params = new URLSearchParams(location.search);
const root = document.documentElement;
const loaderEl = document.getElementById('loader')!;
const bar = loaderEl.querySelector<HTMLElement>('.loader__bar i')!;
const msg = loaderEl.querySelector<HTMLElement>('.loader__msg')!;

const loader = {
  set(fraction: number, message: string) {
    bar.style.transform = `scaleX(${fraction})`;
    msg.textContent = message;
  },
  hide() {
    loaderEl.classList.add('is-done');
    setTimeout(() => loaderEl.remove(), 900);
  },
};

const goClassic = () => {
  const u = new URL(location.href);
  u.searchParams.set('view', 'classic');
  u.searchParams.delete('p');
  location.href = u.toString();
};

const showClassic = (canEnter3D: boolean) => {
  root.classList.remove('is-3d');
  root.classList.add('is-classic');
  document.querySelectorAll<HTMLElement>('[data-enter3d]').forEach((el) => (el.hidden = !canEnter3D));
  loader.hide();
};

const main = async () => {
  const caps = detectCapabilities();
  const view = params.get('view');
  if (view === 'classic' || (view !== '3d' && (!caps.webgl || caps.reducedMotion))) return showClassic(caps.webgl);
  try {
    const { boot3D } = await import('./app3d');
    await boot3D(caps, params, loader, goClassic);
  } catch (err) {
    console.error('3D experience failed to start, falling back to the classic view.', err);
    showClassic(false);
  }
};

void main();
