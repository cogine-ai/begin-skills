(function(root,factory){const api=factory();if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.TidePlan=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const sessions=[
  {
    "id": "TC01",
    "name": "Breathing without breaking rhythm",
    "start": "09:00",
    "end": "09:40",
    "level": "New lap swimmers",
    "description": "Give the exhale time. Bring the breath into your stroke instead of stopping for it."
  },
  {
    "id": "TC02",
    "name": "Balance from fingertips to toes",
    "start": "09:55",
    "end": "10:40",
    "level": "All lap swimmers",
    "description": "Small shifts in head position and reach can make a long body feel lighter."
  },
  {
    "id": "TC03",
    "name": "A calmer catch, a longer stroke",
    "start": "11:00",
    "end": "11:50",
    "level": "Regular lap swimmers",
    "description": "Find a useful hold on the water before asking your arms to work harder."
  },
  {
    "id": "TC04",
    "name": "Flip turns without the rush",
    "start": "11:10",
    "end": "11:50",
    "level": "Regular lap swimmers",
    "description": "Bring the wall into your rhythm with a relaxed approach and a clean push."
  },
  {
    "id": "TC05",
    "name": "Holding your pace through the final length",
    "start": "12:00",
    "end": "12:45",
    "level": "All lap swimmers",
    "description": "Keep your stroke shape when the length count starts to feel longer."
  }
];
const minute=time=>Number(time.slice(0,2))*60+Number(time.slice(3));
function normalize(draft){return {ids:Array.from(new Set(draft.ids||[])).filter(id=>sessions.some(s=>s.id===id)),name:String(draft.name||"").trim(),note:String(draft.note||"").trim()};}
function build(raw){const draft=normalize(raw);if(!draft.ids.length||draft.ids.length>3)throw new Error("Choose one, two or three sessions before preparing your plan.");if(!draft.name||draft.name.length>60)throw new Error("Give your plan a name of 1–60 characters.");if(draft.note.length>160)throw new Error("Keep your focus note within 160 characters.");const chosen=sessions.filter(s=>draft.ids.includes(s.id)).sort((a,b)=>minute(a.start)-minute(b.start));let breaks=0;for(let i=1;i<chosen.length;i++){const gap=minute(chosen[i].start)-minute(chosen[i-1].end);if(gap<0)throw new Error(chosen[i-1].id+" and "+chosen[i].id+" overlap. Choose one of these sessions.");breaks+=gap;}const minutes=chosen.reduce((sum,s)=>sum+minute(s.end)-minute(s.start),0);const lines=["TIDE CLUB / SATURDAY CLINIC",draft.name,"Saturday, 17 October 2026","North Pool / Illustrative session programme","",...chosen.map(s=>s.start+"–"+s.end+" | "+s.name+" | "+(minute(s.end)-minute(s.start))+" min"),"",chosen.length+" "+(chosen.length===1?"session":"sessions")+" / "+minutes+" pool minutes / "+breaks+" minutes between sessions",...(draft.note?["Focus: "+draft.note]:[]),"","Local planning sheet. No booking or reservation has been made."];return {draft,chosen,count:chosen.length,minutes,breaks,text:lines.join("\n")+"\n"};}
function signature(raw){const d=normalize(raw);return JSON.stringify({...d,ids:d.ids.slice().sort()});}
return {sessions,build,normalize,signature};});
