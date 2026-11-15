import { neon } from "@neondatabase/serverless";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const sql = neon(process.env.DATABASE_URL);

const TTL = 12 * 3600;
const sign = (payload) =>
  createHmac("sha256", process.env.SESSION_SECRET).update(payload).digest("base64url");

export function makeSession() {
  const exp = String(Math.floor(Date.now() / 1000) + TTL);
  return `${exp}.${sign(exp)}`;
}

export function isAdmin(req) {
  const match = /(?:^|;\s*)adm=([^;]+)/.exec(req.headers.cookie || "");
  if (!match) return false;
  const [exp, sig] = match[1].split(".");
  if (!exp || !sig) return false;
  const expected = Buffer.from(sign(exp));
  const given = Buffer.from(sig);
  return (
    expected.length === given.length &&
    timingSafeEqual(expected, given) &&
    Number(exp) > Date.now() / 1000
  );
}

export const sessionCookie = (value, maxAge) =>
  `adm=${value}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;

export function passwordOk(candidate) {
  const hash = (v) => createHash("sha256").update(String(v)).digest();
  return timingSafeEqual(hash(candidate), hash(process.env.ADMIN_PASSWORD));
}

// Les écritures doivent venir de notre propre site (en-tête Origin obligatoire).
export function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}
