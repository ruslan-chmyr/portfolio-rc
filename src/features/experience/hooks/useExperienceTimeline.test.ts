// @vitest-environment jsdom
import { createElement, act, useRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const createController = vi.fn()
const applyStatic = vi.fn()

vi.mock('../lib/createExperienceTimelineController', () => ({
  createExperienceTimelineController: (...args: unknown[]) =>
    createController(...args),
  applyExperienceStaticPresentation: (...args: unknown[]) => applyStatic(...args),
}))

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: { refresh: vi.fn() },
}))

import { useExperienceTimeline } from './useExperienceTimeline'
import type { ExperienceEntry } from '../model/experienceConfig'

const ENTRIES = [
  {
    id: 'a',
    year: '2026',
    dateTime: '2026-03',
    period: 'Mar 2026',
    role: 'A',
    organization: 'Org',
    summary: 'Summary text that is long enough for the config checks to pass easily.',
  },
  {
    id: 'b',
    year: '2023',
    dateTime: '2023-02',
    period: 'Feb 2023',
    role: 'B',
    organization: 'Org',
    summary: 'Summary text that is long enough for the config checks to pass easily.',
  },
] as const satisfies readonly ExperienceEntry[]

function Harness({
  entries = ENTRIES,
  omitNode = false,
}: {
  entries?: readonly ExperienceEntry[]
  omitNode?: boolean
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const yearRef = useRef<HTMLParagraphElement>(null)
  useExperienceTimeline({ trackRef, progressRef, yearRef, entries })

  return createElement(
    'section',
    { id: 'experience' },
    createElement('p', {
      className: 'experience-timeline__year',
      ref: yearRef,
    }, '2026'),
    createElement(
      'div',
      {
        className: 'experience-timeline__track',
        ref: trackRef,
      },
      createElement('div', {
        className: 'experience-timeline__progress',
        ref: progressRef,
      }),
      createElement('span', { 'data-experience-node': '' }),
      omitNode ? null : createElement('span', { 'data-experience-node': '' }),
      createElement('span', {
        'data-experience-node': '',
        'data-experience-endpoint-node': '',
      }),
      createElement('article', { 'data-experience-card': '' }),
      createElement('article', { 'data-experience-card': '' }),
    ),
  )
}

describe('useExperienceTimeline', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
      true
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    createController.mockReturnValue({ dispose: vi.fn() })
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('creates the controller when career nodes match cards', () => {
    act(() => {
      root.render(createElement(Harness))
    })
    expect(createController).toHaveBeenCalled()
    expect(applyStatic).not.toHaveBeenCalled()
  })

  it('fail-opens to unready when a career node is missing', () => {
    act(() => {
      root.render(createElement(Harness, { omitNode: true }))
    })
    expect(createController).not.toHaveBeenCalled()
    expect(applyStatic).toHaveBeenCalled()
    const motion = applyStatic.mock.calls[0]?.[1]
    expect(motion).toBe('unready')
  })

  it('fail-opens to error when controller construction throws', () => {
    createController.mockImplementation(() => {
      throw new Error('boom-secret')
    })
    act(() => {
      root.render(createElement(Harness))
    })
    expect(applyStatic).toHaveBeenCalled()
    expect(applyStatic.mock.calls[0]?.[1]).toBe('error')
    const section = container.querySelector('section')
    expect(section?.dataset.experienceError).toBe('timeline-init-failed')
    expect(section?.dataset.experienceError).not.toContain('boom')
  })
})
