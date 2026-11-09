export const VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPosition;
out vec2 uv;
void main() {
  uv = aPosition * .5 + .5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`

export const COMMON = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 color;
`

export const ADVECT_VEL = COMMON + `
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uTexel;
uniform float uDelta;
uniform float uDecay;
uniform float uEdgeFade;
void main() {
  vec2 v = texture(uVelocity, uv).xy;
  vec2 back = uv - v * uTexel * uDelta;
  back = clamp(back, uTexel, 1.0 - uTexel);
  vec4 carried = texture(uSource, back) * exp(-uDecay * uDelta);
  vec2 edge = min(uv, 1.0 - uv);
  float fade = mix(1.0, smoothstep(0.0, 0.1, min(edge.x, edge.y)), uEdgeFade);
  color = vec4(carried.xy * fade, 0.0, 1.0);
}`

export const ADVECT_INK_FORWARD = COMMON + `
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uVelTexel;
uniform vec2 uDyeTexel;
uniform float uDelta;
void main() {
  vec2 v = texture(uVelocity, uv).xy;
  // Stronger ink transport: velocity uses the 256-wide simulation field,
  // while the interaction force was calibrated around a 128-wide grid.
  // Apply the same gain in forward and MacCormack passes to keep correction
  // consistent. Per-pixel displacement is still bounded below.
  vec2 displacement = v * uVelTexel * uDelta * 2.20;
  float distance = length(displacement);
  float limit = 3.2 * max(uDyeTexel.x, uDyeTexel.y);
  if (distance > limit) displacement *= limit / distance;
  vec2 back = clamp(uv - displacement, uDyeTexel, 1.0 - uDyeTexel);
  float d = texture(uSource, back).r;
  color = vec4(d, 0.0, 0.0, 1.0);
}`

export const ADVECT_INK_MCCORMACK = COMMON + `
uniform sampler2D uVelocity;
uniform sampler2D uForward;
uniform sampler2D uSource;
uniform vec2 uVelTexel;
uniform vec2 uDyeTexel;
uniform float uDelta;
uniform float uLoss;
void main() {
  vec2 v = texture(uVelocity, uv).xy;
  // Stronger ink transport: velocity uses the 256-wide simulation field,
  // while the interaction force was calibrated around a 128-wide grid.
  // Apply the same gain in forward and MacCormack passes to keep correction
  // consistent. Per-pixel displacement is still bounded below.
  vec2 displacement = v * uVelTexel * uDelta * 2.20;
  float dm = length(displacement);
  float cap = 3.2 * max(uDyeTexel.x, uDyeTexel.y);
  if (dm > cap) displacement *= cap / dm;
  vec2 back = clamp(uv - displacement, uDyeTexel, 1.0 - uDyeTexel);
  vec2 fwd = clamp(uv + displacement, uDyeTexel, 1.0 - uDyeTexel);
  // MacCormack: the forward result is already advected; sample it at the
  // destination, then backtrace that result to estimate the error.
  float forward = texture(uForward, uv).r;
  float traced = texture(uForward, fwd).r;
  float here = texture(uSource, uv).r;
  float correction = clamp(0.22 * (here - traced), -0.035, 0.035);
  vec2 cell = (floor(back / uDyeTexel - 0.5) + 0.5) * uDyeTexel;
  float n00 = texture(uSource, cell).r;
  float n10 = texture(uSource, cell + vec2(uDyeTexel.x, 0.0)).r;
  float n01 = texture(uSource, cell + vec2(0.0, uDyeTexel.y)).r;
  float n11 = texture(uSource, cell + uDyeTexel).r;
  float lo = min(min(n00, n10), min(n01, n11));
  float hi = max(max(n00, n10), max(n01, n11));
  float corrected = clamp(forward + correction, lo, hi);
  float dense = mix(forward, corrected, 0.88);
  color = vec4(dense / (1.0 + uLoss * uDelta), 0.0, 0.0, 1.0);
}`

export const SPLAT = COMMON + `
uniform sampler2D uVelocity;
uniform vec2 uPoint;
uniform vec2 uForce;
uniform float uRadius;
uniform float uTime;
uniform float uProximity;
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
vec2 grad(vec2 i) {
  float a = hash(i) * 6.2831853;
  return vec2(cos(a), sin(a));
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float n00 = dot(grad(i), f);
  float n10 = dot(grad(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float n01 = dot(grad(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
  float n11 = dot(grad(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
  return 0.5 + 0.7 * mix(mix(n00, n10, u.x), mix(n01, n11, u.x), u.y);
}
void main() {
  vec2 v0 = uForce;
  float fl = length(v0);
  vec2 dir = fl > 1e-5 ? v0 / fl : vec2(1.0, 0.0);
  vec2 ortho = vec2(-dir.y, dir.x);
  vec2 p = uv - uPoint;
  float n1 = noise(uv * 5.2 + vec2(uTime * 0.22, 3.1));
  float n2 = noise(uv * 5.2 + vec2(8.7, -uTime * 0.18));
  float n3 = noise(uv * 8.0 + vec2(-uTime * 0.18, 5.3));
  float n4 = noise(uv * 8.0 + vec2(2.9, uTime * 0.16));
  p += (vec2(n1, n2) - 0.5) * uRadius * 0.38;
  p += (vec2(n3, n4) - 0.5) * uRadius * 0.16;
  float trail = uRadius * mix(3.5, 4.45, uProximity);
  float span = uRadius * mix(0.9, 1.04, uProximity);
  // Three overlapping impulse regions: a directional core, a narrow trailing
  // strand, and a lower-amplitude wide shoulder that carries nearby ink as one
  // cohesive mass. Avoid narrow isolated tips and discontinuous forces.
  float axial = dot(p, dir);
  float lateral = dot(p, ortho);
  vec2 primary = vec2((axial + uRadius * 0.32) / trail, lateral / span);
  vec2 wake = vec2((axial + uRadius * 1.6) / (trail * 0.78),
                    lateral / (span * 0.82));
  vec2 shoulder = vec2((axial + uRadius * 0.55) / (trail * 1.1),
                        lateral / (span * 1.65));
  float g = 0.68 * exp(-dot(primary, primary))
          + 0.19 * exp(-dot(wake, wake))
          + 0.23 * exp(-dot(shoulder, shoulder));
  g *= 0.72 + 0.22 * (n2 - 0.5);
  g *= 0.48 + 0.4 * uProximity;
  // Let different parts of the same moving footprint bend around the cursor.
  // Opposite turns at the front/back introduce controlled rotational shear
  // without increasing the injected force magnitude.
  float tailBend = 0.19
    * clamp(axial / max(trail * 0.85, 0.0001), -1.0, 1.0)
    * exp(-pow(lateral / max(span * 1.5, 0.0001), 2.0));
  float twist = (n1 - 0.5) * 0.24 + tailBend;
  vec2 f = mat2(cos(twist), sin(twist), -sin(twist), cos(twist)) * v0 * (0.88 + 0.14 * (n2 - 0.5));
  vec2 v = texture(uVelocity, uv).xy + f * g;
  float vm = length(v);
  if (vm > 34.0) v *= 34.0 / vm;
  color = vec4(v, 0.0, 1.0);
}`

export const CURL = COMMON + `
uniform sampler2D uVelocity;
uniform vec2 uTexel;
void main() {
  float r = texture(uVelocity, uv + vec2(uTexel.x, 0.0)).y;
  float l = texture(uVelocity, uv - vec2(uTexel.x, 0.0)).y;
  float t = texture(uVelocity, uv + vec2(0.0, uTexel.y)).x;
  float b = texture(uVelocity, uv - vec2(0.0, uTexel.y)).x;
  color = vec4(0.5 * (r - l - t + b), 0.0, 0.0, 1.0);
}`

export const VORTICITY = COMMON + `
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform vec2 uTexel;
uniform float uDelta;
void main() {
  float l = abs(texture(uCurl, uv - vec2(uTexel.x, 0.0)).x);
  float r = abs(texture(uCurl, uv + vec2(uTexel.x, 0.0)).x);
  float b = abs(texture(uCurl, uv - vec2(0.0, uTexel.y)).x);
  float t = abs(texture(uCurl, uv + vec2(0.0, uTexel.y)).x);
  vec2 n = vec2(r - l, t - b);
  n /= length(n) + 0.0001;
  float curl = texture(uCurl, uv).x;
  // Gentle confinement supports the rotational wake without over-coiling ink.
  vec2 force = vec2(n.y, -n.x) * curl * 0.011;
  vec2 v = texture(uVelocity, uv).xy + force * uDelta;
  color = vec4(v, 0.0, 1.0);
}`

export const DIFFUSE_VEL = COMMON + `
uniform sampler2D uVelocity;
uniform vec2 uTexel;
uniform float uMix;
void main() {
  vec2 c = texture(uVelocity, uv).xy;
  vec2 r = texture(uVelocity, uv + vec2(uTexel.x, 0.0)).xy;
  vec2 l = texture(uVelocity, uv - vec2(uTexel.x, 0.0)).xy;
  vec2 t = texture(uVelocity, uv + vec2(0.0, uTexel.y)).xy;
  vec2 b = texture(uVelocity, uv - vec2(0.0, uTexel.y)).xy;
  vec2 avg = 0.25 * (r + l + t + b);
  color = vec4(mix(c, avg, uMix), 0.0, 1.0);
}`

export const DIVERGENCE = COMMON + `
uniform sampler2D uVelocity;
uniform vec2 uTexel;
void main() {
  float r = texture(uVelocity, uv + vec2(uTexel.x, 0.0)).x;
  float l = texture(uVelocity, uv - vec2(uTexel.x, 0.0)).x;
  float t = texture(uVelocity, uv + vec2(0.0, uTexel.y)).y;
  float b = texture(uVelocity, uv - vec2(0.0, uTexel.y)).y;
  color = vec4(0.5 * (r - l + t - b), 0.0, 0.0, 1.0);
}`

export const PRESSURE = COMMON + `
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 uTexel;
void main() {
  float l = texture(uPressure, uv - vec2(uTexel.x, 0.0)).x;
  float r = texture(uPressure, uv + vec2(uTexel.x, 0.0)).x;
  float b = texture(uPressure, uv - vec2(0.0, uTexel.y)).x;
  float t = texture(uPressure, uv + vec2(0.0, uTexel.y)).x;
  float d = texture(uDivergence, uv).x;
  color = vec4(0.25 * (l + r + b + t - d), 0.0, 0.0, 1.0);
}`

export const PROJECT = COMMON + `
uniform sampler2D uVelocity;
uniform sampler2D uPressure;
uniform vec2 uTexel;
void main() {
  float l = texture(uPressure, uv - vec2(uTexel.x, 0.0)).x;
  float r = texture(uPressure, uv + vec2(uTexel.x, 0.0)).x;
  float b = texture(uPressure, uv - vec2(0.0, uTexel.y)).x;
  float t = texture(uPressure, uv + vec2(0.0, uTexel.y)).x;
  vec2 v = texture(uVelocity, uv).xy - 0.5 * vec2(r - l, t - b);
  color = vec4(v, 0.0, 1.0);
}`

export const RESTORE = COMMON + `
uniform sampler2D uInk;
uniform sampler2D uOriginal;
uniform float uDelta;
uniform float uRestore;
uniform float uInteract;
void main() {
  float ink = texture(uInk, uv).r;
  float shape = texture(uOriginal, uv).a;
  // Restore depends on real motion, never on proximity alone.
  float pull = 1.0 - exp(-uDelta * uRestore * (1.0 - 0.2 * uInteract));
  float restored = mix(ink, shape, pull);
  color = vec4(restored, 0.0, 0.0, 1.0);
}`

export const SEED = COMMON + `
uniform sampler2D uOriginal;
void main() {
  float a = texture(uOriginal, uv).a;
  color = vec4(a, 0.0, 0.0, 1.0);
}`

export const DISPLAY = COMMON + `
uniform sampler2D uInk;
uniform vec3 uInkColor;
void main() {
  float ink = texture(uInk, uv).r;
  // The original mask is fed to RESTORE, not composited over the moving dye.
  // Overlaying both silhouettes produced doubled contours and white holes.
  // Density should look like solid ink, not an extended translucent shadow.
  // Keep only a narrow antialiased boundary around the half-density contour.
  float edge = clamp(fwidth(ink) * 0.7, 0.008, 0.035);
  float alpha = smoothstep(0.5 - edge, 0.5 + edge, ink);
  color = vec4(uInkColor, alpha);
}`

export const DISPLAY_VEL = COMMON + `
uniform sampler2D uVelocity;
uniform vec2 uVelTexel;
void main() {
  vec2 v = texture(uVelocity, uv).xy;
  float m = length(v) * 0.045;
  vec2 dir = m > 1e-5 ? v / length(v) : vec2(1.0, 0.0);
  color = vec4(0.5 + 0.5 * dir, m, 1.0);
}`

export const DISPLAY_DYE = COMMON + `
uniform sampler2D uInk;
void main() {
  float d = texture(uInk, uv).r;
  color = vec4(d, d, d, 1.0);
}`

// Remove broken shapeMask — fix CLEAN_INK shader
export const CLEAN_INK = COMMON + `
uniform sampler2D uInk;
uniform vec2 uTexel;
uniform float uMotion;
void main() {
  float c = texture(uInk, uv).r;
  float a = texture(uInk, uv + vec2(uTexel.x, 0.0) * 1.5).r;
  float b = texture(uInk, uv - vec2(uTexel.x, 0.0) * 1.5).r;
  float e = texture(uInk, uv + vec2(0.0, uTexel.y) * 1.5).r;
  float f = texture(uInk, uv - vec2(0.0, uTexel.y) * 1.5).r;
  float A = texture(uInk, uv + vec2(uTexel.x, 0.0) * 3.5).r;
  float B = texture(uInk, uv - vec2(uTexel.x, 0.0) * 3.5).r;
  float Cn = texture(uInk, uv + vec2(0.0, uTexel.y) * 3.5).r;
  float D = texture(uInk, uv - vec2(0.0, uTexel.y) * 3.5).r;
  float lo = min(min(min(a, b), min(e, f)), min(min(A, B), min(Cn, D)));
  float hi = max(max(max(a, b), max(e, f)), max(max(A, B), max(Cn, D)));
  float cleaned = clamp(c, lo - 0.04, hi + 0.04);
  float edge = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
  float band = 1.0 - smoothstep(0.0, 0.1, edge);
  float moy = 0.25 * (a + b + e + f);
  cleaned = mix(cleaned, moy, max(0.28 * smoothstep(0.04, 0.32, uMotion), 0.85 * band));
  color = vec4(cleaned, 0.0, 0.0, 1.0);
}`

export const COPY_INK =
  COMMON +
  `uniform sampler2D uInk;
void main() {
  float d = texture(uInk, uv).r;
  color = vec4(d, 0.0, 0.0, 1.0);
}`
