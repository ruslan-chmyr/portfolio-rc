# Portfolio — Ruslan Chmyr

A personal portfolio built with React and TypeScript, focused on interactive visuals, scroll-driven animations, and frontend engineering.

## Overview

The site opens on an interactive **RC** monogram, then scrolls through About, Skills, Projects, Experience, and Contact. The visual language is minimal and editorial: large type, restrained chrome, light/dark themes.

## Tech stack

| Area | Tools |
| --- | --- |
| UI | React 19, TypeScript |
| Build | Vite 8 |
| Motion | GSAP, ScrollTrigger |
| Graphics | WebGL / Three.js (intro fluid, Skills keyboard, Contact fabric) |
| API | Vercel Functions + Resend |
| Quality | Vitest, Oxlint, `tsc -b` |

## Features

- **Intro** — WebGL2 fluid monogram, scroll-controlled ink transition, theme-aware handoff
- **About** — GSAP typography timeline, portrait/bio, ambient tech marks
- **Skills** — 3D keyboard scene, category stories, scroll handoff into Projects
- **Projects** — scrubbed project showcase with pin/wipe transitions
- **Experience** — career timeline, sticky year, milestone activation, CV CTA
- **Contact** — Gravity Letters heading, spectral fabric backdrop, form + social links

## Architecture

Feature-based folders keep React UI separate from imperative animation/GPU controllers.

- **React** owns structure, forms, and accessibility
- **GSAP controllers** own scroll timelines, pins, and dispose cleanly
- **WebGL modules** own renderer lifecycle (lazy init, pause offscreen, context loss)
- **`scheduleScrollTriggerRefresh`** coalesces global refreshes across sections
- **Contact** posts to same-origin `/api/contact`; Resend stays server-side
- **Reduced motion** is respected for Experience, Contact fabric, and Gravity Letters

```text
src/
├── app/
├── features/
│   ├── intro/
│   ├── about/
│   ├── skills/
│   ├── projects/
│   ├── experience/
│   └── contact/
└── shared/
    ├── graphics/
    ├── scene/          # ScrollTrigger refresh coordination
    ├── pointer/
    └── theme/
api/
└── contact.ts          # Vercel Function (Resend)
```

## Getting started

```bash
npm install
npm run dev
```

Network access from another device:

```bash
npm run dev -- --host
```

| Command | Description |
| --- | --- |
| `npm run dev` | Vite development server |
| `npm run build` | Typecheck (`tsc -b`) and production bundle |
| `npm run preview` | Serve the production build locally |
| `npm run test` | Vitest |
| `npm run lint` | Oxlint |

## Contact form deployment

Frontend defaults to `POST /api/contact`.

**Server env (Vercel — never use `VITE_` for secrets):**

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Resend API key |
| `CONTACT_FROM_EMAIL` | Verified Resend sender |
| `CONTACT_TO_EMAIL` | Inbox for inquiries |
| `CONTACT_RATE_LIMIT_MAX` | Soft per-isolate limit (default `5`) |
| `CONTACT_RATE_LIMIT_WINDOW_MS` | Soft window (default `60000`) |
| `CONTACT_RESEND_TIMEOUT_MS` | Provider timeout (default `10000`) |

**Notes:**

- Without Resend credentials the API returns `503` / unavailable (honest, not fake success)
- Local mock: `VITE_CONTACT_ALLOW_MOCK=true` only when no API URL override is set
- In-memory rate limiting is defense in depth — enable **Vercel Firewall** on `POST /api/contact` for production
- Success means Resend accepted the request, not that the inbox received it

## Author

Ruslan Chmyr — Senior Frontend Engineer

GitHub: [ruslan-chmyr](https://github.com/ruslan-chmyr)
