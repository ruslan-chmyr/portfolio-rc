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

  const beginFlip = useCallback((target: SkillBoardCategory) => {
    flipTargetRef.current = target
    flippingRef.current = true
    setIsFlipping(true)
    setFlipNonce((value) => value + 1)
  }, [])

  const selectCategory = useCallback(
    (next: SkillBoardCategory) => {
      if (!canSelectSkillBoardCategory(next)) return
      if (next === activeRef.current && !flippingRef.current) return

      activeRef.current = next
      setActiveCategory(next)

      if (prefersReducedMotion()) {
        flipTargetRef.current = next
        displayRef.current = next
        flippingRef.current = false
        setDisplayCategory(next)
        setIsFlipping(false)
        return
      }

      if (flippingRef.current) {
        // In-flight flip keeps its locked target; chase `activeCategory` on complete.
        return
      }

      if (next === displayRef.current) return
      beginFlip(next)
    },
    [beginFlip],
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
    if (chase !== displayRef.current && canSelectSkillBoardCategory(chase)) {
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
