import { sql } from "./_lib.js";

// Contenu public du site : uniquement les éléments marqués « visibles ».
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  const [projects, skills, experiences, collaborators, st] = await Promise.all([
    sql`SELECT name, category, status, summary, details, technologies, confirmed FROM projects WHERE published ORDER BY position, created_at`,
    sql`SELECT group_name, name, level, to_clarify FROM skills WHERE published ORDER BY position, created_at`,
    sql`SELECT label, title, description, note FROM experiences WHERE published ORDER BY position, created_at`,
    sql`SELECT c.id, c.first_name, c.last_name, c.linkedin_url, c.portfolio_url, c.github_url,
               (p.collaborator_id IS NOT NULL) AS has_photo,
               (extract(epoch FROM p.updated_at) * 1000)::bigint AS photo_v
        FROM collaborators c LEFT JOIN collaborator_photos p ON p.collaborator_id = c.id
        WHERE c.published ORDER BY c.position, c.created_at`,
    sql`SELECT key, value FROM settings`,
  ]);
  res.setHeader("Cache-Control", "public, s-maxage=15, stale-while-revalidate=60");
  return res.status(200).json({
    projects, skills, experiences, collaborators,
    settings: Object.fromEntries(st.map((r) => [r.key, r.value])),
  });
}
