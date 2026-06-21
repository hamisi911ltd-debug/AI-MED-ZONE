/**
 * GET /api/debug
 * Shows users in DB (no passwords) — REMOVE IN PRODUCTION
 */
export async function onRequestGet({ env }) {
  try {
    const users = await env.DB.prepare(
      'SELECT id, first_name, last_name, email, role, is_active, created_at, last_login_at FROM users'
    ).all();

    const sessions = await env.DB.prepare(
      'SELECT id, user_id, expires_at FROM sessions ORDER BY rowid DESC LIMIT 5'
    ).all();

    return new Response(JSON.stringify({
      user_count   : users.results.length,
      users        : users.results,
      recent_sessions: sessions.results
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status : 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
