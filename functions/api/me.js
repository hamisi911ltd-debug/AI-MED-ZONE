import { getSessionUser, json } from '../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(env.DB, request);
  if (!user) return json({ error: 'Not signed in.' }, { status: 401 });
  return json({
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    isAdmin: !!user.is_admin,
  });
}
