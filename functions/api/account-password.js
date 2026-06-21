import { getSessionUser, verifyPassword, hashPassword, json } from '../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  const user = await getSessionUser(env.DB, request);
  if (!user) return json({ error: 'Not signed in.' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const currentPassword = body.currentPassword || '';
  const newPassword = body.newPassword || '';

  if (newPassword.length < 8) {
    return json({ error: 'New password must be at least 8 characters.' }, { status: 400 });
  }

  const valid = await verifyPassword(currentPassword, user.password_hash);
  if (!valid) {
    return json({ error: 'Current password is incorrect.' }, { status: 401 });
  }

  const hash = await hashPassword(newPassword);
  await env.DB.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).bind(hash, user.id).run();

  return json({ success: true });
}
