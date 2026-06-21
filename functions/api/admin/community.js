import { json } from '../../_lib/auth.js';

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    `SELECT sg.id, sg.name, sg.description, sg.created_at,
       c.title AS course_title, c.week_number,
       u.first_name AS creator_first, u.last_name AS creator_last,
       (SELECT COUNT(*) FROM study_group_members m WHERE m.group_id = sg.id) AS member_count
     FROM study_groups sg JOIN courses c ON c.id = sg.course_id JOIN users u ON u.id = sg.created_by
     ORDER BY sg.created_at DESC`
  ).all();
  return json({ groups: results });
}

export async function onRequestDelete({ request, env }) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return json({ error: 'Missing id.' }, { status: 400 });
  await env.DB.prepare('DELETE FROM study_group_members WHERE group_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM study_groups WHERE id = ?').bind(id).run();
  return json({ success: true });
}
