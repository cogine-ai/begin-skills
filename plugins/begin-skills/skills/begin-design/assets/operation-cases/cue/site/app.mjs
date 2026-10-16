import { STORAGE_KEY, fresh, recover, parseDraft, advance, start, pause, next, remaining, clock, portable } from './model.mjs';

const $ = id => document.getElementById(id);
let state = fresh();
let saving = true;
let recoveryNote = '';
let interval = null;
let shownCue = '';
let errors = ['', '', '', ''];
const announce = message => { $('announcement').textContent = message; };

try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) state = advance(recover(saved), Date.now());
} catch (error) {
  recoveryNote = 'The saved rehearsal could not be read. A fresh programme is open. ';
}

function save() {
  try {
    const data = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, data);
    if (localStorage.getItem(STORAGE_KEY) !== data) throw new Error('Save not confirmed');
    saving = true;
  } catch (error) { saving = false; }
  $('storage-status').textContent = recoveryNote + (saving
    ? 'Saved in this browser · Silent · Nothing sent to a server'
    : 'Local saving is unavailable. Links open separately to keep your rehearsal here. Export your programme before leaving.');
  $('storage-status').classList.toggle('warning', !saving || Boolean(recoveryNote));
}

const rows = state.programme.map((cue, index) => {
  const row = document.createElement('li');
  row.className = 'cue-row';
  row.innerHTML = `<span class="cue-index">0${index + 1}</span><label class="cue-name-field"><span class="sr-only">Cue ${index + 1} name</span><input id="name-${index + 1}" name="cue-${index + 1}-name" type="text" maxlength="60" required aria-describedby="error-${index + 1}"></label><label class="cue-duration-field"><span class="sr-only">Cue ${index + 1} duration in seconds</span><input id="duration-${index + 1}" name="cue-${index + 1}-seconds" type="number" inputmode="numeric" min="5" max="180" step="5" required aria-describedby="error-${index + 1}"></label><span class="read-name" hidden></span><span class="read-duration" hidden></span><p class="row-error" id="error-${index + 1}" hidden></p>`;
  $('cue-list').append(row);
  const name = row.querySelector('input[type=text]');
  const duration = row.querySelector('input[type=number]');
  name.value = state.draft[index].name;
  duration.value = state.draft[index].duration;
  return { row, name, duration, nameField: row.querySelector('.cue-name-field'), durationField: row.querySelector('.cue-duration-field'), readName: row.querySelector('.read-name'), readDuration: row.querySelector('.read-duration'), error: row.querySelector('.row-error') };
});

function validate(focus = false) {
  const result = parseDraft(state.draft);
  errors = result.errors;
  if (result.programme) state = { ...state, programme: result.programme };
  else if (focus) {
    const index = errors.findIndex(Boolean);
    const field = !state.draft[index].name.trim() ? rows[index].name : rows[index].duration;
    field.focus();
    announce(`Cue ${index + 1}: ${errors[index]}`);
  }
  return result.programme;
}

function render() {
  const view = advance(state, Date.now());
  if (view.status === 'finished' && state.status === 'running') { state = view; save(); schedule(); }
  const idle = view.status === 'idle';
  const active = view.status === 'running' || view.status === 'paused';
  const done = view.status === 'finished';
  const cue = view.programme[view.index];
  const nextCue = view.programme[view.index + 1];
  const total = view.programme.reduce((sum, item) => sum + item.durationSeconds * 1000, 0);
  $('rehearsal').dataset.state = view.status;
  $('run-status').textContent = { idle: 'Ready', running: 'Running', paused: 'Paused', finished: 'Complete' }[view.status];
  $('cue-position').textContent = done ? '04 cues complete' : `Cue ${String(view.index + 1).padStart(2, '0')} of 04`;
  $('current-cue').textContent = done ? 'Run-through complete' : cue.name;
  $('cue-time').textContent = done ? '00:00' : clock(cue.durationSeconds * 1000 - view.cueElapsedMs);
  $('time-caption').textContent = done ? 'A good place to take a breath.' : view.status === 'paused' ? 'left in this cue · paused' : 'left in this cue';
  $('next-label').textContent = done ? 'Your practice time' : nextCue ? 'Up next' : 'Final cue';
  $('next-name').textContent = done ? 'You made room for it' : nextCue ? nextCue.name : 'Bring it home';
  $('next-duration').textContent = done ? clock(view.elapsedMs, 'floor') : nextCue ? clock(nextCue.durationSeconds * 1000) : '';
  $('run-hint').textContent = { idle: 'Start when you’re ready. Cues advance automatically.', running: 'Keep going. Cue stays silent as the programme advances.', paused: 'Take your time. Resume when you’re ready.', finished: 'Reset to rehearse again or adjust the programme.' }[view.status];
  $('programme-left').textContent = clock(remaining(view));
  $('run-elapsed').textContent = clock(view.elapsedMs, 'floor');
  $('programme-progress').max = total;
  $('programme-progress').value = total - remaining(view);
  $('toggle').textContent = { idle: 'Start rehearsal', running: 'Pause rehearsal', paused: 'Resume rehearsal', finished: 'Rehearsal complete' }[view.status];
  $('toggle').disabled = done;
  $('next').disabled = !active;
  $('next').textContent = view.index === 3 ? 'Finish rehearsal →' : 'Next cue →';
  $('reset').disabled = idle;
  $('export').disabled = false;
  $('programme-total').textContent = `4 cues · ${clock(total)}`;
  $('programme-help').textContent = idle ? 'Edit names and seconds before you start. Changes save in this browser.' : 'Names and durations are held during a rehearsal. Reset the rehearsal to edit.';
  rows.forEach((row, index) => {
    row.nameField.hidden = !idle;
    row.durationField.hidden = !idle;
    row.name.disabled = !idle;
    row.duration.disabled = !idle;
    row.readName.hidden = idle;
    row.readDuration.hidden = idle;
    row.readName.textContent = view.programme[index].name;
    row.readDuration.textContent = clock(view.programme[index].durationSeconds * 1000);
    row.row.classList.toggle('current-row', active && view.index === index);
    row.error.textContent = errors[index];
    row.error.hidden = !idle || !errors[index];
    row.name.setAttribute('aria-invalid', String(Boolean(errors[index] && !state.draft[index].name.trim())));
    row.duration.setAttribute('aria-invalid', String(Boolean(errors[index] && state.draft[index].name.trim())));
  });
  const cueKey = `${view.status}:${view.index}`;
  if (shownCue && shownCue !== cueKey) {
    if (done) announce(`Rehearsal complete. Run elapsed ${clock(view.elapsedMs, 'floor')}.`);
    else if (view.status === 'running') announce(`Running cue ${view.index + 1}: ${cue.name}. ${cue.durationSeconds} seconds planned.`);
    else if (view.status === 'paused') announce(`Paused at cue ${view.index + 1}: ${cue.name}.`);
    else announce('Rehearsal reset. Ready to edit or start.');
  }
  shownCue = cueKey;
}
function schedule() {
  clearInterval(interval);
  interval = state.status === 'running' ? setInterval(render, 200) : null;
}
function commit(newState) { state = newState; save(); render(); schedule(); }

rows.forEach(row => {
  for (const field of [row.name, row.duration]) field.addEventListener('input', () => {
    if (state.status !== 'idle') return;
    state.draft = rows.map(item => ({ name: item.name.value, duration: item.duration.value }));
    validate();
    $('export-result').textContent = '';
    save(); render();
  });
});
$('toggle').addEventListener('click', () => {
  if (state.status === 'idle' && !validate(true)) { render(); return; }
  if (state.status === 'running') commit(pause(state, Date.now()));
  else if (state.status === 'idle' || state.status === 'paused') commit(start(state, Date.now()));
});
$('next').addEventListener('click', () => commit(next(state, Date.now())));
$('reset').addEventListener('click', () => {
  commit(fresh(state.programme));
  rows.forEach((row, index) => { row.name.value = state.draft[index].name; row.duration.value = state.draft[index].duration; });
  $('export-result').textContent = '';
});
$('export').addEventListener('click', () => {
  if (state.status === 'idle' && !validate(true)) { render(); return; }
  const file = new Blob([JSON.stringify(portable(state.programme), null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url; link.download = 'cue-programme.json';
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $('export-result').textContent = 'Programme JSON downloaded: four cue names, durations in seconds and the total.';
  announce('Programme JSON download created. Rehearsal progress stays in this browser.');
  save();
});
document.addEventListener('click', event => {
  const link = event.target.closest('a[href]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
  const destination = new URL(link.href, location.href);
  if (destination.origin !== location.origin) return;
  const documentPath = url => url.pathname.endsWith('/') ? `${url.pathname}index.html` : url.pathname;
  const sameDocument = documentPath(destination) === documentPath(location) && destination.search === location.search;
  if (sameDocument) {
    // Keep native fragment navigation and its keyboard focus behavior.
    if (destination.pathname === location.pathname && destination.hash) return;
    // Home and in-page routes should never reload and discard the live rehearsal.
    event.preventDefault();
    history.pushState(null, '', destination.href);
    const section = destination.hash && document.getElementById(decodeURIComponent(destination.hash.slice(1)));
    if (section) section.scrollIntoView({ block: 'start' });
    else window.scrollTo({ top: 0 });
    return;
  }
  state = advance(state, Date.now()); save();
  if (!saving) {
    event.preventDefault();
    window.open(destination.href, '_blank', 'noopener');
    announce('Link opened in a new tab. Local saving is unavailable; return to this timer tab to continue.');
  }
});
window.addEventListener('pagehide', () => { state = advance(state, Date.now()); save(); clearInterval(interval); });
window.addEventListener('pageshow', () => { render(); schedule(); });
document.addEventListener('visibilitychange', () => { render(); schedule(); });
validate(); save(); render(); schedule();
