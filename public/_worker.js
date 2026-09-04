const SESSION_TTL = 60 * 60 * 8;
const PBKDF2_ITERATIONS = 100000;
const SESSION_COOKIE = '__Host-mega_session';
const enc = new TextEncoder();

const SCHEMA_VERSION = 'v4-auto-schema-1';
let schemaReadyPromise = null;

async function ensureSchema(env) {
  if (schemaReadyPromise) return schemaReadyPromise;
  schemaReadyPromise = (async () => {
    if (!env.SITE_MEGA_D1) { const e=new Error('D1_BINDING_MISSING'); e.code='D1_BINDING_MISSING'; throw e; }
    if (!env.SITE_MEGA_KV) { const e=new Error('KV_BINDING_MISSING'); e.code='KV_BINDING_MISSING'; throw e; }
    const markerKey = `schema:${SCHEMA_VERSION}`;
    const marker = await env.SITE_MEGA_KV.get(markerKey);
    if (marker === 'ready') return;
    const ddl = [
      `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE COLLATE NOCASE,display_name TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin','editor')),active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),created_at TEXT NOT NULL,updated_at TEXT NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS user_credentials (user_id TEXT PRIMARY KEY,password_hash TEXT NOT NULL,salt TEXT NOT NULL,iterations INTEGER NOT NULL DEFAULT 100000,password_version INTEGER NOT NULL DEFAULT 1,updated_at TEXT NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)`,
      `CREATE TABLE IF NOT EXISTS contact_messages (id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT,phone TEXT,subject TEXT,message TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','read','archived')),created_at TEXT NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS site_content (key TEXT PRIMARY KEY,value_json TEXT NOT NULL,updated_at TEXT NOT NULL,updated_by TEXT)`,
      `CREATE TABLE IF NOT EXISTS audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT,actor_user_id TEXT,action TEXT NOT NULL,target_type TEXT,target_id TEXT,ip TEXT,user_agent TEXT,details_json TEXT,created_at TEXT NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY,title TEXT NOT NULL,location TEXT NOT NULL DEFAULT 'Diabo',contract_type TEXT NOT NULL DEFAULT 'À définir',description TEXT NOT NULL,requirements TEXT,active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),created_at TEXT NOT NULL,updated_at TEXT NOT NULL,created_by TEXT)`,
      `CREATE TABLE IF NOT EXISTS job_applications (id TEXT PRIMARY KEY,job_id TEXT,full_name TEXT NOT NULL,phone TEXT NOT NULL,email TEXT,locality TEXT,position_sought TEXT,education TEXT,experience TEXT,skills TEXT,cv_url TEXT,message TEXT,status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','reviewed','shortlisted','rejected','archived')),created_at TEXT NOT NULL,FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE SET NULL)`,
      `CREATE INDEX IF NOT EXISTS idx_contact_status_created ON contact_messages(status, created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_users_active ON users(active)`,
      `CREATE INDEX IF NOT EXISTS idx_jobs_active_created ON jobs(active, created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_applications_status_created ON job_applications(status, created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_applications_job ON job_applications(job_id)`
    ];
    await env.SITE_MEGA_D1.batch(ddl.map(sql => env.SITE_MEGA_D1.prepare(sql)));
    if (!await env.SITE_MEGA_KV.get('auth:epoch')) await env.SITE_MEGA_KV.put('auth:epoch','1');
    await env.SITE_MEGA_KV.put(markerKey, 'ready');
  })().catch(err => { schemaReadyPromise = null; throw err; });
  return schemaReadyPromise;
}

async function setupStatus(env) {
  await ensureSchema(env);
  const email = (env.ADMIN_EMAIL || 'mega@services.local').trim().toLowerCase();
  const admin = await env.SITE_MEGA_D1.prepare(`SELECT id,email,active FROM users WHERE email=? AND role='admin'`).bind(email).first();
  return json({
    ok: true,
    databaseReady: true,
    adminExists: !!admin,
    adminActive: !!admin?.active,
    bootstrapSecretConfigured: !!env.ADMIN_BOOTSTRAP_PASSWORD
  });
}

const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers }
});

function b64(bytes) {
  let s = ''; const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (const b of u8) s += String.fromCharCode(b);
  return btoa(s);
}
function unb64(s) { const raw = atob(s); return Uint8Array.from(raw, c => c.charCodeAt(0)); }
function randomToken(n = 32) { const a = new Uint8Array(n); crypto.getRandomValues(a); return b64(a).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function now() { return new Date().toISOString(); }
function clientIp(req) { return req.headers.get('CF-Connecting-IP') || 'unknown'; }
function cookie(req, name) {
  const raw = req.headers.get('cookie') || '';
  for (const part of raw.split(';')) { const i = part.indexOf('='); if (i > 0 && part.slice(0,i).trim() === name) return decodeURIComponent(part.slice(i+1).trim()); }
  return null;
}
function sessionCookie(token, maxAge = SESSION_TTL) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
function clearSessionCookie() { return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`; }
function sameOrigin(req) {
  const origin = req.headers.get('Origin');
  if (!origin) return true;
  try { return new URL(origin).origin === new URL(req.url).origin; } catch { return false; }
}
async function bodyJson(req) {
  if (!(req.headers.get('content-type') || '').includes('application/json')) throw new Error('JSON_REQUIRED');
  return req.json();
}
async function hashPassword(password, salt = null, iterations = PBKDF2_ITERATIONS) {
  const saltBytes = salt ? unb64(salt) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations }, key, 256);
  return { hash: b64(bits), salt: b64(saltBytes), iterations };
}
function timingSafeStringEqual(a, b) {
  const aa = enc.encode(a), bb = enc.encode(b); let diff = aa.length ^ bb.length;
  const n = Math.max(aa.length, bb.length);
  for (let i=0;i<n;i++) diff |= (aa[i % aa.length] || 0) ^ (bb[i % bb.length] || 0);
  return diff === 0;
}
async function verifyPassword(password, cred) {
  const result = await hashPassword(password, cred.salt, cred.iterations);
  return timingSafeStringEqual(result.hash, cred.password_hash);
}
async function audit(env, req, actorUserId, action, targetType = null, targetId = null, details = {}) {
  try {
    await env.SITE_MEGA_D1.prepare(`INSERT INTO audit_log(actor_user_id,action,target_type,target_id,ip,user_agent,details_json,created_at) VALUES(?,?,?,?,?,?,?,?)`)
      .bind(actorUserId, action, targetType, targetId, clientIp(req), (req.headers.get('user-agent')||'').slice(0,500), JSON.stringify(details), now()).run();
  } catch (_) {}
}
async function authEpoch(env) { return Number(await env.SITE_MEGA_KV.get('auth:epoch') || '1'); }
async function bumpAuthEpoch(env) { const e = (await authEpoch(env)) + 1; await env.SITE_MEGA_KV.put('auth:epoch', String(e)); return e; }
async function createSession(env, user) {
  const token = randomToken(32), csrf = randomToken(24), epoch = await authEpoch(env);
  const session = { userId: user.id, email: user.email, role: user.role, csrf, epoch, exp: Date.now() + SESSION_TTL*1000 };
  await env.SITE_MEGA_KV.put(`session:${token}`, JSON.stringify(session), { expirationTtl: SESSION_TTL });
  return { token, session };
}
async function requireSession(req, env, csrfRequired = false) {
  const token = cookie(req, SESSION_COOKIE);
  if (!token) return { error: json({ error: 'AUTH_REQUIRED' }, 401) };
  const raw = await env.SITE_MEGA_KV.get(`session:${token}`);
  if (!raw) return { error: json({ error: 'SESSION_EXPIRED' }, 401, { 'set-cookie': clearSessionCookie() }) };
  let s; try { s = JSON.parse(raw); } catch { return { error: json({ error:'SESSION_INVALID' },401) }; }
  if (s.exp < Date.now() || s.epoch !== await authEpoch(env)) {
    await env.SITE_MEGA_KV.delete(`session:${token}`);
    return { error: json({ error:'SESSION_EXPIRED' },401,{ 'set-cookie':clearSessionCookie() }) };
  }
  const user = await env.SITE_MEGA_D1.prepare(`SELECT id,email,display_name,role,active FROM users WHERE id=?`).bind(s.userId).first();
  if (!user || !user.active) return { error: json({ error:'ACCOUNT_DISABLED' },403,{ 'set-cookie':clearSessionCookie() }) };
  if (csrfRequired) {
    if (!sameOrigin(req)) return { error: json({ error:'ORIGIN_REJECTED' },403) };
    if (!timingSafeStringEqual(req.headers.get('x-csrf-token') || '', s.csrf || 'x')) return { error: json({ error:'CSRF_INVALID' },403) };
  }
  return { token, session:s, user };
}
async function ensureBootstrapAdmin(env) {
  const email = (env.ADMIN_EMAIL || 'mega@services.local').trim().toLowerCase();
  const existing = await env.SITE_MEGA_D1.prepare(`SELECT u.id,u.email,u.display_name,u.role,u.active,c.password_hash,c.salt,c.iterations FROM users u LEFT JOIN user_credentials c ON c.user_id=u.id WHERE u.email=?`).bind(email).first();
  return existing;
}
async function login(req, env) {
  if (!sameOrigin(req)) return json({ error:'ORIGIN_REJECTED' },403);
  const { email='', password='' } = await bodyJson(req);
  if (!email || !password || password.length > 256) return json({ error:'INVALID_CREDENTIALS' },401);
  const normalized = String(email).trim().toLowerCase();
  const lockKey = `login:${clientIp(req)}:${normalized}`;
  const attempts = Number(await env.SITE_MEGA_KV.get(lockKey) || '0');
  if (attempts >= 8) return json({ error:'TOO_MANY_ATTEMPTS', message:'Trop de tentatives. Réessayez dans 15 minutes.' },429);

  let row = await env.SITE_MEGA_D1.prepare(`SELECT u.id,u.email,u.display_name,u.role,u.active,c.password_hash,c.salt,c.iterations FROM users u LEFT JOIN user_credentials c ON c.user_id=u.id WHERE u.email=?`).bind(normalized).first();
  let valid = false;
  if (!row && normalized === (env.ADMIN_EMAIL || 'mega@services.local').trim().toLowerCase() && env.ADMIN_BOOTSTRAP_PASSWORD) {
    valid = timingSafeStringEqual(String(password), String(env.ADMIN_BOOTSTRAP_PASSWORD));
    if (valid) {
      const id = crypto.randomUUID(), t=now(), hp=await hashPassword(password);
      await env.SITE_MEGA_D1.prepare(`INSERT INTO users(id,email,display_name,role,active,created_at,updated_at) VALUES(?,?,?,?,1,?,?)`).bind(id,normalized,'Administrateur MEGA','admin',t,t).run();
      try {
        await env.SITE_MEGA_D1.prepare(`INSERT INTO user_credentials(user_id,password_hash,salt,iterations,password_version,updated_at) VALUES(?,?,?,?,1,?)`).bind(id,hp.hash,hp.salt,hp.iterations,t).run();
      } catch (credErr) {
        await env.SITE_MEGA_D1.prepare(`DELETE FROM users WHERE id=?`).bind(id).run();
        throw credErr;
      }
      row = { id, email:normalized, display_name:'Administrateur MEGA', role:'admin', active:1 };
      await audit(env,req,id,'ADMIN_BOOTSTRAPPED','user',id,{});
    }
  } else if (row && row.active && row.password_hash) {
    valid = await verifyPassword(password,row);
  }
  if (!valid) {
    if (!row && normalized === (env.ADMIN_EMAIL || 'mega@services.local').trim().toLowerCase() && !env.ADMIN_BOOTSTRAP_PASSWORD) {
      return json({ error:'ADMIN_SETUP_REQUIRED', message:'Le compte administrateur n’est pas encore initialisé. Ajoutez le secret Cloudflare ADMIN_BOOTSTRAP_PASSWORD puis reconnectez-vous.' },503);
    }
    await env.SITE_MEGA_KV.put(lockKey,String(attempts+1),{expirationTtl:900});
    await audit(env,req,row?.id||null,'LOGIN_FAILED','user',row?.id||null,{email:normalized});
    return json({ error:'INVALID_CREDENTIALS' },401);
  }
  await env.SITE_MEGA_KV.delete(lockKey);
  const {token,session}=await createSession(env,row);
  await audit(env,req,row.id,'LOGIN_SUCCESS','user',row.id,{});
  return json({ ok:true, user:{id:row.id,email:row.email,displayName:row.display_name,role:row.role}, csrf:session.csrf },200,{ 'set-cookie':sessionCookie(token) });
}

async function sessionInfo(req, env) {
  const a=await requireSession(req,env,false); if(a.error) return a.error;
  return json({authenticated:true,user:{id:a.user.id,email:a.user.email,displayName:a.user.display_name,role:a.user.role},csrf:a.session.csrf});
}
async function logout(req,env){ const a=await requireSession(req,env,true); if(a.error)return a.error; await env.SITE_MEGA_KV.delete(`session:${a.token}`); await audit(env,req,a.user.id,'LOGOUT'); return json({ok:true},200,{'set-cookie':clearSessionCookie()}); }

async function publicContact(req,env){
  if(!sameOrigin(req)) return json({error:'ORIGIN_REJECTED'},403);
  const b=await bodyJson(req); if(b.website) return json({ok:true});
  const name=String(b.name||'').trim().slice(0,120), email=String(b.email||'').trim().slice(0,180), phone=String(b.phone||'').trim().slice(0,60), subject=String(b.subject||'').trim().slice(0,180), message=String(b.message||'').trim().slice(0,4000);
  if(!name||!message) return json({error:'MISSING_FIELDS'},400);
  const rk=`contact-rate:${clientIp(req)}`; const count=Number(await env.SITE_MEGA_KV.get(rk)||'0'); if(count>=5) return json({error:'RATE_LIMIT'},429);
  await env.SITE_MEGA_KV.put(rk,String(count+1),{expirationTtl:3600});
  const id=crypto.randomUUID(); await env.SITE_MEGA_D1.prepare(`INSERT INTO contact_messages(id,name,email,phone,subject,message,status,created_at) VALUES(?,?,?,?,?,?,'new',?)`).bind(id,name,email,phone,subject,message,now()).run();
  await audit(env,req,null,'CONTACT_CREATED','contact',id,{subject}); return json({ok:true,id},201);
}
async function load(req,env){
  const a=await requireSession(req,env,false); if(a.error)return a.error;
  const [content,contacts,users,audits,jobs,applications]=await Promise.all([
    env.SITE_MEGA_D1.prepare(`SELECT key,value_json,updated_at FROM site_content`).all(),
    env.SITE_MEGA_D1.prepare(`SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 200`).all(),
    env.SITE_MEGA_D1.prepare(`SELECT id,email,display_name,role,active,created_at,updated_at FROM users ORDER BY created_at DESC`).all(),
    env.SITE_MEGA_D1.prepare(`SELECT id,actor_user_id,action,target_type,target_id,ip,details_json,created_at FROM audit_log ORDER BY id DESC LIMIT 200`).all(),
    env.SITE_MEGA_D1.prepare(`SELECT * FROM jobs ORDER BY active DESC, created_at DESC LIMIT 200`).all(),
    env.SITE_MEGA_D1.prepare(`SELECT a.*,j.title AS job_title FROM job_applications a LEFT JOIN jobs j ON j.id=a.job_id ORDER BY a.created_at DESC LIMIT 500`).all()
  ]);
  const site={}; for(const r of content.results||[]) { try{site[r.key]=JSON.parse(r.value_json)}catch{site[r.key]=r.value_json} }
  return json({site,contacts:contacts.results||[],users:users.results||[],audit:audits.results||[],jobs:jobs.results||[],applications:applications.results||[]});
}
async function save(req,env){
  const a=await requireSession(req,env,true); if(a.error)return a.error;
  const b=await bodyJson(req); if(!b.key||typeof b.key!=='string'||b.key.length>80) return json({error:'INVALID_KEY'},400);
  const value=JSON.stringify(b.value ?? null); if(value.length>100000) return json({error:'TOO_LARGE'},413);
  await env.SITE_MEGA_D1.prepare(`INSERT INTO site_content(key,value_json,updated_at,updated_by) VALUES(?,?,?,?) ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_at=excluded.updated_at,updated_by=excluded.updated_by`).bind(b.key,value,now(),a.user.id).run();
  await audit(env,req,a.user.id,'CONTENT_SAVED','site_content',b.key,{}); return json({ok:true});
}
function requireAdmin(a){ return a.user.role==='admin' ? null : json({error:'ADMIN_REQUIRED'},403); }
async function usersApi(req,env){
  const write=req.method!=='GET'; const a=await requireSession(req,env,write); if(a.error)return a.error; const denied=requireAdmin(a); if(denied)return denied;
  if(req.method==='GET'){ const rows=await env.SITE_MEGA_D1.prepare(`SELECT id,email,display_name,role,active,created_at,updated_at FROM users ORDER BY created_at DESC`).all(); return json({users:rows.results||[]}); }
  const b=await bodyJson(req);
  if(req.method==='POST'){
    const email=String(b.email||'').trim().toLowerCase(), display=String(b.displayName||'').trim().slice(0,120), role=b.role==='editor'?'editor':'admin', password=String(b.password||'');
    if(!email||!display||password.length<10) return json({error:'INVALID_USER_DATA'},400);
    const id=crypto.randomUUID(),t=now(),hp=await hashPassword(password);
    try{ await env.SITE_MEGA_D1.batch([
      env.SITE_MEGA_D1.prepare(`INSERT INTO users(id,email,display_name,role,active,created_at,updated_at) VALUES(?,?,?,?,1,?,?)`).bind(id,email,display,role,t,t),
      env.SITE_MEGA_D1.prepare(`INSERT INTO user_credentials(user_id,password_hash,salt,iterations,password_version,updated_at) VALUES(?,?,?,?,1,?)`).bind(id,hp.hash,hp.salt,hp.iterations,t)
    ]);}catch(e){return json({error:'USER_CREATE_FAILED'},409)}
    await audit(env,req,a.user.id,'USER_CREATED','user',id,{email,role}); return json({ok:true,id},201);
  }
  if(req.method==='PUT'){
    const id=String(b.id||''); if(!id)return json({error:'ID_REQUIRED'},400);
    const target=await env.SITE_MEGA_D1.prepare(`SELECT id,email,role FROM users WHERE id=?`).bind(id).first(); if(!target)return json({error:'NOT_FOUND'},404);
    const active=b.active===false?0:1, role=b.role==='editor'?'editor':'admin', display=String(b.displayName||target.email).trim().slice(0,120);
    if(id===a.user.id && active===0) return json({error:'CANNOT_DISABLE_SELF'},400);
    await env.SITE_MEGA_D1.prepare(`UPDATE users SET display_name=?,role=?,active=?,updated_at=? WHERE id=?`).bind(display,role,active,now(),id).run();
    await audit(env,req,a.user.id,'USER_UPDATED','user',id,{active,role}); return json({ok:true});
  }
  if(req.method==='DELETE'){
    const id=String(b.id||''); if(!id)return json({error:'ID_REQUIRED'},400); if(id===a.user.id)return json({error:'CANNOT_DELETE_SELF'},400);
    await env.SITE_MEGA_D1.prepare(`DELETE FROM users WHERE id=?`).bind(id).run(); await audit(env,req,a.user.id,'USER_DELETED','user',id,{}); return json({ok:true});
  }
  return json({error:'METHOD_NOT_ALLOWED'},405);
}
async function resetPassword(req,env){
  const a=await requireSession(req,env,true); if(a.error)return a.error; const denied=requireAdmin(a); if(denied)return denied;
  const b=await bodyJson(req), id=String(b.id||''), password=String(b.newPassword||''); if(!id||password.length<10)return json({error:'INVALID_PASSWORD'},400);
  const hp=await hashPassword(password),t=now(); const r=await env.SITE_MEGA_D1.prepare(`UPDATE user_credentials SET password_hash=?,salt=?,iterations=?,password_version=password_version+1,updated_at=? WHERE user_id=?`).bind(hp.hash,hp.salt,hp.iterations,t,id).run();
  if(!r.meta?.changes)return json({error:'NOT_FOUND'},404); await bumpAuthEpoch(env); await audit(env,req,a.user.id,'PASSWORD_RESET','user',id,{}); return json({ok:true,allSessionsInvalidated:true});
}
async function contactAdmin(req,env,url){
  const a=await requireSession(req,env,req.method!=='GET'); if(a.error)return a.error;
  const id=url.pathname.split('/').pop(); if(req.method==='PUT') { const b=await bodyJson(req); const status=['new','read','archived'].includes(b.status)?b.status:'read'; await env.SITE_MEGA_D1.prepare(`UPDATE contact_messages SET status=? WHERE id=?`).bind(status,id).run(); await audit(env,req,a.user.id,'CONTACT_STATUS_CHANGED','contact',id,{status}); return json({ok:true}); }
  if(req.method==='DELETE'){ await env.SITE_MEGA_D1.prepare(`DELETE FROM contact_messages WHERE id=?`).bind(id).run(); await audit(env,req,a.user.id,'CONTACT_DELETED','contact',id,{}); return json({ok:true}); }
  return json({error:'METHOD_NOT_ALLOWED'},405);
}

async function publicJobs(req,env){
  const rows=await env.SITE_MEGA_D1.prepare(`SELECT id,title,location,contract_type,description,requirements,created_at FROM jobs WHERE active=1 ORDER BY created_at DESC LIMIT 100`).all();
  return json({jobs:rows.results||[]});
}
async function publicApplication(req,env){
  if(!sameOrigin(req)) return json({error:'ORIGIN_REJECTED'},403);
  const b=await bodyJson(req); if(b.website) return json({ok:true});
  const fullName=String(b.fullName||'').trim().slice(0,120), phone=String(b.phone||'').trim().slice(0,60), email=String(b.email||'').trim().slice(0,180), locality=String(b.locality||'').trim().slice(0,120), jobId=String(b.jobId||'').trim().slice(0,80), positionSought=String(b.positionSought||'').trim().slice(0,160), education=String(b.education||'').trim().slice(0,1200), experience=String(b.experience||'').trim().slice(0,1800), skills=String(b.skills||'').trim().slice(0,1800), cvUrl=String(b.cvUrl||'').trim().slice(0,500), message=String(b.message||'').trim().slice(0,2500);
  if(!fullName||!phone) return json({error:'MISSING_FIELDS'},400);
  if(email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({error:'INVALID_EMAIL'},400);
  if(cvUrl){ try{ const u=new URL(cvUrl); if(!['http:','https:'].includes(u.protocol)) throw new Error(); }catch{return json({error:'INVALID_CV_URL'},400)} }
  let validJobId=null;
  if(jobId){ const j=await env.SITE_MEGA_D1.prepare(`SELECT id FROM jobs WHERE id=? AND active=1`).bind(jobId).first(); if(j) validJobId=j.id; }
  const rk=`application-rate:${clientIp(req)}`; const count=Number(await env.SITE_MEGA_KV.get(rk)||'0'); if(count>=4) return json({error:'RATE_LIMIT'},429);
  await env.SITE_MEGA_KV.put(rk,String(count+1),{expirationTtl:3600});
  const id=crypto.randomUUID();
  await env.SITE_MEGA_D1.prepare(`INSERT INTO job_applications(id,job_id,full_name,phone,email,locality,position_sought,education,experience,skills,cv_url,message,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,'new',?)`).bind(id,validJobId,fullName,phone,email,locality,positionSought,education,experience,skills,cvUrl,message,now()).run();
  await audit(env,req,null,'JOB_APPLICATION_CREATED','job_application',id,{jobId:validJobId,positionSought});
  return json({ok:true,id},201);
}
async function jobsAdmin(req,env){
  const write=req.method!=='GET'; const a=await requireSession(req,env,write); if(a.error)return a.error; const denied=requireAdmin(a); if(denied)return denied;
  if(req.method==='GET'){ const rows=await env.SITE_MEGA_D1.prepare(`SELECT * FROM jobs ORDER BY active DESC,created_at DESC`).all(); return json({jobs:rows.results||[]}); }
  const b=await bodyJson(req);
  if(req.method==='POST'){
    const title=String(b.title||'').trim().slice(0,180), location=String(b.location||'Diabo').trim().slice(0,120), contractType=String(b.contractType||'À définir').trim().slice(0,80), description=String(b.description||'').trim().slice(0,4000), requirements=String(b.requirements||'').trim().slice(0,4000), active=b.active===false?0:1;
    if(!title||!description) return json({error:'INVALID_JOB_DATA'},400);
    const id=crypto.randomUUID(),t=now(); await env.SITE_MEGA_D1.prepare(`INSERT INTO jobs(id,title,location,contract_type,description,requirements,active,created_at,updated_at,created_by) VALUES(?,?,?,?,?,?,?,?,?,?)`).bind(id,title,location,contractType,description,requirements,active,t,t,a.user.id).run();
    await audit(env,req,a.user.id,'JOB_CREATED','job',id,{title,active}); return json({ok:true,id},201);
  }
  if(req.method==='PUT'){
    const id=String(b.id||''); if(!id)return json({error:'ID_REQUIRED'},400);
    const old=await env.SITE_MEGA_D1.prepare(`SELECT * FROM jobs WHERE id=?`).bind(id).first(); if(!old)return json({error:'NOT_FOUND'},404);
    const title=String(b.title??old.title).trim().slice(0,180), location=String(b.location??old.location).trim().slice(0,120), contractType=String(b.contractType??old.contract_type).trim().slice(0,80), description=String(b.description??old.description).trim().slice(0,4000), requirements=String(b.requirements??old.requirements??'').trim().slice(0,4000), active=b.active===undefined?Number(old.active):(b.active?1:0);
    if(!title||!description)return json({error:'INVALID_JOB_DATA'},400);
    await env.SITE_MEGA_D1.prepare(`UPDATE jobs SET title=?,location=?,contract_type=?,description=?,requirements=?,active=?,updated_at=? WHERE id=?`).bind(title,location,contractType,description,requirements,active,now(),id).run();
    await audit(env,req,a.user.id,'JOB_UPDATED','job',id,{title,active}); return json({ok:true});
  }
  if(req.method==='DELETE'){
    const id=String(b.id||''); if(!id)return json({error:'ID_REQUIRED'},400); await env.SITE_MEGA_D1.prepare(`DELETE FROM jobs WHERE id=?`).bind(id).run(); await audit(env,req,a.user.id,'JOB_DELETED','job',id,{}); return json({ok:true});
  }
  return json({error:'METHOD_NOT_ALLOWED'},405);
}
async function applicationsAdmin(req,env,url){
  const a=await requireSession(req,env,req.method!=='GET'); if(a.error)return a.error; const denied=requireAdmin(a); if(denied)return denied;
  if(req.method==='GET'){ const rows=await env.SITE_MEGA_D1.prepare(`SELECT a.*,j.title AS job_title FROM job_applications a LEFT JOIN jobs j ON j.id=a.job_id ORDER BY a.created_at DESC LIMIT 500`).all(); return json({applications:rows.results||[]}); }
  const id=url.pathname.split('/').pop();
  if(req.method==='PUT'){ const b=await bodyJson(req); const status=['new','reviewed','shortlisted','rejected','archived'].includes(b.status)?b.status:'reviewed'; await env.SITE_MEGA_D1.prepare(`UPDATE job_applications SET status=? WHERE id=?`).bind(status,id).run(); await audit(env,req,a.user.id,'APPLICATION_STATUS_CHANGED','job_application',id,{status}); return json({ok:true}); }
  if(req.method==='DELETE'){ await env.SITE_MEGA_D1.prepare(`DELETE FROM job_applications WHERE id=?`).bind(id).run(); await audit(env,req,a.user.id,'APPLICATION_DELETED','job_application',id,{}); return json({ok:true}); }
  return json({error:'METHOD_NOT_ALLOWED'},405);
}

export default {
  async fetch(req, env) {
    const url=new URL(req.url);
    try {
      if (url.pathname.startsWith('/api/')) await ensureSchema(env);
      if(url.pathname==='/api/setup-status'&&req.method==='GET') return await setupStatus(env);
      if(url.pathname==='/api/login'&&req.method==='POST') return await login(req,env);
      if(url.pathname==='/api/session'&&req.method==='GET') return await sessionInfo(req,env);
      if(url.pathname==='/api/logout'&&req.method==='POST') return await logout(req,env);
      if(url.pathname==='/api/contact'&&req.method==='POST') return await publicContact(req,env);
      if(url.pathname==='/api/jobs'&&req.method==='GET') return await publicJobs(req,env);
      if(url.pathname==='/api/applications'&&req.method==='POST') return await publicApplication(req,env);
      if(url.pathname==='/api/load'&&req.method==='GET') return await load(req,env);
      if(url.pathname==='/api/save'&&req.method==='POST') return await save(req,env);
      if(url.pathname==='/api/admin/users') return await usersApi(req,env);
      if(url.pathname==='/api/admin/reset-password'&&req.method==='POST') return await resetPassword(req,env);
      if(url.pathname==='/api/admin/jobs') return await jobsAdmin(req,env);
      if(url.pathname==='/api/admin/applications'&&req.method==='GET') return await applicationsAdmin(req,env,url);
      if(url.pathname.startsWith('/api/admin/applications/')) return await applicationsAdmin(req,env,url);
      if(url.pathname.startsWith('/api/admin/contact/')) return await contactAdmin(req,env,url);
      if(url.pathname.startsWith('/api/')) return json({error:'NOT_FOUND'},404);
      return env.ASSETS.fetch(req);
    } catch(e) {
      console.error(e);
      const code=e?.code||e?.message||'SERVER_ERROR';
      if(code==='D1_BINDING_MISSING') return json({error:'SERVER_CONFIG',code,message:'Le binding D1 SITE_MEGA_D1 est absent.'},503);
      if(code==='KV_BINDING_MISSING') return json({error:'SERVER_CONFIG',code,message:'Le binding KV SITE_MEGA_KV est absent.'},503);
      if(code==='JSON_REQUIRED') return json({error:'JSON_REQUIRED',message:'Requête invalide.'},415);
      const raw = String(e?.message || e || 'SERVER_ERROR');
      const safeCode =
        raw.includes('D1') ? 'D1_OPERATION_FAILED' :
        raw.includes('PBKDF2') || raw.includes('deriveBits') ? 'PASSWORD_DERIVATION_FAILED' :
        raw.includes('KV') ? 'KV_OPERATION_FAILED' : 'SERVER_OPERATION_FAILED';
      return json({error:'SERVER_ERROR',code:safeCode,message:'Erreur serveur pendant la connexion. Code : '+safeCode},500);
    }
  }
};
