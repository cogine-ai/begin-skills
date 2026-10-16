import {
  PRODUCTS, MAX_STEPS, STORAGE_KEY, DRAFT_KEY, productById, money, quantity,
  parseQuantity, totals, serializeList, parseSavedList, requestHtml,
} from './model.mjs';

const byId = id => document.getElementById(id);
const cards = new Map(PRODUCTS.map(product => [
  product.id, document.querySelector(`[data-product="${product.id}"]`),
]));
const message = byId('app-message');
const error = byId('app-error');
const saveState = byId('save-state');
const itemsNode = byId('request-items');
let items = {};
let checkpoint = {};
let checkpointAvailable = false;
let lastEdited = null;
let protectedCurrent = true;
let allowNavigation = false;

function notify(text) {
  message.textContent = text;
  error.hidden = true;
  error.textContent = '';
}

function fail(text, focus = true) {
  error.textContent = text;
  error.hidden = false;
  if (focus) error.focus();
}

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function button(text, label, handler, className) {
  const element = node('button', className, text);
  element.type = 'button';
  element.setAttribute('aria-label', label);
  element.addEventListener('click', handler);
  return element;
}

function sameItems(left, right) {
  return PRODUCTS.every(product => left[product.id] === right[product.id]);
}

function updateNavigation() {
  const result = totals(items);
  byId('mobile-count').textContent = `${result.lines.length} ${result.lines.length === 1 ? 'product' : 'products'}`;
  byId('mobile-total').textContent = money(result.totalPence);
  byId('draft-state').textContent = !result.lines.length && protectedCurrent
    ? 'Choose a refill to begin'
    : protectedCurrent ? 'Working list kept locally' : 'Not kept · keep this page open';
  document.querySelector('.mobile-review').classList.toggle('unprotected', !protectedCurrent);
  const returnLink = byId('return-to-product');
  returnLink.href = lastEdited ? `#${lastEdited}` : '#cupboard';
  returnLink.textContent = lastEdited ? `Back to ${productById(lastEdited).name} ↑` : 'Back to the cupboard ↑';
}

function rememberProduct(id) {
  lastEdited = id;
  updateNavigation();
}

function keepWorkingDraft() {
  const payload = serializeList(items, new Date(), lastEdited);
  try {
    localStorage.setItem(DRAFT_KEY, payload);
    if (localStorage.getItem(DRAFT_KEY) !== payload) throw new Error('Draft read-back did not match');
    protectedCurrent = true;
    saveState.textContent = checkpointAvailable && sameItems(items, checkpoint)
      ? 'Working list kept in this browser. It matches your saved recovery copy.'
      : 'Working changes kept in this browser. Save list keeps a separate recovery copy.';
  } catch {
    protectedCurrent = false;
    saveState.textContent = 'Current changes could not be kept in browser storage. Keep this page open.';
    fail('The working draft could not be kept. Your current list is still on this page. Keep working, retry Save list, or download the request before leaving.', false);
  }
  updateNavigation();
}

function validateCard(product, showError = false) {
  const card = cards.get(product.id);
  const input = card.querySelector('input');
  const fieldError = byId(`error-${product.id}`);
  try {
    const steps = parseQuantity(product, input.value);
    input.removeAttribute('aria-invalid');
    fieldError.hidden = true;
    fieldError.textContent = '';
    card.querySelector('[data-line-price]').textContent = money(product.pence * steps);
    card.querySelector('[data-change="-1"]').disabled = steps <= 1;
    card.querySelector('[data-change="1"]').disabled = steps >= MAX_STEPS;
    return steps;
  } catch (cause) {
    input.setAttribute('aria-invalid', 'true');
    card.querySelector('[data-line-price]').textContent = '—';
    card.querySelectorAll('[data-change]').forEach(control => { control.disabled = false; });
    if (showError) {
      fieldError.textContent = cause.message + (Object.hasOwn(items, product.id)
        ? ' Your list keeps its previous valid quantity until this is corrected.' : '');
      fieldError.hidden = false;
    }
    return null;
  }
}

function changed(text, id) {
  if (id) lastEdited = id;
  protectedCurrent = false;
  render();
  notify(text);
  keepWorkingDraft();
}

function removeProduct(id, fromRequest = false) {
  const product = productById(id);
  delete items[id];
  changed(`${product.name} removed from your list.`, id);
  const nextFocus = fromRequest
    ? itemsNode.querySelector('.remove-item') ?? byId('return-to-product')
    : cards.get(id).querySelector('[data-add]');
  nextFocus.focus({preventScroll: true});
}

function changeLine(id, delta) {
  const product = productById(id);
  const next = items[id] + delta;
  if (next < 1 || next > MAX_STEPS) return;
  items[id] = next;
  cards.get(id).querySelector('input').value = product.base * next;
  changed(`${product.name}: ${quantity(product, next)}. Total ${money(totals(items).totalPence)}.`, id);
  const control = itemsNode.querySelector(`[data-item="${id}"] [data-delta="${delta}"]`);
  if (control && !control.disabled) control.focus({preventScroll: true});
  else itemsNode.querySelector(`[data-item="${id}"] .remove-item`)?.focus({preventScroll: true});
}

function render() {
  const result = totals(items);
  for (const product of PRODUCTS) {
    const card = cards.get(product.id);
    const included = Object.hasOwn(items, product.id);
    card.classList.toggle('in-list', included);
    const add = card.querySelector('[data-add]');
    add.replaceChildren(
      document.createTextNode(included ? 'Remove from list' : 'Add to list'),
      node('span', '', included ? '−' : '+'),
    );
    add.querySelector('span').setAttribute('aria-hidden', 'true');
    add.setAttribute('aria-label', `${included ? 'Remove' : 'Add'} ${product.name} ${included ? 'from' : 'to'} list`);
    card.querySelector('[data-included]').textContent = included
      ? `In your list · ${quantity(product, items[product.id])}` : '';
    validateCard(product, false);
  }
  document.querySelectorAll('[data-list-count]').forEach(element => {
    element.textContent = `(${result.lines.length})`;
  });
  byId('request-total').textContent = money(result.totalPence);
  byId('download').disabled = !result.lines.length;
  byId('save').disabled = !result.lines.length;
  byId('clear').disabled = false;
  itemsNode.replaceChildren();
  if (!result.lines.length) {
    const empty = node('div', 'empty-list');
    empty.append(node('p', '', 'Choose a refill from the cupboard. Its quantity, price and container note will appear here.'));
    itemsNode.append(empty);
    updateNavigation();
    return;
  }
  for (const line of result.lines) {
    const article = node('article', 'request-item');
    article.dataset.item = line.id;
    article.append(node('h3', '', line.name));
    const calculation = node('div', 'item-calculation');
    const quantityRow = node('div', 'item-quantity');
    const quantityFact = node('div', 'quantity-fact');
    const amount = node('output', '', quantity(line, line.steps));
    amount.setAttribute('aria-label', `${line.name} quantity`);
    quantityFact.append(node('span', 'fact-label', 'Your quantity'), amount);
    const tools = node('div', 'item-tools');
    for (const delta of [-1, 1]) {
      const control = button(
        delta < 0 ? '−' : '+',
        `${delta < 0 ? 'Decrease' : 'Increase'} ${line.name} in your list`,
        () => changeLine(line.id, delta), 'round',
      );
      control.dataset.delta = delta;
      control.disabled = delta < 0 ? line.steps <= 1 : line.steps >= MAX_STEPS;
      tools.append(control);
    }
    quantityRow.append(quantityFact, tools);
    const priceRow = node('div', 'item-price-row');
    const basis = node('div', 'basis-fact');
    basis.append(node('span', 'fact-label', 'Price basis'), node('span', 'basis-value', `${money(line.pence)} / ${line.base} ${line.unit}`));
    const lineTotal = node('div', 'line-total-fact');
    lineTotal.append(node('span', 'fact-label', 'Line total'), node('strong', '', money(line.linePence)));
    priceRow.append(basis, lineTotal);
    calculation.append(quantityRow, priceRow);
    article.append(
      calculation,
      node('p', 'item-note', `Bring: ${line.note}`),
      button('Remove', `Remove ${line.name} from your list`, () => removeProduct(line.id, true), 'remove-item'),
    );
    itemsNode.append(article);
  }
  updateNavigation();
}

for (const product of PRODUCTS) {
  const card = cards.get(product.id);
  const input = card.querySelector('input');
  input.disabled = false;
  card.querySelectorAll('button').forEach(control => { control.disabled = false; });
  input.addEventListener('focus', () => rememberProduct(product.id));
  input.addEventListener('input', () => {
    rememberProduct(product.id);
    const steps = validateCard(product, true);
    if (steps !== null && Object.hasOwn(items, product.id)) {
      items[product.id] = steps;
      changed(`${product.name}: ${quantity(product, steps)}. Total ${money(totals(items).totalPence)}.`, product.id);
    }
  });
  card.querySelectorAll('[data-change]').forEach(control => {
    control.addEventListener('click', () => {
      rememberProduct(product.id);
      const delta = Number(control.dataset.change);
      const current = validateCard(product, false);
      const next = Math.max(1, Math.min(MAX_STEPS, (current ?? 1) + delta));
      input.value = product.base * next;
      validateCard(product, true);
      if (Object.hasOwn(items, product.id)) {
        items[product.id] = next;
        changed(`${product.name}: ${quantity(product, next)}. Total ${money(totals(items).totalPence)}.`, product.id);
      }
    });
  });
  card.querySelector('[data-add]').addEventListener('click', () => {
    rememberProduct(product.id);
    if (Object.hasOwn(items, product.id)) { removeProduct(product.id); return; }
    const steps = validateCard(product, true);
    if (steps === null) { input.focus(); return; }
    items[product.id] = steps;
    changed(`${quantity(product, steps)} of ${product.name} added. Use Review list to check your request.`, product.id);
  });
}

byId('recover').disabled = false;
byId('save').addEventListener('click', () => {
  if (!totals(items).lines.length) { fail('Add a refill before saving a list.'); return; }
  try {
    const payload = serializeList(items, new Date(), lastEdited);
    localStorage.setItem(STORAGE_KEY, payload);
    if (localStorage.getItem(STORAGE_KEY) !== payload) throw new Error('Saved read-back did not match');
    checkpoint = {...items};
    checkpointAvailable = true;
    notify('Recovery copy saved in this browser.');
    keepWorkingDraft();
    render();
  } catch {
    saveState.textContent = protectedCurrent
      ? 'The recovery copy could not be saved. Your automatic working draft is still kept in this browser.'
      : 'Neither the recovery copy nor the current working changes could be saved.';
    fail('The recovery copy could not be saved. Your current list is unchanged. Retry Save list or download your request.');
  }
});

function syncInputs() {
  for (const product of PRODUCTS) {
    if (Object.hasOwn(items, product.id)) {
      cards.get(product.id).querySelector('input').value = product.base * items[product.id];
    }
  }
}

function recoverCheckpoint() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) { notify('There is no saved recovery copy. Your current list is unchanged.'); return; }
    const recovered = parseSavedList(raw);
    items = recovered.items;
    checkpoint = {...recovered.items};
    checkpointAvailable = true;
    lastEdited = recovered.lastEdited;
    protectedCurrent = false;
    syncInputs();
    render();
    notify(`Saved recovery copy restored: ${totals(items).lines.length} ${totals(items).lines.length === 1 ? 'product' : 'products'}.`);
    keepWorkingDraft();
  } catch {
    fail('The saved recovery copy could not be read. Your current working list is unchanged. Keep working, download it, or clear the unusable saved copy.');
  }
}

function restoreInitial() {
  const candidates = [];
  const failed = [];
  for (const [key, kind] of [[STORAGE_KEY, 'recovery copy'], [DRAFT_KEY, 'working draft']]) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) continue;
      const recovered = parseSavedList(raw);
      candidates.push({...recovered, kind});
      if (key === STORAGE_KEY) {
        checkpoint = {...recovered.items};
        checkpointAvailable = true;
      }
    } catch { failed.push(kind); }
  }
  if (candidates.length) {
    candidates.sort((left, right) =>
      Date.parse(right.savedAt) - Date.parse(left.savedAt)
      || (right.kind === 'working draft' ? 1 : -1));
    const recovered = candidates[0];
    items = recovered.items;
    lastEdited = recovered.lastEdited;
    protectedCurrent = true;
    syncInputs();
    saveState.textContent = recovered.kind === 'working draft'
      ? 'Working draft recovered. Your separate saved recovery copy is unchanged.'
      : 'Your saved recovery copy has been restored.';
    render();
    notify(`Your ${recovered.kind} is back: ${totals(items).lines.length} ${totals(items).lines.length === 1 ? 'product' : 'products'}.`);
  } else {
    saveState.textContent = 'No working draft or saved recovery copy has been loaded.';
    render();
  }
  if (failed.length) {
    // Failed copies are left untouched. Only a later user edit writes a new draft.
    fail(`The ${failed.join(' and ')} could not be loaded. ${candidates.length ? 'The readable copy is shown; the failed copy was left untouched.' : 'You can still make a list here. If storage stays unavailable, download it before leaving.'}`, false);
    byId('clear').disabled = false;
  }
}

byId('recover').addEventListener('click', recoverCheckpoint);
byId('clear').addEventListener('click', () => {
  items = {};
  checkpoint = {};
  checkpointAvailable = false;
  protectedCurrent = false;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DRAFT_KEY);
    if (localStorage.getItem(STORAGE_KEY) !== null || localStorage.getItem(DRAFT_KEY) !== null) {
      throw new Error('A saved copy remains');
    }
    protectedCurrent = true;
    saveState.textContent = 'Current list, working draft and recovery copy are clear.';
    render();
    notify('Current and saved lists cleared. Choose a refill to start again.');
  } catch {
    saveState.textContent = 'The current list is clear, but a browser copy could not be removed.';
    render();
    byId('clear').disabled = false;
    fail('Your current list is clear. Browser storage could not remove every saved copy, so an older list may return after a reload. Retry Clear list before leaving.');
  }
});

byId('download').addEventListener('click', () => {
  if (!totals(items).lines.length) { fail('Add a refill before downloading a request.'); return; }
  let url;
  let link;
  try {
    const html = requestHtml(items);
    const blob = new Blob([html], {type: 'text/html;charset=utf-8'});
    url = URL.createObjectURL(blob);
    link = document.createElement('a');
    link.href = url;
    link.download = 'loop-collection-request.html';
    document.body.append(link);
    link.click();
    notify('Your request file is prepared for download. It contains your items and container notes; nothing has been sent to a shop.');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch {
    if (url) URL.revokeObjectURL(url);
    fail('The request file could not be prepared. Your list is unchanged. Retry Download request, or save the list in this browser.');
  } finally { link?.remove(); }
});

// Only genuinely unprotected edits trigger a leave-page warning.
window.addEventListener('beforeunload', event => {
  if (!protectedCurrent && !allowNavigation) {
    event.preventDefault();
    event.returnValue = '';
  }
});
document.addEventListener('click', event => {
  const link = event.target.closest('a[href]');
  if (!link || protectedCurrent || link.download || link.target === '_blank' || event.ctrlKey || event.metaKey) return;
  const target = new URL(link.href, location.href);
  if (target.pathname === location.pathname && target.search === location.search) return;
  const leave = window.confirm('The current working list could not be kept in browser storage. Leave this page and risk losing these changes? Choose Cancel to keep working or download your request first.');
  if (!leave) event.preventDefault();
  else allowNavigation = true;
});

render();
restoreInitial();
if (productById(location.hash.slice(1))) rememberProduct(location.hash.slice(1));
