import { json } from '../../_lib/auth.js';

export async function onRequestGet({ env }) {
  const [doctors, courses, subscribers, completed, inProgress] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) AS n FROM users WHERE is_admin = 0').first(),
    env.DB.prepare('SELECT COUNT(*) AS n FROM courses').first(),
    env.DB.prepare('SELECT COUNT(*) AS n FROM subscribers').first(),
    env.DB.prepare(`SELECT COUNT(*) AS n FROM enrollments WHERE status = 'completed'`).first(),
    env.DB.prepare(`SELECT COUNT(*) AS n FROM enrollments WHERE status = 'in_progress'`).first(),
  ]);

  return json({
    doctors: doctors.n,
    courses: courses.n,
    subscribers: subscribers.n,
    modulesCompleted: completed.n,
    modulesInProgress: inProgress.n,
  });
}
