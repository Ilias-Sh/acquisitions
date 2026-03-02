# Acquisitions

**English** | [Français](README.fr.md)

---

A production-ready **Express 5 REST API** (Node.js, ES modules) with JWT-based authentication, backed by **Neon PostgreSQL** via **Drizzle ORM**. Security is handled by **Arcjet** (bot detection, rate limiting, shield). Logging uses **Winston**.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Scripts](#scripts)
- [Database](#database)
- [Docker](#docker)
- [Testing](#testing)
- [Skills for Junior Developer Portfolio](#skills-for-junior-developer-portfolio)
- [TODO](#todo)

---

## Features

- **REST API** – JSON API with health check and versioned routes (`/api/*`)
- **JWT authentication** – Sign up, sign in, sign out; tokens in httpOnly cookies (15 min cookie, 1d JWT)
- **Role-based access** – `user` and `admin`; users can manage own profile, admins can manage all users and roles
- **Security** – Arcjet: bot detection, shield (e.g. SQL injection), role-based rate limits (admin 20/min, user 10/min, guest 5/min)
- **Validation** – Request bodies validated with **Zod**
- **Layered architecture** – Routes → Controllers → Services → Drizzle ORM → Neon PostgreSQL
- **Logging** – Winston (file + console in non-production)
- **Docker** – Development (Neon Local + app) and production Compose setups

---

## Tech Stack

| Layer        | Technology                    |
| ------------ | ----------------------------- |
| Runtime      | Node.js 22 (ES modules)       |
| Framework    | Express 5                     |
| Database     | Neon PostgreSQL               |
| ORM          | Drizzle ORM                   |
| Auth         | JWT (jsonwebtoken), bcrypt    |
| Security     | Arcjet, Helmet, CORS          |
| Validation   | Zod                           |
| Logging      | Winston, Morgan              |
| Testing      | Jest, Supertest               |
| Lint/Format  | ESLint, Prettier              |

---

## Project Structure

```
acquisitions/
├── src/
│   ├── index.js              # Entry: dotenv → server
│   ├── server.js             # Express listen
│   ├── app.js                # Express app, middleware, routes
│   ├── config/
│   │   ├── database.js       # Neon + Drizzle client
│   │   ├── arcjet.js         # Arcjet (shield, bot, rate limit)
│   │   └── logger.js         # Winston logger
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   └── users.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js    # JWT from cookie → req.user
│   │   └── security.middleware.js # Arcjet per-request
│   ├── models/
│   │   └── user.model.js     # Drizzle users table
│   ├── routes/
│   │   ├── auth.routes.js    # /api/auth/*
│   │   └── users.routes.js   # /api/users/* (protected)
│   ├── services/
│   │   ├── auth.service.js
│   │   └── users.services.js
│   ├── validations/
│   │   ├── auth.validation.js
│   │   └── users.validation.js
│   └── utils/
│       ├── cookies.js       # httpOnly cookie helpers
│       ├── format.js        # Validation error formatting
│       └── jwt.js           # JWT sign/verify
├── drizzle/                 # Migrations (generated)
├── drizzle.config.js
├── scripts/
│   ├── dev.sh               # Dev Docker Compose
│   └── prod.sh              # Prod Docker Compose
├── tests/
│   └── app.test.js          # Supertest health / api / 404
├── logs/                    # Winston logs (gitignored)
├── Dockerfile               # Multi-stage Node 22 Alpine
├── docker-compose.dev.yml   # Neon Local + app
├── docker-compose.prod.yml  # App only (Neon Cloud)
├── AGENTS.md                # Agent/editor guidance
├── DOCKER.md                # Docker setup guide
└── package.json             # Scripts, imports (path aliases)
```

Path aliases (in `package.json`): `#config/*`, `#controllers/*`, `#middleware/*`, `#models/*`, `#services/*`, `#utils/*`, `#validations/*`, `#routes/*` → `./src/*`.

---

## Prerequisites

- **Node.js** 22+
- **npm** (or compatible package manager)
- **PostgreSQL** (Neon Cloud or local); for Docker dev: **Docker** and **Docker Compose**
- **Arcjet** API key from [arcjet.com](https://arcjet.com)
- **Neon** account and `DATABASE_URL` from [neon.tech](https://neon.tech) (and for Neon Local: `NEON_API_KEY`, `NEON_PROJECT_ID` — see [DOCKER.md](DOCKER.md))

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/Ilias-Sh/acquisitions.git
cd acquisitions
npm install
```

### 2. Environment

Create environment files (they are gitignored). No `.env.example` is provided yet — see [Environment Variables](#environment-variables) for required keys.

- **Local / dev without Docker:** create `.env` in the project root with at least `DATABASE_URL`, `ARCJET_KEY`, and optionally `JWT_SECRET`, `PORT`, `LOG_LEVEL`, `NODE_ENV`.
- **Docker dev:** create `.env.development` (see [DOCKER.md](DOCKER.md)).
- **Docker prod:** create `.env.production` (see [DOCKER.md](DOCKER.md)).

**TODO:** Add `.env.example` to the repo with all variable names and placeholder values.

### 3. Database

Point `DATABASE_URL` to your Neon (or Postgres) instance. Then run migrations:

```bash
npm run db:migrate
```

Optional: open Drizzle Studio:

```bash
npm run db:studio
```

### 4. Run the app

**Without Docker:**

```bash
npm run dev
```

Uses `node --watch src/index.js`. Default URL: `http://localhost:3000` (or `PORT` from env).

**With Docker (development stack):**

```bash
npm run dev:docker
```

Requires `.env.development` and Docker. Starts Neon Local + app (see [DOCKER.md](DOCKER.md)).

**With Docker (production-style):**

```bash
npm run prod:docker
```

Requires `.env.production` and Docker. Starts app only; uses Neon Cloud via `DATABASE_URL`.

---

## Environment Variables

| Variable         | Required | Default     | Description |
| ---------------- | -------- | ----------- | ----------- |
| `NODE_ENV`       | No       | —           | `development` or `production`. Affects Neon client config and console logging. |
| `PORT`           | No       | `3000`      | Server port. |
| `DATABASE_URL`   | Yes      | —           | Neon PostgreSQL connection string. Use pooled URL in production. |
| `ARCJET_KEY`     | Yes      | —           | Arcjet API key (bot/shield/rate limit). |
| `JWT_SECRET`     | No*      | (in-code default) | Secret for JWT signing. **Must be set in production.** |
| `LOG_LEVEL`      | No       | `info`      | Winston log level (e.g. `debug`, `info`, `warn`, `error`). |
| `NEON_API_KEY`   | For Neon Local | —     | Neon API key (Docker dev with Neon Local). |
| `NEON_PROJECT_ID`| For Neon Local | —     | Neon project ID (Docker dev with Neon Local). |

*If `JWT_SECRET` is missing, the app falls back to a default in code; do not rely on this in production.

---

## API Endpoints

Base URL: `http://localhost:3000` (or your `PORT`).

### Public

| Method | Path       | Description |
| ------ | ---------- | ----------- |
| GET    | `/`        | Simple greeting: `Hello from Acquisitions!` |
| GET    | `/health`  | Health check: `{ status, timestamp, uptime }` |
| GET    | `/api`     | API message: `{ message: "Acquisition API is running!" }` |

### Auth (`/api/auth`)

All auth responses set or clear the `token` httpOnly cookie. Send cookies with subsequent requests for protected routes.

| Method | Path         | Body (JSON) | Description |
| ------ | ------------ | ----------- | ----------- |
| POST   | `/api/auth/sign-up` | `{ name, email, password, role? }` | Register. `role`: `"user"` \| `"admin"` (default `"user"`). Returns `201` and user (no password). |
| POST   | `/api/auth/sign-in` | `{ email, password }` | Sign in. Returns `200` and user (no password). |
| POST   | `/api/auth/sign-out` | — | Clear auth cookie. Returns `200`. |

**Validation (sign-up):** `name` 2–255 chars; `email` valid email, max 255; `password` 6–128 chars; `role` optional, `user` or `admin`.  
**Validation (sign-in):** `email` valid; `password` non-empty.

**Errors:** `400` validation (body `details`); `401` invalid credentials; `409` email already exists.

### Users (`/api/users`) — Protected (JWT required)

Requires valid JWT in `token` cookie (set by sign-in/sign-up). Role rules: users can read/update/delete only their own record; admins can do all. Only admins can change `role`.

| Method | Path              | Body (JSON) | Description |
| ------ | ----------------- | ----------- | ----------- |
| GET    | `/api/users`      | —           | List all users. Returns `{ message, users, count }`. |
| GET    | `/api/users/:id`  | —           | Get user by id. `:id` positive integer. |
| PUT    | `/api/users/:id`  | `{ name?, email?, password?, role? }` | Update user. Role change only if admin. |
| DELETE | `/api/users/:id`  | —           | Delete user (self or admin). |

**Validation (params):** `id` coerce to positive integer.  
**Validation (update body):** `name` 2–255; `email` valid, max 255; `password` 6–128; `role` `user` \| `admin`. All fields optional.

**Errors:** `400` validation; `401` no/invalid token; `403` forbidden (e.g. non-admin changing role); `404` user not found.

### Global

- **404** – Any unknown path returns `{ error: "Route not found" }`.
- **Security** – Arcjet may return `403` for bots, shield, or rate limit (message in body).

---

## Scripts

| Command           | Description |
| ----------------- | ----------- |
| `npm run dev`     | Start with `node --watch` (needs `DATABASE_URL`, `ARCJET_KEY`). |
| `npm start`       | Start once: `node src/index.js`. |
| `npm run dev:docker` | Dev stack: Neon Local + app (needs `.env.development`). |
| `npm run prod:docker` | Prod stack: app only (needs `.env.production`). |
| `npm run lint`    | ESLint check. |
| `npm run lint:fix`| ESLint autofix. |
| `npm run format`  | Prettier write. |
| `npm run format:check` | Prettier check. |
| `npm run db:generate` | Drizzle: generate migration from `src/models/*.js`. |
| `npm run db:migrate`  | Drizzle: apply migrations. |
| `npm run db:studio`   | Drizzle Studio GUI. |
| `npm test`        | Jest (Supertest) with `NODE_OPTIONS=--experimental-vm-modules`. |

---

## Database

- **Schema:** Drizzle table definitions in `src/models/*.js`; migrations generated into `drizzle/`.
- **Connection:** `src/config/database.js` exports `db` (Drizzle) and `sql` (Neon client). In `NODE_ENV=development`, the Neon client is configured to use `http://neon-local:5432/sql` when running in Docker with Neon Local.
- **User table:** `id`, `name`, `email` (unique), `password` (hashed), `role`, `created_at`, `updated_at`.

---

## Docker

- **Development:** `docker-compose.dev.yml` — Neon Local + app with hot reload; app talks to Neon Local inside the network. See [DOCKER.md](DOCKER.md) for env vars and migration commands.
- **Production:** `docker-compose.prod.yml` — app only; use Neon Cloud `DATABASE_URL` (prefer pooled endpoint).
- **Image:** `Dockerfile` — multi-stage Node 22 Alpine; non-root user; health check on `/health`; exposes `3000`.

---

## Testing

- **Runner:** Jest with Supertest; ES modules via `NODE_OPTIONS=--experimental-vm-modules`.
- **Coverage:** `npm test` (config in `jest.config.mjs`).
- **Current tests:** `tests/app.test.js` — GET `/health` (status, timestamp, uptime), GET `/api` (message), GET non-existent route (404).

**TODO:** Add tests for auth and users endpoints (with/without JWT, roles).

---

## Skills for Junior Developer Portfolio

This repo demonstrates:

- **REST API design** – Clear routes, status codes, JSON bodies, and error shapes.
- **Layered backend** – Separation of routes, controllers, services, and data access.
- **Authentication & authorization** – JWT in httpOnly cookies, role-based access (user vs admin).
- **Validation** – Zod schemas and consistent error formatting.
- **Security** – Helmet, CORS, Arcjet (rate limiting, bot detection, shield), bcrypt for passwords.
- **Database** – Drizzle ORM, migrations, type-safe queries, Neon serverless driver.
- **DevOps / tooling** – Docker Compose for dev and prod, multi-stage Dockerfile, health checks.
- **Code quality** – ESLint, Prettier, path aliases, ES modules.
- **Logging** – Structured logging with Winston and request logging with Morgan.
- **Testing** – Jest + Supertest for HTTP endpoints.

---

## TODO

- [ ] Add `.env.example` with all variable names and safe placeholders.
- [ ] Add integration/API tests for `/api/auth/*` and `/api/users/*` (auth, roles, validation).
- [ ] Fix typo in `scripts/dev.sh`: printed URL says `5173`; app runs on `PORT` (default `3000`).
- [ ] (Optional) Fix typo in security middleware responses: `"Frobidden"` → `"Forbidden"`.

---

## License

ISC.
