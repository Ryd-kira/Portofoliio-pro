import { sql, isAdmin, sameOrigin } from "./_lib.js";

const KINDS = {
  photo: {
    type: "image/jpeg",
    max: 1_000_000,
    valid: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  cv: {
    type: "application/pdf",
    max: 4_000_000,
    valid: (b) => b.subarray(0, 5).toString("latin1") === "%PDF-",
  },
};

const toBuffer = (v) =>
  Buffer.isBuffer(v) ? v : Buffer.from(String(v).replace(/^\\x/, ""), "hex");

export const fileHandler = (kind) => async (req, res) => {
  const k = KINDS[kind];

  if (req.method === "GET" || req.method === "HEAD") {
    const body = req.method === "GET";
    const [row] = body
      ? await sql`SELECT content_type, data, updated_at FROM site_files WHERE kind = ${kind}`
      : await sql`SELECT content_type, updated_at FROM site_files WHERE kind = ${kind}`;
    if (!row) return res.status(404).end();
    const etag = `W/"${new Date(row.updated_at).getTime()}"`;
    res.setHeader("ETag", etag);
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (req.headers["if-none-match"] === etag) return res.status(304).end();
    res.setHeader("Content-Type", row.content_type);
    if (kind === "cv") {
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="CV-Rydwanoullah-Kolade-Alabi-ICHOLA.pdf"'
      );
    }
    return body ? res.status(200).send(toBuffer(row.data)) : res.status(200).end();
  }

  if (!sameOrigin(req)) return res.status(403).end();
  if (!isAdmin(req)) return res.status(401).end();

  if (req.method === "PUT") {
    const b = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    if (!b.length || b.length > k.max || !k.valid(b)) {
      return res.status(400).json({ error: "Fichier invalide" });
    }
    const hex = "\\x" + b.toString("hex");
    await sql`
      INSERT INTO site_files (kind, content_type, data)
      VALUES (${kind}, ${k.type}, ${hex}::bytea)
      ON CONFLICT (kind) DO UPDATE
      SET content_type = EXCLUDED.content_type, data = EXCLUDED.data, updated_at = now()`;
    return res.status(204).end();
  }

  if (req.method === "DELETE") {
    await sql`DELETE FROM site_files WHERE kind = ${kind}`;
    return res.status(204).end();
  }

  return res.status(405).end();
};
