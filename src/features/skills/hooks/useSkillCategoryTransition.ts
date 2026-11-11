import { useCallback, useRef, useState } from 'react'
import {
  DEFAULT_SKILL_BOARD_CATEGORY,
  canSelectSkillBoardCategory,
  type SkillBoardCategory,
} from '../model/skillsConfig'
import { prefersReducedMotion } from '../lib/webglSupport'

/**
 * Category selection vs displayed key mapping vs flip lifecycle.
 * Rotation and legend opacity run in the R3F scene; this hook owns discrete React state.
 */
export function useSkillCategoryTransition() {
  const [activeCategory, setActiveCategory] = useState<SkillBoardCategory>(
    DEFAULT_SKILL_BOARD_CATEGORY,
  )
  const [displayCategory, setDisplayCategory] = useState<SkillBoardCategory>(
    DEFAULT_SKILL_BOARD_CATEGORY,
  )
  const [isFlipping, setIsFlipping] = useState(false)
  const [flipNonce, setFlipNonce] = useState(0)

  const flipTargetRef = useRef<SkillBoardCategory>(DEFAULT_SKILL_BOARD_CATEGORY)
  const activeRef = useRef<SkillBoardCategory>(DEFAULT_SKILL_BOARD_CATEGORY)
  const displayRef = useRef<SkillBoardCategory>(DEFAULT_SKILL_BOARD_CATEGORY)
  const flippingRef = useRef(false)
  /** Replay a flip after the in-flight one when Story open/close forces another spin. */
  const pendingForceFlipRef = useRef(false)

  const beginFlip = useCallback((target: SkillBoardCategory) => {
    flipTargetRef.current = target
    flippingRef.current = true
    pendingForceFlipRef.current = false
    setIsFlipping(true)
    setFlipNonce((value) => value + 1)
  }, [])

  const applyCategoryInstant = useCallback((next: SkillBoardCategory) => {
    flipTargetRef.current = next
    activeRef.current = next
    displayRef.current = next
    flippingRef.current = false
    pendingForceFlipRef.current = false
    setActiveCategory(next)
    setDisplayCategory(next)
    setIsFlipping(false)
  }, [])

  const selectCategory = useCallback(
    (
      next: SkillBoardCategory,
      options?: { instant?: boolean; forceFlip?: boolean },
    ) => {
      if (!canSelectSkillBoardCategory(next)) return
      const forceFlip = options?.forceFlip === true
      if (
        next === activeRef.current &&
        !flippingRef.current &&
        !options?.instant &&
        !forceFlip
      ) {
        return
      }

      // Instant path for reduced motion (and rare forced swaps); default is a single flip.
      if (options?.instant || prefersReducedMotion()) {
        applyCategoryInstant(next)
        return
      }

      activeRef.current = next
      setActiveCategory(next)

      if (flippingRef.current) {
        // In-flight flip keeps its locked target; chase / replay on complete.
        if (forceFlip) pendingForceFlipRef.current = true
        return
      }

      if (next === displayRef.current && !forceFlip) return
      beginFlip(next)
    },
    [applyCategoryInstant, beginFlip],
  )

  const handleFlipSwap = useCallback(() => {
    const target = flipTargetRef.current
    displayRef.current = target
    setDisplayCategory(target)
  }, [])

  const handleFlipComplete = useCallback(() => {
    flippingRef.current = false
    setIsFlipping(false)

    const chase = activeRef.current
    const replay = pendingForceFlipRef.current
    pendingForceFlipRef.current = false
    if (
      canSelectSkillBoardCategory(chase) &&
      (replay || chase !== displayRef.current)
    ) {
      beginFlip(chase)
    }
  }, [beginFlip])

  return {
    activeCategory,
    displayCategory,
    isFlipping,
    flipNonce,
    isTransitioning: isFlipping,
    selectCategory,
    handleFlipSwap,
    handleFlipComplete,
  }
}
