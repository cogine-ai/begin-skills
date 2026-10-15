import { DEFAULT_DRAFT, FORMATS, LIMITS, STORAGE_KEY, chars, draftValue, validateDraft, exportStatus, buildSvg, prepareDraft, keptRecord, recoverRecord } from './model.mjs';
import { FONT_ASSETS } from './font-assets.mjs';

const byId = id => document.getElementById(id);
const fields = Object.fromEntries(['name', 'recipient', 'sender', 'message'].map(key => [key, byId(key === 'name' ? 'card-name' : key)]));
let bundle = null;
let prepared = null;
let lastValid = { ...DEFAULT_DRAFT };
let kept = null;
let hasStoredRecord = false;
let storageAvailable = true;

function readDraft() {
  return draftValue({ ...Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.value])), format: document.querySelector('input[name="format"]:checked')?.value });
}

function fillDraft(draft) {
  for (const [key, field] of Object.entries(fields)) field.value = draft[key];
  byId(`format-${draft.format}`).checked = true;
}

function say(message) { byId('action-status').textContent = message; }

function renderDraft() {
  const draft = readDraft();
  const check = validateDraft(draft);
  for (const [key, field] of Object.entries(fields)) {
    const error = check.errors[key] || '';
    byId(`${key}-error`).textContent = error;
    byId(`${key}-count`).textContent = `${chars(draft[key])} / ${LIMITS[key]}`;
    field.setAttribute('aria-invalid', String(Boolean(error)));
  }
  byId('format-error').textContent = check.errors.format || '';
  const summary = byId('editor-status');
  summary.dataset.state = check.valid ? 'ready' : 'invalid';
  summary.textContent = check.valid ? `Words fit · ${check.lines.length} of ${check.format.maxLines} printed message lines` : 'Edit needed · your current words remain here';
  byId('prepare').disabled = !check.valid || !bundle;
  if (check.valid) lastValid = { ...draft };
  byId('live-svg').innerHTML = buildSvg(lastValid).replace(/^<\?xml[^>]*\?>\s*/, '');
  const format = FORMATS[lastValid.format];
  byId('composition-caption').textContent = `${format.label} · ${format.width} × ${format.height} mm · fixed printed type size`;
  byId('preview-state').textContent = check.valid ? 'Current composition' : 'Earlier valid composition · correct the current words to update it';
  byId('preview-state').dataset.state = check.valid ? 'ready' : 'invalid';
  byId('current-recipient').textContent = draft.recipient || 'Recipient';
  byId('current-message').textContent = draft.message || 'Your message will appear here.';
  byId('current-sender').textContent = draft.sender || 'Sender';
  renderPrepared();
}

function renderPrepared() {
  const state = exportStatus(prepared, readDraft());
  for (const id of ['keep', 'download-svg', 'download-txt']) byId(id).disabled = !state.canExport || (id === 'keep' && !storageAvailable);
  if (!prepared) return;
  const label = byId('prepared-status');
  label.dataset.state = state.canExport ? 'ready' : 'invalid';
  label.textContent = state.canExport ? 'Prepared from the current words' : !state.valid ? 'Current edits are invalid · this earlier prepared copy is retained; keep and downloads are blocked' : 'Words changed · this earlier prepared copy is retained; prepare again to keep or download';
}

function showPrepared() {
  byId('prepared').hidden = false;
  document.querySelectorAll('[data-prepared-link]').forEach(link => { link.hidden = false; });
  byId('prepared-heading').textContent = prepared.draft.name;
  byId('prepared-recipient').textContent = prepared.draft.recipient;
  byId('prepared-message').textContent = prepared.draft.message;
  byId('prepared-sender').textContent = prepared.draft.sender;
  byId('prepared-svg').innerHTML = prepared.svg.replace(/^<\?xml[^>]*\?>\s*/, '');
  byId('prepared-txt').textContent = prepared.txt;
  const f = FORMATS[prepared.draft.format];
  byId('prepared-format').textContent = `${f.label} · ${f.width} × ${f.height} mm`;
  renderPrepared();
}

function inspectKept() {
  kept = null;
  hasStoredRecord = false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    hasStoredRecord = raw !== null;
    if (raw !== null) {
      try { kept = recoverRecord(raw); }
      catch (error) { byId('kept-status').textContent = error.message; }
    } else byId('kept-status').textContent = 'No postcard kept on this browser yet.';
    if (kept) byId('kept-status').textContent = `Kept here: “${kept.name}”, for ${kept.recipient}.`;
  } catch {
    storageAvailable = false;
    byId('kept-status').textContent = 'This browser cannot store a kept postcard. You can still download prepared files.';
  }
  byId('recover').disabled = !kept || !bundle;
  byId('forget').disabled = !hasStoredRecord || !storageAvailable;
  renderPrepared();
}

function downloadFile(kind) {
  if (!exportStatus(prepared, readDraft()).canExport) return;
  const file = kind === 'svg' ? prepared.svg : prepared.txt;
  const type = kind === 'svg' ? 'image/svg+xml;charset=utf-8' : 'text/plain;charset=utf-8';
  const url = URL.createObjectURL(new Blob([file], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${prepared.fileBase}.${kind}`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  say(`${kind === 'svg' ? 'Printable SVG' : 'Complete text copy'} requested: ${prepared.fileBase}.${kind}.`);
}

function base64(bytes) {
  let binary = '';
  for (let start = 0; start < bytes.length; start += 8192) binary += String.fromCharCode(...bytes.subarray(start, start + 8192));
  return btoa(binary);
}

async function loadPrintFonts() {
  bundle = await Promise.all(FONT_ASSETS.map(async asset => {
    const [fontResponse, noticeResponse] = await Promise.all([fetch(asset.file), fetch(asset.notice)]);
    if (!fontResponse.ok || !noticeResponse.ok) throw new Error('A print resource could not be loaded.');
    const font = new Uint8Array(await fontResponse.arrayBuffer());
    const notice = new Uint8Array(await noticeResponse.arrayBuffer());
    const digest = async bytes => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))).map(value => value.toString(16).padStart(2, '0')).join('');
    if (await digest(font) !== asset.sha256 || await digest(notice) !== asset.noticeSha256) throw new Error('A print resource differs from its unchanged source.');
    return { family: asset.family, style: asset.style, base64: base64(font), sha256: asset.sha256, license: new TextDecoder().decode(notice) };
  }));
  byId('font-state').textContent = 'Ready to prepare a portable SVG and complete text copy.';
  renderDraft();
  inspectKept();
}

const initial = { ...DEFAULT_DRAFT };
const requestedFormat = new URLSearchParams(location.search).get('format');
if (Object.hasOwn(FORMATS, requestedFormat || '')) initial.format = requestedFormat;
fillDraft(initial);
lastValid = initial;

byId('postcard-form').addEventListener('input', renderDraft);
byId('postcard-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!bundle || !validateDraft(readDraft()).valid) return;
  prepared = prepareDraft(readDraft(), bundle);
  showPrepared();
  say(`Prepared “${prepared.draft.name}”. Read it through, then keep or download.`);
  byId('prepared-heading').focus({ preventScroll: true });
  byId('prepared').scrollIntoView({ behavior: 'auto', block: 'start' });
});

byId('keep').addEventListener('click', () => {
  if (!exportStatus(prepared, readDraft()).canExport) return;
  try {
    const record = keptRecord(prepared);
    localStorage.setItem(STORAGE_KEY, record);
    if (localStorage.getItem(STORAGE_KEY) !== record) throw new Error('The browser did not retain this copy.');
    inspectKept();
    say(`Kept “${prepared.draft.name}” on this browser. Keeping another postcard replaces this one.`);
  } catch {
    say('The browser could not keep this postcard. Your prepared copy is still open; download its files to retain it.');
  }
});

byId('recover').addEventListener('click', () => {
  if (!kept || !bundle) return;
  fillDraft(kept);
  prepared = prepareDraft(kept, bundle);
  renderDraft();
  showPrepared();
  say(`Recovered “${kept.name}” into the editor and prepared copy.`);
  byId('prepared-heading').focus({ preventScroll: true });
  byId('prepared').scrollIntoView({ behavior: 'auto', block: 'start' });
});

byId('forget').addEventListener('click', () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    if (localStorage.getItem(STORAGE_KEY) !== null) throw new Error('The browser retained this copy.');
    inspectKept();
    say('Forgot the kept postcard on this browser. Your open words and prepared copy remain here.');
  } catch { say('This browser could not forget the kept postcard. Try its site-data controls.'); }
});

byId('download-svg').addEventListener('click', () => downloadFile('svg'));
byId('download-txt').addEventListener('click', () => downloadFile('txt'));
byId('use-example').addEventListener('click', () => {
  fillDraft({ ...DEFAULT_DRAFT });
  renderDraft();
  say('The example words are back in the editor. Prepare again if your earlier copy differs.');
});

renderDraft();
inspectKept();
loadPrintFonts().catch(error => {
  bundle = null;
  byId('font-state').textContent = 'The printable resources could not load. Your words remain here. Reload this page to retry.';
  byId('font-state').dataset.state = 'invalid';
  renderDraft();
  say(error.message);
});
