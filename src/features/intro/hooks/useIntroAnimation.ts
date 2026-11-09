import { useLayoutEffect } from 'react'
import type { IntroAnimationRefs } from '../lib/introRefs'
import { disposeIntroRuntime, resolveIntroRuntime } from '../lib/introRuntime'
import { attachIntroTheme } from '../lib/attachIntroTheme'
import { attachFluidInteraction } from '../lib/attachFluidInteraction'
import { attachIntroTransition } from '../lib/attachIntroTransition'

export type { IntroAnimationRefs } from '../lib/introRefs'

export function useIntroAnimation(refs: IntroAnimationRefs) {
  useLayoutEffect(() => {
    const runtime = resolveIntroRuntime(refs)
    if (!runtime) return

    const releaseTheme = attachIntroTheme(runtime)
    const fluid = attachFluidInteraction(runtime)
    const transition = attachIntroTransition(runtime)

    return () => {
      transition.dispose()
      fluid?.dispose()
      releaseTheme()
      disposeIntroRuntime(runtime)
    }
  }, [refs])
}
