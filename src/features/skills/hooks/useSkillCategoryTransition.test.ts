import { createElement, act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SKILL_BOARD_CATEGORY } from '../model/skillsConfig'
import { useSkillCategoryTransition } from './useSkillCategoryTransition'

type HookValue = ReturnType<typeof useSkillCategoryTransition>

function renderTransitionHook() {
  const result: { current: HookValue | null } = { current: null }
  let root!: Root

  function Probe() {
    result.current = useSkillCategoryTransition()
    return null
  }

  act(() => {
    const host = document.createElement('div')
    root = createRoot(host)
    root.render(createElement(Probe))
  })

  return {
    get current() {
      if (!result.current) throw new Error('Hook did not render')
      return result.current
    },
    unmount() {
      act(() => {
        root.unmount()
      })
    },
  }
}

function stubReducedMotion(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? matches : false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    })),
  )
}

describe('useSkillCategoryTransition', () => {
  let hook: ReturnType<typeof renderTransitionHook>

  beforeEach(() => {
    // React 19 act() requires an explicit act environment under Vitest/jsdom.
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
      true
    stubReducedMotion(false)
  })

  afterEach(() => {
    hook?.unmount()
    vi.unstubAllGlobals()
  })

  it('starts on FE with matching display category and no flip', () => {
    hook = renderTransitionHook()
    expect(hook.current.activeCategory).toBe(DEFAULT_SKILL_BOARD_CATEGORY)
    expect(hook.current.displayCategory).toBe('fe')
    expect(hook.current.isFlipping).toBe(false)
    expect(hook.current.flipNonce).toBe(0)
  })

  it('starts FE → AI flip without swapping display until mid-flip', () => {
    hook = renderTransitionHook()
    const nonceBefore = hook.current.flipNonce

    act(() => {
      hook.current.selectCategory('ai')
    })

    expect(hook.current.activeCategory).toBe('ai')
    expect(hook.current.displayCategory).toBe('fe')
    expect(hook.current.isFlipping).toBe(true)
    expect(hook.current.flipNonce).toBe(nonceBefore + 1)
  })

  it('swaps display at mid-flip and settles on complete', () => {
    hook = renderTransitionHook()

    act(() => {
      hook.current.selectCategory('ai')
    })
    act(() => {
      hook.current.handleFlipSwap()
    })

    expect(hook.current.displayCategory).toBe('ai')
    expect(hook.current.isFlipping).toBe(true)

    act(() => {
      hook.current.handleFlipComplete()
    })

    expect(hook.current.isFlipping).toBe(false)
    expect(hook.current.displayCategory).toBe('ai')
    expect(hook.current.activeCategory).toBe('ai')
  })

  it('runs AI → FE after a completed flip', () => {
    hook = renderTransitionHook()

    act(() => {
      hook.current.selectCategory('ai')
    })
    act(() => {
      hook.current.handleFlipSwap()
      hook.current.handleFlipComplete()
    })

    const nonce = hook.current.flipNonce
    act(() => {
      hook.current.selectCategory('fe')
    })

    expect(hook.current.activeCategory).toBe('fe')
    expect(hook.current.displayCategory).toBe('ai')
    expect(hook.current.isFlipping).toBe(true)
    expect(hook.current.flipNonce).toBe(nonce + 1)

    act(() => {
      hook.current.handleFlipSwap()
      hook.current.handleFlipComplete()
    })

    expect(hook.current.displayCategory).toBe('fe')
    expect(hook.current.isFlipping).toBe(false)
  })

  it('queues the latest category requested during an active flip', () => {
    hook = renderTransitionHook()

    act(() => {
      hook.current.selectCategory('ai')
    })
    const firstNonce = hook.current.flipNonce

    // Rapid FE request while still flipping toward AI — chase after complete.
    act(() => {
      hook.current.selectCategory('fe')
    })

    expect(hook.current.activeCategory).toBe('fe')
    expect(hook.current.isFlipping).toBe(true)
    expect(hook.current.flipNonce).toBe(firstNonce)
    expect(hook.current.displayCategory).toBe('fe')

    act(() => {
      hook.current.handleFlipSwap()
    })
    expect(hook.current.displayCategory).toBe('ai')

    act(() => {
      hook.current.handleFlipComplete()
    })

    // Chase flip toward the latest active category.
    expect(hook.current.isFlipping).toBe(true)
    expect(hook.current.flipNonce).toBe(firstNonce + 1)
    expect(hook.current.activeCategory).toBe('fe')

    act(() => {
      hook.current.handleFlipSwap()
      hook.current.handleFlipComplete()
    })

    expect(hook.current.displayCategory).toBe('fe')
    expect(hook.current.isFlipping).toBe(false)
  })

  it('switches immediately when reduced motion is preferred', () => {
    stubReducedMotion(true)
    hook = renderTransitionHook()

    act(() => {
      hook.current.selectCategory('ai')
    })

    expect(hook.current.activeCategory).toBe('ai')
    expect(hook.current.displayCategory).toBe('ai')
    expect(hook.current.isFlipping).toBe(false)
    expect(hook.current.flipNonce).toBe(0)
  })

  it('ignores redundant current-category selection', () => {
    hook = renderTransitionHook()
    const nonce = hook.current.flipNonce

    act(() => {
      hook.current.selectCategory('fe')
    })
    expect(hook.current.activeCategory).toBe('fe')
    expect(hook.current.isFlipping).toBe(false)
    expect(hook.current.flipNonce).toBe(nonce)
  })

  it('forceFlip spins even when the category is unchanged', () => {
    hook = renderTransitionHook()
    const nonce = hook.current.flipNonce

    act(() => {
      hook.current.selectCategory('fe', { forceFlip: true })
    })

    expect(hook.current.activeCategory).toBe('fe')
    expect(hook.current.displayCategory).toBe('fe')
    expect(hook.current.isFlipping).toBe(true)
    expect(hook.current.flipNonce).toBe(nonce + 1)

    act(() => {
      hook.current.handleFlipSwap()
      hook.current.handleFlipComplete()
    })

    expect(hook.current.isFlipping).toBe(false)
    expect(hook.current.displayCategory).toBe('fe')
  })

  it('queues a forceFlip replay when a flip is already in flight', () => {
    hook = renderTransitionHook()

    act(() => {
      hook.current.selectCategory('ai')
    })
    const nonce = hook.current.flipNonce

    act(() => {
      hook.current.selectCategory('ai', { forceFlip: true })
    })
    expect(hook.current.flipNonce).toBe(nonce)
    expect(hook.current.isFlipping).toBe(true)

    act(() => {
      hook.current.handleFlipSwap()
      hook.current.handleFlipComplete()
    })

    expect(hook.current.isFlipping).toBe(true)
    expect(hook.current.flipNonce).toBe(nonce + 1)
    expect(hook.current.activeCategory).toBe('ai')

    act(() => {
      hook.current.handleFlipSwap()
      hook.current.handleFlipComplete()
    })
    expect(hook.current.isFlipping).toBe(false)
  })

  it('supports instant category swaps without starting a flip', () => {
    hook = renderTransitionHook()

    act(() => {
      hook.current.selectCategory('ai')
    })
    expect(hook.current.isFlipping).toBe(true)

    act(() => {
      hook.current.selectCategory('fe', { instant: true })
    })
    expect(hook.current.activeCategory).toBe('fe')
    expect(hook.current.displayCategory).toBe('fe')
    expect(hook.current.isFlipping).toBe(false)
  })
})
