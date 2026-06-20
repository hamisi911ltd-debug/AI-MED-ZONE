/**
 * POST /api/reset-password
 * Generates a reset token (never reveals if email exists)
 */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON' }, 400); }

  const { email } = body;
  if (!email) return json({ ok: false, error: 'Email is required' }, 400);

  const user = await env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).bind(email.toLowerCase().trim()).first();

  if (user) {
    const resetToken = crypto.randomUUID();
    const exp = new Date();
    exp.setMinutes(exp.getMinutes() + 30);
    await env.DB.prepare(
      'UPDATE users SET reset_token = ?, reset_token_exp = ? WHERE id = ?'
    ).bind(resetToken, exp.toISOString(), user.id).run();
  }

  /* Always return success — prevents email enumeration */
  return json({ ok: true, message: 'If that email exists, a reset link has been sent.' });
}

export async function onRequestOptions() {
  return new Response(null, {
    status : 204,
    headers: {
      'Access-Control-Allow-Origin' : '*',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
