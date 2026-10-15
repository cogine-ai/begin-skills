(function () {
  'use strict';
  let storage;
  try { storage = window.localStorage; } catch { storage = null; }
  const model = window.Pressline.create(storage);
  const state = model.snapshot();
  document.querySelectorAll('[data-summary]').forEach(node => { node.textContent = state.summary[node.dataset.summary]; });
  const dueJobs = state.jobs.filter(job => job.status !== 'Ready for delivery' && job.due >= window.Pressline.clock && job.due <= window.Pressline.dueThrough).sort((a,b) => a.due.localeCompare(b.due) || a.id.localeCompare(b.id));
  const list = document.getElementById('handover-jobs');
  dueJobs.forEach(job => {
    const link = document.createElement('a');
    link.className = 'handover-row' + (job.status === 'Blocked' ? ' blocked-row' : '');
    link.href = 'demo.html?job=' + encodeURIComponent(job.id);
    const date = new Intl.DateTimeFormat('en-GB', {day:'numeric', month:'short', timeZone:'UTC'}).format(new Date(job.due + 'T00:00:00Z'));
    link.setAttribute('aria-label', `Open ${job.id}, ${job.title}, ${job.client}, due ${date}, owner ${job.owner}, ${job.status}`);
    const identity = document.createElement('div');
    const title = document.createElement('strong'); title.textContent = job.title;
    const meta = document.createElement('small'); meta.textContent = `${job.client}${job.status === 'Blocked' ? ' · Blocked' : ''}`;
    identity.append(title, meta);
    const due = document.createElement('span'); due.textContent = date;
    const owner = document.createElement('span'); owner.textContent = job.owner;
    link.append(identity, due, owner); list.append(link);
  });
  if (!dueJobs.length) { const empty = document.createElement('p'); empty.className='handover-row'; empty.textContent='No active jobs due from 11–15 October.'; list.append(empty); }
  document.getElementById('overview-state').textContent = state.storage.saved ? 'Your saved local collection' : 'Working from the original sample';
})();
