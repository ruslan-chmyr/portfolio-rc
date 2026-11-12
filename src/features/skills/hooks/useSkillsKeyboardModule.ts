import { useEffect, useState, type ComponentType } from 'react'
import type { SkillsKeyboardCanvasProps } from '../components/SkillsKeyboardCanvas'
import {
  createSkillsKeyboardModuleLoader,
  isSkillsKeyboardModuleCancelled,
  type SkillsKeyboardModuleStatus,
} from '../lib/skillsKeyboardModuleLoader'

export type { SkillsKeyboardModuleStatus }

export type SkillsKeyboardModuleResult = {
  status: SkillsKeyboardModuleStatus
  Component: ComponentType<SkillsKeyboardCanvasProps> | null
}

/** One automatic retry after a failed chunk load while still near Skills. */
const IMPORT_RETRY_DELAY_MS = 750

/**
 * Dynamically imports `SkillsKeyboardCanvas` once `shouldLoad` becomes true.
 * Does not unload after success — Canvas stays mounted for the session.
 * Failed imports keep the section on the interactive fallback and retry once.
 */
export function useSkillsKeyboardModule(
  shouldLoad: boolean,
): SkillsKeyboardModuleResult {
  const [status, setStatus] = useState<SkillsKeyboardModuleStatus>('idle')
  const [Component, setComponent] = useState<ComponentType<SkillsKeyboardCanvasProps> | null>(
    null,
  )
  const [loader] = useState(createSkillsKeyboardModuleLoader)

  useEffect(() => {
    if (!shouldLoad) return

    let active = true
    let attempts = 0
    let retryTimer = 0

    const applyReady = (Canvas: ComponentType<SkillsKeyboardCanvasProps>) => {
      if (!active) return
      setComponent(() => Canvas)
      setStatus('ready')
    }

    const cached = loader.getComponent()
    if (cached) {
      applyReady(cached)
      return () => {
        active = false
      }
    }

    const load = () => {
      attempts += 1
      setStatus('loading')
      void loader
        .request()
        .then((Canvas) => {
          applyReady(Canvas)
        })
        .catch((error: unknown) => {
          if (!active) return
          if (isSkillsKeyboardModuleCancelled(error)) return
          setStatus('error')
          if (attempts >= 2) return
          retryTimer = window.setTimeout(() => {
            retryTimer = 0
            if (!active) return
            load()
          }, IMPORT_RETRY_DELAY_MS)
        })
    }

    load()

    return () => {
      active = false
      if (retryTimer) window.clearTimeout(retryTimer)
      if (loader.getStatus() === 'loading') loader.cancel()
    }
  }, [shouldLoad])

  return { status, Component }
}
