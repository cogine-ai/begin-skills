import {WORKS, DAYS, blankPlan, parsePlan, chosenWorks, totalMinutes, exportPlan} from './model.mjs';

const STORAGE_KEY = 'afterimage.visit-plan.v1';
const list = document.querySelector('#plan-list');
const empty = document.querySelector('#empty-plan');
const storageStatus = document.querySelector('#storage-status');
const actionStatus = document.querySelector('#action-status');
const download = document.querySelector('#download-plan');
const clear = document.querySelector('#clear-plan');
const save = document.querySelector('#save-plan');
const text = document.querySelector('#plan-text');
const copyDetails = document.querySelector('#copy-details');
let plan = blankPlan();

function storageMessage(message, problem = false) {
  storageStatus.textContent = message;
  storageStatus.classList.toggle('problem', problem);
}

function savePlan() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
    storageMessage('Saved on this device. Nothing has been sent.');
    return true;
  } catch {
    storageMessage('This plan is ready in this tab, but could not be saved on this device. Download or copy it before leaving.', true);
    return false;
  }
}

try {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw !== null) {
    plan = parsePlan(raw);
    storageMessage('Your saved day and works have been restored on this device.');
  }
} catch {
  storageMessage('Your saved plan could not be read. Start a plan here, then download or copy it before leaving. Saving can be retried below.', true);
}

function makeElement(tag, className, content) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content !== undefined) element.textContent = content;
  return element;
}

function render() {
  const works = chosenWorks(plan);
  document.querySelector('#chosen-day').textContent = DAYS[plan.day];
  document.querySelector('#total-minutes').textContent = String(totalMinutes(plan));
  document.querySelector('#jump-count').textContent = `${works.length} ${works.length === 1 ? 'work' : 'works'}`;
  document.querySelector('#quick-total').textContent = `${totalMinutes(plan)} min`;
  document.querySelector('#plan-quick').setAttribute('aria-label',
    `View my plan: ${works.length} ${works.length === 1 ? 'work' : 'works'}, ${totalMinutes(plan)} min estimated`); 
  document.querySelector('#estimate-note').textContent = `${works.length} of 6 works · Add time to walk, pause and explore.`;
  document.querySelectorAll('input[name=day]').forEach(input => {
    input.disabled = false;
    input.checked = input.value === plan.day;
  });
  document.querySelectorAll('[data-work]').forEach(button => {
    const selected = plan.selected.includes(button.dataset.work);
    const work = WORKS.find(item => item.id === button.dataset.work);
    button.disabled = false;
    button.setAttribute('aria-pressed', String(selected));
    button.setAttribute('aria-label', `${selected ? 'Remove' : 'Add'} ${work.title} ${selected ? 'from' : 'to'} my plan`);
    button.querySelector('.button-label').textContent = selected ? 'Remove from plan' : 'Add to my plan';
    button.querySelector('.symbol').textContent = selected ? '−' : '+';
    document.getElementById(work.id).classList.toggle('selected', selected);
  });
  list.replaceChildren();
  works.forEach(work => {
    const li = makeElement('li');
    const copy = makeElement('div');
    copy.append(makeElement('span', 'name', work.title));
    copy.append(makeElement('span', 'small', work.artist));
    copy.append(makeElement('span', 'small', `${work.place} · ${work.minutes} min`));
    copy.append(makeElement('span', 'small', work.access));
    const remove = makeElement('button', 'remove-work', '×');
    remove.type = 'button';
    remove.setAttribute('aria-label', `Remove ${work.title} from my plan`);
    remove.addEventListener('click', () => {
      const index = works.findIndex(item => item.id === work.id);
      const nextId = works[index + 1]?.id || works[index - 1]?.id;
      toggleWork(work.id);
      const next = nextId ? list.querySelector(`[data-remove="${nextId}"]`) : document.querySelector(`[data-work="${work.id}"]`);
      next?.focus();
    });
    remove.dataset.remove = work.id;
    li.append(copy, remove);
    list.append(li);
  });
  empty.hidden = works.length > 0;
  download.disabled = works.length === 0;
  clear.disabled = works.length === 0 && plan.day === blankPlan().day;
  save.disabled = false;
  text.value = works.length ? exportPlan(plan) : 'Add an installation to prepare your complete plan.';
}

function toggleWork(id) {
  const work = WORKS.find(item => item.id === id);
  if (!work) return;
  const removing = plan.selected.includes(id);
  plan.selected = removing ? plan.selected.filter(item => item !== id) : [...plan.selected, id];
  render();
  savePlan();
  actionStatus.textContent = `${work.title} ${removing ? 'removed' : 'added'}. ${totalMinutes(plan)} min estimated across ${plan.selected.length} ${plan.selected.length === 1 ? 'work' : 'works'}.`;
}

document.querySelectorAll('[data-work]').forEach(button => {
  button.addEventListener('click', () => toggleWork(button.dataset.work));
});
document.querySelectorAll('input[name=day]').forEach(input => {
  input.addEventListener('change', () => {
    if (!Object.hasOwn(DAYS, input.value)) return;
    plan.day = input.value;
    render();
    savePlan();
    actionStatus.textContent = `Your evening is ${DAYS[plan.day]}. Your chosen works are kept.`;
  });
});
save.addEventListener('click', () => {
  const saved = savePlan();
  actionStatus.textContent = saved ? 'Your current day and works are saved on this device.' : 'Saving is unavailable. Download or copy the complete plan below.';
});
clear.addEventListener('click', () => {
  plan = blankPlan();
  render();
  try {
    localStorage.removeItem(STORAGE_KEY);
    storageMessage('Your saved plan has been cleared on this device.');
    actionStatus.textContent = 'Plan cleared. Choose an evening and add works to begin again.';
  } catch {
    storageMessage('This tab is cleared, but the earlier saved plan could not be removed. It may return after reload. Saving a new plan can be retried.', true);
    actionStatus.textContent = 'The plan in this tab is empty. Browser storage could not be cleared.';
  }
});
download.addEventListener('click', () => {
  if (!plan.selected.length) return;
  let url;
  let anchor;
  try {
    const contents = exportPlan(plan);
    const blob = new Blob([contents], {type: 'text/plain;charset=utf-8'});
    url = URL.createObjectURL(blob);
    anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `afterimage-plan-${plan.day}.txt`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    actionStatus.textContent = 'Your plan file is prepared. Check your browser’s downloads for the text copy.';
  } catch {
    if (anchor) anchor.remove();
    if (url) URL.revokeObjectURL(url);
    copyDetails.open = true;
    text.focus();
    text.select();
    actionStatus.textContent = 'The download could not start. Your complete plan is selected below so you can copy it.';
  }
});
render();
