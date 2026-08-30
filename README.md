# MEGA SERVICES SARL U — Cloudflare Pages + GitHub

Projet statique multi-pages avec backend sécurisé dans `public/_worker.js`.

## Pages
- `/` Accueil
- `/a-propos.html`
- `/services.html`
- `/realisations.html`
- `/contact.html`
- Boutique externe : `https://globalmarketci.pages.dev/#boutique/mega-services-sarl-u`
- `/connexion.html` (administration)
- `/admin.html` (espace administration)

## Bindings Cloudflare
Le fichier `wrangler.jsonc` contient déjà :
- KV binding `SITE_MEGA_KV` → namespace `site-mega-kv` / ID `79497d597c514f0192d069ef65054ae8`
- D1 binding `SITE_MEGA_D1` → base `site-mega-d1` / ID `831b511f-acc3-41e6-b404-1cb64e67508b`

## Sécurité
- `POST /api/login` véritable route serveur.
- Vérification des mots de passe uniquement dans `public/_worker.js`.
- PBKDF2-SHA-256 avec sel aléatoire et 210 000 itérations.
- Aucun hash ni sel envoyé au navigateur.
- Identifiants stockés dans `user_credentials`, séparés des données générales `users`.
- Sessions aléatoires stockées dans KV.
- Cookie `__Host-mega_session`: HttpOnly, Secure, SameSite=Lax.
- `/api/load` et `/api/save` exigent une session valide.
- Écritures authentifiées protégées par `X-CSRF-Token` et contrôle d’origine.
- Modification/réinitialisation de mot de passe → incrément d’un `auth:epoch` KV qui invalide toutes les sessions.
- Création, modification, activation/désactivation et suppression des comptes contrôlées côté serveur.
- Journal des actions sensibles dans D1 (`audit_log`).
- Limitation des tentatives de connexion et des formulaires de contact via KV.

## IMPORTANT — le mot de passe administrateur n’est pas dans le dépôt
Le mot de passe fourni ne doit jamais être ajouté à GitHub, `wrangler.jsonc`, JavaScript client ou migration SQL.

Configurez les secrets directement dans Cloudflare Pages > Settings > Variables and Secrets :
- `ADMIN_EMAIL` = `mega@services.local`
- `ADMIN_BOOTSTRAP_PASSWORD` = votre mot de passe administrateur secret
- `SESSION_SECRET` = une chaîne aléatoire longue (réservée aux évolutions de sécurité)

Avec Wrangler, selon votre mode de déploiement, ajoutez ces valeurs comme secrets/variables dans le projet Pages via le Dashboard Cloudflare. Ne commitez jamais `.dev.vars`.

## Première installation
1. Créer/ouvrir le projet Cloudflare Pages `mega-services-sarl-u` et connecter le dépôt GitHub.
2. Vérifier les bindings D1/KV dans Cloudflare ou conserver `wrangler.jsonc` comme source de configuration.
3. Installer : `npm install`
4. Appliquer les migrations : `npx wrangler d1 migrations apply site-mega-d1 --remote`
5. Définir `ADMIN_EMAIL` et `ADMIN_BOOTSTRAP_PASSWORD` comme secrets/variables Cloudflare.
6. Déployer le dossier `public`.
7. Ouvrir `/connexion.html` et effectuer la première connexion. Si aucun administrateur n’existe encore, le Worker crée le compte primaire et enregistre seulement un hash PBKDF2 + sel dans D1.

## Mot de passe perdu
Pour un utilisateur secondaire, un administrateur connecté ouvre `Utilisateurs > Réinitialiser` et attribue un mot de passe temporaire. Toutes les sessions sont immédiatement invalidées après la réinitialisation.

Pour le compte administrateur principal si aucun autre administrateur n’est disponible : changez `ADMIN_BOOTSTRAP_PASSWORD` dans les secrets Cloudflare et, si nécessaire, supprimez uniquement la ligne de credential correspondante dans D1 avant une connexion de récupération contrôlée. Ne publiez jamais la valeur du secret.

## GitHub Actions
`.github/workflows/deploy.yml` prévoit un déploiement sur push `main`. Ajoutez dans les secrets GitHub :
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## Remarque
Le formulaire Contact enregistre les messages dans D1 et ils apparaissent dans l’espace administrateur. Aucun service e-mail externe n’est requis.
