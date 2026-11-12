// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SkillCategorySelector } from './SkillCategorySelector'

describe('SkillCategorySelector', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
  })

  it('exposes aria-pressed on the active segment and moves focus with arrows', () => {
    const onSelect = vi.fn()
    act(() => {
      root.render(
        createElement(SkillCategorySelector, {
          activeCategory: 'fe',
          onSelect,
        }),
      )
    })

    const buttons = container.querySelectorAll('button')
    expect(buttons).toHaveLength(2)
    expect(buttons[0]?.getAttribute('aria-pressed')).toBe('true')
    expect(buttons[1]?.getAttribute('aria-pressed')).toBe('false')

    const group = container.querySelector('[role="group"]')!
    act(() => {
      group.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      )
    })
    expect(onSelect).toHaveBeenCalledWith('ai')
  })

  it('keeps the active button enabled while locked so focus is not dropped', () => {
    act(() => {
      root.render(
        createElement(SkillCategorySelector, {
          activeCategory: 'fe',
          onSelect: vi.fn(),
          locked: true,
        }),
      )
    })

    const buttons = container.querySelectorAll('button')
    expect(buttons[0]?.disabled).toBe(false)
    expect(buttons[1]?.disabled).toBe(true)
  })
})
