# 🚀 Backend MERN - VPS Deployment Procedure

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [VPS Initial Setup](#vps-initial-setup)
3. [PostgreSQL Configuration](#postgresql-configuration)
4. [Application Deployment](#application-deployment)
5. [Migration & Seeding](#migration--seeding)
6. [Verification & Testing](#verification--testing)
7. [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites

### Required on VPS:
- Ubuntu 20.04+ or Debian 11+
- Docker 20.10+ & Docker Compose v2+
- PostgreSQL 14+
- Minimum 2GB RAM, 20GB disk space
- Root or sudo access

### Required on Local Machine:
- SSH access to VPS
- Git repository access
- PowerShell or Bash terminal

### Files to Prepare:
- `.env.production` with production secrets
- SSH private key for VPS access

---

## 🖥️ VPS Initial Setup

### 1. Connect to VPS
```bash
ssh root@YOUR_VPS_IP
```

### 2. Update System
```bash
apt update && apt upgrade -y
```

### 3. Install Docker & Docker Compose
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Verify Docker installation
docker --version
docker-compose --version
```

### 4. Install PostgreSQL
```bash
# Install PostgreSQL 16
apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Verify PostgreSQL is running
systemctl status postgresql
```

### 5. Create Application Directory
```bash
mkdir -p /root/blog_strapi/backend-mern
cd /root/blog_strapi/backend-mern
```

---

## 🗄️ PostgreSQL Configuration

### 1. Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# Execute the following SQL commands:
```

```sql
-- Create database
CREATE DATABASE blog_mern;

-- Create user with strong password
CREATE USER blog_mern_user WITH PASSWORD 'YOUR_STRONG_PASSWORD';

-- Grant CREATEDB privilege (required for Prisma migrations)
ALTER USER blog_mern_user CREATEDB;

-- Grant all privileges on database
GRANT ALL PRIVILEGES ON DATABASE blog_mern TO blog_mern_user;

-- Connect to blog_mern database
\c blog_mern

-- Grant schema privileges
GRANT ALL PRIVILEGES ON SCHEMA public TO blog_mern_user;
ALTER SCHEMA public OWNER TO blog_mern_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO blog_mern_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO blog_mern_user;

-- Create required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Verify setup
\du blog_mern_user
\dn+ public

-- Exit psql
\q
```

### 2. Configure PostgreSQL for Docker Access

#### Edit postgresql.conf
```bash
# Find PostgreSQL version
ls /etc/postgresql/

# Edit postgresql.conf (replace 16 with your version)
nano /etc/postgresql/16/main/postgresql.conf
```

**Add or modify:**
```conf
listen_addresses = '*'
```

#### Edit pg_hba.conf
```bash
nano /etc/postgresql/16/main/pg_hba.conf
```

**Add BEFORE the IPv4 local connections line:**
```conf
# Allow Docker containers to connect
host    all             all             172.17.0.0/16           md5
host    blog_mern       blog_mern_user  172.17.0.0/16           md5
```

**Complete pg_hba.conf example:**
```conf
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
local   all             all                                     peer
host    all             all             172.17.0.0/16           md5
host    blog_mern       blog_mern_user  172.17.0.0/16           md5
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
local   replication     all                                     peer
host    replication     all             127.0.0.1/32            scram-sha-256
host    replication     all             ::1/128                 scram-sha-256
```

### 3. Restart PostgreSQL
```bash
systemctl restart postgresql

# Verify it's running
systemctl status postgresql

# Test connection from localhost
PGPASSWORD='YOUR_PASSWORD' psql -h 127.0.0.1 -U blog_mern_user -d blog_mern -c 'SELECT current_user;'
```

---

## 📦 Application Deployment

### 1. Clone Repository
```bash
cd /root/blog_strapi
git clone YOUR_REPO_URL backend-mern
cd backend-mern
```

### 2. Create .env.production File
```bash
nano .env.production
```

**Required environment variables:**
```env
# Database (use the password you created above)
DATABASE_URL="postgresql://blog_mern_user:YOUR_STRONG_PASSWORD@host.docker.internal:5432/blog_mern?schema=public"

# JWT Secrets (generate strong random strings)
JWT_SECRET="your-very-long-random-secret-min-32-chars"
JWT_REFRESH_SECRET="your-very-long-random-refresh-secret-min-32-chars"

# API Key Salt (generate strong random string)
API_KEY_SALT="your-api-key-salt-min-32-chars"

# CORS Origins (comma-separated)
CORS_ORIGINS="http://localhost:5173,http://YOUR_FRONTEND_DOMAIN"
```

**Generate secure secrets:**
```bash
# Generate JWT secrets
openssl rand -base64 48
openssl rand -base64 48

# Generate API key salt
openssl rand -base64 48
```

### 3. Verify Files Are Present

Check that all necessary files exist:
```bash
# Check Dockerfile
cat Dockerfile

# Check docker-compose.prod.yml
cat docker-compose.prod.yml

# Check Prisma schema
cat prisma/schema.prisma

# Check migrations exist
ls -la prisma/migrations/
```

**If migrations are missing, generate them:**
```bash
# Install Node.js temporarily if needed
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Generate migration SQL
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > /tmp/migration.sql

# Create migration directory
mkdir -p prisma/migrations/$(date +%Y%m%d)_init

# Move migration file
mv /tmp/migration.sql prisma/migrations/$(date +%Y%m%d)_init/migration.sql

# Create migration_lock.toml
echo '# Please do not edit this file manually
# It should be added in your version-control system (i.e. Git)
provider = "postgresql"' > prisma/migrations/migration_lock.toml
```

### 4. Build and Start Container
```bash
# Build the Docker image
docker-compose -f docker-compose.prod.yml build --no-cache

# Start the container
docker-compose -f docker-compose.prod.yml up -d

# Check container status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

---

## 🔄 Migration & Seeding

### 1. Apply Database Migrations
```bash
# Deploy Prisma migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

**Expected output:**
```
✅ The following migration(s) have been applied:
migrations/
  └─ YYYYMMDD_init/
    └─ migration.sql

All migrations have been successfully applied.
```

### 2. Seed Database
```bash
# Run production seed script
docker-compose -f docker-compose.prod.yml exec backend npm run seed:prod
```

**Expected output:**
```
✅ Admin created: boujraf.hicham@gmail.com
✅ Created 4 categories
✅ Created 7 tags
✅ Created 1 demo article
✅ Created 1 demo project

Admin credentials:
  Email: boujraf.hicham@gmail.com
  Password: Admin123!
```

### 3. Verify Database Tables
```bash
# Check tables were created
sudo -u postgres psql -d blog_mern -c '\dt'
```

**Expected tables (11 total):**
- `users` - User accounts
- `articles` - Blog posts
- `projects` - Portfolio projects
- `categories` - Content categories
- `tags` - Content tags
- `api_keys` - API keys for integrations
- `audit_logs` - Audit trail
- `refresh_tokens` - JWT refresh tokens
- `_ArticleToTag` - Many-to-many join table
- `_ProjectToTag` - Many-to-many join table
- `_prisma_migrations` - Prisma migration history

---

## ✅ Verification & Testing

### 1. Health Check
```bash
# Test from VPS
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"2025-10-17T..."}
```

### 2. Test Authentication
```bash
# Test login endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "boujraf.hicham@gmail.com",
    "password": "Admin123!"
  }'
```

**Expected response:**
```json
{
  "user": {
    "id": "...",
    "email": "boujraf.hicham@gmail.com",
    "username": "admin",
    "isAdmin": true
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### 3. Test API Endpoints
```bash
# Get articles (should return the seeded article)
curl http://localhost:3000/api/articles

# Get categories
curl http://localhost:3000/api/categories

# Get tags
curl http://localhost:3000/api/tags

# Get projects
curl http://localhost:3000/api/projects
```

### 4. Test from External Network (if firewall allows)
```bash
# From your local machine
curl http://YOUR_VPS_IP:3000/health
```

### 5. Check Docker Container Status
```bash
# View running containers
docker ps

# Check container health
docker inspect blog-mern-backend | grep -A 10 Health

# View container logs
docker logs blog-mern-backend --tail 100
```

### 6. Verify Database Records
```bash
# Check admin user was created
sudo -u postgres psql -d blog_mern -c 'SELECT email, username, "isAdmin" FROM users;'

# Check categories
sudo -u postgres psql -d blog_mern -c 'SELECT COUNT(*) FROM categories;'

# Check tags
sudo -u postgres psql -d blog_mern -c 'SELECT COUNT(*) FROM tags;'

# Check articles
sudo -u postgres psql -d blog_mern -c 'SELECT title FROM articles;'
```

---

## 🔧 Troubleshooting

### Issue 1: Container won't start

**Check logs:**
```bash
docker-compose -f docker-compose.prod.yml logs backend
```

**Common causes:**
- Missing .env.production file
- Invalid DATABASE_URL format
- PostgreSQL not running

**Solutions:**
```bash
# Verify .env.production exists and is readable
cat .env.production

# Test PostgreSQL connection
systemctl status postgresql

# Restart container
docker-compose -f docker-compose.prod.yml restart backend
```

### Issue 2: Database connection fails (P1010 error)

**Error:** `User denied access on the database`

**Check PostgreSQL configuration:**
```bash
# Verify user privileges
sudo -u postgres psql -d blog_mern -c '\du blog_mern_user'

# Check schema ownership
sudo -u postgres psql -d blog_mern -c '\dn+ public'

# Test direct connection
PGPASSWORD='YOUR_PASSWORD' psql -h 127.0.0.1 -U blog_mern_user -d blog_mern -c 'SELECT 1;'
```

**Fix privileges:**
```sql
-- Run as postgres user
sudo -u postgres psql -d blog_mern

GRANT ALL PRIVILEGES ON SCHEMA public TO blog_mern_user;
ALTER SCHEMA public OWNER TO blog_mern_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO blog_mern_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO blog_mern_user;
ALTER USER blog_mern_user CREATEDB;
```

### Issue 3: Migrations fail (P3015 error)

**Error:** `Could not find the migration file`

**Solution:**
```bash
# Regenerate migration on VPS
docker-compose -f docker-compose.prod.yml exec backend \
  npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > /root/blog_strapi/backend-mern/prisma/migrations/$(date +%Y%m%d)_init/migration.sql

# Rebuild container
docker-compose -f docker-compose.prod.yml up -d --build

# Apply migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### Issue 4: Port already in use

**Error:** `port is already allocated`

**Find what's using port 3000:**
```bash
lsof -i :3000
# or
netstat -tulpn | grep 3000
```

**Kill the process or change port:**
```bash
# Kill process
kill -9 <PID>

# Or change port in docker-compose.prod.yml
# ports:
#   - "3001:3000"
```

### Issue 5: Seed script fails

**Check if tables exist:**
```bash
sudo -u postgres psql -d blog_mern -c '\dt'
```

**If tables don't exist, run migrations first:**
```bash
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

**Then retry seed:**
```bash
docker-compose -f docker-compose.prod.yml exec backend npm run seed:prod
```

### Issue 6: OpenSSL warnings in Prisma

**Warning:** `Prisma failed to detect the libssl/openssl version`

**This is normal in Alpine Linux and can be ignored.** The warning doesn't affect functionality.

---

## 📝 Quick Reference Commands

### Docker Commands
```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Restart container
docker-compose -f docker-compose.prod.yml restart backend

# Stop container
docker-compose -f docker-compose.prod.yml down

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Execute command in container
docker-compose -f docker-compose.prod.yml exec backend <command>

# View container stats
docker stats blog-mern-backend
```

### PostgreSQL Commands
```bash
# Connect to database
sudo -u postgres psql -d blog_mern

# Check active connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity WHERE datname='blog_mern';"

# Backup database
pg_dump -U postgres blog_mern > backup_$(date +%Y%m%d).sql

# Restore database
psql -U postgres blog_mern < backup_YYYYMMDD.sql
```

### Application Commands
```bash
# Run migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Generate Prisma Client
docker-compose -f docker-compose.prod.yml exec backend npx prisma generate

# Seed database
docker-compose -f docker-compose.prod.yml exec backend npm run seed:prod

# View Prisma schema
docker-compose -f docker-compose.prod.yml exec backend cat prisma/schema.prisma
```

---

## 🔐 Security Checklist

- [ ] Changed default PostgreSQL password
- [ ] Generated strong JWT secrets (min 32 characters)
- [ ] Generated strong API key salt
- [ ] Configured firewall (ufw/iptables)
- [ ] Set up SSL/TLS certificates (for HTTPS)
- [ ] Configured CORS_ORIGINS properly
- [ ] Reviewed pg_hba.conf (limit access to necessary IPs only)
- [ ] Set up regular database backups
- [ ] Enabled Docker container restart policy
- [ ] Changed default admin password after first login

---

## 📊 Success Criteria

✅ All checks should pass:

1. Docker container running: `docker ps | grep blog-mern-backend`
2. Health endpoint responds: `curl http://localhost:3000/health`
3. 11 database tables exist: `sudo -u postgres psql -d blog_mern -c '\dt'`
4. Admin user can login: Test with curl or Postman
5. API endpoints return data: Test /api/articles, /api/categories, etc.
6. No errors in logs: `docker logs blog-mern-backend --tail 50`

---

## 📞 Support

If you encounter issues not covered in this guide:

1. Check container logs for detailed error messages
2. Verify all prerequisites are installed correctly
3. Ensure all environment variables are set properly
4. Test PostgreSQL connection independently
5. Review Prisma migration history: `sudo -u postgres psql -d blog_mern -c 'SELECT * FROM _prisma_migrations;'`

---

**Deployment Date:** October 17, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
