import { neon } from "@neondatabase/serverless";
import { createHash, createHmac, pbkdf2, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const pbkdf2Async = promisify(pbkdf2);

/* ---------- Variables d'environnement : vérifiées à chaque requête, jamais affichées ---------- */
export function env() {
  const e = process.env;
  const bad = [];
  if (!/^postgres(ql)?:\/\//.test(e.DATABASE_URL || "")) bad.push("DATABASE_URL");
  if ((e.SESSION_SECRET || "").length < 32) bad.push("SESSION_SECRET");
  const hash = e.ADMIN_PASSWORD_HASH || "";
  const hashOk = /^pbkdf2-sha256\$\d{5,7}\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]+$/.test(hash);
  if (!hashOk && (e.ADMIN_PASSWORD || "").length < 12) bad.push("ADMIN_PASSWORD_HASH");
  if (bad.length) {
    const err = new Error("Variables d'environnement invalides : " + bad.join(", "));
    err.env = true;
    throw err;
  }
  return {
    databaseUrl: e.DATABASE_URL,
    secret: e.SESSION_SECRET,
    hash: hashOk ? hash : null,
    legacyPassword: hashOk ? null : e.ADMIN_PASSWORD, // ancien mode : mot de passe en clair dans Vercel
  };
}

/* ---------- Base de données (requêtes toujours paramétrées) ---------- */
let _sql;
const db = () => (_sql ??= neon(env().databaseUrl));
export const sql = (...a) => db()(...a);
sql.query = (...a) => db().query(...a);
sql.transaction = (...a) => db().transaction(...a);
export const setSqlForTests = (x) => { _sql = x; };

/* ---------- Identité du visiteur (haché, jamais stocké en clair) ---------- */
const hmac = (v) => createHmac("sha256", env().secret).update(String(v)).digest("hex").slice(0, 32);
export const clientIp = (req) =>
  String(req.headers["x-vercel-forwarded-for"] || req.headers["x-real-ip"] || String(req.headers["x-forwarded-for"] || "").split(",")[0] || "inconnue").trim();
export const ipHash = (req) => hmac("ip:" + clientIp(req));
const pathOf = (req) => String(req.url || "").split("?")[0].slice(0, 120);

/* ---------- Journal des événements de sécurité ---------- */
export async function logEvent(req, kind, detail = null) {
  try {
    const ip = ipHash(req);
    const d = detail ? String(detail).slice(0, 300) : null;
    console.warn(JSON.stringify({ securite: kind, ip, chemin: pathOf(req), detail: d }));
    await sql`INSERT INTO security_events (kind, ip_hash, path, detail) VALUES (${kind}, ${ip}, ${pathOf(req)}, ${d})`;
    if (Math.random() < 0.02) await sql`DELETE FROM security_events WHERE at < now() - interval '90 days'`;
  } catch (e) {
    console.error("journal indisponible:", String(e.message).slice(0, 120));
  }
}

/* ---------- Limites de requêtes (comptées en base : fonctionne en serverless) ---------- */
export async function tooMany(req, kind, max, windowSec) {
  const [r] = await sql`SELECT count(*)::int AS n FROM security_events WHERE kind = ${kind} AND ip_hash = ${ipHash(req)} AND at > now() - make_interval(secs => ${windowSec})`;
  return r.n >= max;
}
export async function countAll(kind, windowSec) {
  const [r] = await sql`SELECT count(*)::int AS n FROM security_events WHERE kind = ${kind} AND at > now() - make_interval(secs => ${windowSec})`;
  return r.n;
}

/* ---------- Mot de passe : PBKDF2-SHA256 (hachage) ---------- */
export async function verifyPassword(candidate) {
  const { hash, legacyPassword } = env();
  const p = String(candidate ?? "");
  if (!p.length || p.length > 200) return false;
  if (hash) {
    const [, iter, salt, want] = hash.split("$");
    const n = Number(iter);
    if (n < 100000 || n > 2000000) return false;
    const got = await pbkdf2Async(p, Buffer.from(salt, "base64url"), n, 32, "sha256");
    const w = Buffer.from(want, "base64url");
    return w.length === got.length && timingSafeEqual(w, got);
  }
  const h = (v) => createHash("sha256").update(v).digest();
  return timingSafeEqual(h(p), h(legacyPassword));
}

/* ---------- Sessions côté serveur (révocables) + jeton CSRF ---------- */
const COOKIE = "__Host-adm";
const ABSOLUTE_HOURS = 8;
const IDLE_MINUTES = 120;
const sha = (v) => createHash("sha256").update(v).digest("hex");
const cookie = (v, maxAge) => `${COOKIE}=${v}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
export const clearCookie = () => cookie("", 0);
const tokenOf = (req) => (new RegExp(`(?:^|;\\s*)${COOKIE}=([A-Za-z0-9_-]{20,80})`).exec(req.headers.cookie || "") || [])[1] || null;

export async function createSession(req, res) {
  const token = randomBytes(32).toString("base64url");
  const csrf = randomBytes(24).toString("base64url");
  const ua = String(req.headers["user-agent"] || "").slice(0, 200) || null;
  await sql`INSERT INTO admin_sessions (token_hash, csrf, ip_hash, user_agent, expires_at) VALUES (${sha(token)}, ${csrf}, ${ipHash(req)}, ${ua}, now() + make_interval(hours => ${ABSOLUTE_HOURS}))`;
  await sql`DELETE FROM admin_sessions WHERE expires_at < now()`;
  res.setHeader("Set-Cookie", cookie(token, ABSOLUTE_HOURS * 3600));
  return csrf;
}

export async function getSession(req) {
  const t = tokenOf(req);
  if (!t) return null;
  const [s] = await sql`SELECT token_hash, csrf, last_seen FROM admin_sessions WHERE token_hash = ${sha(t)} AND expires_at > now() AND last_seen > now() - make_interval(mins => ${IDLE_MINUTES})`;
  if (!s) return null;
  if (Date.now() - new Date(s.last_seen).getTime() > 60_000) {
    await sql`UPDATE admin_sessions SET last_seen = now() WHERE token_hash = ${s.token_hash}`;
  }
  return s;
}

export async function endSession(req, res) {
  const t = tokenOf(req);
  if (t) await sql`DELETE FROM admin_sessions WHERE token_hash = ${sha(t)}`;
  res.setHeader("Set-Cookie", clearCookie());
}

// Les écritures doivent venir de notre propre site (en-tête Origin obligatoire).
export function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}

// Verrou des routes admin : session valide ; pour les écritures, Origin + jeton CSRF.
export async function requireAdmin(req, res, { write = false } = {}) {
  const s = await getSession(req);
  if (!s) { res.status(401).json({ error: "Non connecté" }); return null; }
  if (write) {
    const a = Buffer.from(String(req.headers["x-csrf-token"] || ""));
    const b = Buffer.from(s.csrf);
    if (!sameOrigin(req) || a.length !== b.length || !timingSafeEqual(a, b)) {
      await logEvent(req, "csrf_refuse", req.method);
      res.status(403).json({ error: "Requête refusée" });
      return null;
    }
  }
  return s;
}

/* ---------- Enveloppe commune : en-têtes, méthodes, erreurs génériques ---------- */
export const secure = (methods, fn) => async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; sandbox");
  res.setHeader("X-Robots-Tag", "noindex");
  try {
    env(); // échoue proprement si une variable manque
    if (!methods.includes(req.method)) {
      res.setHeader("Allow", methods.join(", "));
      return res.status(405).json({ error: "Méthode non autorisée" });
    }
    if (Number(req.headers["content-length"] || 0) > 5_000_000) {
      return res.status(413).json({ error: "Requête trop volumineuse" });
    }
    return await fn(req, res);
  } catch (e) {
    // Détails dans les journaux serveur uniquement : jamais dans la réponse.
    console.error(JSON.stringify({ erreur: e.env ? e.message : "exception", nom: e.name, message: String(e.message).slice(0, 200) }));
    const st = e.statusCode >= 400 && e.statusCode < 500 ? e.statusCode : 500;
    if (!res.headersSent) res.status(st).json({ error: st === 500 ? "Erreur serveur" : "Requête invalide" });
  }
};
