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

/**
 * Abstract cover art only — number/title/subtitle are baked into the curved card texture.
 * Keep gradients and decorative shapes without story copy in the SVG itself.
 */
function coverGradient(args: {
  from: string
  via: string
  to: string
  accent: string
}): string {
  const { from, via, to, accent } = args
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">
  <defs>
    <linearGradient id="g" x1="8%" y1="0%" x2="92%" y2="100%">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="48%" stop-color="${via}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
    <radialGradient id="glow" cx="28%" cy="18%" r="62%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="sheen" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.16"/>
      <stop offset="38%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.22"/>
    </linearGradient>
  </defs>
  <rect width="900" height="1200" rx="48" fill="url(#g)"/>
  <rect width="900" height="1200" rx="48" fill="url(#glow)"/>
  <rect width="900" height="1200" rx="48" fill="url(#sheen)"/>
  <circle cx="740" cy="220" r="210" fill="#ffffff" fill-opacity="0.06"/>
  <circle cx="140" cy="980" r="260" fill="#000000" fill-opacity="0.22"/>
  <path d="M80 320 C260 240, 420 400, 620 300 S860 220, 860 220" fill="none" stroke="${accent}" stroke-opacity="0.35" stroke-width="3"/>
  <path d="M80 380 C300 300, 480 460, 700 360" fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="2"/>
</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/** Display label for highlight cards / expanded detail (toggle stays FE / AI). */
export function storyCategoryLabel(
  category: EngineeringStory['category'],
): string {
  return category === 'fe' ? 'Frontend' : 'AI'
}

/**
 * Central Engineering Highlights catalog.
 * Expand fields later without reshaping the UI.
 */
export const engineeringStories: EngineeringStory[] = [
  {
    id: 'architecture-reusability',
    title: 'Architecture & Reusability',
    subtitle: 'One shared core. 10+ interactive experiences.',
    category: 'fe',
    cover: coverGradient({
      from: '#1A3A6B',
      via: '#243F78',
      to: '#3A2A6A',
      accent: '#7AD7FF',
    }),
    relatedSkillIds: [
      'javascript',
      'typescript',
      'system-design',
      'nx-monorepos',
    ],
    challenge:
      'Multiple interactive widgets needed different web and mobile interfaces while sharing much of the same business logic. Duplicating that logic would make the system harder to maintain.',
    approach:
      'I separated business logic from presentation by building a framework-independent JavaScript core with reusable state models and consistent data contracts.',
    outcome:
      'Using shared modules within an Nx monorepo, I established a common foundation for 10+ interactive widgets across web and mobile, reducing duplication and keeping their behavior consistent.',
  },
  {
    id: 'performance-engineering',
    title: 'Performance Engineering',
    subtitle: 'Rendering less. Keeping complex interfaces responsive.',
    category: 'fe',
    cover: coverGradient({
      from: '#0E3A42',
      via: '#155566',
      to: '#1A4A3A',
      accent: '#5EE7C8',
    }),
    relatedSkillIds: [
      'react',
      'typescript',
      'virtualization',
      'performance-optimization',
    ],
    challenge:
      'Large editable tables were becoming expensive to render, with complex input components and unnecessary React updates affecting responsiveness.',
    approach:
      'Rather than relying on virtualization alone, I combined visible-row rendering with lightweight display cells and mounted expensive inputs only when users started editing.',
    outcome:
      'I optimized component boundaries and state updates to reduce unnecessary rendering while preserving full editing functionality. The result was a more responsive, maintainable interface for data-heavy workflows.',
  },
  {
    id: 'configurable-systems',
    title: 'Configurable Systems',
    subtitle: 'Flexible products without duplicated frontends.',
    category: 'fe',
    cover: coverGradient({
      from: '#243056',
      via: '#334878',
      to: '#4A3060',
      accent: '#A8B8FF',
    }),
    relatedSkillIds: ['react', 'nextjs', 'typescript', 'system-design'],
    challenge:
      'Customer-facing applications needed to support different branding, content, and interface requirements without maintaining separate implementations for every client.',
    approach:
      'I separated product-specific configuration from reusable React and Next.js components, allowing interfaces to adapt without scattering client-specific conditions throughout the codebase.',
    outcome:
      'I worked on customer-facing applications and administrative interfaces using shared UI patterns and explicit data contracts. This created a more flexible foundation for customization while keeping frontend development maintainable.',
  },
  {
    id: 'reliable-ai-automation',
    title: 'Reliable AI Automation',
    subtitle: 'Beyond prompts: building a reliable AI review workflow.',
    category: 'ai',
    cover: coverGradient({
      from: '#2A1A58',
      via: '#3A2878',
      to: '#1A3858',
      accent: '#C9A0FF',
    }),
    relatedSkillIds: [
      'n8n',
      'workflow-automation',
      'llm-apis',
      'github-integration',
      'jira-integration',
    ],
    challenge:
      'Automated code reviews became difficult when pull requests contained large diffs, missing task context, or incomplete LLM responses.',
    approach:
      'Instead of relying on a single AI prompt, I designed a structured review pipeline that separates context collection, code analysis, and output validation.',
    outcome:
      'I connected n8n, GitHub, Jira, and LLM APIs, using diff chunking, shared context, retries, and completeness checks. The result was a repeatable AI-assisted review workflow with more structured, context-aware feedback.',
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
    alt: `${story.title}. ${story.subtitle}`,
    title: story.title,
    subtitle: story.subtitle,
  }))
}
