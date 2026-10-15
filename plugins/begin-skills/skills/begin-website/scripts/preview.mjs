#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const self = fileURLToPath(import.meta.url);
const usage = `node preview.mjs --dir WEBSITE_DIRECTORY [--port 0] [--background]
node preview.mjs --dir WEBSITE_DIRECTORY --status
node preview.mjs --dir WEBSITE_DIRECTORY --stop

The default runs in the foreground; stop it with Ctrl+C.
--background starts a detached local preview that survives the launching command.
--status checks its authenticated ownership and actual URL; --stop closes it.
The private .begin-preview directory stores this website's local ownership record.
No global configuration, remote hosting, or PID signals are used for management.`;
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2' };
const within = (root, candidate) => candidate === root || candidate.startsWith(root + path.sep);
const publicPath = (root, candidate) => within(root, candidate)
  && !path.relative(root, candidate).split(path.sep).some(part => part.startsWith('.'));
const json = value => JSON.stringify(value, null, 2) + '\n';
const quote = value => "'" + value.replaceAll("'", "'\\''") + "'";
const tokenPattern = /^[a-f0-9]{64}$/;

async function present(file) {
  try { return await fs.lstat(file); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

function options(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (key === '--help') return { help: true };
    if (['--background', '--status', '--stop'].includes(key) && args[key] === undefined) { args[key] = true; continue; }
    if (!['--dir', '--port'].includes(key) || args[key] !== undefined || !argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error(usage);
    args[key] = argv[++i];
  }
  if (!args['--dir'] || ['--background', '--status', '--stop'].filter(key => args[key]).length > 1) throw new Error(usage);
  const port = Number(args['--port'] ?? 0);
  if (!/^\d+$/.test(args['--port'] ?? '0') || !Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Port must be an integer from 0 to 65535.');
  if ((args['--status'] || args['--stop']) && args['--port']) throw new Error('Status and stop use the recorded preview port. Omit --port.');
  return { ...args, port };
}

async function controlDirectory(root, create = false) {
  const control = path.join(root, '.begin-preview');
  const stat = await present(control);
  if (!stat) {
    if (!create) return null;
    await fs.mkdir(control, { mode: 0o700 });
    await fs.writeFile(path.join(control, '.gitignore'), '*\n', { flag: 'wx', mode: 0o600 });
    await fs.writeFile(path.join(control, 'OWNER.json'), json({ schema: 1, name: 'begin-preview', root }), { flag: 'wx', mode: 0o600 });
  } else if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('The preview control directory is not a plain directory. Its contents were preserved.');
  const ownerFile = path.join(control, 'OWNER.json');
  const ownerStat = await present(ownerFile);
  if (!ownerStat?.isFile() || ownerStat.isSymbolicLink()) throw new Error('The preview directory has no recognized ownership marker. Its contents were preserved.');
  const owner = JSON.parse(await fs.readFile(ownerFile, 'utf8'));
  if (owner.schema !== 1 || owner.name !== 'begin-preview' || owner.root !== root) throw new Error('The preview directory belongs to another or unknown website. Its contents were preserved.');
  return control;
}

function validSession(value, root) {
  if (!value || value.schema !== 1 || value.name !== 'begin-preview' || value.root !== root
      || !tokenPattern.test(value.token) || !Number.isSafeInteger(value.pid) || value.pid <= 0
      || !['starting', 'ready'].includes(value.state)
      || !(value.port === null || (Number.isInteger(value.port) && value.port > 0 && value.port <= 65535))) {
    throw new Error('The preview receipt has unknown or mismatched ownership. It was preserved.');
  }
  return value;
}

async function sessionAt(control, root) {
  const file = path.join(control, 'session.json');
  const stat = await present(file);
  if (!stat) return null;
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('The preview receipt must be a plain file. It was preserved.');
  return validSession(JSON.parse(await fs.readFile(file, 'utf8')), root);
}

const sameOwner = (a, b) => a && b && a.root === b.root && a.token === b.token && a.pid === b.pid;

async function replaceSession(control, previous, next) {
  await controlDirectory(previous.root);
  const current = await sessionAt(control, previous.root);
  if (!sameOwner(current, previous)) throw new Error('Preview ownership changed while starting. The current receipt was preserved.');
  const temporary = path.join(control, `session.${next.token}.tmp`);
  await fs.writeFile(temporary, json(next), { flag: 'wx', mode: 0o600 });
  try { await fs.rename(temporary, path.join(control, 'session.json')); }
  finally { await fs.rm(temporary, { force: true }); }
}

async function removeSession(control, owner) {
  await controlDirectory(owner.root);
  const current = await sessionAt(control, owner.root);
  if (current && !sameOwner(current, owner)) throw new Error('Preview ownership changed. The current receipt was preserved.');
  if (current) await fs.unlink(path.join(control, 'session.json'));
  // Retain the control directory and any unknown/user files; only our receipt is removed.
}

function request(port, pathname, method = 'GET', token) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path: pathname, method, agent: false,
      headers: token ? { Authorization: `Bearer ${token}` } : {} }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, bytes: Buffer.concat(chunks) }));
    });
    req.setTimeout(1500, () => req.destroy(new Error('Preview control request timed out.')));
    req.on('error', reject); req.end();
  });
}

async function verifiedStatus(receipt) {
  if (receipt.port === null) throw new Error('Background preview is still starting.');
  const response = await request(receipt.port, '/.begin-preview-control/status', 'GET', receipt.token);
  if (response.status !== 200) throw new Error('The recorded port does not authenticate as this Begin preview. The receipt was preserved.');
  const value = JSON.parse(response.bytes);
  if (value.name !== 'begin-preview' || value.root !== receipt.root || value.pid !== receipt.pid || value.port !== receipt.port) {
    throw new Error('The recorded server has different ownership. Its process and the receipt were preserved.');
  }
  return value;
}

function describe(root, port, background = false) {
  console.log(`Begin preview: http://127.0.0.1:${port}\nDirectory: ${root}`);
  if (background) {
    console.log('Background preview is ready and survives this launching command. This URL is local to this computer.');
    console.log(`Status: node ${quote(self)} --dir ${quote(root)} --status`);
    console.log(`Stop: node ${quote(self)} --dir ${quote(root)} --stop`);
  } else console.log('Stop with Ctrl+C. This URL is local to this computer.');
}

function serverFor(root, control) {
  return http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (control && ['/.begin-preview-control/status', '/.begin-preview-control/stop'].includes(req.url)) {
      const provided = /^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization ?? '')?.[1];
      if (!provided || !timingSafeEqual(Buffer.from(provided), Buffer.from(control.token))) { res.writeHead(403); res.end('Forbidden'); return; }
      const stopping = req.url.endsWith('/stop');
      if (req.method !== (stopping ? 'POST' : 'GET')) { res.writeHead(405); res.end('Method Not Allowed'); return; }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(json({ name: 'begin-preview', root, pid: process.pid, port: control.port(), state: control.state() }));
      if (stopping) setImmediate(control.stop);
      return;
    }
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return; }
    try {
      // Inspect raw segments before URL normalization; private preview state stays hidden.
      const pathname = decodeURIComponent((req.url ?? '/').split('?')[0]);
      const segments = pathname.split('/').filter(Boolean);
      if (pathname.includes('\\') || pathname.includes('\0') || segments.some(p => p.startsWith('.'))) { res.writeHead(403); res.end('Forbidden'); return; }
      let file = path.resolve(root, '.' + pathname);
      if (!within(root, file)) { res.writeHead(403); res.end('Forbidden'); return; }
      file = await fs.realpath(file);
      if (!publicPath(root, file)) { res.writeHead(403); res.end('Forbidden'); return; }
      if ((await fs.stat(file)).isDirectory()) file = await fs.realpath(path.join(file, 'index.html'));
      if (!publicPath(root, file)) { res.writeHead(403); res.end('Forbidden'); return; }
      const contentType = mime[path.extname(file).toLowerCase()];
      if (!contentType) { res.writeHead(403); res.end('Forbidden'); return; }
      const data = await fs.readFile(file);
      res.writeHead(200, { 'Content-Type': contentType, 'Content-Length': data.length });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch (error) {
      const status = error instanceof URIError ? 400 : ['ENOENT', 'ENOTDIR'].includes(error.code) ? 404 : 500;
      res.writeHead(status); res.end(http.STATUS_CODES[status]);
    }
  });
}

async function startBackground(root, port) {
  if (!(await present(path.join(root, 'index.html')))?.isFile()) throw new Error('Background preview needs this website\'s index.html.');
  const control = await controlDirectory(root, true);
  const previous = await sessionAt(control, root);
  if (previous) {
    const state = await verifiedStatus(previous);
    if (previous.state !== 'ready' || state.state !== 'ready') throw new Error('Another preview is starting. Wait and use --status.');
    if (port !== 0 && port !== previous.port) throw new Error(`This website already uses port ${previous.port}. Stop it before choosing another port.`);
    describe(root, previous.port, true); return;
  }
  let receipt = { schema: 1, name: 'begin-preview', root, token: randomBytes(32).toString('hex'), pid: process.pid, port: null, state: 'starting' };
  const token = receipt.token;
  await fs.writeFile(path.join(control, 'session.json'), json(receipt), { flag: 'wx', mode: 0o600 });
  let child;
  try {
    child = spawn(process.execPath, [self, '--child'], { detached: true, stdio: ['ignore', 'ignore', 'ignore', 'ipc'] });
    // Register spawn errors immediately, before the asynchronous receipt update.
    let spawnError;
    child.on('error', error => { spawnError = error; });
    if (!child.pid) throw new Error('The background preview process could not start.');
    const next = { ...receipt, pid: child.pid };
    await replaceSession(control, receipt, next); receipt = next;
    if (spawnError) throw spawnError;
    await new Promise((resolve, reject) => {
      let settled = false;
      const fail = error => { if (!settled) { settled = true; clearTimeout(timer); reject(error); } };
      const timer = setTimeout(() => fail(new Error('Background preview did not become ready.')), 5000);
      child.on('error', fail);
      child.on('exit', code => fail(new Error(`Background preview exited before readiness (${code}).`)));
      child.on('message', async message => {
        if (settled) return;
        try {
          if (!message || message.token !== token) throw new Error('Background handshake ownership differs.');
          if (message.error) throw new Error(message.error);
          if (message.type === 'ready') {
            const current = await sessionAt(control, root);
            if (!current || current.pid !== child.pid || current.token !== token) throw new Error('Background receipt changed during readiness.');
            receipt = current;
            await verifiedStatus(receipt);
            if ((await request(receipt.port, '/')).status !== 200) throw new Error('The preview homepage is not ready.');
            child.send({ type: 'commit', token }, error => { if (error) fail(error); });
          } else if (message.type === 'committed') {
            const current = await sessionAt(control, root);
            if (!sameOwner(current, receipt) || current.state !== 'ready') throw new Error('Background receipt changed during readiness.');
            receipt = current; settled = true; clearTimeout(timer); resolve();
          } else throw new Error('Unexpected background handshake message.');
        } catch (error) { fail(error); }
      });
      child.send({ type: 'start', receipt, port }, error => { if (error) fail(error); });
    });
    child.disconnect(); child.unref();
    describe(root, receipt.port, true);
  } catch (error) {
    if (child?.connected) {
      // A failed launcher only aborts its own handshake; it never sends a PID signal.
      child.send({ type: 'abort', token }, () => { if (child.connected) child.disconnect(); });
    } else if (!child?.pid) await removeSession(control, receipt);
    throw error;
  }
}

async function childPreview() {
  if (!process.send) throw new Error('The background child requires its launcher handshake.');
  let receipt, control, server, committed = false, stopping = false, work = Promise.resolve();
  const timer = setTimeout(() => enqueue(() => shutdown('Launcher did not complete the ready handshake.')), 7000);
  const send = message => {
    if (!process.connected) return false;
    process.send(message, () => {}); return true;
  };
  async function shutdown(error) {
    if (stopping) return;
    stopping = true; clearTimeout(timer);
    if (error) send({ token: receipt?.token, error });
    if (server?.listening) await new Promise(resolve => server.close(resolve));
    try { if (control && receipt) await removeSession(control, receipt); }
    catch { process.exitCode = 1; }
    if (error) process.exitCode = 1;
    if (process.connected) process.disconnect();
  }
  function enqueue(action) {
    // Serialize startup and shutdown so launcher death cannot strand a pending listen.
    work = work.then(action).catch(error => shutdown(error.message));
  }
  process.on('disconnect', () => { if (!committed) enqueue(() => shutdown()); });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => enqueue(() => shutdown()));
  process.on('message', message => enqueue(async () => {
    if (stopping) return;
    if (message?.type === 'start' && !receipt) {
      receipt = validSession(message.receipt, message.receipt?.root);
      if (receipt.pid !== process.pid || receipt.port !== null || receipt.state !== 'starting') throw new Error('Background startup ownership differs.');
      const root = await fs.realpath(receipt.root);
      if (root !== receipt.root) throw new Error('Background directory ownership differs.');
      control = await controlDirectory(root);
      if (!control || !sameOwner(await sessionAt(control, root), receipt)) throw new Error('Background reservation differs.');
      server = serverFor(root, { token: receipt.token, port: () => server.address()?.port,
        state: () => committed ? 'ready' : 'starting', stop: () => enqueue(() => shutdown()) });
      await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(message.port, '127.0.0.1', resolve);
      });
      const next = { ...receipt, port: server.address().port };
      await replaceSession(control, receipt, next); receipt = next;
      if (!send({ type: 'ready', token: receipt.token })) await shutdown();
    } else if (message?.token === receipt?.token && message.type === 'commit') {
      const next = { ...receipt, state: 'ready' };
      await replaceSession(control, receipt, next); receipt = next;
      committed = true; clearTimeout(timer);
      send({ type: 'committed', token: receipt.token });
    } else if (message?.token === receipt?.token && message.type === 'abort') await shutdown();
    else throw new Error('Unexpected background control message.');
  }));
}

async function manageBackground(root, stop) {
  const control = await controlDirectory(root);
  const receipt = control ? await sessionAt(control, root) : null;
  if (!receipt) { console.log('No managed background preview for this website.'); return; }
  let state;
  try { state = await verifiedStatus(receipt); }
  catch (error) {
    let alive = true;
    try { process.kill(receipt.pid, 0); }
    catch (pidError) { if (pidError.code === 'ESRCH') alive = false; else throw pidError; }
    if (stop && !alive && (receipt.port === null || error.code === 'ECONNREFUSED')) {
      await removeSession(control, receipt);
      console.log('The recorded preview process has ended. Its matching stale receipt was removed; other files were preserved.'); return;
    }
    if (!alive && receipt.port !== null && error.code !== 'ECONNREFUSED') {
      throw new Error(`${error.message} The recorded process (PID ${receipt.pid}) has ended, but the port could not be verified. The receipt at ${quote(path.join(control, 'session.json'))} and any server on that port were preserved. Confirm that PID ${receipt.pid} has ended, then manually remove only that stale session receipt. Keep the other control files. Rerun --background without --port to select an available port.`);
    }
    throw new Error(`${error.message} The receipt and process were preserved. Use --stop after the recorded process ends, or inspect the private receipt.`);
  }
  if (!stop) {
    if (receipt.state !== 'ready' || state.state !== 'ready') throw new Error('The preview is still starting. Wait and check --status again.');
    describe(root, receipt.port, true); return;
  }
  if (state.state !== 'ready') throw new Error('The preview is still starting. Wait before stopping it.');
  const response = await request(receipt.port, '/.begin-preview-control/stop', 'POST', receipt.token);
  if (response.status !== 200) throw new Error('The preview did not authenticate the stop request. Its receipt was preserved.');
  for (let attempt = 0; attempt < 60; attempt++) {
    const current = await sessionAt(control, root);
    if (!current) { console.log('Background preview stopped. Website files were preserved.'); return; }
    if (!sameOwner(current, receipt)) throw new Error('Preview ownership changed while stopping. The current receipt was preserved.');
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error('The server accepted stop, but its receipt remains. Inspect --status; unknown files were preserved.');
}

try {
  if (process.argv.slice(2).join(' ') === '--child') await childPreview();
  else {
    const args = options(process.argv.slice(2));
    if (args.help) console.log(usage);
    else {
      const root = await fs.realpath(path.resolve(args['--dir']));
      if (!(await fs.stat(root)).isDirectory()) throw new Error('Preview path must be a directory.');
      if (args['--background']) await startBackground(root, args.port);
      else if (args['--status'] || args['--stop']) await manageBackground(root, Boolean(args['--stop']));
      else {
        const server = serverFor(root);
        server.on('error', error => { console.error(`Begin preview: ${error.message}`); process.exitCode = 1; });
        server.listen(args.port, '127.0.0.1', () => describe(root, server.address().port));
        for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
      }
    }
  }
} catch (error) { console.error(`Begin preview: ${error.message}`); process.exitCode = 1; }
