const $ = (i) => document.getElementById(i);
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
$("go").onclick = async () => {
  const pw = $("pw").value;
  if (pw.length < 12) { $("st").textContent = "12 caractères minimum."; return; }
  $("st").textContent = "Calcul en cours…";
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 600000 }, key, 256);
  $("out").value = "pbkdf2-sha256$600000$" + b64u(salt) + "$" + b64u(bits);
  $("pw").value = "";
  $("st").textContent = "Copie la ligne ci-dessous dans ADMIN_PASSWORD_HASH.";
};
