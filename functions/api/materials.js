import { getSessionUser, json } from '../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(env.DB, request);
  if (!user) return json({ error: 'Not signed in.' }, { status: 401 });

  const courseId = new URL(request.url).searchParams.get('courseId');
  if (!courseId) return json({ error: 'courseId is required.' }, { status: 400 });

  const { results } = await env.DB.prepare(
    `SELECT id, title, material_type, file_name, mime_type, file_size, external_url, created_at
     FROM course_materials WHERE course_id = ? ORDER BY sort_order ASC, created_at ASC`
  ).bind(courseId).all();

  return json({ materials: results });
}
