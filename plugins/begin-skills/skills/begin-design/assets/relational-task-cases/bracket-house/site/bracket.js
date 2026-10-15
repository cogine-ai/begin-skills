(function () {
  'use strict';
  const M = window.BracketModel;
  let state = M.initialState(), errorsVisible = false;
  const $ = id => document.getElementById(id);
  const storage = {getItem: key => window.localStorage.getItem(key), setItem: (key, value) => window.localStorage.setItem(key, value), removeItem: key => window.localStorage.removeItem(key)};
  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function storageMessage(text, failed) {
    $('storage-status').textContent = text;
    $('storage-status').classList.toggle('storage-error', Boolean(failed));
  }
  function renderMatch(match) {
    const pair = M.participants(state.inputs, match.id), ready = pair.every(Boolean), winner = state.inputs.winners[match.id];
    const group = node('fieldset', 'match' + (ready ? ' ready' : ' pending') + (winner ? ' decided' : ''));
    group.id = 'match-' + match.id;
    group.tabIndex = -1;
    group.setAttribute('aria-describedby', 'help-' + match.id + ' error-' + match.id);
    const legend = node('legend', 'match-legend');
    legend.append(node('span', 'match-id', match.id), node('span', 'match-destination', match.next ? '→ ' + match.next : '→ Champion'));
    group.append(legend);
    const help = node('p', 'match-help', match.round === 'Quarterfinal' ? 'Choose the winner' : match.sources.map(id => 'Winner of ' + id).join(' vs '));
    help.id = 'help-' + match.id;
    group.append(help);
    pair.forEach((team, index) => {
      if (!team || !ready) {
        const wait = node('div', 'team-choice waiting');
        wait.append(node('span', 'team-name', team || 'Winner of ' + match.sources[index]), node('span', 'team-symbol', '—'));
        group.append(wait);
        return;
      }
      const label = node('label', 'team-choice' + (winner === team ? ' selected' : ''));
      const input = document.createElement('input');
      input.type = 'radio'; input.name = match.id; input.value = team; input.checked = winner === team;
      input.setAttribute('aria-label', team + ', winner of ' + match.id);
      input.addEventListener('change', function () {
        const result = M.chooseWinner(state, match.id, team);
        state = result.state;
        render();
        const newRadio = Array.from(document.getElementsByName(match.id)).find(item => item.value === team);
        if (newRadio) newRadio.focus();
        $('edit-status').textContent = team + ' wins ' + match.id + '.' + (result.cleared.length ? ' Cleared dependent choices: ' + result.cleared.join(', ') + '. Choose those winners again.' : '');
      });
      const symbol = node('span', 'team-symbol', winner === team ? '✓' : '↗');
      symbol.setAttribute('aria-hidden', 'true');
      label.append(input, node('span', 'team-name', team), symbol);
      group.append(label);
    });
    const error = node('p', 'field-error match-error'); error.id = 'error-' + match.id; group.append(error);
    return group;
  }
  function renderResult() {
    const ready = M.canUsePrepared(state), result = state.prepared;
    $('keep').disabled = !ready;
    $('download').disabled = !ready;
    $('prepared-result').hidden = !result;
    $('exact-details').hidden = !result;
    $('result-state').className = 'result-state' + (result ? state.stale ? ' stale' : ' fresh' : '');
    $('result-state').textContent = result ? state.stale ? 'Stale — prepare again' : 'Prepared from current choices' : 'Not prepared';
    $('result-message').textContent = result ? state.stale ? 'This is your earlier result. Current inputs have changed. Prepare the current valid bracket before keeping or downloading.' : 'All seven matches are complete. Keep this result in this browser or download its exact text.' : 'Your complete bracket appears here after preparation.';
    $('prepared-result').replaceChildren();
    if (!result) { $('exact-text').textContent = ''; return; }
    const header = node('div', 'champion-result');
    const titleBlock = node('div', 'result-identity');
    titleBlock.append(node('p', 'kicker', 'Event / result'), node('h3', 'prepared-title', result.event));
    const champion = node('div', 'champion-name');
    champion.append(node('p', 'kicker', 'Champion'), node('p', 'champion-display', result.champion));
    header.append(titleBlock, champion);
    $('prepared-result').append(header);
    const rounds = node('div', 'result-rounds');
    ['Quarterfinal', 'Semifinal', 'Final'].forEach(round => {
      const section = node('section', 'result-round');
      section.append(node('h4', '', round === 'Final' ? 'THE FINAL' : round.toUpperCase() + 'S'));
      result.matches.filter(match => match.round === round).forEach(match => {
        const record = node('div', 'result-match');
        record.append(node('p', 'result-match-id', match.id + (match.next ? ' → ' + match.next : ' → Champion')));
        const pairing = node('p', 'result-pairing');
        pairing.append(node('span', '', match.participants[0]), node('span', 'result-vs', ' vs '), node('span', '', match.participants[1]));
        record.append(pairing, node('p', 'result-winner', 'Winner: ' + match.winner));
        if (match.round !== 'Quarterfinal') record.append(node('p', 'result-source', match.sources.map(id => 'Winner of ' + id).join(' + ')));
        section.append(record);
      });
      rounds.append(section);
    });
    $('prepared-result').append(rounds);
    const note = node('div', 'prepared-note'); note.append(node('h4', '', 'NOTE'), node('p', '', result.note || 'No note added.'));
    $('prepared-result').append(note);
    $('exact-text').textContent = result.text;
  }
  function renderErrors() {
    const errors = errorsVisible ? M.validate(state.inputs) : [];
    const byField = Object.fromEntries(errors.map(error => [error.field, error.message]));
    ['event', 'note'].forEach(field => {
      $(field + '-error').textContent = byField[field] || '';
      $(field).setAttribute('aria-invalid', String(Boolean(byField[field])));
    });
    M.MATCHES.forEach(match => {
      $('error-' + match.id).textContent = byField[match.id] || '';
      $('match-' + match.id).setAttribute('aria-invalid', String(Boolean(byField[match.id])));
    });
    const summary = $('error-summary');
    summary.hidden = !errors.length;
    summary.replaceChildren();
    if (errors.length) {
      summary.append(node('strong', '', 'The bracket is not ready yet'));
      const list = node('ul');
      errors.forEach(error => {
        const item = node('li'), link = node('a', '', error.message);
        const target = ['event', 'note'].includes(error.field) ? error.field : 'match-' + error.field;
        link.href = '#' + target;
        link.addEventListener('click', () => $(target).focus());
        item.append(link); list.append(item);
      });
      summary.append(list);
    }
  }
  function drawConnections() {
    const svg = $('branch-links');
    svg.replaceChildren();
    if (window.matchMedia('(max-width:640px)').matches) return;
    const board = $('bracket-board').getBoundingClientRect();
    svg.setAttribute('viewBox', '0 0 ' + board.width + ' ' + board.height);
    const bounds = id => {
      const box = $('match-' + id).getBoundingClientRect();
      return {left: box.left - board.left, right: box.right - board.left, center: box.top - board.top + box.height / 2};
    };
    [['Q1', 'Q2', 'S1'], ['Q3', 'Q4', 'S2'], ['S1', 'S2', 'F1']].forEach(ids => {
      const first = bounds(ids[0]), second = bounds(ids[1]), target = bounds(ids[2]);
      const join = (Math.max(first.right, second.right) + target.left) / 2;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('data-feeders', ids[0] + '+' + ids[1]);
      path.setAttribute('data-target', ids[2]);
      path.setAttribute('d', 'M ' + first.right + ' ' + first.center + ' H ' + join + ' V ' + second.center + ' H ' + second.right + ' M ' + join + ' ' + target.center + ' H ' + target.left);
      svg.append(path);
    });
  }
  function render() {
    ['event', 'note'].forEach(field => { if ($(field).value !== state.inputs[field]) $(field).value = state.inputs[field]; });
    $('progress').textContent = M.completeCount(state.inputs) + ' / 7';
    ['q', 's', 'f'].forEach(round => $('round-' + round).replaceChildren());
    M.MATCHES.forEach(match => $('round-' + match.id[0].toLowerCase()).append(renderMatch(match)));
    renderResult(); renderErrors();
    drawConnections();
  }
  ['event', 'note'].forEach(field => $(field).addEventListener('input', () => {
    state = M.editField(state, field, $(field).value);
    renderResult(); renderErrors();
    $('edit-status').textContent = state.prepared ? 'Your earlier result is now stale. Prepare again after completing the current choices.' : 'Event details updated. Complete the bracket, then prepare it.';
  }));
  $('example').addEventListener('click', () => {
    state = M.loadExample(state); errorsVisible = false; render();
    $('edit-status').textContent = 'Example loaded: Last round at the warehouse. Seven winners are selected. Choose Prepare bracket to make the result.';
  });
  $('bracket-form').addEventListener('submit', event => {
    event.preventDefault();
    const result = M.prepare(state); state = result.state; errorsVisible = !result.ok; render();
    if (result.ok) {
      $('edit-status').textContent = 'Bracket prepared. Champion: ' + state.prepared.champion + '.';
      $('result-heading').tabIndex = -1; $('result-heading').focus();
    } else {
      $('edit-status').textContent = 'Preparation did not replace the earlier result. Resolve the listed fields and matches.';
      const first = result.errors[0].field;
      $(['event', 'note'].includes(first) ? first : 'match-' + first).focus();
    }
  });
  $('download').addEventListener('click', () => {
    if (!M.canUsePrepared(state)) return;
    const file = new Blob([state.prepared.text], {type: 'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(file), link = document.createElement('a');
    link.href = url;
    link.download = (state.prepared.event.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'bracket-house') + '-bracket.txt';
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('edit-status').textContent = 'Exact text download requested. The file includes all seven match pairings, winners, relationships, champion and note.';
  });
  $('keep').addEventListener('click', () => {
    if (!M.canUsePrepared(state)) return;
    const result = M.keep(storage, state);
    storageMessage(result.ok ? 'Kept in this browser: ' + state.prepared.event + '. Reload or Recover kept work to restore these exact inputs and this prepared result.' : 'The browser could not keep this result. Current work is still here. Download exact text for a portable copy. ' + result.message, !result.ok);
  });
  $('recover').addEventListener('click', () => {
    const result = M.readKept(storage);
    if (!result.ok) { storageMessage('Kept work could not be recovered. Current work is unchanged. ' + result.message, true); return; }
    if (!result.exists) { storageMessage('There is no kept copy in this browser. Current work is unchanged.', false); return; }
    state = result.state; errorsVisible = false; render();
    storageMessage('Recovered the kept inputs and prepared result: ' + state.prepared.event + '.', false);
    $('edit-status').textContent = 'Kept work recovered. Any current edits were replaced by the deliberately kept copy.';
  });
  $('reset').addEventListener('click', () => {
    state = M.initialState(); errorsVisible = false; render();
    $('edit-status').textContent = 'Current work reset. A kept browser copy is preserved; use Recover kept work to bring it back.';
    $('event').focus();
  });
  $('forget').addEventListener('click', () => {
    const result = M.forget(storage);
    storageMessage(result.ok ? 'Kept copy removed from this browser. Your current inputs and result are unchanged.' : 'The browser could not remove the kept copy. Your current inputs and result are unchanged. ' + result.message, !result.ok);
  });
  const recovered = M.readKept(storage);
  if (recovered.ok && recovered.exists) {
    state = recovered.state;
    storageMessage('Reload restored the deliberately kept inputs and result: ' + state.prepared.event + '.', false);
    $('edit-status').textContent = 'Kept work restored. Edits become stale until you prepare again.';
  } else if (recovered.ok) storageMessage('No kept copy yet. Prepare a complete bracket, then choose Keep in this browser.', false);
  else storageMessage('A kept copy could not be loaded. The page starts empty. ' + recovered.message, true);
  render();
  if (window.ResizeObserver) new ResizeObserver(drawConnections).observe($('bracket-board'));
  window.addEventListener('resize', drawConnections);
  if (document.fonts) document.fonts.ready.then(drawConnections);
})();
