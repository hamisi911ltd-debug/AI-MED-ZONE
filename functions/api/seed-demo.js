import { hashPassword, createSession, sessionCookieHeader, json } from '../_lib/auth.js';

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
      ok      : true,
      message : 'Demo account created.',
      email   : 'demo@amzmedzone.co.ke',
      password: 'Demo1234!'
    }, { status: 201 });

  } catch (err) {
    return json({ ok: false, error: err.message || String(err) }, { status: 500 });
  }
}
