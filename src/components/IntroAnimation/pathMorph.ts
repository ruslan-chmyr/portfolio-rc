import gsap from 'gsap'

export function parseCubicPath(d: string): number[] {
  const tokens = d
    .trim()
    .replace(/,/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

  const coords: number[] = []
  let i = 0

  while (i < tokens.length) {
    const token = tokens[i]
    if (!/^[A-Za-z]$/.test(token)) {
      i += 1
      continue
    }

    const cmd = token
    i += 1

    if (cmd === 'M') {
      coords.push(Number(tokens[i]), Number(tokens[i + 1]))
      i += 2
      continue
    }

    if (cmd === 'C') {
      coords.push(
        Number(tokens[i]),
        Number(tokens[i + 1]),
        Number(tokens[i + 2]),
        Number(tokens[i + 3]),
        Number(tokens[i + 4]),
        Number(tokens[i + 5]),
      )
      i += 6
      continue
    }

    if (cmd === 'Z') {
      break
    }
  }

  return coords
}

export function formatCubicPath(coords: number[], close = true): string {
  if (coords.length < 8) {
    return ''
  }

  let path = `M ${coords[0]} ${coords[1]}`
  for (let i = 2; i < coords.length; i += 6) {
    path += ` C ${coords[i]} ${coords[i + 1]} ${coords[i + 2]} ${coords[i + 3]} ${coords[i + 4]} ${coords[i + 5]}`
  }
  return close ? `${path} Z` : path
}

export function lerpPath(a: number[], b: number[], t: number): number[] {
  const length = Math.min(a.length, b.length)
  const out = new Array<number>(length)
  for (let i = 0; i < length; i += 1) {
    out[i] = a[i] + (b[i] - a[i]) * t
  }
  return out
}

export function radialExpand(
  coords: number[],
  cx: number,
  cy: number,
  factor: number,
): number[] {
  const out = new Array<number>(coords.length)
  for (let i = 0; i < coords.length; i += 2) {
    out[i] = cx + (coords[i] - cx) * factor
    out[i + 1] = cy + (coords[i + 1] - cy) * factor
  }
  return out
}

export function morphPathAt(
  path: SVGPathElement,
  from: number[],
  to: number[],
  progress: number,
) {
  path.setAttribute('d', formatCubicPath(lerpPath(from, to, progress), false))
}

export function morphTween(
  path: SVGPathElement,
  from: number[],
  to: number[],
  vars: gsap.TweenVars,
) {
  const state = { progress: 0 }
  return gsap.to(state, {
    ...vars,
    progress: 1,
    onUpdate: () => {
      morphPathAt(path, from, to, state.progress)
    },
  })
}
