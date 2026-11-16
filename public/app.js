/* CONFIG : api = préfixe des fonctions serveur (Vercel + Neon). Le CV et la photo sont servis par /api/cv et /api/photo. */
const CFG={cv:"",api:"/api"};
/* CONTENU PAR DÉFAUT : affiché tant que la base est vide ou indisponible. Le contenu réel se modifie dans /admin.html. */
const S=["Réalisé / terminé","Prototype fonctionnel","En développement","Conception / cadrage","Concept / idée"];
const COL=["#35c6d4","#4f8cff","#4f8cff","#7d8aa0","#4a5565"];
const C1="Cybersécurité et infrastructures",C2="Développement et plateformes",C3="E-commerce et entrepreneuriat",C4="IA, automatisation et IoT";
const SK=[
["Réseaux et systèmes",[["Réseaux informatiques","Bases à intermédiaire",1],["Linux (Kali, Ubuntu)","Débutant à intermédiaire",1],["VirtualBox","Pratique en laboratoire"],["Cisco Packet Tracer","Pratique et apprentissage"],["Wireshark","Notions pratiques"]]],
["Cybersécurité",[["Wazuh","Pratique dans le cadre du mémoire"],["Suricata","Pratique dans le cadre du mémoire"],["Nmap","Notions pratiques"],["Burp Suite","Initiation"]]],
["Développement et données",[["HTML / CSS","Bases"],["JavaScript","En apprentissage"],["Python","Débutant"],["MySQL / PostgreSQL","Notions",1]]],
["IA et automatisation",[["IA générative / LLM","Utilisation pratique",1],["n8n","Exploration"]]]
];
const PROJ=[
{n:"Architecture IDS/IPS multicouche (SOC Lab)",c:C1,s:0,ok:1,r:"Projet de mémoire de licence, mené sous la forme d’un laboratoire SOC : conception et mise en œuvre d’une architecture de détection et de prévention d’attaques au niveau réseau, réalisé en binôme avec Gilles Tokpanou.",d:["Laboratoire virtualisé, Wazuh pour la supervision et la centralisation des événements, Suricata pour la détection et la prévention réseau, configuration et supervision d’agents, analyse des alertes, scénarios de sécurité réseau.","Le périmètre mis en œuvre est centré sur la partie réseau avec Wazuh et Suricata."],t:"VirtualBox, Wazuh, Suricata"},
{n:"Détection des menaces internes par apprentissage automatique",c:C1,s:2,r:"Recherche sur la détection précoce et explicable des menaces internes en entreprise, à partir du CERT Insider Threat Dataset (données synthétiques).",d:["Objectif : repérer les comportements anormaux tout en réduisant les fausses alertes et en expliquant pourquoi une activité est jugée suspecte. Méthodes envisagées : Isolation Forest, Random Forest, XGBoost."]},
{n:"Kira Tech et Solution",c:C3,s:3,r:"Site vitrine et catalogue pour une activité de vente de matériel informatique (portables, fixes, gaming) et de services de maintenance et de réparation, basée à Cotonou et Calavi, au Bénin.",d:["Fonctionnalités prévues : catalogue avec filtres (RAM, stockage, usage, performances, budget), fiche détaillée par ordinateur, bouton d’achat vers WhatsApp, contact, administration pour gérer les produits sans toucher au code."]},
{n:"OneBénin",c:C2,s:3,r:"« Mon pays en un seul endroit » : plateforme de services numériques centrée sur le Bénin, à l’architecture modulaire.",d:["Modules envisagés : immobilier, restauration, transport, éducation, tourisme, marketplace, santé, services. Développement progressif, avec une documentation produit et technique."]},
{n:"OCD Live",c:C2,s:3,r:"Plateforme de prestations et de réservations de livestreams.",d:["Éléments évoqués : réservation et gestion de sessions, formules et durées variables, abonnement mensuel sans engagement, extraits payants."]},
{n:"Plateforme d’orientation scolaire",c:C2,s:3,r:"Plateforme d’orientation pour les élèves de la 4e à la terminale au Bénin.",d:["Idées : exploiter les résultats scolaires, recueillir les intérêts et métiers envisagés, proposer des filières adaptées, construire un référentiel d’établissements et de formations béninois. Les propositions sont des pistes, pas des décisions automatiques."]},
{n:"AfriTech Marketplace",c:C3,s:4,r:"Marketplace technologique multiboutiques africaine, avec un démarrage local puis une extension possible.",d:["Pistes : produits technologiques et services numériques, vendeurs et boutiques, mise en avant des produits locaux, vérification des vendeurs, paiement et livraison adaptés au contexte local. Base de données PostgreSQL envisagée."]},
{n:"SentinelPi",c:C4,s:4,r:"Concept de boîtier de sécurité et de surveillance informatique et IoT, reposant sur une plateforme de type Raspberry Pi.",d:["Fonctionnalités et architecture à préciser."]},
{n:"Marketplace de seconde main",c:C3,s:4,r:"Plateforme locale de mise en relation entre acheteurs et vendeurs de produits de seconde main.",d:["Idée en exploration."]}
];
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const KEYS=["realise","prototype","en_developpement","conception","concept"];
const EXP=[{"label":"Depuis le 12 février 2026","title":"UNIR International, stagiaire technique","desc":"Installation et maintenance de systèmes de vidéosurveillance IP, participation à l’installation et à la maintenance d’équipements de sécurité incendie.","note":"statut actuel à confirmer"},{"label":"En cours","title":"Master AI Data Science, Suprh","desc":"","note":"année à préciser"},{"label":"Diplôme obtenu","title":"Licence Réseaux, Mobilité et Sécurité (RMS), Pigier Bénin","desc":"Cycle de licence terminé. Mémoire soutenu avec la mention Très Bien, en binôme avec Gilles Tokpanou.","note":""},{"label":"Formation en cours","title":"Cisco Networking Academy","desc":"Parcours en réseaux, CyberOps et Ethical Hacking. Il s’agit d’une formation suivie, pas d’une certification obtenue.","note":""},{"label":"Apprentissage","title":"Hack The Box","desc":"Pratique sur les environnements Linux et la cybersécurité.","note":""},{"label":"Parcours antérieur","title":"Baccalauréat série D, Collège privé Saint-Laurent, 2022/2023","desc":"BEPC, Collège privé Saint-Laurent, 2019/2020\nCEP, École Espoir 2000, 2014/2015","note":""},{"label":"Langues","title":"Français, langue maternelle","desc":"Anglais : niveau à confirmer","note":""}];
let CUR={SK,PROJ,EXP,TEAM:[]},fc="",fs=-1;
const tbc=t=>t?`<span class="tbc">${esc(t)}</span>`:"";
const renderSk=()=>{$("sk").innerHTML=CUR.SK.map(([g,l])=>`<article class="sk-card"><h3>${esc(g)}</h3><ul>${l.map(([n,v,t])=>`<li><strong>${esc(n)}</strong> <span class="mut">${esc(v)}</span>${t?tbc("à préciser"):""}</li>`).join("")}</ul></article>`).join("")};
const renderEx=()=>{$("ex").innerHTML=CUR.EXP.map(e=>`<div class="row"><h3>${esc(e.label)}</h3><div><p><strong>${esc(e.title)}</strong>${tbc(e.note)}</p>${e.desc?`<p class="mut">${esc(e.desc).replace(/\n/g,"<br>")}</p>`:""}</div></div>`).join("")};
const card=p=>`<details class="proj"><summary><span><strong>${esc(p.n)}</strong>${p.ok?"":tbc("état à confirmer")}<br><span class="mut">${esc(p.c)}</span></span><span class="st" style="--c:${COL[p.s]||COL[4]}">${esc(S[p.s]||"")}</span></summary><div class="det"><p>${esc(p.r)}</p>${p.d.map(x=>`<p>${esc(x)}</p>`).join("")}${p.t?`<p>Technologies : ${esc(p.t)}</p>`:""}</div></details>`;
function list(){const a=CUR.PROJ.filter(p=>(!fc||p.c===fc)&&(fs<0||p.s===fs));$("pl").innerHTML=a.map(card).join("");$("empty").hidden=a.length>0}
const btn=(l,on,k,v)=>`<button type="button" class="chip" aria-pressed="${on}" data-k="${k}" data-v="${esc(v)}">${esc(l)}</button>`;
function chips(){fc="";fs=-1;$("fc").innerHTML=btn("Toutes",true,"c","")+[...new Set(CUR.PROJ.map(p=>p.c))].map(c=>btn(c,false,"c",c)).join("");$("fs").innerHTML=btn("Tous",true,"s",-1)+[...new Set(CUR.PROJ.map(p=>p.s))].sort().map(s=>btn(S[s],false,"s",s)).join("")}
document.addEventListener("click",e=>{const b=e.target.closest(".chip");if(!b)return;b.parentNode.querySelectorAll(".chip").forEach(x=>x.setAttribute("aria-pressed",x===b));if(b.dataset.k==="c")fc=b.dataset.v;else fs=+b.dataset.v;list()});
const isHttps=u=>typeof u==="string"&&u.startsWith("https://");
const renderTeam=()=>{const t=CUR.TEAM;$("collaborateurs").hidden=!t.length;$("navc").hidden=!t.length;$("cl").innerHTML=t.map(m=>{const nm=`${m.first_name} ${m.last_name}`;const ln=[["LinkedIn",m.linkedin_url],["Portfolio",m.portfolio_url],["GitHub",m.github_url]].filter(x=>isHttps(x[1])).map(x=>`<a href="${esc(x[1])}" target="_blank" rel="noopener noreferrer">${x[0]}</a>`).join(" ");const pic=m.has_photo?`<img class="ph" src="/api/collab-photo?id=${encodeURIComponent(m.id)}&v=${encodeURIComponent(m.photo_v)}" alt="Portrait de ${esc(nm)}" loading="lazy">`:`<div class="ph" aria-hidden="true">${esc((m.first_name[0]||"")+(m.last_name[0]||""))}</div>`;return `<figure class="mem">${pic}<h3>${esc(nm)}</h3><p>${ln}</p></figure>`}).join("")};
function stagger(){document.querySelectorAll("section").forEach(s=>s.querySelectorAll(".sk-card,.mem,#ex .row,details.proj").forEach((n,i)=>n.style.setProperty("--i",Math.min(i,9))))}
const renderAll=()=>{renderSk();renderEx();chips();list();renderTeam();stagger()};
function applySettings(s){document.querySelectorAll("[data-s]").forEach(el=>{const v=s[el.dataset.s];if(!v)return;if(el.dataset.multi)el.replaceChildren(...v.split(/\n\s*\n/).map(t=>{const p=document.createElement("p");p.textContent=t.trim();return p}));else el.textContent=v})}
async function loadContent(){try{const r=await Promise.race([fetch(CFG.api+"/content"),new Promise((_,no)=>setTimeout(no,2500))]);if(!r.ok)throw 0;const d=await r.json();CUR.TEAM=Array.isArray(d.collaborators)?d.collaborators:[];if(!d.settings||!d.settings.seeded)throw 0;const gs=[],ix={};d.skills.forEach(s=>{if(!(s.group_name in ix)){ix[s.group_name]=gs.length;gs.push([s.group_name,[]])}gs[ix[s.group_name]][1].push([s.name,s.level,s.to_clarify?1:0])});CUR={TEAM:CUR.TEAM,SK:gs,PROJ:d.projects.map(p=>({n:p.name,c:p.category,s:KEYS.indexOf(p.status),ok:p.confirmed?1:0,r:p.summary,d:p.details||[],t:p.technologies||""})),EXP:d.experiences.map(x=>({label:x.label,title:x.title,desc:x.description||"",note:x.note||""}))};applySettings(d.settings)}catch(_){}renderAll()}
loadContent();
/* CV : le bouton devient un lien dès que CFG.cv est renseigné */
const setCv=u=>{const a=document.createElement("a");a.className="btn";a.href=u;a.download="";a.textContent="Télécharger mon CV";$("cv").replaceWith(a)};
if(CFG.cv)setCv(CFG.cv);else if(CFG.api)fetch(CFG.api+"/cv",{method:"HEAD"}).then(r=>{if(r.ok)setCv(CFG.api+"/cv")}).catch(()=>{});
/* Photo : apparaît avec une animation une fois chargée */
const im=$("pimg"),ph=$("photo");
function showPhoto(src){im.onload=()=>{im.hidden=false;$("pcap").hidden=true;ph.classList.remove("on");void ph.offsetWidth;ph.classList.add("on")};im.onerror=()=>{im.hidden=true;$("pcap").hidden=false};im.src=src}
showPhoto(CFG.api+"/photo");
/* Formulaire de contact (Web3Forms), actif seulement avec une clé */
const f=$("cf"),cfs=$("cfs");
if(!CFG.api){f.querySelector("button").disabled=true;cfs.textContent="Le formulaire sera actif après la mise en ligne du site. En attendant, écrivez à l’une des adresses ci-dessus."}
f.addEventListener("submit",async e=>{e.preventDefault();if(!f.reportValidity())return;const d=Object.fromEntries(new FormData(f));if(d.botcheck)return;cfs.textContent="Envoi en cours…";try{const r=await fetch(CFG.api+"/contact",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(d)});const j=await r.json();if(!j.success){cfs.textContent=r.status===429?"Trop de messages envoyés. Réessayez plus tard.":"L’envoi a échoué. Écrivez directement à l’une des adresses ci-dessus.";return}f.reset();cfs.textContent="Message envoyé. Merci."}catch(_){cfs.textContent="L’envoi a échoué. Écrivez directement à l’une des adresses ci-dessus."}});
/* Apparition discrète des sections, une seule fois */
if(!matchMedia("(prefers-reduced-motion: reduce)").matches&&"IntersectionObserver"in window){const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){x.target.classList.add("in");io.unobserve(x.target)}}),{threshold:.05});document.querySelectorAll("section:not(#accueil) .wrap").forEach(el=>{el.classList.add("rv");el.querySelectorAll(".row,details.proj,.chips,.cf,.grid2>div").forEach((n,i)=>n.style.setProperty("--i",Math.min(i,9)));io.observe(el)})}
/* Barre de progression et lien actif du menu */
const bar=$("bar");let tk=0;
addEventListener("scroll",()=>{if(tk)return;tk=requestAnimationFrame(()=>{tk=0;bar.style.setProperty("--p",Math.min(1,scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)))})},{passive:true});
if("IntersectionObserver"in window){const links=[...document.querySelectorAll("nav a")];const so=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting)links.forEach(a=>a.getAttribute("href")==="#"+x.target.id?a.setAttribute("aria-current","true"):a.removeAttribute("aria-current"))}),{rootMargin:"-45% 0px -50% 0px"});document.querySelectorAll("main section").forEach(s=>so.observe(s))}
/* Menu mobile */
const mb=$("mbtn"),nv=$("nav");
mb.onclick=()=>{const o=nv.classList.toggle("open");mb.setAttribute("aria-expanded",String(o))};
nv.addEventListener("click",e=>{if(e.target.closest("a")){nv.classList.remove("open");mb.setAttribute("aria-expanded","false")}});
/* Compétences : diaporama automatique, pausable */
const trk=$("sk"),cp=$("cplay");
let play=!matchMedia("(prefers-reduced-motion: reduce)").matches,timer;
const step=d=>{const c=trk.firstElementChild;if(!c)return;const w=c.getBoundingClientRect().width+16,max=trk.scrollWidth-trk.clientWidth;let x=trk.scrollLeft+d*w;if(d>0&&trk.scrollLeft>=max-4)x=0;if(d<0&&trk.scrollLeft<=4)x=max;trk.scrollTo({left:x,behavior:"smooth"})};
const arm=()=>{clearInterval(timer);if(play)timer=setInterval(()=>{if(!document.hidden)step(1)},4200)};
const lab=()=>{cp.textContent=play?"Pause":"Lecture";cp.setAttribute("aria-pressed",String(play))};
cp.onclick=()=>{play=!play;lab();arm()};
$("cprev").onclick=()=>{step(-1);arm()};
$("cnext").onclick=()=>{step(1);arm()};
["mouseenter","focusin","touchstart"].forEach(e=>trk.addEventListener(e,()=>clearInterval(timer),{passive:true}));
["mouseleave","focusout","touchend"].forEach(e=>trk.addEventListener(e,arm,{passive:true}));
lab();arm();
