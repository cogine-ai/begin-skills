'use strict';
const contents = document.querySelector('.guide-contents');
if (contents) {
  const narrow = window.matchMedia('(max-width: 760px)');
  const arrange = () => { contents.open = !narrow.matches; };
  arrange();
  document.querySelectorAll('.back-to-steps').forEach(link => link.addEventListener('click', () => { contents.open = true; }));
  narrow.addEventListener('change', arrange);
}
