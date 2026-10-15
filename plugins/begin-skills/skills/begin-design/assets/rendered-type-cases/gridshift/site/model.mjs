export const TEAMS = Object.freeze(['São Paulo Signals', 'North Coast Circuit', 'Quiet Voltage', 'Malmö Meteors', 'Paper Tigers', 'Pixel Orchard', 'Les Éclats', 'Afterimage United']);
export const MATCHES = Object.freeze([
  {id:'qf1',round:0,label:'Quarterfinal 1',feeders:[]}, {id:'qf2',round:0,label:'Quarterfinal 2',feeders:[]},
  {id:'qf3',round:0,label:'Quarterfinal 3',feeders:[]}, {id:'qf4',round:0,label:'Quarterfinal 4',feeders:[]},
  {id:'sf1',round:1,label:'Semifinal 1',feeders:['qf1','qf2']}, {id:'sf2',round:1,label:'Semifinal 2',feeders:['qf3','qf4']},
  {id:'final',round:2,label:'Final',feeders:['sf1','sf2']}
]);
export const SAMPLE_SCORES = Object.freeze({qf1:[3,1],qf2:[2,4],qf3:[0,2],qf4:[5,3],sf1:[2,1],sf2:[1,3],final:[4,2]});
const cloneScores = scores => Object.fromEntries(MATCHES.map(m=>[m.id,[...scores[m.id]]]));
const scoreValid = x => x === null || (Number.isInteger(x) && x>=0 && x<=9);
export function createSession(sample=true) { return {scores:sample?cloneScores(SAMPLE_SCORES):Object.fromEntries(MATCHES.map(m=>[m.id,[null,null]])),revision:0,invalid:false,prepared:null}; }
export function getMatches(session) {
  const found = {};
  return MATCHES.map((m,i)=>{
    const participants=m.round===0 ? TEAMS.slice(i*2,i*2+2) : m.feeders.map(id=>found[id].winner);
    const scores=[...session.scores[m.id]];
    const ready=participants.every(Boolean), entered=scores.every(x=>x!==null);
    const status=!ready?'waiting':!entered?'unfinished':scores[0]===scores[1]?'tied':'complete';
    const winner=status==='complete'?participants[scores[0]>scores[1]?0:1]:null;
    const match={...m,participants,scores,status,winner}; found[m.id]=match;return match;
  });
}
export function setScore(session,id,side,value) {
  const match=MATCHES.find(m=>m.id===id);
  if(!match || ![0,1].includes(side) || !scoreValid(value)) throw new RangeError('Scores must be whole numbers from 0 to 9, or empty.');
  const before=getMatches(session), previous=before.find(m=>m.id===id);
  if(previous.participants.some(x=>x===null)) throw new Error('Resolve both feeder matches first.');
  const scores=cloneScores(session.scores); scores[id][side]=value;
  const next={...session,scores,revision:session.revision+1,invalid:false};
  const after=getMatches(next).find(m=>m.id===id);
  if(previous.winner!==after.winner) {
    const changed=new Set([id]);
    for(const descendant of MATCHES) if(descendant.feeders.some(f=>changed.has(f))) { scores[descendant.id]=[null,null];changed.add(descendant.id); }
  }
  return next;
}
export function markInvalid(session,invalid=true) {return {...session,invalid:Boolean(invalid)};}
export function canUsePrepared(session) {return !session.invalid && session.prepared!==null && session.prepared.revision===session.revision;}
export function nextDestination(match,matches) {
  if(match.id==='final')return match.winner?`${match.winner} is the champion.`:'The champion is still undecided.';
  const next=matches.find(m=>m.feeders.includes(match.id));
  if(!match.winner)return `Winner advances to ${next.label.toLowerCase()}.`;
  const opponent=next.participants.find(name=>name!==match.winner && name!==null);
  return opponent?`${match.winner} meets ${opponent} in ${next.label.toLowerCase()}.`:`${match.winner} advances to ${next.label.toLowerCase()}; opponent awaits ${next.feeders.find(id=>id!==match.id).toUpperCase()}.`;
}
export function reportText(matches) {
  const champion=matches.at(-1).winner;
  const lines=['GRIDSHIFT — ROUND REPORT','Fictional community video-game tournament','Eight entrants · single elimination','Scores: whole numbers 0–9. A tie is unfinished.','',`Champion: ${champion??'Undecided'}`,''];
  for(let round=0;round<3;round++) {
    lines.push(['QUARTERFINALS','SEMIFINALS','FINAL'][round]);
    for(const m of matches.filter(m=>m.round===round)) {
      lines.push(`${m.id.toUpperCase()} · ${m.label}`,`${m.participants[0]??`Winner of ${m.feeders[0].toUpperCase()}`} ${m.scores[0]??'—'} : ${m.scores[1]??'—'} ${m.participants[1]??`Winner of ${m.feeders[1].toUpperCase()}`}`,
        m.winner?`Winner: ${m.winner}`:`Status: ${m.status==='tied'?'Tied — unfinished':m.status==='waiting'?'Awaiting feeder winners':'Unfinished — scores missing'}`,
        nextDestination(m,matches),'');
    }
  }
  lines.push('This record was prepared locally. It is not a live feed.','');
  return lines.join('\n');
}
export function prepare(session) {
  if(session.invalid)throw new Error('Correct invalid scores before preparing.');
  const matches=getMatches(session);
  return {...session,prepared:{revision:session.revision,matches,champion:matches.at(-1).winner,text:reportText(matches)}};
}
export function exportText(session) {
  if(!canUsePrepared(session))throw new Error('Prepare the valid current scores first.');
  return session.prepared.text;
}
export function serializeKept(session) {
  exportText(session);
  return JSON.stringify({schema:'gridshift.local.v1',scores:session.scores});
}
export function recoverKept(raw) {
  let data;try{data=JSON.parse(raw);}catch{throw new Error('The kept record is unreadable.');}
  if(!data || data.schema!=='gridshift.local.v1' || !data.scores || Object.keys(data).sort().join(',')!=='schema,scores' || Object.keys(data.scores).sort().join(',')!==MATCHES.map(m=>m.id).sort().join(','))throw new Error('The kept record has an unsupported format.');
  for(const m of MATCHES)if(!Array.isArray(data.scores[m.id])||data.scores[m.id].length!==2||!data.scores[m.id].every(scoreValid))throw new Error('The kept record contains invalid scores.');
  const session={...createSession(false),scores:cloneScores(data.scores)};
  for(const m of getMatches(session))if(m.status==='waiting'&&m.scores.some(x=>x!==null))throw new Error('The kept record has scores without feeder winners.');
  return prepare(session);
}
