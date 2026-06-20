import { getCookie, SESSION_COOKIE, clearSessionCookieHeader, json } from '../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  const sessionId = getCookie(request, SESSION_COOKIE);
  if (sessionId) {
    await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
  }
  return json({ success: true }, { headers: { 'Set-Cookie': clearSessionCookieHeader() } });
}
