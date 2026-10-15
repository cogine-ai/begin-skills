(() => {
  'use strict';
  const tools = document.querySelector('[data-library-tools]');
  if (tools) {
    const entries = [...document.querySelectorAll('[data-entry]')];
    const search = document.querySelector('#article-search');
    const buttons = [...tools.querySelectorAll('[data-filter]')];
    const status = document.querySelector('#result-status');
    const empty = document.querySelector('#empty-results');
    let category = 'all';
    const update = () => {
      const query = search.value.trim().toLocaleLowerCase();
      let count = 0;
      for (const entry of entries) {
        const visible = (category === 'all' || entry.dataset.category === category)
          && entry.textContent.toLocaleLowerCase().includes(query);
        entry.hidden = !visible;
        if (visible) count++;
      }
      status.textContent = `${count} ${count === 1 ? 'entry' : 'entries'} shown${query ? ` for “${search.value.trim()}”` : ''}.`;
      empty.hidden = count !== 0;
    };
    buttons.forEach(button => button.addEventListener('click', () => {
      category = button.dataset.filter;
      buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      update();
    }));
    search.addEventListener('input', update);
    document.querySelector('#reset-search').addEventListener('click', () => {
      category = 'all';
      search.value = '';
      buttons.forEach(item => item.setAttribute('aria-pressed', String(item.dataset.filter === 'all')));
      update();
      search.focus();
    });
    tools.hidden = false;
    status.hidden = false;
    update();
  }
  const links = [...document.querySelectorAll('[data-contents] a[href^="#"]')];
  if (links.length && 'IntersectionObserver' in window) {
    const headings = links.map(link => document.getElementById(link.hash.slice(1))).filter(Boolean);
    const visible = new Set();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) visible.add(entry.target.id);
        else visible.delete(entry.target.id);
      });
      const current = headings.find(heading => visible.has(heading.id));
      links.forEach(link => {
        if (current && link.hash === `#${current.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-5% 0px -55% 0px', threshold: 0 });
    headings.forEach(heading => observer.observe(heading));
  }
})();
