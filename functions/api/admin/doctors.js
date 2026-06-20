import { json } from '../../_lib/auth.js';

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    `SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.specialty, u.message, u.created_at, u.last_login_at,
       (SELECT COUNT(*) FROM enrollments e WHERE e.user_id = u.id AND e.status = 'completed') AS completed_count,
       (SELECT COUNT(*) FROM enrollments e WHERE e.user_id = u.id AND e.status = 'in_progress') AS in_progress_count
     FROM users u WHERE u.is_admin = 0 ORDER BY u.created_at DESC`
  ).all();
  return json({ doctors: results });
}

export async function onRequestDelete({ request, env }) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return json({ error: 'Missing id.' }, { status: 400 });
  await env.DB.prepare('DELETE FROM enrollments WHERE user_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM users WHERE id = ? AND is_admin = 0').bind(id).run();
  return json({ success: true });
}
