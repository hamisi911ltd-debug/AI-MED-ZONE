/**
 * POST /api/signup
 * Creates a new user account and returns a session token
 */

async function hashPassword(password) {
  const salt    = crypto.randomUUID();
  const encoded = new TextEncoder().encode(salt + password);
  const buf     = await crypto.subtle.digest('SHA-256', encoded);
  const hex     = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  return `${salt}:${hex}`;
}

function sessionExpiry() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString();
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON' }, 400); }

  const { first_name, last_name, email, password, role } = body;

  if (!first_name || !last_name || !email || !password || !role) {
    return json({ ok: false, error: 'All fields are required' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: 'Invalid email address' }, 400);
  }
  if (password.length < 8) {
    return json({ ok: false, error: 'Password must be at least 8 characters' }, 400);
  }

  const existing = await env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).bind(email.toLowerCase().trim()).first();

  if (existing) {
    return json({ ok: false, error: 'An account with this email already exists' }, 409);
  }

  const hash   = await hashPassword(password);
  const result = await env.DB.prepare(
    'INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)'
  ).bind(first_name.trim(), last_name.trim(), email.toLowerCase().trim(), hash, role).run();

  const userId = result.meta.last_row_id;
  const token  = crypto.randomUUID() + '-' + crypto.randomUUID();

  await env.DB.prepare(
    'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
  ).bind(token, userId, sessionExpiry()).run();

  await env.DB.prepare(
    'INSERT INTO audit_log (user_id, action) VALUES (?, ?)'
  ).bind(userId, 'signup').run();

  return json({
    ok   : true,
    token,
    user : { id: userId, first_name: first_name.trim(), last_name: last_name.trim(), email, role }
  }, 201);
}

export async function onRequestOptions() {
  return new Response(null, {
    status : 204,
    headers: {
      'Access-Control-Allow-Origin' : '*',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
