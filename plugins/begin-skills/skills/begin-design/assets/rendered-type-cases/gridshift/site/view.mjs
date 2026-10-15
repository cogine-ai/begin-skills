import {MATCHES,getMatches,nextDestination} from './model.mjs';
export const STORAGE_KEY='gridshift.kept.v1';
const starts={qf1:0,qf2:184,qf3:368,qf4:552,sf1:92,sf2:460,final:276};
const labels=['Quarterfinals','Semifinals','Final'];
const el=(tag,className,text)=>{const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;};
export function buildBracket(container,session,editable=false) {
  container.replaceChildren();
  for(let round=0;round<3;round++) {
    const column=el('section','bracket-round');column.setAttribute('aria-label',labels[round]);
    const title=el('h3','round-title',labels[round]);title.append(el('span','round-number',String(round+1).padStart(2,'0')));column.append(title);
    const list=el('div','round-matches');
    for(const m of MATCHES.filter(m=>m.round===round)) {
      const card=el('div','match');card.dataset.match=m.id;card.id=`match-${m.id}`;card.style.gridRow=`${(starts[m.id]/92)+1} / span 2`;
      const top=el('div','match-top');top.append(el('span','match-id',m.id.toUpperCase()),el('span','match-status'));card.append(top);
      for(let side=0;side<2;side++) {
        const line=el('div','team-line');line.dataset.side=side;
        const name=el(editable?'label':'span','team-name');name.dataset.name=side;
        if(editable) {const input=el('input','score-input');input.id=`score-${m.id}-${side}`;input.type='number';input.name=input.id;input.min='0';input.max='9';input.step='1';input.inputMode='numeric';input.setAttribute('aria-describedby','edit-feedback');input.dataset.match=m.id;input.dataset.side=side;name.htmlFor=input.id;line.append(name,input);}
        else line.append(name,el('span','score'));
        card.append(line);
      }
      card.append(el('p','match-route'));list.append(card);
    }
    column.append(list);container.append(column);
    if(round<2){const connector=el('div','bracket-connector');connector.dataset.connection=round;connector.setAttribute('aria-hidden','true');container.append(connector);}
  }
  syncBracket(container,session,editable,true);
}
export function syncBracket(container,session,editable=false,forceValues=false) {
  const matches=getMatches(session);
  for(const m of matches) {
    const card=container.querySelector(`[data-match="${m.id}"]`);card.dataset.state=m.status;
    card.querySelector('.match-status').textContent={waiting:'Awaiting winners',unfinished:'Scores needed',tied:'Tie · unfinished',complete:'Complete'}[m.status];
    for(let side=0;side<2;side++) {
      const line=card.querySelector(`[data-side="${side}"]`);const name=m.participants[side]??`Winner of ${m.feeders[side].toUpperCase()}`;
      line.querySelector('.team-name').textContent=name;line.classList.toggle('team-winner',m.winner===m.participants[side]&&m.winner!==null);
      if(editable){const input=line.querySelector('input');input.disabled=m.participants.some(x=>x===null);input.setAttribute('aria-label',`${m.label}, ${name}, score`);if(forceValues||document.activeElement!==input) {if(input.validity.valid||forceValues||input.disabled)input.value=m.scores[side]??'';}}
      else line.querySelector('.score').textContent=m.scores[side]??'—';
    }
    let route;
    if(m.id==='final')route=m.winner?'Tournament champion': 'Winner takes the tournament';
    else {const next=matches.find(n=>n.feeders.includes(m.id));const opponent=next.participants.find(n=>n&&n!==m.winner);route=m.winner?`→ ${next.id.toUpperCase()}${opponent?` vs ${opponent}`:' · opponent pending'}`:`→ ${next.id.toUpperCase()} · ${m.status==='tied'?'resolve this tie':'winner advances'}`;}
    card.querySelector('.match-route').textContent=route;
  }
  for(let round=0;round<2;round++) {
    const root=container.querySelector(`[data-connection="${round}"]`);const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 48 720');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('width','48');svg.setAttribute('height','720');
    for(const source of matches.filter(m=>m.round===round)) {
      const dest=matches.find(m=>m.feeders.includes(source.id)),side=dest.feeders.indexOf(source.id);
      const y1=starts[source.id]+(source.winner?(source.participants.indexOf(source.winner)===0?56:100):84),y2=starts[dest.id]+56+(side*44);
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',`M 0 ${y1} H 24 V ${y2} H 48`);path.setAttribute('class',source.winner?'connection-complete':'connection-pending');svg.append(path);
    }
    root.replaceChildren(svg);
  }
}
export function renderReport(container,prepared,stale=false,invalid=false) {
  container.replaceChildren();
  if(!prepared){container.append(el('p','report-empty','Prepare the current scores to create a round report.'));return;}
  container.dataset.state=invalid?'invalid':stale?'stale':'current';
  const top=el('div','report-top');top.append(el('span','kicker','GRIDSHIFT / ROUND REPORT'),el('span','report-badge',invalid?'Invalid edits · previous record':stale?'Stale · prepare again':'Current record'));container.append(top);
  const winner=el('div','report-champion');winner.append(el('p','kicker',prepared.champion?'Tournament champion':'Tournament still open'),el('h3','',prepared.champion??'Champion undecided'));container.append(winner);
  for(let round=0;round<3;round++) {
    const section=el('section','report-round');section.append(el('h4','',labels[round]));
    for(const m of prepared.matches.filter(m=>m.round===round)) {
      const match=el('div','report-match');const nameA=m.participants[0]??`Winner of ${m.feeders[0].toUpperCase()}`,nameB=m.participants[1]??`Winner of ${m.feeders[1].toUpperCase()}`;
      match.append(el('span','report-match-id',m.id.toUpperCase()));
      const result=el('div','report-result');
      const a=el('p','report-team');a.append(el('span','',nameA),el('strong','',String(m.scores[0]??'—')));
      const b=el('p','report-team');b.append(el('span','',nameB),el('strong','',String(m.scores[1]??'—')));result.append(a,b);
      result.append(el('p','report-outcome',m.winner?`Winner: ${m.winner}`:m.status==='tied'?'Tie — unfinished':m.status==='waiting'?'Awaiting feeder winners':'Unfinished — scores missing'),el('p','report-next',nextDestination(m,prepared.matches)));match.append(result);section.append(match);
    }
    container.append(section);
  }
  container.append(el('p','report-foot','Prepared locally. This is a complete round record, not a live feed.'));
}
