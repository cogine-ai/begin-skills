/* Presentation-only selected-work context; shared review behavior stays unchanged. */
(() => {
  'use strict';
  const title = document.getElementById('item-title');
  const version = document.getElementById('item-version');
  const status = document.getElementById('item-status');
  if (!title || !version || !status) return;
  const copy = () => {
    const fields = [['[data-current-title]', title], ['[data-current-version]', version], ['[data-current-status]', status]];
    for (const [selector, source] of fields) document.querySelectorAll(selector).forEach(node => { node.textContent = source.textContent; });
  };
  const observer = new MutationObserver(copy);
  for (const node of [title, version, status]) observer.observe(node, { childList: true, characterData: true, subtree: true });
  copy();
})();
