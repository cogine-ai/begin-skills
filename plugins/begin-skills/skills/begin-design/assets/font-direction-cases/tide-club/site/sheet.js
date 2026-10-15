"use strict";
(() => {
  const node = (className, text) => {
    const span = document.createElement("span");
    span.className = className;
    span.textContent = text;
    return span;
  };

  function appendUnits(parent, text) {
    const units = /\d+ (?:pool minutes|minutes|sessions|session|min)\b/g;
    let start = 0;
    for (const match of text.matchAll(units)) {
      parent.append(document.createTextNode(text.slice(start, match.index)));
      parent.append(node("sheet-unit nums", match[0]));
      start = match.index + match[0].length;
    }
    parent.append(document.createTextNode(text.slice(start)));
  }

  function render(target, text) {
    const fragment = document.createDocumentFragment();
    const lines = text.split("\n");
    lines.forEach((line, index) => {
      const row = node("sheet-line", "");
      const record = /^(\d{2}:\d{2}–\d{2}:\d{2}) \| (.+) \| (\d+ min)$/.exec(line);
      if (record) {
        row.classList.add("sheet-record");
        row.append(node("sheet-time nums", record[1]));
        row.append(node("sheet-separator", " | "));
        row.append(node("sheet-name", record[2]));
        row.append(node("sheet-separator", " | "));
        row.append(node("sheet-duration nums", record[3]));
      } else {
        appendUnits(row, line);
      }
      fragment.append(row);
      if (index < lines.length - 1) fragment.append(document.createTextNode("\n"));
    });
    target.classList.add("sheet-layout");
    target.replaceChildren(fragment);
  }

  window.TideSheet = { render };
  const example = document.getElementById("expected-plan");
  if (example) render(example, example.textContent);
})();
