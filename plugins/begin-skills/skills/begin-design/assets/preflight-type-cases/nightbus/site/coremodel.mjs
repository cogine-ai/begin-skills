export const EVENING = '17 October 2030';
export const FIXTURE_VERSION = 'nightbus-2030-10-17-v1';
export const STORAGE_KEY = 'nightbus.kept-card.v1';
export const MINUTE_START = 18 * 60;
export const MINUTE_END = 25 * 60 + 30;
export const MIN_TRANSFER = 5;
export const STOPS = Object.freeze([
  { id: 'quay', name: 'North Quay' },
  { id: 'musee', name: 'Musée des Ondes' },
  { id: 'gardens', name: 'São Bento Gardens' },
  { id: 'west', name: 'West Observatory' },
]);
export const SERVICES = Object.freeze([
  { id: 'N1', name: 'Quay Line', description: 'North Quay → Musée des Ondes → West Observatory' },
  { id: 'N2', name: 'Garden Line', description: 'Musée des Ondes → São Bento Gardens → West Observatory' },
  { id: 'N3', name: 'Night Arc', description: 'North Quay → São Bento Gardens' },
]);
const trip = (id, serviceId, calls) => Object.freeze({ id, serviceId, calls: Object.freeze(calls.map(([stopId, minute]) => Object.freeze({ stopId, minute }))) });
export const TRIPS = Object.freeze([
  trip('N1-1810', 'N1', [['quay',1090],['musee',1102],['west',1120]]),
  trip('N1-2015', 'N1', [['quay',1215],['musee',1227],['west',1245]]),
  trip('N1-2350', 'N1', [['quay',1430],['musee',1442],['west',1460]]),
  trip('N2-1832', 'N2', [['musee',1112],['gardens',1126],['west',1142]]),
  trip('N2-2040', 'N2', [['musee',1240],['gardens',1254],['west',1270]]),
  trip('N2-0010', 'N2', [['musee',1450],['gardens',1464],['west',1480]]),
  trip('N3-1835', 'N3', [['quay',1115],['gardens',1150]]),
  trip('N3-2355', 'N3', [['quay',1435],['gardens',1475]]),
  trip('N3-0050', 'N3', [['quay',1490],['gardens',1525]]),
]);
export const DEFAULT_QUERY = Object.freeze({ origin: 'quay', destination: 'gardens', earliest: '23:40' });
export const stopName = id => STOPS.find(stop => stop.id === id)?.name ?? 'Unknown stop';
export const serviceName = id => SERVICES.find(service => service.id === id)?.name ?? 'Unknown service';
export function formatClock(minute) {
  if (!Number.isInteger(minute) || minute < MINUTE_START || minute > MINUTE_END) throw new RangeError('Minute is outside this demonstration evening.');
  const clock = `${String(Math.floor(minute / 60) % 24).padStart(2,'0')}:${String(minute % 60).padStart(2,'0')}`;
  return minute >= 1440 ? `${clock} next day` : clock;
}
export function parseClock(value) {
  if (typeof value !== 'string') return null;
  const match = /^([0-2]\d):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 25) return null;
  let result = hours * 60 + minutes;
  if (hours <= 1) result += 1440;
  return result >= MINUTE_START && result <= MINUTE_END ? result : null;
}
export function validateQuery(raw) {
  const errors = {};
  if (!STOPS.some(s => s.id === raw?.origin)) errors.origin = 'Choose a listed departure stop.';
  if (!STOPS.some(s => s.id === raw?.destination)) errors.destination = 'Choose a listed arrival stop.';
  if (!errors.origin && !errors.destination && raw.origin === raw.destination) errors.destination = 'Choose a different arrival stop.';
  const earliestMinute = parseClock(raw?.earliest);
  if (earliestMinute === null) errors.earliest = 'Use HH:MM from 18:00 to 01:30 next day. 24:00–25:30 also works.';
  return { valid: Object.keys(errors).length === 0, errors, query: Object.keys(errors).length === 0 ? { origin:raw.origin,destination:raw.destination,earliestMinute } : null };
}
export const queryKey = query => `${query.origin}|${query.destination}|${query.earliestMinute}`;
export function planRoutes(query, trips = TRIPS) {
  if (!STOPS.some(s=>s.id===query?.origin) || !STOPS.some(s=>s.id===query?.destination) || query.origin===query.destination || !Number.isInteger(query.earliestMinute) || query.earliestMinute<MINUTE_START || query.earliestMinute>MINUTE_END) throw new TypeError('A validated query is required.');
  const found = [];
  const walk = (current, readyMinute, legs, visited, usedTrips) => {
    if (current === query.destination) {
      const arrivalMinute = legs.at(-1).arrivalMinute;
      const totalRideMinutes = legs.reduce((n,l)=>n+l.rideMinutes,0);
      const totalWaitMinutes = legs.reduce((n,l)=>n+l.waitMinutes,0);
      found.push({ id:legs.map(l=>`${l.tripId}:${l.origin}-${l.destination}`).join('|'),boardingMinute:legs[0].departureMinute,arrivalMinute,transfers:legs.length-1,journeyMinutes:arrivalMinute-query.earliestMinute,totalRideMinutes,totalWaitMinutes,legs });
      return;
    }
    for (const t of trips) {
      if (usedTrips.has(t.id)) continue;
      const at = t.calls.findIndex(c=>c.stopId===current);
      if (at<0 || at===t.calls.length-1) continue;
      const depart=t.calls[at].minute;
      if (depart < readyMinute + (legs.length ? MIN_TRANSFER : 0)) continue;
      for (let end=at+1;end<t.calls.length;end++) {
        const arrival=t.calls[end];
        if (visited.has(arrival.stopId) || arrival.minute>MINUTE_END) continue;
        const calls=t.calls.slice(at,end+1).map(c=>({ ...c }));
        // A path cannot pass through a previously visited stop on board either.
        if (calls.slice(1).some(c=>visited.has(c.stopId))) continue;
        const leg={ tripId:t.id,serviceId:t.serviceId,origin:current,destination:arrival.stopId,departureMinute:depart,arrivalMinute:arrival.minute,waitMinutes:depart-readyMinute,rideMinutes:arrival.minute-depart,calls };
        const nextVisited=new Set([...visited,...calls.map(c=>c.stopId)]);
        walk(arrival.stopId,arrival.minute,[...legs,leg],nextVisited,new Set([...usedTrips,t.id]));
      }
    }
  };
  walk(query.origin,query.earliestMinute,[],new Set([query.origin]),new Set());
  return found.sort((a,b)=>a.arrivalMinute-b.arrivalMinute || a.transfers-b.transfers || a.boardingMinute-b.boardingMinute || a.id.localeCompare(b.id));
}
export function prepareQuery(raw) {
  const validation = validateQuery(raw);
  return validation.valid ? { valid:true,errors:{},prepared:{ fixtureVersion:FIXTURE_VERSION,query:validation.query,routes:planRoutes(validation.query) } } : { valid:false,errors:validation.errors,prepared:null };
}
export function initialState(raw = DEFAULT_QUERY) {
  const result=prepareQuery(raw);
  return { raw:{...raw},prepared:result.prepared,selectedRouteId:result.prepared?.routes[0]?.id ?? null,needsPreparation:!result.valid,errors:result.errors,status:result.valid?'ready':'invalid' };
}
export function changeQuery(state, raw) {
  const validation=validateQuery(raw);
  const changed=JSON.stringify(raw)!==JSON.stringify(state.raw);
  const needsPreparation=state.needsPreparation||changed;
  return { ...state,raw:{...raw},errors:validation.errors,needsPreparation,status:validation.valid?(needsPreparation?'stale':'ready'):'invalid' };
}
export function prepareState(state) {
  const result=prepareQuery(state.raw);
  if (!result.valid) return {...state,errors:result.errors,needsPreparation:true,status:'invalid'};
  return {...state,prepared:result.prepared,selectedRouteId:result.prepared.routes[0]?.id??null,errors:{},needsPreparation:false,status:'ready'};
}
export function canRetain(state) {
  return state.status==='ready' && !state.needsPreparation && state.prepared?.routes.some(r=>r.id===state.selectedRouteId) === true;
}
export function selectRoute(state, id) {
  return state.prepared?.routes.some(r=>r.id===id) ? {...state,selectedRouteId:id} : state;
}
export function exportText(prepared, selectedRouteId = prepared?.routes[0]?.id) {
  if (!prepared || prepared.fixtureVersion!==FIXTURE_VERSION) throw new TypeError('A current prepared result is required.');
  const q=prepared.query;
  const lines=['NIGHTBUS — fictional travel card',`Demonstration evening: ${EVENING}`,`Schedule: ${FIXTURE_VERSION}`,'Clock: local absolute minutes 1080–1530 (18:00–01:30 next day).',`From: ${stopName(q.origin)}`,`To: ${stopName(q.destination)}`,`Earliest departure: ${formatClock(q.earliestMinute)} (absolute local minute ${q.earliestMinute})`,`Prepared options: ${prepared.routes.length}`,'Ranking: actual arrival time, then fewer transfers, then earlier boarding.','All valid simple journeys are included; no stop or trip is repeated. Each transfer is at least 5 minutes.',''];
  if (!prepared.routes.length) lines.push('No route meets this query in the declared demonstration evening.','');
  for (const [i,r] of prepared.routes.entries()) {
    lines.push(`OPTION ${String(i+1).padStart(2,'0')}${r.id===selectedRouteId?' — selected card':''}`,`Route identity: ${r.id}`,`Board: ${formatClock(r.boardingMinute)} | Arrive: ${formatClock(r.arrivalMinute)}`,`Transfers: ${r.transfers} | Journey from earliest departure: ${r.journeyMinutes} min`,`On board: ${r.totalRideMinutes} min | Total waiting: ${r.totalWaitMinutes} min`);
    for(const [j,l] of r.legs.entries()) {
      lines.push(`Leg ${j+1}: ${l.serviceId} — ${serviceName(l.serviceId)} (trip ${l.tripId})`,`  Board ${stopName(l.origin)} at ${formatClock(l.departureMinute)} (minute ${l.departureMinute})`,`  Arrive ${stopName(l.destination)} at ${formatClock(l.arrivalMinute)} (minute ${l.arrivalMinute})`,`  ${j?'Transfer wait':'Wait before first boarding'}: ${l.waitMinutes} min | Travel on board: ${l.rideMinutes} min`);
      for(const c of l.calls) lines.push(`  Scheduled call: ${stopName(c.stopId)} — ${formatClock(c.minute)} (minute ${c.minute})`);
    }
    lines.push('');
  }
  lines.push('Limits: fictional fixed schedule only. No live transport data, fares, bookings, location access, traffic or accessibility verification. This card is a demonstration, not a transport recommendation.','Local saving is deliberate; this download includes the full query and every prepared route option.','');
  return lines.join('\n');
}
export function encodeKept(state) {
  if (!canRetain(state)) throw new Error('Prepare a valid current card before keeping it.');
  return JSON.stringify({version:1,fixtureVersion:FIXTURE_VERSION,prepared:state.prepared,selectedRouteId:state.selectedRouteId});
}
export function decodeKept(text) {
  try {
    const saved=JSON.parse(text);
    if(saved?.version!==1||saved.fixtureVersion!==FIXTURE_VERSION) throw new Error();
    const q=saved.prepared?.query;
    if(!q) throw new Error();
    const raw={origin:q.origin,destination:q.destination,earliest:formatClock(q.earliestMinute).split(' ')[0]};
    const state=initialState(raw);
    if(!canRetain(state) || JSON.stringify(state.prepared)!==JSON.stringify(saved.prepared) || !state.prepared.routes.some(r=>r.id===saved.selectedRouteId)) throw new Error();
    return {valid:true,state:selectRoute(state,saved.selectedRouteId),error:null};
  } catch {return {valid:false,state:null,error:'The kept card is unreadable or belongs to another schedule. Forget it to remove this browser copy.'};}
}
