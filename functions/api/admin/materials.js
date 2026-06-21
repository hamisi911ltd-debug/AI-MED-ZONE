import { json } from '../../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  const courseId = new URL(request.url).searchParams.get('courseId');
  const query = courseId
    ? env.DB.prepare(
        `SELECT m.*, u.first_name AS uploader_first, u.last_name AS uploader_last
         FROM course_materials m LEFT JOIN users u ON u.id = m.uploaded_by
         WHERE m.course_id = ? ORDER BY m.sort_order ASC, m.created_at ASC`
      ).bind(courseId)
    : env.DB.prepare(
        `SELECT m.*, c.title AS course_title, c.week_number, u.first_name AS uploader_first, u.last_name AS uploader_last
         FROM course_materials m LEFT JOIN courses c ON c.id = m.course_id LEFT JOIN users u ON u.id = m.uploaded_by
         ORDER BY m.created_at DESC`
      );

  const { results } = await query.all();
  return json({ materials: results });
}

export async function onRequestPost({ request, env, data }) {
  const contentType = request.headers.get('Content-Type') || '';

  if (contentType.includes('multipart/form-data')) {
    if (!env.MEDIA) {
      return json({ error: 'File storage is not configured yet. Use a link instead, or ask the platform owner to finish R2 setup.' }, { status: 503 });
    }

    const form = await request.formData();
    const file = form.get('file');
    const courseId = form.get('courseId') ? Number(form.get('courseId')) : null;
    const title = (form.get('title') || '').toString().trim();

    if (!file || typeof file === 'string') return json({ error: 'A file is required.' }, { status: 400 });
    if (!title) return json({ error: 'Title is required.' }, { status: 400 });

    const key = `materials/${courseId || 'general'}/${crypto.randomUUID()}-${file.name}`;
    await env.MEDIA.put(key, file.stream(), { httpMetadata: { contentType: file.type || 'application/octet-stream' } });

    const result = await env.DB.prepare(
      `INSERT INTO course_materials (course_id, title, material_type, file_key, file_name, mime_type, file_size, uploaded_by)
       VALUES (?, ?, 'file', ?, ?, ?, ?, ?)`
    ).bind(courseId, title, key, file.name, file.type || null, file.size || null, data.adminUser.id).run();

    return json({ success: true, id: result.meta.last_row_id }, { status: 201 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const courseId = body.courseId ? Number(body.courseId) : null;
  const title = (body.title || '').trim();
  const externalUrl = (body.externalUrl || '').trim();
  if (!title) return json({ error: 'Title is required.' }, { status: 400 });
  if (!externalUrl) return json({ error: 'A URL is required for link materials.' }, { status: 400 });
  if (!/^https?:\/\//i.test(externalUrl)) return json({ error: 'URL must start with http:// or https://' }, { status: 400 });

  const result = await env.DB.prepare(
    `INSERT INTO course_materials (course_id, title, material_type, external_url, uploaded_by) VALUES (?, ?, 'link', ?, ?)`
  ).bind(courseId, title, externalUrl, data.adminUser.id).run();

  return json({ success: true, id: result.meta.last_row_id }, { status: 201 });
}

export async function onRequestDelete({ request, env }) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return json({ error: 'Missing id.' }, { status: 400 });

  const material = await env.DB.prepare('SELECT file_key FROM course_materials WHERE id = ?').bind(id).first();
  if (material?.file_key && env.MEDIA) {
    await env.MEDIA.delete(material.file_key).catch(() => {});
  }
  await env.DB.prepare('DELETE FROM course_materials WHERE id = ?').bind(id).run();
  return json({ success: true });
}
