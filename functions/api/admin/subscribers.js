import { json } from '../../_lib/auth.js';

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare('SELECT id, email, subscribed_at FROM subscribers ORDER BY subscribed_at DESC').all();
  return json({ subscribers: results });
}

export async function onRequestDelete({ request, env }) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return json({ error: 'Missing id.' }, { status: 400 });
  await env.DB.prepare('DELETE FROM subscribers WHERE id = ?').bind(id).run();
  return json({ success: true });
}
