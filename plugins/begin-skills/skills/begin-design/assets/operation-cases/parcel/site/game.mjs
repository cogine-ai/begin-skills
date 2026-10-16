import { WIDTH, HEIGHT, IDS, PIECES, cellsFor, freshState, emptyPieces, copy, occupancy, placementError, isSolved, commit, recover, exportPuzzle } from './model.mjs';
const STORAGE_KEY='parcel.puzzle.v1';
const $=selector=>document.querySelector(selector);
let state=freshState();
let previewOn=true;
let recoveryMessage='';
let saveOK=false;
let drag=null;
let skipClick=false;
let previewTarget=null;
let keyboardInput=true;
let trayFocusId='A';
try {
  const stored=localStorage.getItem(STORAGE_KEY);
  if(stored){state=recover(stored);recoveryMessage='Your last arrangement is back. Keep making room.';previewOn=false;}
} catch { recoveryMessage='Previous progress could not be recovered. A fresh box is ready.'; }
function save(){
  try {
    const raw=JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY,raw);
    saveOK=localStorage.getItem(STORAGE_KEY)===raw;
  } catch { saveOK=false; }
  $('#save-status').textContent=saveOK?'Current progress is saved in this browser. Come back whenever you like.':'Browser recovery is unavailable. Keep this tab open and export before leaving.';
  $('#save-status').dataset.available=String(saveOK);
  return saveOK;
}
function ensureOperationVisible(){
  const operation=$('#operation'),bounds=operation.getBoundingClientRect();
  if(bounds.height<=innerHeight-20 && (bounds.top<10 || bounds.bottom>innerHeight-10)){
    window.scrollBy({top:bounds.top-10,behavior:'instant'});
  }
}
function keepFocusVisible(element){
  ensureOperationVisible();
  const bounds=element.getBoundingClientRect();
  if(bounds.top<7 || bounds.bottom>innerHeight-7)element.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
}
function focusBoard(){
  const cell=$(`.cell[data-x="${state.cursor.x}"][data-y="${state.cursor.y}"]`);
  cell.focus({preventScroll:true});keepFocusVisible(cell);
}
function feedback(message,error=false){$('#feedback').textContent=message;$('#feedback').classList.toggle('error',error);}
function shapeElement(id,rotation){
  const shape=document.createElement('span');shape.className='mini-shape';shape.setAttribute('aria-hidden','true');shape.style.setProperty('--piece-color',PIECES[id].color);
  for(const [x,y] of cellsFor(id,rotation)){
    const unit=document.createElement('span');unit.className='mini-unit';unit.style.gridColumn=String(x+1);unit.style.gridRow=String(y+1);unit.textContent=id;shape.append(unit);
  }
  return shape;
}
function renderBoard(){
  const occupied=occupancy(state.pieces);
  const target=previewTarget||state.cursor;
  const preview=state.selected && (previewOn||previewTarget)?cellsFor(state.selected,state.pieces[state.selected].rotation).map(([x,y])=>[x+target.x,y+target.y]):[];
  const invalid=state.selected && preview.length?Boolean(placementError(state.pieces,state.selected,target.x,target.y)):false;
  const frag=document.createDocumentFragment();
  for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++){
    const button=document.createElement('button');button.type='button';button.className='cell';button.dataset.x=x;button.dataset.y=y;button.tabIndex=state.cursor.x===x && state.cursor.y===y?0:-1;
    const id=occupied[y][x];
    if(id){button.classList.add('filled');button.dataset.piece=id;button.style.setProperty('--piece-color',PIECES[id].color);const letter=document.createElement('span');letter.className='cell-letter';letter.textContent=id;letter.setAttribute('aria-hidden','true');button.append(letter);}
    else {const coord=document.createElement('span');coord.className='cell-coordinate';coord.setAttribute('aria-hidden','true');coord.textContent=`${x+1}·${y+1}`;button.append(coord);}
    if(preview.some(([px,py])=>px===x && py===y)){button.classList.add('preview');if(invalid)button.classList.add('invalid');}
    if(preview.length && target.x===x && target.y===y)button.classList.add('anchor');
    button.setAttribute('aria-label',`Column ${x+1}, row ${y+1}: ${id?`${id}, ${PIECES[id].name}`:'empty'}${preview.length && target.x===x && target.y===y?', dotted anchor':''}`);
    frag.append(button);
  }
  $('#board').replaceChildren(frag);
}
function render(){
  const active=document.activeElement;
  const focusPiece=active?.closest('.piece-choice')?.dataset.piece;
  const focusCell=active?.closest('.cell');
  const focusPosition=focusCell?{x:focusCell.dataset.x,y:focusCell.dataset.y}:null;
  renderBoard();
  const frag=document.createDocumentFragment();
  for(const id of IDS){
    const p=state.pieces[id];const button=document.createElement('button');button.type='button';button.className='piece-choice';button.dataset.piece=id;button.tabIndex=id===trayFocusId?0:-1;button.setAttribute('aria-pressed',String(state.selected===id));button.setAttribute('aria-label',`${id}, ${PIECES[id].name}, ${p.x===null?'in tray':`on board, column ${p.x+1} row ${p.y+1}`}, ${p.rotation*90} degrees. Select or drag.`);
    button.append(shapeElement(id,p.rotation));
    const copy=document.createElement('span');
    const title=document.createElement('span');title.className='piece-id';title.append(document.createTextNode(id));const name=document.createElement('span');name.className='piece-name';name.textContent=` · ${PIECES[id].name}`;title.append(name);
    const status=document.createElement('span');status.className='piece-status';status.textContent=p.x===null?'In the tray':'Packed in the box';copy.append(title,status);button.append(copy);frag.append(button);
  }
  $('#tray').replaceChildren(frag);
  const count=IDS.filter(id=>state.pieces[id].x!==null).length;
  $('#progress').textContent=`${count} of 5 pieces packed`;
  $('#gap-count').textContent=`${20-count*4} empty squares`;
  const id=state.selected;
  $('#selected-name').textContent=id?`${id} · ${PIECES[id].name}`:'Choose a piece';
  $('#selected-location').textContent=id?`${state.pieces[id].x===null?'In the tray':`Column ${state.pieces[id].x+1}, row ${state.pieces[id].y+1}`} · ${state.pieces[id].rotation*90}°`:'Tap a letter in the tray';
  $('#rotate').disabled=!id;
  $('#remove').disabled=!id||state.pieces[id].x===null;
  $('#undo').disabled=state.history.length===0;
  $('#reset').disabled=IDS.every(id=>state.pieces[id].x===null&&state.pieces[id].rotation===0);
  $('#solved').hidden=!isSolved(state.pieces);
  if(focusPiece)$(`.piece-choice[data-piece="${focusPiece}"]`)?.focus({preventScroll:true});
  else if(focusPosition)$(`.cell[data-x="${focusPosition.x}"][data-y="${focusPosition.y}"]`)?.focus({preventScroll:true});
}
function select(id){
  state.selected=id;trayFocusId=id;
  if(state.pieces[id].x!==null)state.cursor={x:state.pieces[id].x,y:state.pieces[id].y};
  previewOn=true;save();render();feedback(`${PIECES[id].name} selected. The dotted corner is your anchor.`);
}
function place(id,x,y){
  const error=placementError(state.pieces,id,x,y);
  if(error){previewOn=true;render();feedback(`${error} Your last placement is still safe.`,true);return false;}
  const pieces=copy(state.pieces);pieces[id].x=x;pieces[id].y=y;
  const changed=commit(state,pieces);
  state.selected=id;state.cursor={x,y};previewOn=false;save();render();
  feedback(isSolved(state.pieces)?'Everything fits. Beautifully packed!':changed?`${PIECES[id].name} packed at column ${x+1}, row ${y+1}.`:`${PIECES[id].name} is already in that place.`);
  return true;
}
function rotate(){
  if(!state.selected)return;
  const id=state.selected,p=state.pieces[id],rotation=(p.rotation+1)%4;
  if(p.x!==null){const error=placementError(state.pieces,id,p.x,p.y,rotation);if(error){feedback(`${error} The piece keeps its previous angle. Return it to the tray to turn it freely.`,true);ensureOperationVisible();return;}}
  const pieces=copy(state.pieces);pieces[id].rotation=rotation;commit(state,pieces);previewOn=p.x===null;save();render();feedback(`${PIECES[id].name} turned clockwise to ${rotation*90}°.`);ensureOperationVisible();
}
function remove(){
  const id=state.selected;if(!id||state.pieces[id].x===null)return;
  const pieces=copy(state.pieces);pieces[id].x=null;pieces[id].y=null;commit(state,pieces);previewOn=true;save();render();feedback(`${PIECES[id].name} is back in the tray. Its angle stays the same.`);
}
function undo(){
  const previous=state.history.pop();if(!previous)return;
  state.pieces=copy(previous.pieces);state.moves=previous.moves;previewOn=false;save();render();feedback('Last change undone. Your previous arrangement is back.');
}
function reset(){
  if(!commit(state,emptyPieces()))return;
  state.moves=0;state.selected='A';trayFocusId='A';state.cursor={x:0,y:0};previewOn=true;save();render();feedback('An empty box, five fresh pieces. Undo can bring the previous arrangement back.');
}
$('#tray').addEventListener('keydown',event=>{
  const current=event.target.closest('.piece-choice');if(!current)return;
  const direction={ArrowLeft:-1,ArrowUp:-1,ArrowRight:1,ArrowDown:1}[event.key];
  if(direction || event.key==='Home' || event.key==='End'){
    event.preventDefault();
    const index=event.key==='Home'?0:event.key==='End'?IDS.length-1:(IDS.indexOf(current.dataset.piece)+direction+IDS.length)%IDS.length;
    select(IDS[index]);$(`.piece-choice[data-piece="${IDS[index]}"]`).focus();
  }
});
$('#board').addEventListener('focusin',()=>{if(keyboardInput)ensureOperationVisible();});
$('#choose-piece').addEventListener('click',()=>{
  const selected=$(`.piece-choice[data-piece="${trayFocusId}"]`);selected.focus();selected.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
});
$('#tray').addEventListener('click',event=>{if(skipClick)return;const button=event.target.closest('.piece-choice');if(button)select(button.dataset.piece);});
$('#board').addEventListener('click',event=>{
  if(skipClick)return;const cell=event.target.closest('.cell');if(!cell)return;
  const x=Number(cell.dataset.x),y=Number(cell.dataset.y);state.cursor={x,y};
  if(!state.selected){if(cell.dataset.piece)select(cell.dataset.piece);else{save();render();feedback('Choose a piece from the tray first.');}return;}
  place(state.selected,x,y);
});
$('#board').addEventListener('keydown',event=>{
  if(!event.target.closest('.cell'))return;
  const offsets={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
  if(offsets[event.key]){
    event.preventDefault();const [dx,dy]=offsets[event.key];state.cursor={x:Math.max(0,Math.min(WIDTH-1,state.cursor.x+dx)),y:Math.max(0,Math.min(HEIGHT-1,state.cursor.y+dy))};previewOn=true;save();render();focusBoard();
  }
  if(event.key==='Delete'||event.key==='Backspace'){event.preventDefault();remove();}
});
document.addEventListener('keydown',event=>{
  keyboardInput=true;
  if(event.key==='Escape'){
    if(drag){endDrag(false);feedback('Drag cancelled. Your last placement is still safe.');}
    else {state.selected=null;previewOn=false;save();render();feedback('No piece selected. Choose any letter from the tray.');}
  }
  if(event.key.toLowerCase()==='r'&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&event.target.closest('.cell,.piece-choice')){event.preventDefault();if(event.target.closest('.piece-choice'))focusBoard();rotate();}
});
$('#rotate').addEventListener('click',rotate);$('#remove').addEventListener('click',remove);$('#undo').addEventListener('click',undo);$('#reset').addEventListener('click',reset);
$('#export').addEventListener('click',()=>{
  const payload=JSON.stringify(exportPuzzle(state),null,2)+'\n';
  const url=URL.createObjectURL(new Blob([payload],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='parcel-arrangement.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  feedback('Your current arrangement was exported as parcel-arrangement.json.');
});
document.addEventListener('click',event=>{
  const link=event.target.closest('a[href]');
  if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.hasAttribute('download')||(link.target&&link.target!=='_self'))return;
  const destination=new URL(link.href,location.href);
  if(destination.origin===location.origin&&destination.pathname===location.pathname&&destination.search===location.search&&destination.hash)return;
  if(!save()){
    event.preventDefault();
    window.open(destination.href,'_blank','noopener');
    feedback('Recovery is unavailable, so the link opens in another tab. Keep this puzzle tab open or export your arrangement.');
  }
});
function boardTarget(clientX,clientY){
  const board=$('#board'),bounds=board.getBoundingClientRect(),style=getComputedStyle(board),padding=parseFloat(style.paddingLeft)+parseFloat(style.borderLeftWidth),gap=parseFloat(style.columnGap),cell=(bounds.width-padding*2-gap*4)/5,row=(bounds.height-padding*2-gap*3)/4;
  const x=Math.floor((clientX-bounds.left-padding)/(cell+gap));
  const y=Math.floor((clientY-bounds.top-padding)/(row+gap));
  if(clientX<bounds.left+padding||clientX>bounds.right-padding||clientY<bounds.top+padding||clientY>bounds.bottom-padding||x<0||x>=5||y<0||y>=4)return null;
  return {x,y};
}
document.addEventListener('pointerdown',event=>{
  keyboardInput=false;
  if(event.button!==0||!event.isPrimary)return;
  const piece=event.target.closest('.piece-choice,.cell.filled');if(!piece)return;
  const id=piece.dataset.piece;const onBoard=piece.classList.contains('cell');
  const p=state.pieces[id];
  drag={id,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,active:false,offsetX:onBoard?Number(piece.dataset.x)-p.x:0,offsetY:onBoard?Number(piece.dataset.y)-p.y:0,target:null};
});
window.addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.pointerId)return;
  if(!drag.active&&Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)<7)return;
  if(event.cancelable)event.preventDefault();
  if(!drag.active){drag.active=true;state.selected=drag.id;trayFocusId=drag.id;$('#drag-ghost').replaceChildren(shapeElement(drag.id,state.pieces[drag.id].rotation));$('#drag-ghost').hidden=false;document.body.classList.add('dragging');render();feedback(`Moving ${PIECES[drag.id].name}. Release inside the box to try this position.`);}
  $('#drag-ghost').style.transform=`translate(${event.clientX+14}px,${event.clientY+14}px)`;
  const target=boardTarget(event.clientX,event.clientY);
  drag.target=target?{x:target.x-drag.offsetX,y:target.y-drag.offsetY}:null;
  previewTarget=drag.target;
  renderBoard();
},{passive:false});
function endDrag(accept){
  if(!drag)return;const finished=drag;drag=null;previewTarget=null;$('#drag-ghost').hidden=true;document.body.classList.remove('dragging');
  if(finished.active){skipClick=true;setTimeout(()=>{skipClick=false;},0);
    if(accept&&finished.target)place(finished.id,finished.target.x,finished.target.y);
    else {render();feedback(accept?'Released outside the box. Your last placement is still safe.':'Drag cancelled. Your last placement is still safe.',accept);}
    save();
  }
}
window.addEventListener('pointerup',event=>{if(drag&&event.pointerId===drag.pointerId)endDrag(true);});
window.addEventListener('pointercancel',()=>endDrag(false));
window.addEventListener('blur',()=>endDrag(false));
trayFocusId=state.selected||'A';
save();render();if(recoveryMessage)feedback(recoveryMessage);
