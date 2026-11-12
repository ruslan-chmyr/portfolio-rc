import { useLayoutEffect } from 'react'
import { useTheme } from '../../../shared/theme'
import type { IntroAnimationRefs } from '../lib/introRefs'
import { disposeIntroRuntime, resolveIntroRuntime } from '../lib/introRuntime'
import { attachIntroTheme } from '../lib/attachIntroTheme'
import { attachFluidInteraction } from '../lib/attachFluidInteraction'
import { attachIntroTransition } from '../lib/attachIntroTransition'

export type { IntroAnimationRefs } from '../lib/introRefs'

export function useIntroAnimation(refs: IntroAnimationRefs) {
  const { toggleTheme } = useTheme()

  useLayoutEffect(() => {
    const runtime = resolveIntroRuntime(refs)
    if (!runtime) return

    const releaseTheme = attachIntroTheme(runtime)
    const fluid = attachFluidInteraction(runtime)
    const transition = attachIntroTransition(runtime, {
      onOverscrollUp: toggleTheme,
    })

    return () => {
      transition.dispose()
      fluid?.dispose()
      releaseTheme()
      disposeIntroRuntime(runtime)
    }
  }, [refs, toggleTheme])
}
