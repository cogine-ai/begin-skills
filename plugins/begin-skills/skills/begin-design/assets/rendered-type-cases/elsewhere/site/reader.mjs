import { STORY, createState, currentNode, choose, revisit, restart, edit, prepare, preparedStatus, validation, canExport, saveKept, loadKept, forgetKept } from './story-model.mjs';

const $ = id => document.getElementById(id);
let state = createState();
let pendingConfirmation = null;
let storage;
try { storage = window.localStorage; } catch { storage = { getItem() { throw new Error('Storage blocked'); }, setItem() { throw new Error('Storage blocked'); }, removeItem() { throw new Error('Storage blocked'); } }; }
const fixture = new URLSearchParams(window.location.search).get('fixture');
if (fixture === 'return') {
  state = edit(state, { title: 'The long way home', note: 'For the words that arrived late. Rain, memory, café.' });
  for (const action of [0, 0, 0, 0]) state = choose(state, action);
  state = prepare(state).state;
}
function textElement(tag, text, className) {
  const node = document.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  return node;
}
function feedback(message) { $('feedback').textContent = message; }
function focusScene() { $('scene-title').focus({ preventScroll: true }); $('scene-title').scrollIntoView({ block: 'start', behavior: 'instant' }); }
function updateCurrent() { renderScene(); renderRoute(); updatePreparedState(); }
function renderScene() {
  const node = currentNode(state);
  const ending = node.kind === 'ending';
  $('scene-title').textContent = node.title;
  document.title = `${node.title} — ELSEWHERE`;
  $('scene-position').textContent = ending ? 'Your ending' : `Scene ${String(state.path.length).padStart(2, '0')} of 04`;
  $('scene-weather').textContent = ending ? 'The rain has changed' : 'Platform Seven';
  $('scene-prose').replaceChildren(...node.paragraphs.map(p => textElement('p', p)));
  if (ending) {
    $('choice-area').replaceChildren(textElement('div', 'End of this reading', 'ending-mark'));
  } else {
    const heading = textElement('p', 'What will you do?', 'choice-heading');
    const choices = document.createElement('div'); choices.className = 'choices'; choices.id = 'choices';
    node.choices.forEach((choice, i) => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'choice'; button.dataset.choice = String(i);
      button.setAttribute('aria-label', choice.label);
      const number = textElement('span', String(i + 1).padStart(2, '0'), 'choice-number'); number.setAttribute('aria-hidden', 'true');
      const label = textElement('span', choice.label, 'choice-text');
      const arrow = textElement('span', '→', 'choice-arrow'); arrow.setAttribute('aria-hidden', 'true');
      button.append(number, label, arrow);
      button.addEventListener('click', () => { state = choose(state, i); updateCurrent(); feedback(''); focusScene(); });
      choices.append(button);
    });
    $('choice-area').replaceChildren(heading, choices);
  }
  $('back-scene').disabled = state.path.length === 1;
  $('start-over-end').hidden = !ending;
}
function renderRoute() {
  $('route-count').textContent = String(state.path.length).padStart(2, '0');
  const items = state.path.map((id, i) => {
    const item = document.createElement('li'); item.className = 'route-item' + (i === state.path.length - 1 ? ' current' : '');
    const button = document.createElement('button'); button.type = 'button'; button.className = 'route-revisit'; button.dataset.revisit = String(i);
    button.append(textElement('span', STORY[id].title, 'route-title'));
    if (i === state.path.length - 1) button.setAttribute('aria-current', 'step');
    button.setAttribute('aria-label', `Revisit ${STORY[id].title}`);
    button.addEventListener('click', () => { state = revisit(state, i); updateCurrent(); feedback('This is where your path now stops. Choose again to continue.'); focusScene(); });
    item.append(button);
    if (i < state.decisions.length) item.append(textElement('span', STORY[id].choices[state.decisions[i]].label, 'route-choice'));
    return item;
  });
  $('route-list').replaceChildren(...items);
}
function updatePreparedState() {
  const status = preparedStatus(state);
  const message = {
    invalid: validation(state),
    empty: 'Your path is not prepared yet.',
    stale: 'Your reading has changed. Prepare it again to keep or download.',
    ready: state.prepared?.status.startsWith('Complete') ? 'Prepared · complete reading' : 'Prepared · unfinished reading'
  }[status];
  $('prepare-state').textContent = message;
  $('prepare-state').dataset.state = status;
  const error = validation(state);
  $('title-error').textContent = error;
  $('title-error').hidden = !error;
  $('journey-title').setAttribute('aria-invalid', String(Boolean(error)));
  $('prepare').disabled = Boolean(error);
  document.querySelectorAll('.export-button').forEach(button => { button.disabled = !canExport(state); });
  const resultState = $('result-state');
  if (resultState) {
    resultState.textContent = status === 'ready' ? state.prepared.status : `Previously prepared · ${status === 'invalid' ? 'current title needs attention' : 'current reading has changed'}`;
  }
}
function exportActions() {
  const row = document.createElement('div'); row.className = 'export-actions';
  const keep = textElement('button', 'Keep in this browser', 'solid-button export-button'); keep.type = 'button'; keep.dataset.action = 'keep';
  keep.addEventListener('click', () => { const result = saveKept(state, storage); feedback(result.message); updateKeptControls(); });
  const download = textElement('button', 'Download reading .txt ↓', 'outline-button export-button'); download.type = 'button'; download.dataset.action = 'download';
  download.addEventListener('click', downloadReading);
  row.append(keep, download);
  return row;
}
function renderPrepared() {
  if (!state.prepared) { $('prepared-result').replaceChildren(textElement('p', 'Your words will appear here after you prepare them.', 'prepared-empty')); return; }
  const snapshot = state.prepared;
  const article = document.createElement('article'); article.className = 'prepared-reading'; article.setAttribute('aria-labelledby', 'prepared-title');
  const status = textElement('p', snapshot.status, 'prepared-status'); status.id = 'result-state';
  const title = textElement('h3', snapshot.title); title.id = 'prepared-title';
  article.append(status, title);
  if (snapshot.note) article.append(textElement('p', snapshot.note, 'prepared-note'));
  article.append(exportActions());
  const scenes = document.createElement('div'); scenes.className = 'prepared-scenes';
  snapshot.records.forEach((record, i) => {
    const section = document.createElement('section'); section.className = 'prepared-scene';
    section.append(textElement('p', `${String(i + 1).padStart(2, '0')} · ${record.kind === 'ending' ? 'Ending' : 'Scene'}`, 'utility'), textElement('h4', record.title));
    record.paragraphs.forEach(p => section.append(textElement('p', p)));
    section.append(textElement('p', record.kind === 'ending' ? 'End of this reading' : record.chosenLabel ? `You chose: ${record.chosenLabel}` : 'No choice made yet · this reading is unfinished', 'selected-choice'));
    scenes.append(section);
  });
  article.append(scenes, exportActions());
  const raw = document.createElement('details'); raw.className = 'raw-text';
  const summary = textElement('summary', 'Read the exact download text');
  const pre = textElement('pre', snapshot.text); pre.id = 'download-text';
  raw.append(summary, pre); article.append(raw);
  $('prepared-result').replaceChildren(article);
  updatePreparedState();
}
function downloadReading() {
  if (!canExport(state)) { feedback(validation(state) || 'Prepare this reading again before downloading.'); return; }
  const bytes = new TextEncoder().encode(state.prepared.text);
  const blob = new Blob([bytes], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url;
  link.download = `${state.prepared.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 65) || 'elsewhere-reading'}.txt`;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  feedback('Your exact prepared text has been offered as a UTF-8 download.');
}
function updateKeptControls() {
  const kept = loadKept(storage);
  $('recover').disabled = !kept.ok;
  $('forget').disabled = !kept.exists;
  $('kept-status').textContent = kept.ok ? `Kept here: ${kept.state.prepared.title}` : kept.exists ? kept.message : 'Nothing is kept in this browser yet.';
}
function confirmAction(title, description, label, callback) {
  $('confirm-title').textContent = title;
  $('confirm-description').textContent = description;
  $('confirm-action').textContent = label;
  pendingConfirmation = callback;
  $('confirm-dialog').showModal();
}
$('confirm-cancel').addEventListener('click', () => { pendingConfirmation = null; $('confirm-dialog').close(); });
$('confirm-action').addEventListener('click', () => { const callback = pendingConfirmation; pendingConfirmation = null; $('confirm-dialog').close(); callback?.(); });
$('confirm-dialog').addEventListener('cancel', () => { pendingConfirmation = null; });
$('journey-title').addEventListener('input', event => { state = edit(state, { title: event.target.value }); updatePreparedState(); feedback(''); });
$('journey-note').addEventListener('input', event => { state = edit(state, { note: event.target.value }); updatePreparedState(); feedback(''); });
$('keepsake-form').addEventListener('submit', event => {
  event.preventDefault(); const result = prepare(state); state = result.state;
  if (result.ok) { renderPrepared(); feedback(result.message); $('prepared-title').setAttribute('tabindex', '-1'); $('prepared-title').focus({ preventScroll: true }); $('prepared-title').scrollIntoView({ block: 'start', behavior: 'instant' }); }
  else { updatePreparedState(); feedback(result.message); $('journey-title').focus(); }
});
$('back-scene').addEventListener('click', () => { if (state.path.length > 1) { state = revisit(state, state.path.length - 2); updateCurrent(); feedback('The later scene has left your path. Choose again to continue.'); focusScene(); } });
$('start-over-end').addEventListener('click', () => { state = revisit(state, state.path.length - 2); updateCurrent(); feedback('Choose a different action here, or start the story over for another route.'); focusScene(); });
$('start-over-top').addEventListener('click', () => confirmAction('Begin the story again?', 'Your visited route will start at Platform Seven. Your journey title, note, and previous prepared keepsake will stay here until you prepare a new reading.', 'Start story over', () => { state = restart(state); updateCurrent(); feedback('A new path begins. Your kept reading is unchanged.'); focusScene(); }));
$('reset').addEventListener('click', () => confirmAction('Reset the open reading?', 'This clears the open route, title, note, and prepared text. A reading you deliberately kept in this browser stays available to recover.', 'Reset this reading', () => { state = createState(); syncFields(); updateCurrent(); renderPrepared(); feedback('The open reading is reset. Any kept reading is still here.'); focusScene(); }));
$('recover').addEventListener('click', () => confirmAction('Recover the kept reading?', 'This replaces your open reading with the last prepared reading kept in this browser, including its route, title, note, and complete text.', 'Recover this reading', () => { const result = loadKept(storage); if (result.ok) { state = result.state; syncFields(); updateCurrent(); renderPrepared(); focusScene(); } feedback(result.message); updateKeptControls(); }));
$('forget').addEventListener('click', () => confirmAction('Forget the kept reading?', 'This removes the reading stored in this browser. Your open reading and any file you downloaded remain available.', 'Forget this reading', () => { feedback(forgetKept(storage).message); updateKeptControls(); }));
function syncFields() { $('journey-title').value = state.title; $('journey-note').value = state.note; }
syncFields(); renderScene(); renderRoute(); renderPrepared(); updatePreparedState(); updateKeptControls();
if (fixture === 'return') feedback('Example route loaded. It has not been kept in this browser.');
