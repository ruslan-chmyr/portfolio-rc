import { useEffect, useState, type ComponentType } from 'react'
import type { ProjectBookSceneProps } from '../components/book/ProjectBookScene'

export type ProjectsBookModuleStatus = 'idle' | 'loading' | 'ready' | 'error'

export function useProjectsBookModule(shouldLoad: boolean): {
  status: ProjectsBookModuleStatus
  Component: ComponentType<ProjectBookSceneProps> | null
} {
  const [status, setStatus] = useState<ProjectsBookModuleStatus>('idle')
  const [Component, setComponent] = useState<ComponentType<ProjectBookSceneProps> | null>(
    null,
  )

  useEffect(() => {
    if (!shouldLoad) return
    let active = true
    // Keep a cached scene across Skills ↔ Projects revisits — no loading flash.
    if (Component) {
      setStatus('ready')
      return () => {
        active = false
      }
    }
    setStatus('loading')
    void import('../components/book/ProjectBookScene')
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
  }, [Component, shouldLoad])

  return { status, Component }
}
