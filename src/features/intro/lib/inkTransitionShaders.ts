export const INK_TRANSITION_VERTEX = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPosition;
out vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`

/**
 * Scroll-progress-driven fluid-inspired ink growth. Unlike a uniform SDF
 * dilation, lobes, curling jets and a late translucent fringe evolve from
 * the captured RC mask. Scroll controls the base shape; a subtle time-driven
 * field keeps the advancing front alive while the scroll position is held.
 * Time influence fades to zero at progress 0 and 1.
 */
export const INK_TRANSITION_FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 color;
uniform sampler2D uDistance;
uniform sampler2D uSeed;
uniform float uProgress;
uniform float uAspect;
uniform float uTime;
uniform vec3 uInkColor;
uniform vec3 uFringeColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float decodeDistance(vec2 rg) {
  float packed = (floor(rg.x * 255.0 + 0.5) * 256.0
                + floor(rg.y * 255.0 + 0.5)) / 65535.0;
  return (packed - 0.5) * 3.0;
}
// Packed RG8 SDF: interpolate *decoded* signed distances instead of the bytes.
float sampleDistanceSmooth(vec2 coord) {
  ivec2 resolution = textureSize(uDistance, 0);
  vec2 dimensions = vec2(resolution);
  vec2 pixel = clamp(coord * dimensions - 0.5, vec2(0.0), dimensions - 1.0);
  ivec2 p0 = ivec2(floor(pixel));
  ivec2 p1 = min(p0 + ivec2(1), resolution - ivec2(1));
  vec2 f = fract(pixel);
  float d00 = decodeDistance(texelFetch(uDistance, p0, 0).rg);
  float d10 = decodeDistance(texelFetch(uDistance, ivec2(p1.x, p0.y), 0).rg);
  float d01 = decodeDistance(texelFetch(uDistance, ivec2(p0.x, p1.y), 0).rg);
  float d11 = decodeDistance(texelFetch(uDistance, p1, 0).rg);
  return mix(mix(d00, d10, f.x), mix(d01, d11, f.x), f.y);
}
float saturate(float x) { return clamp(x, 0.0, 1.0); }
void main() {
  float p = saturate(uProgress);
  float growth = p * p * (3.0 - 2.0 * p);

  // All distances are viewport-height-relative, so the proportions remain
  // stable across aspect ratios and the mask does not stretch on resize.
  vec2 scale = vec2(uAspect, 1.0);
  vec2 point = (vUv - 0.5) * scale;
  float distanceFromCenter = length(point);
  vec2 radial = point / max(distanceFromCenter, 0.0005);
  vec2 tangent = vec2(-radial.y, radial.x);
  float angle = atan(radial.y, radial.x);
  // Ambient animation is deliberately absent at the exact RC and fully black
  // endpoints. Scroll determines macro shape; time only animates its edges.
  float idleEnvelope = smoothstep(0.045, 0.24, p)
                     * (1.0 - smoothstep(0.88, 0.995, p));
  float drift = uTime * 0.22;

  // A broad coherent flow bends the original ink, rather than making a
  // uniformly inflated outline. The original RC stays untouched at p=0.
  float flowA = noise2(point * 3.5 + vec2(4.7 + growth * 1.8, 7.3 - growth));
  float flowB = noise2(point * 3.5 + vec2(-6.2 - growth, 3.1 + growth * 1.5));
  float localTwist = (flowA - 0.5) * 2.0
                   + 0.38 * sin(angle * 5.0 + growth * 5.3);
  float flowStrength = smoothstep(0.015, 0.34, p);
  vec2 flow = (vec2(flowA - 0.5, flowB - 0.5) * 0.16
             + tangent * localTwist * 0.105
                 * smoothstep(0.055, 0.43, distanceFromCenter)) * flowStrength;
  // Low-frequency traveling field. It nudges the connected outline rather
  // than randomly perturbing every pixel or applying a blurry overlay.
  vec2 ambientFlow = vec2(
    noise2(point * 4.1 + vec2(drift + 3.7, -drift * 0.73)) - 0.5,
    noise2(point * 3.5 + vec2(-drift * 0.56, drift * 0.66 + 1.4)) - 0.5
  );
  float softCurl = sin(angle * 5.2 + drift * 0.6 + 3.0 * ambientFlow.x);
  flow += idleEnvelope * (ambientFlow * 0.055 + tangent * softCurl * 0.012);
  vec2 warpedUV = clamp(vUv + flow / scale, 0.0, 1.0);
  float seedDistance = sampleDistanceSmooth(warpedUV);

  // In neuv's reference, the front advances very unevenly. Build one connected
  // mass with calm regions, larger lobes, and occasional narrow advancing jets.
  // Directional noise changes smoothly as the user scrubs in either direction.
  float angularNoise = noise2(radial * 5.2 + vec2(8.3 + growth * 1.5, -2.6));
  float detailNoise = noise2(radial * 12.0 + vec2(-4.1, growth * 2.8 + 5.9));
  float localNoise = noise2(point * 5.3 + vec2(growth * 2.4, 11.2));
  float curlingRays = sin(angle * 9.0
                   + (angularNoise - 0.5) * 4.1
                   + growth * 3.0
                   + (detailNoise - 0.5) * 1.6);
  float thinJets = pow(max(0.0, curlingRays), 6.0)
                 * (0.4 + 0.6 * detailNoise);
  float broadLobes = 0.58 + 0.9 * angularNoise + 0.23 * (localNoise - 0.5);
  float variedReach = broadLobes + 0.82 * thinJets;
  float shapeVariation = smoothstep(0.07, 0.38, p)
                       * (1.0 - 0.4 * smoothstep(0.80, 0.99, p));

  float baseReach = 1.27 * pow(growth, 1.23);
  float reach = baseReach * mix(1.0, variedReach, shapeVariation);
  // Gently advance and retract lobes at fixed scroll progress. Keep the
  // amplitude bounded so the ink stays one coherent mass.
  float breathingNoise = noise2(radial * 8.2 + vec2(drift * 0.88, -drift * 0.77)) - 0.5;
  float breathingCurl = sin(angle * 11.0 + drift * 1.25 + 2.4 * breathingNoise);
  reach += idleEnvelope * (0.060 * breathingNoise + 0.012 * breathingCurl)
         * (0.30 + 0.70 * growth);
  // A final advancing ink front reaches the viewport corners. Do not
  // crossfade the entire screen to gray: the black should arrive spatially.
  float finalAdvance = smoothstep(0.86, 1.0, p);
  reach += 0.30 * smoothstep(0.80, 0.99, p)
         + 1.45 * finalAdvance * finalAdvance;
  float edge = seedDistance - reach;

  // An antialiased dense core: no soft shadow over the black silhouette.
  float aa = max(fwidth(edge) * 1.2, 0.0011);
  float solidInk = 1.0 - smoothstep(-aa, aa, edge);

  // Outer inky fringe: thin gray rim + wispy tendrils outside the solid black core.
  float fringePhase = smoothstep(0.22, 0.52, p)
                    * (1.0 - smoothstep(0.93, 1.0, p));
  float outside = max(edge, 0.0);
  float wisps = pow(max(0.0, sin(angle * 17.0
                     + growth * 4.8 + drift * 0.7 * idleEnvelope
                     + (angularNoise - 0.5) * 3.2)), 6.0);
  float filament = noise2(point * 14.0 + vec2(
    growth * 4.7 + drift * 0.56 * idleEnvelope,
    -growth * 2.1 - drift * 0.28 * idleEnvelope));
  float smokeGrain = noise2(point * 19.0 + radial * 4.6
                      + vec2(angle * 2.7, growth * 3.8 + drift * 0.35));
  float tendrilMask = 0.32 + 0.68 * pow(max(0.0, thinJets), 0.42);
  float lobeMask = 0.40 + 0.60 * (0.35 + 0.65 * wisps) * (0.50 + 0.50 * filament);

  float rimW = (0.007 + 0.020 * growth) * (0.55 + 1.25 * tendrilMask);
  float sharpRim = exp(-outside / max(rimW * 0.58, 0.0002));
  sharpRim *= smoothstep(0.0, aa * 2.0, outside);
  sharpRim *= lobeMask * fringePhase;

  float wispAngle = pow(max(0.0, sin(angle * 24.0 + growth * 5.4
                    + (detailNoise - 0.5) * 2.8 + smokeGrain * 3.6)), 4.5);
  float smokeW = rimW + (0.018 + 0.052 * growth) * (0.40 + 1.55 * wispAngle);
  float smokeShell = smoothstep(rimW * 0.85, rimW * 1.05, outside)
                   * (1.0 - smoothstep(smokeW, smokeW + rimW * 0.45, outside));
  float smoke = smokeShell * fringePhase
              * (0.13 + 0.36 * wispAngle) * (0.42 + 0.58 * smokeGrain) * lobeMask;

  float shadowW = smokeW + (0.035 + 0.095 * growth) * (0.45 + 0.85 * tendrilMask);
  float shadowFalloff = smoothstep(shadowW + 0.07, shadowW, outside);
  float shadow = shadowFalloff * fringePhase * 0.09
               * (0.35 + 0.65 * filament) * (0.55 + 0.45 * wispAngle);

  float fringeAlpha = saturate(max(sharpRim * 0.50, max(smoke, shadow)));
  float fringeOnly = fringeAlpha * (1.0 - solidInk);

  float alpha = saturate(solidInk + fringeOnly);
  vec3 rgb = mix(uFringeColor, uInkColor, solidInk);

  // Exact handoff to the current deformed RC, without a doubled silhouette.
  float frozen = texture(uSeed, vUv).a;
  alpha = mix(frozen, alpha, smoothstep(0.0, 0.045, p));
  // Fully black only after the wave physically covers the scene.
  if (p >= 0.999) {
    color = vec4(uInkColor, 1.0);
    return;
  }
  color = vec4(rgb, saturate(alpha));
}`
