import { getSessionUser, json } from '../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  const user = await getSessionUser(env.DB, request);
  if (!user) return json({ error: 'Not signed in.' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const projectId = Number(body.projectId);
  if (!projectId) return json({ error: 'projectId is required.' }, { status: 400 });

  await env.DB.prepare(
    `INSERT INTO research_members (project_id, user_id) VALUES (?, ?)
     ON CONFLICT(project_id, user_id) DO NOTHING`
  ).bind(projectId, user.id).run();

  return json({ success: true });
}

export async function onRequestDelete({ request, env }) {
  const user = await getSessionUser(env.DB, request);
  if (!user) return json({ error: 'Not signed in.' }, { status: 401 });

  const projectId = Number(new URL(request.url).searchParams.get('projectId'));
  if (!projectId) return json({ error: 'projectId is required.' }, { status: 400 });

  await env.DB.prepare(
    `DELETE FROM research_members WHERE project_id = ? AND user_id = ?`
  ).bind(projectId, user.id).run();

  return json({ success: true });
}
