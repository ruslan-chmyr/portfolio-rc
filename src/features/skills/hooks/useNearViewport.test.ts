import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRef } from 'react'
import { useNearViewport, type UseNearViewportOptions } from './useNearViewport'

type ObserverCallback = IntersectionObserverCallback

function renderNearHook(
  targetRef: React.RefObject<Element | null>,
  options?: UseNearViewportOptions,
) {
  const result: { current: boolean | null } = { current: null }
  let root!: Root

  function Probe() {
    result.current = useNearViewport(targetRef, options)
    return null
  }

  act(() => {
    const host = document.createElement('div')
    root = createRoot(host)
    root.render(createElement(Probe))
  })

  return {
    get current() {
      if (result.current === null) throw new Error('Hook did not render')
      return result.current
    },
    unmount() {
      act(() => {
        root.unmount()
      })
    },
  }
}

describe('useNearViewport', () => {
  const OriginalIO = globalThis.IntersectionObserver
  let callback: ObserverCallback | null = null
  let observe = vi.fn()
  let disconnect = vi.fn()

  beforeEach(() => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
      true
    callback = null
    observe = vi.fn()
    disconnect = vi.fn()
    class FakeIO {
      constructor(cb: ObserverCallback) {
        callback = cb
      }
      observe = observe
      unobserve = vi.fn()
      disconnect = disconnect
      takeRecords = () => []
      root = null
      rootMargin = ''
      thresholds = []
    }
    vi.stubGlobal('IntersectionObserver', FakeIO)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    if (OriginalIO) globalThis.IntersectionObserver = OriginalIO
    else delete (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver
  })

  it('starts false and latches true once near, then disconnects', () => {
    const targetRef = createRef<HTMLDivElement>()
    targetRef.current = document.createElement('div')
    const hook = renderNearHook(targetRef, { rootMargin: '40% 0px', latch: true })

    expect(hook.current).toBe(false)
    expect(observe).toHaveBeenCalledWith(targetRef.current)

    act(() => {
      callback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      )
    })

    expect(hook.current).toBe(true)
    expect(disconnect).toHaveBeenCalled()

    act(() => {
      callback?.(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      )
    })
    expect(hook.current).toBe(true)
    hook.unmount()
  })

  it('falls back to near when IntersectionObserver is missing', () => {
    delete (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver
    const targetRef = createRef<HTMLDivElement>()
    targetRef.current = document.createElement('div')
    const hook = renderNearHook(targetRef)
    expect(hook.current).toBe(true)
    hook.unmount()
  })

  it('reports not near when disabled', () => {
    const targetRef = createRef<HTMLDivElement>()
    targetRef.current = document.createElement('div')
    const hook = renderNearHook(targetRef, { enabled: false })
    expect(hook.current).toBe(false)
    expect(observe).not.toHaveBeenCalled()
    hook.unmount()
  })

  it('disconnects on unmount', () => {
    const targetRef = createRef<HTMLDivElement>()
    targetRef.current = document.createElement('div')
    const hook = renderNearHook(targetRef)
    hook.unmount()
    expect(disconnect).toHaveBeenCalled()
  })
})
