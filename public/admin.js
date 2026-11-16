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
const NAV = [["Général", [["home", "Tableau de bord"]]], ["Contenu", [["projects", "Projets"], ["skills", "Compétences"], ["experiences", "Parcours"], ["collaborators", "Collaborateurs"], ["settings", "Textes"]]], ["Médias", [["files", "Photo et CV"]]], ["Échanges", [["messages", "Messages"]]], ["Protection", [["security", "Sécurité"]]]];
const TITLES = Object.fromEntries(NAV.flatMap(([, l]) => l));
let META, TAB = "home", edit = null, Q = "", unread = 0;

async function start() {
  const s = await api("login");
  if (s.status !== 200) { $("lf").hidden = false; $("app").hidden = true; return; }
  CSRF = (await s.json()).csrf;
  META = await (await api("admin?r=meta")).json();
  $("lf").hidden = true; $("app").hidden = false;
  const st = await (await api("admin?r=settings")).json();
  $("seed").hidden = !!st.seeded;
  await badge(); nav(); show();
}
async function badge() { const m = await (await api("messages")).json(); unread = m.filter((x) => x.status === "new").length; }
function go(tab, newItem = false) { TAB = tab; edit = newItem ? {} : null; Q = ""; $("side").classList.remove("open"); say(""); nav(); show(); }
function nav() {
  $("nav").replaceChildren(...NAV.flatMap(([g, items]) => [h("div", { className: "grp" }, g),
    ...items.map(([k, l]) => h("button", { type: "button", className: "nv", onclick: () => go(k), ...(k === TAB ? { "aria-current": "page" } : {}) }, l, k === "messages" && unread ? h("span", { className: "tag warn" }, String(unread)) : ""))]));
}
function show() {
  $("ptitle").textContent = TITLES[TAB];
  $("panel").replaceChildren();
  if (["projects", "skills", "experiences", "collaborators"].includes(TAB)) return list(TAB);
  return ({ home, settings, files, messages, security })[TAB]();
}
function confirmBtn(label, action, cls = "dng") {
  const b = h("button", { type: "button", className: cls }, label);
  let armed = 0;
  b.onclick = () => {
    if (!armed) { armed = 1; b.textContent = "Confirmer ?"; setTimeout(() => { armed = 0; b.textContent = label; }, 4000); return; }
    armed = 0; b.textContent = label; action();
  };
  return b;
}

async function home() {
  const p = $("panel");
  const lists = await Promise.all(["projects", "skills", "experiences", "collaborators"].map((r) => api("admin?r=" + r).then((x) => x.json())));
  const [sec, cv, ph] = await Promise.all([api("admin?r=security").then((x) => x.json()), api("cv", { method: "HEAD" }), api("photo", { method: "HEAD" })]);
  const stat = (n, l, t) => h("button", { type: "button", className: "stat", onclick: () => go(t) }, h("b", {}, String(n)), l);
  p.append(h("div", { className: "cards" }, stat(lists[0].length, "Projets", "projects"), stat(lists[1].length, "Compétences", "skills"), stat(lists[2].length, "Parcours", "experiences"), stat(lists[3].length, "Collaborateurs", "collaborators"), stat(unread, "Messages non lus", "messages")));
  const risky = sec.counts.filter((c) => ["login_echec", "login_bloque", "csrf_refuse", "origine_refusee", "upload_refuse"].includes(c.kind)).reduce((a, c) => a + c.n, 0);
  const todo = [["Photo de profil en ligne", ph.ok, "files"], ["CV en ligne", cv.ok, "files"], ["Mot de passe haché (ADMIN_PASSWORD_HASH)", !sec.legacyPassword, "security"], ["Aucun message à lire", unread === 0, "messages"], ["Aucun événement suspect en 24 h (" + risky + ")", risky === 0, "security"]];
  const box = h("section", { className: "box" }, h("h2", {}, "À vérifier"));
  todo.forEach(([l, ok, t]) => box.append(h("div", { className: "item" }, h("div", { className: "t" }, l), h("span", { className: "tag " + (ok ? "ok" : "warn") }, ok ? "OK" : "À faire"), h("button", { type: "button", onclick: () => go(t) }, "Ouvrir"))));
  const quick = h("section", { className: "box" }, h("h2", {}, "Actions rapides"),
    h("button", { type: "button", className: "pri", onclick: () => go("projects", true) }, "Ajouter un projet"), " ",
    h("button", { type: "button", onclick: () => go("collaborators", true) }, "Ajouter un collaborateur"), " ",
    h("button", { type: "button", onclick: () => go("files") }, "Changer la photo ou le CV"));
  p.append(box, quick);
}

async function list(res) {
  const R = META.resources[res], p = $("panel");
  if (edit !== null) { p.append(form(res, edit)); return; }
  const rows = await (await api("admin?r=" + res)).json();
  const sOpts = Object.fromEntries(((R.fields.find((f) => f.name === "status") || {}).options || []));
  const title = (r) => [].concat(R.title).map((k) => r[k]).join(" ");
  const meta = (r) => res === "projects" ? [r.category, sOpts[r.status]].join(", ") : res === "skills" ? [r.group_name, r.level].join(", ") : res === "experiences" ? r.label : [r.linkedin_url ? "LinkedIn" : "", r.github_url ? "GitHub" : "", r.portfolio_url ? "Portfolio" : "", r.has_photo ? "photo" : "sans photo"].filter(Boolean).join(", ");
  const tools = h("div", { className: "tools" }, h("button", { type: "button", className: "pri", onclick: () => { edit = {}; show(); } }, "Ajouter"));
  const box = h("section", { className: "box" });
  const draw = () => {
    box.replaceChildren();
    const q = Q.toLowerCase(), shown = rows.filter((r) => !q || title(r).toLowerCase().includes(q) || meta(r).toLowerCase().includes(q));
    if (!shown.length) { box.append(h("p", { className: "mut" }, rows.length ? "Aucun résultat." : "Aucun élément pour le moment.")); return; }
    shown.forEach((row) => box.append(h("div", { className: "item" },
      h("div", { className: "t" }, h("strong", {}, title(row)), h("br"), h("small", {}, meta(row))),
      h("span", { className: "tag " + (row.published ? "ok" : "warn") }, row.published ? "Visible" : "Masqué"),
      h("button", { type: "button", onclick: () => { edit = row; show(); } }, "Modifier"),
      confirmBtn("Supprimer", async () => { const r = await api(`admin?r=${res}&id=${row.id}`, { method: "DELETE" }); say(r.ok ? "Supprimé." : "Suppression impossible."); show(); }))));
  };
  if (rows.length > 5) tools.append(h("input", { type: "search", placeholder: "Rechercher", "aria-label": "Rechercher", value: Q, oninput: (e) => { Q = e.target.value; draw(); } }));
  p.append(tools, box); draw();
}

function form(res, row) {
  const R = META.resources[res], f = h("form", { className: "box" });
  f.append(h("h2", {}, row.id ? "Modifier" : "Nouvel élément"));
  R.fields.forEach((fd) => {
    const v = row[fd.name];
    let inp;
    if (fd.type === "textarea" || fd.type === "lines") inp = h("textarea", { name: fd.name, rows: fd.type === "lines" ? 5 : 4, value: fd.type === "lines" ? (v || []).join("\n") : (v || "") });
    else if (fd.type === "select") { inp = h("select", { name: fd.name }); fd.options.forEach(([k, l]) => inp.append(h("option", { value: k, selected: k === v }, l))); }
    else if (fd.type === "bool") inp = h("input", { type: "checkbox", name: fd.name, checked: row.id ? !!v : fd.name === "published" });
    else inp = h("input", { type: fd.type === "int" ? "number" : "text", name: fd.name, value: v ?? (fd.type === "int" ? 0 : ""), placeholder: fd.type === "url" ? "https://" : "" });
    f.append(h("label", {}, fd.type === "bool" ? "" : fd.label, inp, fd.type === "bool" ? fd.label : ""));
  });
  if (res === "collaborators" && row.id) f.append(collabPhoto(row));
  else if (res === "collaborators") f.append(h("label", {}, "Photo (facultative, ajoutée à l’enregistrement)", h("input", { type: "file", name: "photo_file", accept: "image/jpeg,image/png,image/webp" })));
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
      } else { edit = null; say("Enregistré."); }
      show();
    } else { const j = await r.json().catch(() => ({})); say(j.error || "Enregistrement impossible."); }
  };
  f.append(h("div", { className: "bar" }, h("button", { type: "submit", className: "pri" }, "Enregistrer"), h("button", { type: "button", onclick: () => { edit = null; show(); } }, "Annuler")));
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
  const s = h("div", {}, h("h3", {}, "Photo (enregistre d’abord les champs ci-dessus)"));
  if (row.has_photo) s.append(h("img", { className: "pv", src: `/api/collab-photo?id=${row.id}&v=${Date.now()}`, alt: "Photo actuelle", width: 120 }));
  s.append(h("input", { type: "file", accept: "image/jpeg,image/png,image/webp", onchange: async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const r = await api("collab-photo?id=" + row.id, { method: "PUT", headers: BIN, body: await toJpeg(f, 600) });
      say(r.ok ? "Photo enregistrée." : "Échec de l’enregistrement (500 Ko maximum).");
      if (r.ok) { row.has_photo = true; edit = row; show(); }
    } catch (_) { say("Image illisible (JPEG, PNG ou WebP, 8 Mo maximum)."); }
  } }));
  if (row.has_photo) s.append(" ", confirmBtn("Supprimer la photo", async () => { await api("collab-photo?id=" + row.id, { method: "DELETE" }); row.has_photo = false; edit = row; say("Photo supprimée."); show(); }));
  return s;
}

async function settings() {
  const v = await (await api("admin?r=settings")).json(), f = h("form", { className: "box" });
  META.settings.forEach(([k, l, t, max]) => f.append(h("label", {}, l + " (" + max + " caractères maximum)", t === "textarea" ? h("textarea", { name: k, rows: 4, maxLength: max, value: v[k] || "" }) : h("input", { name: k, type: "text", maxLength: max, value: v[k] || "" }))));
  f.append(h("p", { className: "mut" }, "Un champ vide rétablit le texte par défaut du site."), h("div", { className: "bar" }, h("button", { type: "submit", className: "pri" }, "Enregistrer")));
  f.onsubmit = async (e) => {
    e.preventDefault();
    const values = {};
    META.settings.forEach(([k]) => { values[k] = f.elements[k].value; });
    const r = await api("admin?r=settings", { method: "PUT", headers: J, body: JSON.stringify({ values }) });
    say(r.ok ? "Enregistré." : "Enregistrement impossible.");
  };
  $("panel").append(f);
}

async function files() {
  const p = $("panel");
  const del = (k) => confirmBtn("Supprimer", async () => { await api(k, { method: "DELETE" }); say("Supprimé."); show(); });
  const cv = await api("cv", { method: "HEAD" }), ph = await api("photo", { method: "HEAD" });
  const s1 = h("section", { className: "box" }, h("h2", {}, "Photo de profil"));
  if (ph.ok) s1.append(h("img", { className: "pv", src: "/api/photo?v=" + Date.now(), alt: "Photo actuelle", width: 160 }));
  else s1.append(h("p", { className: "mut" }, "Aucune photo en ligne."));
  s1.append(h("input", { type: "file", accept: "image/jpeg,image/png,image/webp", onchange: async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try { const r = await api("photo", { method: "PUT", headers: BIN, body: await toJpeg(f, 900) }); say(r.ok ? "Photo enregistrée." : "Échec de l’enregistrement."); show(); } catch (_) { say("Image illisible (JPEG, PNG ou WebP, 8 Mo maximum)."); }
  } }));
  if (ph.ok) s1.append(" ", del("photo"));
  const s2 = h("section", { className: "box" }, h("h2", {}, "CV (PDF)"), h("p", { className: cv.ok ? "" : "mut" }, cv.ok ? "Un CV est en ligne, le bouton du site le télécharge." : "Aucun CV en ligne."));
  s2.append(h("input", { type: "file", accept: "application/pdf", onchange: async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = await api("cv", { method: "PUT", headers: BIN, body: f });
    say(r.ok ? "CV enregistré." : "Échec : un PDF de 4 Mo maximum est requis.");
    show();
  } }));
  if (cv.ok) s2.append(" ", del("cv"));
  p.append(s1, s2);
}

async function messages() {
  const p = $("panel"), rows = await (await api("messages")).json();
  if (!rows.length) p.append(h("p", { className: "mut" }, "Aucun message."));
  rows.forEach((m) => {
    const a = h("article", { className: "box" }, h("div", { className: "item" }, h("div", { className: "t" }, h("strong", {}, m.name), h("br"), h("small", {}, m.email + ", " + new Date(m.created_at).toLocaleString("fr-FR"))), h("span", { className: "tag " + (m.status === "new" ? "warn" : "ok") }, m.status === "new" ? "Nouveau" : "Lu")), h("p", {}, m.message));
    a.append(h("a", { className: "btn", href: "mailto:" + encodeURIComponent(m.email) }, "Répondre"), " ");
    [["read", "Marquer lu"], ["archived", "Archiver"]].forEach(([st, l]) => a.append(h("button", { type: "button", onclick: async () => {
      await api("messages", { method: "PATCH", headers: J, body: JSON.stringify({ id: m.id, status: st }) });
      await badge(); nav(); show();
    } }, l), " "));
    p.append(a);
  });
}

async function security() {
  const p = $("panel"), r = await api("admin?r=security");
  if (!r.ok) { say("Journal indisponible."); return; }
  const s = await r.json();
  if (s.legacyPassword) p.append(h("div", { className: "box" }, h("span", { className: "tag warn" }, "Attention"), " Le mot de passe est encore stocké en clair dans Vercel (ADMIN_PASSWORD). Génère un hachage avec /hash.html et place-le dans ADMIN_PASSWORD_HASH."));
  p.append(h("div", { className: "cards" }, h("div", { className: "stat box" }, h("b", {}, String(s.sessions)), "Sessions ouvertes"), ...s.counts.map((c) => h("div", { className: "stat box" }, h("b", {}, String(c.n)), c.kind + " (24 h)"))));
  p.append(h("div", { className: "tools" }, confirmBtn("Déconnecter toutes les sessions", async () => { await api("admin?r=sessions", { method: "DELETE" }); start(); })));
  const box = h("section", { className: "box" }, h("h2", {}, "Journal (100 derniers événements)"));
  if (!s.events.length) box.append(h("p", { className: "mut" }, "Aucun événement."));
  s.events.forEach((e) => box.append(h("div", { className: "item" }, h("small", {}, new Date(e.at).toLocaleString("fr-FR")), h("span", { className: "tag" }, e.kind), h("small", { className: "t" }, (e.ip || "-") + (e.path ? ", " + e.path : "") + (e.detail ? ", " + e.detail : "")))));
  p.append(box);
}

$("lf").onsubmit = async (e) => {
  e.preventDefault();
  $("le").textContent = "";
  const r = await api("login", { method: "POST", headers: J, body: JSON.stringify({ password: $("pw").value }) });
  $("pw").value = "";
  if (r.ok) { CSRF = (await r.json()).csrf; start(); }
  else $("le").textContent = r.status === 429 ? "Trop de tentatives. Réessaie dans quelques minutes." : "Mot de passe incorrect.";
};
$("out").onclick = async () => { await api("login", { method: "DELETE" }); TAB = "home"; start(); };
$("burger").onclick = () => $("side").classList.toggle("open");
$("seedb").onclick = async () => {
  const r = await api("admin?r=seed", { method: "POST" });
  say(r.ok ? "Contenu importé." : "Import impossible (déjà fait ?).");
  start();
};
start();
