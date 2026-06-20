import { verifyPassword, createSession, sessionCookieHeader, json } from '../../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  const valid = user && user.is_admin && (await verifyPassword(password, user.password_hash));
  if (!valid) {
    return json({ error: 'Invalid admin credentials.' }, { status: 401 });
  }

  const sessionId = await createSession(env.DB, user.id);
  return json(
    { success: true, user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email } },
    { headers: { 'Set-Cookie': sessionCookieHeader(sessionId) } }
  );
}
