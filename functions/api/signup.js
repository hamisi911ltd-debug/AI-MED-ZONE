import { hashPassword, createSession, sessionCookieHeader, json } from '../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  try {
    let body;
    try { body = await request.json(); }
    catch { return json({ error: 'Invalid JSON' }, { status: 400 }); }

    /* Accept both camelCase and snake_case */
    const first_name = (body.firstName || body.first_name || '').trim();
    const last_name  = (body.lastName  || body.last_name  || '').trim();
    const email      = (body.email     || '').toLowerCase().trim();
    const password   = body.password   || '';
    const role       = body.role       || '';

    if (!first_name || !last_name || !email || !password || !role) {
      return json({ error: 'All fields are required' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'Invalid email address' }, { status: 400 });
    }
    if (password.length < 8) {
      return json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const existing = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();

    if (existing) {
      return json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const hash   = await hashPassword(password);
    const result = await env.DB.prepare(
      'INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)'
    ).bind(first_name, last_name, email, hash, role).run();

    const userId    = result.meta.last_row_id;
    const sessionId = await createSession(env.DB, userId);

    try {
      await env.DB.prepare(
        'INSERT INTO audit_log (user_id, action) VALUES (?, ?)'
      ).bind(userId, 'signup').run();
    } catch { /* ignore if audit_log missing */ }

    return json(
      {
        ok       : true,
        firstName: first_name,
        lastName : last_name,
        email,
        role,
        isAdmin  : false,
      },
      {
        status : 201,
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
