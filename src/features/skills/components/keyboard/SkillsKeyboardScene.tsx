import { useLayoutEffect, useMemo, useRef } from 'react'
import { ContactShadows, PerspectiveCamera } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import type { Group, PerspectiveCamera as ThreePerspectiveCamera } from 'three'
import { computeKeyboardCameraFraming } from '../../lib/keyboardCameraFraming'
import { KEYBOARD_CAMERA_VIEW } from '../../lib/keyboardCameraView'
import type { SkillEngageOptions } from '../../lib/skillEngagement'
import {
  KEYBOARD_FLIP_MS,
  KEYBOARD_FLIP_PIVOT_Y,
  easeInOutCubic,
  keyboardFlipLabelOpacity,
  keyboardFlipRotationX,
  shouldSwapKeyboardCategory,
} from '../../lib/keyboardFlip'
import {
  getMacropadAssemblyBounds,
  getMacropadChassisBounds,
} from '../../model/keyboardLayout'
import {
  getBoardKeyLayout,
  getSkill,
  type SkillBoardCategory,
  type SkillId,
} from '../../model/skillsConfig'
import { KeyboardBody } from './KeyboardBody'
import { Keycap } from './Keycap'

type SkillsKeyboardSceneProps = {
  displayCategory: SkillBoardCategory
  selectedSkillId: SkillId | null
  reducedMotion: boolean
  isFlipping: boolean
  flipNonce: number
  interactionsLocked: boolean
  sectionVisible: boolean
  onCursorChange: (cursor: 'pointer' | 'auto') => void
  onEngageSkill: (skillId: SkillId, options?: SkillEngageOptions) => void
  onFlipSwap: () => void
  onFlipComplete: () => void
}

type FlipAnimation = {
  nonce: number
  /** Accumulated animation time — advances only while the scene is visible. */
  elapsedMs: number
  swapped: boolean
  completed: boolean
  lastOpacity: number
}

export function SkillsKeyboardScene({
  displayCategory,
  selectedSkillId,
  reducedMotion,
  isFlipping,
  flipNonce,
  interactionsLocked,
  sectionVisible,
  onCursorChange,
  onEngageSkill,
  onFlipSwap,
  onFlipComplete,
}: SkillsKeyboardSceneProps) {
  const keys = useMemo(() => getBoardKeyLayout(displayCategory), [displayCategory])
  const chassisBounds = useMemo(() => getMacropadChassisBounds(), [])
  const assemblyBounds = useMemo(
    () => getMacropadAssemblyBounds(KEYBOARD_FLIP_PIVOT_Y),
    [],
  )
  const flipRef = useRef<Group>(null)
  const poseRef = useRef<Group>(null)
  const cameraRef = useRef<ThreePerspectiveCamera>(null)
  const flipAnimRef = useRef<FlipAnimation | null>(null)
  /** Per-frame legend opacity — avoids React re-renders of every keycap during flip. */
  const labelOpacityRef = useRef(1)
  const { invalidate, size } = useThree()

  const frameWidth = Math.round(size.width)
  const frameHeight = Math.round(size.height)
  const aspect = frameWidth / Math.max(frameHeight, 1)

  const restFraming = useMemo(
    () =>
      computeKeyboardCameraFraming(
        assemblyBounds,
        aspect,
        KEYBOARD_CAMERA_VIEW,
        'rest',
        KEYBOARD_FLIP_PIVOT_Y,
      ),
    [assemblyBounds, aspect],
  )
  const flipFraming = useMemo(
    () =>
      computeKeyboardCameraFraming(
        assemblyBounds,
        aspect,
        KEYBOARD_CAMERA_VIEW,
        'flip',
        KEYBOARD_FLIP_PIVOT_Y,
      ),
    [assemblyBounds, aspect],
  )

  const applyCameraFraming = (
    from: typeof restFraming,
    to: typeof flipFraming,
    blend: number,
  ) => {
    const camera = cameraRef.current
    if (!camera) return
    const t = Math.min(1, Math.max(0, blend))
    camera.position.set(
      from.position[0] + (to.position[0] - from.position[0]) * t,
      from.position[1] + (to.position[1] - from.position[1]) * t,
      from.position[2] + (to.position[2] - from.position[2]) * t,
    )
    camera.fov = from.fov + (to.fov - from.fov) * t
    camera.lookAt(
      from.target[0] + (to.target[0] - from.target[0]) * t,
      from.target[1] + (to.target[1] - from.target[1]) * t,
      from.target[2] + (to.target[2] - from.target[2]) * t,
    )
    camera.updateProjectionMatrix()
  }

  useLayoutEffect(() => {
    if (isFlipping && !reducedMotion) return
    applyCameraFraming(restFraming, restFraming, 0)
    labelOpacityRef.current = 1
    invalidate()
  }, [restFraming, isFlipping, reducedMotion, invalidate])

  useLayoutEffect(() => {
    invalidate()
  }, [displayCategory, selectedSkillId, isFlipping, sectionVisible, invalidate])

  useLayoutEffect(() => {
    if (reducedMotion || !isFlipping) {
      if (!isFlipping && flipRef.current) {
        flipRef.current.rotation.x = 0
        flipRef.current.rotation.y = 0
        flipRef.current.rotation.z = 0
      }
      flipAnimRef.current = null
      labelOpacityRef.current = 1
      applyCameraFraming(restFraming, restFraming, 0)
      invalidate()
      return
    }

    flipAnimRef.current = {
      nonce: flipNonce,
      elapsedMs: 0,
      swapped: false,
      completed: false,
      lastOpacity: 1,
    }
    labelOpacityRef.current = 1
    if (flipRef.current) {
      flipRef.current.rotation.x = 0
      flipRef.current.rotation.y = 0
      flipRef.current.rotation.z = 0
    }
    invalidate()
  }, [flipNonce, isFlipping, reducedMotion, restFraming, invalidate])

  useFrame((_, delta) => {
    // Demand/never frameloop already stops frames while offscreen; also freeze
    // flip progress so wall-clock gaps never skip the animation on resume.
    if (!sectionVisible) return

    const flip = flipRef.current
    const pose = poseRef.current
    const anim = flipAnimRef.current

    if (anim && flip && !anim.completed && !reducedMotion) {
      // Clamp spikes after tab resume; progress itself only moves while visible.
      anim.elapsedMs += Math.min(delta * 1000, 50)
      const progress = Math.min(1, anim.elapsedMs / KEYBOARD_FLIP_MS)
      const eased = easeInOutCubic(progress)
      flip.rotation.x = keyboardFlipRotationX(eased)
      flip.rotation.y = 0
      flip.rotation.z = 0

      const zoomBlend = Math.sin(progress * Math.PI)
      applyCameraFraming(restFraming, flipFraming, zoomBlend)

      const opacity = keyboardFlipLabelOpacity(progress)
      labelOpacityRef.current = opacity
      anim.lastOpacity = opacity

      if (shouldSwapKeyboardCategory(progress, anim.swapped)) {
        anim.swapped = true
        onFlipSwap()
      }

      if (progress >= 1) {
        anim.completed = true
        flip.rotation.x = 0
        flip.rotation.y = 0
        flip.rotation.z = 0
        flipAnimRef.current = null
        labelOpacityRef.current = 1
        applyCameraFraming(restFraming, restFraming, 0)
        onFlipComplete()
      }

      invalidate()
      return
    }

    if (!pose) return
    pose.rotation.x = KEYBOARD_CAMERA_VIEW.boardTiltX
    pose.rotation.y = KEYBOARD_CAMERA_VIEW.boardTiltY
    pose.rotation.z = KEYBOARD_CAMERA_VIEW.boardTiltZ
  })

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        near={0.1}
        far={120}
        fov={restFraming.fov}
        position={restFraming.position}
      />
      <ambientLight intensity={0.62} />
      <directionalLight
        castShadow
        position={[-6, 15, 8]}
        intensity={1.45}
        color="#e8f7ff"
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.00015}
      />
      <directionalLight position={[8, 7, -4]} intensity={0.42} color="#9eb6ff" />
      <pointLight position={[-4, 5, 3]} intensity={0.55} color="#5ee7ff" distance={28} />
      <hemisphereLight args={['#d7ecff', '#0a0d14', 0.48]} />

      <group position={[-chassisBounds.centerX, 0, -chassisBounds.centerZ]}>
        <group position={[0, KEYBOARD_FLIP_PIVOT_Y, 0]}>
          <group ref={flipRef}>
            <group position={[0, -KEYBOARD_FLIP_PIVOT_Y, 0]}>
              <group
                ref={poseRef}
                rotation={[
                  KEYBOARD_CAMERA_VIEW.boardTiltX,
                  KEYBOARD_CAMERA_VIEW.boardTiltY,
                  KEYBOARD_CAMERA_VIEW.boardTiltZ,
                ]}
              >
                <KeyboardBody bounds={chassisBounds} />
                <group position={[0, 0.28, 0]}>
                  {keys.map((key) => {
                    const skill = getSkill(key.skillId as SkillId)
                    return (
                      <Keycap
                        key={key.id}
                        keyDef={key}
                        skill={skill}
                        selected={selectedSkillId === skill.id}
                        labelOpacityRef={labelOpacityRef}
                        reducedMotion={reducedMotion}
                        interactionsLocked={interactionsLocked}
                        onInvalidate={invalidate}
                        onCursorChange={onCursorChange}
                        onEngageSkill={(id, options) =>
                          onEngageSkill(id as SkillId, options)
                        }
                      />
                    )
                  })}
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>

      <ContactShadows
        position={[0, -0.35, 0]}
        opacity={0.4}
        scale={Math.max(assemblyBounds.width, assemblyBounds.depth) * 1.8}
        blur={2.4}
        far={14}
        resolution={512}
        color="#000000"
      />
    </>
  )
}
