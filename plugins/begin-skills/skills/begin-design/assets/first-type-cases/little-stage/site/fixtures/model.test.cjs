const assert = require('node:assert/strict');
const model = require('../budget-model.js');

let state = model.prepare(model.edit(model.create(), { show: 'revolution', adults: '2', students: '1', note: 'Meet outside at 15:45' }));
assert.equal(model.isCurrent(state), true);
assert.deepEqual([state.prepared.show.title, state.prepared.partySize, state.prepared.adultLine, state.prepared.studentLine, state.prepared.total], ['A Very Small Revolution', 3, 36, 12, 48]);
const kept = model.snapshot(state);
const exported = model.text(state);
for (const line of ['Date: Saturday 24 October', 'Time: 16:00', 'Adults: 2 x USD18 = USD36', 'Students: 1 x USD12 = USD12', 'Party size: 3 tickets', 'Total: USD48', 'Meet outside at 15:45']) assert.ok(exported.includes(line));
state = model.edit(state, { adults: '3' });
assert.equal(state.dirty, true);
assert.equal(state.prepared.total, 48);
assert.throws(() => model.snapshot(state));
assert.throws(() => model.text(state));
state = model.edit(state, { adults: '2' });
assert.equal(state.dirty, true, 'reverting a field still requires preparation');
state = model.prepare(state);
assert.equal(model.isCurrent(state), true);
for (const patch of [{ adults: '' }, { students: '1.5' }, { adults: '-1' }, { adults: 'nine' }, { adults: '9' }, { adults: '8', students: '1' }, { adults: '0', students: '0' }, { show: 'unknown' }, { note: 'x'.repeat(301) }]) {
  const invalid = model.prepare(model.edit(state, patch));
  assert.ok(Object.keys(invalid.errors).length);
  assert.equal(invalid.prepared.total, 48, 'invalid entries retain prior preparation');
  for (const [key, value] of Object.entries(patch)) assert.equal(invalid.input[key], value);
  assert.equal(model.isCurrent(invalid), false);
}
const max = model.prepare(model.edit(model.create(), { adults: '8', students: '0', note: 'n'.repeat(300) }));
assert.equal(max.prepared.total, 144);
assert.equal(max.prepared.note.length, 300);
const studentOnly = model.prepare(model.edit(model.create(), { adults: '0', students: '8' }));
assert.equal(studentOnly.prepared.total, 96);
const restored = model.decode(JSON.stringify(kept));
assert.deepEqual(model.snapshot(restored), kept);
assert.equal(model.decode('{broken'), null);
assert.equal(model.decode(JSON.stringify({ ...kept, adults: -1 })), null);
assert.equal(model.decode(JSON.stringify({ ...kept, note: 'x'.repeat(301) })), null);
assert.equal(model.create().prepared, null);
console.log('PASS: USD48 fixture, text content, stale/reverted edits, 9 rejected inputs, both 8-ticket limits, 300-character note, kept recovery and corrupt storage');
