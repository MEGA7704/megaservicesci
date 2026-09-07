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


## V10 — Nos réalisations
Galerie de 4 posters professionnels : GLOBAL MARKET, GLOBAL EMPLOI CI, GLOBAL BANK CI et GLOBAL BT CI, avec liens externes.


## V11 — Réalisations avec images réelles
La page Nos réalisations utilise maintenant de véritables captures visuelles des sites publiés.
Les miniatures sont chargées via un service de capture de page web et se mettent à jour avec les sites en ligne.


## V12 — Nos réalisations pleine page
- Section Nos réalisations en pleine largeur.
- 4 cartes affichées sur une seule ligne sur desktop.
- Suppression des entêtes de cartes type navigateur contenant les URLs.
- Conservation des images réelles des sites, des descriptions et des boutons de visite.


## V13 — Accueil
- Bouton « Demander un devis » ajouté aux cartes Services informatiques, Création de sites vitrines, Impression & reprographie et Intermédiation & services administratifs.
- Les boutons ouvrent Contact avec le service demandé dans l’URL.
- Hero remplacé par un nouveau visuel informatique professionnel.

## V14 — Refonte visuelle complète
- Remplacement de l'ancienne page d'accueil par la nouvelle identité sombre rouge-magenta inspirée de la maquette validée.
- Utilisation du nouveau hero avec l'équipe professionnelle.
- Arrière-plan et identité visuelle harmonisés sur Accueil, À propos, Services, Réalisations, Recrutement, Contact, Connexion et Administration.
- Conservation de toutes les fonctions Cloudflare D1/KV, authentification, recrutement, candidatures, contact et administration.
- Menu, boutons, cartes, formulaires et footer redessinés dans le même style.


## V15 — Nouveau design bleu nuit / or
- Nouvelle page d'accueil inspirée de la maquette fournie : hero bureau, identité bleu nuit et or, CTA devis/boutique, statistiques et 4 cartes de services.
- Nouveau header commun avec menu horizontal professionnel et bouton Connexion.
- Design harmonisé sur Accueil, À propos, Nos services, Nos réalisations, Nous recrutons, Contact, Connexion et Administration.
- Footer compact bleu nuit / or.
- Les fonctionnalités existantes D1/KV, authentification, recrutement, contact, candidatures et administration sont conservées.


## V16 — Nettoyage visuel
- Suppression du texte « Un service de qualité pour un meilleur demain ! ».
- Suppression des arrière-plans décoratifs généraux du site.
- Conservation d'un fond blanc propre pour les contenus.
- Hero simplifié : bloc bleu nuit à gauche + photo bureau à droite.
- Nouvelles icônes plus réalistes pour les 4 cartes de services de l'accueil.


## V17 — Refonte de la page À propos
- Nouvelle bannière premium bleu marine / blanc / doré.
- Bloc branding MEGA SERVICES SARL U.
- Cartes Notre mission / Notre vision.
- Suppression complète de la section « Informations de l’entreprise ».
- Nouvelle section Nos engagements avec 4 cartes.
- Bannière finale « Ensemble pour un quotidien plus simple ».
- Les autres pages, l’administration, D1/KV, recrutement et formulaires restent inchangés.


## V18 — Refonte Nos réalisations
- Page Nos réalisations reconstruite selon la maquette fournie.
- Hero bleu marine avec bureau professionnel, valeurs et accroche.
- 4 cartes sur une ligne sur grand écran.
- Aperçus réels des quatre sites conservés.
- Badges de secteur, statut En ligne et boutons Visiter le site.
- Bannière finale Notre engagement.
- Les fonctions du reste du site et de l'administration sont inchangées.


## V19 — Hero Nos réalisations
- Image du hero affichée entièrement avec `background-size: contain`.
- Visuel de bureau sans personnage.
- Suppression du texte décoratif superposé dans la zone image.
- Aucun changement aux cartes, liens, D1/KV ou fonctions d'administration.
