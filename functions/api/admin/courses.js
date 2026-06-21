import { json } from '../../_lib/auth.js';

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    `SELECT c.*,
       (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'completed') AS completed_count,
       (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'in_progress') AS in_progress_count
     FROM courses c ORDER BY c.week_number ASC`
  ).all();
  return json({ courses: results });
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { weekNumber, slug, title, description, category, level, durationMinutes, topicsCount, rating } = body;
  if (!weekNumber || !slug || !title) {
    return json({ error: 'weekNumber, slug and title are required.' }, { status: 400 });
  }

  await env.DB.prepare(
    `INSERT INTO courses (week_number, slug, title, description, category, level, duration_minutes, topics_count, rating)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(weekNumber, slug, title, description || null, category || null, level || null, durationMinutes || null, topicsCount || null, rating || null)
    .run();

  return json({ success: true });
}

export async function onRequestPatch({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { id, weekNumber, slug, title, description, category, level, durationMinutes, topicsCount, rating } = body;
  if (!id || !weekNumber || !slug || !title) {
    return json({ error: 'id, weekNumber, slug and title are required.' }, { status: 400 });
  }

  await env.DB.prepare(
    `UPDATE courses SET week_number = ?, slug = ?, title = ?, description = ?, category = ?, level = ?,
       duration_minutes = ?, topics_count = ?, rating = ? WHERE id = ?`
  )
    .bind(weekNumber, slug, title, description || null, category || null, level || null, durationMinutes || null, topicsCount || null, rating || null, id)
    .run();

  return json({ success: true });
}

export async function onRequestDelete({ request, env }) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return json({ error: 'Missing id.' }, { status: 400 });
  await env.DB.prepare('DELETE FROM courses WHERE id = ?').bind(id).run();
  return json({ success: true });
}
