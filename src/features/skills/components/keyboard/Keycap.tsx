import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { RoundedBox, Text } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import type { Group, Material, Mesh, Object3D } from 'three'
import {
  pointerTypeToModality,
  type SkillEngageOptions,
} from '../../lib/skillEngagement'
import type { StoryKeyVisual } from '../../lib/storyHighlight'
import { resolveKeycapLegendMode, useSvgTexture } from '../../lib/useSvgTexture'
import type { SkillDefinition } from '../../model/skillsConfig'
import { getSkillVisual, mixHex } from '../../model/skillVisuals'
import {
  KEYCAP_HEIGHT,
  KEYCAP_TRAVEL,
  type ResolvedKeyboardKey,
} from '../../model/keyboardLayout'

const COLOR_DECORATIVE = '#323238'
const COLOR_PRESSED = '#1C1C1F'
const COLOR_LABEL_MUTED = '#9A9AA3'

/** Visual meshes must not steal hits — press travel would otherwise re-fire enter/leave. */
function disableRaycast(object: Object3D | null) {
  if (!object) return
  object.raycast = () => {}
}

type KeycapProps = {
  keyDef: ResolvedKeyboardKey
  skill: SkillDefinition | null
  selected: boolean
  /** Story Focus layer — independent from inspection selection. */
  storyVisual?: StoryKeyVisual
  /** Shared flip legend opacity — read from a ref to avoid React updates per frame. */
  labelOpacityRef: RefObject<number>
  reducedMotion: boolean
  interactionsLocked: boolean
  onInvalidate: () => void
  onCursorChange: (cursor: 'pointer' | 'auto') => void
  onEngageSkill: (skillId: string, options?: SkillEngageOptions) => void
}

export function Keycap({
  keyDef,
  skill,
  selected,
  storyVisual = 'idle',
  labelOpacityRef,
  reducedMotion,
  interactionsLocked,
  onInvalidate,
  onCursorChange,
  onEngageSkill,
}: KeycapProps) {
  const visualRef = useRef<Group>(null)
  const iconMatRef = useRef<Material | null>(null)
  const textFillRef = useRef<{ fillOpacity: number } | null>(null)
  const insideRef = useRef(false)
  /** True when pointerenter already engaged this stay (mouse); touch may engage on up. */
  const engagedThisStayRef = useRef(false)
  const [hovered, setHovered] = useState(false)
  const storyMuted = storyVisual === 'muted'
  const interactive = Boolean(skill) && !interactionsLocked && !storyMuted
  const visual = skill ? getSkillVisual(skill) : null
  const label = skill?.shortLabel ?? keyDef.label
  const accessibleName = skill?.name ?? label ?? 'Decorative key'
  const hasIcon = Boolean(visual?.iconUrl)
  const { texture: iconTexture, status: iconStatus } = useSvgTexture(
    visual?.iconUrl,
    visual?.legend ?? '#FFFFFF',
  )
  const legendMode = resolveKeycapLegendMode(hasIcon, iconStatus)
  // Story Focus: only related keys keep legend artwork / text.
  const showIcon = !storyMuted && legendMode === 'icon' && Boolean(iconTexture)
  const showText = !storyMuted && Boolean(label) && !showIcon

  useEffect(() => {
    if (iconTexture || iconStatus === 'error') onInvalidate()
  }, [iconTexture, iconStatus, onInvalidate])

  // While locked, visuals ignore hover; clear the React flag after paint.
  useEffect(() => {
    if (!interactionsLocked) return
    insideRef.current = false
    engagedThisStayRef.current = false
    onCursorChange('auto')
    const frame = requestAnimationFrame(() => setHovered(false))
    return () => cancelAnimationFrame(frame)
  }, [interactionsLocked, onCursorChange])

  const liveHeld = hovered && !interactionsLocked
  const liveSelected = selected && !interactionsLocked && !liveHeld
  const targetY = liveHeld ? -KEYCAP_TRAVEL : 0

  const faceColor = useMemo(() => {
    if (liveHeld) return COLOR_PRESSED
    if (!visual) return COLOR_DECORATIVE
    if (storyMuted) return mixHex(COLOR_DECORATIVE, '#05070f', 0.55)
    let accent = liveSelected ? mixHex(visual.accent, '#FFFFFF', 0.22) : visual.accent
    if (storyVisual === 'related') accent = mixHex(accent, '#FFFFFF', 0.16)
    return accent
  }, [liveHeld, liveSelected, storyMuted, storyVisual, visual])

  const storyEmissive =
    storyVisual === 'related' && visual && !liveHeld
      ? mixHex(visual.accent, '#000000', 0.45)
      : '#000000'
  const storyEmissiveIntensity =
    storyVisual === 'related' && !liveHeld ? (liveSelected ? 0.55 : 0.42) : 0

  const fontSize = useMemo(() => {
    if (!label) return 0.22
    const wide = keyDef.width >= 2
    if (wide) {
      if (label.length >= 14) return 0.2
      if (label.length >= 10) return 0.24
      return 0.28
    }
    if (label.length >= 7) return 0.18
    if (label.length >= 5) return 0.22
    if (label.length >= 4) return 0.26
    return 0.3
  }, [label, keyDef.width])

  useFrame((_, delta) => {
    const group = visualRef.current
    if (!group) return

    const opacity = labelOpacityRef.current
    if (iconMatRef.current && 'opacity' in iconMatRef.current) {
      const mat = iconMatRef.current as Material & { opacity: number }
      if (mat.opacity !== opacity) mat.opacity = opacity
    }
    if (textFillRef.current && textFillRef.current.fillOpacity !== opacity) {
      textFillRef.current.fillOpacity = opacity
    }

    const speed = reducedMotion ? 1 : Math.min(1, delta * 14)
    const next = group.position.y + (targetY - group.position.y) * speed
    if (Math.abs(next - group.position.y) > 0.0002) {
      group.position.y = next
      onInvalidate()
    } else if (group.position.y !== targetY) {
      group.position.y = targetY
    }
  })

  const engage = (options?: SkillEngageOptions) => {
    if (!interactive || !skill) return
    onEngageSkill(skill.id, options)
  }

  const readPointerType = (event: ThreeEvent<PointerEvent>) =>
    event.nativeEvent?.pointerType ?? 'mouse'

  const handlePointerEnter = (event: ThreeEvent<PointerEvent>) => {
    if (!interactive || !skill) return
    event.stopPropagation()
    if (insideRef.current || interactionsLocked) return
    insideRef.current = true
    setHovered(true)
    onCursorChange('pointer')

    const modality = pointerTypeToModality(readPointerType(event))
    // Mouse/pen inspect on enter with sound. Touch waits for pointerup.
    if (modality !== 'touch') {
      engagedThisStayRef.current = true
      engage({ playSound: true, modality })
    }
    onInvalidate()
  }

  const handlePointerLeave = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    if (!insideRef.current) return
    insideRef.current = false
    engagedThisStayRef.current = false
    setHovered(false)
    onCursorChange('auto')
    onInvalidate()
  }

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (!interactive) return
    event.stopPropagation()
    if (!insideRef.current) {
      insideRef.current = true
      setHovered(true)
    }
    onInvalidate()
  }

  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (!interactive || !skill) return
    event.stopPropagation()
    const modality = pointerTypeToModality(readPointerType(event))
    if (!engagedThisStayRef.current) {
      engagedThisStayRef.current = true
      engage({ playSound: true, modality })
    }
    onInvalidate()
  }

  const iconSize = Math.min(keyDef.worldWidth, keyDef.worldDepth) * 0.42
  const faceY = KEYCAP_HEIGHT / 2 + 0.03
  const hitW = keyDef.worldWidth * 0.96
  const hitD = keyDef.worldDepth * 0.94
  const hitH = KEYCAP_HEIGHT + KEYCAP_TRAVEL * 2 + 0.08

  return (
    <group position={[keyDef.worldX, 0, keyDef.worldZ]} name={accessibleName}>
      <mesh
        position={[0, 0, 0]}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <boxGeometry args={[hitW, hitH, hitD]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <group ref={visualRef}>
        <RoundedBox
          ref={disableRaycast}
          args={[keyDef.worldWidth * 0.92, KEYCAP_HEIGHT, keyDef.worldDepth * 0.9]}
          radius={keyDef.width >= 2 ? 0.12 : 0.1}
          smoothness={4}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color={faceColor}
            roughness={selected || liveHeld || storyVisual === 'related' ? 0.28 : 0.36}
            metalness={selected || liveHeld || storyVisual === 'related' ? 0.18 : 0.12}
            emissive={
              liveSelected && visual
                ? mixHex(visual.accent, '#000000', 0.55)
                : storyEmissive
            }
            emissiveIntensity={
              liveSelected ? 0.35 : storyEmissiveIntensity
            }
          />
        </RoundedBox>

        {showIcon && iconTexture ? (
          <mesh
            ref={(node) => {
              disableRaycast(node)
              const mesh = node as Mesh | null
              iconMatRef.current = mesh?.material
                ? Array.isArray(mesh.material)
                  ? mesh.material[0]
                  : mesh.material
                : null
            }}
            position={[0, faceY, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[iconSize, iconSize]} />
            <meshBasicMaterial
              map={iconTexture}
              transparent
              opacity={1}
              depthWrite={false}
              toneMapped={false}
              // Session SVG cache owns this texture — R3F must not dispose it on unmount.
              dispose={null}
            />
          </mesh>
        ) : null}

        {showText ? (
          <Text
            ref={(node) => {
              disableRaycast(node as Object3D | null)
              textFillRef.current = node as unknown as { fillOpacity: number } | null
            }}
            position={[0, faceY, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={fontSize}
            color={visual?.legend ?? COLOR_LABEL_MUTED}
            fillOpacity={1}
            anchorX="center"
            anchorY="middle"
            maxWidth={keyDef.worldWidth * 0.78}
            textAlign="center"
            fontWeight={700}
          >
            {label}
          </Text>
        ) : null}
      </group>
    </group>
  )
}
