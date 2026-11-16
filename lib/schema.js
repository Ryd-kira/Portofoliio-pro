// Source unique de vérité pour le contenu modifiable : sert à valider côté serveur
// et à construire les formulaires de /admin.html.
export const STATUS = [
  ["realise", "Réalisé / terminé"],
  ["prototype", "Prototype fonctionnel"],
  ["en_developpement", "En développement"],
  ["conception", "Conception / cadrage"],
  ["concept", "Concept / idée"],
];

const f = (name, label, type, extra = {}) => ({ name, label, type, ...extra });
const position = f("position", "Ordre d’affichage (petit nombre = en premier)", "int", { min: 0, max: 9999 });
const published = f("published", "Visible sur le site", "bool");

export const RESOURCES = {
  projects: {
    label: "Projets",
    table: "projects",
    title: "name",
    order: "position, created_at",
    fields: [
      f("name", "Nom du projet", "text", { max: 120, required: true }),
      f("category", "Catégorie", "text", { max: 80, required: true }),
      f("status", "État d’avancement", "select", { options: STATUS, required: true }),
      f("summary", "Résumé", "textarea", { max: 600, required: true }),
      f("details", "Détails (un paragraphe par ligne, 6 au maximum)", "lines", { max: 600, items: 6 }),
      f("technologies", "Technologies réellement utilisées", "text", { max: 200 }),
      f("confirmed", "État confirmé (retire la mention « à confirmer »)", "bool"),
      position,
      published,
    ],
  },
  skills: {
    label: "Compétences",
    table: "skills",
    title: "name",
    order: "position, created_at",
    fields: [
      f("group_name", "Groupe (ex. Cybersécurité)", "text", { max: 80, required: true }),
      f("name", "Compétence ou outil", "text", { max: 80, required: true }),
      f("level", "Niveau réel (sans pourcentage)", "text", { max: 80, required: true }),
      f("to_clarify", "Niveau à préciser (affiche la mention)", "bool"),
      position,
      published,
    ],
  },
  experiences: {
    label: "Parcours",
    table: "experiences",
    title: "title",
    order: "position, created_at",
    fields: [
      f("label", "Repère à gauche (date, statut)", "text", { max: 80, required: true }),
      f("title", "Titre", "text", { max: 160, required: true }),
      f("description", "Description (retour à la ligne autorisé)", "textarea", { max: 600 }),
      f("note", "Mention affichée à côté du titre (ex. à confirmer)", "text", { max: 60 }),
      position,
      published,
    ],
  },
  collaborators: {
    label: "Collaborateurs",
    table: "collaborators",
    title: ["first_name", "last_name"],
    order: "position, created_at",
    list: "SELECT c.*, (p.collaborator_id IS NOT NULL) AS has_photo FROM collaborators c LEFT JOIN collaborator_photos p ON p.collaborator_id = c.id ORDER BY c.position, c.created_at",
    fields: [
      f("first_name", "Prénom", "text", { max: 60, required: true }),
      f("last_name", "Nom", "text", { max: 60, required: true }),
      f("linkedin_url", "Lien LinkedIn", "url", { max: 300, host: "linkedin.com" }),
      f("portfolio_url", "Lien portfolio", "url", { max: 300 }),
      f("github_url", "Lien GitHub", "url", { max: 300, host: "github.com" }),
      position,
      published,
    ],
  },
};

// [clé, libellé, type, longueur max]
export const SETTINGS = [
  ["hero_lead", "Phrase d’accroche de l’accueil", "textarea", 400],
  ["signature", "Ligne sous le titre", "text", 160],
  ["location", "Localisation", "text", 80],
  ["about", "À propos (séparer les paragraphes par une ligne vide)", "textarea", 1500],
  ["interests", "Centres d’intérêt", "textarea", 600],
  ["motto", "Devise", "text", 80],
];

export function clean(name, body) {
  const out = {};
  const errors = [];
  for (const fd of RESOURCES[name].fields) {
    const v = body[fd.name];
    if (fd.type === "bool") { out[fd.name] = v === true; continue; }
    if (fd.type === "int") {
      const n = Number(v ?? 0);
      if (!Number.isInteger(n) || n < fd.min || n > fd.max) errors.push(fd.label); else out[fd.name] = n;
      continue;
    }
    if (fd.type === "lines") {
      const arr = (Array.isArray(v) ? v : String(v || "").split("\n")).map((s) => String(s).trim()).filter(Boolean);
      if (arr.length > fd.items || arr.some((s) => s.length > fd.max)) errors.push(fd.label); else out[fd.name] = arr;
      continue;
    }
    if (fd.type === "url") {
      // Seuls les liens https:// sont acceptés (jamais javascript: ni http:).
      let s = String(v ?? "").trim();
      if (!s) { out[fd.name] = null; continue; }
      if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = "https://" + s;
      let u;
      try { u = new URL(s); } catch { errors.push(fd.label); continue; }
      const hostOk = !fd.host || u.hostname === fd.host || u.hostname.endsWith("." + fd.host);
      if (u.protocol !== "https:" || !hostOk || /\s/.test(s) || u.href.length > fd.max) errors.push(fd.label); else out[fd.name] = u.href;
      continue;
    }
    const s = String(v ?? "").trim();
    if (!s) { if (fd.required) errors.push(fd.label); else out[fd.name] = null; continue; }
    if (fd.max && s.length > fd.max) { errors.push(fd.label); continue; }
    if (fd.type === "select" && !fd.options.some(([k]) => k === s)) { errors.push(fd.label); continue; }
    out[fd.name] = s;
  }
  return { out, errors };
}
