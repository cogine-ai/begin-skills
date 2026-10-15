import {createSession,recoverKept,getMatches} from './model.mjs';
import {buildBracket,STORAGE_KEY} from './view.mjs';
let session=createSession(),source='Supplied sample scores · no record kept. The score desk can prepare your own bracket.';
try {const raw=localStorage.getItem(STORAGE_KEY);if(raw){session=recoverKept(raw);source='Kept snapshot in this browser · reload this page after keeping a new record.';}}catch{source='The kept snapshot could not be read. Showing the supplied sample scores.';}
buildBracket(document.querySelector('#bracket'),session);
document.querySelector('#view-source').textContent=source;
const matches=getMatches(session),champion=matches.at(-1).winner,strip=document.querySelector('#champion');
const label=document.createElement('p');label.className='kicker';label.textContent=champion?'Tournament champion':'Next match to decide';
const title=document.createElement('p');title.className='champion-name';
const detail=document.createElement('p');detail.className='champion-detail';
if(champion){title.textContent=champion;detail.textContent=`Final: ${matches.at(-1).scores.join(' : ')} over ${matches.at(-1).participants.find(t=>t!==champion)}`;}
else{const next=matches.find(m=>m.participants.every(Boolean)&&m.status!=='complete');title.textContent=next?next.participants.join(' / '):'Awaiting feeder winners';detail.textContent=next?`${next.label} · ${next.status==='tied'?'tie needs resolution':'scores not complete'}`:'Finish earlier rounds to name the next opponents.';}
strip.append(label,title,detail);
