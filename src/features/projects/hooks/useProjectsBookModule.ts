import { useEffect, useState, type ComponentType } from 'react'
import type { ProjectBookSceneProps } from '../components/book/ProjectBookScene'

export type ProjectsBookModuleStatus = 'idle' | 'loading' | 'ready' | 'error'

let preloadPromise:
  | Promise<typeof import('../components/book/ProjectBookScene')>
  | null = null

/** Kick the dynamic import without mounting the Canvas. */
export function preloadProjectBookScene(): Promise<
  typeof import('../components/book/ProjectBookScene')
> {
  if (!preloadPromise) {
    preloadPromise = import('../components/book/ProjectBookScene')
  }
  return preloadPromise
}

/**
 * @param shouldPreload — start fetching the chunk early (Skills approach / idle / nav hover)
 * @param shouldMount — unused for fetch; kept for API clarity at call sites
 */
export function useProjectsBookModule(shouldPreload: boolean): {
  status: ProjectsBookModuleStatus
  Component: ComponentType<ProjectBookSceneProps> | null
} {
  const [status, setStatus] = useState<ProjectsBookModuleStatus>('idle')
  const [Component, setComponent] = useState<ComponentType<ProjectBookSceneProps> | null>(
    null,
  )

  useEffect(() => {
    if (!shouldPreload) return
    let active = true

    if (Component) {
      const id = window.setTimeout(() => {
        if (active) setStatus('ready')
      }, 0)
      return () => {
        active = false
        window.clearTimeout(id)
      }
    }

    const id = window.setTimeout(() => {
      if (active) setStatus('loading')
    }, 0)

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
      window.clearTimeout(id)
    }
  }, [Component, shouldPreload])

  return { status, Component }
}
