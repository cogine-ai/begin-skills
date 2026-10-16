import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS, DRAFT_KEY, KEPT_KEY, decodeRecord, recoverRecord, writeRecord, keepRecord, hasUnrecoveredChanges, portableText } from './model.mjs';

const record = { version: 1, chapter: 'landing', note: 'Two vehicles, one mission.\nRemember Michael Collins.' };
function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
    clear: () => values.clear(),
  };
}

test('draft and deliberate checkpoint remain distinct through guide-style recovery', () => {
  const storage = memoryStorage();
  assert.deepEqual(keepRecord(storage, record), { checkpointSaved: true, draftSaved: true, recoveryVerified: true });
  const current = { ...record, chapter: 'return', note: `${record.note}\nThen the Pacific.` };
  assert.equal(writeRecord(storage, DRAFT_KEY, current), true);
  assert.deepEqual(recoverRecord(storage, DRAFT_KEY).record, current);
  assert.deepEqual(recoverRecord(storage, KEPT_KEY).record, record);
});

test('a kept checkpoint replaces an unwritable stale draft as the recovery source', () => {
  const stale = { ...record, chapter: 'departure', note: 'An earlier draft.' };
  const storage = memoryStorage({ [DRAFT_KEY]: JSON.stringify(stale), unrelated: 'leave this alone' });
  const mutations = [];
  const setItem = storage.setItem;
  const removeItem = storage.removeItem;
  storage.setItem = (key, value) => {
    mutations.push(['set', key]);
    if (key === DRAFT_KEY) throw new Error('draft write denied');
    setItem(key, value);
  };
  storage.removeItem = key => { mutations.push(['remove', key]); removeItem(key); };

  assert.deepEqual(keepRecord(storage, record), { checkpointSaved: true, draftSaved: false, recoveryVerified: true });
  assert.deepEqual(mutations, [['set', KEPT_KEY], ['set', DRAFT_KEY], ['remove', DRAFT_KEY]]);
  assert.deepEqual(recoverRecord(storage, DRAFT_KEY), { record: null, problem: null });
  assert.deepEqual(recoverRecord(storage, KEPT_KEY).record, record);
  assert.equal(storage.getItem('unrelated'), 'leave this alone');
});

test('a checkpoint cannot verify recovery when stale draft removal throws or does nothing', () => {
  const stale = { ...record, note: 'An earlier draft.' };
  for (const cleanup of ['throw', 'no-op']) {
    const storage = memoryStorage({ [DRAFT_KEY]: JSON.stringify(stale), unrelated: 'leave this alone' });
    const setItem = storage.setItem;
    storage.setItem = (key, value) => {
      if (key === DRAFT_KEY) throw new Error('draft write denied');
      setItem(key, value);
    };
    storage.removeItem = () => { if (cleanup === 'throw') throw new Error('removal denied'); };

    assert.deepEqual(keepRecord(storage, record), { checkpointSaved: true, draftSaved: false, recoveryVerified: false }, cleanup);
    assert.deepEqual(recoverRecord(storage, DRAFT_KEY).record, stale, cleanup);
    assert.deepEqual(recoverRecord(storage, KEPT_KEY).record, record, cleanup);
    assert.equal(storage.getItem('unrelated'), 'leave this alone', cleanup);
  }
});

test('draft invalidation requires a readable empty storage slot', () => {
  const storage = memoryStorage({ [DRAFT_KEY]: JSON.stringify({ ...record, note: 'An earlier draft.' }) });
  const setItem = storage.setItem;
  const getItem = storage.getItem;
  const removeItem = storage.removeItem;
  let removed = false;
  storage.setItem = (key, value) => {
    if (key === DRAFT_KEY) throw new Error('draft write denied');
    setItem(key, value);
  };
  storage.removeItem = key => { removeItem(key); removed = true; };
  storage.getItem = key => {
    if (key === DRAFT_KEY && removed) throw new Error('readback denied');
    return getItem(key);
  };

  assert.deepEqual(keepRecord(storage, record), { checkpointSaved: true, draftSaved: false, recoveryVerified: false });
  assert.equal(removed, true);
});

test('a verified draft supports recovery when the deliberate checkpoint cannot be written', () => {
  const earlier = { ...record, note: 'An earlier checkpoint.' };
  const storage = memoryStorage({ [KEPT_KEY]: JSON.stringify(earlier) });
  const setItem = storage.setItem;
  storage.setItem = (key, value) => {
    if (key === KEPT_KEY) throw new Error('checkpoint write denied');
    setItem(key, value);
  };

  assert.deepEqual(keepRecord(storage, record), { checkpointSaved: false, draftSaved: true, recoveryVerified: true });
  assert.deepEqual(recoverRecord(storage, DRAFT_KEY).record, record);
  assert.deepEqual(recoverRecord(storage, KEPT_KEY).record, earlier);
});

test('two failed writes retain earlier recovery records and report unverified recovery', () => {
  const earlier = { ...record, note: 'An earlier reading.' };
  const encoded = JSON.stringify(earlier);
  const storage = memoryStorage({ [DRAFT_KEY]: encoded, [KEPT_KEY]: encoded, unrelated: 'leave this alone' });
  storage.setItem = () => { throw new Error('writes denied'); };

  assert.deepEqual(keepRecord(storage, record), { checkpointSaved: false, draftSaved: false, recoveryVerified: false });
  assert.equal(storage.getItem(DRAFT_KEY), encoded);
  assert.equal(storage.getItem(KEPT_KEY), encoded);
  assert.equal(storage.getItem('unrelated'), 'leave this alone');
});

test('invalid keep requests never mutate storage or unrelated values', () => {
  const encoded = JSON.stringify(record);
  const storage = memoryStorage({ [DRAFT_KEY]: encoded, [KEPT_KEY]: encoded, unrelated: 'leave this alone' });
  const mutations = [];
  storage.setItem = (...args) => mutations.push(['set', ...args]);
  storage.removeItem = (...args) => mutations.push(['remove', ...args]);
  storage.clear = () => mutations.push(['clear']);
  for (const value of [null, [], { ...record, version: 2 }, { ...record, chapter: 'unknown' }, { ...record, note: 'x'.repeat(3001) }, { ...record, extra: true }]) {
    assert.deepEqual(keepRecord(storage, value), { checkpointSaved: false, draftSaved: false, recoveryVerified: false });
  }
  assert.deepEqual(mutations, []);
  assert.equal(storage.getItem(DRAFT_KEY), encoded);
  assert.equal(storage.getItem(KEPT_KEY), encoded);
  assert.equal(storage.getItem('unrelated'), 'leave this alone');
});

test('clearing a recovered note remains an unrecovered change until the empty note is saved', () => {
  const empty = { ...record, note: '' };
  assert.equal(hasUnrecoveredChanges(empty, record), true);
  assert.equal(hasUnrecoveredChanges(record, empty), true);
  assert.equal(hasUnrecoveredChanges(empty, empty), false);
});

test('fresh and explicitly selected departure records share the same effective chapter', () => {
  const fresh = { version: 1, chapter: null, note: '' };
  const departure = { ...fresh, chapter: CHAPTERS[0].id };
  assert.equal(hasUnrecoveredChanges(departure, fresh), false);
  assert.equal(hasUnrecoveredChanges(fresh, departure), false);
  assert.equal(hasUnrecoveredChanges(fresh, fresh), false);
  assert.equal(hasUnrecoveredChanges({ ...departure, chapter: 'lunar-orbit' }, fresh), true);
  assert.equal(hasUnrecoveredChanges({ ...fresh, note: 'A new note.' }, fresh), true);
});

test('invalid current values or recovery baselines remain dirty', () => {
  for (const invalid of [null, [], { ...record, chapter: 'unknown' }, { ...record, note: 1 }, { ...record, extra: true }]) {
    assert.equal(hasUnrecoveredChanges(invalid, record), true);
    assert.equal(hasUnrecoveredChanges(record, invalid), true);
    assert.equal(hasUnrecoveredChanges(invalid, invalid), true);
  }
});

test('malformed, unsupported and oversized recovery never supplies a trusted record', () => {
  for (const value of ['{', 'null', '[]', '{"version":2,"chapter":"landing","note":"x"}', '{"version":1,"chapter":"unknown","note":"x"}', JSON.stringify({ ...record, note: 'x'.repeat(3001) }), JSON.stringify({ ...record, extra: true })]) {
    assert.deepEqual(decodeRecord(value), { record: null, problem: 'invalid' });
  }
});

test('denied storage and unconfirmed writes report failure while current export stays usable', () => {
  const denied = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  const dropped = { getItem() { return null; }, setItem() {} };
  assert.equal(recoverRecord(denied, DRAFT_KEY).problem, 'unavailable');
  assert.equal(writeRecord(denied, KEPT_KEY, record), false);
  assert.equal(writeRecord(dropped, KEPT_KEY, record), false);
  const text = portableText(record);
  assert.match(text, /03 \/ Landing/);
  assert.match(text, /Remember Michael Collins/);
  assert.match(text, /https:\/\/www.nasa.gov\/mission\/apollo-11\//);
});

test('export uses current values and every stable chapter identity', () => {
  for (const chapter of CHAPTERS) {
    const text = portableText({ version: 1, chapter: chapter.id, note: '<script>my own text</script>' });
    assert.ok(text.includes(`${chapter.number} / ${chapter.name}`));
    assert.ok(text.includes(chapter.date));
    assert.ok(text.includes('<script>my own text</script>'));
    assert.ok(text.includes('not to scale'));
  }
  assert.match(portableText({ version: 1, chapter: null, note: '' }, 'return'), /04 \/ Return/);
});
