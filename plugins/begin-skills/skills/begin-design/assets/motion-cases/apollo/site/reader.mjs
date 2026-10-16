import { CHAPTERS, DRAFT_KEY, KEPT_KEY, MAX_NOTE, recoverRecord, writeRecord, keepRecord, hasUnrecoveredChanges, validRecord, portableText } from './model.mjs';

const $ = selector => document.querySelector(selector);
const note = $('#reading-note');
const noteChapter = $('#note-chapter');
const status = $('#note-status');
const map = $('#journey-map');
let active = CHAPTERS[0];
let localStorageAccess;
try { localStorageAccess = window.localStorage; } catch { localStorageAccess = null; }
const unavailable = { getItem() { throw new Error('Storage unavailable'); }, setItem() { throw new Error('Storage unavailable'); } };
const storage = localStorageAccess || unavailable;
const draft = recoverRecord(storage, DRAFT_KEY);
const kept = recoverRecord(storage, KEPT_KEY);
let checkpoint = kept.record;
let state = draft.record || checkpoint || { version: 1, chapter: null, note: '' };
let safeRecord = state;
let downloadURL = null;
note.value = state.note;
noteChapter.value = state.chapter || CHAPTERS[0].id;

function announce(message, problem = false) {
  status.textContent = message;
  status.classList.toggle('problem', problem);
}

function currentRecord(chapter = noteChapter.value) {
  return validRecord({ version: 1, chapter, note: note.value });
}

function updateKept() {
  const chapter = CHAPTERS.find(item => item.id === checkpoint?.chapter);
  const summary = $('#kept-summary');
  const resume = $('#resume-link');
  if (chapter) {
    summary.textContent = `Kept chapter: ${chapter.number} / ${chapter.name}`;
    resume.href = `#${chapter.id}`;
    resume.hidden = false;
  } else {
    summary.textContent = 'No chapter kept yet';
    resume.hidden = true;
  }
  document.querySelectorAll('[data-keep]').forEach(button => {
    const selected = button.dataset.keep === checkpoint?.chapter;
    button.setAttribute('aria-pressed', String(selected));
    button.textContent = selected ? 'Chapter kept ✓' : 'Keep this chapter';
  });
}

function saveDraft() {
  const record = currentRecord();
  if (!record) {
    announce(`Keep the note within ${MAX_NOTE.toLocaleString()} characters to save or download it. Your text is still in the field.`, true);
    return false;
  }
  state = record;
  const saved = writeRecord(storage, DRAFT_KEY, record);
  if (saved) safeRecord = record;
  const target = CHAPTERS.find(chapter => chapter.id === record.chapter).name;
  announce(saved ? `Draft for ${target} kept on this browser. The kept checkpoint is unchanged.` : 'Browser storage is unavailable. Your current note is usable; download it before leaving.', !saved);
  return saved;
}

function keepChapter(id) {
  const record = currentRecord(id);
  if (!record) { saveDraft(); return; }
  state = record;
  noteChapter.value = record.chapter;
  const { checkpointSaved, draftSaved, recoveryVerified } = keepRecord(storage, record);
  if (checkpointSaved) checkpoint = record;
  if (recoveryVerified) safeRecord = record;
  updateKept();
  if (checkpointSaved && recoveryVerified) announce(`Kept ${CHAPTERS.find(ch => ch.id === id).name} and the current note on this browser.`);
  else if (checkpointSaved) announce('The checkpoint was saved, but draft recovery could not be verified. Keep this page open and download a copy before leaving.', true);
  else announce(draftSaved ? 'Draft saved, but the kept checkpoint could not be written. Download a copy for safekeeping.' : 'Could not keep this on the browser. Your current note remains usable; download a copy.', true);
}

document.querySelectorAll('[data-js-control]').forEach(control => { control.disabled = false; });
$('#no-script-note').hidden = true;
document.querySelectorAll('[data-keep]').forEach(button => button.addEventListener('click', () => keepChapter(button.dataset.keep)));
$('#keep-note').addEventListener('click', () => keepChapter(noteChapter.value));
noteChapter.addEventListener('change', saveDraft);
document.querySelectorAll('[data-note-chapter]').forEach(link => link.addEventListener('click', () => {
  noteChapter.value = link.dataset.noteChapter;
  saveDraft();
}));
note.addEventListener('input', () => {
  $('#note-count').textContent = `${note.value.length.toLocaleString()} / ${MAX_NOTE.toLocaleString()}`;
  saveDraft();
});
$('#note-count').textContent = `${note.value.length.toLocaleString()} / ${MAX_NOTE.toLocaleString()}`;
$('#download-note').addEventListener('click', () => {
  const record = currentRecord();
  if (!record) { saveDraft(); return; }
  const blob = new Blob([portableText(record)], { type: 'text/plain;charset=utf-8' });
  if (downloadURL) URL.revokeObjectURL(downloadURL);
  downloadURL = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadURL;
  anchor.download = `down-to-the-moon-${record.chapter}.txt`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  announce(`Text download created for ${CHAPTERS.find(chapter => chapter.id === record.chapter).name} with the current note.`);
});
window.addEventListener('pagehide', () => { if (downloadURL) URL.revokeObjectURL(downloadURL); });
window.addEventListener('beforeunload', event => {
  const record = currentRecord();
  if (hasUnrecoveredChanges(record, safeRecord)) {
    event.preventDefault();
    event.returnValue = '';
  }
});

function selectChapter(chapter) {
  active = chapter;
  map.dataset.phase = chapter.id;
  const capsule = map.querySelector('.capsule');
  capsule.style.setProperty('--x', `${chapter.x}px`);
  capsule.style.setProperty('--y', `${chapter.y}px`);
  capsule.style.setProperty('--angle', `${chapter.angle}deg`);
  const eagle = map.querySelector('.eagle');
  eagle.style.setProperty('--x', `${chapter.eagleX}px`);
  eagle.style.setProperty('--y', `${chapter.eagleY}px`);
  $('#diagram-phase').textContent = `${chapter.number} / ${chapter.name}`;
  $('#diagram-date').textContent = chapter.date;
  $('#main-map-title').textContent = `${chapter.name} schematic`;
  $('#diagram-description').textContent = {
    departure: 'The whole crew leaves Earth. The orange line marks the outward journey.',
    'lunar-orbit': 'The journey reaches lunar orbit. The orbit ring becomes the reference for the next chapter.',
    landing: 'Eagle moves toward the lunar surface. Columbia stays in orbit: two related tasks, two vehicles.',
    return: 'The return line leads back to Earth and the Pacific splashdown.',
  }[chapter.id];
  $('#main-map-desc').textContent = `${$('#diagram-description').textContent} Original conceptual drawing, not to scale or a flight simulation.`;
  document.querySelectorAll('[data-chapter-link]').forEach(link => {
    if (link.dataset.chapterLink === chapter.id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  document.querySelectorAll('.chapter').forEach(section => section.classList.toggle('is-current', section.id === chapter.id));
}

const chapters = [...document.querySelectorAll('.chapter')];
const visible = new Map();
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) visible.set(entry.target.id, entry.boundingClientRect.top);
      else visible.delete(entry.target.id);
    }
    const ids = [...visible.keys()];
    const selected = chapters.find(section => ids.includes(section.id));
    if (selected) selectChapter(CHAPTERS.find(ch => ch.id === selected.id));
  }, { rootMargin: '-15% 0px -45% 0px', threshold: 0 });
  chapters.forEach(section => observer.observe(section));
}
function fromHash() {
  const chapter = CHAPTERS.find(item => `#${item.id}` === location.hash);
  if (chapter) selectChapter(chapter);
}
window.addEventListener('hashchange', fromHash);
document.querySelectorAll('[data-chapter-link]').forEach(link => link.addEventListener('click', () => {
  const chapter = CHAPTERS.find(item => item.id === link.dataset.chapterLink);
  if (chapter) selectChapter(chapter);
}));
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const phone = matchMedia('(max-width: 760px)');
const landingFigure = $('#landing .phone-diagram');
const replay = $('[data-replay="landing"]');
let landingPlayed = false;
function stopLandingMotion() { landingFigure.classList.remove('is-playing'); }
function playLandingMotion() {
  if (motion.matches || document.hidden || !phone.matches) return;
  stopLandingMotion();
  void landingFigure.offsetWidth;
  landingFigure.classList.add('is-playing');
  landingPlayed = true;
}
function motionPreference() {
  document.documentElement.classList.toggle('reduce-motion', motion.matches);
  replay.hidden = motion.matches || !phone.matches;
  if (motion.matches || !phone.matches) stopLandingMotion();
}
motion.addEventListener('change', motionPreference);
phone.addEventListener('change', motionPreference);
replay.addEventListener('click', playLandingMotion);
landingFigure.addEventListener('animationend', event => {
  if (event.animationName === 'descend') stopLandingMotion();
});
if ('IntersectionObserver' in window) {
  const figureObserver = new IntersectionObserver(entries => {
    const entry = entries[0];
    if (entry.intersectionRatio < .2) stopLandingMotion();
    if (entry.isIntersecting && entry.intersectionRatio >= .6 && !landingPlayed) playLandingMotion();
  }, { rootMargin: '0px 0px -5% 0px', threshold: [0, .2, .6] });
  figureObserver.observe(landingFigure);
}
motionPreference();
document.addEventListener('visibilitychange', () => {
  document.documentElement.classList.toggle('motion-idle', document.hidden);
  if (document.hidden) stopLandingMotion();
});
selectChapter(active);
fromHash();
updateKept();
if (draft.problem === 'unavailable' || kept.problem === 'unavailable') announce('Browser storage is unavailable. Current notes and text downloads remain usable.', true);
else if (draft.problem || kept.problem) announce('Unrecognized saved data was ignored. Current work is usable; download a copy before leaving.', true);
else if (draft.record) announce('Current local draft restored');
else if (checkpoint) announce('Kept chapter and note restored');
else announce('Notes stay on this browser. Download a text copy to keep them elsewhere.');
