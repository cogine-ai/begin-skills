export const VERSION = 1;
export const PRESETS = Object.freeze({
  weave: Object.freeze({ version: 1, count: 8, cycle: 3, travel: 60, phase: 25 }),
  orbit: Object.freeze({ version: 1, count: 5, cycle: 5, travel: 100, phase: 0 }),
  ripple: Object.freeze({ version: 1, count: 12, cycle: 2.5, travel: 0, phase: 50 }),
});
export const LIMITS = Object.freeze({
  count: { min: 3, max: 12, step: 1 }, cycle: { min: 1, max: 6, step: 0.1 },
  travel: { min: 0, max: 100, step: 1 }, phase: { min: 0, max: 100, step: 0.1 },
});

export function validateSketch(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false, error: 'Sketch must be an object.' };
  const keys = ['version', 'count', 'cycle', 'travel', 'phase'];
  if (Object.keys(data).length !== keys.length || keys.some(key => !Object.hasOwn(data, key))) return { ok: false, error: 'Sketch fields are unsupported.' };
  if (data.version !== 1) return { ok: false, error: 'Sketch version is unsupported.' };
  for (const key of ['count', 'cycle', 'travel', 'phase']) {
    const value = data[key], range = LIMITS[key];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < range.min || value > range.max) return { ok: false, error: `${key} is outside its supported range.` };
    if ((key === 'count' || key === 'travel') && !Number.isInteger(value)) return { ok: false, error: `${key} must be a whole number.` };
    if (key === 'cycle' && Math.abs(value * 10 - Math.round(value * 10)) > 0.00001) return { ok: false, error: 'Cycle uses tenths of a second.' };
  }
  return { ok: true, value: { version: 1, count: data.count, cycle: data.cycle, travel: data.travel, phase: data.phase } };
}

export function presetName(sketch) {
  const match = Object.entries(PRESETS).find(([, p]) => p.count === sketch.count && p.cycle === sketch.cycle && p.travel === sketch.travel);
  return match ? match[0][0].toUpperCase() + match[0].slice(1) : 'Your sketch';
}

// One periodic formula drives the live preview, SVG and standalone player.
// Displacement follows a 2:1 path; the ellipses return after a half rotation.
export function frameAt(sketch) {
  const turn = sketch.phase / 100, tau = Math.PI * 2, output = [];
  for (let i = 0; i < sketch.count; i++) {
    const u = (i + 1) / (sketch.count + 1), angle = tau * (turn + i / sketch.count);
    const radius = 38 + u * 146 + 10 * Math.sin(angle);
    output.push({
      cx: 320 + sketch.travel * 0.92 * Math.cos(angle),
      cy: 320 + sketch.travel * 0.56 * Math.sin(angle * 2),
      rx: radius, ry: radius * (0.66 + 0.19 * Math.cos(angle)),
      rotation: i * 180 / sketch.count + turn * 180,
      stroke: i === 0 ? '#e94e35' : '#20281f', width: i === 0 ? 5 : 2.6,
    });
  }
  return output;
}

export function frameMarkup(frame) {
  const n = value => Number(value.toFixed(5));
  return frame.map(e => `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" transform="rotate(${n(e.rotation)} ${n(e.cx)} ${n(e.cy)})" fill="none" stroke="${e.stroke}" stroke-width="${e.width}"/>`).join('');
}

export function svgDocument(sketch) {
  const valid = validateSketch(sketch);
  if (!valid.ok) throw new Error(valid.error);
  const name = presetName(sketch);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640" role="img" aria-labelledby="title desc">
<title id="title">PHASE — ${name}, phase ${sketch.phase.toFixed(1)}%</title>
<desc id="desc">${sketch.count} elliptical loops. Cycle ${sketch.cycle.toFixed(1)} seconds. Travel ${sketch.travel} relative units. Original PHASE model version 1.</desc>
<metadata>${JSON.stringify(sketch)}</metadata>
<rect width="640" height="640" fill="#d7ef6b"/>
${frameMarkup(frameAt(sketch))}
</svg>`;
}

// Kept inside the export so the downloaded document needs no network or fonts.
function portablePlayer(sketch, getFrame, markup) {
  const group = document.querySelector('#loops'), button = document.querySelector('#play');
  const slider = document.querySelector('#phase'), output = document.querySelector('#position');
  const state = document.querySelector('#state'), motion = matchMedia('(prefers-reduced-motion: reduce)');
  let playing = false, visible = true, raf = null, previous = null;
  const eligible = () => playing && visible && !document.hidden;
  function paint() {
    group.innerHTML = markup(getFrame(sketch));
    slider.value = sketch.phase;
    output.textContent = `${sketch.phase.toFixed(1)}%`;
  }
  function sync() {
    if (raf !== null) cancelAnimationFrame(raf);
    raf = null; previous = null;
    button.textContent = playing ? 'Pause' : 'Play';
    button.setAttribute('aria-pressed', String(playing));
    state.textContent = playing ? (eligible() ? 'Playing' : 'Suspended while out of view') : 'Paused at this frame';
    if (eligible()) raf = requestAnimationFrame(tick);
  }
  function tick(now) {
    raf = null;
    if (!eligible()) { previous = null; return; }
    if (previous !== null) sketch.phase = (sketch.phase + (now - previous) / (sketch.cycle * 10)) % 100;
    previous = now; paint(); raf = requestAnimationFrame(tick);
  }
  button.addEventListener('click', () => { playing = !playing; sync(); });
  slider.addEventListener('input', () => { playing = false; sketch.phase = Number(slider.value); paint(); sync(); });
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => { if (raf !== null) cancelAnimationFrame(raf); raf = null; previous = null; });
  window.addEventListener('pageshow', sync);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }).observe(document.querySelector('#art'));
  motion.addEventListener('change', () => { if (motion.matches) playing = false; sync(); });
  paint(); sync();
}

export function playbackHTML(sketch) {
  const valid = validateSketch(sketch);
  if (!valid.ok) throw new Error(valid.error);
  const data = valid.value;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PHASE — ${presetName(data)} playback</title>
<style>*{box-sizing:border-box}body{margin:0;background:#171c18;color:#f1f3e8;font:16px/1.5 system-ui,sans-serif}main{max-width:760px;margin:auto;padding:24px}h1{font-size:24px;margin:0 0 8px}p{margin:8px 0 20px}svg{display:block;width:100%;height:auto}button{font:inherit;min-height:44px;padding:8px 24px;background:#d7ef6b;color:#20281f;border:0}label{display:flex;justify-content:space-between;margin:18px 0 4px}input{width:100%;min-height:44px;accent-color:#d7ef6b}button:focus-visible,input:focus-visible{outline:3px solid #f4937b;outline-offset:4px}.row{display:flex;align-items:center;gap:18px;margin-top:18px}small{display:block;color:#c3ccbd;margin-top:24px}</style></head><body><main>
<h1>PHASE / ${presetName(data)}</h1><p>${data.count} elements · ${data.cycle.toFixed(1)} second cycle · ${data.travel} travel units</p>
<svg id="art" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" role="img" aria-label="Original looping ellipse composition"><rect width="640" height="640" fill="#d7ef6b"/><g id="loops">${frameMarkup(frameAt(data))}</g></svg>
<div class="row"><button id="play" type="button" aria-pressed="false">Play</button><span id="state">Paused at this frame</span></div>
<label for="phase">Inspect phase <output id="position">${data.phase.toFixed(1)}%</output></label><input id="phase" type="range" min="0" max="100" step="0.1" value="${data.phase}">
<small>Original PHASE model v1. This file includes its own vector model and player. No network connection or font is needed. A reduced-motion preference pauses playback; Play remains a deliberate choice.</small>
</main><script>const sketch=${JSON.stringify(data)};const getFrame=${frameAt.toString()};const markup=${frameMarkup.toString()};(${portablePlayer.toString()})(sketch,getFrame,markup);</script></body></html>`;
}
