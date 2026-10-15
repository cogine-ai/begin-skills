(function () {
  'use strict';
  const D = window.OffsetData, C = window.OffsetCore;
  let storage;
  try { storage = window.localStorage; } catch (_) { storage = { getItem() { throw new Error(); }, setItem() { throw new Error(); }, removeItem() { throw new Error(); } }; }
  const loaded = C.read(storage);
  let state = loaded.state, selected = C.byId(new URLSearchParams(location.search).get('project')) || D.projects[0], prepared = '', draftDirty = false;
  const $ = selector => document.querySelector(selector);
  const all = selector => Array.from(document.querySelectorAll(selector));
  function say(message) { const el = $('#status'); if (el) el.textContent = message; }
  function counts() { all('[data-count]').forEach(el => { el.textContent = String(state.ids.length); }); }
  function save(message) {
    const ok = C.write(storage, state);
    say(ok ? message : 'Browser storage is unavailable. Your current work stays on this page; export it before leaving.');
    counts(); return ok;
  }
  function invalidate() {
    if (prepared) {
      prepared = '';
      $('#prepared-text').textContent = '';
      $('#prepared-result').hidden = true;
      $('#result-note').textContent = 'The draft changed. Prepare it again to update the result.';
    }
  }
  function download(text, name) {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function syncSaveButton() {
    const b = $('#save-study'); if (!b) return;
    const chosen = state.ids.includes(selected.id);
    b.textContent = chosen ? `Remove ${selected.title} from shortlist` : `Add ${selected.title} to shortlist`;
    b.setAttribute('aria-pressed', String(chosen));
    b.classList.toggle('is-saved', chosen);
    $('#jump-save').textContent = chosen ? `${selected.title} saved ↓` : `Save ${selected.title} ↓`;
  }
  function renderShortlist() {
    const list = $('#shortlist-items'); if (!list) return;
    list.replaceChildren();
    state.ids.forEach(id => {
      const p = C.byId(id), li = document.createElement('li');
      const img = document.createElement('img'); img.src = `art/${p.id}.svg`; img.alt = ''; img.width = 76; img.height = 64;
      const link = document.createElement('a'); link.href = `demo.html?project=${p.id}`; link.textContent = p.title;
      const info = document.createElement('span'); info.className = 'shortlist-info'; info.appendChild(link);
      const scope = document.createElement('small'); scope.textContent = p.scope; info.appendChild(scope);
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'remove'; remove.textContent = 'Remove'; remove.setAttribute('aria-label', `Remove ${p.title} from shortlist`);
      remove.addEventListener('click', () => { state = C.toggle(state, id); invalidate(); renderShortlist(); syncSaveButton(); save(`${p.title} removed. ${state.ids.length} ${state.ids.length === 1 ? 'study' : 'studies'} saved locally.`); $('#shortlist-title').focus(); });
      li.append(img, info, remove); list.appendChild(li);
    });
    $('#shortlist-empty').hidden = state.ids.length > 0;
    $('#export-shortlist').disabled = !state.ids.length;
    counts();
  }
  function renderStudy(updateUrl) {
    const p = selected;
    document.title = `${p.title} — Offset Studio`;
    $('#study-title').textContent = p.title;
    $('#study-number').textContent = p.number;
    $('#study-scope').textContent = p.scope;
    $('#study-image').src = `art/${p.id}.svg`; $('#study-image').alt = p.alt; $('#study-image').width = p.width;
    $('#study-stage').style.backgroundColor = p.color;
    $('#study-question').textContent = p.question; $('#study-response').textContent = p.response; $('#study-detail').textContent = p.detail; $('#study-note').textContent = p.note;
    $('#offsite-applications').hidden = p.id !== 'offsite';
    $('#project-select').value = p.id;
    all('[data-study]').forEach(a => { if (a.dataset.study === p.id) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
    const i = D.projects.indexOf(p), next = D.projects[(i+1)%D.projects.length];
    $('#next-study').href = `demo.html?project=${next.id}`; $('#next-study').textContent = `Next: ${next.title} ↗`;
    syncSaveButton();
    if (updateUrl) { const url = new URL(location.href); url.searchParams.set('project', p.id); history.replaceState({}, '', url); say(`${p.title} selected. ${p.scope}.`); }
  }
  function readFields() {
    return { name: $('#draft-name').value, email: $('#draft-email').value, brief: $('#draft-brief').value };
  }
  function clearErrors() {
    all('[data-error]').forEach(el => { el.textContent = ''; });
    all('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
    $('#error-summary').hidden = true;
  }
  function reset() {
    state = C.empty(); prepared = ''; draftDirty = false;
    const ok = C.clear(storage);
    if ($('#enquiry-form')) {
      $('#enquiry-form').reset(); $('#prepared-result').hidden = true; $('#prepared-text').textContent = ''; $('#result-note').textContent = 'Prepare a draft to see the exact text here.';
      $('#draft-save-state').textContent = 'No draft saved';
      clearErrors(); renderShortlist(); syncSaveButton();
    }
    counts();
    say(ok ? 'Local shortlist and saved draft cleared. Your selected study stays open.' : 'This page is cleared, but browser storage could not be changed. Export any work you need before leaving.');
  }
  counts();
  if (!loaded.ok) say('Browser storage is unavailable. Work can continue here; export before leaving.');
  if (loaded.recovered) say('The saved local data could not be read. A fresh shortlist is ready.');
  all('[data-reset]').forEach(b => b.addEventListener('click', reset));

  const filters = $('#work-filters');
  if (filters) {
    filters.hidden = false;
    filters.addEventListener('click', e => {
      const button = e.target.closest('[data-filter]'); if (!button) return;
      const category = button.dataset.filter;
      all('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      let count = 0;
      all('.piece').forEach(piece => { const visible = category === 'All' || piece.dataset.category === category; piece.hidden = !visible; if (visible) count++; });
      $('#work-wall').classList.toggle('filtered', category !== 'All');
      say(`${count} ${count === 1 ? 'study' : 'studies'} shown${category === 'All' ? '' : ` in ${category.toLowerCase()}`}.`);
    });
  }
  if ($('#study-title')) {
    renderStudy(false); renderShortlist();
    let navFrame = false;
    function updateTaskNav() {
      const bounds = $('#shortlist').getBoundingClientRect();
      const inShortlist = bounds.top <= window.innerHeight * .35 && bounds.bottom > 0;
      $('#work-nav').toggleAttribute('aria-current', !inShortlist);
      $('#shortlist-nav').toggleAttribute('aria-current', inShortlist);
      if (inShortlist) $('#shortlist-nav').setAttribute('aria-current', 'location');
      else $('#work-nav').setAttribute('aria-current', 'location');
      navFrame = false;
    }
    window.addEventListener('scroll', () => { if (!navFrame) { navFrame = true; requestAnimationFrame(updateTaskNav); } }, { passive: true });
    window.addEventListener('resize', updateTaskNav);
    requestAnimationFrame(updateTaskNav);
    $('#project-select').addEventListener('change', e => { selected = C.byId(e.target.value) || D.projects[0]; renderStudy(true); });
    $('#save-study').addEventListener('click', () => { const before = state.ids.includes(selected.id); state = C.toggle(state, selected.id); invalidate(); renderShortlist(); syncSaveButton(); save(`${selected.title} ${before ? 'removed from' : 'added to'} your local shortlist. ${state.ids.length} ${state.ids.length === 1 ? 'study' : 'studies'} saved.`); });
    $('#draft-name').value = state.draft.name; $('#draft-email').value = state.draft.email; $('#draft-brief').value = state.draft.brief;
    if (state.draft.name || state.draft.email || state.draft.brief) $('#draft-save-state').textContent = 'Saved draft restored';
    $('#enquiry-form').addEventListener('input', () => { draftDirty = true; clearErrors(); invalidate(); $('#draft-save-state').textContent = 'Unsaved changes'; });
    $('#save-draft').addEventListener('click', () => { state.draft = readFields(); const ok = save('Draft and shortlist saved in this browser. No enquiry has been sent.'); draftDirty = !ok; $('#draft-save-state').textContent = ok ? 'Saved locally' : 'Not saved to browser'; });
    $('#enquiry-form').addEventListener('submit', e => {
      e.preventDefault(); clearErrors();
      const current = { ids: state.ids, draft: readFields() }, result = C.prepare(current);
      if (!result.ok) {
        $('#error-summary').hidden = false; $('#error-summary').textContent = 'Check the marked fields before preparing the draft.';
        Object.entries(result.errors).forEach(([field,message]) => { const hint = $(`[data-error="${field}"]`); if (hint) hint.textContent = message; const input = $(`#draft-${field}`); if (input) input.setAttribute('aria-invalid','true'); });
        if (result.errors.ids) $('#shortlist-title').focus(); else $(`#draft-${Object.keys(result.errors)[0]}`).focus();
        say('The draft needs a correction. Your entries are still here.'); return;
      }
      prepared = result.text; $('#prepared-text').textContent = prepared; $('#prepared-result').hidden = false;
      $('#result-note').textContent = draftDirty ? 'Prepared from your current entries. Use Save draft to keep changes after reload.' : 'Prepared from your current entries. No enquiry has been sent.';
      $('#prepared-title').focus(); say('Enquiry draft prepared locally. Review it, then export if useful.');
    });
    $('#export-shortlist').addEventListener('click', () => { download(C.shortlistText(state), 'offset-shortlist.txt'); say('Shortlist text exported. No enquiry has been sent.'); });
    $('#export-enquiry').addEventListener('click', () => { if (prepared) { download(prepared, 'offset-enquiry.txt'); say('Prepared enquiry text exported. No enquiry has been sent.'); } });
  }
  const fixture = $('#load-fixture');
  if (fixture) fixture.addEventListener('click', () => { state = C.normalize(D.fixture); const ok = save('Practice fixture saved: Offsite, Soft Signals and Mira Lane’s draft. Open the filled task to continue.'); if (ok) $('#fixture-open').hidden = false; });
})();
