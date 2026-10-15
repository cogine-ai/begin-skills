(function (root) {
  'use strict';

  // Keep the duration together without changing the exact reading-list text.
  function render(target, text, phrase) {
    const parts = text.split(phrase);
    if (parts.length === 1) {
      target.textContent = text;
      return;
    }
    const nodes = [];
    parts.forEach((part, index) => {
      if (index) {
        const duration = document.createElement('span');
        duration.className = 'reading-duration';
        duration.textContent = phrase;
        nodes.push(duration);
      }
      nodes.push(document.createTextNode(part));
    });
    target.replaceChildren(...nodes);
  }

  root.MarginReadingText = Object.freeze({render});
  const expected = document.getElementById('expected-text');
  if (expected) {
    const text = expected.textContent;
    const match = text.match(/^\d+ books? · \d+ pages · \d+ reading minutes (\([^)]+\))$/m);
    if (match) render(expected, text, match[1]);
  }
})(window);
