/** @vitest-environment jsdom */
import { createElement, act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../model/experienceConfig', async () => {
  const actual = await vi.importActual<typeof import('../model/experienceConfig')>(
    '../model/experienceConfig',
  )
  return {
    ...actual,
    EXPERIENCE_CV_PDF_URL: 'https://cdn.example.com/ruslan-chmyr-cv.pdf',
  }
})

import { ExperienceCvCta } from './ExperienceCvCta'

describe('ExperienceCvCta enabled', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
      true
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
  })

  it('renders an accessible external PDF link when configured', () => {
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)

    act(() => {
      root.render(createElement(ExperienceCvCta))
    })

    const link = container.querySelector('a')
    expect(link).not.toBeNull()
    expect(link?.getAttribute('href')).toBe(
      'https://cdn.example.com/ruslan-chmyr-cv.pdf',
    )
    expect(link?.getAttribute('target')).toBe('_blank')
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer')
    expect(link?.textContent).toContain('View Full CV')
  })
})
