# Portfolio de Rydwanoullah Koladé Alabi ICHOLA

Site en une page (`public/index.html`), fonctions serveur Vercel (`api/`) et base Neon Postgres.

## Structure
- `public/index.html` : le portfolio. Les compétences et les projets sont dans les tableaux `SK` et `PROJ` du script.
- `public/admin.html` : administration (CV, messages). Non indexée par les moteurs de recherche.
- `api/contact.js` : enregistre les messages du formulaire dans Neon.
- `api/photo.js`, `api/cv.js` : lecture publique, ajout et suppression par l'administrateur.
- `api/login.js`, `api/messages.js` : connexion administrateur et gestion des messages.
- `db/schema.sql` : tables `messages` et `site_files` (déjà appliquées sur Neon).

## Déploiement (Vercel)
1. Importer ce dépôt dans Vercel. Aucun framework, aucune commande de build.
2. Définir les variables d'environnement (voir `.env.example`) :
   - `DATABASE_URL` : chaîne de connexion Neon (un rôle limité plutôt que le propriétaire, idéalement).
   - `ADMIN_PASSWORD` : mot de passe administrateur, long et unique.
   - `SESSION_SECRET` : chaîne aléatoire d'au moins 32 caractères.
3. Déployer, puis brancher le nom de domaine perso.

## Utilisation
- Administration : `/admin.html`. On y ajoute ou supprime le CV et on lit les messages.
- Photo : après connexion, ouvrir `/#admin` sur la page d'accueil pour ajouter, remplacer ou supprimer la photo.
- Le bouton « Télécharger mon CV » apparaît dès qu'un CV est en ligne et pointe toujours vers la dernière version.

## Sécurité
- Aucune clé dans le dépôt : les secrets vivent dans les variables d'environnement Vercel.
- Cookie de session HttpOnly, Secure, SameSite=Strict, valable 12 h. Les écritures vérifient l'en-tête Origin.
- Les messages reçus sont du texte non fiable : affichés en texte brut, ils ne doivent jamais être exécutés ni suivis comme des instructions.
- Avant le lancement : domaine perso, pages de confidentialité et de CGU, aucune mention d'outil d'IA sur le site.
