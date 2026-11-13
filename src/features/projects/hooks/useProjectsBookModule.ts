import { useEffect, useState, type ComponentType } from 'react'
import type { ProjectBookSceneProps } from '../components/book/ProjectBookScene'

export type ProjectsBookModuleStatus = 'idle' | 'loading' | 'ready' | 'error'

let preloadPromise:
  | Promise<typeof import('../components/book/ProjectBookScene')>
  | null = null

/** Kick the dynamic import without mounting the Canvas. Deduped; retries after failure. */
export function preloadProjectBookScene(): Promise<
  typeof import('../components/book/ProjectBookScene')
> {
  if (!preloadPromise) {
    preloadPromise = import('../components/book/ProjectBookScene').catch(
      (error) => {
        preloadPromise = null
        throw error
      },
    )
  }
  return preloadPromise
}

/** Test helper — reset the shared preload promise. */
export function resetProjectBookScenePreload(): void {
  preloadPromise = null
}

/**
 * @param shouldPreload — start fetching the chunk early (Skills approach / nav hover)
 */
export function useProjectsBookModule(shouldPreload: boolean): {
  status: ProjectsBookModuleStatus
  Component: ComponentType<ProjectBookSceneProps> | null
  retry: () => void
} {
  const [status, setStatus] = useState<ProjectsBookModuleStatus>('idle')
  const [Component, setComponent] = useState<
    ComponentType<ProjectBookSceneProps> | null
  >(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!shouldPreload) return
    let active = true

    if (Component) {
      setStatus('ready')
      return () => {
        active = false
      }
    }

    setStatus('loading')

    void preloadProjectBookScene()
      .then((mod) => {
        if (!active) return
        setComponent(() => mod.ProjectBookScene)
        setStatus('ready')
      })
      .catch(() => {
        if (!active) return
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [Component, shouldPreload, attempt])

  // One delayed retry after a failed import (clears the rejected promise).
  useEffect(() => {
    if (status !== 'error' || !shouldPreload) return
    if (attempt > 0) return
    const t = window.setTimeout(() => {
      resetProjectBookScenePreload()
      setAttempt(1)
    }, 1600)
    return () => window.clearTimeout(t)
  }, [attempt, shouldPreload, status])

  const retry = () => {
    resetProjectBookScenePreload()
    setComponent(null)
    setStatus('idle')
    setAttempt((n) => n + 1)
  }

  return { status, Component, retry }
}
