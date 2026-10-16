export const WIDTH = 5;
export const HEIGHT = 4;
export const PIECES = Object.freeze({
  A: { name: 'Apricot', color: '#ffad83', cells: [[0,0],[1,0],[2,0],[1,1]] },
  B: { name: 'Bluebell', color: '#acbcfa', cells: [[0,0],[1,0],[1,1],[1,2]] },
  C: { name: 'Clover', color: '#b2cf96', cells: [[0,0],[1,0],[1,1],[1,2]] },
  D: { name: 'Daylight', color: '#f3df71', cells: [[1,0],[2,0],[0,1],[1,1]] },
  E: { name: 'Electric', color: '#dcace2', cells: [[0,0],[1,0],[2,0],[1,1]] },
});
export const IDS = Object.keys(PIECES);
export function cellsFor(id, rotation = 0) {
  let points = PIECES[id].cells.map(([x,y]) => [x,y]);
  for (let i = 0; i < rotation; i++) points = points.map(([x,y]) => [-y,x]);
  const minX = Math.min(...points.map(p => p[0]));
  const minY = Math.min(...points.map(p => p[1]));
  return points.map(([x,y]) => [x-minX,y-minY]);
}
export function emptyPieces() { return Object.fromEntries(IDS.map(id => [id, {x:null,y:null,rotation:0}])); }
export function freshState() { return { version: 1, pieces: emptyPieces(), selected:'A', cursor:{x:0,y:0}, moves:0, history:[] }; }
export function copy(value) { return JSON.parse(JSON.stringify(value)); }
export function occupancy(pieces, except = null) {
  const board = Array.from({length:HEIGHT},() => Array(WIDTH).fill(null));
  for (const id of IDS) {
    const p = pieces[id];
    if (id === except || p.x === null) continue;
    for (const [dx,dy] of cellsFor(id,p.rotation)) {
      if (board[p.y+dy]) board[p.y+dy][p.x+dx] = id;
    }
  }
  return board;
}
export function placementError(pieces, id, x, y, rotation = pieces[id].rotation) {
  if (!Number.isInteger(x) || !Number.isInteger(y)) return 'Choose a square on the board.';
  const board = occupancy(pieces,id);
  for (const [dx,dy] of cellsFor(id,rotation)) {
    const px=x+dx, py=y+dy;
    if (px < 0 || px >= WIDTH || py < 0 || py >= HEIGHT) return 'That shape reaches outside the box.';
    if (board[py][px]) return `That move overlaps ${PIECES[board[py][px]].name}.`;
  }
  return null;
}
export function isSolved(pieces) { return IDS.every(id => pieces[id].x !== null) && occupancy(pieces).every(row => row.every(Boolean)); }
export function commit(state, pieces) {
  if (JSON.stringify(pieces) === JSON.stringify(state.pieces)) return false;
  state.history.push({pieces:copy(state.pieces),moves:state.moves});
  if(state.history.length > 80) state.history.shift();
  state.pieces=copy(pieces); state.moves++; return true;
}
export function validatePieces(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const output={};
  for (const id of IDS) {
    const p=input[id];
    if (!p || !Number.isInteger(p.rotation) || p.rotation<0 || p.rotation>3) return null;
    if (!((p.x===null && p.y===null) || (Number.isInteger(p.x) && Number.isInteger(p.y) && p.x>=0 && p.x<WIDTH && p.y>=0 && p.y<HEIGHT))) return null;
    output[id]={x:p.x,y:p.y,rotation:p.rotation};
  }
  for(const id of IDS) if(output[id].x!==null && placementError(output,id,output[id].x,output[id].y)) return null;
  return output;
}
export function recover(raw) {
  const data=JSON.parse(raw);
  if(!data || data.version!==1) throw new Error('Unsupported puzzle');
  const pieces=validatePieces(data.pieces);
  if(!pieces || !Number.isInteger(data.moves) || data.moves<0 || data.moves>1000000) throw new Error('Invalid puzzle');
  if(!Array.isArray(data.history) || data.history.length>80) throw new Error('Invalid history');
  const history=data.history.map(s => {
    const p=validatePieces(s?.pieces);
    if(!p || !Number.isInteger(s.moves) || s.moves<0 || s.moves>1000000) throw new Error('Invalid history');
    return {pieces:p,moves:s.moves};
  });
  return {version:1,pieces,selected:IDS.includes(data.selected)?data.selected:null,cursor:{x:Number.isInteger(data.cursor?.x)?Math.max(0,Math.min(4,data.cursor.x)):0,y:Number.isInteger(data.cursor?.y)?Math.max(0,Math.min(3,data.cursor.y)):0},moves:data.moves,history};
}
export function exportPuzzle(state, now = new Date().toISOString()) {
  return {
    format:'parcel-arrangement',version:1,exportedAt:now,
    board:{columns:WIDTH,rows:HEIGHT},
    coordinates:'Zero-based column and row. Rotations are clockwise quarter-turns, normalized to the top-left of the bounding box.',
    solved:isSolved(state.pieces),moves:state.moves,
    pieces:IDS.map(id => {
      const p=state.pieces[id];
      return {
        id,name:PIECES[id].name,rotationDegrees:p.rotation*90,
        anchor:p.x===null?null:{column:p.x,row:p.y},
        cells:p.x===null?[]:cellsFor(id,p.rotation).map(([x,y])=>({column:x+p.x,row:y+p.y})),
      };
    }),
  };
}
