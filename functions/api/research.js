import { getSessionUser, json } from '../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(env.DB, request);
  if (!user) return json({ error: 'Not signed in.' }, { status: 401 });

  const { results } = await env.DB.prepare(
    `SELECT rp.id, rp.title, rp.description, rp.area, rp.created_by, rp.created_at,
       u.first_name AS creator_first, u.last_name AS creator_last,
       (SELECT COUNT(*) FROM research_members m WHERE m.project_id = rp.id) AS member_count,
       EXISTS(SELECT 1 FROM research_members m2 WHERE m2.project_id = rp.id AND m2.user_id = ?) AS joined
     FROM research_projects rp
     JOIN users u ON u.id = rp.created_by
     ORDER BY rp.created_at DESC`
  ).bind(user.id).all();

  return json({ projects: results.map((p) => ({ ...p, joined: !!p.joined })) });
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

  const title = (body.title || '').trim();
  const description = (body.description || '').trim();
  const area = (body.area || '').trim();
  if (!title) return json({ error: 'Title is required.' }, { status: 400 });

  const result = await env.DB.prepare(
    `INSERT INTO research_projects (title, description, area, created_by) VALUES (?, ?, ?, ?)`
  ).bind(title, description, area, user.id).run();

  const projectId = result.meta.last_row_id;
  await env.DB.prepare(
    `INSERT INTO research_members (project_id, user_id) VALUES (?, ?)`
  ).bind(projectId, user.id).run();

  return json({ success: true, id: projectId }, { status: 201 });
}
