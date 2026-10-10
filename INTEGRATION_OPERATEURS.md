# Espace Opérateurs — intégration MEGA SERVICES

## Ajouts
- `/operateurs.html` : connexion/inscription, tableau privé, sélection de huit applications, menus de modules par application sans rechargement.
- `/assets/operators.js`, `operators.css`, `operators-catalog.json` : interface et catalogue documenté à partir des huit prompts fournis.
- `/api/operators/register`, `/login`, `/session`, `/logout` : comptes distincts de l'administration, PBKDF2, cookies HttpOnly Secure SameSite, limitation des tentatives, protection CSRF pour la déconnexion.
- Deux tables D1 additives créées au démarrage : `operators`, `operator_credentials`. Aucun compte administrateur préexistant n'est modifié.
- Lien « Opérateurs » dans le menu général.

## Limitation impérative
Les prompts décrivent des applications autonomes et ne fournissent ni leurs codes exécutables, ni leurs bases D1/KV, ni leurs interfaces de programmation. **Le portail ne fusionne donc pas les huit applications en un backend unique**. Les menus sont des entrées descriptives, pas des écrans métiers réimplémentés. Chaque application conserve sa propre authentification et ses données ; l'iframe d'accès peut être bloquée par CSP/X-Frame-Options de la plateforme distante. Un lien officiel est fourni systématiquement pour y accéder. L'adresse OUKAMI est indicative et doit être vérifiée avant production.

Pour une véritable exécution unifiée sous `megaservicesci`, fournir les huit ZIP et procéder à l'intégration par routes internes `/apps/<slug>/`, partage contrôlé des identités via SSO, migrations/bindings D1-KV isolés, et permissions serveur par application. Ne pas recopier les secrets ou mutualiser les données financières sans isolations et contrôles de conformité.

## Vérifications
- `node --check public/_worker.js`
- `node --check public/assets/operators.js`
- `node --check public/assets/app.js`
- Catalogue JSON décodable.
- **Non réalisés** : tests Cloudflare réels (bindings D1/KV, inscription, cookies), affichage des huit domaines dans les iframe, tests de sécurité dynamiques et workflows métiers. Tester ces fonctions sur une instance de préproduction avec vos bindings avant mise en production.

## Déploiement
La configuration `wrangler.jsonc` d'origine est conservée. Déployer le répertoire `public` via le pipeline habituel. L'initialisation D1 de cette version est additive et s'exécute par `ensureSchema`.
