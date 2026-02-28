# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Acquisitions is an Express 5 REST API (Node.js, ES modules) with JWT-based auth, backed by a Neon PostgreSQL database via Drizzle ORM. Security is handled by Arcjet (bot detection, rate limiting, shield). Logging uses Winston.

## Commands

### Development

```sh
npm run dev              # Start with --watch (requires DATABASE_URL + ARCJET_KEY in env)
npm run dev:docker       # Start full stack via Docker Compose (Neon Local + app, uses .env.development)
npm run prod:docker      # Production Docker Compose (uses .env.production)
```

### Lint & Format

```sh
npm run lint             # ESLint check
npm run lint:fix         # ESLint autofix
npm run format           # Prettier write
npm run format:check     # Prettier check
```

### Database (Drizzle)

```sh
npm run db:generate      # Generate migration SQL from model changes (drizzle-kit generate)
npm run db:migrate       # Apply migrations (drizzle-kit migrate)
npm run db:studio        # Open Drizzle Studio GUI
```

Schema files live in `src/models/*.js`. Migrations output to `drizzle/`.

## Architecture

### Layered request flow

```
Routes → Controllers → Services → Drizzle ORM → Neon PostgreSQL
                ↑
          Validations (Zod)
```

- **Routes** (`src/routes/`) – define endpoints and wire controllers.
- **Controllers** (`src/controllers/`) – validate input via Zod schemas, call services, format HTTP responses.
- **Services** (`src/services/`) – contain business logic and all database access through Drizzle.
- **Models** (`src/models/`) – Drizzle table definitions (pgTable). These are the source of truth for the schema.
- **Validations** (`src/validations/`) – Zod schemas used by controllers for request body parsing.

### Path aliases

The project uses Node.js subpath imports (configured in `package.json` `"imports"` field):

```
#config/*        → ./src/config/*
#controllers/*   → ./src/controllers/*
#middleware/*     → ./src/middleware/*
#models/*        → ./src/models/*
#services/*      → ./src/services/*
#utils/*         → ./src/utils/*
#validations/*   → ./src/validations/*
#routes/*        → ./src/routes/*
```

Always use these aliases for cross-directory imports inside `src/`.

### Entrypoint

`src/index.js` → loads dotenv → imports `src/server.js` → imports `src/app.js` (Express setup + middleware + routes).

### Security middleware

`src/middleware/security.middleware.js` runs on every request via Arcjet. It applies role-based rate limits (admin: 20/min, user: 10/min, guest: 5/min) and blocks bots and shield-flagged requests.

### Database

- In development (`NODE_ENV=development`), the Neon client connects to a local Neon proxy container (`neon-local:5432`).
- In production, it connects directly to Neon Cloud via `DATABASE_URL`.
- Config: `src/config/database.js`. Exports `db` (Drizzle instance) and `sql` (raw Neon client).

### Auth

JWT tokens are signed/verified via `src/utils/jwt.js` and stored as httpOnly cookies via `src/utils/cookies.js` (15-minute expiry on cookie, 1-day expiry on JWT).

## Code Style

- ES modules (`"type": "module"` in package.json) – use `import`/`export`, not `require`.
- 2-space indent, single quotes, semicolons required, trailing comma `es5`, LF line endings.
- Prefix unused function params with `_` (eslint `argsIgnorePattern: "^_"`).
- Use `const` over `let`; `var` is forbidden. Use object shorthand and arrow callbacks.

## Environment Variables

Key variables (see `.env.development` / `.env.production`):

- `NODE_ENV` – `development` or `production` (controls Neon local vs cloud, console logging)
- `DATABASE_URL` – Neon PostgreSQL connection string
- `ARCJET_KEY` – Arcjet API key
- `JWT_SECRET` – secret for JWT signing (falls back to a default in code—must be set in production)
- `PORT` – server port (default 3000)
- `LOG_LEVEL` – Winston log level (default `info`)
