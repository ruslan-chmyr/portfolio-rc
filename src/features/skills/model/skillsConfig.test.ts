import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import {
  DEFAULT_SKILL_BOARD_CATEGORY,
  SKILL_BOARD_CATEGORY_CONFIG,
  SKILLS,
  canSelectSkillBoardCategory,
  getBoardKeyLayout,
  getSkillMapCoverage,
  getSkillsForBoard,
  skills,
} from './skillsConfig'
import {
  KEYBOARD_LAYOUT,
  MACROPAD_CELLS,
  countOccupiedCells,
  placeSkillsOnMacropad,
  resolveKeyboardLayout,
} from './keyboardLayout'
import { getSkillVisual } from './skillVisuals'
import { hasSkillDescription, resolveSkillSelection } from '../lib/skillSelection'
import { SkillInspection } from '../components/SkillInspection'

describe('skillsConfig boards', () => {
  it('defaults to FE and keeps Node.js disabled until configured', () => {
    expect(DEFAULT_SKILL_BOARD_CATEGORY).toBe('fe')
    expect(SKILL_BOARD_CATEGORY_CONFIG.fe.enabled).toBe(true)
    expect(SKILL_BOARD_CATEGORY_CONFIG.ai.enabled).toBe(true)
    expect(SKILL_BOARD_CATEGORY_CONFIG.nodejs.enabled).toBe(false)
    expect(canSelectSkillBoardCategory('nodejs')).toBe(false)
    expect(getSkillsForBoard('nodejs')).toHaveLength(0)
    expect(skills.nodejs).toHaveLength(0)
  })

  it('includes exactly the approved FE skills', () => {
    const fe = getSkillsForBoard('fe').map((skill) => skill.name)
    expect(fe).toEqual([
      'TypeScript',
      'JavaScript',
      'React',
      'Next.js',
      'Redux Toolkit',
      'RTK Query',
      'REST APIs',
      'WebSockets',
      'System Design',
      'Micro Frontends',
      'Module Federation',
      'Nx / Monorepos',
      'Performance Optimization',
      'Virtualization',
      'Jest',
      'Vite',
      'CI/CD',
      'Material UI',
      'React Testing Library',
    ])
    expect(fe).toHaveLength(19)
  })

  it('includes exactly the approved AI skills', () => {
    const ai = getSkillsForBoard('ai').map((skill) => skill.name)
    expect(ai).toEqual([
      'n8n',
      'Workflow Automation',
      'Webhooks',
      'LLM APIs',
      'API Integrations',
      'Prompt Engineering',
      'AI Agents',
      'Data Extraction',
      'Data Enrichment',
      'Cursor',
      'Claude Code',
      'GitHub Copilot',
      'GitHub Integration',
      'Jira Integration',
      'MCP',
    ])
    expect(ai).toHaveLength(15)
  })

  it('keeps short keycap labels readable', () => {
    for (const skill of Object.values(SKILLS)) {
      expect(skill.shortLabel.length).toBeGreaterThan(0)
      expect(skill.shortLabel.length).toBeLessThanOrEqual(14)
    }
  })

  it('populates professional descriptions for all FE and AI skills', () => {
    const fe = getSkillsForBoard('fe')
    const ai = getSkillsForBoard('ai')
    expect(fe).toHaveLength(19)
    expect(ai).toHaveLength(15)
    for (const skill of [...fe, ...ai]) {
      expect(skill.description.trim().length).toBeGreaterThan(20)
      expect(skill.description).not.toMatch(/%|\byears?\b|\bproficien/i)
    }
    expect(SKILLS.typescript.description).toContain('type-safe applications')
    expect(SKILLS.react.description).toContain('Architecting complex React interfaces')
    expect(SKILLS['system-design'].description).toContain('reusable frontend systems')
    expect(SKILLS.n8n.description).toContain('multi-step AI automations')
    expect(SKILLS.mcp.description).toContain('Model Context Protocol')
    expect(skills.nodejs).toHaveLength(0)
  })
})

describe('variable-width macropad placement', () => {
  it('fills exactly 20 cells for FE and AI with valid wide keys', () => {
    expect(getSkillMapCoverage('fe').complete).toBe(true)
    expect(getSkillMapCoverage('ai').complete).toBe(true)
    expect(getSkillMapCoverage('nodejs').occupiedCells).toBe(0)

    const fe = getBoardKeyLayout('fe')
    const ai = getBoardKeyLayout('ai')
    expect(countOccupiedCells(fe)).toBe(MACROPAD_CELLS)
    expect(countOccupiedCells(ai)).toBe(MACROPAD_CELLS)
    expect(fe).toHaveLength(19)
    expect(ai).toHaveLength(15)

    const virtualization = fe.find((key) => key.skillId === 'virtualization')
    expect(virtualization?.span).toBe(2)
    expect(virtualization?.row).toBe(2)
    expect(virtualization?.col).toBe(3)
    expect(SKILLS.virtualization.shortLabel).toBe('Virtualization')

    const wideAi = ai.filter((key) => key.span === 2).map((key) => key.skillId)
    expect(wideAi).toEqual([
      'workflow-automation',
      'api-integrations',
      'prompt-engineering',
      'data-extraction',
      'data-enrichment',
    ])
  })

  it('never wraps a double-width key across rows or overlaps cells', () => {
    for (const board of ['fe', 'ai'] as const) {
      const placed = placeSkillsOnMacropad(getSkillsForBoard(board))
      const occupied = new Set<string>()
      for (const key of placed) {
        expect(key.col + key.span).toBeLessThanOrEqual(5)
        for (let c = key.col; c < key.col + key.span; c += 1) {
          const cell = `${key.row}:${c}`
          expect(occupied.has(cell)).toBe(false)
          occupied.add(cell)
        }
      }
      expect(occupied.size).toBe(MACROPAD_CELLS)
    }
  })
})

describe('keyboardLayout', () => {
  it('keeps a stable 5×4 chassis reference independent of skill spans', () => {
    const resolved = resolveKeyboardLayout()
    expect(KEYBOARD_LAYOUT).toHaveLength(20)
    expect(resolved).toHaveLength(20)
    expect(resolved.every((key) => Number.isFinite(key.worldX))).toBe(true)
    expect('skillId' in KEYBOARD_LAYOUT[0]).toBe(false)
  })
})

describe('skill visuals from config', () => {
  it('derives accent colors from the centralized skill definitions', () => {
    for (const skill of Object.values(SKILLS)) {
      const visual = getSkillVisual(skill.id)
      expect(visual.accent).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(visual.legend).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })
})

describe('skill selection + inspection', () => {
  it('toggles selection off when the same skill is clicked again', () => {
    expect(resolveSkillSelection(null, 'react')).toBe('react')
    expect(resolveSkillSelection('react', 'react')).toBe('react')
    expect(resolveSkillSelection('react', 'vite')).toBe('vite')
  })

  it('treats empty descriptions as absent — no placeholder copy', () => {
    expect(hasSkillDescription('')).toBe(false)
    expect(hasSkillDescription('   ')).toBe(false)
    expect(hasSkillDescription('Typed APIs across the board.')).toBe(true)

    const authored = renderToStaticMarkup(
      createElement(SkillInspection, { skill: SKILLS.typescript }),
    )
    expect(authored).toContain('TypeScript')
    expect(authored).toContain('skills-inspection__description')
    expect(authored).toContain('type-safe applications')
    expect(authored).not.toContain('Coming soon')

    const emptyDescription = renderToStaticMarkup(
      createElement(SkillInspection, {
        skill: { ...SKILLS.typescript, description: '' },
      }),
    )
    expect(emptyDescription).toContain('TypeScript')
    expect(emptyDescription).not.toContain('skills-inspection__description')
    expect(emptyDescription).not.toContain('Coming soon')

    const idle = renderToStaticMarkup(createElement(SkillInspection, { skill: null }))
    expect(idle).toContain('data-mode="idle"')
    expect(idle).toContain('Explore my skills')
    expect(idle).toContain('Hover, tap, or press a key.')
  })

  it('shows configured icons in inspection and leaves abstract skills text-only', () => {
    expect(SKILLS.typescript.icon).toBeTruthy()
    expect(SKILLS.react.icon).toBeTruthy()
    expect(SKILLS.nextjs.icon).toBeTruthy()
    expect(SKILLS['system-design'].icon).toBeUndefined()

    const withIcon = renderToStaticMarkup(
      createElement(SkillInspection, { skill: SKILLS.typescript }),
    )
    expect(withIcon).toContain('data-mode="skill"')
    expect(withIcon).toContain('skills-inspection__icon')
    expect(withIcon).toContain('data:image/svg+xml')

    const withoutIcon = renderToStaticMarkup(
      createElement(SkillInspection, { skill: SKILLS['system-design'] }),
    )
    expect(withoutIcon).toContain('System Design')
    expect(withoutIcon).not.toContain('skills-inspection__icon')
  })
})
