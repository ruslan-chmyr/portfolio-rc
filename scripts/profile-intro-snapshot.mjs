/**
 * Paste the IIFE below into DevTools on the production preview page,
 * or evaluate via CDP Runtime.evaluate with awaitPromise: true.
 */
export const PROFILE_SNIPPET = String.raw`
(async () => {
  const pct = (arr, p) => {
    if (!arr.length) return null;
    const sorted = [...arr].sort((a, b) => a - b);
    const i = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
    return sorted[i];
  };

  const sampleFps = (ms) =>
    new Promise((resolve) => {
      const deltas = [];
      let last = performance.now();
      const start = performance.now();
      const tick = (t) => {
        if (deltas.length) deltas.push(t - last);
        last = t;
        if (t - start < ms) requestAnimationFrame(tick);
        else {
          const d = deltas.slice(1);
          const avg = d.reduce((a, b) => a + b, 0) / Math.max(1, d.length);
          resolve({
            samples: d.length,
            avgFps: 1000 / avg,
            p95FrameMs: pct(d, 95),
            p99FrameMs: pct(d, 99),
          });
        }
      };
      requestAnimationFrame(tick);
    });

  const canvases = [...document.querySelectorAll('.intro-animation__stage canvas')];
  const fluid = canvases[0];
  const transition = canvases[1];

  const idle = await sampleFps(3000);

  for (let i = 0; i < 90; i++) {
    window.dispatchEvent(
      new PointerEvent('pointermove', {
        clientX: 520 + Math.sin(i / 8) * 80,
        clientY: 360 + Math.cos(i / 10) * 40,
        bubbles: true,
      }),
    );
    await new Promise((r) => setTimeout(r, 33));
  }
  const slow = await sampleFps(3000);

  for (let i = 0; i < 180; i++) {
    window.dispatchEvent(
      new PointerEvent('pointermove', {
        clientX: 300 + Math.random() * 600,
        clientY: 200 + Math.random() * 300,
        bubbles: true,
      }),
    );
    await new Promise((r) => setTimeout(r, 16));
  }
  const fast = await sampleFps(3000);

  const sdfStart = performance.now();
  for (let i = 0; i < 30; i++) {
    window.dispatchEvent(
      new WheelEvent('wheel', { deltaY: 40, cancelable: true, bubbles: true }),
    );
  }
  const sdfBurstMs = performance.now() - sdfStart;

  const root = document.querySelector('.intro-animation');
  const memory = performance.memory
    ? {
        usedJSHeapMB: performance.memory.usedJSHeapSize / (1024 * 1024),
      }
    : null;

  return {
    viewport: { w: innerWidth, h: innerHeight, dpr: devicePixelRatio },
    canvas: {
      fluid: fluid
        ? { width: fluid.width, height: fluid.height, cssW: fluid.clientWidth }
        : null,
      transition: transition
        ? { width: transition.width, height: transition.height }
        : null,
    },
    idle,
    slowCursor: slow,
    fastCursor: fast,
    firstScrollBurstMs: sdfBurstMs,
    scrollProgress: root?.dataset.scrollProgress ?? null,
    memory,
    gpuTimerQueryAvailable: false,
  };
})()
`;
