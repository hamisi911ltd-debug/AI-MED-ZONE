import { json } from '../_lib/auth.js';

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    `SELECT id, week_number, slug, title, description, category, level, duration_minutes, topics_count
     FROM courses ORDER BY week_number ASC`
  ).all();
  return json({ courses: results });
}
