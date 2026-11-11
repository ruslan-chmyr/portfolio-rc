# Portfolio — Ruslan Chmyr

A personal portfolio built with React and TypeScript, focused on interactive visuals, scroll-driven animations, and frontend engineering.

## Overview

The site opens on an interactive **RC** monogram: a WebGL2 fluid simulation that responds to the cursor, then a scroll-controlled ink transition into the portfolio. The first content section is **About** — scroll-scrubbed typography, a short introduction with portrait, and lightweight ambient tech graphics. The visual language is minimal and editorial: large type, restrained chrome, light/dark themes.

Intro and About are implemented. Later sections are outlined in the UI but not built yet.

## Tech stack

| Area | Tools |
| --- | --- |
| UI | React 19, TypeScript |
| Build | Vite 8 |
| Motion | GSAP, ScrollTrigger |
| Graphics | WebGL2, GLSL (Stable Fluids + ink SDF transition) |
| Quality | Vitest, Oxlint, `tsc -b` |

## Features

### Interactive intro

- Custom RC monogram driven by a Stable Fluids simulation (cursor impulse, dye advection, restoration toward the mark)
- WebGL2 rendering with an SVG / simplified path when WebGL is unavailable or `prefers-reduced-motion` is set
- Scroll maps to transition progress (wheel, touch, keyboard); progress is reversible
- Theme-aware ink and clear colors without recreating GPU contexts

### About section

- Scroll-pinned GSAP timeline for **SENIOR / FRONTEND / ENGINEER** (cluster → split → content reveal)
- Portrait, short bio, and expertise lines
- Floating monochrome SVG tech marks (CSS ambient motion; hidden on narrower breakpoints)
- Laptop and mobile layout modes (compact CSS on short laptop viewports; static stacked layout at `≤700px`)

### Scrolling and motion

- Intro captures scroll until the transition completes, then hands off to native page scroll (`createIntroScrollHandoff`)
- Scrolling back to the top re-engages intro capture so the transition can run in reverse
- About cluster layout is re-measured on handoff, reengage, resize, and after fonts settle
- Reduced-motion: About skips the pin choreography and shows content immediately

### Theme

- Light/dark theme via shared theme provider, CSS tokens, and persistence
- Theme toggle in intro and portfolio chrome; logo assets swap with the theme

## Architecture

Code is organized by feature, with shared graphics/theme utilities and a thin app shell.

- **`features/intro`** — intro UI, runtime, fluid attachment, ink transition, scroll controller, handoff
- **`features/about`** — About UI, scroll controller, timeline builder, type-cluster layout helpers, styles
- **`app/portfolio`** — portfolio nav, section index chrome, section metadata
- **`shared`** — Stable Fluids engine, WebGL helpers, pointer math, theme, ThemeToggle

React owns structure and accessibility. Animation and GPU work live in imperative controllers with explicit `dispose` / context teardown. About keeps layout measurement, timeline construction, and CSS in separate modules.

```text
src/
├── app/
│   ├── PortfolioApp.tsx
│   └── portfolio/           # Nav, section index, section list
├── features/
│   ├── intro/               # Components, hooks, lib, model
│   └── about/               # Components, hooks, lib, styles, assets
├── shared/
│   ├── graphics/fluid/      # Stable Fluids simulation + shaders
│   ├── lib/webgl/           # Programs, textures, FBOs, resources
│   ├── lib/pointer/         # Coordinates and impulse
│   ├── theme/
│   └── ui/
└── components/IntroAnimation/  # Legacy re-exports (prefer features/intro)
```

## Getting started

Requirements:

- Node.js (current LTS recommended; no engines field is pinned in this repo)
- A browser with WebGL2 for the full intro experience

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`).

To open the same session from a phone on the same Wi‑Fi:

```bash
npm run dev -- --host
```

Use the **Network** URL from the Vite output.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Vite development server |
| `npm run build` | Typecheck (`tsc -b`) and production bundle |
| `npm run preview` | Serve the production build locally |
| `npm run test` | Vitest (`vitest run`) |
| `npm run lint` | Oxlint |

## Project status

Under active development.

**Implemented:** interactive intro (fluid + transition + handoff) and About (typography timeline, content, ambient marks, responsive modes).

**Planned** (listed in portfolio section chrome; not built as full sections yet):

- Expertise & Skills
- Projects
- Experience
- Learning & Growth
- Contact

Resume / Contact nav labels are placeholders.

## Development notes

Optional query parameters (development builds), carried over from the intro stack:

| Parameter | Purpose |
| --- | --- |
| `?fluidDebug` | Fluid diagnostics; exposes `window.__fluidDebug` |
| `?fluidView=vel\|dye\|dyePre` | Debug views for velocity/dye buffers |
| `?perf=1` | Exposes `window.__introPerf` (SDF timing, cache hits) |

Automated tests cover pointer math, scroll/handoff behavior, theme tokens, SDF packing, resource disposal, fluid config invariants, and About scroll config / layout helpers. They do not assert pixel-perfect WebGL output.

## Author

Ruslan Chmyr — Senior Frontend Engineer.

GitHub: [ruslan-chmyr](https://github.com/ruslan-chmyr)