import { sql, isAdmin, sameOrigin } from "./_lib.js";

const UUID = /^[0-9a-f-]{36}$/;
const MAX = 500_000;
const isJpeg = (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
const toBuffer = (v) => (Buffer.isBuffer(v) ? v : Buffer.from(String(v).replace(/^\\x/, ""), "hex"));

// Photo d'un collaborateur : lecture publique (si le collaborateur est visible), écriture réservée à l'administrateur.
export default async function handler(req, res) {
  const id = String(req.query.id || "");
  if (!UUID.test(id)) return res.status(400).end();

  if (req.method === "GET" || req.method === "HEAD") {
    const admin = isAdmin(req);
    const [row] = await sql`
      SELECT p.data, p.updated_at
      FROM collaborator_photos p JOIN collaborators c ON c.id = p.collaborator_id
      WHERE p.collaborator_id = ${id}::uuid AND (c.published OR ${admin})`;
    if (!row) return res.status(404).end();
    const etag = `W/"${new Date(row.updated_at).getTime()}"`;
    res.setHeader("ETag", etag);
    res.setHeader("Cache-Control", admin ? "private, no-store" : "public, max-age=0, s-maxage=60, must-revalidate");
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (req.headers["if-none-match"] === etag) return res.status(304).end();
    res.setHeader("Content-Type", "image/jpeg");
    return req.method === "HEAD" ? res.status(200).end() : res.status(200).send(toBuffer(row.data));
  }

  if (!sameOrigin(req)) return res.status(403).end();
  if (!isAdmin(req)) return res.status(401).end();

  if (req.method === "PUT") {
    const b = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    if (!b.length || b.length > MAX || !isJpeg(b)) return res.status(400).json({ error: "Image invalide" });
    const hex = "\\x" + b.toString("hex");
    try {
      await sql`
        INSERT INTO collaborator_photos (collaborator_id, data) VALUES (${id}::uuid, ${hex}::bytea)
        ON CONFLICT (collaborator_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`;
    } catch (e) {
      if (e && e.code === "23503") return res.status(404).end(); // collaborateur inexistant
      throw e;
    }
    return res.status(204).end();
  }

  if (req.method === "DELETE") {
    await sql`DELETE FROM collaborator_photos WHERE collaborator_id = ${id}::uuid`;
    return res.status(204).end();
  }

  return res.status(405).end();
}
