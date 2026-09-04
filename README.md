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


## V7 — correction connexion administrateur
- PBKDF2 ramené à 100 000 itérations pour éviter un dépassement de temps CPU au premier bootstrap Cloudflare.
- Création du compte principal en deux écritures D1 contrôlées.
- Nettoyage automatique si l'écriture des identifiants échoue.
- Retour d'un code de diagnostic serveur non sensible en cas d'erreur.
- Aucun mot de passe ni secret n'est envoyé dans l'URL ou inclus dans le dépôt.


## V8 — formulaire de candidature en popup
- La section « CANDIDATURE / Demande d’emploi » n’est plus affichée en permanence dans la page.
- Un bouton « Déposer ma candidature » ouvre désormais le formulaire dans une fenêtre popup professionnelle.
- Le bouton « Postuler à cette offre » ouvre le même popup avec l’offre correspondante déjà sélectionnée.
- Fermeture possible par le bouton ×, clic sur l’arrière-plan ou touche Échap.


## V9 — informations officielles MEGA SERVICES SARL U
- Téléphone / WhatsApp : +225 0777041790
- E-mail : megaservicediabo@gmail.com
- RCCM : CI-BKE-2020-B-1150
- Compte contribuable : 2039493 M
- Siège social : Diabo
- Footer réduit en hauteur et rendu plus compact.
