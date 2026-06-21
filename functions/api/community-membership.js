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

  const groupId = Number(body.groupId);
  if (!groupId) return json({ error: 'groupId is required.' }, { status: 400 });

  await env.DB.prepare(
    `INSERT INTO study_group_members (group_id, user_id) VALUES (?, ?)
     ON CONFLICT(group_id, user_id) DO NOTHING`
  ).bind(groupId, user.id).run();

  return json({ success: true });
}

export async function onRequestDelete({ request, env }) {
  const user = await getSessionUser(env.DB, request);
  if (!user) return json({ error: 'Not signed in.' }, { status: 401 });

  const groupId = Number(new URL(request.url).searchParams.get('groupId'));
  if (!groupId) return json({ error: 'groupId is required.' }, { status: 400 });

  await env.DB.prepare(
    `DELETE FROM study_group_members WHERE group_id = ? AND user_id = ?`
  ).bind(groupId, user.id).run();

  return json({ success: true });
}
