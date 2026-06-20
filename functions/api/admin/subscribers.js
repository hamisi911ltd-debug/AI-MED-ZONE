import { json } from '../../_lib/auth.js';

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare('SELECT id, email, subscribed_at FROM subscribers ORDER BY subscribed_at DESC').all();
  return json({ subscribers: results });
}
