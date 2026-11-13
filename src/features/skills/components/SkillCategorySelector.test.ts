// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SkillCategorySelector } from './SkillCategorySelector'

function fireGroupKey(group: Element, key: string) {
  act(() => {
    group.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
    )
  })
}

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

  it('moves DOM focus with arrows / Home / End and updates aria-pressed on rerender', () => {
    const onSelect = vi.fn()
    act(() => {
      root.render(
        createElement(SkillCategorySelector, {
          activeCategory: 'fe',
          onSelect,
        }),
      )
    })

    const group = container.querySelector('[role="group"]')!
    const buttons = () => container.querySelectorAll<HTMLButtonElement>('button')
    expect(buttons()[0]?.getAttribute('aria-pressed')).toBe('true')
    expect(buttons()[1]?.getAttribute('aria-pressed')).toBe('false')

    act(() => {
      buttons()[0]?.focus()
    })
    expect(document.activeElement).toBe(buttons()[0])

    fireGroupKey(group, 'ArrowRight')
    expect(onSelect).toHaveBeenCalledWith('ai')
    expect(document.activeElement).toBe(buttons()[1])
    expect(document.activeElement).not.toBe(document.body)

    act(() => {
      root.render(
        createElement(SkillCategorySelector, {
          activeCategory: 'ai',
          onSelect,
        }),
      )
    })
    expect(buttons()[0]?.getAttribute('aria-pressed')).toBe('false')
    expect(buttons()[1]?.getAttribute('aria-pressed')).toBe('true')

    fireGroupKey(group, 'ArrowLeft')
    expect(onSelect).toHaveBeenCalledWith('fe')
    expect(document.activeElement).toBe(buttons()[0])

    fireGroupKey(group, 'End')
    expect(document.activeElement).toBe(buttons()[1])

    fireGroupKey(group, 'Home')
    expect(document.activeElement).toBe(buttons()[0])
  })

  it('keeps the active button enabled while locked and does not change category', () => {
    const onSelect = vi.fn()
    act(() => {
      root.render(
        createElement(SkillCategorySelector, {
          activeCategory: 'fe',
          onSelect,
          locked: true,
        }),
      )
    })

    const group = container.querySelector('[role="group"]')!
    const buttons = container.querySelectorAll<HTMLButtonElement>('button')
    expect(buttons[0]?.disabled).toBe(false)
    expect(buttons[1]?.disabled).toBe(true)

    act(() => {
      buttons[0]?.focus()
    })
    fireGroupKey(group, 'ArrowRight')
    expect(onSelect).not.toHaveBeenCalled()
    // Disabled AI is skipped; focus stays on the active FE control (not <body>).
    expect(document.activeElement).toBe(buttons[0])
    expect(document.activeElement).not.toBe(document.body)
  })
})
