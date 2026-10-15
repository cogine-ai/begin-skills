(function () {
  'use strict';
  const Model = globalThis.FolioModel;
  const books = globalThis.FolioBooks;
  const storageKey = 'folio-press-sample-bag-v1';
  const $ = id => document.getElementById(id);
  let bag = Model.empty();
  let canKeep = true;
  let startupMessage = '';
  try {
    const read = Model.read(localStorage.getItem(storageKey));
    bag = read.state;
    if (!read.ok) startupMessage = read.message;
  } catch {
    canKeep = false;
    startupMessage = 'Your browser cannot keep this bag. You can still make and export a selection during this visit.';
  }
  function announce(message) { $('site-status').textContent = message; }
  function updateCount() {
    const total = Model.totals(bag);
    document.querySelectorAll('[data-bag-count]').forEach(node => { node.textContent = total.copies; node.setAttribute('aria-label', `${total.copies} ${total.copies === 1 ? 'copy' : 'copies'}`); });
    if ($('quick-bag-summary')) $('quick-bag-summary').textContent = `${total.copies} ${total.copies === 1 ? 'copy' : 'copies'} · ${Model.money(total.cents)}`;
  }
  function commit(next, message) {
    bag = next;
    if ($('add-feedback')) $('add-feedback').textContent = '';
    try {
      localStorage.setItem(storageKey, JSON.stringify(bag));
      canKeep = true;
    } catch { canKeep = false; }
    updateCount();
    renderBag();
    const saving = canKeep ? 'Kept in this browser.' : 'This change could not be kept. Export your bag before leaving.';
    if ($('bag-status')) $('bag-status').textContent = `${message} ${saving}`;
    announce(`${message} ${saving}`);
  }
  updateCount();
  if (startupMessage) announce(startupMessage);

  const filters = $('catalogue-filters');
  if (filters) {
    filters.hidden = false;
    filters.addEventListener('click', event => {
      const button = event.target.closest('[data-filter]');
      if (!button) return;
      const category = button.dataset.filter;
      filters.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      let count = 0;
      document.querySelectorAll('.catalogue-book').forEach(item => {
        item.hidden = category !== 'All books' && category !== item.dataset.category;
        if (!item.hidden) count++;
      });
      $('catalogue-count').textContent = `${count} ${count === 1 ? 'book' : 'books'} · ${category === 'All books' ? 'Available as paperback or hardback' : category}`;
    });
  }

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function field(labelText, control, id, errorID) {
    const wrapper = node('div', 'field');
    const label = node('label', '', labelText);
    label.htmlFor = id;
    control.id = id;
    control.setAttribute('aria-describedby', errorID);
    wrapper.append(label, control);
    return wrapper;
  }
  function renderBag() {
    const target = $('bag-lines');
    if (!target) return;
    target.replaceChildren();
    if (!bag.lines.length) {
      const empty = node('div', 'bag-empty');
      empty.append(node('h3', '', 'Your bag is empty'), node('p', '', 'Choose a title, format and quantity above to start a sample selection.'));
      const link = node('a', 'button secondary', 'Choose a book ↑');
      link.href = '#book-select';
      empty.append(link);
      target.append(empty);
    }
    bag.lines.forEach(line => {
      const book = Model.find(line.book);
      const identity = Model.key(line);
      const id = identity.replace(':', '-');
      const article = node('article', 'bag-line');
      article.dataset.variant = identity;
      const image = node('img');
      image.src = `art/${book.id}.svg`; image.width = 420; image.height = 620; image.alt = '';
      const content = node('div', 'line-content');
      const heading = node('div', 'line-heading');
      const title = node('h3');
      const link = node('a', '', book.title);
      link.href = `demo.html?book=${book.id}&format=${line.format}`;
      title.append(link);
      heading.append(title, node('span', 'line-subtotal', Model.money(Model.unit(line.book, line.format) * line.quantity)));
      content.append(heading, node('p', 'line-unit', `${Model.label(line.format)} · ${Model.money(Model.unit(line.book, line.format))} each`));
      const form = node('form', 'line-controls');
      form.noValidate = true;
      form.setAttribute('aria-label', `Update ${book.title} ${Model.label(line.format).toLowerCase()}`);
      const select = node('select'); select.name = 'format';
      ['paperback', 'hardback'].forEach(format => { const option = node('option', '', Model.label(format)); option.value = format; select.append(option); });
      select.value = line.format;
      const quantity = node('input');
      quantity.type = 'number'; quantity.name = 'quantity'; quantity.value = line.quantity; quantity.min = '1'; quantity.max = '8'; quantity.step = '1'; quantity.inputMode = 'numeric';
      const errorID = `error-${id}`;
      const update = node('button', 'update-button', 'Update'); update.type = 'submit';
      const remove = node('button', 'text-button', 'Remove'); remove.type = 'button'; remove.setAttribute('aria-label', `Remove ${book.title} ${Model.label(line.format).toLowerCase()}`);
      const error = node('p', 'error line-error'); error.id = errorID; error.setAttribute('role', 'alert');
      form.append(field('Format', select, `format-${id}`, errorID), field('Quantity', quantity, `quantity-${id}`, errorID), update, remove, error);
      form.addEventListener('submit', event => {
        event.preventDefault();
        error.textContent = ''; select.removeAttribute('aria-invalid'); quantity.removeAttribute('aria-invalid');
        const result = Model.update(bag, identity, select.value, quantity.value);
        if (!result.ok) {
          error.textContent = result.error.message;
          const input = result.error.field === 'format' ? select : quantity;
          input.setAttribute('aria-invalid', 'true'); input.focus();
          return;
        }
        const nextKey = `${line.book}:${select.value}`;
        commit(result.state, `${book.title} updated.`);
        const restored = [...target.querySelectorAll('[data-variant]')].find(item => item.dataset.variant === nextKey);
        if (restored) restored.querySelector('.update-button').focus();
      });
      remove.addEventListener('click', () => {
        const previousIndex = bag.lines.findIndex(item => Model.key(item) === identity);
        commit(Model.remove(bag, identity), `${book.title} ${Model.label(line.format).toLowerCase()} removed.`);
        const remaining = target.querySelectorAll('.bag-line');
        if (remaining.length) remaining[Math.min(previousIndex, remaining.length - 1)].querySelector('.text-button').focus();
        else $('add-button').focus();
      });
      content.append(form); article.append(image, content); target.append(article);
    });
    const total = Model.totals(bag);
    $('copy-total').textContent = `${total.copies} ${total.copies === 1 ? 'copy' : 'copies'}`;
    $('bag-total').textContent = Model.money(total.cents);
    if (!$('export-panel').hidden) $('export-text').value = Model.exportText(bag);
  }

  const addForm = $('add-form');
  if (addForm) {
    const params = new URLSearchParams(location.search);
    const requestedBook = params.get('book');
    let selected = Model.find(requestedBook) || Model.find('soft-geometry');
    const requestedFormat = ['paperback', 'hardback'].includes(params.get('format')) ? params.get('format') : 'paperback';
    const bookSelect = $('book-select');
    const formatSelect = $('book-format');
    const quantityInput = $('book-quantity');
    function clearErrors() {
      $('format-error').textContent = ''; $('quantity-error').textContent = '';
      formatSelect.removeAttribute('aria-invalid'); quantityInput.removeAttribute('aria-invalid');
    }
    function refreshPrice() {
      const error = Model.validate(selected.id, formatSelect.value, quantityInput.value);
      $('selection-price-label').textContent = error ? 'Price per copy' : 'Amount to add';
      $('selection-price').textContent = error ? Model.money(Model.unit(selected.id, formatSelect.value)) : Model.money(Model.unit(selected.id, formatSelect.value) * Number(quantityInput.value));
    }
    function syncSelectionURL() {
      const url = new URL(location.href);
      url.searchParams.set('book', selected.id);
      url.searchParams.set('format', formatSelect.value);
      history.replaceState(null, '', url);
    }
    function selectBook(book, format = 'paperback') {
      selected = book;
      bookSelect.value = book.id;
      $('book-title').textContent = book.title;
      $('book-author').textContent = book.author;
      $('book-category').textContent = book.category;
      $('book-short').textContent = book.note;
      $('book-description').textContent = book.description;
      $('book-pages').textContent = `${book.pages} pages`;
      $('book-size').textContent = book.size;
      $('selected-cover').src = `art/${book.id}.svg`;
      $('selected-cover').alt = book.alt;
      formatSelect.querySelectorAll('option').forEach(option => { option.textContent = `${Model.label(option.value)} — ${Model.money(Model.unit(book.id, option.value))}`; });
      formatSelect.value = format;
      quantityInput.value = '1';
      clearErrors(); $('add-feedback').textContent = ''; refreshPrice();
      const sample = globalThis.FolioSamples[book.id];
      $('inside-title').textContent = `Inside ${book.title}`;
      $('sample-kind').textContent = `${sample.kind} · ${sample.folio}`;
      $('sample-title').textContent = sample.heading;
      $('sample-prose').replaceChildren(...sample.paragraphs.map(paragraph => node('p', '', paragraph)));
      $('sample-caption').textContent = sample.caption;
      $('sample-art').hidden = !sample.art;
      $('sample-spread').classList.toggle('text-only', !sample.art);
      if (sample.art) { $('sample-image').src = sample.art; $('sample-image').alt = sample.alt; }
      document.title = `${book.title} — Folio Press`;
    }
    selectBook(selected, requestedFormat);
    if (requestedBook && !Model.find(requestedBook)) announce('That title is not in this catalogue. Soft Geometry is selected.');
    bookSelect.addEventListener('change', () => {
      selectBook(Model.find(bookSelect.value));
      syncSelectionURL();
    });
    formatSelect.addEventListener('change', () => { clearErrors(); refreshPrice(); syncSelectionURL(); });
    quantityInput.addEventListener('input', refreshPrice);
    addForm.addEventListener('submit', event => {
      event.preventDefault(); clearErrors(); $('add-feedback').textContent = '';
      const result = Model.add(bag, selected.id, formatSelect.value, quantityInput.value);
      if (!result.ok) {
        const control = result.error.field === 'format' ? formatSelect : quantityInput;
        const error = result.error.field === 'format' ? $('format-error') : $('quantity-error');
        error.textContent = result.error.message; control.setAttribute('aria-invalid', 'true'); control.focus();
        return;
      }
      const quantity = Number(quantityInput.value);
      const message = `${quantity} ${quantity === 1 ? 'copy' : 'copies'} of ${selected.title} added.`;
      commit(result.state, message);
      $('add-feedback').textContent = `${message} View your sample bag below.`;
    });
    $('clear-bag').addEventListener('click', () => commit(Model.empty(), 'Your bag is empty.'));
    $('export-bag').addEventListener('click', () => {
      const text = Model.exportText(bag);
      $('export-panel').hidden = false; $('export-text').value = text;
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = node('a'); link.href = url; link.download = 'folio-press-sample-bag.txt';
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      $('bag-status').textContent = 'Current bag exported as text. A copy is shown below.';
      announce('Current bag exported as text.');
    });
    renderBag();
    if (startupMessage) $('bag-status').textContent = startupMessage;
  }
})();
