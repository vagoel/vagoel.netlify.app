import { defineConfig, type Plugin } from 'vite';
import { renderClassic, renderJsonLd } from './src/classic.ts';

const prerender = (): Plugin => ({
  name: 'prerender-classic',
  transformIndexHtml: (html) => html.replace('<!--CLASSIC-->', renderClassic()).replace('<!--JSONLD-->', renderJsonLd()),
});

export default defineConfig({
  plugins: [prerender()],
  build: { target: 'es2022', chunkSizeWarningLimit: 800 },
});
