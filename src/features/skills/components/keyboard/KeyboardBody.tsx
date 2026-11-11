import { RoundedBox } from '@react-three/drei'
import {
  CASE_HEIGHT,
  CHASSIS_PAD_X,
  CHASSIS_PAD_Z,
  type getKeyboardBounds,
} from '../../model/keyboardLayout'

type KeyboardBodyProps = {
  bounds: ReturnType<typeof getKeyboardBounds>
}

const PLATE_HEIGHT = 0.14

export function KeyboardBody({ bounds }: KeyboardBodyProps) {
  const width = bounds.width + CHASSIS_PAD_X * 2
  const depth = bounds.depth + CHASSIS_PAD_Z * 2
  const caseY = -CASE_HEIGHT / 2 - 0.02

  return (
    <group position={[bounds.centerX, 0, bounds.centerZ]}>
      <RoundedBox
        args={[width, CASE_HEIGHT, depth]}
        radius={0.22}
        smoothness={4}
        position={[0, caseY, 0]}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial color="#121214" roughness={0.5} metalness={0.28} />
      </RoundedBox>

      <RoundedBox
        args={[width - 0.18, PLATE_HEIGHT, depth - 0.18]}
        radius={0.12}
        smoothness={3}
        position={[0, 0.03, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#1A1A1E" roughness={0.68} metalness={0.1} />
      </RoundedBox>

      <RoundedBox
        args={[width - 0.28, 0.05, depth - 0.28]}
        radius={0.08}
        smoothness={2}
        position={[0, caseY - CASE_HEIGHT / 2 + 0.01, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#070709" roughness={0.92} metalness={0.04} />
      </RoundedBox>
    </group>
  )
}
