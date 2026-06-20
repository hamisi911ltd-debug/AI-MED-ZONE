/**
 * POST /api/login
 * Verifies credentials and returns a session token
 */

async function verifyPassword(password, stored) {
  const [salt, storedHex] = stored.split(':');
  const encoded = new TextEncoder().encode(salt + password);
  const buf     = await crypto.subtle.digest('SHA-256', encoded);
  const hex     = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  return hex === storedHex;
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

  const { email, password } = body;
  if (!email || !password) return json({ ok: false, error: 'Email and password are required' }, 400);

  const user = await env.DB.prepare(
    'SELECT * FROM users WHERE email = ? AND is_active = 1'
  ).bind(email.toLowerCase().trim()).first();

  if (!user) return json({ ok: false, error: 'Invalid email or password' }, 401);

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid)  return json({ ok: false, error: 'Invalid email or password' }, 401);

  const token = crypto.randomUUID() + '-' + crypto.randomUUID();

  await env.DB.prepare(
    'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
  ).bind(token, user.id, sessionExpiry()).run();

  await env.DB.prepare(
    'UPDATE users SET last_login_at = ? WHERE id = ?'
  ).bind(new Date().toISOString(), user.id).run();

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
