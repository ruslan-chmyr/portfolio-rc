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
    EXPERIENCE_CV_PDF_URL: '',
  }
})

import { ExperienceCvCta } from './ExperienceCvCta'

describe('ExperienceCvCta', () => {
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

  it('renders CTA copy and a non-link disabled control when PDF is unset', () => {
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)

    act(() => {
      root.render(createElement(ExperienceCvCta))
    })

    expect(container.textContent).toContain('Want the full picture?')
    expect(container.textContent).toContain(
      'Explore my complete experience, skills, and professional background in my CV.',
    )
    expect(container.querySelector('a')).toBeNull()
    const disabled = container.querySelector('[aria-disabled="true"]')
    expect(disabled?.tagName).toBe('SPAN')
    expect(disabled?.textContent).toContain('View Full CV')
    const rootCta = container.querySelector('[data-experience-cta]')
    expect(rootCta?.hasAttribute('inert')).toBe(true)
  })
})
