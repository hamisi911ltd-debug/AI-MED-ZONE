import { getSessionUser, json } from '../../_lib/auth.js';

export async function onRequest({ request, env, next, data }) {
  const url = new URL(request.url);
  if (url.pathname === '/api/admin/login') return next();

  const user = await getSessionUser(env.DB, request);
  if (!user || !user.is_admin) {
    return json({ error: 'Unauthorized.' }, { status: 401 });
  }
  data.adminUser = user;
  return next();
}
