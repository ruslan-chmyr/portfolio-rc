import type { SkillBoardCategory, SkillId } from './skillsConfig'

export type EngineeringStoryId =
  | 'architecture-reusability'
  | 'performance-engineering'
  | 'configurable-systems'
  | 'reliable-ai-automation'

export type EngineeringStory = {
  id: EngineeringStoryId
  title: string
  subtitle: string
  category: Extract<SkillBoardCategory, 'fe' | 'ai'>
  /** Replaceable cover — CSS gradient data URL or image URL. */
  cover: string
  relatedSkillIds: SkillId[]
  challenge?: string
  approach?: string
  outcome?: string
}

function coverGradient(args: {
  from: string
  via: string
  to: string
  title: string
  eyebrow: string
}): string {
  const { from, via, to, title, eyebrow } = args
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="52%" stop-color="${via}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
    <radialGradient id="glow" cx="30%" cy="20%" r="70%">
      <stop offset="0%" stop-color="rgba(94,231,255,0.28)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
  </defs>
  <rect width="900" height="1200" fill="url(#g)"/>
  <rect width="900" height="1200" fill="url(#glow)"/>
  <circle cx="720" cy="260" r="180" fill="rgba(255,255,255,0.04)"/>
  <circle cx="160" cy="980" r="220" fill="rgba(0,0,0,0.18)"/>
  <text x="72" y="160" fill="rgba(244,247,251,0.55)" font-family="ui-sans-serif, system-ui, sans-serif" font-size="28" letter-spacing="6" font-weight="500">${eyebrow}</text>
  <text x="72" y="980" fill="#F4F7FB" font-family="ui-sans-serif, system-ui, sans-serif" font-size="54" font-weight="650">${title}</text>
</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/**
 * Central Engineering Stories catalog.
 * Detailed copy is intentionally light — expand fields later without reshaping the UI.
 */
export const engineeringStories: EngineeringStory[] = [
  {
    id: 'architecture-reusability',
    title: 'Architecture & Reusability',
    subtitle: 'Shared contracts across interactive surfaces',
    category: 'fe',
    cover: coverGradient({
      from: '#0B1730',
      via: '#132445',
      to: '#1A1030',
      title: 'Architecture',
      eyebrow: 'STORY 01',
    }),
    relatedSkillIds: [
      'typescript',
      'react',
      'system-design',
      'micro-frontends',
      'module-federation',
      'nx-monorepos',
    ],
    challenge:
      'Keep complex React surfaces coherent when widgets, admin tools, and shared libraries evolve together.',
    approach:
      'Centralize typed contracts, reuse presentation primitives, and place skills/config as a single source of truth.',
    outcome:
      'A maintainable FE stack where new interactive modules plug into existing patterns instead of forking them.',
  },
  {
    id: 'performance-engineering',
    title: 'Performance Engineering',
    subtitle: 'Smooth interaction under real rendering cost',
    category: 'fe',
    cover: coverGradient({
      from: '#071820',
      via: '#0E2A38',
      to: '#122018',
      title: 'Performance',
      eyebrow: 'STORY 02',
    }),
    relatedSkillIds: [
      'react',
      'performance-optimization',
      'virtualization',
      'vite',
      'nextjs',
    ],
    challenge:
      'Interactive 3D and dense UI work must stay responsive without burning the main thread or the GPU while idle.',
    approach:
      'Demand-driven rendering, visibility-aware pauses, and careful invalidation so animation only runs when it matters.',
    outcome:
      'Skills interactions remain smooth while idle frames and offscreen work stay constrained.',
  },
  {
    id: 'configurable-systems',
    title: 'Configurable Systems',
    subtitle: 'Behavior driven by typed catalogs',
    category: 'fe',
    cover: coverGradient({
      from: '#101828',
      via: '#1C2440',
      to: '#241830',
      title: 'Configurable',
      eyebrow: 'STORY 03',
    }),
    relatedSkillIds: [
      'typescript',
      'redux-toolkit',
      'rtk-query',
      'material-ui',
      'system-design',
    ],
    challenge:
      'Product surfaces need flexible layouts and content without scattering one-off conditionals through the UI.',
    approach:
      'Model boards, keys, and stories as typed configuration that components consume instead of hardcoding.',
    outcome:
      'New skills, categories, and stories can be authored by extending catalogs rather than rewriting interaction code.',
  },
  {
    id: 'reliable-ai-automation',
    title: 'Reliable AI Automation',
    subtitle: 'Agents and workflows with guarded integrations',
    category: 'ai',
    cover: coverGradient({
      from: '#120C24',
      via: '#1C1440',
      to: '#0C2030',
      title: 'AI Automation',
      eyebrow: 'STORY 04',
    }),
    relatedSkillIds: [
      'n8n',
      'workflow-automation',
      'llm-apis',
      'prompt-engineering',
      'ai-agents',
      'mcp',
      'api-integrations',
    ],
    challenge:
      'Automation must connect LLMs, tools, and third-party systems without brittle, opaque pipelines.',
    approach:
      'Compose workflows around explicit integrations, prompts, and agent boundaries that stay inspectable.',
    outcome:
      'AI-assisted flows that can grow with new tools while remaining understandable and operable.',
  },
]

export function getEngineeringStory(id: string | null | undefined): EngineeringStory | null {
  if (!id) return null
  return engineeringStories.find((story) => story.id === id) ?? null
}

export function getStoryCarouselItems() {
  return engineeringStories.map((story) => ({
    id: story.id,
    src: story.cover,
    alt: story.title,
    title: story.title,
    subtitle: story.subtitle,
  }))
}
