/** Soft mechanical click — keep low so stacked key hops stay polite. */
export const KEYBOARD_SOUND_VOLUME = 0.2

/** Minimum gap between click starts when sweeping across keys. */
export const KEYBOARD_SOUND_MIN_INTERVAL_MS = 70

const DEFAULT_POOL_SIZE = 3

export type KeyboardSoundController = {
  setEnabled: (enabled: boolean) => void
  isEnabled: () => boolean
  playClick: () => void
  dispose: () => void
}

type PoolEntry = {
  audio: HTMLAudioElement
  lastStartMs: number
}

/**
 * Small HTMLAudio pool for macropad key clicks.
 * Muted until explicitly enabled; autoplay failures fail silently.
 */
export function createKeyboardSoundController(
  src: string,
  options?: { poolSize?: number; volume?: number; minIntervalMs?: number },
): KeyboardSoundController {
  const poolSize = Math.max(1, options?.poolSize ?? DEFAULT_POOL_SIZE)
  const volume = options?.volume ?? KEYBOARD_SOUND_VOLUME
  const minIntervalMs = options?.minIntervalMs ?? KEYBOARD_SOUND_MIN_INTERVAL_MS

  let enabled = false
  let lastPlayMs = Number.NEGATIVE_INFINITY
  let cursor = 0
  let pool: PoolEntry[] | null = null

  const ensurePool = (): PoolEntry[] | null => {
    if (typeof Audio === 'undefined') return null
    if (pool) return pool
    try {
      pool = Array.from({ length: poolSize }, () => {
        const audio = new Audio(src)
        audio.preload = 'auto'
        audio.volume = volume
        return { audio, lastStartMs: 0 }
      })
    } catch {
      pool = null
    }
    return pool
  }

  return {
    setEnabled(next) {
      enabled = next
      if (!next) return
      ensurePool()
    },
    isEnabled() {
      return enabled
    },
    playClick() {
      if (!enabled) return
      const entries = ensurePool()
      if (!entries) return

      const now = performance.now()
      if (now - lastPlayMs < minIntervalMs) return
      lastPlayMs = now

      const entry = entries[cursor % entries.length]
      cursor += 1
      entry.lastStartMs = now
      try {
        entry.audio.volume = volume
        entry.audio.currentTime = 0
        const playResult = entry.audio.play()
        if (playResult && typeof playResult.catch === 'function') {
          playResult.catch(() => {
            /* Autoplay / unlock restrictions — keep visuals working. */
          })
        }
      } catch {
        /* Ignore decode / play failures. */
      }
    },
    dispose() {
      if (!pool) return
      for (const entry of pool) {
        try {
          entry.audio.pause()
          entry.audio.src = ''
        } catch {
          /* ignore */
        }
      }
      pool = null
    },
  }
}
