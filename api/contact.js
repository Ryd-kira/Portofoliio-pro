import { sql, sameOrigin } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!sameOrigin(req)) return res.status(403).end();

  const b = req.body || {};
  if (b.botcheck) return res.status(200).json({ success: true }); // piège anti-robots

  const name = String(b.name || "").trim();
  const email = String(b.email || "").trim();
  const message = String(b.message || "").trim();
  const valid =
    name && name.length <= 80 &&
    email.length >= 3 && email.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    message && message.length <= 2000;
  if (!valid) return res.status(400).json({ success: false, error: "Champs invalides" });

  // Frein simple contre l'inondation de messages.
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM messages WHERE created_at > now() - interval '10 minutes'`;
  if (n >= 20) return res.status(429).json({ success: false, error: "Trop de messages, réessayez plus tard" });

  await sql`INSERT INTO messages (name, email, message) VALUES (${name}, ${email}, ${message})`;
  return res.status(201).json({ success: true });
}
