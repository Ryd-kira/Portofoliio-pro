const $ = (i) => document.getElementById(i);
let CSRF = ""; // jeton CSRF gardé en mémoire seulement
const api = (p, o = {}) => {
  const m = String(o.method || "GET").toUpperCase();
  const headers = { ...(o.headers || {}) };
  if (m !== "GET" && m !== "HEAD") headers["X-CSRF-Token"] = CSRF;
  return fetch("/api/" + p, { credentials: "same-origin", ...o, headers });
};
const J = { "Content-Type": "application/json" };
const BIN = { "Content-Type": "application/octet-stream" };
let mt;
const say = (t) => { $("msg").textContent = t; clearTimeout(mt); if (t) mt = setTimeout(() => { $("msg").textContent = ""; }, 7000); };
// Tout est construit avec des propriétés DOM (jamais de HTML brut) : le contenu reçu reste du texte.
const h = (tag, props = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) { if (k in e) e[k] = v; else e.setAttribute(k, v); }
  e.append(...kids);
  return e;
};
const TABS = [["projects", "Projets"], ["skills", "Compétences"], ["experiences", "Parcours"], ["collaborators", "Collaborateurs"], ["settings", "Textes"], ["files", "Fichiers"], ["messages", "Messages"], ["security", "Sécurité"]];
let META, TAB = "projects", edit = null;

async function start() {
  const s = await api("login");
  if (s.status !== 200) { $("lf").hidden = false; $("app").hidden = true; return; }
  CSRF = (await s.json()).csrf;
  const r = await api("admin?r=meta");
  META = await r.json();
  $("lf").hidden = true; $("app").hidden = false;
  const st = await (await api("admin?r=settings")).json();
  $("seed").hidden = !!st.seeded;
  tabs(); show();
}
function tabs() {
  $("tabs").replaceChildren(...TABS.map(([k, l]) => h("button", { type: "button", "aria-pressed": String(k === TAB), onclick: () => { TAB = k; edit = null; say(""); tabs(); show(); } }, l)));
}
function show() {
  if (["projects", "skills", "experiences", "collaborators"].includes(TAB)) return list(TAB);
  if (TAB === "settings") return settings();
  if (TAB === "files") return files();
  if (TAB === "security") return security();
  return messages();
}

async function list(res) {
  const R = META.resources[res], p = $("panel");
  p.replaceChildren();
  if (edit !== null) { p.append(form(res, edit)); return; }
  const rows = await (await api("admin?r=" + res)).json();
  p.append(h("button", { type: "button", onclick: () => { edit = {}; show(); } }, "Ajouter"));
  if (!rows.length) p.append(h("p", { className: "mut" }, "Aucun élément."));
  rows.forEach((row) => p.append(h("article", {},
    h("h3", {}, [].concat(R.title).map((k) => row[k]).join(" ") + (row.published ? "" : " (masqué)")),
    h("button", { type: "button", onclick: () => { edit = row; show(); } }, "Modifier"),
    confirmBtn("Supprimer", async () => { const r = await api(`admin?r=${res}&id=${row.id}`, { method: "DELETE" }); say(r.ok ? "Supprimé." : "Suppression impossible."); show(); }))));
}
function confirmBtn(label, action) {
  const b = h("button", { type: "button" }, label);
  let armed = 0;
  b.onclick = () => {
    if (!armed) { armed = 1; b.textContent = "Confirmer"; setTimeout(() => { armed = 0; b.textContent = label; }, 4000); return; }
    armed = 0; b.textContent = label; action();
  };
  return b;
}
function form(res, row) {
  const R = META.resources[res], f = h("form");
  R.fields.forEach((fd) => {
    const v = row[fd.name];
    let inp;
    if (fd.type === "textarea" || fd.type === "lines") inp = h("textarea", { name: fd.name, rows: fd.type === "lines" ? 5 : 4, value: fd.type === "lines" ? (v || []).join("\n") : (v || "") });
    else if (fd.type === "select") { inp = h("select", { name: fd.name }); fd.options.forEach(([k, l]) => inp.append(h("option", { value: k, selected: k === v }, l))); }
    else if (fd.type === "bool") inp = h("input", { type: "checkbox", name: fd.name, checked: row.id ? !!v : fd.name === "published" });
    else inp = h("input", { type: fd.type === "int" ? "number" : "text", name: fd.name, value: v ?? (fd.type === "int" ? 0 : ""), placeholder: fd.type === "url" ? "https://" : "" });
    f.append(h("label", {}, fd.type === "bool" ? "" : fd.label, inp, fd.type === "bool" ? fd.label : ""));
  });
  f.onsubmit = async (e) => {
    e.preventDefault();
    const body = {};
    R.fields.forEach((fd) => { const el = f.elements[fd.name]; body[fd.name] = fd.type === "bool" ? el.checked : fd.type === "int" ? Number(el.value) : el.value; });
    const r = await api(row.id ? `admin?r=${res}&id=${row.id}` : `admin?r=${res}`, { method: row.id ? "PUT" : "POST", headers: J, body: JSON.stringify(body) });
    if (r.ok) {
      if (res === "collaborators" && !row.id) {
        const j = await r.json();
        const file = f.elements.photo_file && f.elements.photo_file.files[0];
        let ph = false;
        if (file) { try { ph = (await api("collab-photo?id=" + j.id, { method: "PUT", headers: BIN, body: await toJpeg(file, 600) })).ok; } catch (_) {} }
        edit = { ...body, id: j.id, has_photo: ph };
        say(file && !ph ? "Collaborateur enregistré, mais la photo n’a pas pu être ajoutée : réessaie ci-dessous." : "Enregistré.");
      }
      else { edit = null; say("Enregistré."); }
      show();
    } else { const j = await r.json().catch(() => ({})); say(j.error || "Enregistrement impossible."); }
  };
  if (res === "collaborators" && row.id) f.append(collabPhoto(row));
  else if (res === "collaborators") f.append(h("label", {}, "Photo (facultative, ajoutée à l’enregistrement)", h("input", { type: "file", name: "photo_file", accept: "image/jpeg,image/png,image/webp" })));
  f.append(h("button", { type: "submit" }, "Enregistrer"), h("button", { type: "button", onclick: () => { edit = null; show(); } }, "Annuler"));
  return f;
}

async function toJpeg(f, max) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(f.type) || f.size > 8e6) throw new Error("format");
  const bm = await createImageBitmap(f, { imageOrientation: "from-image" });
  const k = Math.min(1, max / Math.max(bm.width, bm.height)), c = document.createElement("canvas");
  c.width = Math.round(bm.width * k); c.height = Math.round(bm.height * k);
  c.getContext("2d").drawImage(bm, 0, 0, c.width, c.height);
  return new Promise((r) => c.toBlob(r, "image/jpeg", 0.86));
}
function collabPhoto(row) {
  const s = h("section", {}, h("h3", {}, "Photo (enregistre d’abord les champs ci-dessus)"));
  if (row.has_photo) s.append(h("img", { src: `/api/collab-photo?id=${row.id}&v=${Date.now()}`, alt: "Photo actuelle", width: 120 }));
  s.append(h("input", { type: "file", accept: "image/jpeg,image/png,image/webp", onchange: async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const b = await toJpeg(f, 600);
      const r = await api("collab-photo?id=" + row.id, { method: "PUT", headers: BIN, body: b });
      say(r.ok ? "Photo enregistrée." : "Échec de l’enregistrement (500 Ko maximum).");
      if (r.ok) { row.has_photo = true; edit = row; show(); }
    } catch (_) { say("Image illisible (JPEG, PNG ou WebP, 8 Mo maximum)."); }
  } }));
  if (row.has_photo) s.append(confirmBtn("Supprimer la photo", async () => {
    await api("collab-photo?id=" + row.id, { method: "DELETE" });
    row.has_photo = false; edit = row; say("Photo supprimée."); show();
  }));
  return s;
}

async function settings() {
  const v = await (await api("admin?r=settings")).json(), p = $("panel"), f = h("form");
  p.replaceChildren();
  META.settings.forEach(([k, l, t]) => f.append(h("label", {}, l, t === "textarea" ? h("textarea", { name: k, rows: 4, value: v[k] || "" }) : h("input", { name: k, type: "text", value: v[k] || "" }))));
  f.append(h("p", { className: "mut" }, "Un champ vide rétablit le texte par défaut du site."), h("button", { type: "submit" }, "Enregistrer"));
  f.onsubmit = async (e) => {
    e.preventDefault();
    const values = {};
    META.settings.forEach(([k]) => { values[k] = f.elements[k].value; });
    const r = await api("admin?r=settings", { method: "PUT", headers: J, body: JSON.stringify({ values }) });
    say(r.ok ? "Enregistré." : "Enregistrement impossible.");
  };
  p.append(f);
}

async function files() {
  const p = $("panel");
  p.replaceChildren();
  const delFile = (k) => confirmBtn("Supprimer", async () => { await api(k, { method: "DELETE" }); say("Supprimé."); files(); });
  const cv = await api("cv", { method: "HEAD" });
  const s1 = h("section", {}, h("h2", {}, "CV (PDF)"), h("p", {}, cv.ok ? "Un CV est en ligne." : "Aucun CV en ligne."));
  s1.append(h("input", { type: "file", accept: "application/pdf", onchange: async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = await api("cv", { method: "PUT", headers: BIN, body: f });
    say(r.ok ? "CV enregistré." : "Échec : un PDF de 4 Mo maximum est requis.");
    files();
  } }));
  if (cv.ok) s1.append(delFile("cv"));
  const ph = await api("photo", { method: "HEAD" });
  const s2 = h("section", {}, h("h2", {}, "Photo"));
  if (ph.ok) s2.append(h("img", { src: "/api/photo?v=" + Date.now(), alt: "Photo actuelle", width: 160 }));
  else s2.append(h("p", {}, "Aucune photo en ligne."));
  s2.append(h("input", { type: "file", accept: "image/jpeg,image/png,image/webp", onchange: upPhoto }));
  if (ph.ok) s2.append(delFile("photo"));
  p.append(s1, s2);
}
async function upPhoto(e) {
  const f = e.target.files[0];
  if (!f) return;
  if (!["image/jpeg", "image/png", "image/webp"].includes(f.type) || f.size > 8e6) { say("Image JPEG, PNG ou WebP de 8 Mo maximum."); return; }
  try {
    const bm = await createImageBitmap(f, { imageOrientation: "from-image" });
    const k = Math.min(1, 900 / Math.max(bm.width, bm.height)), c = document.createElement("canvas");
    c.width = Math.round(bm.width * k); c.height = Math.round(bm.height * k);
    c.getContext("2d").drawImage(bm, 0, 0, c.width, c.height);
    const b = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.86));
    const r = await api("photo", { method: "PUT", headers: BIN, body: b });
    say(r.ok ? "Photo enregistrée." : "Échec de l’enregistrement.");
    files();
  } catch (_) { say("Image illisible."); }
}

async function security() {
  const p = $("panel");
  p.replaceChildren();
  const r = await api("admin?r=security");
  if (!r.ok) { say("Journal indisponible."); return; }
  const s = await r.json();
  if (s.legacyPassword) p.append(h("p", {}, "Attention : le mot de passe est encore stocké en clair dans Vercel (ADMIN_PASSWORD). Génère un hachage avec /hash.html et place-le dans ADMIN_PASSWORD_HASH."));
  p.append(h("p", {}, "Sessions ouvertes : " + s.sessions));
  p.append(confirmBtn("Déconnecter toutes les sessions", async () => { await api("admin?r=sessions", { method: "DELETE" }); start(); }));
  p.append(h("h2", {}, "Dernières 24 heures"));
  if (!s.counts.length) p.append(h("p", { className: "mut" }, "Aucun événement."));
  s.counts.forEach((c) => p.append(h("p", {}, c.kind + " : " + c.n)));
  p.append(h("h2", {}, "Journal (100 derniers événements)"));
  s.events.forEach((e) => p.append(h("p", { className: "mut" }, new Date(e.at).toLocaleString("fr-FR") + ", " + e.kind + ", " + (e.ip || "-") + (e.path ? ", " + e.path : "") + (e.detail ? ", " + e.detail : ""))));
}

async function messages() {
  const p = $("panel");
  p.replaceChildren();
  const rows = await (await api("messages")).json();
  if (!rows.length) p.append(h("p", { className: "mut" }, "Aucun message."));
  rows.forEach((m) => {
    const a = h("article", {}, h("h3", {}, m.name + " (" + m.email + ")"), h("p", {}, m.message),
      h("small", {}, new Date(m.created_at).toLocaleString("fr-FR") + ", " + (m.status === "new" ? "nouveau" : "lu")), h("br"));
    [["read", "Marquer lu"], ["archived", "Archiver"]].forEach(([st, l]) => a.append(h("button", { type: "button", onclick: async () => {
      await api("messages", { method: "PATCH", headers: J, body: JSON.stringify({ id: m.id, status: st }) });
      messages();
    } }, l)));
    p.append(a);
  });
}

$("lf").onsubmit = async (e) => {
  e.preventDefault();
  $("le").textContent = "";
  const r = await api("login", { method: "POST", headers: J, body: JSON.stringify({ password: $("pw").value }) });
  $("pw").value = "";
  if (r.ok) { CSRF = (await r.json()).csrf; start(); }
  else $("le").textContent = r.status === 429 ? "Trop de tentatives. Réessaie dans quelques minutes." : "Mot de passe incorrect.";
};
$("out").onclick = async () => { await api("login", { method: "DELETE" }); start(); };
$("seedb").onclick = async () => {
  const r = await api("admin?r=seed", { method: "POST" });
  say(r.ok ? "Contenu importé." : "Import impossible (déjà fait ?).");
  start();
};
start();
