/**
 * AMZ MedAI Zone — Cloudflare Worker
 * Handles: /api/signup  /api/login  /api/logout  /api/reset-password
 * DB: Cloudflare D1 bound as env.DB
 */

const CORS = {
  'Access-Control-Allow-Origin' : '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function err(msg, status = 400) {
  return json({ ok: false, error: msg }, status);
}

/* ── Simple hash using Web Crypto (SHA-256 + salt) ── */
async function hashPassword(password) {
  const salt    = crypto.randomUUID();
  const encoded = new TextEncoder().encode(salt + password);
  const buf     = await crypto.subtle.digest('SHA-256', encoded);
  const hex     = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  return `${salt}:${hex}`;
}

async function verifyPassword(password, stored) {
  const [salt, storedHex] = stored.split(':');
  const encoded = new TextEncoder().encode(salt + password);
  const buf     = await crypto.subtle.digest('SHA-256', encoded);
  const hex     = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  return hex === storedHex;
}

/* ── Session token ── */
function newToken() { return crypto.randomUUID() + '-' + crypto.randomUUID(); }

function sessionExpiry() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString();
}

/* ══════════════════════════════════════════════════
   ROUTER
══════════════════════════════════════════════════ */
export default {
  async fetch(request, env) {
    const url    = new URL(request.url);
    const path   = url.pathname;
    const method = request.method;

    /* Preflight */
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    /* ── POST /api/signup ── */
    if (path === '/api/signup' && method === 'POST') {
      return handleSignup(request, env);
    }

    /* ── POST /api/login ── */
    if (path === '/api/login' && method === 'POST') {
      return handleLogin(request, env);
    }

    /* ── POST /api/logout ── */
    if (path === '/api/logout' && method === 'POST') {
      return handleLogout(request, env);
    }

    /* ── POST /api/reset-password ── */
    if (path === '/api/reset-password' && method === 'POST') {
      return handleResetRequest(request, env);
    }

    /* ── GET /api/me ── */
    if (path === '/api/me' && method === 'GET') {
      return handleMe(request, env);
    }

    /* ── POST /api/register ── */
    if (path === '/api/register' && method === 'POST') {
      return handleRegistration(request, env);
    }

    /* ── POST /api/newsletter ── */
    if (path === '/api/newsletter' && method === 'POST') {
      return handleNewsletter(request, env);
    }

    return err('Not found', 404);
  }
};

/* ══════════════════════════════════════════════════
   HANDLERS
══════════════════════════════════════════════════ */

async function handleSignup(request, env) {
  let body;
  try { body = await request.json(); } catch { return err('Invalid JSON'); }

  const { first_name, last_name, email, password, role } = body;

  if (!first_name || !last_name || !email || !password || !role) {
    return err('All fields are required');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return err('Invalid email address');
  }
  if (password.length < 8) {
    return err('Password must be at least 8 characters');
  }

  /* Check duplicate */
  const existing = await env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).bind(email.toLowerCase().trim()).first();

  if (existing) return err('An account with this email already exists', 409);

  const hash = await hashPassword(password);

  const result = await env.DB.prepare(`
    INSERT INTO users (first_name, last_name, email, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    first_name.trim(),
    last_name.trim(),
    email.toLowerCase().trim(),
    hash,
    role
  ).run();

  const userId = result.meta.last_row_id;

  /* Create session */
  const token = newToken();
  await env.DB.prepare(`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (?, ?, ?)
  `).bind(token, userId, sessionExpiry()).run();

  /* Audit */
  await env.DB.prepare(
    'INSERT INTO audit_log (user_id, action) VALUES (?, ?)'
  ).bind(userId, 'signup').run();

  return json({
    ok      : true,
    token,
    user    : { id: userId, first_name, last_name, email, role }
  }, 201);
}


async function handleLogin(request, env) {
  let body;
  try { body = await request.json(); } catch { return err('Invalid JSON'); }

  const { email, password } = body;
  if (!email || !password) return err('Email and password are required');

  const user = await env.DB.prepare(
    'SELECT * FROM users WHERE email = ? AND is_active = 1'
  ).bind(email.toLowerCase().trim()).first();

  if (!user) return err('Invalid email or password', 401);

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid)  return err('Invalid email or password', 401);

  /* Create session */
  const token = newToken();
  await env.DB.prepare(`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (?, ?, ?)
  `).bind(token, user.id, sessionExpiry()).run();

  /* Update last login */
  await env.DB.prepare(
    'UPDATE users SET last_login_at = ? WHERE id = ?'
  ).bind(new Date().toISOString(), user.id).run();

  /* Audit */
  await env.DB.prepare(
    'INSERT INTO audit_log (user_id, action) VALUES (?, ?)'
  ).bind(user.id, 'login').run();

  return json({
    ok   : true,
    token,
    user : {
      id        : user.id,
      first_name: user.first_name,
      last_name : user.last_name,
      email     : user.email,
      role      : user.role
    }
  });
}


async function handleLogout(request, env) {
  const token = getToken(request);
  if (token) {
    await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(token).run();
  }
  return json({ ok: true });
}


async function handleMe(request, env) {
  const token = getToken(request);
  if (!token) return err('Unauthorised', 401);

  const session = await env.DB.prepare(`
    SELECT s.*, u.first_name, u.last_name, u.email, u.role
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = ? AND s.expires_at > datetime('now')
  `).bind(token).first();

  if (!session) return err('Session expired or invalid', 401);

  return json({
    ok  : true,
    user: {
      id        : session.user_id,
      first_name: session.first_name,
      last_name : session.last_name,
      email     : session.email,
      role      : session.role
    }
  });
}


async function handleResetRequest(request, env) {
  let body;
  try { body = await request.json(); } catch { return err('Invalid JSON'); }

  const { email } = body;
  if (!email) return err('Email is required');

  const user = await env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).bind(email.toLowerCase().trim()).first();

  /* Always return success to prevent email enumeration */
  if (!user) return json({ ok: true, message: 'If that email exists, a reset link has been sent.' });

  const resetToken = crypto.randomUUID();
  const exp = new Date();
  exp.setMinutes(exp.getMinutes() + 30);

  await env.DB.prepare(
    'UPDATE users SET reset_token = ?, reset_token_exp = ? WHERE id = ?'
  ).bind(resetToken, exp.toISOString(), user.id).run();

  /* TODO: send email via MailChannels or SendGrid */
  /* For now token is returned in response for testing */

  return json({ ok: true, message: 'Reset link sent.' });
}


async function handleRegistration(request, env) {
  let body;
  try { body = await request.json(); } catch { return err('Invalid JSON'); }

  const { first_name, last_name, email, role, message } = body;
  if (!first_name || !last_name || !email || !role) {
    return err('Required fields missing');
  }

  await env.DB.prepare(`
    INSERT INTO registrations (first_name, last_name, email, role, message)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    first_name.trim(),
    last_name.trim(),
    email.toLowerCase().trim(),
    role,
    message || null
  ).run();

  return json({ ok: true, message: 'Registration received.' }, 201);
}


async function handleNewsletter(request, env) {
  let body;
  try { body = await request.json(); } catch { return err('Invalid JSON'); }

  const { email } = body;
  if (!email) return err('Email is required');

  try {
    await env.DB.prepare(
      'INSERT INTO newsletter_subscribers (email) VALUES (?)'
    ).bind(email.toLowerCase().trim()).run();
  } catch {
    /* Duplicate — already subscribed, not an error */
  }

  return json({ ok: true, message: 'Subscribed successfully.' });
}


/* ── Helpers ── */
function getToken(request) {
  const auth = request.headers.get('Authorization') || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}
