/**
 * GET /api/seed-demo
 * Creates the demo account if it doesn't exist.
 */

async function hashPassword(password) {
  const salt    = crypto.randomUUID();
  const encoded = new TextEncoder().encode(salt + password);
  const buf     = await crypto.subtle.digest('SHA-256', encoded);
  const hex     = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  return `${salt}:${hex}`;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

export async function onRequestGet({ env }) {
  try {
    const existing = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind('demo@amzmedzone.co.ke').first();

    if (existing) {
      return json({ ok: true, message: 'Demo account already exists.', id: existing.id });
    }

    const hash = await hashPassword('Demo1234!');

    const result = await env.DB.prepare(
      'INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)'
    ).bind('Demo', 'Doctor', 'demo@amzmedzone.co.ke', hash, 'physician').run();

    return json({
      ok     : true,
      message: 'Demo account created successfully.',
      email  : 'demo@amzmedzone.co.ke',
      password: 'Demo1234!'
    }, 201);

  } catch (err) {
    return json({ ok: false, error: err.message || String(err) }, 500);
  }
}
