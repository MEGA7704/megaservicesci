# MEGA SERVICES SARL U — V6 Admin Fix

Cette version corrige la connexion administrateur :

- le formulaire utilise explicitement POST ; aucun identifiant ni mot de passe ne peut être placé dans l’URL ;
- l’adresse administrateur n’est plus préremplie dans la page ;
- diagnostic clair des bindings D1/KV et du secret Cloudflare ;
- création automatique du schéma D1 au premier appel ;
- authentification exclusivement côté serveur dans `public/_worker.js` ;
- cookie `HttpOnly; Secure; SameSite=Lax` et CSRF sur les écritures ;
- espace `/admin.html` protégé par session.

## Configuration Cloudflare obligatoire

Bindings :
- `SITE_MEGA_D1` → base `site-mega-d1`
- `SITE_MEGA_KV` → namespace `site-mega-kv`

Secret :
- `ADMIN_BOOTSTRAP_PASSWORD` → mot de passe du compte principal

Variable facultative :
- `ADMIN_EMAIL` → adresse du compte principal. Si absente, le serveur utilise l’adresse d’administration prévue par le projet.

Après ajout ou modification d’un secret/binding, redéployez le projet.
