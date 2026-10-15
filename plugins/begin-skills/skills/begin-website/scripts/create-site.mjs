#!/usr/bin/env node
import { cp, lstat, mkdir, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const choices = ['service', 'portfolio', 'product', 'editorial'];
const usage = 'node create-site.mjs --template service|portfolio|product|editorial --output NEW_DIRECTORY [--contact mailto:you@domain.com|https://your-contact-page]';

function options(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (key === '--help') return { help: true };
    if (!['--template', '--output', '--contact'].includes(key) || out[key] !== undefined || !argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error(usage);
    out[key] = argv[++i];
  }
  return out;
}

function contactDestination(value) {
  if (/[\s<>"'\x00-\x1f]/.test(value)) throw new Error('Contact destination must be a mailto address or HTTPS URL without whitespace.');
  let url;
  try { url = new URL(value); } catch { throw new Error('Contact destination is not a valid URL.'); }
  if (url.protocol === 'mailto:') {
    if (!/^[^@?%]+@[^@?%]+\.[^@?%]+$/.test(url.pathname) || url.search || url.hash) throw new Error('Use one mailto email address without extra parameters.');
  } else if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error('Use an HTTPS contact page or one mailto email address.');
  }
  const host = (url.protocol === 'mailto:' ? url.pathname.split('@')[1] : url.hostname).toLowerCase().replace(/\.+$/, '');
  const fixture = /(^|\.)(example\.(com|org|net)|example|localhost|test|invalid)$/.test(host);
  return { value, fixture };
}

const escapeAttribute = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const shellQuote = value => "'" + value.replaceAll("'", "'\\''") + "'";
const within = (root, candidate) => candidate === root || candidate.startsWith(root + path.sep);

try {
  const args = options(process.argv.slice(2));
  if (args.help) { console.log(usage); process.exit(0); }
  if (!choices.includes(args['--template']) || !args['--output']) throw new Error(usage);
  const source = path.join(skillRoot, 'assets', 'starters', args['--template']);
  await lstat(path.join(source, 'index.html'));
  const destination = path.resolve(args['--output']);
  const contact = args['--contact'] ? contactDestination(args['--contact']) : null;
  // Refuse existing targets, including symlinks; never merge into a user's project.
  try { await lstat(destination); throw new Error(`Destination already exists: ${destination}. Choose a new directory.`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const actualSkill = await realpath(skillRoot);
  // Check the closest existing ancestor before creating any parents, including aliases.
  let ancestor = path.dirname(destination);
  for (;;) {
    try {
      if (within(actualSkill, await realpath(ancestor))) throw new Error('Create the website outside the installed Skill directory.');
      break;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const parent = path.dirname(ancestor);
      if (parent === ancestor) throw error;
      ancestor = parent;
    }
  }
  await mkdir(path.dirname(destination), { recursive: true });
  const actualParent = await realpath(path.dirname(destination));
  if (within(actualSkill, actualParent)) throw new Error('Create the website outside the installed Skill directory.');
  await mkdir(destination); // exclusive: a concurrent creator causes EEXIST
  try {
    for (const entry of await readdir(source)) {
      await cp(path.join(source, entry), path.join(destination, entry), {
        recursive: true, force: false, errorOnExist: true,
        filter: async file => {
          if ((await lstat(file)).isSymbolicLink()) throw new Error('Starter contains a symlink; copying stopped.');
          return !['.review', '.begin-preview', 'node_modules', '.env', '.git'].includes(path.basename(file));
        },
      });
    }
    if (contact) {
      const htmlFile = path.join(destination, 'index.html');
      let html = await readFile(htmlFile, 'utf8');
      let changed = 0;
      html = html.replace(/<a\b[^>]*>/gi, tag => {
        if (!/\bdata-begin-contact(?:\s|=|>)/.test(tag)) return tag;
        if (!/\bhref\s*=\s*(["']).*?\1/i.test(tag)) throw new Error('A contact anchor has no replaceable href.');
        changed++;
        return tag.replace(/\bhref\s*=\s*(["']).*?\1/i, () => `href="${escapeAttribute(contact.value)}"`);
      });
      if (!changed) throw new Error('Starter has no marked contact links.');
      if (!contact.fixture) html = html.replace(/<span\b[^>]*\bdata-begin-contact-example(?=\s|=|>)[^>]*>[\s\S]*?<\/span>/gi, '');
      await writeFile(htmlFile, html);
    }
    for (const name of ['AGENTS.md', 'CLAUDE.md', 'BEGIN.md']) {
      await cp(path.join(skillRoot, 'assets', 'project-guidance', name), path.join(destination, name), { force: false, errorOnExist: true });
    }
    await writeFile(path.join(destination, 'begin-project.json'), JSON.stringify({
      template: args['--template'], contactConfigured: Boolean(contact && !contact.fixture),
      contactDestination: contact?.value ?? null,
      note: 'Configuration records a destination only. Delivery still needs an actual check.',
    }, null, 2) + '\n');
  } catch (error) { await rm(destination, { recursive: true, force: true }); throw error; }
  console.log(`Website created: ${destination}`);
  console.log(contact && !contact.fixture ? 'Contact destination configured. Verify delivery before publishing.' : 'Contact is still an example. Supply the owner\'s real destination before publishing.');
  console.log(`Preview: node ${shellQuote(path.join(skillRoot, 'scripts', 'preview.mjs'))} --dir ${shellQuote(destination)} --port 0 --background`);
} catch (error) { console.error(`Begin: ${error.message}`); process.exitCode = 1; }
