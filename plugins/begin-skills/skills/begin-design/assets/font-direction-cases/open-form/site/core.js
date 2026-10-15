(function(root){
  'use strict';
  const sessions=[
    {id:'layer',name:'Layer lab',start:'09:30',end:'10:45',method:'Linocut',materials:'Soft-cut block, water-based ink and A4 paper.',access:'Seated benches. Cutting tools are used with an instructor.',description:'Cut a small shape. Let the same block make three different impressions.'},
    {id:'roll',name:'Roll & repeat',start:'10:30',end:'11:45',method:'Monoprint',materials:'Gel plates, rollers and recycled paper.',access:'Step-free studio. Latex-free gloves are available.',description:'Work directly on the plate. Pull a sequence of unpredictable textures.'},
    {id:'shape',name:'Shape shift',start:'11:15',end:'12:45',method:'Stencil',materials:'Paper stencils, sponges and two ink colors.',access:'Seated and standing workstations. No blades are required.',description:'Fold, rotate and layer a stencil to build a set of bold forms.'},
    {id:'color',name:'Color exchange',start:'13:30',end:'15:00',method:'Two-color risograph',materials:'Two prepared masters and A3 sheets.',access:'A quieter table is available. The printer makes brief mechanical noise.',description:'Swap one color with someone else. See how the whole print changes.'},
    {id:'edition',name:'Open edition',start:'15:30',end:'17:00',method:'Letterpress',materials:'Wood type, hand press and heavy paper.',access:'Adjustable table and seated operation. Staff help with press pressure.',description:'Set a word in wood type. Print a small edition to take home.'}
  ];
  const minutes=t=>Number(t.slice(0,2))*60+Number(t.slice(3));
  const fingerprint=input=>JSON.stringify({title:input.title.trim(),note:input.note.trim(),selected:[...input.selected].sort()});
  function validate(input){
    const selected=sessions.filter(s=>input.selected.includes(s.id));
    const errors=[];
    if(!input.title.trim())errors.push('Give your route a name.');
    if(input.title.trim().length>60)errors.push('Use 60 characters or fewer for the route name.');
    if(input.note.trim().length>500)errors.push('Use 500 characters or fewer for your note.');
    if(!selected.length)errors.push('Choose at least one session.');
    if(new Set(input.selected).size!==input.selected.length||input.selected.some(id=>!sessions.some(s=>s.id===id)))errors.push('The session list is not recognized.');
    const clashes=[];
    for(let i=0;i<selected.length;i++)for(let j=i+1;j<selected.length;j++){
      const from=Math.max(minutes(selected[i].start),minutes(selected[j].start));
      const to=Math.min(minutes(selected[i].end),minutes(selected[j].end));
      if(from<to)clashes.push({a:selected[i].name,b:selected[j].name,minutes:to-from});
    }
    if(clashes.length)errors.push(clashes.map(c=>`${c.a} and ${c.b} overlap by ${c.minutes} min.`).join(' '));
    return {selected,errors,clashes};
  }
  function prepare(input){
    const check=validate(input);
    if(check.errors.length)return {ok:false,...check};
    const chosen=check.selected;
    const duration=chosen.reduce((n,s)=>n+minutes(s.end)-minutes(s.start),0);
    const gap=minutes(chosen.at(-1).end)-minutes(chosen[0].start)-duration;
    const lines=['OPEN FORM',input.title.trim(),'Saturday 24 October 2026 · Common Press, North Hall','All times are venue local. This is a personal plan; no place is booked.','',`${chosen.length} sessions · ${duration} workshop minutes · ${gap} gap minutes`,`${chosen[0].start}–${chosen.at(-1).end}`,''];
    for(const s of chosen)lines.push(`${s.start}–${s.end}  ${s.name}`,`Method: ${s.method}`,`Materials: ${s.materials}`,`Access: ${s.access}`,'');
    if(input.note.trim())lines.push('My note',input.note.trim(),'');
    return {ok:true,title:input.title.trim(),note:input.note.trim(),selected:chosen.map(s=>s.id),duration,gap,count:chosen.length,start:chosen[0].start,end:chosen.at(-1).end,text:lines.join('\n'),basis:fingerprint(input)};
  }
  const api={sessions,minutes,fingerprint,validate,prepare};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.OpenForm=api;
})(typeof globalThis==='object'?globalThis:this);
