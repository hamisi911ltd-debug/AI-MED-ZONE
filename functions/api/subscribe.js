import { json } from '../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const email = (body.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Please provide a valid email address.' }, { status: 400 });
  }

  await env.DB.prepare('INSERT INTO subscribers (email) VALUES (?) ON CONFLICT(email) DO NOTHING').bind(email).run();
  return json({ success: true });
}
