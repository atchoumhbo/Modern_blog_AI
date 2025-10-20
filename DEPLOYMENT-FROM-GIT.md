# Deployment Guide – Blog Strapi (Existing Project) + PostgreSQL on Ubuntu VPS

## ✅ GUIDE POUR DÉPLOYER UN PROJET STRAPI EXISTANT DEPUIS GIT

Cette procédure installe votre projet Strapi existant depuis GitHub sur un VPS Ubuntu.

---

## Prerequisites
- Ubuntu 22.04/24.04 Server (VPS)
- Root or sudo privileges
- Internet access
- Accès au repository Git : `https://github.com/boujrafh/blog_strapi.git`

---

## 1. Update the System
```bash
sudo apt update -y && sudo apt upgrade -y
```

## 2. Install Git
```bash
sudo apt install -y git
git --version
```

## 3. Install Node.js & npm
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version      # Expected: v18.x.x
npm --version       # 10.x or 11.x preferred (for Strapi v5)
```

## 4. Install PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## 5. Create PostgreSQL User & Database
```bash
sudo -u postgres psql
```

Inside the PostgreSQL prompt:
```sql
CREATE USER strapi_admin WITH PASSWORD 'Password123!';
ALTER USER strapi_admin WITH SUPERUSER;
CREATE DATABASE strapi_db OWNER strapi_admin;
GRANT ALL PRIVILEGES ON DATABASE strapi_db TO strapi_admin;
\q
```

> **⚠️ IMPORTANT:** Use only letters, numbers, `_`, `-`, `!` in the password (avoid `#` and spaces)

Optional – Test the connection:
```bash
PGPASSWORD='Password123!' psql -U strapi_admin -h 127.0.0.1 -d strapi_db
```

## 6. Clone the Project from Git
```bash
cd /root
git clone https://github.com/boujrafh/blog_strapi.git
cd blog_strapi
mkdir -p /root/blog_strapi/backend/public/uploads
chmod 755 /root/blog_strapi/backend/public/uploads

```

## 7. Configure Backend Environment

Create/Edit `backend/.env`:
```bash
cd backend
nano .env
```

Add the following configuration:
```env
# Server
HOST=0.0.0.0
PORT=1337
NODE_ENV=production

# Database
DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=strapi_db
DATABASE_USERNAME=strapi_admin
DATABASE_PASSWORD=Password123!
DATABASE_SSL=false

# Secrets - GENERATE NEW ONES!
APP_KEYS=your-app-key-1,your-app-key-2
API_TOKEN_SALT=your-api-token-salt
ADMIN_JWT_SECRET=your-admin-jwt-secret
TRANSFER_TOKEN_SALT=your-transfer-token-salt
JWT_SECRET=your-jwt-secret
```

### Generate Secrets:
```bash
# Generate secrets with OpenSSL
echo "APP_KEYS=$(openssl rand -base64 32),$(openssl rand -base64 32)"
echo "API_TOKEN_SALT=$(openssl rand -base64 32)"
echo "ADMIN_JWT_SECRET=$(openssl rand -base64 32)"
echo "TRANSFER_TOKEN_SALT=$(openssl rand -base64 32)"
echo "JWT_SECRET=$(openssl rand -base64 32)"
```

Copy the generated values and paste them into your `.env` file.

## 8. Install Backend Dependencies
```bash
cd /root/blog_strapi/backend
rm -rf node_modules .cache dist build    # Clean old build artifacts
npm install
```

## 9. Build Strapi Admin Panel
```bash
npm run build
```

## 10. Start Strapi (First Time - Development Mode)
```bash
NODE_ENV=development npm run develop
```

> This will start Strapi on `http://<your_vps_ip>:1337/admin`
> 
> **Create your first admin user** through the web interface, then stop the server (Ctrl+C)

## 11. Apply Database Permissions (If Using the SQL Fix)

If you have the `fix-permissions.sql` file in your project:
```bash
cd /root/blog_strapi
PGPASSWORD='Password123!' psql -U strapi_admin -h 127.0.0.1 -d strapi_db -f fix-permissions.sql
```

## 12. Start Strapi in Production Mode

### Option A: Using nohup (Simple)
```bash
cd /root/blog_strapi/backend
NODE_ENV=production nohup npm run start > /root/strapi.log 2>&1 &
```

Check logs:
```bash
tail -f /root/strapi.log
```

### Option B: Using PM2 (Recommended)
```bash
# Install PM2 globally
sudo npm install -g pm2

# Start Strapi with PM2
cd /root/blog_strapi/backend
pm2 start npm --name "strapi" -- run start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions displayed
```

Manage with PM2:
```bash
pm2 status          # Check status
pm2 logs strapi     # View logs
pm2 restart strapi  # Restart
pm2 stop strapi     # Stop
```

---

## 13. Install Frontend (Optional - If Using Docker)

### Install Docker and Docker Compose
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
```

### Configure Frontend Environment
```bash
cd /root/blog_strapi/frontend
nano .env
```

Add:
```env
STRAPI_API_URL=http://127.0.0.1:1337
NODE_ENV=production
```

### Build Frontend
```bash
npm install
npm run build
```

### Start Docker Services
```bash
cd /root/blog_strapi
docker-compose up -d
```

---

## 14. Setup Nginx Reverse Proxy (Production)

### Install Nginx
```bash
sudo apt install -y nginx
```

### Configure Nginx

If using the project's Nginx config:
```bash
# Copy the hybrid VPS config
sudo cp /root/blog_strapi/nginx/nginx.vps-hybrid.conf /etc/nginx/nginx.conf

# Or create a site config
sudo nano /etc/nginx/sites-available/blog
```

Basic Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 100M;

    # Strapi Admin & API
    location ~ ^/(admin|api|uploads|i18n|users-permissions|content-manager|content-type-builder) {
        proxy_pass http://127.0.0.1:1337;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend (if applicable)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Setup SSL with Let's Encrypt
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
sudo systemctl reload nginx
```

---

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Find process using port 1337
sudo lsof -i :1337
# Kill the process
sudo kill -9 <PID>
```

### Strapi Won't Start
```bash
# Check logs
tail -100 /root/strapi.log
# Or with PM2
pm2 logs strapi --lines 100

# Clean and rebuild
cd /root/blog_strapi/backend
rm -rf node_modules .cache dist build
npm install
npm run build
```

### Database Connection Issues
```bash
# Test PostgreSQL connection
PGPASSWORD='Password123!' psql -U strapi_admin -h 127.0.0.1 -d strapi_db

# Check PostgreSQL is running
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Update Project from Git
```bash
cd /root/blog_strapi

# Stop Strapi
pm2 stop strapi
# Or kill the process
pkill -f "npm run start"

# Pull latest changes
git pull origin master

# Reinstall dependencies if package.json changed
cd backend
npm install
npm run build

# Restart Strapi
pm2 start strapi
# Or
NODE_ENV=production nohup npm run start > /root/strapi.log 2>&1 &
```

---

## 📝 Useful Commands

### Strapi Management
```bash
# View logs (nohup)
tail -f /root/strapi.log

# View logs (PM2)
pm2 logs strapi

# Restart Strapi (PM2)
pm2 restart strapi

# Stop Strapi (PM2)
pm2 stop strapi

# Restart Strapi (nohup) - kill then restart
pkill -f "npm run start"
cd /root/blog_strapi/backend && NODE_ENV=production nohup npm run start > /root/strapi.log 2>&1 &
```

### Database Management
```bash
# Connect to database
PGPASSWORD='Password123!' psql -U strapi_admin -h 127.0.0.1 -d strapi_db

# Backup database
pg_dump -U strapi_admin -h 127.0.0.1 strapi_db > backup_$(date +%Y%m%d).sql

# Restore database
PGPASSWORD='Password123!' psql -U strapi_admin -h 127.0.0.1 strapi_db < backup_20250115.sql
```

### Docker Management
```bash
# View running containers
docker ps

# View logs
docker-compose logs -f

# Restart containers
docker-compose restart

# Stop all containers
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

---

## 🎯 Quick Deployment Checklist

- [ ] System updated
- [ ] Git installed
- [ ] Node.js 18.x installed
- [ ] PostgreSQL installed and configured
- [ ] Database user created with SUPERUSER
- [ ] Database created
- [ ] Project cloned from Git
- [ ] `.env` file created with all secrets
- [ ] Backend dependencies installed
- [ ] Strapi built successfully
- [ ] First admin user created
- [ ] Permissions SQL applied (if needed)
- [ ] Strapi running in production mode
- [ ] PM2 configured (recommended)
- [ ] Nginx installed and configured
- [ ] SSL certificate installed
- [ ] Domain pointing to VPS IP

---

## 🚀 Success Verification

After completing all steps, verify:

```bash
# Check Strapi is running
curl http://localhost:1337/admin

# Check API is accessible
curl http://localhost:1337/api/articles

# Check through domain (if configured)
curl https://your-domain.com/api/articles
```

You should see:
- ✅ Strapi admin panel loads
- ✅ API returns data (even if empty: `{"data":[],"meta":{}}`)
- ✅ No 500 errors
- ✅ Content Type Builder works

---

**Repository:** https://github.com/boujrafh/blog_strapi  
**Tested on:** Ubuntu 24.04 LTS with Strapi 5.24.1  
**Last Updated:** October 2025
