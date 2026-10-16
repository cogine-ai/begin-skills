export const MAX_STEPS = 20;
export const STORAGE_KEY = 'loop.collection.v1';
export const DRAFT_KEY = 'loop.collection.draft.v1';
export const PRODUCTS = Object.freeze([
  {id:'olive-oil',name:'Extra virgin olive oil',base:250,unit:'ml',pence:480,note:'Clean, dry bottle with a tight lid'},
  {id:'hand-soap',name:'Fragrance-free hand soap',base:100,unit:'ml',pence:90,note:'Pump bottle or a closed jar'},
  {id:'oats',name:'Rolled oats',base:100,unit:'g',pence:65,note:'Dry jar or sturdy food container'},
  {id:'laundry',name:'Laundry powder',base:100,unit:'g',pence:120,note:'Dry, clearly labelled non-food container'},
  {id:'coffee',name:'House coffee beans',base:100,unit:'g',pence:280,note:'Dry jar or resealable coffee bag'},
  {id:'apricots',name:'Dried apricots',base:100,unit:'g',pence:160,note:'Clean food container with a lid'},
].map(Object.freeze));
export const productById = id => PRODUCTS.find(product => product.id === id);
export function money(pence) {
  if (!Number.isSafeInteger(pence) || pence < 0) throw new Error('Invalid price');
  return new Intl.NumberFormat('en-GB', {style:'currency',currency:'GBP'}).format(pence / 100);
}
export function quantity(product, steps) {
  return `${new Intl.NumberFormat('en-GB').format(product.base * steps)} ${product.unit}`;
}
export function parseQuantity(product, raw) {
  const text = String(raw).trim();
  if (!/^\d+$/.test(text)) throw new Error(`Choose a whole quantity in steps of ${product.base} ${product.unit}.`);
  const amount = Number(text);
  if (!Number.isSafeInteger(amount) || amount < product.base || amount > product.base * MAX_STEPS || amount % product.base !== 0) {
    throw new Error(`Choose ${product.base.toLocaleString('en-GB')}–${(product.base * MAX_STEPS).toLocaleString('en-GB')} ${product.unit}, in steps of ${product.base} ${product.unit}.`);
  }
  return amount / product.base;
}
function plainObject(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
export function validateItems(items) {
  if (!plainObject(items)) throw new Error('The saved list has an invalid item collection.');
  const entries = Object.entries(items);
  if (entries.length > PRODUCTS.length) throw new Error('The saved list contains too many products.');
  for (const [id, steps] of entries) {
    if (!productById(id) || !Number.isSafeInteger(steps) || steps < 1 || steps > MAX_STEPS) {
      throw new Error('The saved list contains an unknown product or an invalid quantity.');
    }
  }
  return Object.fromEntries(entries);
}
export function totals(items) {
  const checked = validateItems(items);
  const lines = PRODUCTS.filter(product => Object.hasOwn(checked, product.id)).map(product => ({
    ...product, steps:checked[product.id], amount:product.base * checked[product.id], linePence:product.pence * checked[product.id]
  }));
  return {lines, totalPence:lines.reduce((sum, line) => sum + line.linePence, 0)};
}
export function serializeList(items, date = new Date(), lastEdited = null) {
  const checked = validateItems(items);
  if (lastEdited !== null && !productById(lastEdited)) throw new Error('Invalid last edited product.');
  return JSON.stringify({version:1,savedAt:date.toISOString(),lastEdited,items:Object.entries(checked).map(([id,steps]) => ({id,steps}))});
}
export function parseSavedList(raw) {
  if (typeof raw !== 'string' || raw.length > 12000) throw new Error('The saved copy is missing or too large.');
  let value;
  try { value = JSON.parse(raw); } catch { throw new Error('The saved copy is not readable JSON.'); }
  if (!plainObject(value) || value.version !== 1 || typeof value.savedAt !== 'string' || value.savedAt.length > 40 || !Number.isFinite(Date.parse(value.savedAt)) || !Array.isArray(value.items) || value.items.length > PRODUCTS.length) {
    throw new Error('The saved copy has an unsupported format.');
  }
  const items = {};
  for (const item of value.items) {
    if (!plainObject(item) || typeof item.id !== 'string' || Object.hasOwn(items, item.id) || !productById(item.id) || !Number.isSafeInteger(item.steps) || item.steps < 1 || item.steps > MAX_STEPS) {
      throw new Error('The saved copy contains an unknown, duplicate or invalid item.');
    }
    items[item.id] = item.steps;
  }
  if (value.lastEdited !== undefined && value.lastEdited !== null && !productById(value.lastEdited)) {
    throw new Error('The saved copy has an invalid return destination.');
  }
  return {items:validateItems(items), savedAt:value.savedAt, lastEdited:value.lastEdited ?? null};
}
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
export function requestHtml(items, date = new Date()) {
  const {lines,totalPence} = totals(items);
  if (!lines.length) throw new Error('Add a refill before downloading a request.');
  const created = new Intl.DateTimeFormat('en-GB',{dateStyle:'long',timeStyle:'short'}).format(date);
  const content = lines.map(line => `<article><h2>${escapeHtml(line.name)}</h2><dl><div><dt>Quantity</dt><dd>${escapeHtml(quantity(line,line.steps))}</dd></div><div><dt>Price basis</dt><dd>${money(line.pence)} / ${line.base} ${line.unit}</dd></div><div><dt>Line total</dt><dd>${money(line.linePence)}</dd></div></dl><p><strong>Bring:</strong> ${escapeHtml(line.note)}</p></article>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>LOOP collection request</title>
<style>*{box-sizing:border-box}body{max-width:800px;margin:40px auto;padding:0 24px;color:#30231c;background:#fffdf5;font:16px/1.6 Arial,sans-serif}h1{font:700 44px/1.1 Georgia,serif;margin:10px 0 18px}header{border-bottom:2px solid #30231c;padding-bottom:24px}header p{margin:10px 0}article{padding:22px 0;border-bottom:1px solid #bcb5a5;break-inside:avoid}h2{font:700 25px/1.2 Georgia,serif;margin:0 0 18px}dl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin:0}dt{font-size:12px;text-transform:uppercase}dd{margin:4px 0 0;font-weight:700;white-space:nowrap}article p{font-size:14px;margin:16px 0 0}.total{display:flex;gap:20px;justify-content:space-between;align-items:baseline;padding:24px 0;border-bottom:2px solid #30231c}.total strong{font-size:32px;white-space:nowrap}.notes{padding:18px 0;font-size:14px}.scope{font-weight:700}@media(max-width:500px){body{margin:25px auto;padding:0 18px}h1{font-size:36px}dl{grid-template-columns:1fr 1fr;gap:14px}dl>div:last-child{grid-column:1/-1}.total strong{font-size:28px}}@media print{body{margin:0;max-width:none;background:white;font-size:11pt}.notes{font-size:10pt}h1{font-size:26pt}h2{font-size:17pt}}</style>
</head>
<body>
<header>
<p>LOOP / LOCAL COLLECTION REQUEST</p>
<h1>Good things for your next refill</h1>
<p>Prepared ${escapeHtml(created)} · ${lines.length} ${lines.length === 1 ? 'product' : 'products'}</p>
<p class="scope">No order has been sent, no collection booked and no payment taken.</p>
</header>
<main>${content}<div class="total">
<span>Estimated total</span>
<strong>${money(totalPence)}</strong>
</div>
<section class="notes">
<h2>Before you bring the containers</h2>
<p>Weigh each container empty before filling. Keep liquid containers sealed and upright. Use food containers for food and a separate, clearly labelled non-food container for laundry powder.</p>
<p>This request uses a fictional demonstration catalogue, without live stock or collection availability. The item quantities and prices above are the complete local preparation record.</p>
</section>
</main>
</body>
</html>`;
}
