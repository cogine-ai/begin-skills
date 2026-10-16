import { PRESETS, LIMITS, validateSketch, presetName, frameAt, frameMarkup, svgDocument, playbackHTML } from './model.js';

const $ = selector => document.querySelector(selector);
const DRAFT_KEY = 'phase.sketch.v1.draft', KEPT_KEY = 'phase.sketch.v1.kept';
const motion = matchMedia('(prefers-reduced-motion: reduce)');
let sketch = { ...PRESETS.weave }, wantsPlay = !motion.matches, isOnscreen = false;
let raf = null, previous = null, framesPainted = 0, keptSketch = null, storageAvailable = true;
let recoveryMessage = '', lastAutosave = 0;

function readStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return { kind: 'missing' };
    if (raw.length > 2048) return { kind: 'invalid' };
    const valid = validateSketch(JSON.parse(raw));
    return valid.ok ? { kind: 'valid', value: valid.value } : { kind: 'invalid' };
  } catch (error) {
    return { kind: error instanceof SyntaxError ? 'invalid' : 'unavailable' };
  }
}

function writeStorage(key, value) {
  try {
    const json = JSON.stringify(value);
    localStorage.setItem(key, json);
    if (localStorage.getItem(key) !== json) throw new Error('Write could not be verified.');
    storageAvailable = true;
    return true;
  } catch {
    storageAvailable = false;
    return false;
  }
}

function storageStatus(message = '') {
  const node = $('#storage-status');
  node.classList.toggle('error', !storageAvailable);
  node.textContent = storageAvailable
    ? (message || recoveryMessage || 'Working copy recovers on reload. Keep a separate checkpoint when you like a sketch.')
    : 'Browser recovery unavailable. Save playback HTML to keep a portable copy before leaving.';
  $('#recover-sketch').disabled = !keptSketch;
}

function saveDraft() {
  const wasAvailable = storageAvailable;
  const okay = writeStorage(DRAFT_KEY, sketch);
  if (!okay || wasAvailable !== storageAvailable) storageStatus();
  return okay;
}

const draft = readStorage(DRAFT_KEY), kept = readStorage(KEPT_KEY);
if (draft.kind === 'valid') { sketch = draft.value; wantsPlay = false; recoveryMessage = 'Recovered your working copy at its kept phase.'; }
else if (draft.kind === 'invalid') recoveryMessage = 'The old working copy was invalid. Weave is ready; your current work and exports remain usable.';
if (kept.kind === 'valid') keptSketch = kept.value;
else if (kept.kind === 'invalid') recoveryMessage += ' The kept checkpoint was invalid and has not replaced your work.';
storageAvailable = draft.kind !== 'unavailable' && kept.kind !== 'unavailable';

function paint() {
  $('#loops').innerHTML = frameMarkup(frameAt(sketch));
  $('#phase-range').value = String(sketch.phase);
  if (document.activeElement !== $('#phase-number')) $('#phase-number').value = sketch.phase.toFixed(1);
  framesPainted++;
}

function updateSettings() {
  for (const key of ['count', 'cycle', 'travel']) {
    $(`#${key}-range`).value = sketch[key];
    if (document.activeElement !== $(`#${key}-number`)) $(`#${key}-number`).value = key === 'cycle' ? sketch[key].toFixed(1) : sketch[key];
  }
  const name = presetName(sketch);
  $('#sketch-name').textContent = name;
  $('#frame-readout').textContent = `${sketch.count} loops / ${sketch.cycle.toFixed(1)} s / ${sketch.travel} travel`;
  $('#art-title').textContent = `${name} — ${sketch.count} looping ellipses`;
  $('#art-description').textContent = `Original vector composition. ${sketch.cycle.toFixed(1)} second cycle and ${sketch.travel} relative travel units. Use Phase to inspect a still frame.`;
  document.querySelectorAll('[data-preset]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.preset === name.toLowerCase())));
}

const eligible = () => wantsPlay && isOnscreen && !document.hidden;
function cancelScheduledFrame() {
  if (raf !== null) cancelAnimationFrame(raf);
  raf = null; previous = null;
}
function playbackStatus() {
  $('#play-label').textContent = wantsPlay ? 'Pause' : 'Play';
  $('#play-icon').textContent = wantsPlay ? 'Ⅱ' : '▶';
  $('#play-toggle').setAttribute('aria-pressed', String(wantsPlay));
  $('#playback-state').textContent = wantsPlay
    ? (eligible() ? 'Playing' : 'Suspended out of view')
    : `Paused at ${sketch.phase.toFixed(1)}%`;
  $('#motion-note').textContent = motion.matches
    ? 'Reduced motion: the sketch pauses. Inspect Phase, or choose Play to watch.'
    : 'Pause to inspect, or move Phase to hold a frame.';
}
function syncPlayback() {
  cancelScheduledFrame();
  playbackStatus();
  if (eligible()) raf = requestAnimationFrame(tick);
}
function tick(now) {
  raf = null;
  if (!eligible()) { previous = null; return; }
  if (previous !== null) sketch.phase = (sketch.phase + (now - previous) / (sketch.cycle * 10)) % 100;
  previous = now;
  paint();
  if (now - lastAutosave >= 1500) { saveDraft(); lastAutosave = now; }
  raf = requestAnimationFrame(tick);
}
function pause() { wantsPlay = false; syncPlayback(); saveDraft(); }

$('#play-toggle').addEventListener('click', () => {
  wantsPlay = !wantsPlay;
  syncPlayback();
  if (!wantsPlay) saveDraft();
});

function editParameter(key, source) {
  const value = source.valueAsNumber, range = LIMITS[key];
  const isWhole = key !== 'count' && key !== 'travel' || Number.isInteger(value);
  const validStep = key !== 'cycle' || Math.abs(value * 10 - Math.round(value * 10)) < 0.00001;
  if (!Number.isFinite(value) || value < range.min || value > range.max || !isWhole || !validStep) {
    const message = key === 'count' ? 'Use 3–12 whole elements.' : key === 'cycle' ? 'Use a cycle from 1.0–6.0 seconds, in tenths.' : key === 'travel' ? 'Use 0–100 whole travel units.' : 'Use a phase from 0–100 percent.';
    source.setCustomValidity(message);
    $('#input-status').textContent = `${message} The current sketch is unchanged.`;
    $('#input-status').classList.add('error');
    return;
  }
  source.setCustomValidity('');
  if (key === 'phase') { wantsPlay = false; cancelScheduledFrame(); }
  sketch[key] = value;
  recoveryMessage = '';
  paint(); updateSettings();
  if (key === 'phase') syncPlayback();
  $('#input-status').textContent = 'Count the loops, set the pace, spread their paths.';
  $('#input-status').classList.remove('error');
  saveDraft(); storageStatus();
}

for (const key of ['count', 'cycle', 'travel', 'phase']) {
  for (const kind of ['range', 'number']) {
    const input = $(`#${key}-${kind}`);
    input.addEventListener('input', () => editParameter(key, input));
    input.addEventListener('change', () => { if (!input.validity.valid) input.reportValidity(); });
    input.addEventListener('blur', () => {
      if (!input.validity.valid) {
        input.value = key === 'cycle' || key === 'phase' ? sketch[key].toFixed(1) : sketch[key];
        input.setCustomValidity('');
        $('#input-status').textContent = 'Restored the valid setting. Your current sketch is ready.';
        $('#input-status').classList.remove('error');
      }
    });
  }
}
$('#phase-number').addEventListener('focus', pause);
$('#settings').addEventListener('submit', event => event.preventDefault());

document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => {
  sketch = { ...PRESETS[button.dataset.preset] };
  recoveryMessage = '';
  document.querySelectorAll('input').forEach(input => input.setCustomValidity(''));
  paint(); updateSettings(); syncPlayback(); saveDraft(); storageStatus();
  $('#input-status').textContent = `${presetName(sketch)} starting point loaded.`;
  $('#input-status').classList.remove('error');
}));

function download(kind) {
  pause();
  const frozen = { ...sketch };
  const filename = `phase-${presetName(frozen).toLowerCase().replaceAll(' ', '-')}-${frozen.phase.toFixed(1).replace('.', '-')}.${kind === 'svg' ? 'svg' : 'html'}`;
  const blob = new Blob([kind === 'svg' ? svgDocument(frozen) : playbackHTML(frozen)], { type: kind === 'svg' ? 'image/svg+xml;charset=utf-8' : 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob), anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $('#export-status').textContent = `${kind === 'svg' ? 'SVG' : 'Playback HTML'} created at phase ${frozen.phase.toFixed(1)}%.`;
}
$('#export-svg').addEventListener('click', () => download('svg'));
$('#export-html').addEventListener('click', () => download('html'));

$('#keep-sketch').addEventListener('click', () => {
  pause();
  if (writeStorage(KEPT_KEY, sketch)) {
    keptSketch = { ...sketch }; recoveryMessage = '';
    storageStatus(`Kept ${presetName(sketch)} at ${sketch.phase.toFixed(1)}%. Recover this checkpoint after further edits.`);
  } else storageStatus();
});
$('#recover-sketch').addEventListener('click', () => {
  const recovered = readStorage(KEPT_KEY);
  if (recovered.kind !== 'valid') {
    if (recovered.kind === 'unavailable') storageAvailable = false;
    storageStatus('The kept checkpoint could not be read. Your current work is unchanged.');
    return;
  }
  sketch = recovered.value; wantsPlay = false; keptSketch = { ...sketch };
  paint(); updateSettings(); syncPlayback(); saveDraft();
  storageStatus(`Recovered ${presetName(sketch)} at phase ${sketch.phase.toFixed(1)}%.`);
});

$('#reset-sketch').addEventListener('click', () => {
  $('#reset-dialog').returnValue = '';
  $('#reset-dialog').showModal();
});
$('#reset-dialog').addEventListener('close', () => {
  if ($('#reset-dialog').returnValue !== 'reset') return;
  sketch = { ...PRESETS.weave }; wantsPlay = false; recoveryMessage = '';
  document.querySelectorAll('input').forEach(input => input.setCustomValidity(''));
  paint(); updateSettings(); syncPlayback(); saveDraft();
  storageStatus('Current sketch reset to Weave. Your kept checkpoint remains available.');
  $('#input-status').textContent = 'Count the loops, set the pace, spread their paths.';
  $('#input-status').classList.remove('error');
});

document.addEventListener('click', event => {
  const link = event.target.closest('a[href]');
  if (!link || link.id === 'leave-anyway' || link.hasAttribute('download') || event.defaultPrevented
    || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
    || (link.target && link.target !== '_self')) return;
  const destination = new URL(link.href, location.href);
  const sameDocument = destination.origin === location.origin && destination.pathname === location.pathname
    && destination.search === location.search && destination.hash;
  if (sameDocument) return;
  if (!saveDraft()) {
    event.preventDefault(); pause();
    $('#leave-anyway').href = link.href;
    $('#leave-anyway').textContent = link.id === 'guide-link' ? 'Open guide anyway ↗' : 'Continue anyway ↗';
    $('#leave-dialog').showModal();
  }
});
$('#leave-stay').addEventListener('click', () => $('#leave-dialog').close());
$('#leave-export').addEventListener('click', () => download('html'));
$('#leave-anyway').addEventListener('click', () => $('#leave-dialog').close());

document.addEventListener('visibilitychange', () => {
  syncPlayback();
  if (document.hidden) saveDraft();
});
new IntersectionObserver(entries => {
  isOnscreen = entries[0].isIntersecting;
  syncPlayback();
}, { threshold: 0 }).observe($('#preview-shell'));
motion.addEventListener('change', () => {
  if (motion.matches) wantsPlay = false;
  syncPlayback(); saveDraft();
});
window.addEventListener('pagehide', () => { wantsPlay = false; cancelScheduledFrame(); saveDraft(); });
window.addEventListener('pageshow', syncPlayback);

// Keep keyboard-focused settings below the one actual sticky artwork console.
// This follows ordinary focus changes; wheel and touch scrolling are untouched.
const work = $('.work');
function revealFocusedSetting(target) {
  if (!target || !$('.controls').contains(target)) return;
  const field = target.closest('.setting-field') || target;
  let bounds = field.getBoundingClientRect();
  if (bounds.bottom > innerHeight - 16) window.scrollBy({ top: bounds.bottom - innerHeight + 16, behavior: 'instant' });
  else if (bounds.top < 16) window.scrollBy({ top: bounds.top - 16, behavior: 'instant' });
  if (getComputedStyle(work).position !== 'sticky') return;
  bounds = field.getBoundingClientRect();
  const consoleBounds = work.getBoundingClientRect();
  const overlapsConsole = bounds.right > consoleBounds.left && bounds.left < consoleBounds.right;
  const availableHeight = innerHeight - consoleBounds.bottom - 28;
  if (overlapsConsole && consoleBounds.top <= 22 && bounds.top < consoleBounds.bottom + 12 && bounds.height <= availableHeight) {
    window.scrollBy({ top: bounds.bottom - innerHeight + 16, behavior: 'instant' });
  }
}
function measureConsole() {
  // Measure the actual sticky arrangement before deciding whether it can fit.
  // If not, the same artwork becomes normal page content at the enlarged size.
  work.classList.remove('flow-console');
  let height = Math.ceil(work.getBoundingClientRect().height);
  if (!work.classList.contains('tight-console') && height > innerHeight - 200) work.classList.add('tight-console');
  else if (work.classList.contains('tight-console') && height < innerHeight - 400) work.classList.remove('tight-console');
  height = Math.ceil(work.getBoundingClientRect().height);
  const bounds = work.getBoundingClientRect(), controls = $('.controls').getBoundingClientRect();
  const sharedColumn = controls.left < bounds.right && controls.right > bounds.left;
  const readingRoom = Math.max(...[...document.querySelectorAll('.preset,.setting-field')].map(element => element.getBoundingClientRect().height)) + 32;
  const needsFlow = sharedColumn && height + readingRoom > innerHeight;
  work.classList.toggle('flow-console', needsFlow);
  document.documentElement.style.setProperty('--console-height', `${needsFlow ? 0 : height}px`);
  revealFocusedSetting(document.activeElement);
}
new ResizeObserver(measureConsole).observe(work);
window.addEventListener('resize', measureConsole);
$('.controls').addEventListener('focusin', event => {
  revealFocusedSetting(event.target);
  setTimeout(() => { if (document.activeElement === event.target) revealFocusedSetting(event.target); }, 0);
});

paint(); updateSettings(); syncPlayback(); storageStatus();
if (storageAvailable && draft.kind !== 'invalid') saveDraft();

// Read-only evidence for browser checks; the interface owns all mutations.
window.phaseWorkbench = Object.freeze({
  snapshot: () => ({ sketch: { ...sketch }, name: presetName(sketch), wantsPlay, isOnscreen, hidden: document.hidden, reducedMotion: motion.matches, animationPending: raf !== null, framesPainted, storageAvailable }),
});
