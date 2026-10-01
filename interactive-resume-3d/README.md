# Interactive 3D résumé

A scroll-driven 3D world built from a career timeline. Scroll (or swipe, or press the arrow keys) and an avatar runs through each level: roles, skill constellation, side quest, trophies and certifications.

Stack: Vite, TypeScript, Three.js. No UI framework.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build into dist/
npm run preview    # serve dist/
```

## Edit the content

All text lives in `src/data/`:

- `profile.ts`: name, about copy, roles, skills, side quest, honors, certifications, links.
- `chapters.ts`: chapter order, which side the scenery sits on, path length/elevation and per-chapter colour palettes.

To add a link (GitHub, site), put it in `profile.links`. Contact details (email, phone) are intentionally not included.

## How it degrades

- No WebGL, `prefers-reduced-motion`, or `?view=classic`: a fast, accessible 2D résumé (prerendered into `index.html` at build time).
- Graphics quality adapts at runtime (bloom and pixel ratio step down if the frame rate drops).

## URL parameters (for testing)

| Param | Effect |
| --- | --- |
| `?view=classic` / `?view=3d` | Force a mode |
| `?p=0.5` | Start at 50% of the journey |
| `?q=0\|1\|2` | Lock graphics quality |
| `?debug` | Expose `window.__resume` |

## Controls

Scroll or swipe to run. `←` `→` / `Space` jump between levels, `Home`/`End` go to the ends, the timeline at the bottom is clickable, and **Autopilot** tours every level hands-free. Hover (or tap) trophies, coins, skill nodes and level scenery for details.
