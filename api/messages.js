import { secure, sql, requireAdmin } from "../lib/core.js";

export default secure(["GET", "PATCH"], async (req, res) => {
  if (!(await requireAdmin(req, res, { write: req.method === "PATCH" }))) return;

  if (req.method === "GET") {
    const rows = await sql`
      SELECT id, name, email, message, status, created_at
      FROM messages WHERE status <> 'archived'
      ORDER BY created_at DESC LIMIT 100`;
    return res.status(200).json(rows);
  }

  const { id, status } = req.body || {};
  if (!["read", "archived"].includes(status) || !/^[0-9a-f-]{36}$/.test(String(id))) {
    return res.status(400).json({ error: "Requête invalide" });
  }
  await sql`UPDATE messages SET status = ${status} WHERE id = ${id}::uuid`;
  return res.status(204).end();
});
