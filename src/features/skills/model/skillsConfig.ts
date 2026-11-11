import reactUrl from '../../about/assets/react.svg'
import nextjsUrl from '../../about/assets/nextjs.svg'
import typescriptUrl from '../../about/assets/typescript.svg'
import {
  MACROPAD_CELLS,
  countOccupiedCells,
  placeSkillsOnMacropad,
  type KeySpan,
} from './keyboardLayout'

export const SKILL_BOARD_CATEGORIES = ['fe', 'ai'] as const

export type SkillBoardCategory = (typeof SKILL_BOARD_CATEGORIES)[number]

export type SkillGroup =
  | 'core'
  | 'state-data'
  | 'architecture'
  | 'performance'
  | 'testing'
  | 'tooling-ui'
  | 'automation'
  | 'llm'
  | 'data'
  | 'ai-dev'
  | 'integrations'

/**
 * Single source of truth for a skill. Array order within a board
 * drives row-aware macropad placement (respecting `keySpan`).
 */
export type SkillDefinition = {
  id: string
  /** Full display name — never abbreviated away. */
  name: string
  /** Short keycap legend. */
  shortLabel: string
  /** Inspection copy — empty until authored. */
  description: string
  /**
   * Optional local SVG (or other image) URL for keycap + inspection.
   * When set, keycaps render the icon instead of `shortLabel`.
   * Omit for abstract skills — do not invent unofficial marks.
   */
  icon?: string
  /** Keycap face accent. */
  color?: string
  /** Legend / icon tint. Defaults to white when omitted. */
  legend?: string
  /**
   * Physical width in grid cells. Defaults to 1.
   * Span 2 occupies two adjacent columns in the same row.
   */
  keySpan?: KeySpan
  group: SkillGroup
}

export type SkillBoardCategoryConfig = {
  id: SkillBoardCategory
  label: string
  enabled: boolean
  soonLabel?: string
}

/** Selector metadata for the active skill boards. */
export const SKILL_BOARD_CATEGORY_CONFIG: Record<SkillBoardCategory, SkillBoardCategoryConfig> =
  {
    fe: { id: 'fe', label: 'FE', enabled: true },
    ai: { id: 'ai', label: 'AI', enabled: true },
  }

export const DEFAULT_SKILL_BOARD_CATEGORY: SkillBoardCategory = 'fe'

/**
 * Central skills catalog. Order within each array = physical key order.
 * Do not maintain a parallel hardcoded key→skill map.
 */
export const skills = {
  fe: [
    {
      id: 'typescript',
      name: 'TypeScript',
      shortLabel: 'TS',
      description:
        'Building type-safe applications with reusable contracts, predictable data flows, and maintainable architecture.',
      icon: typescriptUrl,
      color: '#3178C6',
      legend: '#FFFFFF',
      group: 'core',
    },
    {
      id: 'javascript',
      name: 'JavaScript',
      shortLabel: 'JS',
      description:
        'Designing shared business logic and reusable libraries for 10+ interactive widgets across web and mobile.',
      color: '#F7DF1E',
      legend: '#111111',
      group: 'core',
    },
    {
      id: 'react',
      name: 'React',
      shortLabel: 'React',
      description:
        'Architecting complex React interfaces, from configurable admin panels to performance-critical data views.',
      icon: reactUrl,
      color: '#20232A',
      legend: '#61DAFB',
      group: 'core',
    },
    {
      id: 'nextjs',
      name: 'Next.js',
      shortLabel: 'Next',
      description:
        'Building configurable, multi-tenant frontend experiences with dynamic content, branding, and tenant-specific settings.',
      icon: nextjsUrl,
      color: '#111111',
      legend: '#FFFFFF',
      group: 'core',
    },
    {
      id: 'redux-toolkit',
      name: 'Redux Toolkit',
      shortLabel: 'Redux',
      description:
        'Managing complex application state with predictable updates and maintainable data flows.',
      color: '#764ABC',
      legend: '#FFFFFF',
      group: 'state-data',
    },
    {
      id: 'rtk-query',
      name: 'RTK Query',
      shortLabel: 'RTK Q',
      description:
        'Handling API data, caching, and synchronization between server state and frontend interfaces.',
      color: '#5A3A9E',
      legend: '#FFFFFF',
      group: 'state-data',
    },
    {
      id: 'rest-apis',
      name: 'REST APIs',
      shortLabel: 'REST',
      description:
        'Integrating frontend applications with backend services through reliable, maintainable API contracts.',
      color: '#2F6FED',
      legend: '#FFFFFF',
      group: 'state-data',
    },
    {
      id: 'websockets',
      name: 'WebSockets',
      shortLabel: 'WS',
      description:
        'Implementing real-time communication and event-driven updates in interactive applications.',
      color: '#0E8F7E',
      legend: '#FFFFFF',
      group: 'state-data',
    },
    {
      id: 'system-design',
      name: 'System Design',
      shortLabel: 'System',
      description:
        'Designing reusable frontend systems with clear contracts, application boundaries, and cross-platform integration.',
      color: '#3D4450',
      legend: '#F2F4F7',
      group: 'architecture',
    },
    {
      id: 'micro-frontends',
      name: 'Micro Frontends',
      shortLabel: 'MFE',
      description:
        'Structuring modular frontend applications with independent modules and reusable shared packages.',
      color: '#455A64',
      legend: '#FFFFFF',
      group: 'architecture',
    },
    {
      id: 'module-federation',
      name: 'Module Federation',
      shortLabel: 'Fed',
      description:
        'Building modular frontend architectures with Webpack Module Federation and shared application dependencies.',
      color: '#546E7A',
      legend: '#FFFFFF',
      group: 'architecture',
    },
    {
      id: 'nx-monorepos',
      name: 'Nx / Monorepos',
      shortLabel: 'Nx',
      description:
        'Working with shared libraries, build pipelines, testing, and coordinated delivery across multiple applications.',
      color: '#143055',
      legend: '#7BD3FF',
      group: 'architecture',
    },
    {
      id: 'performance-optimization',
      name: 'Performance Optimization',
      shortLabel: 'Perf',
      description:
        'Solving React rendering bottlenecks through virtualization, lighter component trees, and selective updates.',
      color: '#E65100',
      legend: '#FFFFFF',
      group: 'performance',
    },
    {
      id: 'virtualization',
      name: 'Virtualization',
      shortLabel: 'Virtualization',
      description:
        'Keeping large editable tables responsive by rendering visible rows and mounting input components only when needed.',
      color: '#00695C',
      legend: '#FFFFFF',
      keySpan: 2,
      group: 'performance',
    },
    {
      id: 'jest',
      name: 'Jest',
      shortLabel: 'Jest',
      description:
        'Writing unit tests for application logic, reusable modules, and predictable component behavior.',
      color: '#99425B',
      legend: '#FFFFFF',
      group: 'testing',
    },
    {
      id: 'vite',
      name: 'Vite',
      shortLabel: 'Vite',
      description:
        'Using modern build tooling to streamline frontend development and maintain efficient build workflows.',
      color: '#646CFF',
      legend: '#FFFFFF',
      group: 'tooling-ui',
    },
    {
      id: 'cicd',
      name: 'CI/CD',
      shortLabel: 'CI/CD',
      description:
        'Working with automated build, test, validation, publishing, and deployment pipelines in Nx-based monorepos.',
      color: '#37474F',
      legend: '#ECEFF1',
      group: 'tooling-ui',
    },
    {
      id: 'material-ui',
      name: 'Material UI',
      shortLabel: 'MUI',
      description:
        'Building consistent, reusable interfaces for complex administrative applications.',
      color: '#007FFF',
      legend: '#FFFFFF',
      group: 'tooling-ui',
    },
    {
      id: 'react-testing-library',
      name: 'React Testing Library',
      shortLabel: 'RTL',
      description:
        'Testing React components through user-focused interactions and observable application behavior.',
      color: '#CB4645',
      legend: '#FFFFFF',
      group: 'testing',
    },
  ],
  ai: [
    // AI packing note: `llm-apis` sits before `api-integrations` so five
    // double-width keys fill four complete rows (20 cells) without overflow.
    {
      id: 'n8n',
      name: 'n8n',
      shortLabel: 'n8n',
      description:
        'Building multi-step AI automations with external APIs, branching logic, retries, and structured result handling.',
      color: '#EA4B71',
      legend: '#FFFFFF',
      group: 'automation',
    },
    {
      id: 'workflow-automation',
      name: 'Workflow Automation',
      shortLabel: 'Workflows',
      description:
        'Automating GitHub code reviews, research, and recruitment operations through integrated, multi-step workflows.',
      color: '#5C6BC0',
      legend: '#FFFFFF',
      keySpan: 2,
      group: 'automation',
    },
    {
      id: 'webhooks',
      name: 'Webhooks',
      shortLabel: 'Hooks',
      description:
        'Connecting event-driven systems through webhook triggers, automated processing, and API communication.',
      color: '#00897B',
      legend: '#FFFFFF',
      group: 'automation',
    },
    {
      id: 'llm-apis',
      name: 'LLM APIs',
      shortLabel: 'LLM',
      description:
        'Integrating LLMs into workflows with contextual inputs, structured outputs, retries, and completeness validation.',
      color: '#6A1B9A',
      legend: '#FFFFFF',
      group: 'llm',
    },
    {
      id: 'api-integrations',
      name: 'API Integrations',
      shortLabel: 'APIs',
      description:
        'Integrating external platforms and AI services into automated workflows with structured data exchange.',
      color: '#1565C0',
      legend: '#FFFFFF',
      keySpan: 2,
      group: 'automation',
    },
    {
      id: 'prompt-engineering',
      name: 'Prompt Engineering',
      shortLabel: 'Prompts',
      description:
        'Structuring prompts, task context, and output requirements to improve consistency across LLM-powered workflows.',
      color: '#8E24AA',
      legend: '#FFFFFF',
      keySpan: 2,
      group: 'llm',
    },
    {
      id: 'ai-agents',
      name: 'AI Agents',
      shortLabel: 'Agents',
      description:
        'Building configuration and chat interfaces for AI-agent workflows, connecting users to automated processes.',
      color: '#4527A0',
      legend: '#FFFFFF',
      group: 'llm',
    },
    {
      id: 'data-extraction',
      name: 'Data Extraction',
      shortLabel: 'Extraction',
      description:
        'Extracting structured information from emails, documents, and external sources using AI-powered workflows.',
      color: '#0277BD',
      legend: '#FFFFFF',
      keySpan: 2,
      group: 'data',
    },
    {
      id: 'data-enrichment',
      name: 'Data Enrichment',
      shortLabel: 'Enrichment',
      description:
        'Combining external data sources and LLM processing to produce more complete, actionable information.',
      color: '#0288D1',
      legend: '#FFFFFF',
      keySpan: 2,
      group: 'data',
    },
    {
      id: 'cursor',
      name: 'Cursor',
      shortLabel: 'Cursor',
      description:
        'Using AI-assisted development workflows to accelerate implementation, debugging, and codebase exploration.',
      color: '#1A1A1A',
      legend: '#F5F5F5',
      group: 'ai-dev',
    },
    {
      id: 'claude-code',
      name: 'Claude Code',
      shortLabel: 'Claude',
      description:
        'Applying AI coding assistance to implementation planning, code analysis, and iterative development.',
      color: '#D97757',
      legend: '#1A120E',
      group: 'ai-dev',
    },
    {
      id: 'github-copilot',
      name: 'GitHub Copilot',
      shortLabel: 'Copilot',
      description:
        'Supporting development with AI-assisted suggestions, code generation, and routine implementation tasks.',
      color: '#24292F',
      legend: '#FFFFFF',
      group: 'ai-dev',
    },
    {
      id: 'github-integration',
      name: 'GitHub Integration',
      shortLabel: 'GitHub',
      description:
        'Processing pull request changes and diffs as inputs for automated AI-assisted code review.',
      color: '#2B3137',
      legend: '#FFFFFF',
      group: 'integrations',
    },
    {
      id: 'jira-integration',
      name: 'Jira Integration',
      shortLabel: 'Jira',
      description:
        'Enriching automated code reviews with relevant Jira task context to support more actionable feedback.',
      color: '#0052CC',
      legend: '#FFFFFF',
      group: 'integrations',
    },
    {
      id: 'mcp',
      name: 'MCP',
      shortLabel: 'MCP',
      description:
        'Exploring Model Context Protocol for connecting AI development tools with external context and capabilities.',
      color: '#111827',
      legend: '#A5B4FC',
      group: 'ai-dev',
    },
  ],
} as const satisfies Record<SkillBoardCategory, readonly SkillDefinition[]>

export type SkillId = (typeof skills)['fe'][number]['id'] | (typeof skills)['ai'][number]['id']

/** Flat lookup derived from the catalog — never a second source of skill data. */
export const SKILLS: Record<SkillId, SkillDefinition> = Object.fromEntries(
  [...skills.fe, ...skills.ai].map((skill) => [skill.id, skill]),
) as Record<SkillId, SkillDefinition>

export const SKILL_LIST: SkillDefinition[] = Object.values(SKILLS)

export function getSkill(id: SkillId): SkillDefinition {
  return SKILLS[id]
}

export function getSkillsForBoard(board: SkillBoardCategory): readonly SkillDefinition[] {
  return skills[board]
}

/** Resolved physical keycaps for a board — derived from catalog order + keySpan. */
export function getBoardKeyLayout(board: SkillBoardCategory) {
  return placeSkillsOnMacropad(skills[board])
}

export function getSkillMapCoverage(board: SkillBoardCategory) {
  const boardSkills = skills[board]
  const ids = boardSkills.map((skill) => skill.id)
  const unique = new Set(ids)
  const placed = placeSkillsOnMacropad(boardSkills)
  const occupied = countOccupiedCells(placed)
  const overflow = occupied > MACROPAD_CELLS
  const underfilled = boardSkills.length > 0 && occupied < MACROPAD_CELLS

  return {
    mappedCount: boardSkills.length,
    uniqueCount: unique.size,
    expectedCount: boardSkills.length,
    placedCount: placed.length,
    occupiedCells: occupied,
    keyCapacity: MACROPAD_CELLS,
    overflow,
    underfilled,
    duplicates: ids.length !== unique.size,
    complete:
      !overflow &&
      !underfilled &&
      ids.length === unique.size &&
      placed.length === boardSkills.length &&
      occupied === MACROPAD_CELLS,
  }
}

export function isSkillBoardCategoryEnabled(board: SkillBoardCategory): boolean {
  return SKILL_BOARD_CATEGORY_CONFIG[board].enabled
}

export function canSelectSkillBoardCategory(board: SkillBoardCategory): boolean {
  return isSkillBoardCategoryEnabled(board)
}
