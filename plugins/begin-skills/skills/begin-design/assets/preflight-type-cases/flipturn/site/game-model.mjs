export const PAIRS = Object.freeze(['Comet', 'Jellyfish', 'Lantern', 'Octopus']);
export const DEMO_BOARD = Object.freeze(['Comet', 'Jellyfish', 'Lantern', 'Octopus', 'Lantern', 'Comet', 'Octopus', 'Jellyfish']);
export const DEFAULT_LABEL = 'Zoë García’s first circuit';
export const STORAGE_KEY = 'flipturn.kept.v1';

function assertBoard(board) {
  if (!Array.isArray(board) || board.length !== 8 || PAIRS.some(name => board.filter(x => x === name).length !== 2)) throw new Error('A circuit needs eight tiles and exactly two of each pair.');
}
export function cleanLabel(label) {
  if (typeof label !== 'string' || !label.trim() || label.trim().length > 120) throw new Error('Use a practice name between 1 and 120 characters.');
  return label.trim();
}
export function boardFor(practice = 1) {
  if (!Number.isSafeInteger(practice) || practice < 1 || practice > 100000) throw new Error('Invalid circuit number.');
  const offset = (practice - 1) % 8;
  const board = [...DEMO_BOARD.slice(offset), ...DEMO_BOARD.slice(0, offset)];
  return (Math.floor((practice - 1) / 8) % 2) ? board.reverse() : board;
}
export function createGame({label = DEFAULT_LABEL, practice = 1, board = boardFor(practice)} = {}) {
  assertBoard(board);
  boardFor(practice);
  return {version:1, label:cleanLabel(label), practice, board:[...board], selected:[], matched:[], attempts:[], completed:false};
}
export function rename(game, label) { return {...game, label:cleanLabel(label)}; }
export function turn(game, tileId) {
  if (!Number.isInteger(tileId) || tileId < 1 || tileId > 8) return {game, kind:'invalid'};
  if (game.completed) return {game, kind:'completed'};
  if (game.matched.includes(tileId)) return {game, kind:'already-matched'};
  if (game.selected.includes(tileId)) return {game, kind:'same-tile'};
  if (game.selected.length === 2) return {game, kind:'dismiss-first'};
  if (!game.selected.length) return {game:{...game, selected:[tileId]}, kind:'first'};
  const ids = [game.selected[0], tileId];
  const names = ids.map(id => game.board[id-1]);
  const isMatch = names[0] === names[1];
  const matched = isMatch ? [...game.matched, ...ids].sort((a,b)=>a-b) : game.matched;
  const attempt = {move:game.attempts.length+1, tiles:ids, names, match:isMatch, pairs:matched.length/2};
  const next = {...game, selected:isMatch ? [] : ids, matched, attempts:[...game.attempts, attempt], completed:matched.length===8};
  return {game:next, kind:next.completed ? 'complete' : isMatch ? 'match' : 'mismatch'};
}
export function dismiss(game) {
  return game.selected.length === 2 ? {...game, selected:[]} : game;
}
export function restart(game) { return createGame({label:game.label, practice:game.practice, board:game.board}); }
export function newPractice(game) { return createGame({label:game.label, practice:game.practice === 100000 ? 1 : game.practice+1}); }
export function completeRecord(game) {
  if (!game.completed || game.matched.length !== 8) throw new Error('Finish all four pairs before keeping a circuit.');
  return {version:1, label:game.label, practice:game.practice, board:[...game.board], attempts:game.attempts.map(a=>({...a,tiles:[...a.tiles],names:[...a.names]})), finalMoves:game.attempts.length, finalPairs:4, completed:true};
}
export function recoverRecord(record) {
  if (!record || !Number.isSafeInteger(record.practice) || record.practice < 1 || record.practice > 100000 || record.version !== 1 || record.completed !== true || record.finalPairs !== 4 || !Array.isArray(record.attempts) || record.attempts.length < 4 || record.attempts.length > 10000 || record.finalMoves !== record.attempts.length) throw new Error('The kept circuit is incomplete or invalid.');
  let game = createGame({label:record.label, practice:record.practice, board:record.board});
  for (const [index, attempt] of record.attempts.entries()) {
    if (!attempt || attempt.move !== index+1 || !Array.isArray(attempt.tiles) || attempt.tiles.length !== 2 || attempt.tiles[0] === attempt.tiles[1]) throw new Error('An attempt is invalid.');
    const first = turn(game, attempt.tiles[0]);
    if (first.kind !== 'first') throw new Error('An attempt uses an unavailable tile.');
    const second = turn(first.game, attempt.tiles[1]);
    if (!['match','mismatch','complete'].includes(second.kind)) throw new Error('An attempt uses an unavailable tile.');
    game = second.game;
    const calculated = game.attempts.at(-1);
    if (JSON.stringify(calculated) !== JSON.stringify({move:attempt.move, tiles:attempt.tiles, names:attempt.names, match:attempt.match, pairs:attempt.pairs})) throw new Error('An attempt disagrees with its tiles.');
    game = dismiss(game);
  }
  if (!game.completed) throw new Error('The kept circuit does not finish all four pairs.');
  return game;
}
export function parseRecord(text) { return completeRecord(recoverRecord(JSON.parse(text))); }
export function textRecord(game) {
  const record=completeRecord(game);
  return ['FLIPTURN — complete circuit', record.label, `Circuit ${record.practice}`, '', ...record.attempts.map(a=>`${String(a.move).padStart(2,'0')}. Tiles ${a.tiles.join(' + ')} — ${a.names.join(' + ')} — ${a.match ? 'Pair found' : 'No match'} — ${a.pairs} / 4 pairs`), '', `Final moves: ${record.finalMoves}`, 'Final pairs: 4 / 4', 'Completed: yes', '', `Board: ${record.board.map((name,i)=>`${i+1} ${name}`).join('; ')}`, ''].join('\n');
}
