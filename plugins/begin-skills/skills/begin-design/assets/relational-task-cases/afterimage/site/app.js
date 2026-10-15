(function () {
  'use strict';
  const core = window.Afterimage;
  const form = document.getElementById('cue-form');
  if (!form) return;
  let state = core.newState();
  let storage;
  try { storage = window.localStorage; } catch (_) { storage = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); }, removeItem() { throw new Error('denied'); } }; }
  const byId = id => document.getElementById(id);
  const status = byId('work-status');
  const storageStatus = byId('storage-status');
  const result = byId('result-body');
  const errorBox = byId('error-summary');
  const fields = ['title', 'category', 'start', 'end', 'note'];
  function read() {
    return { projectName: byId('project-name').value, projectNote: byId('project-note').value, cues: [1, 2, 3].map(i => Object.fromEntries(fields.map(name => [name, byId('cue-' + i + '-' + name).value]))) };
  }
  function write() {
    byId('project-name').value = state.input.projectName;
    byId('project-note').value = state.input.projectNote;
    state.input.cues.forEach((cue, i) => fields.forEach(name => { byId('cue-' + (i + 1) + '-' + name).value = cue[name]; }));
  }
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function updateDurations() {
    state.input.cues.forEach((cue, i) => {
      const start = core.seconds(cue.start); const end = core.seconds(cue.end);
      byId('cue-' + (i + 1) + '-duration').textContent = start !== null && end !== null && end > start ? (end - start) + ' sec' : '— sec';
    });
  }
  function renderErrors() {
    form.querySelectorAll('[aria-invalid]').forEach(field => { field.removeAttribute('aria-invalid'); });
    form.querySelectorAll('.field-error').forEach(node => { node.textContent = ''; });
    errorBox.replaceChildren();
    errorBox.hidden = !state.errors.length;
    if (!state.errors.length) return;
    errorBox.append(element('h3', '', 'The sheet needs a correction'));
    const list = element('ul');
    state.errors.forEach(error => {
      const li = element('li'); const link = element('a', '', error.message); link.href = '#' + error.field;
      link.addEventListener('click', event => { event.preventDefault(); byId(error.field).focus(); });
      li.append(link); list.append(li);
      const input = byId(error.field); if (input) input.setAttribute('aria-invalid', 'true');
      const note = byId(error.field + '-error'); if (note) note.textContent = error.message;
    });
    errorBox.append(list);
  }
  function renderResult() {
    result.replaceChildren();
    const current = core.canUsePrepared(state);
    byId('download').disabled = !current;
    byId('keep').disabled = !current;
    byId('prepared-panel').classList.toggle('is-stale', Boolean(state.prepared && !current));
    if (!state.prepared) {
      byId('result-state').textContent = 'Waiting for preparation';
      result.append(element('p', 'empty-result', 'Your three cues will become a readable sheet here. Enter the scene details, or load the example, then choose Prepare cue sheet.'));
      byId('exact-text').textContent = '';
      byId('exact-disclosure').hidden = true;
      return;
    }
    byId('result-state').textContent = current ? 'Prepared from current inputs' : 'Earlier preparation · inputs changed';
    const p = state.prepared;
    result.append(element('h3', 'sheet-project', p.projectName));
    const projectNote = element('p', 'sheet-note', p.projectNote || 'No project note supplied.');
    projectNote.style.whiteSpace = 'pre-wrap'; result.append(projectNote);
    if (!current) result.append(element('p', 'stale-note', 'This earlier sheet remains for reference. Prepare valid current inputs to enable keeping and downloading.'));
    const summary = element('dl', 'totals');
    [['Occupied time', p.occupied], ['Project span', p.span], ['Gaps between cues', p.gaps]].forEach(([label, value]) => {
      const pair = element('div'); pair.append(element('dt', '', label)); const quantity = element('dd'); quantity.append(element('strong', '', String(value)), element('span', '', 'seconds')); pair.append(quantity); summary.append(pair);
    });
    result.append(summary);
    const timeline = element('div', 'result-score'); timeline.setAttribute('aria-label', 'Cue timing sequence');
    p.cues.forEach((cue, i) => {
      if (i > 0 && cue.startSeconds > p.cues[i - 1].endSeconds) { const gap = element('div', 'score-gap', (cue.startSeconds - p.cues[i - 1].endSeconds) + ' s gap'); gap.style.flexGrow = String(cue.startSeconds - p.cues[i - 1].endSeconds); timeline.append(gap); }
      const segment = element('div', 'score-segment ' + cue.category.toLowerCase(), cue.id + ' · ' + cue.duration + ' s'); segment.style.flexGrow = String(cue.duration); timeline.append(segment);
    });
    result.append(timeline);
    p.cues.forEach(cue => {
      const article = element('article', 'prepared-cue');
      article.append(element('p', 'cue-code', cue.id));
      const words = element('div', 'prepared-words'); words.append(element('p', 'category-label ' + cue.category.toLowerCase(), cue.category), element('h4', '', cue.title));
      const note = element('p', 'cue-note', cue.note || 'No cue note supplied.'); note.style.whiteSpace = 'pre-wrap'; words.append(note); article.append(words);
      const timing = element('dl', 'cue-timing');
      [['Start', cue.start], ['End', cue.end], ['Duration', cue.duration + ' seconds']].forEach(([label, value]) => { const pair = element('div'); pair.append(element('dt', '', label), element('dd', '', value)); timing.append(pair); });
      article.append(timing); result.append(article);
    });
    byId('exact-text').textContent = p.text;
    byId('exact-disclosure').hidden = false;
  }
  function render() { updateDurations(); renderErrors(); renderResult(); }
  form.addEventListener('input', () => { state = core.edit(state, read()); status.textContent = state.prepared ? 'Inputs changed. The earlier sheet is stale; prepare it again before keeping or downloading.' : 'Inputs changed. Prepare the cue sheet when all three rows are ready.'; render(); });
  form.addEventListener('submit', event => {
    event.preventDefault(); state = core.prepare({ ...state, input: read() }); render();
    if (state.errors.length) { status.textContent = 'Preparation blocked. Your inputs and any earlier sheet have been retained.'; errorBox.focus(); }
    else { status.textContent = 'Cue sheet prepared. All three cues, full notes and totals are ready to keep or download.'; byId('prepared-panel').scrollIntoView({ behavior: 'auto', block: 'start' }); }
  });
  byId('load-example').addEventListener('click', () => { state = core.edit(state, core.EXAMPLE); write(); render(); status.textContent = 'Loaded First light. This replaces current inputs. Choose Prepare cue sheet to calculate its three cues.'; });
  byId('download').addEventListener('click', () => {
    if (!core.canUsePrepared(state)) return;
    const file = new Blob([state.prepared.text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(file); const link = document.createElement('a'); link.href = url; link.download = 'afterimage-cue-sheet.txt'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); status.textContent = 'Exact text download requested. Check your browser’s download list for afterimage-cue-sheet.txt.';
  });
  byId('keep').addEventListener('click', () => { const kept = core.keep(state, storage); storageStatus.textContent = kept.message; });
  byId('recover').addEventListener('click', () => { const recovered = core.recover(state, storage); storageStatus.textContent = recovered.message; if (recovered.ok) { state = recovered.state; write(); render(); status.textContent = 'Kept work recovered. Current inputs and output now match the kept copy.'; } });
  byId('reset').addEventListener('click', () => { state = core.newState(); write(); render(); status.textContent = 'Current inputs and output reset. The kept browser copy has been preserved.'; });
  byId('forget').addEventListener('click', () => { storageStatus.textContent = core.forget(storage).message; });
  const initial = core.recover(state, storage);
  if (initial.ok) { state = initial.state; status.textContent = 'The kept inputs and prepared sheet were restored on reload.'; }
  storageStatus.textContent = initial.message;
  write(); render();
}());
