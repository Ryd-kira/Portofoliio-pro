// Contenu initial, importé une seule fois depuis /admin.html.
export const DEFAULTS = {
 "projects": [
  {
   "name": "Architecture IDS/IPS multicouche (SOC Lab)",
   "category": "Cybersécurité et infrastructures",
   "status": "realise",
   "summary": "Projet de mémoire de licence, mené sous la forme d’un laboratoire SOC : conception et mise en œuvre d’une architecture de détection et de prévention d’attaques au niveau réseau, réalisé en binôme avec Gilles Tokpanou.",
   "details": [
    "Laboratoire virtualisé, Wazuh pour la supervision et la centralisation des événements, Suricata pour la détection et la prévention réseau, configuration et supervision d’agents, analyse des alertes, scénarios de sécurité réseau.",
    "Le périmètre mis en œuvre est centré sur la partie réseau avec Wazuh et Suricata."
   ],
   "technologies": "VirtualBox, Wazuh, Suricata",
   "confirmed": true,
   "position": 10,
   "published": true
  },
  {
   "name": "Détection des menaces internes par apprentissage automatique",
   "category": "Cybersécurité et infrastructures",
   "status": "en_developpement",
   "summary": "Recherche sur la détection précoce et explicable des menaces internes en entreprise, à partir du CERT Insider Threat Dataset (données synthétiques).",
   "details": [
    "Objectif : repérer les comportements anormaux tout en réduisant les fausses alertes et en expliquant pourquoi une activité est jugée suspecte. Méthodes envisagées : Isolation Forest, Random Forest, XGBoost."
   ],
   "technologies": null,
   "confirmed": false,
   "position": 20,
   "published": true
  },
  {
   "name": "Kira Tech et Solution",
   "category": "E-commerce et entrepreneuriat",
   "status": "conception",
   "summary": "Site vitrine et catalogue pour une activité de vente de matériel informatique (portables, fixes, gaming) et de services de maintenance et de réparation, basée à Cotonou et Calavi, au Bénin.",
   "details": [
    "Fonctionnalités prévues : catalogue avec filtres (RAM, stockage, usage, performances, budget), fiche détaillée par ordinateur, bouton d’achat vers WhatsApp, contact, administration pour gérer les produits sans toucher au code."
   ],
   "technologies": null,
   "confirmed": false,
   "position": 30,
   "published": true
  },
  {
   "name": "OneBénin",
   "category": "Développement et plateformes",
   "status": "conception",
   "summary": "« Mon pays en un seul endroit » : plateforme de services numériques centrée sur le Bénin, à l’architecture modulaire.",
   "details": [
    "Modules envisagés : immobilier, restauration, transport, éducation, tourisme, marketplace, santé, services. Développement progressif, avec une documentation produit et technique."
   ],
   "technologies": null,
   "confirmed": false,
   "position": 40,
   "published": true
  },
  {
   "name": "OCD Live",
   "category": "Développement et plateformes",
   "status": "conception",
   "summary": "Plateforme de prestations et de réservations de livestreams.",
   "details": [
    "Éléments évoqués : réservation et gestion de sessions, formules et durées variables, abonnement mensuel sans engagement, extraits payants."
   ],
   "technologies": null,
   "confirmed": false,
   "position": 50,
   "published": true
  },
  {
   "name": "Plateforme d’orientation scolaire",
   "category": "Développement et plateformes",
   "status": "conception",
   "summary": "Plateforme d’orientation pour les élèves de la 4e à la terminale au Bénin.",
   "details": [
    "Idées : exploiter les résultats scolaires, recueillir les intérêts et métiers envisagés, proposer des filières adaptées, construire un référentiel d’établissements et de formations béninois. Les propositions sont des pistes, pas des décisions automatiques."
   ],
   "technologies": null,
   "confirmed": false,
   "position": 60,
   "published": true
  },
  {
   "name": "AfriTech Marketplace",
   "category": "E-commerce et entrepreneuriat",
   "status": "concept",
   "summary": "Marketplace technologique multiboutiques africaine, avec un démarrage local puis une extension possible.",
   "details": [
    "Pistes : produits technologiques et services numériques, vendeurs et boutiques, mise en avant des produits locaux, vérification des vendeurs, paiement et livraison adaptés au contexte local. Base de données PostgreSQL envisagée."
   ],
   "technologies": null,
   "confirmed": false,
   "position": 70,
   "published": true
  },
  {
   "name": "SentinelPi",
   "category": "IA, automatisation et IoT",
   "status": "concept",
   "summary": "Concept de boîtier de sécurité et de surveillance informatique et IoT, reposant sur une plateforme de type Raspberry Pi.",
   "details": [
    "Fonctionnalités et architecture à préciser."
   ],
   "technologies": null,
   "confirmed": false,
   "position": 80,
   "published": true
  },
  {
   "name": "Marketplace de seconde main",
   "category": "E-commerce et entrepreneuriat",
   "status": "concept",
   "summary": "Plateforme locale de mise en relation entre acheteurs et vendeurs de produits de seconde main.",
   "details": [
    "Idée en exploration."
   ],
   "technologies": null,
   "confirmed": false,
   "position": 90,
   "published": true
  }
 ],
 "skills": [
  {
   "group_name": "Réseaux et systèmes",
   "name": "Réseaux informatiques",
   "level": "Bases à intermédiaire",
   "to_clarify": true,
   "position": 0,
   "published": true
  },
  {
   "group_name": "Réseaux et systèmes",
   "name": "Linux (Kali, Ubuntu)",
   "level": "Débutant à intermédiaire",
   "to_clarify": true,
   "position": 10,
   "published": true
  },
  {
   "group_name": "Réseaux et systèmes",
   "name": "VirtualBox",
   "level": "Pratique en laboratoire",
   "to_clarify": false,
   "position": 20,
   "published": true
  },
  {
   "group_name": "Réseaux et systèmes",
   "name": "Cisco Packet Tracer",
   "level": "Pratique et apprentissage",
   "to_clarify": false,
   "position": 30,
   "published": true
  },
  {
   "group_name": "Réseaux et systèmes",
   "name": "Wireshark",
   "level": "Notions pratiques",
   "to_clarify": false,
   "position": 40,
   "published": true
  },
  {
   "group_name": "Cybersécurité",
   "name": "Wazuh",
   "level": "Pratique dans le cadre du mémoire",
   "to_clarify": false,
   "position": 100,
   "published": true
  },
  {
   "group_name": "Cybersécurité",
   "name": "Suricata",
   "level": "Pratique dans le cadre du mémoire",
   "to_clarify": false,
   "position": 110,
   "published": true
  },
  {
   "group_name": "Cybersécurité",
   "name": "Nmap",
   "level": "Notions pratiques",
   "to_clarify": false,
   "position": 120,
   "published": true
  },
  {
   "group_name": "Cybersécurité",
   "name": "Burp Suite",
   "level": "Initiation",
   "to_clarify": false,
   "position": 130,
   "published": true
  },
  {
   "group_name": "Développement et données",
   "name": "HTML / CSS",
   "level": "Bases",
   "to_clarify": false,
   "position": 200,
   "published": true
  },
  {
   "group_name": "Développement et données",
   "name": "JavaScript",
   "level": "En apprentissage",
   "to_clarify": false,
   "position": 210,
   "published": true
  },
  {
   "group_name": "Développement et données",
   "name": "Python",
   "level": "Débutant",
   "to_clarify": false,
   "position": 220,
   "published": true
  },
  {
   "group_name": "Développement et données",
   "name": "MySQL / PostgreSQL",
   "level": "Notions",
   "to_clarify": true,
   "position": 230,
   "published": true
  },
  {
   "group_name": "IA et automatisation",
   "name": "IA générative / LLM",
   "level": "Utilisation pratique",
   "to_clarify": true,
   "position": 300,
   "published": true
  },
  {
   "group_name": "IA et automatisation",
   "name": "n8n",
   "level": "Exploration",
   "to_clarify": false,
   "position": 310,
   "published": true
  }
 ],
 "experiences": [
  {
   "label": "Depuis le 12 février 2026",
   "title": "UNIR International, stagiaire technique",
   "description": "Installation et maintenance de systèmes de vidéosurveillance IP, participation à l’installation et à la maintenance d’équipements de sécurité incendie.",
   "note": "statut actuel à confirmer",
   "position": 10,
   "published": true
  },
  {
   "label": "En cours",
   "title": "Master AI Data Science, Suprh",
   "description": null,
   "note": "année à préciser",
   "position": 20,
   "published": true
  },
  {
   "label": "Diplôme obtenu",
   "title": "Licence Réseaux, Mobilité et Sécurité (RMS), Pigier Bénin",
   "description": "Cycle de licence terminé. Mémoire soutenu avec la mention Très Bien, en binôme avec Gilles Tokpanou.",
   "note": null,
   "position": 30,
   "published": true
  },
  {
   "label": "Formation en cours",
   "title": "Cisco Networking Academy",
   "description": "Parcours en réseaux, CyberOps et Ethical Hacking. Il s’agit d’une formation suivie, pas d’une certification obtenue.",
   "note": null,
   "position": 40,
   "published": true
  },
  {
   "label": "Apprentissage",
   "title": "Hack The Box",
   "description": "Pratique sur les environnements Linux et la cybersécurité.",
   "note": null,
   "position": 50,
   "published": true
  },
  {
   "label": "Parcours antérieur",
   "title": "Baccalauréat série D, Collège privé Saint-Laurent, 2022/2023",
   "description": "BEPC, Collège privé Saint-Laurent, 2019/2020\nCEP, École Espoir 2000, 2014/2015",
   "note": null,
   "position": 60,
   "published": true
  },
  {
   "label": "Langues",
   "title": "Français, langue maternelle",
   "description": "Anglais : niveau à confirmer",
   "note": null,
   "position": 70,
   "published": true
  }
 ],
 "settings": {
  "hero_lead": "Je conçois des solutions numériques, j’explore les technologies de cybersécurité et je développe des projets à la croisée des réseaux, du logiciel et de l’intelligence artificielle.",
  "signature": "Entrepreneur technologique | Orientation cybersécurité | Conception de solutions numériques",
  "location": "Casablanca, Sidi Maarouf",
  "about": "Je suis Rydwanoullah Koladé Alabi ICHOLA, titulaire d’une licence en Réseaux, Mobilité et Sécurité et actuellement en Master AI Data Science. Je développe un profil à la croisée des réseaux informatiques, de l’administration des systèmes, de la cybersécurité et de la conception de solutions numériques.\n\nEn parallèle de mon parcours technique, je conçois plusieurs projets entrepreneuriaux destinés notamment au marché béninois et africain.\n\nMon ambition est de devenir entrepreneur technologique et consultant en cybersécurité, capable de concevoir, développer, déployer et sécuriser des solutions utiles et innovantes.",
  "interests": "Réseaux et infrastructures, administration systèmes, sécurité des infrastructures, détection des menaces et SOC, pentest et sécurité applicative, DevSecOps, développement de logiciels et de plateformes, intelligence artificielle générative, automatisation, entrepreneuriat technologique.",
  "motto": "Work hard, Never give up."
 }
};
