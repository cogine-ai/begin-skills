export const CHAPTERS = Object.freeze([
  { id: 'departure', number: '01', name: 'Departure', title: 'Three people, one outward journey', date: '16 July 1969', x: 146, y: 337, angle: -38, eagleX: 146, eagleY: 337 },
  { id: 'lunar-orbit', number: '02', name: 'Lunar orbit', title: 'The Moon becomes the centre', date: '19 July 1969', x: 353, y: 84, angle: 30, eagleX: 353, eagleY: 84 },
  { id: 'landing', number: '03', name: 'Landing', title: 'Two descend, one stays in orbit', date: '20 July 1969', x: 353, y: 84, angle: 30, eagleX: 448, eagleY: 225 },
  { id: 'return', number: '04', name: 'Return', title: 'The journey closes on Earth', date: '24 July 1969', x: 167, y: 365, angle: 142, eagleX: 448, eagleY: 225 },
]);
export const DRAFT_KEY = 'down-to-the-moon:draft:v1';
export const KEPT_KEY = 'down-to-the-moon:kept:v1';
export const MAX_NOTE = 3000;
export const SOURCES = Object.freeze([
  'NASA Apollo 11 — https://www.nasa.gov/mission/apollo-11/',
  'NASA Apollo 11 Mission Overview — https://www.nasa.gov/missions/apollo/apollo-11/apollo-11-mission-overview/',
]);

export function validRecord(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (Object.keys(value).some(key => !['version', 'chapter', 'note'].includes(key))) return null;
  if (value.version !== 1 || typeof value.note !== 'string' || value.note.length > MAX_NOTE) return null;
  if (value.chapter !== null && !CHAPTERS.some(chapter => chapter.id === value.chapter)) return null;
  return { version: 1, chapter: value.chapter, note: value.note };
}

export function decodeRecord(text) {
  if (text === null) return { record: null, problem: null };
  try {
    const record = validRecord(JSON.parse(text));
    return { record, problem: record ? null : 'invalid' };
  } catch { return { record: null, problem: 'invalid' }; }
}

export function recoverRecord(storage, key) {
  try { return decodeRecord(storage.getItem(key)); }
  catch { return { record: null, problem: 'unavailable' }; }
}

export function writeRecord(storage, key, value) {
  const record = validRecord(value);
  if (!record) return false;
  try {
    const encoded = JSON.stringify(record);
    storage.setItem(key, encoded);
    return storage.getItem(key) === encoded;
  } catch { return false; }
}

export function keepRecord(storage, value) {
  const record = validRecord(value);
  if (!record) return { checkpointSaved: false, draftSaved: false, recoveryVerified: false };
  const checkpointSaved = writeRecord(storage, KEPT_KEY, record);
  const draftSaved = writeRecord(storage, DRAFT_KEY, record);
  let recoveryVerified = draftSaved;
  if (checkpointSaved && !draftSaved) {
    try {
      storage.removeItem(DRAFT_KEY);
      recoveryVerified = storage.getItem(DRAFT_KEY) === null;
    } catch { recoveryVerified = false; }
  }
  return { checkpointSaved, draftSaved, recoveryVerified };
}

export function hasUnrecoveredChanges(value, baseline) {
  const current = validRecord(value);
  const safe = validRecord(baseline);
  if (!current || !safe) return true;
  const chapter = record => record.chapter || CHAPTERS[0].id;
  return current.note !== safe.note || chapter(current) !== chapter(safe);
}

export function portableText(value, activeChapter = 'departure') {
  const record = validRecord(value);
  if (!record) throw new TypeError('A valid reading record is required.');
  const chapter = CHAPTERS.find(item => item.id === (record.chapter || activeChapter)) || CHAPTERS[0];
  return [
    'DOWN TO THE MOON',
    'An independent Apollo 11 reader',
    '',
    `Chapter: ${chapter.number} / ${chapter.name}`,
    chapter.title,
    `Chapter date: ${chapter.date}`,
    '',
    'My reading note',
    record.note || '(No note entered.)',
    '',
    'Reading sources',
    ...SOURCES,
    '',
    'Original diagrams are schematic and not to scale. Paths and motion are conceptual, not a historical flight simulation.',
    'This file contains the current reading selection and note. It is a local text download, not an uploaded record.',
    '',
  ].join('\n');
}
