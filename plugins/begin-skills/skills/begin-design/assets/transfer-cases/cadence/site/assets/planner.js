(function () {
  'use strict';
  const Model = window.CadencePlan;
  const form = document.getElementById('planner-form');
  if (!Model || !form) return;
  const byId = id => document.getElementById(id);
  const controls = { goal: byId('goal'), week: byId('week'), duration: byId('duration'), start: byId('start'), days: byId('day-mon') };
  const dayInputs = [...form.querySelectorAll('input[name="days"]')];
  let storage;
  try { storage = window.localStorage; } catch (_) { storage = null; }
  const recovered = Model.readStore(storage);
  let saved = recovered.saved;
  let prepared = saved ? Model.prepare(saved.draft) : null;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function draft() {
    return { goal: controls.goal.value, week: controls.week.value, days: dayInputs.filter(input => input.checked).map(input => Number(input.value)), duration: controls.duration.value, start: controls.start.value };
  }
  function setFields(values) {
    ['goal', 'week', 'duration', 'start'].forEach(key => { controls[key].value = values[key]; });
    dayInputs.forEach(input => { input.checked = values.days.includes(Number(input.value)); });
    byId('goal-count').textContent = `${controls.goal.value.length} / 80`;
  }
  function announce(message, error) {
    byId('app-message').textContent = message;
    byId('app-message').dataset.error = error ? 'true' : 'false';
  }
  function persistDraft() {
    const outcome = Model.writeStore(storage, saved, draft());
    if (!outcome.ok) announce(outcome.error, true);
    return outcome;
  }
  function clearErrors() {
    Object.keys(controls).forEach(key => { controls[key].removeAttribute('aria-invalid'); byId(`${key}-error`).textContent = ''; });
    byId('error-summary').hidden = true;
    byId('error-list').replaceChildren();
  }
  function showErrors(errors) {
    clearErrors();
    const list = byId('error-list');
    Object.entries(errors).forEach(([key, message]) => {
      controls[key].setAttribute('aria-invalid', 'true');
      byId(`${key}-error`).textContent = message;
      const item = element('li');
      const link = element('a', '', message);
      link.href = `#${controls[key].id}`;
      link.addEventListener('click', event => { event.preventDefault(); controls[key].focus(); });
      item.append(link); list.append(item);
    });
    byId('error-summary').hidden = false;
    controls[Object.keys(errors)[0]].focus();
    announce('The fields need a correction. Your input and kept plan are preserved.', true);
  }
  function weekRange(week) {
    const end = Model.addDays(week, 4);
    const startDate = Model.parseDate(week);
    const endDate = Model.parseDate(end);
    if (startDate.getUTCMonth() === endDate.getUTCMonth() && startDate.getUTCFullYear() === endDate.getUTCFullYear()) return `${startDate.getUTCDate()}–${Model.longDate(end)}`;
    return `${Model.longDate(week)} – ${Model.longDate(end)}`;
  }
  function renderWeek(plan) {
    const sheet = element('div', 'week-sheet');
    const top = element('div', 'week-topline');
    top.append(element('p', 'small-label', 'Prepared from your fields'), element('p', 'small-label', `${plan.sessionCount} ${plan.sessionCount === 1 ? 'session' : 'sessions'}`));
    const heading = element('div', 'week-heading');
    const identity = element('div');
    identity.append(element('h3', '', plan.goal), element('p', 'week-range', weekRange(plan.weekBeginning)));
    const total = element('p', 'week-total');
    total.append(element('strong', '', String(plan.totalMinutes)), element('span', '', 'minutes this week'));
    heading.append(identity, total);
    const days = element('ol', 'week-days');
    days.setAttribute('aria-label', `Week beginning ${Model.longDate(plan.weekBeginning)}`);
    Model.DAYS.forEach((name, index) => {
      const date = Model.addDays(plan.weekBeginning, index);
      const day = element('li', 'day');
      const dayHead = element('div', 'day-head');
      const dayNumber = element('time', 'day-number', String(Model.parseDate(date).getUTCDate()));
      dayNumber.dateTime = date;
      dayNumber.setAttribute('aria-label', Model.longDate(date));
      dayHead.append(element('span', 'day-name', name), dayNumber);
      day.append(dayHead);
      const sessionIndex = plan.sessions.findIndex(session => session.date === date);
      const session = plan.sessions[sessionIndex];
      if (session) {
        const block = element('div', 'session');
        block.append(element('p', 'session-time', `${session.startTime}–${session.endTime}`), element('p', 'session-goal', plan.goal), element('p', 'session-duration', `${session.durationMinutes} minutes · session ${String(sessionIndex + 1).padStart(2, '0')}`));
        if (session.endDate !== session.date) block.append(element('span', 'overnight', `Ends ${Model.longDate(session.endDate)}`));
        day.append(block);
      } else {
        const open = element('p', 'day-empty', 'An open day');
        open.append(element('span', '', 'No study session'));
        day.append(open);
      }
      days.append(day);
    });
    const foot = element('div', 'week-foot');
    foot.append(element('span', 'week-equation', `${plan.sessionCount} ${plan.sessionCount === 1 ? 'session' : 'sessions'} × ${plan.durationMinutes} minutes = ${plan.totalMinutes} minutes`), element('span', '', 'All times are your chosen local time'));
    sheet.append(top, heading, days, foot);
    return sheet;
  }
  function renderPrepared() {
    const isFresh = Model.fresh(prepared, draft());
    const hasPlan = Boolean(prepared && prepared.ok);
    byId('plan-output').replaceChildren(...(hasPlan ? [renderWeek(prepared.plan)] : []));
    byId('empty-result').hidden = hasPlan;
    byId('result-warning').hidden = !hasPlan || isFresh;
    byId('result-state').dataset.state = hasPlan ? isFresh ? 'fresh' : 'stale' : 'empty';
    byId('result-state').textContent = hasPlan ? isFresh ? 'Ready to keep or export' : 'Inputs changed' : 'Not built yet';
    ['keep-plan', 'export-text', 'export-json'].forEach(id => { byId(id).disabled = !isFresh; });
    byId('keep-help').textContent = !hasPlan ? 'Build the current fields first. Keeping stores one plan in this browser.' : !isFresh ? 'Rebuild the changed fields. Your earlier kept plan stays available below.' : saved ? 'Keeping replaces this browser’s previous kept plan. Export takes this prepared result.' : 'Keeping stores this plan in this browser. Export takes the prepared result without needing to keep it.';
  }
  function renderSaved() {
    const box = byId('saved-details');
    box.replaceChildren();
    if (saved) {
      const plan = saved.plan;
      box.append(element('h3', '', plan.goal), element('p', '', `Week beginning ${Model.longDate(plan.weekBeginning)}`), element('p', '', `${plan.sessionCount} ${plan.sessionCount === 1 ? 'session' : 'sessions'} · ${plan.durationMinutes} minutes each · ${plan.totalMinutes} minutes total`));
      const range = `${plan.startTime}–${plan.sessions[0].endTime}`;
      box.append(element('p', '', `${plan.weekdays.join(', ')} · ${range}${plan.sessions[0].endDate !== plan.sessions[0].date ? ' (ends next day)' : ''}`));
    } else box.append(element('p', 'saved-empty', 'Nothing kept yet. Build a week, then choose Keep plan.'));
    byId('return-saved').disabled = !saved;
    byId('forget-saved').disabled = !saved;
  }
  setFields(recovered.draft);
  renderPrepared(); renderSaved();
  if (!recovered.ok) announce(recovered.error, true);
  else if (recovered.recovered && saved) announce(Model.fresh(prepared, draft()) ? 'Your kept plan and fields have returned.' : 'Your unfinished fields have returned. The earlier kept plan is available below. Rebuild or return to it.', false);
  else if (recovered.recovered) announce('Your unfinished fields have returned. Build them to prepare a week.', false);

  form.addEventListener('input', () => {
    const wasFresh = byId('result-state').dataset.state === 'fresh';
    byId('goal-count').textContent = `${controls.goal.value.length} / 80`;
    renderPrepared();
    if (wasFresh && !Model.fresh(prepared, draft())) announce('Inputs changed. Rebuild to use these fields; your kept plan is unchanged.', false);
    const validation = Model.errors(draft());
    Object.keys(controls).forEach(key => { if (!validation[key]) { controls[key].removeAttribute('aria-invalid'); byId(`${key}-error`).textContent = ''; } });
    if (!Object.keys(validation).length) byId('error-summary').hidden = true;
    persistDraft();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const outcome = Model.prepare(draft());
    if (!outcome.ok) { renderPrepared(); showErrors(outcome.errors); return; }
    clearErrors(); prepared = outcome;
    renderPrepared();
    const stored = persistDraft();
    if (stored.ok) announce(`Prepared ${outcome.plan.sessionCount} ${outcome.plan.sessionCount === 1 ? 'session' : 'sessions'} and ${outcome.plan.totalMinutes} minutes for ${outcome.plan.goal}. Keep it or take a copy.`, false);
    byId('prepared-heading').focus();
  });
  byId('keep-plan').addEventListener('click', () => {
    const outcome = Model.keep(prepared, draft());
    if (!outcome.ok) { announce(outcome.error, true); return; }
    const stored = Model.writeStore(storage, outcome.saved, draft());
    if (!stored.ok) { announce(stored.error, true); return; }
    saved = outcome.saved; renderSaved(); renderPrepared();
    announce(`Kept ${saved.plan.goal} with ${saved.plan.sessionCount} ${saved.plan.sessionCount === 1 ? 'session' : 'sessions'} and ${saved.plan.totalMinutes} minutes in this browser. Reload or return to it here.`, false);
  });
  function download(format) {
    const outcome = Model.exportPlan(prepared, draft(), format);
    if (!outcome.ok) { announce(outcome.error, true); return; }
    const url = URL.createObjectURL(new Blob([outcome.content], { type: `${outcome.mime};charset=utf-8` }));
    const link = element('a');
    link.href = url; link.download = `cadence-${prepared.plan.weekBeginning}.${outcome.extension}`;
    document.body.append(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    announce(`Exported the current prepared plan as ${format === 'text' ? 'text' : 'JSON'}: ${prepared.plan.goal}, ${prepared.plan.totalMinutes} minutes.`, false);
  }
  byId('export-text').addEventListener('click', () => download('text'));
  byId('export-json').addEventListener('click', () => download('json'));
  byId('return-saved').addEventListener('click', () => {
    if (!saved) return;
    setFields(saved.draft); prepared = Model.prepare(saved.draft); clearErrors(); renderPrepared();
    const stored = persistDraft();
    if (stored.ok) announce(`Returned to the kept plan: ${saved.plan.goal}, ${saved.plan.totalMinutes} minutes. Fields and prepared week match.`, false);
    controls.goal.focus();
  });
  byId('reset-draft').addEventListener('click', () => {
    setFields(Model.fixture()); prepared = null; clearErrors(); renderPrepared();
    const stored = persistDraft();
    if (stored.ok) announce('The sample fields are back and the prepared result is cleared. Your kept plan remains available.', false);
    controls.goal.focus();
  });
  byId('forget-saved').addEventListener('click', () => {
    if (!saved) return;
    const stored = Model.writeStore(storage, null, draft());
    if (!stored.ok) { announce('The browser could not remove the kept plan. Your stored plan is still available.', true); return; }
    saved = null; renderSaved(); renderPrepared();
    announce('Forgot the kept plan in this browser. Your current fields and prepared week remain.', false);
    byId('reset-draft').focus();
  });
}());
