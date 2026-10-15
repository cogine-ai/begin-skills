(function () {
  'use strict';
  const M = window.TableNine;
  const $ = id => document.getElementById(id);
  let session = M.createSession();
  let storage;
  try { storage = window.localStorage; }
  catch (_) { storage = { getItem() { throw new Error('Storage denied'); }, setItem() { throw new Error('Storage denied'); }, removeItem() { throw new Error('Storage denied'); } }; }
  const labels = { north: 'North', south: 'South' };
  function readInputs() {
    const next = M.fixture();
    next.title = $('project-title').value;
    next.note = $('note').value;
    next.guests.forEach((g, i) => { g.table = $(`table-${i + 1}`).value; g.seat = $(`seat-${i + 1}`).value; });
    return next;
  }
  function fillInputs() {
    $('project-title').value = session.current.title;
    $('note').value = session.current.note;
    session.current.guests.forEach((g, i) => { $(`table-${i + 1}`).value = g.table; $(`seat-${i + 1}`).value = g.seat; });
  }
  function tell(message) { $('feedback').textContent = message; }
  function clearErrors() {
    $('errors').replaceChildren(); $('errors').hidden = true;
    document.querySelectorAll('[aria-invalid="true"]').forEach(el => el.removeAttribute('aria-invalid'));
  }
  function showErrors(errors) {
    clearErrors();
    const heading = document.createElement('p'); heading.textContent = 'Check these choices. Your earlier prepared record is still below.';
    const list = document.createElement('ul');
    errors.forEach(error => {
      const li = document.createElement('li'), a = document.createElement('a');
      a.href = `#${error.field}`; a.textContent = error.message;
      a.addEventListener('click', () => { const field = $(error.field); if (field) field.focus(); });
      li.append(a); list.append(li);
      const field = $(error.field); if (field && /^(INPUT|SELECT|TEXTAREA)$/.test(field.tagName)) field.setAttribute('aria-invalid', 'true');
    });
    $('errors').append(heading, list); $('errors').hidden = false; $('errors').focus();
  }
  function renderRoom() {
    const count = M.totals(session.current);
    ['north', 'south'].forEach(table => {
      $(`${table}-total`).textContent = `${count[table]} / 4`;
      $(`${table}-total`).classList.toggle('over', count[table] > 4);
      for (let seat = 1; seat <= 4; seat++) {
        const assigned = session.current.guests.filter(g => g.table === table && g.seat === String(seat));
        const el = $(`${table}-chair-${seat}`);
        el.textContent = assigned.length ? assigned.map(g => g.id).join(' + ') : 'Empty';
        el.classList.toggle('collision', assigned.length > 1);
      }
    });
    const pair = session.current.guests.slice(0, 2);
    $('pair-status').textContent = pair.every(g => g.table && g.table === pair[0].table) ? `Booking pair together at ${labels[pair[0].table]}.` : 'Booking pair needs one shared table.';
  }
  function addText(parent, tag, content, className) {
    const el = document.createElement(tag); el.textContent = content;
    if (className) el.className = className; parent.append(el); return el;
  }
  function renderPrepared() {
    const panel = $('prepared-result');
    $('prepared-content').replaceChildren();
    if (!session.prepared) {
      panel.className = 'prepared empty'; $('result-status').textContent = 'Not prepared';
      addText($('prepared-content'), 'p', 'Prepare the seating record to see every guest, seat and dietary note together.');
      $('exact-text').textContent = ''; $('exact-section').hidden = true;
    } else {
      const isStale = M.stale(session), state = session.prepared.state;
      panel.className = `prepared ${isStale ? 'stale' : 'current'}`;
      $('result-status').textContent = isStale ? 'Earlier record · inputs changed' : 'Prepared · matches current inputs';
      const content = $('prepared-content');
      const title = addText(content, 'h3', '', 'record-title');
      state.title.split(/(Table Nine)/g).forEach(part => {
        if (part === 'Table Nine') addText(title, 'span', part, 'phrase');
        else title.append(document.createTextNode(part));
      });
      addText(content, 'p', '8 guests · 2 tables · 4 seats at each table', 'record-meta');
      const tables = document.createElement('div'); tables.className = 'record-tables';
      ['north', 'south'].forEach(table => {
        const block = document.createElement('section');
        addText(block, 'h4', `${labels[table]} — ${state.guests.filter(g => g.table === table).length} / 4`);
        const list = document.createElement('ol'); list.className = 'record-list';
        state.guests.filter(g => g.table === table).sort((a, b) => Number(a.seat) - Number(b.seat)).forEach(g => {
          const li = document.createElement('li');
          addText(li, 'span', g.seat, 'seat-index');
          const person = document.createElement('div');
          addText(person, 'strong', g.name); addText(person, 'span', `${g.id} · Dietary note: ${g.dietary}`, 'record-diet');
          li.append(person); list.append(li);
        });
        block.append(list); tables.append(block);
      });
      content.append(tables);
      addText(content, 'p', 'Booking pair: G01 Aida Moreno + G02 Noor Rahman · same table', 'record-pair');
      addText(content, 'h4', 'Service note'); addText(content, 'p', state.note, 'record-note');
      addText(content, 'p', 'Local illustrative record. Confirm dietary needs directly; this is not a medical guarantee.', 'small');
      $('exact-text').textContent = session.prepared.output; $('exact-section').hidden = false;
    }
    const enabled = M.ready(session);
    $('download').disabled = !enabled; $('keep').disabled = !enabled;
  }
  function renderStorage() {
    const result = M.inspectStorage(storage);
    const copy = {
      empty: 'Nothing is kept yet. Keeping is optional and stays in this browser.',
      available: 'A kept record is available in this browser. Recover it only if you want to replace the current inputs.',
      corrupt: 'An unreadable kept copy was found. It has not been applied. You can forget it; current work is safe.',
      unavailable: 'Local keeping is unavailable in this browser. You can still prepare and download the record.'
    };
    $('storage-status').textContent = copy[result.status];
    $('recover').disabled = result.status !== 'available';
    $('forget').disabled = !['available', 'corrupt'].includes(result.status);
    $('storage-tools').dataset.storage = result.status;
  }
  function render() { renderRoom(); renderPrepared(); }
  $('seating-form').addEventListener('submit', event => event.preventDefault());
  $('seating-form').addEventListener('input', () => {
    session = M.edit(session, readInputs()); clearErrors(); render();
    tell(session.prepared ? (M.stale(session) ? 'Inputs changed. The earlier prepared record is still visible. Prepare again before downloading or keeping.' : 'Current inputs match the prepared record.') : 'Current inputs updated. Prepare when the seating is ready.');
  });
  $('prepare').addEventListener('click', () => {
    session = M.edit(session, readInputs());
    const result = M.prepare(session);
    if (!result.ok) { render(); showErrors(result.errors); tell('Preparation blocked. Correct the choices listed above.'); return; }
    session = result.session; clearErrors(); render(); tell('All eight guests are seated. The complete record is ready to review, download or keep.');
    $('prepared-result').focus();
  });
  $('download').addEventListener('click', () => {
    session = M.edit(session, readInputs());
    if (!M.ready(session)) { render(); tell('Prepare a valid record from the current inputs before downloading.'); return; }
    const blob = new Blob([session.prepared.output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'table-nine-seating.txt'; document.body.append(a); a.click(); a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    tell('The exact UTF-8 text file was requested for download. Check your browser’s downloads.');
  });
  $('keep').addEventListener('click', () => {
    session = M.edit(session, readInputs()); const result = M.keep(session, storage);
    tell(result.message); render(); renderStorage();
  });
  $('recover').addEventListener('click', () => {
    const result = M.recover(session, storage);
    if (result.ok) { session = result.session; fillInputs(); clearErrors(); render(); }
    tell(result.message); renderStorage();
  });
  $('reset').addEventListener('click', () => {
    session = M.edit(session, M.fixture()); fillInputs(); clearErrors(); render();
    tell('The eight-guest fixture is restored. Your kept copy is unchanged. Review the current inputs before preparing.');
  });
  $('forget').addEventListener('click', () => { const result = M.forget(storage); tell(result.message); renderStorage(); });
  fillInputs(); render(); renderStorage();
}());
