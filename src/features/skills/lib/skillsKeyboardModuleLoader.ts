import type { ComponentType } from 'react'
import type { SkillsKeyboardCanvasProps } from '../components/SkillsKeyboardCanvas'

export type SkillsKeyboardModuleStatus = 'idle' | 'loading' | 'ready' | 'error'

type CanvasComponent = ComponentType<SkillsKeyboardCanvasProps>

type ModuleShape = { SkillsKeyboardCanvas: CanvasComponent }

type ImportFn = () => Promise<ModuleShape>

const defaultImport: ImportFn = () => import('../components/SkillsKeyboardCanvas')

export class SkillsKeyboardModuleCancelledError extends Error {
  constructor(message = 'Skills keyboard module load cancelled') {
    super(message)
    this.name = 'SkillsKeyboardModuleCancelledError'
  }
}

export function isSkillsKeyboardModuleCancelled(error: unknown): boolean {
  return error instanceof SkillsKeyboardModuleCancelledError
}

/**
 * One-shot Skills keyboard chunk loader.
 * Uses a generation token so a cancelled request cannot overwrite a newer one.
 * The underlying dynamic import is reused across cancel/retry to avoid extra downloads.
 */
export function createSkillsKeyboardModuleLoader(
  importFn: ImportFn = defaultImport,
) {
  let status: SkillsKeyboardModuleStatus = 'idle'
  /** Bumped on every new claim and on cancel — stale completions must no-op. */
  let activeToken = 0
  let component: CanvasComponent | null = null
  /** Shared native import(); kept after cancel so a retry can reuse the same fetch. */
  let modulePromise: Promise<ModuleShape> | null = null
  /** In-flight claim that maps the module onto loader state for the current token. */
  let claimPromise: Promise<CanvasComponent> | null = null

  const ensureModulePromise = (): Promise<ModuleShape> => {
    if (!modulePromise) {
      modulePromise = importFn().then(
        (module) => module,
        (error: unknown) => {
          // Failed imports must be retryable.
          modulePromise = null
          throw error
        },
      )
    }
    return modulePromise
  }

  return {
    getStatus: () => status,
    getComponent: () => component,
    request(): Promise<CanvasComponent> {
      if (component) return Promise.resolve(component)
      if (claimPromise) return claimPromise

      const token = ++activeToken
      status = 'loading'

      const claim = ensureModulePromise()
        .then((module) => {
          if (token !== activeToken) {
            throw new SkillsKeyboardModuleCancelledError()
          }
          component = module.SkillsKeyboardCanvas
          status = 'ready'
          return component
        })
        .catch((error: unknown) => {
          if (token !== activeToken) {
            throw isSkillsKeyboardModuleCancelled(error)
              ? error
              : new SkillsKeyboardModuleCancelledError()
          }
          if (isSkillsKeyboardModuleCancelled(error)) {
            throw error
          }
          status = 'error'
          throw error
        })
        .finally(() => {
          if (claimPromise === claim) claimPromise = null
        })

      claimPromise = claim
      // Cancellation can leave no active React subscriber; absorb to avoid
      // unhandled-rejection noise while still rejecting awaiting callers.
      void claim.catch(() => undefined)

      return claim
    },
    cancel() {
      if (status !== 'loading') return
      activeToken += 1
      status = 'idle'
      claimPromise = null
      // Intentionally keep modulePromise — native imports are not abortable and
      // a subsequent request should reuse the same in-flight chunk.
    },
  }
}
