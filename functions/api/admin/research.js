import { json } from '../../_lib/auth.js';

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    `SELECT rp.id, rp.title, rp.description, rp.area, rp.created_at,
       u.first_name AS creator_first, u.last_name AS creator_last,
       (SELECT COUNT(*) FROM research_members m WHERE m.project_id = rp.id) AS member_count
     FROM research_projects rp JOIN users u ON u.id = rp.created_by
     ORDER BY rp.created_at DESC`
  ).all();
  return json({ projects: results });
}

export async function onRequestDelete({ request, env }) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return json({ error: 'Missing id.' }, { status: 400 });
  await env.DB.prepare('DELETE FROM research_members WHERE project_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM research_projects WHERE id = ?').bind(id).run();
  return json({ success: true });
}
