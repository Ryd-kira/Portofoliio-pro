import { sql, isAdmin, sameOrigin } from "./_lib.js";
import { RESOURCES, SETTINGS, clean } from "./_schema.js";
import { DEFAULTS } from "./_defaults.js";

const UUID = /^[0-9a-f-]{36}$/;

// Les noms de colonnes viennent uniquement de _schema.js, jamais de la requête.
const insertQ = (R, row) => {
  const cols = Object.keys(row);
  return sql.query(
    `INSERT INTO ${R.table} (${cols.join(",")}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(",")}) RETURNING id`,
    cols.map((c) => row[c])
  );
};

export default async function handler(req, res) {
  if (!isAdmin(req)) return res.status(401).end();
  const { r, id } = req.query;

  if (r === "meta") {
    const resources = Object.fromEntries(
      Object.entries(RESOURCES).map(([k, v]) => [k, { label: v.label, title: v.title, fields: v.fields }])
    );
    return res.status(200).json({ resources, settings: SETTINGS });
  }

  if (req.method !== "GET" && !sameOrigin(req)) return res.status(403).end();

  if (r === "settings") {
    if (req.method === "GET") {
      const rows = await sql`SELECT key, value FROM settings`;
      return res.status(200).json(Object.fromEntries(rows.map((x) => [x.key, x.value])));
    }
    if (req.method === "PUT") {
      const values = (req.body && req.body.values) || {};
      const qs = [];
      for (const [key, , , max] of SETTINGS) {
        if (!(key in values)) continue;
        const v = String(values[key] ?? "").trim();
        if (v.length > max) return res.status(400).json({ error: "Texte trop long : " + key });
        qs.push(
          v
            ? sql.query("INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()", [key, v])
            : sql.query("DELETE FROM settings WHERE key = $1", [key])
        );
      }
      if (qs.length) await sql.transaction(qs);
      return res.status(204).end();
    }
    return res.status(405).end();
  }

  if (r === "seed") {
    if (req.method !== "POST") return res.status(405).end();
    const done = await sql`SELECT 1 FROM settings WHERE key = 'seeded'`;
    if (done.length) return res.status(409).json({ error: "Contenu déjà importé" });
    const qs = [];
    for (const name of ["projects", "skills", "experiences"]) {
      DEFAULTS[name].forEach((row) => qs.push(insertQ(RESOURCES[name], row)));
    }
    Object.entries(DEFAULTS.settings).forEach(([k, v]) =>
      qs.push(sql.query("INSERT INTO settings (key, value) VALUES ($1, $2)", [k, v]))
    );
    qs.push(sql.query("INSERT INTO settings (key, value) VALUES ('seeded', '1')"));
    await sql.transaction(qs);
    return res.status(201).json({ success: true });
  }

  const R = RESOURCES[r];
  if (!R) return res.status(404).end();

  if (req.method === "GET") {
    const rows = await sql.query(R.list || `SELECT * FROM ${R.table} ORDER BY ${R.order}`);
    return res.status(200).json(rows);
  }

  if (req.method === "POST" || req.method === "PUT") {
    const { out, errors } = clean(r, req.body || {});
    if (errors.length) return res.status(400).json({ error: "Champ invalide : " + errors.join(", ") });
    if (req.method === "POST") {
      const created = await insertQ(R, out);
      return res.status(201).json({ id: created[0].id });
    }
    if (!UUID.test(String(id))) return res.status(400).end();
    const cols = Object.keys(out);
    const rows = await sql.query(
      `UPDATE ${R.table} SET ${cols.map((c, i) => `${c} = $${i + 1}`).join(", ")}, updated_at = now() WHERE id = $${cols.length + 1}::uuid RETURNING id`,
      [...cols.map((c) => out[c]), id]
    );
    return rows.length ? res.status(204).end() : res.status(404).end();
  }

  if (req.method === "DELETE") {
    if (!UUID.test(String(id))) return res.status(400).end();
    await sql.query(`DELETE FROM ${R.table} WHERE id = $1::uuid`, [id]);
    return res.status(204).end();
  }

  return res.status(405).end();
}
