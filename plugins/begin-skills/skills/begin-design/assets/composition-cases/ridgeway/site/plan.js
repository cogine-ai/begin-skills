(function () {
  'use strict';
  const core = window.RidgewayPlan;
  const form = document.getElementById('plan-form');
  if (!form || !core) return;
  const byId = id => document.getElementById(id);
  let revision = 0, prepared = null, saved = null;
  function readInput() {
    return { walkId: form.elements.walkId.value, walkers: form.elements.walkers.value, pace: form.elements.pace.value, intendedDate: form.elements.intendedDate.value };
  }
  function setInput(input) {
    form.elements.walkId.value = input.walkId;
    form.elements.walkers.value = input.walkers;
    form.elements.pace.value = input.pace;
    form.elements.intendedDate.value = input.intendedDate;
  }
  function feedback(message) { byId('action-status').textContent = message; }
  function storageWarning(message) {
    byId('storage-warning').hidden = !message;
    byId('storage-warning').textContent = message;
  }
  function setErrors(errors) {
    ['walkId', 'walkers', 'pace', 'intendedDate'].forEach(name => {
      const field = name === 'walkId' ? byId('walk-choices') : form.elements[name];
      const message = byId(name + '-error');
      message.textContent = errors[name] || '';
      message.hidden = !errors[name];
      if (name !== 'walkId') field.setAttribute('aria-invalid', String(Boolean(errors[name])));
    });
  }
  function renderCurrent() {
    const input = readInput(), result = core.createPlan(input);
    document.querySelectorAll('.walk-choice').forEach(label => label.classList.toggle('selected', label.querySelector('input').checked));
    const walk = core.WALKS.find(item => item.id === input.walkId);
    byId('current-walk').textContent = walk ? walk.name : 'Choose a walk';
    byId('current-distance').textContent = walk ? walk.distanceKm + ' km' : '—';
    byId('current-time').textContent = result.ok ? result.plan.durationLabel : 'Check your details';
    byId('current-group').textContent = !result.errors?.walkers ? Number(input.walkers) + (Number(input.walkers) === 1 ? ' walker' : ' walkers') : '1–8 walkers';
    byId('current-basis').textContent = result.ok ? result.plan.baseDurationMinutes + ' min + ' + result.plan.addedMinutes + ' min for ' + result.plan.paceName.toLowerCase() + ' pace' : 'Complete the fields above to calculate your plan.';
    byId('current-date').textContent = result.ok ? 'Intended date: ' + result.plan.dateLabel : '';
    renderPrepared();
  }
  function renderPrepared() {
    const current = Boolean(prepared && prepared.revision === revision);
    byId('prepared-panel').classList.toggle('is-empty', !prepared);
    byId('prepared-empty').hidden = Boolean(prepared);
    byId('prepared-content').hidden = !prepared;
    byId('prepared-state').textContent = prepared ? (current ? 'Current' : 'Out of date') : 'Not prepared';
    byId('prepared-state').dataset.state = prepared ? (current ? 'current' : 'stale') : 'empty';
    byId('save-plan').disabled = !current;
    byId('download-plan').disabled = !current;
    if (prepared) {
      byId('prepared-name').textContent = prepared.plan.walkName;
      byId('prepared-text').textContent = core.planText(prepared.plan);
      byId('prepared-help').textContent = current ? 'This plan matches the fields above. Save it here or download a text copy.' : 'Your details changed. Prepare again before saving or downloading this plan.';
    }
  }
  function renderSaved() {
    byId('saved-empty').hidden = Boolean(saved);
    byId('saved-content').hidden = !saved;
    if (saved) {
      byId('saved-name').textContent = saved.plan.walkName;
      byId('saved-details').textContent = saved.plan.distanceKm + ' km · ' + saved.plan.durationLabel + ' · ' + saved.plan.walkers + (saved.plan.walkers === 1 ? ' walker' : ' walkers');
      byId('saved-date').textContent = saved.plan.paceName + ' pace · Intended date: ' + saved.plan.dateLabel;
    }
  }
  function prepare(event) {
    event.preventDefault();
    const result = core.createPlan(readInput());
    setErrors(result.ok ? {} : result.errors);
    if (!result.ok) {
      feedback('Check the marked fields. Your previous plan has not changed.');
      const name = Object.keys(result.errors)[0];
      (name === 'walkId' ? form.querySelector('input[name="walkId"]') : form.elements[name]).focus();
      return;
    }
    prepared = { plan: result.plan, inputs: result.inputs, revision };
    renderPrepared();
    feedback('Your ' + result.plan.walkName + ' plan is prepared. It has not been saved yet.');
    byId('prepared-title').focus({ preventScroll: true });
    byId('prepared-panel').scrollIntoView({ block: 'nearest', behavior: 'auto' });
  }
  form.addEventListener('submit', prepare);
  form.addEventListener('input', function () {
    revision += 1;
    setErrors({});
    renderCurrent();
    if (prepared) feedback('Your details changed. Prepare again to update the plan.');
    else feedback('');
  });
  byId('save-plan').addEventListener('click', function () {
    if (!prepared || prepared.revision !== revision) return;
    const result = core.makeSaved(prepared.inputs);
    try {
      window.localStorage.setItem(core.STORAGE_KEY, JSON.stringify(result.record));
      saved = result.record;
      storageWarning('');
      renderSaved();
      feedback('Your ' + saved.plan.walkName + ' plan is saved in this browser.');
    } catch (_) {
      storageWarning('Saving is unavailable in this browser. You can still prepare a plan and download a text copy.');
      feedback('The plan could not be saved. Your prepared plan is still available below.');
    }
  });
  byId('download-plan').addEventListener('click', function () {
    if (!prepared || prepared.revision !== revision) return;
    const blob = new Blob([core.planText(prepared.plan) + '\n'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url;
    link.download = 'ridgeway-' + prepared.plan.walkId + '-plan.txt';
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    feedback('Your text download is ready. This does not book a walk or send an enquiry.');
  });
  byId('restore-saved').addEventListener('click', function () {
    if (!saved) return;
    revision += 1;
    setInput(saved.inputs);
    prepared = { plan: saved.plan, inputs: saved.inputs, revision };
    setErrors({}); renderCurrent();
    feedback('The saved ' + saved.plan.walkName + ' plan is current again.');
    byId('prepared-title').focus({ preventScroll: true });
    byId('prepared-panel').scrollIntoView({ block: 'nearest', behavior: 'auto' });
  });
  byId('reset-plan').addEventListener('click', function () {
    try { window.localStorage.removeItem(core.STORAGE_KEY); storageWarning(''); }
    catch (_) { storageWarning('The browser could not clear its saved copy. The fields have been reset; the old saved plan may return after reload.'); }
    revision += 1; prepared = null; saved = null;
    setInput(core.DEFAULT_INPUT); setErrors({}); renderCurrent(); renderSaved();
    feedback('The plan is cleared. Start with Pinefold Loop, 2 walkers and Steady pace.');
    form.querySelector('input[name="walkId"]').focus({ preventScroll: true });
    byId('choose-title').scrollIntoView({ block: 'nearest', behavior: 'auto' });
  });
  setInput(core.DEFAULT_INPUT);
  try {
    const raw = window.localStorage.getItem(core.STORAGE_KEY);
    if (raw) {
      saved = core.parseSaved(raw);
      if (!saved) storageWarning('The saved copy is not a valid Ridgeway plan. It has been left untouched. Make a new plan, or use Clear plan and start again.');
    }
  } catch (_) { storageWarning('Browser storage is unavailable. You can still prepare a plan and download a text copy.'); }
  const requested = new URLSearchParams(window.location.search).get('walk');
  if (core.WALKS.some(walk => walk.id === requested)) {
    setInput({ ...core.DEFAULT_INPUT, walkId: requested });
    feedback('Start a new ' + core.WALKS.find(walk => walk.id === requested).name + ' plan. Any saved plan is kept below.');
  } else if (saved) {
    setInput(saved.inputs); prepared = { plan: saved.plan, inputs: saved.inputs, revision };
    feedback('Your saved ' + saved.plan.walkName + ' plan has been restored.');
  }
  renderCurrent(); renderSaved();
})();
