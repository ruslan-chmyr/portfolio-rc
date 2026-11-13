import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import {
  Bone,
  Color,
  Group,
  MeshStandardMaterial,
  Skeleton,
  SkinnedMesh,
} from 'three'
import { degToRad } from 'three/src/math/MathUtils.js'
import type { BookSheet } from '../../lib/buildBookSheets'
import {
  createSheetFaceTexture,
  sheetFaceCacheKey,
} from '../../lib/sheetFaceTexture'
import {
  BOOK_PAGE_USERDATA_KEY,
  shouldSuppressPageClick,
} from '../../lib/bookGesture'
import {
  getSkinnedPageGeometry,
  SKINNED_PAGE,
} from '../../lib/skinnedPageGeometry'
import { PROJECT_BOOK_CAMERA } from '../../model/projectBookConfig'
import { useBookGesture } from './BookGestureContext'

type SkinnedBookPageProps = {
  sheet: BookSheet
  number: number
  page: number
  opened: boolean
  bookClosed: boolean
  sheetCount: number
  reducedMotion: boolean
  onSelect: (nextPage: number) => void
}

const whiteColor = new Color('white')

const edgeMaterials = [
  new MeshStandardMaterial({ color: whiteColor }),
  new MeshStandardMaterial({ color: '#111111' }),
  new MeshStandardMaterial({ color: whiteColor }),
  new MeshStandardMaterial({ color: whiteColor }),
]

/**
 * One physical sheet — SkinnedMesh bone chain from the reference book slider.
 * https://github.com/pakagronglb/animated-book-slider-threejs (MIT)
 */
export function SkinnedBookPage({
  sheet,
  number,
  page,
  opened,
  bookClosed,
  sheetCount,
  reducedMotion,
  onSelect,
}: SkinnedBookPageProps) {
  const group = useRef<Group>(null)
  const skinnedMeshRef = useRef<SkinnedMesh>(null)
  const turnedAt = useRef(0)
  const lastOpened = useRef(opened)
  const { gesture, bumpActivity } = useBookGesture()

  const frontKey = sheetFaceCacheKey(sheet.front)
  const backKey = sheetFaceCacheKey(sheet.back)

  const manualSkinnedMesh = useMemo(() => {
    const bones: Bone[] = []
    for (let i = 0; i <= SKINNED_PAGE.PAGE_SEGMENTS; i += 1) {
      const bone = new Bone()
      bones.push(bone)
      bone.position.x = i === 0 ? 0 : SKINNED_PAGE.SEGMENT_WIDTH
      if (i > 0) bones[i - 1]!.add(bone)
    }
    const skeleton = new Skeleton(bones)
    const geometry = getSkinnedPageGeometry()

    const frontMap = createSheetFaceTexture(sheet.front)
    const backMap = createSheetFaceTexture(sheet.back)
    const isCover = number === 0 || number === sheetCount - 1

    const materials = [
      ...edgeMaterials,
      new MeshStandardMaterial({
        color: whiteColor,
        map: frontMap,
        roughness: isCover && number === 0 ? 0.72 : 0.18,
        metalness: isCover && number === 0 ? 0.12 : 0,
      }),
      new MeshStandardMaterial({
        color: whiteColor,
        map: backMap,
        roughness: isCover && number === sheetCount - 1 ? 0.72 : 0.18,
        metalness: 0,
      }),
    ]

    const mesh = new SkinnedMesh(geometry, materials)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.frustumCulled = false
    mesh.userData[BOOK_PAGE_USERDATA_KEY] = true
    mesh.add(skeleton.bones[0]!)
    mesh.bind(skeleton)
    return mesh
    // Recreate only when face content identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keys capture face identity
  }, [frontKey, backKey, number, sheetCount])

  useEffect(
    () => () => {
      const materials = manualSkinnedMesh.material
      const list = Array.isArray(materials) ? materials : [materials]
      for (const mat of list) {
        if (!(mat instanceof MeshStandardMaterial)) continue
        if (edgeMaterials.includes(mat)) continue
        mat.dispose()
      }
    },
    [manualSkinnedMesh],
  )

  useFrame((_, delta) => {
    const mesh = skinnedMeshRef.current
    const root = group.current
    if (!mesh || !root) return

    if (lastOpened.current !== opened) {
      turnedAt.current = Date.now()
      lastOpened.current = opened
      bumpActivity(PROJECT_BOOK_CAMERA.pageSettleMs)
    }

    let turningTime = Math.min(400, Date.now() - turnedAt.current) / 400
    turningTime = Math.sin(turningTime * Math.PI)

    let targetRotation = opened ? -Math.PI / 2 : Math.PI / 2
    if (!bookClosed) {
      targetRotation += degToRad(number * 0.8)
    }

    const bones = mesh.skeleton.bones
    const easeY = reducedMotion ? 0.0001 : SKINNED_PAGE.easingFactor
    const easeFold = reducedMotion ? 0.0001 : SKINNED_PAGE.easingFactorFold

    for (let i = 0; i < bones.length; i += 1) {
      const target = i === 0 ? root : bones[i]!

      const insideCurveIntensity = i < 8 ? Math.sin(i * 0.2 + 0.25) : 0
      const outsideCurveIntensity = i >= 8 ? Math.cos(i * 0.3 + 0.09) : 0
      const turningIntensity =
        Math.sin(i * Math.PI * (1 / bones.length)) * turningTime

      let rotationAngle =
        SKINNED_PAGE.insideCurveStrength * insideCurveIntensity * targetRotation -
        SKINNED_PAGE.outsideCurveStrength * outsideCurveIntensity * targetRotation +
        SKINNED_PAGE.turningCurveStrength * turningIntensity * targetRotation

      let foldRotationAngle = degToRad(Math.sign(targetRotation) * 2)

      if (bookClosed) {
        if (i === 0) {
          rotationAngle = targetRotation
          foldRotationAngle = 0
        } else {
          rotationAngle = 0
          foldRotationAngle = 0
        }
      }

      if (reducedMotion) {
        target.rotation.y = rotationAngle
        target.rotation.x =
          foldRotationAngle *
          (i > 8
            ? Math.sin(i * Math.PI * (1 / bones.length) - 0.5) * turningTime
            : 0)
      } else {
        easing.dampAngle(target.rotation, 'y', rotationAngle, easeY, delta)
        const foldIntensity =
          i > 8
            ? Math.sin(i * Math.PI * (1 / bones.length) - 0.5) * turningTime
            : 0
        easing.dampAngle(
          target.rotation,
          'x',
          foldRotationAngle * foldIntensity,
          easeFold,
          delta,
        )
      }
    }
  })

  return (
    <group
      ref={group}
      userData={{ [BOOK_PAGE_USERDATA_KEY]: true }}
      onClick={(event) => {
        event.stopPropagation()
        if (shouldSuppressPageClick(gesture.current)) return
        onSelect(opened ? number : number + 1)
        bumpActivity(PROJECT_BOOK_CAMERA.pageSettleMs)
      }}
    >
      <primitive
        object={manualSkinnedMesh}
        ref={skinnedMeshRef}
        position-z={-number * SKINNED_PAGE.PAGE_DEPTH + page * SKINNED_PAGE.PAGE_DEPTH}
      />
    </group>
  )
}
