export const DAYS = {'2026-11-07':{day:'Saturday',short:'Sat 07 Nov',full:'Saturday, 7 November 2026'},'2026-11-08':{day:'Sunday',short:'Sun 08 Nov',full:'Sunday, 8 November 2026'}};
export const MACHINES = {laser:{name:'Laser cutter',cents:1800},cnc:{name:'CNC router',cents:2400},press:{name:'Textile press',cents:1000}};
export const OCCUPIED = [{day:'2026-11-07',machine:'laser',start:540,end:600},{day:'2026-11-07',machine:'laser',start:780,end:870},{day:'2026-11-07',machine:'cnc',start:630,end:720},{day:'2026-11-08',machine:'press',start:660,end:720}];
export const money = cents => new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(cents/100);
export const time = minutes => String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0');
export function parseTime(value){if(typeof value!=='string'||!/^\d{2}:\d{2}$/.test(value))return NaN;const [h,m]=value.split(':').map(Number);if(m>59||h>23)return NaN;return h*60+m;}
export const overlaps = (a,b) => a.start<b.end&&a.end>b.start;
export const cost = s => MACHINES[s.machine].cents*(s.end-s.start)/60;
export function validate(s,list=[],ignoreId=null){
 if(!s||!Object.hasOwn(DAYS,s.day)||!Object.hasOwn(MACHINES,s.machine))return 'Choose one of the two demo days and a workshop machine.';
 if(!Number.isInteger(s.start)||!Number.isInteger(s.end)||s.start%30||s.end%30)return 'Choose times in 30-minute steps.';
 if(s.start<540||s.end>1080||s.start>=1080||s.end<=540)return 'Keep the whole session inside opening hours, 09:00–18:00.';
 if(s.end<=s.start)return 'The end time must be later than the start time.';
 const busy=OCCUPIED.find(b=>b.day===s.day&&b.machine===s.machine&&overlaps(s,b));
 if(busy)return `${MACHINES[s.machine].name} is occupied ${time(busy.start)}–${time(busy.end)}. Choose a free time.`;
 const own=list.find(b=>b.id!==ignoreId&&b.day===s.day&&overlaps(s,b));
 if(own)return `This overlaps your ${time(own.start)}–${time(own.end)} ${MACHINES[own.machine].name.toLowerCase()} session. Your own sessions cannot overlap, even on different machines.`;
 if(typeof s.purpose!=='string'||!s.purpose.trim())return 'Add a short purpose so the workshop staff know what you want to make.';
 if(s.purpose.trim().length>180)return 'Keep the purpose to 180 characters or fewer.';
 if(!ignoreId&&list.length>=3)return 'Your request has three sessions. Remove or edit one before adding another.';
 return '';
}
export function readDraft(raw){
 const data=JSON.parse(raw);if(!data||data.version!==1||!Array.isArray(data.segments)||data.segments.length>3)throw Error('Unsupported draft');
 const list=[];const ids=new Set();
 for(const value of data.segments){if(typeof value.id!=='string'||!/^bt-[a-z0-9-]{1,60}$/.test(value.id)||ids.has(value.id))throw Error('Invalid session identity');const s={id:value.id,day:value.day,machine:value.machine,start:value.start,end:value.end,purpose:typeof value.purpose==='string'?value.purpose.trim():''};if(validate(s,list))throw Error('Invalid session');ids.add(s.id);list.push(s);}
 const c=data.current;if(!c||!Object.hasOwn(DAYS,c.day)||!Object.hasOwn(MACHINES,c.machine)||!Number.isInteger(c.start)||!Number.isInteger(c.end)||c.start<540||c.end>1080||c.start>=1080||c.end<=540||c.start%30||c.end%30||typeof c.purpose!=='string'||c.purpose.length>180)throw Error('Invalid selection');
 return {editingId:typeof data.editingId==='string'&&ids.has(data.editingId)?data.editingId:null,segments:list,current:{day:c.day,machine:c.machine,start:c.start,end:c.end,purpose:c.purpose},savedAt:typeof data.savedAt==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(data.savedAt)?data.savedAt:null};
}
export function csv(list){const safe=v=>{let s=String(v);if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};const rows=[['BENCHTIME prepared request — not submitted'],['Timezone','Europe/Dublin'],['Date','Day','Machine','Start','End','Hours','Rate EUR/hour','Estimate EUR','Purpose']];for(const s of list)rows.push([s.day,DAYS[s.day].day,MACHINES[s.machine].name,time(s.start),time(s.end),(s.end-s.start)/60,MACHINES[s.machine].cents/100,(cost(s)/100).toFixed(2),s.purpose]);rows.push(['Total estimate EUR',(list.reduce((n,s)=>n+cost(s),0)/100).toFixed(2)]);return '\uFEFF'+rows.map(r=>r.map(safe).join(',')).join('\r\n');}
