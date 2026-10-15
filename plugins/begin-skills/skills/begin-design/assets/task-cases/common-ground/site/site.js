(function () {
  'use strict';
  const form = document.getElementById('plan-form');
  if (!form) return;
  const P = window.CommonGround;
  const get = id => document.getElementById(id);
  const dateField = get('session-date');
  const peopleField = get('people');
  const choiceButtons = [...document.querySelectorAll('[data-workshop]')];
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  let choice = P.initial();
  let saved = null;
  let persistent = false;
  let storage = null;
  let warning = '';
  let feedback = '';
  let errors = {};
  let renderedWorkshop = null;
  try {
    storage = window.localStorage;
    const raw = storage.getItem(P.STORAGE_KEY);
    try {
      saved = P.parseSaved(raw);
      if (saved) {
        choice = P.fromSaved(saved);
        persistent = true;
        feedback = 'Your saved plan has been loaded into the current choice.';
      }
    } catch (_) {
      warning = 'The stored plan could not be read or no longer matches the programme. Starting with Clay basics; you can save a new plan.';
    }
  } catch (_) {
    warning = 'Browser storage is unavailable. A saved plan can be kept in this open tab only and may be lost when you reload.';
  }
  const writeText = (id, value) => { get(id).textContent = value; };
  function showErrors() {
    for (const [name, field] of [['date', dateField], ['people', peopleField]]) {
      const error = get(name + '-error');
      error.textContent = errors[name] || '';
      error.hidden = !errors[name];
      if (errors[name]) field.setAttribute('aria-invalid', 'true');
      else field.removeAttribute('aria-invalid');
    }
  }
  function render() {
    const workshop = P.findWorkshop(choice.workshopId);
    filterButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === choice.filter)));
    choiceButtons.forEach(button => {
      const selected = button.dataset.workshop === choice.workshopId;
      button.hidden = choice.filter !== 'All' && P.findWorkshop(button.dataset.workshop).category !== choice.filter;
      button.setAttribute('aria-pressed', String(selected));
      button.classList.toggle('selected', selected);
      button.querySelector('.selection-label').textContent = selected ? 'Selected ↗' : 'Choose ↗';
    });
    if (renderedWorkshop !== workshop.id) {
      dateField.replaceChildren();
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Choose a date';
      dateField.append(placeholder);
      workshop.dates.forEach(date => {
        const option = document.createElement('option');
        option.value = date.value;
        option.textContent = date.label;
        dateField.append(option);
      });
      renderedWorkshop = workshop.id;
    }
    dateField.value = choice.date;
    // Do not rewrite the number field during typing: invalid raw input stays available to correct.
    writeText('selected-category', workshop.category + ' / ' + workshop.strapline);
    writeText('selected-title', workshop.title);
    writeText('selected-description', workshop.description);
    writeText('selected-duration', workshop.duration);
    writeText('selected-level', workshop.level);
    writeText('selected-fee', P.money(workshop.fee));
    writeText('selected-preparation', workshop.preparation);
    get('selected-art').src = workshop.art;
    get('selected-art').alt = workshop.alt;
    writeText('selected-art-caption', workshop.caption);
    const summary = P.summary(choice);
    Object.entries(summary).forEach(([name, value]) => writeText('summary-' + name, value));
    const state = get('current-state');
    state.textContent = saved ? (P.matches(choice, saved) ? 'Matches saved plan' : 'Unsaved changes') : 'Not saved yet';
    state.dataset.state = saved ? (P.matches(choice, saved) ? 'saved' : 'changed') : 'empty';
    writeText('summary-help', P.quantity(choice.people) === null ? 'Enter 1–4 people to calculate the total.' : !choice.date ? 'Choose a date before saving.' : saved && !P.matches(choice, saved) ? 'This edit has not replaced your saved plan.' : saved ? 'The current choice agrees with the saved receipt below.' : 'Check your choice, then choose Save local plan.');
    get('saved-empty').hidden = Boolean(saved);
    get('saved-content').hidden = !saved;
    if (saved) {
      const savedSummary = P.summary(saved);
      writeText('saved-workshop', savedSummary.workshop);
      writeText('saved-date', savedSummary.date);
      writeText('saved-people', savedSummary.people);
      writeText('saved-total', savedSummary.total);
      writeText('saved-storage-note', persistent ? 'Saved in this browser. Reload to return to this choice.' : 'Kept in this tab only. Reloading may lose this plan.');
    }
    writeText('save-feedback', feedback);
    writeText('storage-warning', warning);
    get('storage-warning').hidden = !warning;
    showErrors();
  }
  function updateFeedbackAfterEdit() {
    feedback = saved && !P.matches(choice, saved) ? 'Your current choice has changed. The saved plan is still shown in its own receipt.' : '';
  }
  choiceButtons.forEach(button => button.addEventListener('click', () => {
    const previous = choice.workshopId;
    choice = P.selectWorkshop(choice, button.dataset.workshop);
    errors = {};
    updateFeedbackAfterEdit();
    render();
    writeText('choice-status', P.findWorkshop(choice.workshopId).title + ' selected.' + (previous !== choice.workshopId ? ' Choose a date for this workshop.' : ''));
  }));
  filterButtons.forEach(button => button.addEventListener('click', () => {
    const previous = choice.workshopId;
    choice = P.filterChoice(choice, button.dataset.filter);
    errors = {};
    updateFeedbackAfterEdit();
    render();
    writeText('choice-status', 'Showing ' + choice.filter.toLowerCase() + ' workshops.' + (previous !== choice.workshopId ? ' ' + P.findWorkshop(choice.workshopId).title + ' is now selected. Choose a date.' : ''));
  }));
  dateField.addEventListener('change', () => {
    choice = { ...choice, date: dateField.value };
    if (errors.date) errors.date = P.validate(choice).date;
    updateFeedbackAfterEdit();
    render();
  });
  peopleField.addEventListener('input', () => {
    choice = { ...choice, people: peopleField.value };
    if (errors.people) errors.people = P.validate(choice).people;
    updateFeedbackAfterEdit();
    render();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    choice = { ...choice, date: dateField.value, people: peopleField.value };
    errors = P.validate(choice);
    if (Object.keys(errors).length) {
      feedback = 'Your plan has not been saved. Correct the highlighted field' + (Object.keys(errors).length > 1 ? 's' : '') + ' and try again.';
      render();
      (errors.date ? dateField : peopleField).focus();
      return;
    }
    saved = P.planFromChoice(choice);
    persistent = false;
    try {
      if (!storage) throw new Error('Storage unavailable');
      storage.setItem(P.STORAGE_KEY, JSON.stringify(saved));
      persistent = true;
      warning = '';
      feedback = 'Your local plan is saved in this browser. The receipt shows your exact choice.';
    } catch (_) {
      warning = 'Browser storage could not save this plan. It is kept in this open tab only; an older saved plan may return after reload.';
      feedback = 'Your plan is kept in this tab only. It has not been saved for reload.';
    }
    render();
  });
  get('restore-saved').addEventListener('click', () => {
    if (!saved) return;
    choice = P.fromSaved(saved);
    peopleField.value = choice.people;
    errors = {};
    feedback = 'Returned to your saved workshop, date and people. The filter is now All.';
    render();
    dateField.focus();
  });
  get('reset-plan').addEventListener('click', () => {
    let removalFailed = false;
    try {
      if (!storage) throw new Error('Storage unavailable');
      storage.removeItem(P.STORAGE_KEY);
    } catch (_) { removalFailed = true; }
    choice = P.initial();
    peopleField.value = choice.people;
    saved = null;
    persistent = false;
    errors = {};
    feedback = 'Choices reset to Clay basics, no date, 1 person and All workshops.';
    warning = removalFailed ? 'The plan is cleared from this view, but browser storage could not be cleared. An older saved plan may return after reload.' : '';
    if (!removalFailed) feedback = 'Saved plan cleared. ' + feedback;
    render();
    dateField.focus();
  });
  peopleField.value = choice.people;
  render();
}());
