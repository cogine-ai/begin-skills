(function () {
  'use strict';
  let storage = null;
  try { storage = window.localStorage; } catch {}
  const s = window.SignalDesk.create(storage).snapshot();
  const V = window.SignalView;
  document.getElementById('overview-rows').innerHTML = window.SignalDesk.ordered(s.queue).map(r => V.row(r, false, false, false)).join('');
  document.getElementById('home-count').textContent = String(s.count).padStart(2, '0');
  document.getElementById('home-minutes').textContent = String(s.total);
  document.getElementById('home-issues').textContent = String(s.issues.length).padStart(2, '0');
  V.renderLoads(document.getElementById('home-loads'), s.loads);
  if (s.storage.kept && !s.storage.invalid) {
    document.getElementById('home-scope').textContent = `Kept local plan / revision ${String(s.revision).padStart(2, '0')} / all six episodes`;
    document.getElementById('home-source').textContent = 'Your last kept local queue, read when this overview opened. Reload to see a later kept version.';
  } else if (s.storage.invalid) {
    document.getElementById('home-source').textContent = 'Original example week. A local copy could not be read; open the queue for recovery.';
  }
})();
