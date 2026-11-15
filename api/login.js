import { makeSession, passwordOk, sessionCookie, sameOrigin } from "./_lib.js";

export default async function handler(req, res) {
  if (!sameOrigin(req)) return res.status(403).end();

  if (req.method === "DELETE") {
    res.setHeader("Set-Cookie", sessionCookie("", 0));
    return res.status(204).end();
  }
  if (req.method !== "POST") return res.status(405).end();

  const password = req.body && req.body.password;
  await new Promise((r) => setTimeout(r, 600)); // ralentit les essais répétés
  if (typeof password !== "string" || !passwordOk(password)) {
    return res.status(401).json({ error: "Mot de passe incorrect" });
  }
  res.setHeader("Set-Cookie", sessionCookie(makeSession(), 12 * 3600));
  return res.status(204).end();
}
