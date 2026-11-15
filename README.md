# Portfolio de Rydwanoullah Koladé Alabi ICHOLA

Site en une page (`public/index.html`), fonctions serveur Vercel (`api/`) et base Neon Postgres.

## Structure
- `public/index.html` : le portfolio. Il lit son contenu dans `/api/content` et garde un contenu par défaut si la base est vide ou indisponible.
- `public/admin.html` : le back-office. Non indexé par les moteurs de recherche.
- `api/content.js` : contenu public (projets, compétences, parcours, textes).
- `api/admin.js` : ajout, modification et suppression du contenu (administrateur seulement).
- `api/_schema.js` : liste des champs modifiables. Ajouter un champ commence ici, puis dans la base.
- `api/_defaults.js` : contenu initial, importé en un clic depuis le back-office.
- `api/contact.js` : enregistre les messages du formulaire.
- `api/photo.js`, `api/cv.js` : lecture publique, ajout et suppression par l'administrateur.
- `api/login.js`, `api/messages.js` : connexion administrateur et gestion des messages.
- `db/schema.sql` : toutes les tables (déjà appliquées sur Neon).

## Déploiement (Vercel)
1. Importer ce dépôt dans Vercel. Aucun framework, aucune commande de build.
2. Définir les variables d'environnement (voir `.env.example`) :
   - `DATABASE_URL` : chaîne de connexion Neon (un rôle limité plutôt que le propriétaire, idéalement).
   - `ADMIN_PASSWORD` : mot de passe administrateur, long et unique.
   - `SESSION_SECRET` : chaîne aléatoire d'au moins 32 caractères.
3. Déployer, puis brancher le nom de domaine perso.

## Utilisation sans coder
1. Ouvrir `/admin.html` et se connecter avec `ADMIN_PASSWORD`.
2. Première fois seulement : cliquer sur « Importer le contenu actuel ». Les projets, compétences, parcours et textes du site passent dans la base.
3. Onglets : Projets, Compétences, Parcours (ajouter, modifier, masquer, supprimer, réordonner), Textes (accroche, à propos, centres d'intérêt, devise), Fichiers (CV en PDF et photo) et Messages.
4. Chaque enregistrement apparaît sur le site en quelques secondes, sans redéploiement.
- Le bouton « Télécharger mon CV » apparaît dès qu'un CV est en ligne et pointe toujours vers la dernière version.
- La mention « à confirmer » d'un projet disparaît quand on coche « État confirmé ».

## Sécurité
- Aucune clé dans le dépôt : les secrets vivent dans les variables d'environnement Vercel.
- Cookie de session HttpOnly, Secure, SameSite=Strict, valable 12 h. Les écritures vérifient l'en-tête Origin.
- Les messages reçus sont du texte non fiable : affichés en texte brut, ils ne doivent jamais être exécutés ni suivis comme des instructions.
- Avant le lancement : domaine perso, pages de confidentialité et de CGU, aucune mention d'outil d'IA sur le site.
