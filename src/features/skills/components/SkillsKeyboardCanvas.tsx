import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { Canvas } from '@react-three/fiber'
import {
  shouldClearInspectionOnPointerLeave,
  type SkillEngageOptions,
} from '../lib/skillEngagement'
import { prefersReducedMotion } from '../lib/webglSupport'
import type { SkillBoardCategory, SkillId } from '../model/skillsConfig'
import { SkillsKeyboardA11y } from './SkillsKeyboardA11y'
import { SkillsKeyboardScene } from './keyboard/SkillsKeyboardScene'
import { SkillsKeyboardFallback } from './SkillsKeyboardFallback'

type EngageSkillHandler = (skillId: SkillId, options?: SkillEngageOptions) => void

type SkillsKeyboardCanvasProps = {
  enabled: boolean
  displayCategory: SkillBoardCategory
  selectedSkillId: SkillId | null
  relatedSkillIds: ReadonlySet<string> | null
  isFlipping: boolean
  flipNonce: number
  onEngageSkill: EngageSkillHandler
  onClearInspection: () => void
  onFlipSwap: () => void
  onFlipComplete: () => void
}

type ErrorBoundaryState = { hasError: boolean }

class SkillsKeyboardErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

function SkillsKeyboardCanvasInner({
  displayCategory,
  selectedSkillId,
  relatedSkillIds,
  isFlipping,
  flipNonce,
  onEngageSkill,
  onClearInspection,
  onFlipSwap,
  onFlipComplete,
}: Omit<SkillsKeyboardCanvasProps, 'enabled'>) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion)
  const [cursor, setCursor] = useState<'pointer' | 'auto'>('auto')
  const [inView, setInView] = useState(true)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReducedMotion(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const node = frameRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { root: null, threshold: 0.05 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const handlePointerLeave = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (
        !shouldClearInspectionOnPointerLeave({
          isFlipping,
          leavePointerType: event.pointerType || 'mouse',
        })
      ) {
        return
      }
      onClearInspection()
    },
    [isFlipping, onClearInspection],
  )

  return (
    <div
      ref={frameRef}
      className="skills-keyboard__frame"
      style={{ cursor: isFlipping ? 'auto' : cursor }}
      onPointerLeave={handlePointerLeave}
    >
      <Canvas
        className="skills-keyboard__canvas"
        dpr={[1, 1.75]}
        shadows
        // Demand + explicit invalidate keeps idle GPU quiet while animations stay smooth.
        frameloop={!inView ? 'never' : 'demand'}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl, invalidate }) => {
          gl.setClearColor(0x000000, 0)
          invalidate()
        }}
      >
        <Suspense fallback={null}>
          <SkillsKeyboardScene
            displayCategory={displayCategory}
            selectedSkillId={selectedSkillId}
            relatedSkillIds={relatedSkillIds}
            reducedMotion={reducedMotion}
            isFlipping={isFlipping}
            flipNonce={flipNonce}
            interactionsLocked={isFlipping}
            sectionVisible={inView}
            onCursorChange={setCursor}
            onEngageSkill={onEngageSkill}
            onFlipSwap={onFlipSwap}
            onFlipComplete={onFlipComplete}
          />
        </Suspense>
      </Canvas>
      <SkillsKeyboardA11y
        category={displayCategory}
        selectedSkillId={selectedSkillId}
        disabled={isFlipping}
        onEngageSkill={onEngageSkill}
      />
    </div>
  )
}

export function SkillsKeyboardCanvas({
  enabled,
  displayCategory,
  selectedSkillId,
  relatedSkillIds,
  isFlipping,
  flipNonce,
  onEngageSkill,
  onClearInspection,
  onFlipSwap,
  onFlipComplete,
}: SkillsKeyboardCanvasProps) {
  if (!enabled) {
    return (
      <SkillsKeyboardFallback
        activeCategory={displayCategory}
        selectedSkillId={selectedSkillId}
        onEngageSkill={isFlipping ? undefined : onEngageSkill}
        onClearInspection={isFlipping ? undefined : onClearInspection}
      />
    )
  }

  return (
    <SkillsKeyboardErrorBoundary
      fallback={
        <SkillsKeyboardFallback
          activeCategory={displayCategory}
          selectedSkillId={selectedSkillId}
          onEngageSkill={isFlipping ? undefined : onEngageSkill}
          onClearInspection={isFlipping ? undefined : onClearInspection}
        />
      }
    >
      <SkillsKeyboardCanvasInner
        displayCategory={displayCategory}
        selectedSkillId={selectedSkillId}
        relatedSkillIds={relatedSkillIds}
        isFlipping={isFlipping}
        flipNonce={flipNonce}
        onEngageSkill={onEngageSkill}
        onClearInspection={onClearInspection}
        onFlipSwap={onFlipSwap}
        onFlipComplete={onFlipComplete}
      />
    </SkillsKeyboardErrorBoundary>
  )
}
