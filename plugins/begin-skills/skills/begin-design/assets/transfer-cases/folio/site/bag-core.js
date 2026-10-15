(function (root) {
  'use strict';
  const books = root.FolioBooks;
  const formats = ['paperback', 'hardback'];
  const empty = () => ({ version: 1, lines: [] });
  const find = id => books.find(book => book.id === id);
  const key = line => `${line.book}:${line.format}`;
  const money = cents => `$${(cents / 100).toFixed(2)}`;
  const unit = (id, format) => find(id).price + (format === 'hardback' ? 1200 : 0);
  const label = format => format === 'hardback' ? 'Hardback' : 'Paperback';
  function validate(book, format, quantity) {
    if (!find(book)) return { field: 'book', message: 'Choose a book from this catalogue.' };
    if (!formats.includes(format)) return { field: 'format', message: 'Choose paperback or hardback.' };
    const text = String(quantity).trim();
    if (!/^\d+$/.test(text) || Number(text) < 1 || Number(text) > 8) return { field: 'quantity', message: 'Enter a whole quantity from 1 to 8.' };
    return null;
  }
  function add(state, book, format, quantity) {
    const error = validate(book, format, quantity);
    if (error) return { ok: false, error };
    const line = { book, format, quantity: Number(quantity) };
    const existing = state.lines.find(item => key(item) === key(line));
    if (existing && existing.quantity + line.quantity > 8) return { ok: false, error: { field: 'quantity', message: `This ${label(format).toLowerCase()} is already in your bag. Keep its combined quantity at 8 or fewer.` } };
    const lines = existing ? state.lines.map(item => key(item) === key(line) ? { ...item, quantity: item.quantity + line.quantity } : { ...item }) : [...state.lines.map(item => ({ ...item })), line];
    return { ok: true, state: { version: 1, lines } };
  }
  function update(state, originalKey, format, quantity) {
    const current = state.lines.find(item => key(item) === originalKey);
    if (!current) return { ok: false, error: { field: 'quantity', message: 'This line has changed. Review the current bag.' } };
    const error = validate(current.book, format, quantity);
    if (error) return { ok: false, error };
    const nextKey = `${current.book}:${format}`;
    const other = state.lines.find(item => key(item) === nextKey && key(item) !== originalKey);
    const combined = Number(quantity) + (other ? other.quantity : 0);
    if (combined > 8) return { ok: false, error: { field: 'quantity', message: 'That format is already in your bag. Keep the combined quantity at 8 or fewer.' } };
    const lines = state.lines.filter(item => key(item) !== originalKey && (!other || key(item) !== nextKey)).map(item => ({ ...item }));
    const at = Math.min(state.lines.findIndex(item => key(item) === originalKey), lines.length);
    lines.splice(at, 0, { book: current.book, format, quantity: combined });
    return { ok: true, state: { version: 1, lines } };
  }
  function remove(state, originalKey) {
    return { version: 1, lines: state.lines.filter(item => key(item) !== originalKey).map(item => ({ ...item })) };
  }
  function totals(state) {
    return state.lines.reduce((sum, line) => ({ copies: sum.copies + line.quantity, cents: sum.cents + unit(line.book, line.format) * line.quantity }), { copies: 0, cents: 0 });
  }
  function read(raw) {
    if (raw === null || raw === undefined) return { ok: true, state: empty() };
    try {
      const value = JSON.parse(raw);
      if (value.version !== 1 || !Array.isArray(value.lines) || value.lines.length > 12) throw new Error('Bad bag');
      const seen = new Set();
      const lines = value.lines.map(line => {
        if (!line || !Number.isInteger(line.quantity) || validate(line.book, line.format, line.quantity) || seen.has(key(line))) throw new Error('Bad line');
        seen.add(key(line));
        return { book: line.book, format: line.format, quantity: line.quantity };
      });
      return { ok: true, state: { version: 1, lines } };
    } catch { return { ok: false, state: empty(), message: 'Your saved bag could not be read. You can make a new selection here.' }; }
  }
  function exportText(state) {
    const total = totals(state);
    const lines = state.lines.map(line => `${find(line.book).title} — ${label(line.format)}\n${line.quantity} × ${money(unit(line.book, line.format))} = ${money(unit(line.book, line.format) * line.quantity)}`);
    return ['FOLIO PRESS — SAMPLE BAG', 'Fictional catalogue · USD · no order or payment', '', ...(lines.length ? lines.flatMap(line => [line, '']) : ['Your bag is empty.', '']), `${total.copies} ${total.copies === 1 ? 'copy' : 'copies'}`, `Total: ${money(total.cents)}`, '', 'This selection stays in your browser.'].join('\n');
  }
  root.FolioModel = Object.freeze({ empty, find, key, money, unit, label, validate, add, update, remove, totals, read, exportText });
})(globalThis);
