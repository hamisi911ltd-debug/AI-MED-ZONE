import { json } from '../../_lib/auth.js';

export async function onRequestGet({ data }) {
  const u = data.adminUser;
  return json({ id: u.id, firstName: u.first_name, lastName: u.last_name, email: u.email });
}
