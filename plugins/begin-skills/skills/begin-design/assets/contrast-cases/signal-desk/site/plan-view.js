(function () {
  'use strict';
  const S = window.SignalDesk;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function row(record, editable, selected, issue) {
    const r = record;
    const title = `<span class="episode-title">${esc(r.title)}${editable ? '<span class="open-arrow" aria-hidden="true">↗</span>' : ''}</span>`;
    const identity = editable ? `<button type="button" class="episode-open" data-open="${r.id}" aria-controls="episode-editor"${selected ? ' aria-current="true"' : ''} aria-label="Edit ${esc(r.title)}">${title}</button>` : title;
    return `<tr data-id="${r.id}" class="${selected ? 'selected' : ''} ${issue ? 'issue-row' : ''}"><td class="episode-cell">${identity}<span class="episode-meta"><span>${r.id}</span><span>${esc(r.strand)}</span></span></td><td class="editor-cell">${editable ? '' : `<span class="editor-initial" aria-hidden="true">${r.editor[0]}</span>`}${r.editor}</td><td class="day-cell">${S.days[r.day].short} ${S.days[r.day].date}</td><td class="slot-cell">${S.slots[r.slot]}</td><td class="minutes-cell">${r.minutes}<small>min</small></td></tr>`;
  }
  function renderLoads(element, loads) {
    element.innerHTML = loads.map(({day, editors}) => `<div class="day-load"><p class="day-label"><strong>${S.days[day].short}</strong><span>${S.days[day].date}</span></p>${editors.map(({editor, minutes}) => `<div class="load-person${minutes > S.capacity ? ' over' : ''}"><span>${editor}</span><strong>${minutes}<span class="sr-only"> minutes${minutes > S.capacity ? `, ${minutes - S.capacity} over daily capacity` : ''}</span></strong><div class="load-track" aria-hidden="true"><span style="width:${Math.min(100, minutes / S.capacity * 100)}%"></span></div></div>`).join('')}</div>`).join('');
  }
  window.SignalView = {esc, row, renderLoads};
})();
