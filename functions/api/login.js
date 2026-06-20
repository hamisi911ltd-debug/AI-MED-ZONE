/**
 * POST /api/login
 */

async function verifyPassword(password, stored) {
  try {
    const [salt, storedHex] = stored.split(':');
    const encoded = new TextEncoder().encode(salt + password);
    const buf     = await crypto.subtle.digest('SHA-256', encoded);
    const hex     = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
    return hex === storedHex;
  } catch {
    return false;
  }
}

function sessionExpiry() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString();
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type'               : 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function onRequestPost({ request, env }) {
  try {
    let body;
    try { body = await request.json(); }
    catch { return json({ ok: false, error: 'Invalid JSON' }, 400); }

    const email    = (body.email    || '').toLowerCase().trim();
    const password = body.password  || '';

    if (!email || !password) {
      return json({ ok: false, error: 'Email and password are required' }, 400);
    }

    /* Look up user */
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email).first();

    if (!user) {
      return json({ ok: false, error: 'Invalid email or password' }, 401);
    }

    /* Check account is active */
    if (user.is_active === 0) {
      return json({ ok: false, error: 'Account is disabled. Contact support.' }, 403);
    }

    /* Verify password */
    if (!user.password_hash) {
      return json({ ok: false, error: 'Account not fully set up. Contact support.' }, 401);
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return json({ ok: false, error: 'Invalid email or password' }, 401);
    }

    /* Create session */
    const token = crypto.randomUUID() + '-' + crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
    ).bind(token, user.id, sessionExpiry()).run();

    /* Update last login */
    await env.DB.prepare(
      'UPDATE users SET last_login_at = ? WHERE id = ?'
    ).bind(new Date().toISOString(), user.id).run();

    /* Audit log — best effort, don't fail login if this errors */
    try {
      await env.DB.prepare(
        'INSERT INTO audit_log (user_id, action) VALUES (?, ?)'
      ).bind(user.id, 'login').run();
    } catch { /* ignore */ }

    return json({
      ok   : true,
      token,
      user : {
        id       : user.id,
        firstName: user.first_name,
        lastName : user.last_name,
        email    : user.email,
        role     : user.role,
        isAdmin  : user.is_admin === 1
      }
    });

  } catch (err) {
    /* Return the real error message so we can debug */
    return json({ ok: false, error: err.message || String(err) }, 500);
  }
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
