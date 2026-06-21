import { getSessionUser, json } from '../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(env.DB, request);
  if (!user) return json({ error: 'Not signed in.' }, { status: 401 });

  const { results } = await env.DB.prepare(
    `SELECT sg.id, sg.name, sg.description, sg.created_by, sg.created_at,
       c.title AS course_title, c.week_number,
       u.first_name AS creator_first, u.last_name AS creator_last,
       (SELECT COUNT(*) FROM study_group_members m WHERE m.group_id = sg.id) AS member_count,
       EXISTS(SELECT 1 FROM study_group_members m2 WHERE m2.group_id = sg.id AND m2.user_id = ?) AS joined
     FROM study_groups sg
     JOIN courses c ON c.id = sg.course_id
     JOIN users u ON u.id = sg.created_by
     ORDER BY sg.created_at DESC`
  ).bind(user.id).all();

  return json({ groups: results.map((g) => ({ ...g, joined: !!g.joined })) });
}

export async function onRequestPost({ request, env }) {
  const user = await getSessionUser(env.DB, request);
  if (!user) return json({ error: 'Not signed in.' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const courseId = Number(body.courseId);
  const name = (body.name || '').trim();
  const description = (body.description || '').trim();
  if (!courseId || !name) return json({ error: 'courseId and name are required.' }, { status: 400 });

  const result = await env.DB.prepare(
    `INSERT INTO study_groups (course_id, name, description, created_by) VALUES (?, ?, ?, ?)`
  ).bind(courseId, name, description, user.id).run();

  const groupId = result.meta.last_row_id;
  await env.DB.prepare(
    `INSERT INTO study_group_members (group_id, user_id) VALUES (?, ?)`
  ).bind(groupId, user.id).run();

  return json({ success: true, id: groupId }, { status: 201 });
}
