import {createGame, turn, dismiss, rename, restart, newPractice, completeRecord, recoverRecord, parseRecord, textRecord, STORAGE_KEY} from './game-model.mjs';

const $ = id => document.getElementById(id);
let game = createGame();
let kept = null;
let hasStored = false;
let storageMessage = '';
let pending = null;
const tiles = [...document.querySelectorAll('[data-tile]')];

function announce(message) { $('status').textContent = message; }
function loadKept() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    hasStored = raw !== null;
    if (raw !== null) {
      try { kept = parseRecord(raw); }
      catch { storageMessage = 'The stored circuit cannot be read. You can explicitly forget it or replace it with a new completed circuit.'; }
    }
  } catch { storageMessage = 'This browser blocks local storage. You can still play and download a completed record.'; }
}
function renderKept() {
  $('recover').disabled = !kept;
  $('forget').disabled = !hasStored;
  $('kept-name').textContent = kept ? kept.label : hasStored ? 'A stored circuit needs attention.' : 'No kept circuit yet.';
  $('kept-summary').textContent = storageMessage || (kept ? `Circuit ${String(kept.practice).padStart(2,'0')} · ${kept.finalMoves} moves · 4 / 4 pairs · Completed. Recover it to read every attempt.` : 'Finish four pairs, then choose Keep this circuit. Your record will wait in this browser.');
}
function renderRecord() {
  $('record-empty').hidden = game.attempts.length > 0;
  $('record-summary').textContent = game.attempts.length ? `${game.attempts.length} ${game.attempts.length===1 ? 'move' : 'moves'} · ${game.matched.length/2} / 4 pairs${game.completed ? ' · Completed' : ' · In progress'}` : 'Your record begins with two tiles.';
  const rows = game.attempts.map(attempt => {
    const row = document.createElement('li'); row.className = 'attempt';
    const index = document.createElement('span'); index.className = 'attempt-index'; index.textContent = String(attempt.move).padStart(2,'0');
    const names = document.createElement('span'); names.className = 'attempt-names'; names.textContent = attempt.names.join(' + ');
    const ids = document.createElement('span'); ids.className = 'attempt-tiles'; ids.textContent = `Tiles ${attempt.tiles.join(' + ')}`; names.append(ids);
    const result = document.createElement('span'); result.className = 'attempt-result'; result.textContent = attempt.match ? 'Pair found' : 'No match';
    const pairs = document.createElement('span'); pairs.textContent = `${attempt.pairs} / 4 pairs`; result.append(pairs);
    row.append(index,names,result); return row;
  });
  $('attempt-list').replaceChildren(...rows);
  $('record-end').hidden = !game.completed;
  $('record-end').textContent = game.completed ? `Completed · Final moves: ${game.attempts.length} · Final pairs: 4 / 4. Every attempt is recorded above.` : '';
}
function render() {
  $('practice-name').textContent = game.label;
  $('circuit-meta').textContent = `Circuit ${String(game.practice).padStart(2,'0')} · Eight tiles`;
  $('moves').textContent = String(game.attempts.length).padStart(2,'0');
  $('pairs').textContent = `${game.matched.length/2} / 4`;
  for (const tile of tiles) {
    const id = Number(tile.dataset.tile);
    const match = game.matched.includes(id);
    const up = match || game.selected.includes(id);
    const name = game.board[id-1];
    tile.disabled = match;
    tile.classList.toggle('is-up',up); tile.classList.toggle('is-match',match);
    tile.setAttribute('aria-pressed',String(up));
    tile.setAttribute('aria-label',`Tile ${id}, ${up ? name+', '+(match ? 'matched' : 'revealed') : 'face down'}`);
    tile.querySelector('.tile-back').hidden = up;
    const front = tile.querySelector('.tile-front'); front.hidden = !up;
    front.querySelector('img').src = `art/${name.toLowerCase()}.svg`;
    front.querySelector('.pair-name').textContent = name;
    front.querySelector('.tile-state').textContent = match ? 'Matched' : 'Revealed';
  }
  $('mismatch-actions').hidden = game.selected.length !== 2;
  $('completion').hidden = !game.completed;
  $('completion-copy').textContent = game.completed ? `${game.label} is complete in ${game.attempts.length} moves. Comet, Jellyfish, Lantern and Octopus are all paired. Keep this circuit or download its full record.` : '';
  renderRecord(); renderKept();
}
function closeConfirmation() {
  pending = null; $('confirmation').hidden = true;
}
function ask(copy,label,action) {
  pending = action; $('confirm-copy').textContent = copy; $('confirm-action').textContent = label; $('confirmation').hidden = false;
  $('confirm-action').focus();
}
function keepCurrent() {
  try {
    const record = completeRecord(game);
    const text = JSON.stringify(record);
    localStorage.setItem(STORAGE_KEY,text);
    if (localStorage.getItem(STORAGE_KEY) !== text) throw new Error('Storage readback did not match.');
    kept = record; hasStored = true; storageMessage = '';
    renderKept(); announce('This complete circuit is kept in this browser. Starting another practice will leave it here.');
  } catch { announce('This circuit could not be kept in this browser. Your current record is still here; use Download record for a copy.'); }
}
function recoverKept() {
  if (!kept) return;
  try {
    game = recoverRecord(kept); $('practice-label').value = game.label;
    render(); announce(`Recovered ${game.label}. All ${game.attempts.length} attempts and its completion are shown. The kept copy remains.`);
    $('completion').focus();
  } catch { announce('This kept circuit cannot be recovered. Current play remains available.'); }
}
function forgetKept() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    if (localStorage.getItem(STORAGE_KEY) !== null) throw new Error('Stored copy remains.');
    kept = null; hasStored = false; storageMessage = '';
    renderKept(); announce('The kept circuit was forgotten. Your current play and visible record remain.');
  } catch { announce('The kept circuit could not be forgotten in this browser. It has not been marked removed.'); }
}
for (const tile of tiles) tile.addEventListener('click',()=>{
  closeConfirmation();
  const before = game;
  const result = turn(game,Number(tile.dataset.tile)); game = result.game;
  render();
  const name = game.board[Number(tile.dataset.tile)-1];
  if (result.kind === 'first') announce(`${name} revealed. Choose a different tile.`);
  else if (result.kind === 'same-tile') announce('Choose a different tile. A tile cannot match itself; no move was counted.');
  else if (result.kind === 'dismiss-first') announce('Look at the two revealed tiles, then choose Turn these tiles back before trying another pair.');
  else if (result.kind === 'mismatch') announce(`${game.attempts.at(-1).names.join(' and ')} do not match. Move ${game.attempts.length} is recorded. Take a look, then turn these tiles back.`);
  else if (result.kind === 'match') {
    announce(`${name} pair found. ${game.matched.length/2} of four pairs; ${game.attempts.length} moves.`);
    const next = tiles.find(t=>!t.disabled); next?.focus();
  } else if (result.kind === 'complete') {
    announce(`All four pairs are found in ${game.attempts.length} moves. Your complete record includes every attempt. You can keep this circuit now.`);
    $('completion').focus();
  } else if (result.kind === 'already-matched') announce('This pair is already matched. Choose a face-down tile.');
  else if (before === game && result.kind === 'completed') announce('This circuit is complete. Keep its record or start another practice.');
});
$('dismiss').addEventListener('click',()=>{
  const firstId = game.selected[0]; game = dismiss(game); render();
  announce('Both tiles are face down again. Your attempt remains recorded. Choose another pair.');
  if (firstId) $(`tile-${firstId}`).focus();
});
$('restart').addEventListener('click',()=>{
  closeConfirmation(); game=restart(game); render(); announce('This circuit restarted with the same board. Current attempts are cleared; the kept record remains.'); $('tile-1').focus();
});
$('new-practice').addEventListener('click',()=>{
  closeConfirmation(); game=newPractice(game); render(); announce(`Circuit ${game.practice} started with a new tile arrangement. The kept record remains. Choose your first tile.`); $('tile-1').focus();
});
$('rename-form').addEventListener('submit',event=>{
  event.preventDefault();
  try {
    game=rename(game,$('practice-label').value); $('practice-label').value=game.label;
    $('name-error').hidden=true; $('rename-details').open=false; render(); announce(`Practice name changed to ${game.label}. A kept copy keeps its existing name until you deliberately replace it.`);
    $('rename-details').querySelector('summary').focus();
  } catch(error) { $('name-error').textContent=error.message; $('name-error').hidden=false; }
});
$('keep').addEventListener('click',()=>{
  if (hasStored) ask('A circuit is already stored here. Replacing it removes that kept copy and stores this completed circuit instead.','Replace kept circuit',keepCurrent);
  else keepCurrent();
});
$('recover').addEventListener('click',()=>{
  if (game.attempts.length || game.selected.length) ask('Recovering replaces the current practice with the kept completed circuit. The kept copy remains.','Recover and replace current play',recoverKept);
  else recoverKept();
});
$('forget').addEventListener('click',()=>ask('Forget the stored circuit in this browser? The current play and its visible record will stay.','Forget this kept circuit',forgetKept));
$('confirm-action').addEventListener('click',()=>{ const action=pending; closeConfirmation(); action?.(); if (action===keepCurrent) $('keep').focus(); if (action===forgetKept) $('restart').focus(); });
$('cancel-action').addEventListener('click',()=>{ closeConfirmation(); announce('Cancelled. Current play and the kept record are unchanged.'); $('recover').disabled ? $('restart').focus() : $('recover').focus(); });
$('download').addEventListener('click',()=>{
  if (!game.completed) return;
  const blob = new Blob([textRecord(game)],{type:'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href=url; link.download=`flipturn-circuit-${game.practice}.txt`; document.body.append(link); link.click(); link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  announce('The complete text record was offered for download. Your kept circuit is unchanged.');
});
loadKept(); render();
