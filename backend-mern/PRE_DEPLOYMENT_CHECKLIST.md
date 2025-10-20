# ✅ Pre-Deployment Checklist

## Quick Configuration Verification

Run this checklist before deploying to a new VPS to ensure everything is configured correctly.

---

## 📋 Files Checklist

### Required Files (Must exist):
- [x] `Dockerfile` - Multi-stage Docker build configuration
- [x] `docker-compose.prod.yml` - Production Docker Compose configuration
- [x] `prisma/schema.prisma` - Database schema definition
- [x] `prisma/migrations/` - Database migrations directory
- [x] `prisma/migrations/migration_lock.toml` - Migration lock file
- [x] `package.json` - Node.js dependencies and scripts
- [x] `tsconfig.json` - TypeScript configuration
- [x] `src/seed-production.ts` - Production seed script
- [ ] `.env.production` - Environment variables (create on VPS)

---

## 🐳 Dockerfile Verification

Check that your `Dockerfile` contains:

- [x] Multi-stage build (`FROM node:20-alpine AS builder`)
- [x] Prisma schema copied (`COPY prisma ./prisma/`)
- [x] Prisma Client generation (`RUN npx prisma generate`)
- [x] TypeScript compilation (`RUN npm run build`)
- [x] Production dependencies only in final stage
- [x] Non-root user (`USER node`)
- [x] Health check configured
- [x] dumb-init for proper signal handling
- [x] OpenSSL installed for Prisma

---

## 🐳 docker-compose.prod.yml Verification

Check that your `docker-compose.prod.yml` contains:

- [x] `NODE_ENV: production`
- [x] `DATABASE_URL` with `host.docker.internal`
- [x] `JWT_SECRET` and `JWT_REFRESH_SECRET` from .env
- [x] `API_KEY_SALT` from .env
- [x] `CORS_ORIGINS` from .env
- [x] `restart: unless-stopped` policy
- [x] Health check configured
- [x] Port 3000 exposed
- [x] `extra_hosts` for PostgreSQL access
- [x] Persistent volumes for uploads

---

## 🗄️ Database Schema Verification

Check that your `prisma/schema.prisma` contains all models:

- [x] `model User` - User authentication
- [x] `model Article` - Blog posts
- [x] `model Project` - Portfolio projects
- [x] `model Category` - Content categories
- [x] `model Tag` - Content tags
- [x] `model ApiKey` - API keys for N8N
- [x] `model AuditLog` - Audit trail
- [x] `model RefreshToken` - JWT refresh tokens

---

## 📦 Migrations Verification

Check migrations directory:

- [x] At least one migration file exists (`migration.sql`)
- [x] `migration_lock.toml` exists
- [x] Migration file is not corrupted (can be read)

---

## 🔐 Security Verification

### Environment Variables (.env.production on VPS):
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `JWT_SECRET` - Strong random string (min 32 chars)
- [ ] `JWT_REFRESH_SECRET` - Strong random string (min 32 chars)
- [ ] `API_KEY_SALT` - Strong random string (min 32 chars)
- [ ] `CORS_ORIGINS` - Comma-separated allowed origins

### Generate Strong Secrets (on VPS):
```bash
openssl rand -base64 48  # For JWT_SECRET
openssl rand -base64 48  # For JWT_REFRESH_SECRET
openssl rand -base64 48  # For API_KEY_SALT
```

### Security Best Practices:
- [ ] Strong PostgreSQL password used
- [ ] No test/development secrets in production
- [ ] Firewall configured (ufw/iptables)
- [ ] SSL/TLS certificates configured (if using HTTPS)
- [ ] CORS_ORIGINS limited to known domains
- [ ] pg_hba.conf properly configured

---

## 🖥️ VPS Prerequisites

### Software Installed:
- [ ] Docker 20.10+
- [ ] Docker Compose v2+
- [ ] PostgreSQL 14+
- [ ] Git (for cloning repo)

### System Resources:
- [ ] Minimum 2GB RAM
- [ ] Minimum 20GB disk space
- [ ] Root or sudo access

### PostgreSQL Configuration:
- [ ] Database `blog_mern` created
- [ ] User `blog_mern_user` created with strong password
- [ ] User has `CREATEDB` privilege
- [ ] User has all privileges on `blog_mern` database
- [ ] User owns `public` schema
- [ ] Extensions installed (uuid-ossp, citext, pg_trgm)
- [ ] `listen_addresses = '*'` in postgresql.conf
- [ ] Docker network allowed in pg_hba.conf

---

## 🚀 Deployment Steps Summary

1. **Setup VPS**: Install Docker, PostgreSQL, create directories
2. **Configure PostgreSQL**: Create database, user, set permissions
3. **Clone Repository**: Copy application files to VPS
4. **Create .env.production**: Set all environment variables
5. **Build & Start**: Run `docker-compose -f docker-compose.prod.yml up -d --build`
6. **Apply Migrations**: Run `docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy`
7. **Seed Database**: Run `docker-compose -f docker-compose.prod.yml exec backend npm run seed:prod`
8. **Verify**: Test health endpoint, login, and API endpoints

---

## ✅ Verification Commands

Run these on VPS after deployment:

```bash
# Check container is running
docker ps | grep blog-mern-backend

# Test health endpoint
curl http://localhost:3000/health

# Check database tables
sudo -u postgres psql -d blog_mern -c '\dt'

# View container logs
docker logs blog-mern-backend --tail 50

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "boujraf.hicham@gmail.com", "password": "Admin123!"}'
```

---

## 📝 Configuration Files Summary

### Dockerfile Key Points:
- Node.js 20 Alpine Linux
- Multi-stage build (builder + production)
- Prisma Client generated in both stages
- TypeScript compiled in builder stage
- Non-root user in production
- Health check and dumb-init

### docker-compose.prod.yml Key Points:
- Uses host PostgreSQL via `host.docker.internal`
- Environment variables from .env.production
- Persistent volumes for uploads
- Automatic restart policy
- Health check enabled
- Port 3000 exposed

### PostgreSQL Configuration:
- Database: `blog_mern`
- User: `blog_mern_user`
- Schema owner: `blog_mern_user`
- Network: Docker bridge (172.17.0.0/16)
- Auth method: md5 for Docker network

---

## 🔧 Common Issues & Solutions

### Issue: Container won't start
**Solution**: Check logs with `docker logs blog-mern-backend`

### Issue: Database connection fails
**Solution**: 
1. Verify PostgreSQL is running: `systemctl status postgresql`
2. Test direct connection: `PGPASSWORD='xxx' psql -h 127.0.0.1 -U blog_mern_user -d blog_mern`
3. Check pg_hba.conf has Docker network allowed

### Issue: Migrations fail (P1010)
**Solution**:
1. Grant CREATEDB: `ALTER USER blog_mern_user CREATEDB;`
2. Grant schema privileges: `GRANT ALL ON SCHEMA public TO blog_mern_user;`
3. Set schema owner: `ALTER SCHEMA public OWNER TO blog_mern_user;`

### Issue: Migration files not found (P3015)
**Solution**: Regenerate migrations on VPS:
```bash
docker-compose -f docker-compose.prod.yml exec backend \
  npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/$(date +%Y%m%d)_init/migration.sql
```

---

## 📊 Success Indicators

✅ **Deployment is successful when:**

1. Container is running: `docker ps` shows `blog-mern-backend`
2. Health check passes: `curl http://localhost:3000/health` returns `{"status":"ok"}`
3. Database has 11 tables (8 main + 2 join + 1 migrations)
4. Admin user can login successfully
5. API endpoints return data (articles, categories, tags, projects)
6. No errors in container logs
7. Application auto-restarts if VPS reboots

---

## 📚 Additional Resources

- **Full Deployment Guide**: See `DEPLOYMENT_PROCEDURE.md`
- **Troubleshooting**: See troubleshooting section in `DEPLOYMENT_PROCEDURE.md`
- **Prisma Documentation**: https://www.prisma.io/docs
- **Docker Documentation**: https://docs.docker.com
- **PostgreSQL Documentation**: https://www.postgresql.org/docs

---

**Last Updated**: October 17, 2025  
**Configuration Status**: ✅ Verified and Ready for Deployment
