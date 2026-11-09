export type InkSeedRaster = {
  width: number
  height: number
  shape: Uint8Array
  alpha: Uint8Array
  fingerprint: string
}

export type IntroPerfSnapshot = {
  sdfMainThreadMs: number | null
  sdfWorkerMs: number | null
  lastInkSeedFingerprint: string | null
  cacheHit: boolean
}

const perf: IntroPerfSnapshot = {
  sdfMainThreadMs: null,
  sdfWorkerMs: null,
  lastInkSeedFingerprint: null,
  cacheHit: false,
}

export function recordIntroPerf(
  key: keyof Pick<IntroPerfSnapshot, 'sdfMainThreadMs' | 'sdfWorkerMs'>,
  value: number,
) {
  perf[key] = value
  if (
    import.meta.env.DEV ||
    (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('perf'))
  ) {
    ;(window as Window & { __introPerf?: IntroPerfSnapshot }).__introPerf = { ...perf }
  }
}

export function markInkSeedCacheHit(fingerprint: string) {
  perf.cacheHit = true
  perf.lastInkSeedFingerprint = fingerprint
  if (
    import.meta.env.DEV ||
    (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('perf'))
  ) {
    ;(window as Window & { __introPerf?: IntroPerfSnapshot }).__introPerf = { ...perf }
  }
}

export function clearInkSeedCacheHit() {
  perf.cacheHit = false
}

export function readIntroPerf(): IntroPerfSnapshot {
  return { ...perf }
}
