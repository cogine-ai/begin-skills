(function () {
  'use strict';
  const selector = document.getElementById('guide-jump');
  const button = document.getElementById('guide-go');
  if (!selector || !button) return;
  document.documentElement.classList.add('guide-enhanced');
  const initial = window.location.hash.slice(1);
  if ([...selector.options].some(option => option.value === initial)) selector.value = initial;
  button.addEventListener('click', function () {
    const section = document.getElementById(selector.value);
    if (!section) return;
    const details = section.querySelector('details');
    if (details) details.open = true;
    window.location.hash = selector.value;
    const heading = section.querySelector('h2');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
  });
})();
