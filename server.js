'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

// tiny cookie parser (no npm dependency)
function parseCookie(str) {
  const out = {};
  if (!str) return out;
  const parts = str.split(';');
  for (let i = 0; i < parts.length; i++) {
    let p = parts[i];
    const idx = p.indexOf('=');
    if (idx < 0) continue;
    let name = p.slice(0, idx).trim();
    let val = p.slice(idx + 1).trim();
    // strip quotes
    if (val.length >= 2 && val[0] === '"' && val[val.length - 1] === '"') val = val.slice(1, -1);
    out[name] = val;
  }
  return out;
}

const PORT = parseInt(process.env.PORT, 10) || 4173;
const TYPES = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.ico':'image/x-icon' };

// ---------- admin account (email + password) ----------
// Email is read from admin-account.json (keep that file in the repo).
// Password prefers the ADMIN_PASSWORD env var / Render secret; falls back to the file.
const ACCOUNT_PATH = path.join(__dirname, 'admin-account.json');
function loadAccount() {
  let acc = null;
  try { acc = JSON.parse(fs.readFileSync(ACCOUNT_PATH, 'utf8')); } catch (e) { acc = null; }
  if (!acc || !acc.email) {
    // first run: seed the account the user asked for
    acc = { email: 'adebusayoibrahim27@gmail.com', password: 'Shalom12345...' };
    try { fs.writeFileSync(ACCOUNT_PATH, JSON.stringify(acc, null, 2), 'utf8'); } catch (e) {}
  }
  return acc;
}
const RAW_ACC = loadAccount();
const ADMIN_ACC = {
  email: RAW_ACC.email || '',
  password: process.env.ADMIN_PASSWORD || RAW_ACC.password || ''
};

// ---------- sessions (in-memory) ----------
const SESSIONS = new Map();
function makeSession() {
  let id;
  do { id = 's_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10); }
  while (SESSIONS.has(id));
  const s = { id, at: Date.now() };
  SESSIONS.set(id, s);
  return s;
}
function sessionForReq(req) {
  try {
    const hdr = req.headers.cookie || '';
    const c = parseCookie(hdr);
    const sid = c['ag_session'];
    if (!sid) return null;
    const s = SESSIONS.get(sid);
    if (!s) return null;
    s.at = Date.now();
    return s;
  } catch (e) { return null; }
}
function clearSession(sid) { SESSIONS.delete(sid); }

// ---------- server-side localStorage mirror (source of truth for catalog/hero/promos) ----------
const MOCK_PATH = path.join(__dirname, 'local-storageMock.json');
function loadMock() {
  try {
    const raw = fs.readFileSync(MOCK_PATH, 'utf8');
    const d = JSON.parse(raw);
    if (d && typeof d === 'object') return d;
  } catch (e) { /* ignore */ }
  return null;
}
function saveMock(d) {
  try { fs.writeFileSync(MOCK_PATH, JSON.stringify(d, null, 2), 'utf8'); return true; }
  catch (e) { return false; }
}
function ensureMockSeeded() {
  if (loadMock()) return;
  try {
    const seed = require('./catalog-data.json');
    saveMock(seed);
  } catch (e) { /* catalog-data.json missing; will be created on first admin write */ }
}
ensureMockSeeded();

function loadOrGenAdminKey() {
  let key = process.env.AG_ADMIN_SECRET;
  if (!key) {
    const secretPath = path.join(__dirname, 'admin-secret.txt');
    try { key = fs.readFileSync(secretPath, 'utf8').trim(); if (!key) key = null; } catch (e) { key = null; }
    if (!key) {
      key = 'ag_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
      try { fs.writeFileSync(secretPath, key, 'utf8'); } catch (e) {}
    }
  }
  return key;
}
const ADMIN_KEY = loadOrGenAdminKey();

function loadOrGenAdminKey() {
  let key = process.env.AG_ADMIN_SECRET;
  if (!key) {
    const secretPath = path.join(__dirname, 'admin-secret.txt');
    try { key = fs.readFileSync(secretPath, 'utf8').trim(); if (!key) key = null; } catch (e) { key = null; }
    if (!key) {
      key = 'ag_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
      try { fs.writeFileSync(secretPath, key, 'utf8'); } catch (e) {}
    }
  }
  return key;
}

function json(res, code, obj, extraHeaders) {
  const h = { 'Content-Type': 'application/json' };
  if (extraHeaders) { for (const k in extraHeaders) h[k] = extraHeaders[k]; }
  res.writeHead(code, h);
  res.end(JSON.stringify(obj));
}
function writeSessionCookie(res, sid) {
  res.setHeader('Set-Cookie', 'ag_session=' + sid + '; Path=/; HttpOnly; SameSite=Lax');
}
function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', 'ag_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
}
function isSessionAdmin(req) {
  const s = sessionForReq(req);
  return s ? s.id : null;
}

http.createServer((req, res) => {
  // ----- admin auth endpoints -----
  if (req.method === 'POST' && req.url === '/admin-login') {
    let body = '';
    req.on('data', c => { body += c; if (body.length > 1 * 1024 * 1024) req.destroy(); });
    req.on('end', () => {
      let obj;
      try { obj = JSON.parse(body); } catch (e) { return json(res, 400, { ok:false, error:'Invalid request.' }); }
      const email = (obj.email || '').trim().toLowerCase();
      const password = obj.password || '';
      if (!email || !password) return json(res, 400, { ok:false, error:'Email and password are required.' });
      if (email !== ADMIN_ACC.email || password !== ADMIN_ACC.password) {
        return json(res, 401, { ok:false, error:'Wrong email or password.' });
      }
      const s = makeSession();
      writeSessionCookie(res, s.id);
      return json(res, 200, { ok:true, email: ADMIN_ACC.email });
    });
    return;
  }
  if (req.method === 'POST' && req.url === '/admin-logout') {
    const s = sessionForReq(req);
    if (s) clearSession(s.id);
    clearSessionCookie(res);
    return json(res, 200, { ok:true });
  }

  // ----- admin endpoints (session-or-key protected) -----
  function adminAuthed(req) {
    const sid = isSessionAdmin(req);
    if (sid) return true;
    if (req.headers['x-admin-key'] === ADMIN_KEY) return true;
    return false;
  }
  if (req.method === 'POST' && req.url === '/admin-upload') {
    if (!adminAuthed(req)) return json(res, 403, { ok:false, error:'Forbidden: not signed in as admin.' });
    let body = '';
    req.on('data', c => { body += c; if (body.length > 8 * 1024 * 1024) req.destroy(); });
    req.on('end', () => {
      let obj;
      try { obj = JSON.parse(body); } catch (e) { return json(res, 400, { ok:false, error:'Invalid request.' }); }
      const data = Buffer.from(obj.data, 'base64');
      if (!obj.path || !obj.data) return json(res, 400, { ok:false, error:'Missing path or data.' });
      const filePath = path.join(__dirname, obj.path);
      if (!filePath.startsWith(__dirname + path.sep) && filePath !== __dirname) return json(res, 403, { ok:false, error:'Forbidden path.' });
      try {
        fs.mkdirSync(path.dirname(filePath), { recursive:true });
        fs.writeFileSync(filePath, data);
        json(res, 200, { ok:true, url:'/' + obj.path });
      } catch (e) { json(res, 500, { ok:false, error:'Could not save file.' }); }
    });
    return;
  }    if (req.method === 'POST' && req.url === '/admin-set-secret') {
    if (!adminAuthed(req)) return json(res, 403, { ok:false, error:'Forbidden.' });
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      let obj;
      try { obj = JSON.parse(body); } catch (e) { return json(res, 400, { ok:false, error:'Invalid request.' }); }
      const newKey = String(obj.newKey || '').trim();
      if (!newKey) return json(res, 400, { ok:false, error:'newKey is required.' });
      const secretPath = path.join(__dirname, 'admin-secret.txt');
      try {
        fs.writeFileSync(secretPath, newKey, 'utf8');
        Object.defineProperty(module.exports, 'ADMIN_KEY', { value: newKey, writable:true });
        json(res, 200, { ok:true });
      } catch (e) { json(res, 500, { ok:false, error:'Could not save new code.' }); }
    });
    return;
  }

  // ----- admin API (session-protected writes; public reads) -----
  if (req.url && req.url.startsWith('/admin-api/')) {
    // public reads
    if (req.method === 'GET' && req.url === '/admin-api/catalog') {
      const m = loadMock();
      if (m && m.v === 2 && Array.isArray(m.phones)) return json(res, 200, { ok:true, phones: m.phones });
      return json(res, 200, { ok:true, phones: [] });
    }
    if (req.method === 'GET' && req.url === '/admin-api/hero') {
      const m = loadMock();
      return json(res, 200, { ok:true, hero: (m && m.hero) || null });
    }
    if (req.method === 'GET' && req.url === '/admin-api/promos') {
      const m = loadMock();
      return json(res, 200, { ok:true, promos: (m && m.promos) || {} });
    }
    // auth-required
    if (!isSessionAdmin(req)) {
      if (req.headers['x-admin-key'] !== ADMIN_KEY) {
        return json(res, 403, { ok:false, error:'Forbidden.' });
      }
    }
    if (req.method === 'GET' && req.url === '/admin-api/me') {
      return json(res, 200, { ok:true, email: ADMIN_ACC.email });
    }
    if (req.method === 'POST' && req.url === '/admin-api/catalog') {
      let body = '';
      req.on('data', c => { body += c; if (body.length > 2 * 1024 * 1024) req.destroy(); });
      req.on('end', () => {
        let obj;
        try { obj = JSON.parse(body); } catch (e) { return json(res, 400, { ok:false, error:'Invalid request.' }); }
        if (!obj || !Array.isArray(obj.phones)) return json(res, 400, { ok:false, error:'phones array required.' });
        const m = loadMock() || {};
        m.v = 2; m.phones = obj.phones;
        if (saveMock(m)) { json(res, 200, { ok:true }); } else { json(res, 500, { ok:false, error:'Could not save.' }); }
      });
      return;
    }
    if (req.method === 'POST' && req.url === '/admin-api/hero') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        let obj;
        try { obj = JSON.parse(body); } catch (e) { return json(res, 400, { ok:false, error:'Invalid request.' }); }
        const m = loadMock() || {};
        if (obj.hero) m.hero = obj.hero; else delete m.hero;
        if (saveMock(m)) { json(res, 200, { ok:true }); } else { json(res, 500, { ok:false, error:'Could not save.' }); }
      });
      return;
    }
    if (req.method === 'POST' && req.url === '/admin-api/promos') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        let obj;
        try { obj = JSON.parse(body); } catch (e) { return json(res, 400, { ok:false, error:'Invalid request.' }); }
        const m = loadMock() || {};
        if (obj.promos && typeof obj.promos === 'object') m.promos = obj.promos;
        if (saveMock(m)) { json(res, 200, { ok:true }); } else { json(res, 500, { ok:false, error:'Could not save.' }); }
      });
      return;
    }
    return json(res, 404, { ok:false, error:'Unknown admin api.' });
  }

  // ----- static files -----
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(__dirname, urlPath);
  if (!filePath.startsWith(__dirname)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`Ade's Gadget running on http://localhost:${PORT}`);
  console.log(`Admin access code: ${ADMIN_KEY}`);
  console.log(`(Set environment variable AG_ADMIN_SECRET to choose your own, or edit admin-secret.txt)`);
  console.log(`(Set environment variable ADMIN_PASSWORD to guard admin login; otherwise the file admin-account.json is used)`);
});
