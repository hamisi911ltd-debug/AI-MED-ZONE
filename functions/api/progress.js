import { getSessionUser, json } from '../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(env.DB, request);
  if (!user) return json({ error: 'Not signed in.' }, { status: 401 });

  const { results } = await env.DB.prepare(
    `SELECT course_id, status, completed_at FROM enrollments WHERE user_id = ? AND course_id IS NOT NULL`
  )
    .bind(user.id)
    .all();
  return json({ progress: results });
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
  const status = body.status;
  if (!courseId || !['in_progress', 'completed'].includes(status)) {
    return json({ error: 'courseId and a valid status are required.' }, { status: 400 });
  }

  await env.DB.prepare(
    `INSERT INTO enrollments (user_id, course_id, status, completed_at)
     VALUES (?, ?, ?, ${status === 'completed' ? "datetime('now')" : 'NULL'})
     ON CONFLICT(user_id, course_id) DO UPDATE SET
       status = excluded.status,
       completed_at = excluded.completed_at`
  )
    .bind(user.id, courseId, status)
    .run();

  return json({ success: true });
}
