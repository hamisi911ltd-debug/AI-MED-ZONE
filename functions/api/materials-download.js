import { getSessionUser, json } from '../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(env.DB, request);
  if (!user) return json({ error: 'Not signed in.' }, { status: 401 });

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return json({ error: 'Missing id.' }, { status: 400 });

  const material = await env.DB.prepare('SELECT * FROM course_materials WHERE id = ?').bind(id).first();
  if (!material) return json({ error: 'Material not found.' }, { status: 404 });

  if (material.material_type === 'link') {
    return Response.redirect(material.external_url, 302);
  }

  if (!env.MEDIA) return json({ error: 'File storage is not configured.' }, { status: 503 });

  const object = await env.MEDIA.get(material.file_key);
  if (!object) return json({ error: 'File not found in storage.' }, { status: 404 });

  return new Response(object.body, {
    headers: {
      'Content-Type': material.mime_type || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${(material.file_name || 'file').replace(/"/g, '')}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
