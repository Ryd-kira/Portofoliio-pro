import { secure, sql, sameOrigin, logEvent, tooMany, countAll } from "../lib/core.js";

// Retire les caractères de contrôle (sauf tabulation et retours à la ligne).
const clean = (s) => String(s ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();

export default secure(["POST"], async (req, res) => {
  if (!sameOrigin(req)) {
    await logEvent(req, "origine_refusee", "contact");
    return res.status(403).json({ success: false, error: "Requête refusée" });
  }
  const b = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};

  if (b.botcheck) { // piège anti-robots : on répond « succès » sans rien enregistrer
    await logEvent(req, "contact_piege");
    return res.status(200).json({ success: true });
  }

  // 3 messages par 10 min et par visiteur, 20 par 10 min au total.
  if ((await tooMany(req, "contact", 3, 600)) || (await countAll("contact", 600)) >= 20) {
    await logEvent(req, "contact_limite");
    res.setHeader("Retry-After", "600");
    return res.status(429).json({ success: false, error: "Trop de messages, réessayez plus tard" });
  }

  const name = clean(b.name).replace(/\s+/g, " ");
  const email = clean(b.email);
  const message = clean(b.message);
  const valid =
    name && name.length <= 80 &&
    email.length >= 3 && email.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    message && message.length <= 2000;
  if (!valid) {
    await logEvent(req, "contact_invalide");
    return res.status(400).json({ success: false, error: "Champs invalides" });
  }

  await sql`INSERT INTO messages (name, email, message) VALUES (${name}, ${email}, ${message})`;
  await logEvent(req, "contact");
  return res.status(201).json({ success: true });
});
