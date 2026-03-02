# Acquisitions

[English](README.md) | **Français**

---

API **REST Express 5** prête pour la production (Node.js, modules ES) avec authentification **JWT**, base **Neon PostgreSQL** et **Drizzle ORM**. Sécurité gérée par **Arcjet** (détection de bots, limitation du débit, bouclier). Journalisation avec **Winston**.

---

## Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Structure du projet](#structure-du-projet)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Variables d'environnement](#variables-denvironnement)
- [Endpoints API](#endpoints-api)
- [Scripts](#scripts)
- [Base de données](#base-de-données)
- [Docker](#docker)
- [Tests](#tests)
- [Compétences pour un portfolio junior](#compétences-pour-un-portfolio-junior)
- [TODO](#todo)

---

## Fonctionnalités

- **API REST** – API JSON avec health check et routes versionnées (`/api/*`)
- **Authentification JWT** – Inscription, connexion, déconnexion ; jetons dans des cookies httpOnly (cookie 15 min, JWT 1 jour)
- **Accès par rôle** – `user` et `admin` ; les utilisateurs gèrent leur profil, les admins gèrent tous les utilisateurs et rôles
- **Sécurité** – Arcjet : détection de bots, bouclier (ex. injection SQL), limites par rôle (admin 20/min, user 10/min, invité 5/min)
- **Validation** – Corps des requêtes validés avec **Zod**
- **Architecture en couches** – Routes → Controllers → Services → Drizzle ORM → Neon PostgreSQL
- **Logs** – Winston (fichier + console hors production)
- **Docker** – Environnements de développement (Neon Local + app) et production avec Compose

---

## Stack technique

| Couche     | Technologie                |
| ---------- | -------------------------- |
| Runtime    | Node.js 22 (ES modules)    |
| Framework  | Express 5                  |
| Base de données | Neon PostgreSQL      |
| ORM        | Drizzle ORM                |
| Auth       | JWT (jsonwebtoken), bcrypt |
| Sécurité   | Arcjet, Helmet, CORS       |
| Validation | Zod                        |
| Logs       | Winston, Morgan            |
| Tests      | Jest, Supertest            |
| Lint/Format | ESLint, Prettier          |

---

## Structure du projet

```
acquisitions/
├── src/
│   ├── index.js              # Point d'entrée : dotenv → server
│   ├── server.js             # Express listen
│   ├── app.js                # App Express, middleware, routes
│   ├── config/
│   │   ├── database.js       # Client Neon + Drizzle
│   │   ├── arcjet.js         # Arcjet (bouclier, bot, rate limit)
│   │   └── logger.js         # Winston logger
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   └── users.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js    # JWT depuis cookie → req.user
│   │   └── security.middleware.js # Arcjet par requête
│   ├── models/
│   │   └── user.model.js     # Table users Drizzle
│   ├── routes/
│   │   ├── auth.routes.js    # /api/auth/*
│   │   └── users.routes.js   # /api/users/* (protégé)
│   ├── services/
│   │   ├── auth.service.js
│   │   └── users.services.js
│   ├── validations/
│   │   ├── auth.validation.js
│   │   └── users.validation.js
│   └── utils/
│       ├── cookies.js       # Helpers cookies httpOnly
│       ├── format.js        # Formatage erreurs de validation
│       └── jwt.js           # JWT sign/verify
├── drizzle/                 # Migrations (générées)
├── drizzle.config.js
├── scripts/
│   ├── dev.sh               # Docker Compose dev
│   └── prod.sh              # Docker Compose prod
├── tests/
│   └── app.test.js          # Supertest health / api / 404
├── logs/                    # Logs Winston (gitignore)
├── Dockerfile               # Multi-stage Node 22 Alpine
├── docker-compose.dev.yml   # Neon Local + app
├── docker-compose.prod.yml  # App seule (Neon Cloud)
├── AGENTS.md                # Guide pour agents/éditeurs
├── DOCKER.md                # Guide Docker
└── package.json             # Scripts, imports (alias de chemins)
```

Alias de chemins (dans `package.json`) : `#config/*`, `#controllers/*`, `#middleware/*`, `#models/*`, `#services/*`, `#utils/*`, `#validations/*`, `#routes/*` → `./src/*`.

---

## Prérequis

- **Node.js** 22+
- **npm** (ou gestionnaire de paquets compatible)
- **PostgreSQL** (Neon Cloud ou local) ; pour Docker en dev : **Docker** et **Docker Compose**
- Clé API **Arcjet** sur [arcjet.com](https://arcjet.com)
- Compte **Neon** et `DATABASE_URL` sur [neon.tech](https://neon.tech) (et pour Neon Local : `NEON_API_KEY`, `NEON_PROJECT_ID` — voir [DOCKER.md](DOCKER.md))

---

## Installation

### 1. Cloner et installer

```bash
git clone https://github.com/Ilias-Sh/acquisitions.git
cd acquisitions
npm install
```

### 2. Environnement

Créer les fichiers d'environnement (ils sont dans le .gitignore). Aucun `.env.example` n'est fourni pour l'instant — voir [Variables d'environnement](#variables-denvironnement) pour les clés requises.

- **Local / dev sans Docker :** créer `.env` à la racine avec au minimum `DATABASE_URL`, `ARCJET_KEY`, et optionnellement `JWT_SECRET`, `PORT`, `LOG_LEVEL`, `NODE_ENV`.
- **Docker dev :** créer `.env.development` (voir [DOCKER.md](DOCKER.md)).
- **Docker prod :** créer `.env.production` (voir [DOCKER.md](DOCKER.md)).

**TODO :** Ajouter un `.env.example` avec tous les noms de variables et des valeurs factices.

### 3. Base de données

Pointer `DATABASE_URL` vers votre instance Neon (ou Postgres). Puis lancer les migrations :

```bash
npm run db:migrate
```

Optionnel : ouvrir Drizzle Studio :

```bash
npm run db:studio
```

### 4. Lancer l'application

**Sans Docker :**

```bash
npm run dev
```

Utilise `node --watch src/index.js`. URL par défaut : `http://localhost:3000` (ou `PORT` dans l'env).

**Avec Docker (stack de développement) :**

```bash
npm run dev:docker
```

Nécessite `.env.development` et Docker. Démarre Neon Local + l'app (voir [DOCKER.md](DOCKER.md)).

**Avec Docker (style production) :**

```bash
npm run prod:docker
```

Nécessite `.env.production` et Docker. Démarre uniquement l'app ; utilise Neon Cloud via `DATABASE_URL`.

---

## Variables d'environnement

| Variable         | Requise | Défaut     | Description |
| ---------------- | -------- | ---------- | ----------- |
| `NODE_ENV`       | Non      | —          | `development` ou `production`. Affecte la config client Neon et les logs console. |
| `PORT`           | Non      | `3000`     | Port du serveur. |
| `DATABASE_URL`   | Oui      | —          | Chaîne de connexion Neon PostgreSQL. Utiliser une URL en pool en production. |
| `ARCJET_KEY`     | Oui      | —          | Clé API Arcjet (bot/bouclier/rate limit). |
| `JWT_SECRET`     | Non*     | (défaut dans le code) | Secret pour la signature JWT. **À définir en production.** |
| `LOG_LEVEL`      | Non      | `info`     | Niveau de log Winston (ex. `debug`, `info`, `warn`, `error`). |
| `NEON_API_KEY`   | Pour Neon Local | —    | Clé API Neon (Docker dev avec Neon Local). |
| `NEON_PROJECT_ID`| Pour Neon Local | —    | ID projet Neon (Docker dev avec Neon Local). |

*Si `JWT_SECRET` est absent, l'app utilise un défaut dans le code ; ne pas s'y fier en production.

---

## Endpoints API

URL de base : `http://localhost:3000` (ou votre `PORT`).

### Public

| Méthode | Chemin      | Description |
| ------- | ----------- | ----------- |
| GET     | `/`         | Message simple : `Hello from Acquisitions!` |
| GET     | `/health`   | Health check : `{ status, timestamp, uptime }` |
| GET     | `/api`      | Message API : `{ message: "Acquisition API is running!" }` |

### Auth (`/api/auth`)

Toutes les réponses auth définissent ou effacent le cookie httpOnly `token`. Envoyer les cookies pour les routes protégées.

| Méthode | Chemin           | Body (JSON) | Description |
| ------- | ---------------- | ----------- | ----------- |
| POST    | `/api/auth/sign-up` | `{ name, email, password, role? }` | Inscription. `role` : `"user"` \| `"admin"` (défaut `"user"`). Retourne `201` et l'utilisateur (sans mot de passe). |
| POST    | `/api/auth/sign-in` | `{ email, password }` | Connexion. Retourne `200` et l'utilisateur (sans mot de passe). |
| POST    | `/api/auth/sign-out` | — | Efface le cookie auth. Retourne `200`. |

**Validation (sign-up) :** `name` 2–255 caractères ; `email` email valide, max 255 ; `password` 6–128 caractères ; `role` optionnel, `user` ou `admin`.  
**Validation (sign-in) :** `email` valide ; `password` non vide.

**Erreurs :** `400` validation (body `details`) ; `401` identifiants invalides ; `409` email déjà existant.

### Utilisateurs (`/api/users`) — Protégé (JWT requis)

JWT valide dans le cookie `token` (défini par sign-in/sign-up). Règles de rôle : un user peut lire/modifier/supprimer uniquement son propre enregistrement ; les admins peuvent tout faire. Seuls les admins peuvent modifier `role`.

| Méthode | Chemin             | Body (JSON) | Description |
| ------- | ------------------ | ----------- | ----------- |
| GET     | `/api/users`       | —           | Liste tous les utilisateurs. Retourne `{ message, users, count }`. |
| GET     | `/api/users/:id`   | —           | Utilisateur par id. `:id` entier positif. |
| PUT     | `/api/users/:id`   | `{ name?, email?, password?, role? }` | Mise à jour. Changement de rôle uniquement si admin. |
| DELETE  | `/api/users/:id`   | —           | Supprimer l'utilisateur (soi-même ou admin). |

**Validation (params) :** `id` coercé en entier positif.  
**Validation (body update) :** `name` 2–255 ; `email` valide, max 255 ; `password` 6–128 ; `role` `user` \| `admin`. Tous les champs optionnels.

**Erreurs :** `400` validation ; `401` token absent/invalide ; `403` interdit (ex. non-admin qui change le rôle) ; `404` utilisateur introuvable.

### Global

- **404** – Toute route inconnue retourne `{ error: "Route not found" }`.
- **Sécurité** – Arcjet peut retourner `403` pour bots, bouclier ou dépassement de limite (message dans le body).

---

## Scripts

| Commande            | Description |
| ------------------- | ----------- |
| `npm run dev`       | Démarrer avec `node --watch` (nécessite `DATABASE_URL`, `ARCJET_KEY`). |
| `npm start`         | Démarrer une fois : `node src/index.js`. |
| `npm run dev:docker`   | Stack dev : Neon Local + app (nécessite `.env.development`). |
| `npm run prod:docker`  | Stack prod : app seule (nécessite `.env.production`). |
| `npm run lint`      | Vérification ESLint. |
| `npm run lint:fix`  | Correction automatique ESLint. |
| `npm run format`    | Écriture Prettier. |
| `npm run format:check` | Vérification Prettier. |
| `npm run db:generate` | Drizzle : générer une migration depuis `src/models/*.js`. |
| `npm run db:migrate`  | Drizzle : appliquer les migrations. |
| `npm run db:studio`   | Interface Drizzle Studio. |
| `npm test`         | Jest (Supertest) avec `NODE_OPTIONS=--experimental-vm-modules`. |

---

## Base de données

- **Schéma :** Définitions de tables Drizzle dans `src/models/*.js` ; migrations générées dans `drizzle/`.
- **Connexion :** `src/config/database.js` exporte `db` (Drizzle) et `sql` (client Neon). En `NODE_ENV=development`, le client Neon est configuré pour `http://neon-local:5432/sql` en Docker avec Neon Local.
- **Table users :** `id`, `name`, `email` (unique), `password` (hashé), `role`, `created_at`, `updated_at`.

---

## Docker

- **Développement :** `docker-compose.dev.yml` — Neon Local + app avec rechargement à chaud ; l'app parle à Neon Local dans le réseau. Voir [DOCKER.md](DOCKER.md) pour les variables d'env et les commandes de migration.
- **Production :** `docker-compose.prod.yml` — app seule ; utiliser `DATABASE_URL` Neon Cloud (préférer l'endpoint en pool).
- **Image :** `Dockerfile` — multi-stage Node 22 Alpine ; utilisateur non-root ; health check sur `/health` ; expose le port `3000`.

---

## Tests

- **Exécution :** Jest avec Supertest ; modules ES via `NODE_OPTIONS=--experimental-vm-modules`.
- **Couverture :** `npm test` (config dans `jest.config.mjs`).
- **Tests actuels :** `tests/app.test.js` — GET `/health` (status, timestamp, uptime), GET `/api` (message), GET route inexistante (404).

**TODO :** Ajouter des tests pour les endpoints auth et users (avec/sans JWT, rôles).

---

## Compétences pour un portfolio junior

Ce dépôt illustre :

- **Conception d'API REST** – Routes claires, codes HTTP, corps JSON et formes d'erreurs.
- **Backend en couches** – Séparation routes, controllers, services et accès données.
- **Authentification et autorisation** – JWT dans des cookies httpOnly, accès par rôle (user vs admin).
- **Validation** – Schémas Zod et formatage d'erreurs cohérent.
- **Sécurité** – Helmet, CORS, Arcjet (rate limiting, détection de bots, bouclier), bcrypt pour les mots de passe.
- **Base de données** – Drizzle ORM, migrations, requêtes typées, driver serverless Neon.
- **DevOps / outillage** – Docker Compose dev et prod, Dockerfile multi-stage, health checks.
- **Qualité de code** – ESLint, Prettier, alias de chemins, modules ES.
- **Logs** – Journalisation structurée avec Winston et requêtes avec Morgan.
- **Tests** – Jest + Supertest pour les endpoints HTTP.

---

## TODO

- [ ] Ajouter un `.env.example` avec tous les noms de variables et des valeurs factices sûres.
- [ ] Ajouter des tests d'intégration/API pour `/api/auth/*` et `/api/users/*` (auth, rôles, validation).
- [ ] Corriger la typo dans `scripts/dev.sh` : l'URL affichée indique `5173` ; l'app tourne sur `PORT` (défaut `3000`).
- [ ] (Optionnel) Corriger la typo dans les réponses du middleware de sécurité : `"Frobidden"` → `"Forbidden"`.

---

## Licence

ISC.
