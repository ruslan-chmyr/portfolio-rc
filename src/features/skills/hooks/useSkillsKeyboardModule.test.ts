import { act, createElement, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  SkillsKeyboardModuleCancelledError,
  type SkillsKeyboardModuleStatus,
} from '../lib/skillsKeyboardModuleLoader'

const request = vi.fn()
const cancel = vi.fn()
const getStatus = vi.fn(() => 'idle' as SkillsKeyboardModuleStatus)
const getComponent = vi.fn(() => null as (() => null) | null)

vi.mock('../lib/skillsKeyboardModuleLoader', async () => {
  const actual = await vi.importActual<
    typeof import('../lib/skillsKeyboardModuleLoader')
  >('../lib/skillsKeyboardModuleLoader')
  return {
    ...actual,
    createSkillsKeyboardModuleLoader: () => ({
      getStatus,
      getComponent,
      request,
      cancel,
    }),
  }
})

import { useSkillsKeyboardModule } from './useSkillsKeyboardModule'

type HookValue = ReturnType<typeof useSkillsKeyboardModule>

function renderModuleHook(initialLoad: boolean) {
  const result: { current: HookValue | null } = { current: null }
  let root!: Root
  let setLoad!: (next: boolean) => void

  function Probe({ load }: { load: boolean }) {
    result.current = useSkillsKeyboardModule(load)
    return null
  }

  function Harness() {
    const [load, set] = useState(initialLoad)
    setLoad = set
    return createElement(Probe, { load })
  }

  act(() => {
    const host = document.createElement('div')
    root = createRoot(host)
    root.render(createElement(Harness))
  })

  return {
    get current() {
      if (!result.current) throw new Error('Hook did not render')
      return result.current
    },
    setLoad(next: boolean) {
      act(() => setLoad(next))
    },
    unmount() {
      act(() => root.unmount())
    },
  }
}

describe('useSkillsKeyboardModule', () => {
  beforeEach(() => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
      true
    vi.useRealTimers()
    request.mockReset()
    cancel.mockReset()
    getStatus.mockReset()
    getComponent.mockReset()
    getStatus.mockReturnValue('idle')
    getComponent.mockReturnValue(null)
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('does not request the module until shouldLoad is true', () => {
    request.mockResolvedValue(() => null)
    const hook = renderModuleHook(false)
    expect(hook.current.status).toBe('idle')
    expect(request).not.toHaveBeenCalled()
    hook.unmount()
  })

  it('requests once when shouldLoad becomes true and surfaces ready', async () => {
    const Canvas = () => null
    request.mockImplementation(async () => {
      getStatus.mockReturnValue('ready')
      getComponent.mockReturnValue(Canvas)
      return Canvas
    })

    const hook = renderModuleHook(false)
    expect(request).not.toHaveBeenCalled()

    hook.setLoad(true)
    expect(request).toHaveBeenCalledTimes(1)

    await act(async () => {
      await Promise.resolve()
    })

    expect(hook.current.status).toBe('ready')
    expect(hook.current.Component).toBe(Canvas)

    hook.setLoad(true)
    expect(request).toHaveBeenCalledTimes(1)
    hook.unmount()
  })

  it('cancels an in-flight load on unmount', () => {
    getStatus.mockReturnValue('loading')
    request.mockReturnValue(new Promise(() => undefined))
    const hook = renderModuleHook(true)
    expect(request).toHaveBeenCalledTimes(1)
    hook.unmount()
    expect(cancel).toHaveBeenCalled()
  })

  it('ignores cancelled rejections without entering error', async () => {
    request.mockRejectedValue(new SkillsKeyboardModuleCancelledError())
    const hook = renderModuleHook(true)
    await act(async () => {
      await Promise.resolve()
    })
    expect(hook.current.status).not.toBe('error')
    hook.unmount()
  })

  it('retries once after import failure while still loading', async () => {
    vi.useFakeTimers()
    const Canvas = () => null
    request
      .mockRejectedValueOnce(new Error('chunk failed'))
      .mockResolvedValueOnce(Canvas)

    const hook = renderModuleHook(true)
    await act(async () => {
      await Promise.resolve()
    })
    expect(hook.current.status).toBe('error')
    expect(request).toHaveBeenCalledTimes(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(800)
      await Promise.resolve()
    })

    expect(request).toHaveBeenCalledTimes(2)
    expect(hook.current.status).toBe('ready')
    expect(hook.current.Component).toBe(Canvas)
    hook.unmount()
  })

  it('simulates Strict Mode remount: cancel then load again', async () => {
    const Canvas = () => null
    request.mockResolvedValue(Canvas)

    const first = renderModuleHook(true)
    expect(request).toHaveBeenCalledTimes(1)
    getStatus.mockReturnValue('loading')
    first.unmount()
    expect(cancel).toHaveBeenCalled()

    getStatus.mockReturnValue('idle')
    getComponent.mockReturnValue(null)
    const second = renderModuleHook(true)
    expect(request).toHaveBeenCalledTimes(2)

    await act(async () => {
      await Promise.resolve()
    })
    expect(second.current.status).toBe('ready')
    second.unmount()
  })

  it('uses cached component without a new request', async () => {
    const Canvas = () => null
    getComponent.mockReturnValue(Canvas)
    getStatus.mockReturnValue('ready')

    const hook = renderModuleHook(true)
    expect(request).not.toHaveBeenCalled()
    expect(hook.current.status).toBe('ready')
    expect(hook.current.Component).toBe(Canvas)
    hook.unmount()
  })
})
