import { getSessionUser, json } from '../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(env.DB, request);
  if (!user) return json({ error: 'Not signed in.' }, { status: 401 });

  const { results } = await env.DB.prepare(
    `SELECT u.id, u.first_name, u.last_name, u.role,
       COUNT(CASE WHEN e.status = 'completed' THEN 1 END) AS completed_count,
       COUNT(CASE WHEN e.status = 'in_progress' THEN 1 END) AS in_progress_count
     FROM users u
     LEFT JOIN enrollments e ON e.user_id = u.id
     WHERE u.is_admin = 0
     GROUP BY u.id
     ORDER BY completed_count DESC, in_progress_count DESC, u.created_at ASC
     LIMIT 10`
  ).all();

  const leaderboard = results.map((row, idx) => ({
    rank: idx + 1,
    isMe: row.id === user.id,
    firstName: row.first_name,
    lastInitial: (row.last_name || '').charAt(0),
    role: row.role,
    completedCount: row.completed_count,
    inProgressCount: row.in_progress_count,
    points: row.completed_count * 100 + row.in_progress_count * 25,
  }));

  return json({ leaderboard });
}
