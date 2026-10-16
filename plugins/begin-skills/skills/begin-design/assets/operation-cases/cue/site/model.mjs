export const STORAGE_KEY = 'begin.cue.rehearsal.v1';
export const defaults = () => [
  { id: 'cue-1', name: 'Welcome', durationSeconds: 35 },
  { id: 'cue-2', name: 'Story', durationSeconds: 50 },
  { id: 'cue-3', name: 'Demonstration', durationSeconds: 65 },
  { id: 'cue-4', name: 'Close', durationSeconds: 30 },
];
export const asDraft = programme => programme.map(cue => ({ name: cue.name, duration: String(cue.durationSeconds) }));
export function fresh(programme = defaults()) {
  return { version: 1, programme, draft: asDraft(programme), status: 'idle', index: 0, cueElapsedMs: 0, elapsedMs: 0, anchorMs: null };
}
export function parseDraft(draft) {
  const errors = draft.map(cue => {
    if (!cue.name.trim()) return 'Give this cue a name.';
    if (cue.name.length > 60) return 'Use a name of 60 characters or fewer.';
    if (!/^\d+$/.test(cue.duration)) return 'Enter a whole number of seconds.';
    const duration = Number(cue.duration);
    if (!Number.isInteger(duration) || duration < 5 || duration > 180 || duration % 5 !== 0) return 'Use 5–180 seconds, in steps of 5.';
    return '';
  });
  return { errors, programme: errors.some(Boolean) ? null : draft.map((cue, i) => ({ id: `cue-${i + 1}`, name: cue.name.trim(), durationSeconds: Number(cue.duration) })) };
}
export function recover(raw) {
  const value = JSON.parse(raw);
  const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  if (!object(value) || value.version !== 1 || !Array.isArray(value.programme) || value.programme.length !== 4 || !Array.isArray(value.draft) || value.draft.length !== 4) throw new Error('Unsupported saved rehearsal');
  const programme = value.programme.map((cue, i) => {
    if (!object(cue) || cue.id !== `cue-${i + 1}` || typeof cue.name !== 'string' || !cue.name.trim() || cue.name.length > 60 || !Number.isInteger(cue.durationSeconds) || cue.durationSeconds < 5 || cue.durationSeconds > 180 || cue.durationSeconds % 5) throw new Error('Invalid saved cue');
    return { id: cue.id, name: cue.name, durationSeconds: cue.durationSeconds };
  });
  const draft = value.draft.map(cue => {
    if (!object(cue) || typeof cue.name !== 'string' || cue.name.length > 60 || typeof cue.duration !== 'string' || cue.duration.length > 5) throw new Error('Invalid saved edit');
    return { name: cue.name, duration: cue.duration };
  });
  const { status, index, cueElapsedMs, elapsedMs, anchorMs } = value;
  const total = programme.reduce((sum, cue) => sum + cue.durationSeconds * 1000, 0);
  if (!['idle', 'running', 'paused', 'finished'].includes(status) || !Number.isInteger(index) || index < 0 || index > 4 || !Number.isFinite(cueElapsedMs) || cueElapsedMs < 0 || !Number.isFinite(elapsedMs) || elapsedMs < 0 || elapsedMs > total) throw new Error('Invalid saved timing');
  if (status === 'finished' ? index !== 4 || cueElapsedMs !== 0 : index > 3 || cueElapsedMs >= programme[index].durationSeconds * 1000) throw new Error('Invalid saved position');
  if (status === 'idle' && (index !== 0 || cueElapsedMs !== 0 || elapsedMs !== 0)) throw new Error('Invalid ready state');
  if (status === 'running' ? !Number.isFinite(anchorMs) || anchorMs < 0 : anchorMs !== null) throw new Error('Invalid saved clock');
  return { version: 1, programme, draft, status, index, cueElapsedMs, elapsedMs, anchorMs };
}
export function advance(state, now) {
  if (state.status !== 'running') return { ...state };
  let available = Math.max(0, now - state.anchorMs);
  let index = state.index;
  let cueElapsedMs = state.cueElapsedMs;
  let used = 0;
  while (index < state.programme.length && available >= 0) {
    const left = state.programme[index].durationSeconds * 1000 - cueElapsedMs;
    if (available < left) { cueElapsedMs += available; used += available; break; }
    available -= left; used += left; index++; cueElapsedMs = 0;
    if (available === 0) break;
  }
  const finished = index === state.programme.length;
  return { ...state, index, cueElapsedMs, elapsedMs: state.elapsedMs + used, status: finished ? 'finished' : 'running', anchorMs: finished ? null : now };
}
export function start(state, now) { return { ...state, status: 'running', anchorMs: now }; }
export function pause(state, now) {
  const current = advance(state, now);
  return current.status === 'finished' ? current : { ...current, status: 'paused', anchorMs: null };
}
export function next(state, now) {
  const current = advance(state, now);
  if (!['running', 'paused'].includes(current.status)) return current;
  const index = current.index + 1;
  return { ...current, index, cueElapsedMs: 0, status: index === 4 ? 'finished' : current.status, anchorMs: index === 4 || current.status === 'paused' ? null : now };
}
export function remaining(state) {
  return state.status === 'finished' ? 0 : state.programme.slice(state.index).reduce((sum, cue) => sum + cue.durationSeconds * 1000, 0) - state.cueElapsedMs;
}
export function clock(milliseconds, round = 'ceil') {
  const seconds = Math.max(0, Math[round](milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
export function portable(programme) {
  return { format: 'cue-programme', version: 1, title: 'My rehearsal programme', timeUnit: 'seconds', cues: programme.map(cue => ({ ...cue })), totalDurationSeconds: programme.reduce((sum, cue) => sum + cue.durationSeconds, 0) };
}
