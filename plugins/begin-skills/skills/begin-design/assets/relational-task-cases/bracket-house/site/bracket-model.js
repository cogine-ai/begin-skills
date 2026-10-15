(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BracketModel = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const TEAMS = Object.freeze(['Northbank Afterhours', 'Black Kite Assembly', 'Orbit Eight', 'Élan Arcade', 'Static Garden', 'Valley Circuit', 'Paper Tigers', 'Neon Harbour']);
  const MATCHES = Object.freeze([
    {id: 'Q1', round: 'Quarterfinal', sources: [TEAMS[0], TEAMS[1]], next: 'S1'},
    {id: 'Q2', round: 'Quarterfinal', sources: [TEAMS[2], TEAMS[3]], next: 'S1'},
    {id: 'Q3', round: 'Quarterfinal', sources: [TEAMS[4], TEAMS[5]], next: 'S2'},
    {id: 'Q4', round: 'Quarterfinal', sources: [TEAMS[6], TEAMS[7]], next: 'S2'},
    {id: 'S1', round: 'Semifinal', sources: ['Q1', 'Q2'], next: 'F1'},
    {id: 'S2', round: 'Semifinal', sources: ['Q3', 'Q4'], next: 'F1'},
    {id: 'F1', round: 'Final', sources: ['S1', 'S2'], next: null}
  ]);
  const BY_ID = Object.fromEntries(MATCHES.map(match => [match.id, match]));
  const STORAGE_KEY = 'bracket-house.kept.v1';
  function blankInputs() { return {event: '', note: '', winners: Object.fromEntries(MATCHES.map(m => [m.id, '']))}; }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function initialState() { return {inputs: blankInputs(), prepared: null, stale: false}; }
  function exampleInputs() {
    return {event: 'Last round at the warehouse', note: 'Fictional local results for the demo.', winners: {Q1: TEAMS[0], Q2: TEAMS[3], Q3: TEAMS[5], Q4: TEAMS[7], S1: TEAMS[3], S2: TEAMS[5], F1: TEAMS[3]}};
  }
  function participants(inputs, id) {
    const match = BY_ID[id];
    if (!match) throw new Error('Unknown match.');
    return match.sources.map(source => {
      if (!BY_ID[source]) return source;
      const pair = participants(inputs, source);
      const winner = inputs && inputs.winners && inputs.winners[source];
      return pair.every(Boolean) && pair.includes(winner) ? winner : null;
    });
  }
  function completeCount(inputs) {
    return MATCHES.filter(match => {
      const pair = participants(inputs, match.id);
      return pair.every(Boolean) && pair.includes(inputs.winners[match.id]);
    }).length;
  }
  function validate(inputs) {
    const errors = [];
    if (!inputs || typeof inputs.event !== 'string' || typeof inputs.note !== 'string' || !inputs.winners || typeof inputs.winners !== 'object' || Array.isArray(inputs.winners)) {
      return [{field: 'event', message: 'This result has an invalid input structure.'}];
    }
    if (!inputs.event.trim()) errors.push({field: 'event', message: 'Enter an event or result name.'});
    if (inputs.event.length > 80) errors.push({field: 'event', message: 'Use at most 80 characters for the event or result name.'});
    if (inputs.note.length > 400) errors.push({field: 'note', message: 'Use at most 400 characters for the note.'});
    MATCHES.forEach(match => {
      const pair = participants(inputs, match.id);
      const choice = inputs.winners[match.id];
      if (!pair.every(Boolean)) errors.push({field: match.id, message: 'Finish ' + match.sources.join(' and ') + ' before choosing ' + match.id + '.'});
      else if (!pair.includes(choice)) errors.push({field: match.id, message: 'Choose an actual participant as the winner of ' + match.id + '.'});
    });
    return errors;
  }
  function snapshot(inputs) {
    const errors = validate(inputs);
    if (errors.length) throw new Error(errors[0].message);
    const matches = MATCHES.map(match => ({...clone(match), participants: participants(inputs, match.id), winner: inputs.winners[match.id]}));
    const event = inputs.event.trim(), note = inputs.note.trim();
    const lines = ['BRACKET HOUSE — TOURNAMENT RESULT', 'Event: ' + event, 'Format: Eight teams · Single elimination · Seven matches', '', 'QUARTERFINALS'];
    matches.forEach((match, index) => {
      if (index === 4) lines.push('', 'SEMIFINALS');
      if (index === 6) lines.push('', 'FINAL');
      lines.push(match.id + ' | ' + match.participants.join(' vs '));
      lines.push('Sources: ' + (match.round === 'Quarterfinal' ? 'Fixed teams' : match.sources.map(id => 'Winner of ' + id).join(' + ')));
      lines.push('Winner: ' + match.winner);
      lines.push('Advances to: ' + (match.next || 'Champion'));
    });
    lines.push('', 'Champion: ' + inputs.winners.F1, '', 'Note:', note || '(No note)', '');
    return {inputs: clone(inputs), event, note, champion: inputs.winners.F1, matches, text: lines.join('\n')};
  }
  function editField(state, field, value) {
    if (!['event', 'note'].includes(field) || typeof value !== 'string') throw new Error('Unknown text field.');
    const next = clone(state);
    next.inputs[field] = value;
    next.stale = Boolean(next.prepared);
    return next;
  }
  function chooseWinner(state, id, winner) {
    if (!BY_ID[id]) throw new Error('Unknown match.');
    const pair = participants(state.inputs, id);
    if (winner !== '' && (!pair.every(Boolean) || !pair.includes(winner))) throw new Error('The winner must be an actual participant.');
    const next = clone(state), cleared = [];
    if (next.inputs.winners[id] !== winner) {
      next.inputs.winners[id] = winner;
      let dependent = BY_ID[id].next;
      while (dependent) {
        if (next.inputs.winners[dependent]) cleared.push(dependent);
        next.inputs.winners[dependent] = '';
        dependent = BY_ID[dependent].next;
      }
    }
    next.stale = Boolean(next.prepared);
    return {state: next, cleared};
  }
  function loadExample(state) { return {inputs: exampleInputs(), prepared: state.prepared ? clone(state.prepared) : null, stale: Boolean(state.prepared)}; }
  function prepare(state) {
    const errors = validate(state.inputs);
    if (errors.length) return {ok: false, state: {...clone(state), stale: Boolean(state.prepared)}, errors};
    return {ok: true, state: {inputs: clone(state.inputs), prepared: snapshot(state.inputs), stale: false}, errors: []};
  }
  function canUsePrepared(state) { return Boolean(state.prepared && !state.stale && validate(state.inputs).length === 0 && JSON.stringify(state.inputs) === JSON.stringify(state.prepared.inputs)); }
  function serializeKept(state) {
    if (!canUsePrepared(state)) throw new Error('Prepare the current valid bracket before keeping it.');
    return JSON.stringify({schema: 'bracket-house/v1', inputs: clone(state.inputs), prepared: clone(state.prepared)});
  }
  function parseKept(text) {
    let record;
    try { record = JSON.parse(text); } catch (_) { throw new Error('The kept copy is corrupt and was not recovered.'); }
    if (!record || record.schema !== 'bracket-house/v1' || !record.prepared || validate(record.inputs).length) throw new Error('The kept copy is invalid and was not recovered.');
    const expected = snapshot(record.inputs);
    if (JSON.stringify(record.prepared) !== JSON.stringify(expected)) throw new Error('The kept copy does not match its inputs and was not recovered.');
    return {inputs: clone(record.inputs), prepared: expected, stale: false};
  }
  function readKept(storage) {
    try {
      const text = storage.getItem(STORAGE_KEY);
      if (text === null) return {ok: true, exists: false};
      return {ok: true, exists: true, state: parseKept(text)};
    } catch (error) { return {ok: false, message: error.message || 'Browser storage could not be read.'}; }
  }
  function keep(storage, state) {
    try {
      const text = serializeKept(state);
      storage.setItem(STORAGE_KEY, text);
      if (storage.getItem(STORAGE_KEY) !== text) throw new Error('The browser did not retain the kept copy.');
      return {ok: true};
    } catch (error) { return {ok: false, message: error.message || 'Browser storage could not be written.'}; }
  }
  function forget(storage) {
    try {
      storage.removeItem(STORAGE_KEY);
      if (storage.getItem(STORAGE_KEY) !== null) throw new Error('The browser did not remove the kept copy.');
      return {ok: true};
    } catch (error) { return {ok: false, message: error.message || 'Browser storage could not be cleared.'}; }
  }
  return {TEAMS, MATCHES, STORAGE_KEY, blankInputs, initialState, exampleInputs, participants, completeCount, validate, snapshot, editField, chooseWinner, loadExample, prepare, canUsePrepared, serializeKept, parseKept, readKept, keep, forget};
});
