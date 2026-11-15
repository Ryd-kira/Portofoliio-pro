import { sql, isAdmin, sameOrigin } from "./_lib.js";

export default async function handler(req, res) {
  if (!isAdmin(req)) return res.status(401).end();

  if (req.method === "GET") {
    const rows = await sql`
      SELECT id, name, email, message, status, created_at
      FROM messages WHERE status <> 'archived'
      ORDER BY created_at DESC LIMIT 100`;
    return res.status(200).json(rows);
  }

  if (req.method === "PATCH") {
    if (!sameOrigin(req)) return res.status(403).end();
    const { id, status } = req.body || {};
    if (!["read", "archived"].includes(status) || !/^[0-9a-f-]{36}$/.test(String(id))) {
      return res.status(400).end();
    }
    await sql`UPDATE messages SET status = ${status} WHERE id = ${id}::uuid`;
    return res.status(204).end();
  }

  return res.status(405).end();
}
