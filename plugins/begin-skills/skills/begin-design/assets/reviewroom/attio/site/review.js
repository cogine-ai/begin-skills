/* Original Reviewroom local sample behavior. No network requests or real client data. */
(() => {
  'use strict';
  const page = document.body;
  const form = document.getElementById('comment-form');
  if (!form) return;
  const direction = page.dataset.direction;
  if (!['attio', 'linear', 'coda', 'air', 'resend', 'mintlify'].includes(direction)) throw new Error('Unknown sample direction');
  const key = `begin-reviewroom-v1-${direction}`;
  const initial = {
    landing: { title: 'Landing page', version: 'v03', status: 'Awaiting review', image: 'work/landing.svg', comments: [] },
    email: { title: 'Welcome email', version: 'v02', status: 'Changes requested', image: 'work/email.svg', comments: [{ text: 'Please make the first step easier to find.', kind: 'Sample feedback' }] },
    walkthrough: { title: 'Product walkthrough', version: 'v01', status: 'Approved', image: 'work/walkthrough.svg', comments: [] }
  };
  let state = structuredClone(initial);
  let storageAvailable = true;
  try {
    const stored = JSON.parse(localStorage.getItem(key));
    if (stored && Object.keys(initial).every(id => stored[id] && ['Awaiting review', 'Changes requested', 'Approved'].includes(stored[id].status) && Array.isArray(stored[id].comments) && stored[id].comments.every(c => typeof c.text === 'string' && typeof c.kind === 'string'))) {
      for (const id of Object.keys(initial)) state[id] = { ...initial[id], status: stored[id].status, comments: stored[id].comments };
    }
  } catch { storageAvailable = false; }
  const selectedParam = new URLSearchParams(location.search).get('item');
  let selected = Object.hasOwn(initial, selectedParam) ? selectedParam : 'landing';
  const el = id => document.getElementById(id);
  const textarea = el('comment');
  const live = el('review-live');
  const drafts = { landing: '', email: '', walkthrough: '' };
  const buttons = [...document.querySelectorAll('[data-item]')];
  const announce = message => { live.textContent = message; };
  const save = () => {
    try { localStorage.setItem(key, JSON.stringify(state)); }
    catch { storageAvailable = false; }
  };
  const render = () => {
    const item = state[selected];
    el('item-title').textContent = item.title;
    el('item-version').textContent = item.version;
    el('item-status').textContent = item.status;
    el('item-status').dataset.status = item.status;
    el('work-preview').src = item.image;
    el('work-preview').alt = `Original sample ${item.title.toLowerCase()} artwork, ${item.version}`;
    const list = el('comment-list');
    list.replaceChildren();
    if (!item.comments.length) {
      const empty = document.createElement('li');
      empty.textContent = 'No comments yet. Leave the first clear note.';
      empty.className = 'comment-empty';
      list.append(empty);
    } else for (const comment of item.comments) {
      const row = document.createElement('li');
      const label = document.createElement('strong'); label.textContent = comment.kind;
      const text = document.createElement('p'); text.textContent = comment.text;
      row.append(label, text); list.append(row);
    }
    buttons.forEach(button => {
      const id = button.dataset.item;
      button.setAttribute('aria-pressed', String(id === selected));
      const status = button.querySelector('[data-item-status]');
      if (status) {
        status.textContent = state[id].status;
        status.dataset.status = state[id].status;
        status.classList.remove('waiting', 'changes', 'approved');
        status.classList.add({ 'Awaiting review': 'waiting', 'Changes requested': 'changes', Approved: 'approved' }[state[id].status]);
      }
    });
    if (el('approved-count')) el('approved-count').textContent = String(Object.values(state).filter(i => i.status === 'Approved').length);
    if (el('comment-count')) el('comment-count').textContent = String(item.comments.length);
    el('approve').disabled = item.status === 'Approved';
  };
  const feedback = changes => {
    textarea.setCustomValidity('');
    const text = textarea.value.trim();
    if (!text) { textarea.setCustomValidity('Write a specific comment first.'); textarea.reportValidity(); return; }
    if (text.length > 2000) { textarea.setCustomValidity('Keep your comment to 2,000 characters.'); textarea.reportValidity(); return; }
    state[selected].comments.push({ text, kind: changes ? 'Changes requested by you' : 'Your sample feedback' });
    if (changes) state[selected].status = 'Changes requested';
    save(); render(); textarea.value = ''; drafts[selected] = '';
    announce(`${changes ? 'Changes requested' : 'Comment added'} for ${state[selected].title}.${storageAvailable ? ' Saved in this browser.' : ' Browser storage is unavailable; kept for this page only.'}`);
  };
  buttons.forEach(button => button.addEventListener('click', () => {
    const next = button.dataset.item;
    if (!Object.hasOwn(initial, next)) return;
    if (next === selected) return;
    drafts[selected] = textarea.value;
    selected = next; textarea.value = drafts[selected]; textarea.setCustomValidity(''); render();
    announce(`${state[selected].title}, ${state[selected].version}, ${state[selected].status}.`);
  }));
  textarea.addEventListener('input', () => textarea.setCustomValidity(''));
  form.addEventListener('submit', event => { event.preventDefault(); feedback(false); });
  el('request-changes').addEventListener('click', () => feedback(true));
  el('approve').addEventListener('click', () => {
    state[selected].status = 'Approved'; save(); render();
    announce(`${state[selected].title} approved.${storageAvailable ? ' Saved in this browser.' : ' Browser storage is unavailable; kept for this page only.'}`);
  });
  el('reset-demo').addEventListener('click', () => {
    state = structuredClone(initial); selected = 'landing'; textarea.value = ''; textarea.setCustomValidity('');
    Object.keys(drafts).forEach(id => { drafts[id] = ''; });
    try { localStorage.removeItem(key); } catch { storageAvailable = false; }
    render(); announce('Sample review reset. All three items are back to their starting state.');
  });
  render();
  if (!storageAvailable) announce('Browser storage is unavailable; changes will last for this page only.');
})();
