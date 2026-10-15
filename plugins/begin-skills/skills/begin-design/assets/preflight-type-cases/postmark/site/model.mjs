import { METRICS } from './font-metrics.mjs';

export const DEFAULT_DRAFT = Object.freeze({
  name: 'A little thanks',
  recipient: 'Amélie de Montreuil',
  sender: 'Zoë García',
  message: 'Thank you for making room at your table and in your week. I came home with a pocket full of stories and the happy feeling of being known.\n\nI’m keeping the little moments: the rain at the window, the second cup of coffee, and the walk we took without watching the time.',
  format: 'a6',
});

export const FORMATS = Object.freeze({
  a6: Object.freeze({ id: 'a6', label: 'A6 postcard', width: 148, height: 105, margin: 11, bodySize: 3.8, bodyLeading: 5.35, bodyY: 44, maxLines: 8, nameSize: 6, nameY: 34, senderLabelY: 88, senderY: 94, senderSize: 5.5, footerY: 101, topLabelY: 15, recipientLabelY: 26, stampSize: 17 }),
  a5: Object.freeze({ id: 'a5', label: 'A5 note', width: 210, height: 148, margin: 16, bodySize: 5, bodyLeading: 6.8, bodyY: 59, maxLines: 10, nameSize: 8, nameY: 46, senderLabelY: 128, senderY: 136, senderSize: 7, footerY: 143, topLabelY: 20, recipientLabelY: 35, stampSize: 24 }),
});

export const LIMITS = Object.freeze({ name: 48, recipient: 48, sender: 48, message: 420 });
export const STORAGE_KEY = 'postmark.kept.v1';
export const chars = value => Array.from(value).length;
export const normalizeLines = value => value.replace(/\r\n?/g, '\n');

export function draftValue(value) {
  const source = value && typeof value === 'object' ? value : {};
  return Object.fromEntries(['name', 'recipient', 'sender', 'message', 'format'].map(key => [key, typeof source[key] === 'string' ? (key === 'message' ? normalizeLines(source[key]) : source[key]) : '']));
}

export function measureText(value, role, size) {
  const face = METRICS[role];
  return Array.from(value).reduce((sum, letter) => sum + (face.widths[letter.codePointAt(0)] ?? Infinity), 0) / face.unitsPerEm * size;
}

/** Keep every original space and manual newline; soft wraps introduce no characters. */
export function wrapMessage(value, maxWidth, size) {
  const manual = normalizeLines(value).split('\n');
  const lines = [];
  for (let paragraph = 0; paragraph < manual.length; paragraph++) {
    let remaining = manual[paragraph];
    if (remaining === '') lines.push({ text: '', breakAfter: paragraph < manual.length - 1 ? 'manual' : 'end' });
    while (remaining !== '') {
      const points = Array.from(remaining);
      let fit = 0;
      while (fit < points.length && measureText(points.slice(0, fit + 1).join(''), 'body', size) <= maxWidth) fit++;
      if (fit === points.length) {
        lines.push({ text: remaining, breakAfter: paragraph < manual.length - 1 ? 'manual' : 'end' });
        remaining = '';
      } else {
        let boundary = -1;
        for (let index = fit - 1; index >= 0; index--) if (points[index] === ' ') { boundary = index + 1; break; }
        if (boundary < 1) return { lines, error: 'One word is too wide for this paper. Add a space, shorten it, or choose the larger paper.' };
        lines.push({ text: points.slice(0, boundary).join(''), breakAfter: 'soft' });
        remaining = points.slice(boundary).join('');
      }
    }
  }
  return { lines, error: null };
}

export function restoreWrapped(lines) {
  return lines.map(line => line.text + (line.breakAfter === 'manual' ? '\n' : '')).join('');
}

function unsupported(value) {
  return [...new Set(Array.from(value).filter(letter => letter !== '\n' && !Object.hasOwn(METRICS.body.widths, letter.codePointAt(0))))];
}

export function validateDraft(value) {
  const draft = draftValue(value);
  const errors = {};
  const format = FORMATS[draft.format];
  for (const key of ['name', 'recipient', 'sender', 'message']) {
    const label = { name: 'Postcard name', recipient: 'Recipient', sender: 'Sender', message: 'Message' }[key];
    if (!draft[key].trim()) errors[key] = `${label} needs some words.`;
    else if (chars(draft[key]) > LIMITS[key]) errors[key] = `${label} allows ${LIMITS[key]} characters, including spaces${key === 'message' ? ' and line breaks' : ''}. Yours has ${chars(draft[key])}.`;
    else if (key !== 'message' && /[\r\n]/.test(draft[key])) errors[key] = `${label} must stay on one line.`;
    else if (unsupported(draft[key]).length) errors[key] = `${label} contains a character the print fonts cannot show: ${unsupported(draft[key]).slice(0, 4).join(' ')}. Use supported Latin letters, accents and punctuation.`;
  }
  if (!format) errors.format = 'Choose A6 postcard or A5 note.';
  let lines = [];
  if (format) {
    const track = format.width - 2 * format.margin - 2;
    if (!errors.recipient && measureText(draft.recipient, 'name', format.nameSize) > track) errors.recipient = 'This recipient is too wide for one printed line. Shorten it or choose A5 note.';
    if (!errors.sender && measureText(draft.sender, 'name', format.senderSize) > track) errors.sender = 'This sender is too wide for one printed line. Shorten it or choose A5 note.';
    if (!errors.message) {
      const wrapped = wrapMessage(draft.message, track, format.bodySize);
      lines = wrapped.lines;
      if (wrapped.error) errors.message = wrapped.error;
      else if (lines.length > format.maxLines) errors.message = `This message needs ${lines.length} printed lines. ${format.label} has room for ${format.maxLines}. Remove some words or line breaks${draft.format === 'a6' ? ', or choose A5 note' : ''}.`;
    }
  }
  return { valid: Object.keys(errors).length === 0, errors, draft, format, lines };
}

export function sameDraft(left, right) {
  const a = draftValue(left), b = draftValue(right);
  return Object.keys(a).every(key => a[key] === b[key]);
}

export function exportStatus(prepared, draft) {
  const validation = validateDraft(draft);
  const stale = Boolean(prepared && !sameDraft(prepared.draft, validation.draft));
  return { ...validation, prepared: Boolean(prepared), stale, canExport: Boolean(prepared && validation.valid && !stale) };
}

export const escapeXml = value => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[character]));

export function exportTxt(value) {
  const { draft, format, valid } = validateDraft(value);
  if (!valid) throw new Error('A valid postcard is required.');
  return `POSTMARK\n${draft.name}\n\nPaper: ${format.label}\nSize: ${format.width} × ${format.height} mm (landscape)\nArtwork: Sun after rain — original POSTMARK drawing\n\nFor: ${draft.recipient}\n\n${draft.message}\n\nWith love,\n${draft.sender}\n\nPrint: open the SVG in a modern browser that honors its embedded fonts. Use 100% / actual size and verify the paper dimensions. No bleed or address side is included.\n`;
}

function printStyles(bundle) {
  const faces = bundle ? bundle.map(face => `@font-face{font-family:'${face.family}';font-style:${face.style};font-weight:400;src:url(data:font/ttf;base64,${face.base64}) format('truetype');}`).join('\n') : '';
  return `${faces}\ntext{fill:#243c35;font-weight:400;font-kerning:none;font-variant-ligatures:none;font-optical-sizing:none} .body{font-family:'Postmark Newsreader',Newsreader,serif;font-variation-settings:'wght' 400,'opsz' 18} .name{font-family:'Postmark Newsreader',Newsreader,serif;font-style:italic;font-variation-settings:'wght' 400,'opsz' 18} .utility{font-family:'Postmark Work Sans','Work Sans',sans-serif;font-variation-settings:'wght' 400}`;
}

export function buildSvg(value, bundle = null) {
  const { draft, format: f, lines, valid } = validateDraft(value);
  if (!valid) throw new Error('A valid postcard is required.');
  const x = f.margin;
  const stampX = f.width - f.margin - f.stampSize;
  const stampY = f.id === 'a6' ? 7 : 9;
  const notice = bundle ? bundle.map(face => `<font family="${face.family}" style="${face.style}" sha256="${face.sha256}"><license xml:space="preserve">${escapeXml(face.license)}</license></font>`).join('\n') : '<portability>Screen preview uses local site fonts. The prepared downloadable SVG embeds the unchanged fonts and full licenses.</portability>';
  const record = escapeXml(JSON.stringify({ version: 1, name: draft.name, recipient: draft.recipient, sender: draft.sender, message: draft.message, format: f.label, width_mm: f.width, height_mm: f.height }));
  const message = lines.map((line, index) => `<tspan x="${x}" y="${(f.bodyY + index * f.bodyLeading).toFixed(2)}" data-break-after="${line.breakAfter}">${escapeXml(line.text)}</tspan>`).join('');
  const sizeLabel = `${f.width} × ${f.height} mm`;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${f.width}mm" height="${f.height}mm" viewBox="0 0 ${f.width} ${f.height}" role="img" aria-labelledby="card-title card-description">\n<title id="card-title">${escapeXml(draft.name)} — for ${escapeXml(draft.recipient)}</title>\n<desc id="card-description" xml:space="preserve">${escapeXml(exportTxt(draft))}</desc>\n<metadata><postmark-record>${record}</postmark-record><font-notices>${notice}</font-notices><print-portability>Use a modern browser that honors embedded TTF fonts and SVG text. Some design applications ignore embedded web fonts; their substitutions can change the line fit. Use 100 percent / actual size and check the physical dimensions.</print-portability></metadata>\n<style>${printStyles(bundle)}</style>\n<rect width="${f.width}" height="${f.height}" fill="#fffdf5"/>\n<text class="utility" x="${x}" y="${f.topLabelY}" font-size="${f.id === 'a6' ? 3 : 4}">A small good thing</text>\n<g transform="translate(${stampX} ${stampY}) scale(${f.stampSize / 100})" aria-label="Original sun and leaves drawing"><rect x="2" y="2" width="96" height="116" rx="2" fill="#e5eee8" stroke="#243c35" stroke-width="1.5"/><path d="M18 80h64M50 78V46M50 61C27 62 28 44 22 39c19-1 28 9 28 22M50 72c24 1 24-18 30-23-20-1-30 10-30 23" fill="none" stroke="#243c35" stroke-width="2" stroke-linecap="round"/><circle cx="50" cy="31" r="10" fill="#d16b46"/><path d="M33 31h-5m39 0h5M50 14V9M38 19l-4-4m28 4 4-4" stroke="#d16b46" stroke-width="1.5"/><text class="utility" x="50" y="103" text-anchor="middle" font-size="10" letter-spacing="2">FOR YOU</text></g>\n<text class="utility" x="${x}" y="${f.recipientLabelY}" font-size="${f.id === 'a6' ? 2.8 : 3.6}">For</text>\n<text class="name" x="${x}" y="${f.nameY}" font-size="${f.nameSize}" xml:space="preserve">${escapeXml(draft.recipient)}</text>\n<text class="body" font-size="${f.bodySize}" xml:space="preserve">${message}</text>\n<text class="utility" x="${x}" y="${f.senderLabelY}" font-size="${f.id === 'a6' ? 2.8 : 3.6}">With love,</text>\n<text class="name" x="${x}" y="${f.senderY}" font-size="${f.senderSize}" xml:space="preserve">${escapeXml(draft.sender)}</text>\n<path d="M${x} ${f.footerY - 4}H${f.width - x}" stroke="#bac6b8" stroke-width=".2"/>\n<text class="utility" x="${x}" y="${f.footerY}" font-size="${f.id === 'a6' ? 2.3 : 3}">${sizeLabel}</text>\n<text class="utility" x="${f.width - x}" y="${f.footerY}" text-anchor="end" font-size="${f.id === 'a6' ? 2.3 : 3}">Made by you</text>\n</svg>\n`;
}

export function prepareDraft(value, bundle) {
  if (!Array.isArray(bundle) || bundle.length !== 3 || bundle.some(face => !face.base64 || !face.license || !face.sha256)) throw new Error('The complete unchanged fonts and notices must be ready before preparation.');
  const validation = validateDraft(value);
  if (!validation.valid) throw new Error('Correct the current words before preparation.');
  const draft = { ...validation.draft };
  return { draft, txt: exportTxt(draft), svg: buildSvg(draft, bundle), fileBase: filename(draft.name) };
}

export function filename(name) {
  return name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'postcard';
}

export function keptRecord(prepared) {
  if (!prepared || !validateDraft(prepared.draft).valid) throw new Error('Prepare a valid postcard before keeping it.');
  return JSON.stringify({ version: 1, draft: prepared.draft });
}

export function recoverRecord(raw) {
  if (typeof raw !== 'string' || raw.length > 10000) throw new Error('The kept postcard is not a readable record.');
  let record;
  try { record = JSON.parse(raw); } catch { throw new Error('The kept postcard is not readable. You can forget it and keep a new copy.'); }
  if (!record || record.version !== 1 || !record.draft || ['name', 'recipient', 'sender', 'message', 'format'].some(key => typeof record.draft[key] !== 'string')) throw new Error('The kept postcard uses an unsupported record format.');
  const validation = validateDraft(record.draft);
  if (!validation.valid) throw new Error('The kept postcard has invalid content. You can forget it and keep a new copy.');
  return validation.draft;
}
