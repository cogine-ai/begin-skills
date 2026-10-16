import test from 'node:test';
import assert from 'node:assert/strict';
import { BASE_RECORDS, MAX_NOTE, MAX_BACKUP_BYTES, initialState, parseState, validateState, recordsFor, filteredRecords, queryRecords, countsFor, setDraft, cancelDraft, saveDraft, companions } from './model.mjs';
test('all nine immutable identities and supplied records are retained', () => {
  assert.equal(BASE_RECORDS.length, 9); assert.deepEqual(BASE_RECORDS.map(r => r.id), Array.from({length:9},(_,i)=>`T-${1042+i}`));
  assert.equal(BASE_RECORDS[3].species, 'Small-leaved lime'); assert.equal(BASE_RECORDS[8].location, 'Warehouse 2 courtyard');
  assert.deepEqual(countsFor(recordsFor(initialState())), {All:9,Due:3,Watch:3,Complete:3});
});
test('search, filters and counts refer to the same saved record set', () => {
  let state = {...initialState(), query: 'pEaRsOn'};
  assert.equal(queryRecords(state).length, 2); assert.deepEqual(countsFor(queryRecords(state)),{All:2,Due:1,Watch:1,Complete:0});
  assert.deepEqual(filteredRecords({...state,filter:'Watch'}).map(r=>r.id),['T-1043']);
  assert.equal(filteredRecords({...state,query:'missing'}).length,0);
});
test('drafts are distinct; save updates only local note/status and cancel restores saved work', () => {
  let state = setDraft(initialState(),'T-1042',{status:'Complete',note:'<img src=x onerror=alert(1)>'});
  assert.equal(recordsFor(state)[0].status,'Due');
  state = saveDraft(state,'T-1042','2026-10-15T12:00:00.000Z');
  assert.equal(state.edits['T-1042'].status,'Complete'); assert.equal(state.edits['T-1042'].note,'<img src=x onerror=alert(1)>');
  assert.equal(recordsFor(state)[0].inspected,'18 Sep 2026'); assert.equal(state.drafts['T-1042'],undefined);
  assert.deepEqual(countsFor(recordsFor(state)),{All:9,Due:2,Watch:3,Complete:4});
  state = setDraft(state,'T-1042',{status:'Watch',note:'temporary'});
  state = cancelDraft(state,'T-1042'); assert.equal(state.edits['T-1042'].status,'Complete');
  assert.deepEqual(parseState(JSON.stringify(state)),state);
});
test('same-place comparison follows actual named road pairs, not invented distance', () => {
  assert.deepEqual(companions(initialState(),'T-1042').map(r=>r.id),['T-1043']);
  assert.deepEqual(companions(initialState(),'T-1046').map(r=>r.id),['T-1048']);
  assert.equal(companions(initialState(),'T-1045').length,0);
});
test('malformed and hostile recovered state is rejected before use', () => {
  for (const raw of ['null','[]','{}','not json','{"__proto__":{"polluted":true}}']) assert.throws(()=>parseState(raw));
  for (const change of [s=>s.version=2,s=>s.selectedId='T-9999',s=>s.filter='Urgent',s=>s.query='x'.repeat(121),s=>s.edits['T-1042'].note='x'.repeat(4001),s=>s.edits['T-1042'].status='Unknown',s=>s.edits['T-1042'].editedAt='today',s=>s.edits['T-1042'].species='injected',s=>s.drafts['constructor']={status:'Due',note:'bad'},s=>s.drafts['T-1042']={status:'Due',note:42}]) {const s=initialState();change(s);assert.throws(()=>validateState(s));}
});
test('the full saved-record and draft capacity roundtrips in compact and downloaded JSON', () => {
  for (const character of ['漢', '\u0000', '\ud800']) {
    let state = initialState();
    for (const {id} of BASE_RECORDS) {
      state = setDraft(state, id, {status: 'Complete', note: character.repeat(MAX_NOTE)});
      state = saveDraft(state, id, '2026-10-15T12:00:00.000Z');
      state = setDraft(state, id, {status: 'Watch', note: character.repeat(MAX_NOTE)});
    }
    for (const raw of [JSON.stringify(state), JSON.stringify(state, null, 2)]) {
      assert.ok(Buffer.byteLength(raw, 'utf8') <= MAX_BACKUP_BYTES);
      assert.deepEqual(parseState(raw), state);
    }
  }
});
test('the import limit measures UTF-8 bytes and accepts its exact boundary', () => {
  const raw = JSON.stringify(initialState());
  assert.deepEqual(parseState(raw + ' '.repeat(MAX_BACKUP_BYTES - Buffer.byteLength(raw, 'utf8'))), initialState());
  assert.throws(() => parseState(raw + ' '.repeat(MAX_BACKUP_BYTES - Buffer.byteLength(raw, 'utf8') + 1)), /too large/);
  const multibyte = JSON.stringify({padding: '漢'.repeat(Math.floor(MAX_BACKUP_BYTES / 3))});
  assert.ok(multibyte.length < MAX_BACKUP_BYTES);
  assert.ok(Buffer.byteLength(multibyte, 'utf8') > MAX_BACKUP_BYTES);
  assert.throws(() => parseState(multibyte), /too large/);
});
