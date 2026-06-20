import { verifyPassword, createSession, sessionCookieHeader, json } from '../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  if (!email || !password) {
    return json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  const valid = user && (await verifyPassword(password, user.password_hash));
  if (!valid) {
    return json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  await env.DB.prepare(`UPDATE users SET last_login_at = datetime('now') WHERE id = ?`).bind(user.id).run();
  const sessionId = await createSession(env.DB, user.id);

  return json(
    {
      success: true,
      user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email, role: user.role, isAdmin: !!user.is_admin },
    },
    { headers: { 'Set-Cookie': sessionCookieHeader(sessionId) } }
  );
}
