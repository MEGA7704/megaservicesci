# Architecture multi-applications — MEGA SERVICES

## Livré
- Copies complètes des HUIT projets fournis dans `applications/<nom>/` : code métier préservé, Workers, assets et migrations.
- Passerelle `GET/POST/PUT/... /operateurs/modules/<nom>/*` intégrée au Worker MEGA, contrôlant une session opérateur avant le routage.
- Catalogue avec liens exclusivement internes et cadres embarqués sous le même site MEGA.
- Service bindings Cloudflare configurés dans `wrangler.jsonc` (noms cibles `mega-<nom>-worker` à déployer).

## Conditions indispensables (NON automatisées)
1. Déployer chaque moteur séparément en Worker Cloudflare sous le nom de service prévu. Adapter leur configuration individuelle à Workers, leurs fichiers statiques/Pages, leur routage interne, et leurs éventuels Durable Objects, migrations et assets.
2. Fournir les bindings D1/KV exacts pour CHAQUE application. Conserver une base isolée par moteur et la séparation `company_id` / `bank_id` en son sein. Ne jamais brancher toutes les apps sur la base mère.
3. Le système de connexion MEGA protège l'accès à la passerelle. Les systèmes d'authentification métiers d'origine ne sont PAS remplacés. Les cookies des sous-applications ne sont pas propagés par la passerelle ; les formulaires métier nécessitent donc un chantier de SSO vérifié par application. **Ne pas exploiter en production** en l'état.
4. Les chemins absolus `/api`, `/assets`, etc. dans les applications d'origine doivent être rendus compatibles avec le préfixe `/operateurs/modules/<nom>`, avant que chaque écran fonctionne dans l'iframe. Chaque code a ses propres routes et références absolues, non réécrites ici.
5. Définir une fédération d'identité serveur-vers-serveur avec assertions signées limitées (audience, issuer, expiry, nonce, permissions), établir une session native par application, et valider toute autorisation métier côté serveur. Ne jamais faire confiance aux identifiants envoyés par le navigateur.
6. Exécuter migrations, contrôles de versions, tests d'intégrité financière et d'isolation, tests CSRF, RBAC, tests navigateur et validations sur staging avec sauvegarde préalable.

## Statut
C'est un monorepo de SOURCES et une passerelle centralisée opérationnelle quand ses services sont déployés/configurés, pas un produit terminé : login unique de bout en bout, menus métiers fonctionnels sans double login, chemins internes et déploiement restent à finaliser. Aucun ancien site externe requis dans le catalogue ; aucun moteur métier remplacé par un écran fictif.
