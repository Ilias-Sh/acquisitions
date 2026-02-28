# Docker Setup Guide

This guide explains how to run the Acquisitions API using Docker with different configurations for development and production environments.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Environment](#development-environment)
- [Production Environment](#production-environment)
- [Environment Variables](#environment-variables)
- [Database Migrations](#database-migrations)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Development Architecture

```
┌─────────────────────────────────────────────┐
│  Docker Compose (dev)                       │
│                                             │
│  ┌──────────────┐      ┌─────────────────┐ │
│  │              │      │                 │ │
│  │  App         │─────▶│  Neon Local     │ │
│  │  Container   │      │  Proxy          │ │
│  │              │      │                 │ │
│  └──────────────┘      └─────────────────┘ │
│       │                        │           │
└───────┼────────────────────────┼───────────┘
        │                        │
        │                        ▼
        │              ┌──────────────────────┐
        │              │  Neon Cloud          │
        │              │  (Ephemeral Branch)  │
        └─────────────▶│                      │
         (migrations)  └──────────────────────┘
```

**Key Points:**
- **Neon Local** acts as a proxy that creates ephemeral database branches
- App connects to `neon-local:5432` inside Docker network
- Neon Local automatically creates/deletes branches on container start/stop
- Migrations still run against Neon Cloud using `DATABASE_URL`

### Production Architecture

```
┌─────────────────────────┐
│  Docker Compose (prod)  │
│                         │
│  ┌──────────────┐       │
│  │              │       │
│  │  App         │       │
│  │  Container   │       │
│  │              │       │
│  └──────────────┘       │
│         │               │
└─────────┼───────────────┘
          │
          ▼
┌──────────────────────┐
│  Neon Cloud          │
│  (Production DB)     │
│  with Connection     │
│  Pooling             │
└──────────────────────┘
```

**Key Points:**
- Direct connection to Neon Cloud production database
- No Neon Local proxy in production
- Uses connection pooling for optimal performance

---

## Prerequisites

1. **Docker Desktop** (or Docker Engine + Docker Compose)
   - [Install Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
   - Ensure Docker is running before proceeding

2. **Neon Account**
   - Sign up at [neon.tech](https://neon.tech)
   - Create a project and database
   - Note your project ID and database URL

3. **Neon API Key**
   - Generate from: https://console.neon.tech/app/settings/api-keys
   - Required for Neon Local to create ephemeral branches

4. **Arcjet Account**
   - Sign up at [arcjet.com](https://arcjet.com)
   - Create a site and get your API key

---

## Quick Start

### 1. Clone and Setup

```powershell
# Navigate to project directory
cd C:\Users\user\Desktop\acquisitions

# Copy environment templates
cp .env.development .env.development.local
cp .env.production .env.production.local
```

### 2. Configure Development Environment

Edit `.env.development.local` and fill in your credentials:

```env
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# Get from: https://console.neon.tech/app/settings/api-keys
NEON_API_KEY=your_actual_neon_api_key
NEON_PROJECT_ID=your_actual_project_id

# Get from: Neon project dashboard
DATABASE_URL=postgres://user:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require

# Get from: https://app.arcjet.com
ARCJET_KEY=your_actual_arcjet_key
```

### 3. Start Development Environment

```powershell
docker-compose -f docker-compose.dev.yml --env-file .env.development.local up
```

The application will be available at: http://localhost:3000

### 4. Stop Development Environment

```powershell
# Stop and remove containers
docker-compose -f docker-compose.dev.yml down

# Stop and remove containers + volumes
docker-compose -f docker-compose.dev.yml down -v
```

---

## Development Environment

### Features

- ✅ **Hot Reload** - Source code changes are reflected immediately
- ✅ **Ephemeral Branches** - Fresh database branch for each session
- ✅ **Neon Local Proxy** - Local Postgres interface to Neon Cloud
- ✅ **Debug Logging** - Detailed logs for development

### Starting Development Server

```powershell
# Using docker-compose directly
docker-compose -f docker-compose.dev.yml --env-file .env.development.local up

# With rebuild
docker-compose -f docker-compose.dev.yml --env-file .env.development.local up --build

# Detached mode (background)
docker-compose -f docker-compose.dev.yml --env-file .env.development.local up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f app
```

### How It Works

1. **Neon Local Container** starts first and:
   - Connects to your Neon project using `NEON_API_KEY` and `NEON_PROJECT_ID`
   - Creates an ephemeral database branch automatically
   - Exposes Postgres on port `5432`

2. **App Container** starts after Neon Local is healthy and:
   - Connects to `neon-local:5432` using the serverless driver
   - Mounts your `src/` directory for hot reload
   - Runs with `node --watch` for automatic restarts

3. **When you stop the containers**:
   - Neon Local automatically deletes the ephemeral branch
   - No cleanup required!

### Database Migrations in Development

```powershell
# Run migrations against Neon Cloud (not Neon Local)
docker-compose -f docker-compose.dev.yml --env-file .env.development.local run --rm app npm run db:migrate

# Generate new migration
docker-compose -f docker-compose.dev.yml --env-file .env.development.local run --rm app npm run db:generate

# Open Drizzle Studio
docker-compose -f docker-compose.dev.yml --env-file .env.development.local run --rm -p 4983:4983 app npm run db:studio
```

### Accessing Containers

```powershell
# Shell into app container
docker exec -it acquisitions-app-dev sh

# Shell into Neon Local container
docker exec -it acquisitions-neon-local sh

# View app logs
docker logs -f acquisitions-app-dev

# View Neon Local logs
docker logs -f acquisitions-neon-local
```

---

## Production Environment

### Features

- ✅ **Optimized Build** - Multi-stage Docker build for minimal image size
- ✅ **Non-root User** - Runs as `nodejs` user for security
- ✅ **Health Checks** - Automatic container health monitoring
- ✅ **Log Rotation** - Prevents disk space issues
- ✅ **Auto Restart** - Recovers from crashes automatically

### Configure Production Environment

Edit `.env.production.local`:

```env
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# IMPORTANT: Use connection pooler endpoint for production
# Format: postgres://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb
DATABASE_URL=postgres://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require

ARCJET_KEY=your_actual_arcjet_key
```

### Starting Production Server

```powershell
# Start production environment
docker-compose -f docker-compose.prod.yml --env-file .env.production.local up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop production environment
docker-compose -f docker-compose.prod.yml down
```

### Health Monitoring

```powershell
# Check container health
docker ps

# Check health endpoint
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2026-02-28T07:00:00.000Z",
  "uptime": 123.456
}
```

### Production Best Practices

1. **Use Connection Pooler**
   - Always use Neon's connection pooler endpoint in production
   - Format: `ep-xxx-pooler.region.aws.neon.tech`

2. **Secrets Management**
   - Never commit `.env.production.local` to version control
   - Use secret management systems (AWS Secrets Manager, HashiCorp Vault, etc.)
   - Inject secrets via environment variables in your deployment platform

3. **Monitoring**
   - Monitor container health via `/health` endpoint
   - Set up log aggregation (ELK, Datadog, etc.)
   - Configure alerting for container restarts

4. **Resource Limits**
   - Add resource limits in production compose file:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '1'
         memory: 512M
       reservations:
         cpus: '0.5'
         memory: 256M
   ```

---

## Environment Variables

### Required Variables

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `NODE_ENV` | `development` | `production` | Node environment |
| `PORT` | `3000` | `3000` | Server port |
| `DATABASE_URL` | ✅ | ✅ | Neon database connection string |
| `NEON_API_KEY` | ✅ | ❌ | Neon API key (for Neon Local) |
| `NEON_PROJECT_ID` | ✅ | ❌ | Neon project ID (for Neon Local) |
| `ARCJET_KEY` | ✅ | ✅ | Arcjet security API key |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Log level (debug, info, warn, error) |

### Getting Your Credentials

#### Neon API Key
1. Go to: https://console.neon.tech/app/settings/api-keys
2. Click "Generate new API key"
3. Copy the key (only shown once!)

#### Neon Project ID
1. Go to your Neon project dashboard
2. Click "Project settings"
3. Copy the Project ID from the "General" section

#### Database URL
1. Go to your Neon project dashboard
2. Click "Connection Details"
3. Copy the connection string
4. **For production**: Use the "Pooled connection" string

#### Arcjet Key
1. Go to: https://app.arcjet.com
2. Create a new site
3. Copy your API key

---

## Database Migrations

### Run Migrations

```powershell
# Development
docker-compose -f docker-compose.dev.yml --env-file .env.development.local run --rm app npm run db:migrate

# Production
docker-compose -f docker-compose.prod.yml --env-file .env.production.local run --rm app npm run db:migrate
```

### Generate Migration

```powershell
# After changing models in src/models/
docker-compose -f docker-compose.dev.yml --env-file .env.development.local run --rm app npm run db:generate
```

### Important Notes

- Migrations run against Neon Cloud (using `DATABASE_URL`), not Neon Local
- In development, Neon Local is only for runtime queries
- Always test migrations in development first
- Use Neon's branching feature for safe production migrations

---

## Troubleshooting

### Container Won't Start

**Issue**: Container exits immediately

**Solution**:
```powershell
# Check logs
docker-compose -f docker-compose.dev.yml logs app

# Common issues:
# 1. Missing environment variables
# 2. Port already in use
# 3. Syntax error in code
```

### Cannot Connect to Neon Local

**Issue**: `ECONNREFUSED neon-local:5432`

**Solutions**:
1. Ensure Neon Local container is healthy:
   ```powershell
   docker ps
   # Look for "healthy" status
   ```

2. Check Neon Local logs:
   ```powershell
   docker logs acquisitions-neon-local
   ```

3. Verify credentials:
   - `NEON_API_KEY` is valid
   - `NEON_PROJECT_ID` is correct

### Hot Reload Not Working

**Issue**: Code changes not reflected

**Solutions**:
1. Check volume mount in `docker-compose.dev.yml`:
   ```yaml
   volumes:
     - ./src:/app/src:ro
   ```

2. Restart container:
   ```powershell
   docker-compose -f docker-compose.dev.yml restart app
   ```

### Port Already in Use

**Issue**: `Error: address already in use`

**Solution**:
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID)
taskkill /PID <pid> /F

# Or change port in .env file
PORT=3001
```

### Neon Local Branch Not Created

**Issue**: Neon Local fails to create branch

**Checklist**:
- [ ] Valid `NEON_API_KEY`
- [ ] Valid `NEON_PROJECT_ID`
- [ ] API key has required permissions
- [ ] Neon project exists and is active
- [ ] Not exceeding Neon plan limits

### Database Connection Errors in Production

**Issue**: Production app can't connect to database

**Checklist**:
- [ ] Using pooled connection string (with `-pooler`)
- [ ] Connection string includes `?sslmode=require`
- [ ] Database is not paused (Neon auto-pauses after inactivity)
- [ ] Firewall allows outbound connections to Neon

### Build Fails (bcrypt errors)

**Issue**: Native module build errors

**Solution**: The Dockerfile already includes build tools. If issues persist:
```dockerfile
# Dockerfile already has:
RUN apk add --no-cache python3 make g++
```

---

## Additional Resources

- [Neon Documentation](https://neon.tech/docs)
- [Neon Local Documentation](https://neon.tech/docs/local/neon-local)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Arcjet Documentation](https://docs.arcjet.com/)

---

## Support

For issues specific to:
- **Docker setup**: Check this guide and Docker logs
- **Neon Database**: https://neon.tech/docs
- **Arcjet**: https://docs.arcjet.com/
- **Application code**: See main `README.md`
