import { secure, env, verifyPassword, createSession, getSession, endSession, logEvent, tooMany, countAll, sameOrigin } from "../lib/core.js";

export default secure(["GET", "POST", "DELETE"], async (req, res) => {
  if (req.method === "GET") {
    const s = await getSession(req);
    return s
      ? res.status(200).json({ csrf: s.csrf, legacy: !!env().legacyPassword })
      : res.status(401).json({ error: "Non connecté" });
  }

  if (!sameOrigin(req)) {
    await logEvent(req, "origine_refusee", req.method);
    return res.status(403).json({ error: "Requête refusée" });
  }
  if (req.method === "DELETE") {
    await endSession(req, res);
    return res.status(204).end();
  }

  // Limite : 5 échecs par 15 min et par visiteur, 60 échecs par heure au total.
  if ((await tooMany(req, "login_echec", 5, 900)) || (await countAll("login_echec", 3600)) >= 60) {
    await logEvent(req, "login_bloque");
    res.setHeader("Retry-After", "900");
    return res.status(429).json({ error: "Trop de tentatives. Réessaie dans quelques minutes." });
  }

  const pw = req.body && req.body.password;
  if (typeof pw !== "string" || !(await verifyPassword(pw))) {
    await new Promise((r) => setTimeout(r, 500)); // ralentit les essais répétés
    await logEvent(req, "login_echec");
    return res.status(401).json({ error: "Mot de passe incorrect" });
  }
  const csrf = await createSession(req, res);
  await logEvent(req, "login_ok");
  return res.status(200).json({ csrf, legacy: !!env().legacyPassword });
});
