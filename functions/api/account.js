import { getSessionUser, json } from '../_lib/auth.js';
import { DOCTOR_ROLES } from '../_lib/constants.js';

export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(env.DB, request);
  if (!user) return json({ error: 'Not signed in.' }, { status: 401 });

  const stats = await env.DB.prepare(
    `SELECT
       COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_count,
       COUNT(CASE WHEN status = 'in_progress' THEN 1 END) AS in_progress_count
     FROM enrollments WHERE user_id = ?`
  ).bind(user.id).first();

  const { results: researchProjects } = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM research_members WHERE user_id = ?`
  ).bind(user.id).all();

  const { results: studyGroups } = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM study_group_members WHERE user_id = ?`
  ).bind(user.id).all();

  return json({
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    role: user.role,
    isAdmin: !!user.is_admin,
    createdAt: user.created_at,
    lastLoginAt: user.last_login_at,
    stats: {
      completedCount: stats?.completed_count || 0,
      inProgressCount: stats?.in_progress_count || 0,
      researchProjects: researchProjects[0]?.n || 0,
      studyGroups: studyGroups[0]?.n || 0,
    },
  });
}

export async function onRequestPatch({ request, env }) {
  const user = await getSessionUser(env.DB, request);
  if (!user) return json({ error: 'Not signed in.' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const firstName = (body.firstName || '').trim();
  const lastName = (body.lastName || '').trim();
  const role = body.role || user.role;

  if (firstName.length < 2 || lastName.length < 2) {
    return json({ error: 'First and last name are required.' }, { status: 400 });
  }
  if (role && !DOCTOR_ROLES.includes(role)) {
    return json({ error: 'Invalid medical role.' }, { status: 400 });
  }

  await env.DB.prepare(
    `UPDATE users SET first_name = ?, last_name = ?, role = ? WHERE id = ?`
  ).bind(firstName, lastName, role, user.id).run();

  return json({ success: true });
}
