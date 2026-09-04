# MEGA SERVICES SARL U — V4 Cloudflare Pages + GitHub

Cette V4 supprime l'obligation d'exécuter manuellement les migrations D1. Le Worker initialise automatiquement les tables nécessaires lors du premier appel API.

## Pages publiques
- `/` — Accueil
- `/a-propos.html` — À propos
- `/services.html` — Nos services
- `/realisations.html` — Nos réalisations
- `/recrutement.html` — Nous recrutons : offres + formulaire de candidature
- `/contact.html` — Contact
- Boutique externe : `https://globalmarketci.pages.dev/#boutique/mega-services-sarl-u`
- `/connexion.html` — Espace administrateur
- `/admin.html` — Tableau de bord sécurisé

## Bindings Cloudflare déjà préparés
`wrangler.jsonc` contient :
- `SITE_MEGA_KV` → ID `79497d597c514f0192d069ef65054ae8`
- `SITE_MEGA_D1` → base `site-mega-d1`, ID `831b511f-acc3-41e6-b404-1cb64e67508b`

Dans Cloudflare Pages, vérifiez simplement que ces deux bindings sont bien attachés au projet de production.

## V4 — création automatique des tables
`public/_worker.js` exécute au premier démarrage des `CREATE TABLE IF NOT EXISTS` pour :
- `users`
- `user_credentials`
- `contact_messages`
- `site_content`
- `audit_log`
- `jobs`
- `job_applications`
- les index nécessaires

Un marqueur de version est ensuite enregistré dans KV. Aucun terminal et aucune commande `wrangler d1 migrations apply` ne sont nécessaires pour la V4.

Les fichiers `migrations/` sont conservés uniquement comme documentation et sauvegarde du schéma.

## Accès administrateur — première connexion
L'adresse administrateur par défaut est :

`mega@services.local`

Le mot de passe administrateur n'est volontairement PAS présent dans GitHub, le ZIP, le HTML ou le JavaScript navigateur.

### Une seule configuration à faire dans Cloudflare
Dans le tableau de bord Cloudflare :

1. Ouvrez votre projet Pages `megaservicesci`.
2. Allez dans **Paramètres / Settings → Variables et secrets**.
3. Ajoutez une variable chiffrée / secret nommée exactement :
   `ADMIN_BOOTSTRAP_PASSWORD`
4. Comme valeur, saisissez votre mot de passe administrateur secret.
5. Enregistrez puis redéployez le projet si Cloudflare le demande.
6. Ouvrez `https://megaservicesci.pages.dev/connexion.html`.
7. Utilisez `mega@services.local` et le mot de passe secret.

À la toute première connexion, le Worker crée automatiquement le compte administrateur et stocke uniquement un hash PBKDF2 et son sel dans D1. Le mot de passe en clair ne va jamais dans D1.

La page `/connexion.html` affiche désormais un diagnostic clair :
- administration déjà active ;
- première connexion prête ;
- secret Cloudflare manquant ;
- problème de liaison D1/KV.

## Sécurité
- véritable `POST /api/login` côté serveur ;
- PBKDF2-SHA-256, 210 000 itérations ;
- aucun hash ni sel envoyé au navigateur ;
- credentials séparés dans `user_credentials` ;
- sessions aléatoires stockées dans KV ;
- cookie `__Host-mega_session`, `HttpOnly`, `Secure`, `SameSite=Lax` ;
- `/api/load` et `/api/save` protégés par session ;
- CSRF obligatoire pour les écritures authentifiées ;
- contrôle d'origine ;
- invalidation globale des sessions après réinitialisation de mot de passe ;
- gestion serveur des comptes, offres, candidatures et messages ;
- journal des actions sensibles dans D1 ;
- limitation des tentatives de connexion et des formulaires publics via KV.

## Administration
Après connexion, `/admin.html` permet de gérer :
- messages reçus ;
- candidatures ;
- offres d'emploi ;
- activation/désactivation des offres ;
- création/modification/suppression des comptes administratifs ;
- activation/désactivation des comptes ;
- assistance et réinitialisation de mot de passe ;
- contenu structuré du site ;
- journal de sécurité.

## Déploiement GitHub / Cloudflare Pages
Configuration recommandée :
- Branche : `main`
- Framework : `Aucun`
- Commande de build : vide
- Répertoire de sortie : `public`

Le fichier `_worker.js` se trouve volontairement dans `public/` afin d'utiliser le mode avancé Cloudflare Pages.

## Diagnostic serveur
`GET /api/setup-status` retourne uniquement l'état de préparation : base prête, existence du compte administrateur et présence ou non du secret. Aucune valeur secrète n'est jamais renvoyée.
