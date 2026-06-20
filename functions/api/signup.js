import { hashPassword, createSession, sessionCookieHeader, json } from '../_lib/auth.js';
import { DOCTOR_ROLES } from '../_lib/constants.js';

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const firstName = (body.firstName || '').trim();
  const lastName = (body.lastName || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  const role = (body.role || '').trim();
  const message = (body.message || '').trim();

  if (!firstName || !lastName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Please provide a valid name and email address.' }, { status: 400 });
  }
  if (!DOCTOR_ROLES.includes(role)) {
    return json({ error: 'This platform is for verified doctors only. Please select your medical role.' }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) {
    return json({ error: 'An account with this email already exists. Please sign in instead.' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const result = await env.DB.prepare(
    `INSERT INTO users (first_name, last_name, email, password_hash, role, message)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(firstName, lastName, email, passwordHash, role, message || null)
    .run();

  const userId = result.meta.last_row_id;
  await env.DB.prepare(`INSERT INTO enrollments (user_id, status) VALUES (?, 'pending')`).bind(userId).run();

  const sessionId = await createSession(env.DB, userId);
  return json(
    { success: true, user: { id: userId, firstName, lastName, email, role } },
    { headers: { 'Set-Cookie': sessionCookieHeader(sessionId) } }
  );
}
