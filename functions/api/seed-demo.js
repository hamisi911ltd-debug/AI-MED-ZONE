/**
 * GET /api/seed-demo
 * Creates the demo account if it doesn't exist.
 * Call this once from browser after deployment.
 * Remove or protect this endpoint in production.
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
  const existing = await env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).bind('demo@amzmedzone.co.ke').first();

  if (existing) {
    return json({ ok: true, message: 'Demo account already exists.' });
  }

  const hash = await hashPassword('Demo1234!');

  await env.DB.prepare(
    'INSERT INTO users (first_name, last_name, email, password_hash, role, is_verified, is_active) VALUES (?, ?, ?, ?, ?, 1, 1)'
  ).bind('Demo', 'Doctor', 'demo@amzmedzone.co.ke', hash, 'physician').run();

  return json({ ok: true, message: 'Demo account created. Email: demo@amzmedzone.co.ke / Password: Demo1234!' }, 201);
}
