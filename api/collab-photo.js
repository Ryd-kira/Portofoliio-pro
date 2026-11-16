import { secure, sql, getSession, requireAdmin, logEvent } from "../lib/core.js";

const UUID = /^[0-9a-f-]{36}$/;
const MAX = 500_000;
const isJpeg = (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
const toBuffer = (v) =>
  Buffer.isBuffer(v) ? v : v instanceof Uint8Array ? Buffer.from(v) : Buffer.from(String(v).replace(/^\\x/, ""), "hex");

// Photo d'un collaborateur : lecture publique (si le collaborateur est visible), écriture réservée à l'administrateur.
export default secure(["GET", "HEAD", "PUT", "DELETE"], async (req, res) => {
  const id = String(req.query.id || "");
  if (!UUID.test(id)) return res.status(400).json({ error: "Identifiant invalide" });

  if (req.method === "GET" || req.method === "HEAD") {
    const admin = !!(await getSession(req));
    const [row] = await sql`
      SELECT p.data, p.updated_at
      FROM collaborator_photos p JOIN collaborators c ON c.id = p.collaborator_id
      WHERE p.collaborator_id = ${id}::uuid AND (c.published OR ${admin})`;
    if (!row) return res.status(404).end();
    const etag = `W/"${new Date(row.updated_at).getTime()}"`;
    res.setHeader("ETag", etag);
    res.setHeader("Cache-Control", admin ? "private, no-store" : "public, max-age=0, s-maxage=60, must-revalidate");
    if (req.headers["if-none-match"] === etag) return res.status(304).end();
    res.setHeader("Content-Type", "image/jpeg");
    return req.method === "HEAD" ? res.status(200).end() : res.status(200).send(toBuffer(row.data));
  }

  if (!(await requireAdmin(req, res, { write: true }))) return;

  if (req.method === "PUT") {
    const b = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    if (!b.length || b.length > MAX || !isJpeg(b)) {
      await logEvent(req, "upload_refuse", `collab, ${b.length} octets`);
      return res.status(400).json({ error: "Image invalide" });
    }
    const hex = b.toString("hex");
    try {
      await sql`
        INSERT INTO collaborator_photos (collaborator_id, data) VALUES (${id}::uuid, decode(${hex}, 'hex'))
        ON CONFLICT (collaborator_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`;
    } catch (e) {
      if (e && e.code === "23503") return res.status(404).json({ error: "Collaborateur introuvable" });
      throw e;
    }
    return res.status(204).end();
  }

  await sql`DELETE FROM collaborator_photos WHERE collaborator_id = ${id}::uuid`;
  return res.status(204).end();
});
