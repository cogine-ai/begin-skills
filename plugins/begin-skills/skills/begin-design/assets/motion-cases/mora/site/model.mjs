export const VERSION = 1;
export const STORAGE_KEY = 'mora.configuration.v1';
export const ARMS = Object.freeze({
  compact: { name: 'Arm Compact', reach: 34, height: 38, cents: 18900, drawingLength: 230 },
  studio: { name: 'Arm Studio', reach: 52, height: 54, cents: 22900, drawingLength: 310 },
});
export const SHADES = Object.freeze({
  disc: { name: 'Shade Disc', diameter: 18, cents: 0 },
  cone: { name: 'Shade Cone', diameter: 14, cents: 2400 },
});
export const FINISHES = Object.freeze({
  chalk: { name: 'Chalk', rgb: [243, 242, 231] },
  graphite: { name: 'Graphite', rgb: [56, 65, 69] },
  vermilion: { name: 'Vermilion', rgb: [227, 79, 52] },
});
export const TEMPERATURES = Object.freeze([2700, 3500, 4000]);
export const DEFAULT = Object.freeze({ arm: 'compact', shade: 'disc', finish: 'chalk', temperature: 3500, tilt: 40, quantity: 1 });
const FIELDS = Object.freeze(['arm', 'shade', 'finish', 'temperature', 'tilt', 'quantity']);
const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
export function validConfiguration(value) {
  return plain(value) && Object.keys(value).length === FIELDS.length && FIELDS.every(key => own(value, key))
    && typeof value.arm === 'string' && own(ARMS, value.arm)
    && typeof value.shade === 'string' && own(SHADES, value.shade)
    && typeof value.finish === 'string' && own(FINISHES, value.finish)
    && TEMPERATURES.includes(value.temperature)
    && Number.isInteger(value.tilt) && value.tilt >= 15 && value.tilt <= 65 && value.tilt % 5 === 0
    && Number.isInteger(value.quantity) && value.quantity >= 1 && value.quantity <= 8;
}
export function copyConfiguration(value) {
  if (!validConfiguration(value)) throw new TypeError('Unsupported MORA configuration');
  return Object.fromEntries(FIELDS.map(key => [key, value[key]]));
}
export function money(cents) {
  if (!Number.isSafeInteger(cents)) throw new TypeError('Money must use integer cents');
  return `USD ${(cents / 100).toFixed(2)}`;
}
export function specification(value) {
  const config = copyConfiguration(value);
  const arm = ARMS[config.arm], shade = SHADES[config.shade], finish = FINISHES[config.finish];
  const unitCents = arm.cents + shade.cents;
  return { config, arm, shade, finish, unitCents, totalCents: unitCents * config.quantity,
    identity: `${arm.name} · ${shade.name} · ${finish.name}` };
}
export function queryForConfiguration(value) {
  const config = copyConfiguration(value), params = new URLSearchParams({ mora: String(VERSION) });
  FIELDS.forEach(key => params.set(key, String(config[key])));
  return `?${params.toString()}`;
}
export function configurationFromQuery(search) {
  const params = new URLSearchParams(search);
  if (!params.has('mora')) return { kind: 'absent' };
  if (params.get('mora') !== String(VERSION) || ['mora', ...FIELDS].some(key => params.getAll(key).length !== 1)) return { kind: 'invalid' };
  const config = Object.fromEntries(FIELDS.map(key => [key, params.get(key)]));
  ['temperature', 'tilt', 'quantity'].forEach(key => { config[key] = Number(config[key]); });
  return validConfiguration(config) ? { kind: 'valid', config } : { kind: 'invalid' };
}
export function readStoredConfiguration(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return { kind: 'empty' };
    if (raw.length > 1500) return { kind: 'invalid' };
    const saved = JSON.parse(raw);
    if (!plain(saved) || Object.keys(saved).length !== 2 || saved.version !== VERSION || !validConfiguration(saved.config)) return { kind: 'invalid' };
    return { kind: 'valid', config: copyConfiguration(saved.config) };
  } catch (error) {
    return { kind: error instanceof SyntaxError ? 'invalid' : 'unavailable' };
  }
}
export function saveStoredConfiguration(storage, value) {
  const config = copyConfiguration(value), raw = JSON.stringify({ version: VERSION, config });
  try {
    storage.setItem(STORAGE_KEY, raw);
    return storage.getItem(STORAGE_KEY) === raw;
  } catch { return false; }
}
export function recoverConfiguration(storage, search) {
  const linked = configurationFromQuery(search), stored = readStoredConfiguration(storage);
  const config = linked.kind === 'valid' ? linked.config : stored.kind === 'valid' ? stored.config : copyConfiguration(DEFAULT);
  return { config, linked: linked.kind, stored: stored.kind };
}
export function visualTarget(value) {
  const spec = specification(value), [r, g, b] = spec.finish.rgb;
  const temperatureColors = { 2700: [255, 197, 112], 3500: [255, 226, 178], 4000: [216, 236, 255] };
  const [lr, lg, lb] = temperatureColors[value.temperature];
  return { length: spec.arm.drawingLength, angle: value.tilt, cone: value.shade === 'cone' ? 1 : 0, r, g, b, lr, lg, lb };
}
export function lampGeometry(visual) {
  const radians = visual.angle * Math.PI / 180;
  const x = 160 + visual.length * Math.cos(radians), y = 350 - visual.length * Math.sin(radians);
  const mix = (a, b) => a + (b - a) * visual.cone;
  const width = mix(56, 44), topWidth = mix(56, 15), topY = y + mix(0, -30), bottomY = y + mix(13, 15);
  const poolX = Math.min(490, x + 40);
  return { x, y, width, topWidth, topY, bottomY, poolX };
}
export function lampSVGMarkup(value, prefix = 'lamp') {
  const visual = visualTarget(value), s = specification(value), g = lampGeometry(visual);
  const paint = `rgb(${visual.r},${visual.g},${visual.b})`, light = `rgb(${visual.lr},${visual.lg},${visual.lb})`;
  return `<svg data-lamp-scene viewBox="0 0 640 540" role="img" aria-labelledby="${prefix}-title ${prefix}-desc" xmlns="http://www.w3.org/2000/svg">
<title id="${prefix}-title">MORA adjustable task light</title><desc id="${prefix}-desc">${s.identity}, ${value.temperature} K, ${value.tilt} degrees tilt. Original schematic, not to scale.</desc>
<defs><radialGradient id="${prefix}-pool"><stop data-part="glow-stop" stop-color="${light}" stop-opacity=".9"/><stop offset="1" stop-color="${light}" stop-opacity="0"/></radialGradient></defs>
<circle cx="330" cy="261" r="215" fill="currentColor" opacity=".035"/>
<path d="M35 477H610" fill="none" stroke="#66767c" stroke-width="1"/>
<path d="M362 459l92-19 89 15-89 18z" fill="#f4f5ef" stroke="#b3bdc0" stroke-width="1"/>
<path d="M390 458l61-12m-40 17 62-12" fill="none" stroke="#c6cfd0"/>
<ellipse data-part="pool" cx="${g.poolX}" cy="476" rx="157" ry="42" fill="url(#${prefix}-pool)"/>
<path data-part="beam" d="M${g.x-g.width} ${g.bottomY}L${g.x+g.width} ${g.bottomY}L${g.poolX+145} 477L${g.poolX-145} 477Z" fill="${light}" opacity=".17"/>
<ellipse cx="160" cy="477" rx="104" ry="9" fill="#14252b" opacity=".13"/>
<path data-part="paint-base" d="M78 459Q160 437 242 459L242 466Q160 487 78 466Z" fill="${paint}" stroke="#26363d" stroke-width="2"/>
<ellipse data-part="paint-base-top" cx="160" cy="459" rx="82" ry="15" fill="${paint}" stroke="#26363d" stroke-width="2"/>
<path data-part="paint-stem" d="M160 449V350" stroke="${paint}" stroke-width="18" stroke-linecap="round"/>
<path d="M154 447V354" stroke="#26363d" stroke-opacity=".3" stroke-width="3" stroke-linecap="round"/>
<line data-part="arm-outline" x1="160" y1="350" x2="${g.x}" y2="${g.y}" stroke="#26363d" stroke-width="22" stroke-linecap="round"/>
<line data-part="arm" x1="160" y1="350" x2="${g.x}" y2="${g.y}" stroke="${paint}" stroke-width="18" stroke-linecap="round"/>
<line data-part="arm-shine" x1="160" y1="347" x2="${g.x}" y2="${g.y-3}" stroke="#fff" stroke-opacity=".3" stroke-width="3" stroke-linecap="round"/>
<circle data-part="paint-pivot" cx="160" cy="350" r="25" fill="${paint}" stroke="#26363d" stroke-width="2"/>
<circle cx="160" cy="350" r="8" fill="#26363d"/><path d="M157 350h6" stroke="#e6e9e6" stroke-width="2"/>
<path data-part="neck" d="M${g.x} ${g.y}V${g.y+14}" stroke="#26363d" stroke-width="9" stroke-linecap="round"/>
<path data-part="shade" d="M${g.x-g.topWidth} ${g.topY}L${g.x+g.topWidth} ${g.topY}L${g.x+g.width} ${g.bottomY}Q${g.x} ${g.bottomY+10} ${g.x-g.width} ${g.bottomY}Z" fill="${paint}" stroke="#26363d" stroke-width="2" stroke-linejoin="round"/>
<ellipse data-part="emitter" cx="${g.x}" cy="${g.bottomY}" rx="${g.width-3}" ry="5" fill="${light}" stroke="#26363d" stroke-width="1"/>
<circle data-part="joint" cx="${g.x}" cy="${g.y-5}" r="7" fill="#26363d"/>
</svg>`;
}
export function standaloneSpecification(value) {
  const s = specification(value), c = s.config;
  const rows = [
    ['Arm', s.arm.name], ['Shade', s.shade.name], ['Finish', s.finish.name],
    ['Light temperature', `${c.temperature} K`], ['Tilt', `${c.tilt}°`], ['Quantity', `${c.quantity} ${c.quantity === 1 ? 'lamp' : 'lamps'}`],
    ['Reach', `${s.arm.reach} cm`], ['Overall height', `${s.arm.height} cm`], ['Shade diameter', `${s.shade.diameter} cm`],
    ['LED specification', 'Fictional 8 W LED'], ['Base price', money(s.arm.cents)], ['Shade addition per lamp', money(s.shade.cents)],
    ['Unit price', `${money(s.unitCents)} per lamp`], ['Total', `${money(s.totalCents)} for ${c.quantity} ${c.quantity === 1 ? 'lamp' : 'lamps'}`],
  ];
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>MORA — ${s.identity} specification</title><style>*{box-sizing:border-box}body{margin:0;background:#edf1f1;color:#192a31;font:16px/1.6 system-ui,sans-serif}main{max-width:920px;margin:24px auto;background:#fffef9;padding:36px}h1{font-size:34px;line-height:1.2;margin:12px 0}p{max-width:66ch}svg{display:block;max-width:100%;height:auto;max-height:440px;margin:20px auto;background:#dfe8eb}table{width:100%;border-collapse:collapse}th,td{text-align:left;vertical-align:top;border-bottom:1px solid #cbd2d2;padding:10px 0}th{width:45%;font-weight:500}td{font-variant-numeric:tabular-nums}small{font-size:13px}footer{margin-top:28px;border-top:2px solid;padding-top:16px}@media(max-width:550px){main{margin:0;padding:22px}h1{font-size:27px}th{width:44%;padding-right:12px}}@media print{body{background:white}main{margin:0;padding:12mm}svg{max-height:90mm}tr{break-inside:avoid}}</style></head><body><main><p><strong>MORA</strong> / configuration specification</p><h1>${s.identity}</h1><p>A complete local record of your selected task light.</p>${lampSVGMarkup(c, 'export')}<p><small>Original schematic, not to scale. Light colors are illustrative; this is not photometric or manufacturing proof. Reach and height are catalogue dimensions.</small></p><table><tbody>${rows.map(([name, value]) => `<tr><th scope="row">${name}</th><td>${value}</td></tr>`).join('')}</tbody></table><footer><strong>Fictional catalogue · No order placed</strong><p>This file is a standalone specification. It does not place or transmit an order, reserve stock or take payment. No certification, availability, delivery or warranty claim is supplied.</p><p><small>MORA specification format ${VERSION}. No network, account or font download is required to read this file.</small></p></footer></main></body></html>`;
}
