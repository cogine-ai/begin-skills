import { recoverConfiguration, saveStoredConfiguration, validConfiguration, copyConfiguration, specification, money, visualTarget, lampGeometry, queryForConfiguration, standaloneSpecification } from './model.mjs';
let storage;
try { storage = window.localStorage; } catch { storage = null; }
const recovered = recoverConfiguration(storage, location.search);
let state = copyConfiguration(recovered.config);
const links = [...document.querySelectorAll('a[data-carry]')].map(link => ({ link, destination: link.getAttribute('href') }));
const scenes = [...document.querySelectorAll('[data-lamp-scene]')];
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const visibility = new Map(scenes.map(scene => [scene, true]));
let painted = visualTarget(state), target = { ...painted }, animation = 0;
let exportURL = null;
let statusPrefix = recovered.linked === 'invalid' ? 'An unsupported configuration link was ignored. ' : recovered.stored === 'invalid' && recovered.linked !== 'valid' ? 'Unreadable saved settings were skipped. ' : '';
const select = selector => document.querySelector(selector);
const setText = (selector, text) => document.querySelectorAll(selector).forEach(element => { element.textContent = text; });
const part = (scene, name) => scene.querySelector(`[data-part="${name}"]`);
const color = (r, g, b) => `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
function paint(visual) {
  painted = { ...visual };
  const g = lampGeometry(visual), finish = color(visual.r, visual.g, visual.b), light = color(visual.lr, visual.lg, visual.lb);
  scenes.forEach(scene => {
    ['paint-base', 'paint-base-top', 'paint-pivot', 'shade'].forEach(name => part(scene, name).setAttribute('fill', finish));
    ['paint-stem', 'arm'].forEach(name => part(scene, name).setAttribute('stroke', finish));
    ['arm-outline', 'arm', 'arm-shine'].forEach(name => {
      part(scene, name).setAttribute('x2', g.x);
      part(scene, name).setAttribute('y2', g.y - (name === 'arm-shine' ? 3 : 0));
    });
    part(scene, 'neck').setAttribute('d', `M${g.x} ${g.y}V${g.y + 14}`);
    part(scene, 'shade').setAttribute('d', `M${g.x-g.topWidth} ${g.topY}L${g.x+g.topWidth} ${g.topY}L${g.x+g.width} ${g.bottomY}Q${g.x} ${g.bottomY+10} ${g.x-g.width} ${g.bottomY}Z`);
    part(scene, 'joint').setAttribute('cx', g.x);
    part(scene, 'joint').setAttribute('cy', g.y - 5);
    const emitter = part(scene, 'emitter');
    emitter.setAttribute('cx', g.x); emitter.setAttribute('cy', g.bottomY); emitter.setAttribute('rx', g.width - 3); emitter.setAttribute('fill', light);
    part(scene, 'beam').setAttribute('d', `M${g.x-g.width} ${g.bottomY}L${g.x+g.width} ${g.bottomY}L${g.poolX+145} 477L${g.poolX-145} 477Z`);
    part(scene, 'beam').setAttribute('fill', light);
    part(scene, 'pool').setAttribute('cx', g.poolX);
    part(scene, 'glow-stop').setAttribute('stop-color', light);
  });
}
function cancelAndFinish() {
  if (animation) cancelAnimationFrame(animation);
  animation = 0;
  paint(target);
}
function canMove() { return !motionPreference.matches && !document.hidden && [...visibility.values()].some(Boolean); }
function moveToConfiguration(immediate = false) {
  target = visualTarget(state);
  if (animation) cancelAnimationFrame(animation);
  animation = 0;
  if (immediate || !canMove() || Object.keys(target).every(key => target[key] === painted[key])) { paint(target); return; }
  const from = { ...painted }, to = { ...target }, start = performance.now(), duration = 380;
  const tick = now => {
    const progress = Math.min(1, (now - start) / duration), eased = 1 - (1 - progress) ** 3;
    const current = Object.fromEntries(Object.keys(to).map(key => [key, from[key] + (to[key] - from[key]) * eased]));
    paint(current);
    if (progress < 1 && canMove()) animation = requestAnimationFrame(tick);
    else { animation = 0; paint(target); }
  };
  animation = requestAnimationFrame(tick);
}
function updateLinks() {
  links.forEach(({ link, destination }) => {
    const url = new URL(destination, location.href);
    url.search = queryForConfiguration(state);
    link.href = `${url.pathname}${url.search}${url.hash}`;
  });
}
function showStorageStatus() {
  const saved = saveStoredConfiguration(storage, state);
  const message = saved
    ? `${statusPrefix}Your current valid configuration is kept in this browser. The saved value was checked.`
    : `${statusPrefix}Browser storage is unavailable. Your current work and export remain usable. Internal guide and home links carry these settings; keep an HTML specification before closing the browser.`;
  setText('#storage-status', message);
  return saved;
}
function renderValues(announce = false) {
  const s = specification(state), quantityLabel = `${state.quantity} ${state.quantity === 1 ? 'lamp' : 'lamps'}`;
  const values = { 'arm-name': s.arm.name, 'shade-name': s.shade.name, finish: s.finish.name, identity: s.identity,
    reach: `${s.arm.reach} cm`, height: `${s.arm.height} cm`, diameter: `Ø ${s.shade.diameter} cm`,
    temperature: `${state.temperature} K`, tilt: `${state.tilt}°`, 'quantity-label': quantityLabel,
    'unit-price': money(s.unitCents), total: money(s.totalCents), 'base-price': money(s.arm.cents), 'shade-price': money(s.shade.cents) };
  Object.entries(values).forEach(([key, value]) => setText(`[data-value="${key}"]`, value));
  document.querySelectorAll('input[type=radio]').forEach(input => { input.checked = String(state[input.name]) === input.value; });
  document.querySelectorAll('[data-arm-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.armChoice === state.arm)));
  const tilt = select('#tilt'), quantity = select('#quantity');
  if (tilt) tilt.value = state.tilt;
  if (quantity) {
    quantity.value = state.quantity;
    quantity.removeAttribute('aria-invalid');
    select('#quantity-error').hidden = true;
    select('#quantity-down').disabled = state.quantity === 1;
    select('#quantity-up').disabled = state.quantity === 8;
  }
  scenes.forEach(scene => { scene.querySelector('desc').textContent = `${s.identity}, ${state.temperature} K, ${state.tilt} degrees tilt. Original schematic, not to scale.`; });
  updateLinks();
  try { history.replaceState(null, '', `${location.pathname}${queryForConfiguration(state)}${location.hash}`); } catch { /* Navigation links still carry this valid configuration. */ }
  const exportButton = select('#export-spec');
  if (exportButton) exportButton.disabled = false;
  if (announce) {
    setText('#selection-status', `${s.identity}. ${quantityLabel}, total ${money(s.totalCents)}.`);
    setText('#export-status', 'Current specification updated. Keep a new file for these settings.');
  }
}
function commit(patch, { immediate = false } = {}) {
  const next = { ...state, ...patch };
  if (!validConfiguration(next)) return false;
  state = copyConfiguration(next);
  renderValues(true);
  statusPrefix = '';
  showStorageStatus();
  moveToConfiguration(immediate);
  return true;
}
document.querySelectorAll('input[type=radio]').forEach(input => input.addEventListener('change', () => {
  if (!input.checked) return;
  commit({ [input.name]: input.name === 'temperature' ? Number(input.value) : input.value });
}));
document.querySelectorAll('[data-arm-choice]').forEach(button => button.addEventListener('click', () => {
  commit({ arm: button.dataset.armChoice });
}));
select('#controls')?.addEventListener('submit', event => event.preventDefault());
// Native focus scrolls the radio's small input, not its visible option card.
// Finish focus placement against the actual painted sticky surfaces.
function placeFocusedControl() {
  const focused = document.activeElement;
  if (!focused?.closest('.config-main') || focused.closest('.task-jumps') || !focused.matches(':focus-visible')) return;
  const padding = 12;
  let top = padding;
  const bottom = window.innerHeight - padding;
  ['.task-jumps', '#tuning-preview'].forEach(selector => {
    const element = select(selector);
    if (!element) return;
    const style = getComputedStyle(element), stickyTop = Number.parseFloat(style.top);
    if (style.position !== 'sticky' || !Number.isFinite(stickyTop)) return;
    const box = element.getBoundingClientRect();
    if (box.height && box.top <= stickyTop + 1 && box.bottom > 0 && box.top < bottom) top = Math.max(top, box.bottom + padding);
  });
  const control = focused.closest('.choice, .quantity-row') || focused;
  const fieldset = focused.closest('fieldset');
  const frame = fieldset && fieldset.getBoundingClientRect().height <= bottom - top
    ? fieldset : control;
  const box = frame.getBoundingClientRect();
  const delta = box.top < top ? box.top - top : box.bottom > bottom ? box.bottom - bottom : 0;
  if (Math.abs(delta) > 1) window.scrollBy({ top: delta, behavior: 'instant' });
}
document.addEventListener('focusin', () => {
  const focused = document.activeElement;
  placeFocusedControl();
  queueMicrotask(() => { if (document.activeElement === focused) placeFocusedControl(); });
});

select('#tilt')?.addEventListener('input', event => commit({ tilt: Number(event.target.value) }, { immediate: true }));
const quantity = select('#quantity');
quantity?.addEventListener('input', () => {
  const raw = quantity.value, number = Number(raw);
  if (raw.trim() !== '' && Number.isInteger(number) && number >= 1 && number <= 8) commit({ quantity: number });
  else { quantity.setAttribute('aria-invalid', 'true'); select('#quantity-error').hidden = false; }
});
select('#quantity-down')?.addEventListener('click', () => commit({ quantity: Math.max(1, state.quantity - 1) }));
select('#quantity-up')?.addEventListener('click', () => commit({ quantity: Math.min(8, state.quantity + 1) }));
select('#export-spec')?.addEventListener('click', () => {
  try {
    const html = standaloneSpecification(state), blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    if (exportURL) URL.revokeObjectURL(exportURL);
    exportURL = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = exportURL;
    anchor.download = `mora-${state.arm}-${state.shade}-${state.finish}-${state.quantity}-lamps.html`;
    document.body.append(anchor); anchor.click(); anchor.remove();
    setText('#export-status', `HTML specification file created for ${specification(state).identity}, ${state.quantity} ${state.quantity === 1 ? 'lamp' : 'lamps'}. Check your browser downloads.`);
  } catch {
    setText('#export-status', 'The file could not be created. Your configuration remains here; try the download again.');
  }
});
motionPreference.addEventListener('change', () => { if (motionPreference.matches) cancelAndFinish(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAndFinish(); });
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => visibility.set(entry.target, entry.isIntersecting));
    if (![...visibility.values()].some(Boolean)) cancelAndFinish();
  }, { threshold: 0 });
  scenes.forEach(scene => observer.observe(scene));
}
window.addEventListener('pagehide', () => { cancelAndFinish(); if (exportURL) URL.revokeObjectURL(exportURL); });
window.addEventListener('pageshow', event => { if (event.persisted) { updateLinks(); showStorageStatus(); paint(target); } });
renderValues(false);
showStorageStatus();
paint(target);
