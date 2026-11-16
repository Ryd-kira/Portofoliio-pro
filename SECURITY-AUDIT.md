# Rapport d'audit de sécurité

Date : 16 novembre 2026. Périmètre : dépôt `Ryd-kira/Portofoliio-pro` (site, API, administration), base Neon « Portofolio-me.db », configuration Vercel décrite dans `vercel.json`.

## Méthode
- Relecture complète du code de la version 4 et de la base (rôles, droits, sécurité par ligne) par requêtes sur le catalogue Postgres réel.
- 63 tests automatisés des routes serveur, exécutés sur une base Postgres embarquée avec le schéma réel du projet.
- 12 contrôles dans un vrai navigateur (Chromium) avec les en-têtes de sécurité réels de `vercel.json`.
- Analyse des dépendances (`npm audit`) et recherche de secrets dans l'historique Git complet (13 commits) et dans toutes les archives livrées.

## Failles et faiblesses trouvées, et corrections

| # | Gravité | Constat (version 4) | Correction |
| --- | --- | --- | --- |
| 1 | Élevée | Mot de passe administrateur stocké en clair dans Vercel et comparé par une empreinte SHA-256 sans sel. | Hachage PBKDF2-SHA256 (600 000 itérations, sel aléatoire) ; page `/hash.html` calculée dans le navigateur ; ancien mode toléré avec avertissement dans l'onglet Sécurité. |
| 2 | Moyenne | Pas de limite sur les tentatives de connexion (seulement 0,6 s de délai). | 5 échecs par 15 min et par visiteur, 60 par heure au total, en base (fonctionne en serverless) ; tentatives journalisées. |
| 3 | Moyenne | Session sans état : impossible à révoquer, la déconnexion n'invalidait rien côté serveur. | Sessions en base (jeton haché), expiration absolue 8 h, inactivité 2 h, déconnexion et révocation générale. |
| 4 | Moyenne | Protection CSRF reposant seulement sur SameSite et Origin. | Jeton CSRF par session exigé sur toute écriture, en plus d'Origin. |
| 5 | Moyenne | CSP autorisant les scripts en ligne : une faille XSS aurait pu s'exécuter. | Scripts déplacés dans des fichiers, CSP `script-src 'self'` sans `unsafe-inline` ni `unsafe-eval`. |
| 6 | Moyenne | Formulaire de contact sans limite par visiteur ni trace des abus. | 3 messages par 10 min et par visiteur, 20 au total ; piège anti-robots ; caractères de contrôle supprimés ; tout est journalisé. |
| 7 | Faible | Une ressource nommée `constructor` ou `__proto__` provoquait une erreur SQL interne (500). | Seules les ressources déclarées sont acceptées (`Object.hasOwn`) ; réponse 404. |
| 8 | Faible | Erreurs non maîtrisées : détails techniques possibles dans les journaux sans structure, pas de réponse générique garantie. | Enveloppe commune : réponse « Erreur serveur » sans détail, journaux serveur structurés, variables d'environnement vérifiées à chaque requête. |
| 9 | Faible | Boutons de gestion de la photo accessibles depuis la page publique (`#admin`). | Supprimés : toute l'administration est sur `/admin.html`. |
| 10 | Faible | En-têtes manquants : HSTS, Permissions-Policy, COOP. | Ajoutés dans `vercel.json`. |
| 11 | Info | Fichiers internes dans `api/` protégés seulement par une convention de nommage. | Déplacés dans `lib/` : jamais exposés comme routes. |
| 12 | Info | Cookie non préfixé. | Cookie `__Host-adm` (Secure, Path=/, sans Domain). |
| 13 | Action requise | Le mot de passe du rôle Neon `portfolio_app` et un secret de session généré pendant la mise en place sont apparus dans des résultats d'outils de cette conversation. | À remplacer (voir ci-dessous). Je n'ai pas pu le faire moi-même sans réafficher la nouvelle valeur. |

## Points déjà conformes (vérifiés)
- Base : rôle applicatif non superutilisateur, sans contournement de la sécurité par ligne, sans droit de création dans le schéma `public`, sans accès aux comptes de Neon Auth ; sécurité par ligne activée sur toutes les tables ; aucun droit accordé à `PUBLIC` ; contraintes de longueur et de format dans la base ; connexion chiffrée imposée par Neon.
- Requêtes SQL paramétrées partout (les seuls noms dynamiques viennent d'une liste fixe dans `lib/schema.js`).
- Rendu : tout contenu affiché passe par un échappement ou par des propriétés DOM ; liens limités à `https://`.
- Aucune clé d'API dans le code ni dans le navigateur ; `.gitignore` exclut `.env`.
- Dépendances : un seul paquet de production, `npm audit` : 0 vulnérabilité ; fichier de verrouillage ajouté ; mises à jour hebdomadaires via Dependabot.
- Historique Git (13 commits) et archives : aucun secret, aucun fichier sensible.
- Fichiers servis publiquement : `index.html`, `admin.html`, `hash.html` et leurs scripts. Rien d'autre.
- HTTPS : redirection automatique par Vercel, HSTS, cookies Secure, `upgrade-insecure-requests`.
- CORS : aucun en-tête CORS, requêtes d'autres sites refusées ; OPTIONS refusé.
- Mode debug : aucun mode debug dans le code ; erreurs génériques en production.

## Sans objet pour ce site
- Vérification des prix et des paiements : aucune boutique ni paiement.
- Liens de réinitialisation de mot de passe : volontairement absents (un seul administrateur, mot de passe changé via Vercel) ; un tel lien serait une surface d'attaque inutile.

## Résultats des tests
- Routes serveur : 63 / 63 réussis (authentification, limites, CSRF, injections SQL, validation, fichiers, sessions, erreurs, hachage).
- Navigateur avec en-têtes réels : 12 / 12 réussis (aucune violation de CSP, charge utile XSS affichée en texte, jeton CSRF envoyé, page de hachage).
- Limites de ces tests : ils tournent sur une base Postgres embarquée, pas sur Neon en production ; les droits et la sécurité par ligne de Neon ont été vérifiés séparément par le catalogue. Le déploiement réel sur Vercel n'a pas pu être testé (en-têtes à vérifier après mise en ligne).

## Limites connues et recommandations
1. Pas de double authentification sur la page d'administration : activer la 2FA sur GitHub, Vercel et Neon ; une 2FA par application (TOTP) peut être ajoutée ensuite.
2. Les limites de requêtes reposent sur l'adresse IP : un attaquant qui change d'adresse contourne la limite par visiteur, d'où le plafond global.
3. Le blocage global de connexion peut gêner l'administrateur légitime pendant une attaque (jusqu'à une heure).
4. Le dépôt GitHub est public : le code est lisible, sans secret. Activer le « secret scanning » et la « push protection » dans les réglages GitHub du dépôt.
5. Journal : les adresses IP sont stockées sous forme d'empreinte secrète, conservées 90 jours.

## Actions à faire par le propriétaire (dans cet ordre)
1. Téléverser la version 5 sur GitHub.
2. Neon : réinitialiser le mot de passe du rôle `portfolio_app`, copier la nouvelle chaîne dans `DATABASE_URL` (Vercel).
3. Vercel : définir un nouveau `SESSION_SECRET` (32 caractères minimum, aléatoire). Redéployer.
4. Ouvrir `/hash.html`, calculer le hachage, le placer dans `ADMIN_PASSWORD_HASH`, supprimer `ADMIN_PASSWORD`, redéployer.
5. Se connecter, ouvrir l'onglet Sécurité, vérifier qu'aucun avertissement n'apparaît, puis « Déconnecter toutes les sessions ».
6. Activer la double authentification sur GitHub, Vercel et Neon.
