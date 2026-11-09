export function getBloomCoverScale(svg: SVGSVGElement, bloom: SVGPathElement) {
  const svgWidth = svg.getBoundingClientRect().width
  const unitsToPixels = svgWidth / 600
  const bbox = bloom.getBBox()
  const minRadiusUnits = Math.min(
    300 - bbox.x,
    bbox.x + bbox.width - 300,
    160 - bbox.y,
    bbox.y + bbox.height - 160,
  )
  const cornerDistance = Math.hypot(window.innerWidth, window.innerHeight) / 2
  return Math.max(12, (cornerDistance / (minRadiusUnits * unitsToPixels)) * 1.4)
}
