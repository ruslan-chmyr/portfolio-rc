# RC — Interactive Portfolio

Senior frontend portfolio for **Ruslan Chmyr**, built around a WebGL2-driven intro: a custom **RC** monogram that deforms like liquid ink under the cursor, then expands into a full-screen, scroll-scrubbed transition.

> **Status:** The intro and its rendering stack are implemented and under active refinement. Portfolio sections beyond the intro are planned.

## Highlights

- **Stable Fluids monogram** — WebGL2 simulation with cursor impulse, vorticity, dye advection, and shape restoration toward the RC silhouette.
- **Reversible scroll transition** — virtual scroll drives progress forward and backward; the live canvas is captured into a signed distance field (SDF) and expanded with organic edges and ambient motion.
- **Theme-aware rendering** — light/dark persistence, CSS tokens, and matching fluid/transition colors without resetting WebGL contexts.
- **Reduced-motion path** — prefers SVG and simplified motion when `prefers-reduced-motion: reduce` is set or WebGL2 is unavailable.
- **Layered architecture** — React for UI; imperative controllers for GPU lifecycle, input, and scroll; shared WebGL utilities and a modular fluid engine.

## Stack

| Layer | Tools |
| --- | --- |
| Application | React 19, TypeScript |
| Build | Vite 8 |
| Motion | GSAP, WebGL2, GLSL |
| Simulation | Stable Fluids (velocity/dye fields, pressure projection) |
| Transition | SDF capture + fullscreen ink shader |
| Quality | Vitest, Oxlint, `tsc -b` |

## Requirements

- **Node.js** — current LTS recommended  
- **Browser** — WebGL2 with floating-point render targets (`EXT_color_buffer_float`) for the full experience  

## Quick start

```bash
npm install
npm run dev
```

Open the URL printed by Vite (typically `http://localhost:5173`).

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server with HMR |
| `npm run build` | Typecheck (`tsc -b`) and production bundle |
| `npm run preview` | Serve the production build locally |
| `npm run test` | Run Vitest (`src/**/*.test.ts`) |
| `npm run lint` | Run Oxlint |

## Repository layout

```text
src/
├── features/intro/          # Intro feature (UI, hooks, controllers, shaders)
│   ├── components/          # IntroAnimation, canvas, logo, header, caption
│   ├── hooks/               # React wiring (e.g. useIntroAnimation)
│   ├── lib/                 # Runtime, attach* controllers, SDF, ink transition
│   └── model/               # Monogram paths and tuning constants
├── shared/
│   ├── graphics/fluid/      # Stable Fluids engine (simulation, buffers, display)
│   ├── lib/webgl/           # Shaders, textures, FBOs, resource manager
│   ├── lib/pointer/         # Normalized coordinates and impulse math
│   ├── theme/               # Provider, tokens, persistence
│   └── ui/                  # Shared controls (e.g. theme toggle)
└── components/IntroAnimation/  # Legacy re-exports (prefer features/intro)
```

**Design intent**

1. **React** owns structure and accessibility; it does not drive per-frame GPU state.
2. **`IntroRuntime` + attach controllers** create renderers once, subscribe to pointer/scroll/theme, and dispose in a fixed order (transition → fluid → theme → GPU).
3. **Shared WebGL** centralizes compile/link errors, fullscreen quads, and GPU cleanup.
4. **Fluid vs transition** stay separate: interaction uses the simulation canvas; scroll uses a dedicated fullscreen layer fed by an SDF of the captured silhouette.

## How the intro behaves

**Idle / pointer:** A GSAP ticker advances the fluid solver. Pointer proximity and movement map to grid-normalized coordinates and impulses (`shared/lib/pointer`). Ink advection and restoration pull the shape back toward the seeded RC mask after interaction ends.

**Scroll:** A feature-local scroll controller maps wheel, touch, and keyboard input to `0…1` progress. On first entry into scroll, the fluid canvas is rasterized; EDT and packing run in a **Web Worker** when available, with idle prefetch and fingerprint caching to avoid main-thread stalls on the common path. The transition shader samples the SDF and seed textures; progress and time uniforms drive expansion and fringe motion (ambient time scaled at 1.25×).

**Themes:** `ThemeProvider` updates CSS and dispatches a window event; renderers update ink/clear/fringe uniforms only.

## Development notes

Optional query parameters (development builds):

| Parameter | Purpose |
| --- | --- |
| `?fluidDebug` | Log fluid diagnostics; exposes `window.__fluidDebug` |
| `?fluidView=vel\|dye\|dyePre` | Debug views for velocity/dye buffers |
| `?perf=1` | Exposes `window.__introPerf` (SDF timing, cache hits) |

Production profiling: use `npm run build && npm run preview`, then Chrome Performance / `?perf=1` for capture and scroll timing.

## Testing

Automated tests cover pointer math, scroll clamping, theme tokens, SDF packing, `ResourceManager` disposal, and fluid configuration invariants. They do not assert pixel-perfect WebGL output.

```bash
npm run test
npm run lint
npm run build
```

Manual checks worth running before release:

- Slow and fast cursor deformation and restoration  
- Scroll 0 ↔ 100% and mid-point hold (idle fringe)  
- Light/dark toggle during interaction and mid-scroll  
- Reduced motion and WebGL-disabled fallback  
- React Strict Mode mount/unmount (no duplicate listeners or GPU leaks)

## Roadmap

- Portfolio content sections after the intro  
- Deeper performance measurement on target mobile viewports  
- Removal of legacy `src/components/IntroAnimation` shims when imports are fully migrated  

## Credits

Liquid-motion aesthetic references [neuv.fr](https://neuv.fr/). The RC mark, implementation, and architecture are original to this project.
