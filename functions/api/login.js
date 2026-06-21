import { verifyPassword, createSession, sessionCookieHeader, json } from '../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  try {
    let body;
    try { body = await request.json(); }
    catch { return json({ error: 'Invalid JSON' }, { status: 400 }); }

    const email    = (body.email    || '').toLowerCase().trim();
    const password = body.password  || '';

    if (!email || !password) {
      return json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email).first();

    if (!user) {
      return json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (user.is_active === 0) {
      return json({ error: 'Account is disabled. Contact support.' }, { status: 403 });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const sessionId = await createSession(env.DB, user.id);

    await env.DB.prepare(
      'UPDATE users SET last_login_at = ? WHERE id = ?'
    ).bind(new Date().toISOString(), user.id).run();

    try {
      await env.DB.prepare(
        'INSERT INTO audit_log (user_id, action) VALUES (?, ?)'
      ).bind(user.id, 'login').run();
    } catch { /* ignore if audit_log table missing */ }

    return json(
      {
        ok       : true,
        firstName: user.first_name,
        lastName : user.last_name,
        email    : user.email,
        isAdmin  : !!user.is_admin,
      },
      {
        status : 200,
        headers: { 'Set-Cookie': sessionCookieHeader(sessionId) },
      }
    );

  } catch (err) {
    return json({ error: err.message || String(err) }, { status: 500 });
  }
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
