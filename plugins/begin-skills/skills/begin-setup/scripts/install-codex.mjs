#!/usr/bin/env node
/** Project-local installation from an extracted Begin release. No dependencies or network. */
import fs from 'node:fs/promises';
import { constants, createReadStream } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const self = fileURLToPath(import.meta.url);
const names = [
  'begin-architecture', 'begin-backend', 'begin-content', 'begin-data', 'begin-design',
  'begin-diagrams', 'begin-frontend', 'begin-learn-products', 'begin-publish', 'begin-quality',
  'begin-security', 'begin-services', 'begin-setup', 'begin-website', 'begin-writing-docs',
];
const versionPattern = /^\d+\.\d+\.\d+(?:-[a-z0-9.]+)?$/;
const hashPattern = /^[a-f0-9]{64}$/;
const uuidPattern = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const atomicTemporaryPattern = /^(transaction|install)\.json\.([a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})\.tmp$/;
const help = `Begin for Codex — project-local Skills

  node install-codex.mjs install --project /path/to/your/project
  node install-codex.mjs status  --project /path/to/your/project
  node install-codex.mjs update  --project /path/to/your/project
  node install-codex.mjs remove  --project /path/to/your/project
  node install-codex.mjs recover --project /path/to/your/project

Install and update: run the script inside an extracted plugin or Skills ZIP.
Keep the extracted release and your project in separate directories.
Status and remove also work from the installed begin-setup/scripts directory.
Recover: settle an interrupted install, update, or removal before trying again.

Begin verifies RELEASE.json and every delivered file before installation.
It installs 15 Skills in PROJECT/.agents/skills and records ownership in
PROJECT/.agents/begin. Updates and removal keep the previous Skills there.
Existing website files, AGENTS.md, BEGIN.md, and other Skills are preserved.
Changed managed Skills stop an update or removal; save your changes separately
and restore the installed bytes before retrying. No global settings are changed.

After installation, reopen this project or start a new Codex conversation and
send: $begin-setup Set up Begin in this project and preserve my existing files.
`;
const inside = (root, file) => file === root || file.startsWith(root + path.sep);
const quote = value => "'" + value.replaceAll("'", "'\\''") + "'";
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const json = value => JSON.stringify(value, null, 2) + '\n';
const stable = value => JSON.stringify(value, (_key, item) => object(item)
  ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item);

function argumentsFor(argv) {
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) return { help: true };
  const [command, ...rest] = argv;
  if (!['install', 'status', 'update', 'remove', 'recover'].includes(command)
      || rest.length !== 2 || rest[0] !== '--project' || !rest[1] || rest[1].startsWith('--')) {
    throw new Error('Use install, status, update, remove, or recover with --project PATH. See --help.');
  }
  return { command, project: path.resolve(rest[1]) };
}

async function present(file) {
  try { return await fs.lstat(file); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

async function noSymlinks(file) {
  // Inspect every existing ancestor, including aliases supplied on the command line.
  for (let node = path.resolve(file);;) {
    const stat = await present(node);
    if (stat?.isSymbolicLink()) throw new Error(`Symlinks are not supported: ${node}`);
    if (node !== file && stat && !stat.isDirectory()) throw new Error(`A parent is not a directory: ${node}`);
    const parent = path.dirname(node);
    if (node === parent) return;
    node = parent;
  }
}

function relativeName(name) {
  if (typeof name !== 'string' || !name || name.includes('\\') || /[\x00-\x1f]/.test(name)
      || path.posix.isAbsolute(name) || name.includes(':')
      || name.split('/').some(part => !part || part === '.' || part === '..')) {
    throw new Error(`Unsafe release or receipt path: ${JSON.stringify(name)}`);
  }
  return name;
}

async function digest(file) {
  const stat = await fs.lstat(file);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Expected a regular file: ${file}`);
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

async function inventory(root, hashFiles = true, directories) {
  const result = {};
  async function walk(directory, prefix) {
    const stat = await fs.lstat(directory);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`Expected a plain directory: ${directory}`);
    for (const entry of (await fs.readdir(directory)).sort()) {
      const name = prefix ? `${prefix}/${entry}` : entry;
      relativeName(name);
      const file = path.join(directory, entry);
      const item = await fs.lstat(file);
      if (item.isSymbolicLink()) throw new Error(`Symlinks are not supported: ${file}`);
      if (item.isDirectory()) { directories?.add(name); await walk(file, name); }
      else if (item.isFile()) result[name] = hashFiles ? await digest(file) : '';
      else throw new Error(`Unsupported filesystem entry: ${file}`);
    }
  }
  await walk(root, '');
  return result;
}

function differences(expected, actual) {
  return [...new Set([...Object.keys(expected), ...Object.keys(actual)])].sort().flatMap(name => {
    if (!Object.hasOwn(actual, name)) return [`Missing: ${name}`];
    if (!Object.hasOwn(expected, name)) return [`Added: ${name}`];
    return actual[name] === expected[name] ? [] : [`Changed: ${name}`];
  });
}

function validateSkillFiles(files) {
  if (!object(files) || !Object.keys(files).length) throw new Error('The Skill file inventory is missing.');
  for (const [name, hash] of Object.entries(files)) {
    relativeName(name);
    if (!names.includes(name.split('/')[0]) || name.split('/').length < 2 || !hashPattern.test(hash)) {
      throw new Error(`Invalid managed Skill file: ${name}`);
    }
  }
  for (const name of names) if (!files[`${name}/SKILL.md`]) throw new Error(`Missing Skill: ${name}`);
  if (!files['begin-setup/scripts/install-codex.mjs']) throw new Error('The release has no Codex installer.');
}

async function sourceRelease(project) {
  const scripts = path.dirname(self);
  const setup = path.dirname(scripts);
  const parent = path.dirname(setup);
  if (path.basename(scripts) !== 'scripts' || path.basename(setup) !== 'begin-setup') {
    throw new Error('Run this installer from the extracted begin-setup/scripts directory.');
  }
  // A portable extraction may itself be named "skills". Use its receipt location,
  // not the user's chosen extraction-folder name, to distinguish the two layouts.
  await noSymlinks(parent);
  const plugin = !await present(path.join(parent, 'RELEASE.json')) && path.basename(parent) === 'skills';
  const root = plugin ? path.dirname(parent) : parent;
  if (inside(project, root) || inside(root, project)) {
    throw new Error('Keep the extracted release outside the project, and the project outside the extracted release.');
  }
  await noSymlinks(root);
  await noSymlinks(path.join(root, 'RELEASE.json'));
  let raw;
  try { raw = await fs.readFile(path.join(root, 'RELEASE.json')); }
  catch (error) {
    if (error.code === 'ENOENT') throw new Error('RELEASE.json is missing. Install or update from an extracted delivered ZIP, not a copied Skill or repository source.');
    throw error;
  }
  const release = JSON.parse(raw);
  if (release.name !== 'begin-skills' || !versionPattern.test(release.version)
      || release.kind !== (plugin ? 'plugin' : 'skills') || !object(release.files)) {
    throw new Error('RELEASE.json has an invalid Begin identity, version, kind, or inventory.');
  }
  for (const [name, hash] of Object.entries(release.files)) {
    relativeName(name);
    if (name === 'RELEASE.json' || !hashPattern.test(hash)) throw new Error(`Invalid release file: ${name}`);
  }
  const actual = await inventory(root);
  delete actual['RELEASE.json'];
  const changes = differences(release.files, actual);
  if (changes.length) throw new Error(`Release integrity check failed:\n${changes.slice(0, 8).join('\n')}`);
  const files = Object.fromEntries(Object.entries(release.files)
    .filter(([name]) => !plugin || name.startsWith('skills/'))
    .map(([name, hash]) => [plugin ? name.slice(7) : name, hash]));
  validateSkillFiles(files);
  const skillRoot = plugin ? path.join(root, 'skills') : root;
  for (const name of names) {
    const metadata = await fs.readFile(path.join(skillRoot, name, 'SKILL.md'), 'utf8');
    if (!new RegExp(`^name: ${name}\\s*$`, 'm').test(metadata)) throw new Error(`Skill metadata disagrees: ${name}`);
  }
  if (plugin) for (const name of ['plugin.json', '.codex-plugin/plugin.json', '.claude-plugin/plugin.json']) {
    const manifest = JSON.parse(await fs.readFile(path.join(root, name), 'utf8'));
    if (manifest.name !== release.name || manifest.version !== release.version) throw new Error(`Manifest disagrees with RELEASE.json: ${name}`);
  }
  return { root, skillRoot, version: release.version, kind: release.kind, files,
    releaseSha256: createHash('sha256').update(raw).digest('hex') };
}

function validateReceipt(receipt) {
  if (!object(receipt) || receipt.schema !== 1 || receipt.name !== 'begin-skills'
      || !versionPattern.test(receipt.version) || !['plugin', 'skills'].includes(receipt.kind)
      || !hashPattern.test(receipt.releaseSha256) || !uuidPattern.test(receipt.transaction)) {
    throw new Error('The Begin installation receipt is invalid. No files were changed.');
  }
  validateSkillFiles(receipt.files);
  return receipt;
}

async function readReceipt(control) {
  const file = path.join(control, 'install.json');
  const stat = await present(file);
  if (!stat) return null;
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('The Begin receipt must be a regular file.');
  return validateReceipt(JSON.parse(await fs.readFile(file, 'utf8')));
}

async function controlState(control) {
  if (!await present(control)) return false;
  await noSymlinks(control);
  const actual = await inventory(control, false); // Reject symlinks without hashing every retained version.
  if (!Object.hasOwn(actual, 'OWNER.json')) throw new Error(`${control} already exists without Begin's ownership marker. Choose another project or resolve the directory yourself.`);
  const owner = JSON.parse(await fs.readFile(path.join(control, 'OWNER.json'), 'utf8'));
  if (owner.name !== 'begin-skills' || owner.schema !== 1) throw new Error('The Begin control directory belongs to an unknown owner.');
  const allowed = new Set(['OWNER.json', 'install.json', 'transaction.json', 'lock', 'history', 'staging']);
  for (const entry of await fs.readdir(control)) if (!allowed.has(entry) && !atomicTemporaryPattern.test(entry)) {
    throw new Error(`Unexpected Begin control entry: ${entry}. Preserve it before retrying.`);
  }
  return true;
}

async function managedDifferences(target, receipt) {
  const actual = {};
  for (const name of names) if (await present(path.join(target, name))) {
    const files = await inventory(path.join(target, name));
    for (const [file, hash] of Object.entries(files)) actual[`${name}/${file}`] = hash;
  }
  return differences(receipt.files, actual);
}

async function unchanged(target, receipt) {
  const changes = await managedDifferences(target, receipt);
  if (changes.length) throw new Error(`Managed Skills have changed. Save your edits separately and restore the installed bytes before update or removal.\n${changes.slice(0, 8).join('\n')}`);
}

async function atomicJson(file, value) {
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, json(value), { flag: 'wx' });
    await fs.rename(temporary, file);
  } finally { await fs.rm(temporary, { force: true }); }
}

function lockOwner(owner, legacyAllowed = true) {
  if (!object(owner)) throw new Error('Invalid installer lock; preserve it and inspect it before retrying.');
  const legacy = legacyAllowed && Object.keys(owner).length === 1 && Object.hasOwn(owner, 'pid');
  const current = owner.schema === 1 && owner.name === 'begin-skills-lock' && uuidPattern.test(owner.token)
    && Object.keys(owner).sort().join(',') === 'name,pid,schema,token';
  if ((!legacy && !current) || !Number.isSafeInteger(owner.pid) || owner.pid <= 0) {
    throw new Error('Invalid installer lock; preserve it and inspect it before retrying.');
  }
  return owner;
}

function running(pid) {
  try { process.kill(pid, 0); return true; }
  catch (error) { if (error.code === 'ESRCH') return false; throw error; }
}

async function publicLock(lock) {
  const stat = await present(lock);
  if (!stat) return null;
  const directory = stat.isDirectory();
  if ((!directory && !stat.isFile()) || (directory && (await fs.readdir(lock)).join(',') !== 'owner.json')) {
    throw new Error('The published installer lock has unknown or incomplete ownership. Preserve it and establish that no installer is running before resolving it manually.');
  }
  const bytes = await fs.readFile(directory ? path.join(lock, 'owner.json') : lock);
  const owner = lockOwner(JSON.parse(bytes));
  // Include the inode so replacing a legacy lock with identical PID bytes still
  // forms a new ownership epoch. The bytes and public path remain unchanged.
  const identity = createHash('sha256').update(`${stat.dev}:${stat.ino}:`).update(bytes).digest('hex');
  return { owner, identity, directory };
}

async function claimReclamation(control, observed, ownerFile) {
  const claims = path.join(control, 'staging', 'lock-claims');
  await fs.mkdir(claims, { recursive: true });
  let epoch = observed.identity;
  for (let depth = 0; depth < 64; depth++) {
    const claim = path.join(claims, `${epoch}.json`);
    try { await fs.link(ownerFile, claim); return; }
    catch (error) { if (error.code !== 'EEXIST') throw error; }
    if (!(await fs.lstat(claim)).isFile()) throw new Error('Unknown reclamation claim. Preserve it before recovery.');
    const owner = lockOwner(JSON.parse(await fs.readFile(claim, 'utf8')), false);
    if (running(owner.pid)) throw new Error(`Another Begin recovery is reclaiming this lock (PID ${owner.pid}). Wait for it to finish.`);
    // Claims are immutable and never deleted. After a claimant dies, only one
    // successor can claim its token. This preserves exclusion across crashes.
    epoch = createHash('sha256').update(`${epoch}:${owner.token}`).digest('hex');
  }
  throw new Error('Too many interrupted reclamation claims. Preserve the lock records before inspection.');
}

async function acquire(control, recovery = false) {
  const lock = path.join(control, 'lock');
  // Publish a hard link to already complete ownership bytes. Unlike renaming a
  // directory, linking refuses every existing destination, including an empty
  // legacy lock. Death during preparation leaves no public ownership claim.
  const token = randomUUID();
  const preparation = path.join(control, 'staging', `lock-${token}`);
  const preparedLock = path.join(preparation, 'lock');
  let acquired;
  try {
    await fs.mkdir(preparedLock, { recursive: true });
    await fs.writeFile(path.join(preparedLock, 'owner.json'), json({
      schema: 1, name: 'begin-skills-lock', pid: process.pid, token,
    }), { flag: 'wx' });
    const ownerFile = path.join(preparedLock, 'owner.json');
    const observed = await publicLock(lock);
    if (observed) {
      if (running(observed.owner.pid)) throw new Error(`Another Begin installer may be running (PID ${observed.owner.pid}). Wait for it to finish.`);
      if (!recovery) throw new Error('An interrupted installer left a lock. Run recover --project PATH first.');
      await claimReclamation(control, observed, ownerFile);
      const current = await publicLock(lock);
      if (current?.identity !== observed.identity || running(current.owner.pid)) {
        throw new Error('Lock ownership changed during recovery. The current lock was preserved; retry after the other operation finishes.');
      }
      await fs.rm(lock, { recursive: current.directory });
    }
    await fs.link(ownerFile, lock);
    acquired = await publicLock(lock);
    if (acquired?.owner.token !== token || acquired.owner.pid !== process.pid) throw new Error('Published lock ownership changed. The current lock was preserved.');
  } finally { await fs.rm(preparation, { recursive: true, force: true }); }
  return async () => {
    const current = await publicLock(lock);
    if (current?.identity !== acquired.identity) throw new Error('Installer lock ownership changed before cleanup. The current lock was preserved.');
    await fs.unlink(lock);
  };
}

function subset(files, skill) {
  return Object.fromEntries(Object.entries(files ?? {}).filter(([name]) => name.startsWith(`${skill}/`))
    .map(([name, hash]) => [name.slice(skill.length + 1), hash]));
}

async function matches(directory, files) {
  return (await present(directory)) && differences(files, await inventory(directory)).length === 0;
}

async function validateStaging(stage, files) {
  if (!await present(stage)) return;
  const allowedDirectories = new Set();
  for (const name of Object.keys(files)) {
    const parts = name.split('/');
    for (let length = 1; length < parts.length; length++) allowedDirectories.add(parts.slice(0, length).join('/'));
  }
  const directories = new Set();
  const actual = await inventory(stage, true, directories);
  // Copying may have stopped early, or complete Skills may already have moved.
  // Missing entries are expected; changed bytes and unknown entries are not ours to delete.
  const changed = Object.entries(actual).filter(([name, hash]) => files[name] !== hash).map(([name]) => name);
  const unknownDirectories = [...directories].filter(name => !allowedDirectories.has(name));
  if (changed.length || unknownDirectories.length) {
    throw new Error(`Staging contains changed or unknown material. Preserve it before retrying: ${stage}\n${[...changed, ...unknownDirectories].slice(0, 8).join('\n')}`);
  }
}

function validateJournal(journal) {
  if (!object(journal) || journal.schema !== 1 || !uuidPattern.test(journal.id)
      || !['install', 'update', 'remove'].includes(journal.command)) throw new Error('Invalid recovery journal. No managed files were changed.');
  const before = journal.before === null ? null : validateReceipt(journal.before);
  const after = journal.after === null ? null : validateReceipt(journal.after);
  if ((journal.command === 'install' && (before || !after))
      || (journal.command === 'update' && (!before || !after))
      || (journal.command === 'remove' && (!before || after))
      || (after && after.transaction !== journal.id)) throw new Error('Recovery journal identities disagree.');
  return journal;
}

async function atomicTemporaries(control) {
  return (await fs.readdir(control)).filter(name => atomicTemporaryPattern.test(name)).sort();
}

async function reconcileAtomicTemporary(control, target) {
  const candidates = await atomicTemporaries(control);
  if (!candidates.length) return;
  if (candidates.length !== 1) throw new Error('Multiple pending JSON files need inspection. Preserve them before retrying recovery.');
  const name = candidates[0];
  const temporary = path.join(control, name);
  if (!(await fs.lstat(temporary)).isFile()) throw new Error('Pending JSON state is not a regular file. Preserve it before recovery.');
  let value;
  try { value = JSON.parse(await fs.readFile(temporary, 'utf8')); }
  catch { throw new Error(`Pending JSON state is incomplete or unknown: ${name}. Preserve it before resolving it manually.`); }
  const journalFile = path.join(control, 'transaction.json');
  const existing = await present(journalFile)
    ? validateJournal(JSON.parse(await fs.readFile(journalFile, 'utf8'))) : null;
  let journal;
  if (name.startsWith('transaction.json.')) {
    journal = validateJournal(value);
    if (existing && stable(existing) !== stable(journal)) throw new Error('Pending journal differs from the active transaction. Both were preserved.');
    if (!existing) {
      // A journal that never reached its rename cannot have moved discovered
      // Skills. Check that state and the full prepared snapshot before adoption.
      if (stable(await readReceipt(control)) !== stable(journal.before)) throw new Error('Pending journal no longer matches the active receipt. It was preserved.');
      if (journal.before) await unchanged(target, journal.before);
      else for (const skill of names) if (await present(path.join(target, skill))) throw new Error(`Pending installation conflicts with ${skill}. Preserve it before recovery.`);
      const stage = path.join(control, 'staging', journal.id);
      await validateStaging(stage, journal.after?.files ?? {});
      if (journal.after && !await matches(stage, journal.after.files)) throw new Error('Pending journal has no intact prepared snapshot. Preserve its files before recovery.');
      const backup = path.join(control, 'history', journal.id, 'skills');
      if (await present(backup) && Object.keys(await inventory(backup)).length) throw new Error('Pending journal already has moved backup files. Preserve them before inspection.');
      await fs.rename(temporary, journalFile);
      return;
    }
  } else {
    const pendingReceipt = validateReceipt(value);
    if (!existing || !existing.after || stable(existing.after) !== stable(pendingReceipt)) {
      throw new Error('Pending receipt has no matching transaction. Its bytes were preserved.');
    }
    journal = existing;
  }
  await validateStaging(path.join(control, 'staging', journal.id), journal.after?.files ?? {});
  // Retain verified pre-rename bytes outside discovery before settling. This
  // avoids another crash window between deleting the journal and its temporary.
  const retained = path.join(control, 'history', journal.id, 'recovery', name);
  if (await present(retained)) throw new Error('The recovery destination already exists. Both copies were preserved.');
  await fs.mkdir(path.dirname(retained), { recursive: true });
  await fs.rename(temporary, retained);
}

async function settle(control, target) {
  await reconcileAtomicTemporary(control, target);
  const file = path.join(control, 'transaction.json');
  if (!await present(file)) return 'No interrupted transaction.';
  const journal = validateJournal(JSON.parse(await fs.readFile(file, 'utf8')));
  const { before, after } = journal;
  const stage = path.join(control, 'staging', journal.id);
  const history = path.join(control, 'history', journal.id);
  const backup = path.join(history, 'skills');
  await validateStaging(stage, after?.files ?? {});
  const current = await readReceipt(control);
  if (stable(current) === stable(after)) {
    // The receipt is the commit point. A crash after it only needs cleanup.
    if (after) await unchanged(target, after);
    else for (const name of names) if (await present(path.join(target, name))) throw new Error(`Cannot finish removal: a new Skill now occupies ${name}. Preserve it before recovery.`);
    await fs.rm(stage, { recursive: true, force: true });
    await fs.unlink(file);
    return `Finished interrupted ${journal.command}.`;
  }
  if (stable(current) !== stable(before)) throw new Error('Receipt changed during the transaction. Preserve the journal and history before manual recovery.');
  // Validate every path before restoring any path. User edits after interruption are preserved.
  const plans = [];
  for (const name of names) {
    const destination = path.join(target, name);
    const saved = path.join(backup, name);
    const hasDestination = Boolean(await present(destination));
    const hasSaved = Boolean(await present(saved));
    const oldFiles = subset(before?.files, name);
    const newFiles = subset(after?.files, name);
    if (hasSaved && (!before || !await matches(saved, oldFiles))) throw new Error(`Recovery backup changed: ${name}. No restoration was attempted.`);
    const oldAtDestination = before && hasDestination && await matches(destination, oldFiles);
    const newAtDestination = after && hasDestination && await matches(destination, newFiles);
    if (hasDestination && !oldAtDestination && !newAtDestination) throw new Error(`Recovery would overwrite changed files: ${name}. Preserve them before retrying.`);
    if (before && !hasSaved && !oldAtDestination) throw new Error(`Recovery has no intact previous copy: ${name}. Preserve the journal for manual recovery.`);
    if (hasSaved && oldAtDestination && !newAtDestination) throw new Error(`Recovery has two previous copies of ${name}; inspect them before retrying.`);
    plans.push({ destination, saved, hasSaved, remove: hasDestination && (hasSaved || !before) });
  }
  for (const plan of plans) {
    if (plan.remove) await fs.rm(plan.destination, { recursive: true });
    if (plan.hasSaved) await fs.rename(plan.saved, plan.destination);
  }
  await fs.rm(stage, { recursive: true, force: true });
  await fs.unlink(file);
  return `Restored the state before interrupted ${journal.command}.`;
}

async function transact(control, target, command, before, source) {
  const id = randomUUID();
  const after = source ? {
    schema: 1, name: 'begin-skills', version: source.version, kind: source.kind,
    releaseSha256: source.releaseSha256, transaction: id, installedAt: new Date().toISOString(),
    files: source.files,
  } : null;
  const stage = path.join(control, 'staging', id);
  const history = path.join(control, 'history', id);
  const backup = path.join(history, 'skills');
  let journalWritten = false;
  try {
    if (source) {
      await fs.mkdir(stage, { recursive: true });
      for (const name of Object.keys(source.files).sort()) {
        const from = path.join(source.skillRoot, ...name.split('/'));
        const to = path.join(stage, ...name.split('/'));
        await noSymlinks(from);
        await fs.mkdir(path.dirname(to), { recursive: true });
        await fs.copyFile(from, to, constants.COPYFILE_EXCL);
      }
      const changes = differences(source.files, await inventory(stage));
      if (changes.length) throw new Error('The release changed while copying. Installation stopped before replacing Skills.');
    }
    if (before) {
      await fs.mkdir(backup, { recursive: true });
      await fs.writeFile(path.join(history, 'install.json'), json(before), { flag: 'wx' });
    }
    // All source bytes are verified and the previous receipt is retained before replacement.
    await atomicJson(path.join(control, 'transaction.json'), { schema: 1, id, command, before, after });
    journalWritten = true;
    for (const name of names) {
      const destination = path.join(target, name);
      if (before) await fs.rename(destination, path.join(backup, name));
      else if (await present(destination)) throw new Error(`A Skill appeared during installation: ${name}.`);
      if (after) await fs.rename(path.join(stage, name), destination);
    }
    if (after) await atomicJson(path.join(control, 'install.json'), after);
    else await fs.unlink(path.join(control, 'install.json'));
    await settle(control, target);
    return { receipt: after, history: before ? history : null };
  } catch (error) {
    if (journalWritten) {
      try { await settle(control, target); }
      catch (recoveryError) {
        throw new Error(`${error.message}\nRecovery stopped: ${recoveryError.message}\nKeep ${control}; run recover --project PATH after preserving any changed files.`);
      }
    } else {
      try {
        await validateStaging(stage, source?.files ?? {});
        await fs.rm(stage, { recursive: true, force: true });
      } catch (cleanupError) {
        throw new Error(`${error.message}\nStaging cleanup stopped: ${cleanupError.message}`);
      }
    }
    throw error;
  }
}

function next(project, out) {
  out.log('Reopen this project or start a new Codex conversation so Codex can discover the Skills.');
  out.log('Send: $begin-setup Set up Begin in this project and preserve my existing files.');
  out.log(`Check later: node ${quote(path.join(project, '.agents/skills/begin-setup/scripts/install-codex.mjs'))} status --project ${quote(project)}`);
}

export async function run(argv, out = console) {
  const args = argumentsFor(argv);
  if (args.help) { out.log(help); return 0; }
  const { command, project } = args;
  await noSymlinks(self);
  if (process.argv[1]) await noSymlinks(path.resolve(process.argv[1]));
  await noSymlinks(project);
  if (!(await present(project))?.isDirectory()) throw new Error('Choose an existing project directory with --project PATH.');
  const target = path.join(project, '.agents', 'skills');
  const control = path.join(project, '.agents', 'begin');
  await noSymlinks(target);
  const controlled = await controlState(control);
  const receipt = controlled ? await readReceipt(control) : null;
  const pending = controlled && (await present(path.join(control, 'transaction.json'))
    || (await atomicTemporaries(control)).length > 0);
  if (command === 'status') {
    if (pending || (controlled && await present(path.join(control, 'lock')))) {
      throw new Error(`An installer is running or was interrupted. Inspect ${control}; if no installer is running, use recover --project ${quote(project)}.`);
    }
    if (!receipt) {
      const unmanaged = [];
      for (const name of names) if (await present(path.join(target, name))) unmanaged.push(name);
      out.log('Begin has no managed installation in this project.');
      if (unmanaged.length) out.log(`Unmanaged Begin names are preserved: ${unmanaged.join(', ')}`);
      return 0;
    }
    const changes = await managedDifferences(target, receipt);
    out.log(`Begin ${receipt.version}: ${names.length} project Skills, ${Object.keys(receipt.files).length} managed files.`);
    if (changes.length) { out.log(`Managed files differ from the installation receipt:\n${changes.slice(0, 12).join('\n')}`); return 2; }
    out.log('Installed content matches the receipt.');
    next(project, out);
    return 0;
  }
  if (command === 'recover') {
    if (!controlled) { out.log('No Begin transaction to recover.'); return 0; }
    const release = await acquire(control, true);
    try { out.log(await settle(control, target)); }
    finally { await release(); }
    return 0;
  }
  if (pending) throw new Error('An interrupted transaction needs recovery. Run recover --project PATH first.');
  if (command === 'remove' && !receipt) { out.log('No managed Begin installation to remove. Existing files were preserved.'); return 0; }
  if (command === 'install' && receipt) throw new Error(`Begin ${receipt.version} is already installed. Use status or update; installation will not replace it.`);
  if (command === 'update' && !receipt) throw new Error('Begin is not managed in this project. Use install first.');
  const source = command === 'remove' ? null : await sourceRelease(project);
  if (receipt) await unchanged(target, receipt);
  else for (const name of names) if (await present(path.join(target, name))) throw new Error(`Existing Skill conflicts: ${name}. Preserve it or choose another project. Begin will not take ownership of it.`);
  if (command === 'update' && receipt.version === source.version) {
    if (differences(receipt.files, source.files).length) throw new Error('This release version has different Skill bytes. Use a distinct version for the changed release.');
    out.log(`Begin ${receipt.version} is already current; no files changed.`);
    next(project, out);
    return 0;
  }
  if (!controlled) {
    await fs.mkdir(path.dirname(control), { recursive: true });
    await fs.mkdir(control);
    await fs.writeFile(path.join(control, 'OWNER.json'), json({ schema: 1, name: 'begin-skills' }), { flag: 'wx' });
  }
  await fs.mkdir(target, { recursive: true });
  const release = await acquire(control);
  try {
    // Recheck ownership and bytes under the lock before any managed replacement.
    if (stable(await readReceipt(control)) !== stable(receipt)) throw new Error('The receipt changed while preparing installation. Retry after the other operation finishes.');
    if (receipt) await unchanged(target, receipt);
    else for (const name of names) if (await present(path.join(target, name))) throw new Error(`Existing Skill conflicts: ${name}. No Skills were replaced.`);
    const result = await transact(control, target, command, receipt, source);
    out.log(command === 'remove' ? 'Begin project Skills removed.' : `Begin ${result.receipt.version} ${command === 'update' ? 'updated' : 'installed'}: ${names.length} Skills in ${target}`);
    if (result.history) out.log(`Previous version preserved outside Skill discovery: ${result.history}`);
    out.log(command === 'remove' ? 'The active installation receipt was removed; retained versions remain in the history directory.'
      : `Installation record: ${path.join(control, 'install.json')}`);
    if (command !== 'remove') next(project, out);
  } finally { await release(); }
  return 0;
}

if (process.argv[1] && await fs.realpath(process.argv[1]) === await fs.realpath(self)) {
  try { process.exitCode = await run(process.argv.slice(2)); }
  catch (error) { console.error(`Begin: ${error.message}`); process.exitCode = 1; }
}
