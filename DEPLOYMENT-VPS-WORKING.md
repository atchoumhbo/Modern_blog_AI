# Deployment Guide – Strapi + PostgreSQL on Ubuntu VPS

## ✅ GUIDE TESTÉ ET VALIDÉ - FONCTIONNE À 100%

Cette procédure a été testée avec succès et résout tous les problèmes d'installation de Strapi sur VPS Ubuntu.

---

## Prerequisites
- Ubuntu 22.04/24.04 Server (VPS)
- Root or sudo privileges
- Internet access

---

## 1. Update the System
```bash
sudo apt update -y && sudo apt upgrade -y
```

## 2. Install Node.js & npm
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version      # Expected: v18.x.x
npm --version       # 10.x or 11.x preferred (for Strapi v5)
```

## 3. Install PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## 4. Create PostgreSQL User & Database
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

## 5. Install Strapi Project
```bash
mkdir my_strapi_project
cd my_strapi_project
npx create-strapi-app@latest backend
```

> During setup, choose:
> - Database type: `postgres`
> - Host: `127.0.0.1`
> - Port: `5432`
> - Username: `strapi_admin`
> - Password: `Password123!`
> - Database name: `strapi_db`
> - Use SSL: `No`

## 6. Configure `.env` File (if not already)

Edit/create `backend/.env` and add:
```env
DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=strapi_db
DATABASE_USERNAME=strapi_admin
DATABASE_PASSWORD=Password123!
DATABASE_SSL=false
```

## 7. Install Dependencies & Build
```bash
cd backend
npm install
npm run build
```

## 8. Start Strapi
```bash
npm run start
```

> ✅ Admin panel available at: `http://<your_vps_ip>:1337/admin`

---

## 🔧 Troubleshooting

### Auth Error?
- Check username, database, and password in `.env` match those in PostgreSQL.
- Avoid using special characters like `#` or spaces in the password.

### Change Password for Debug:
```bash
sudo -u postgres psql
```
```sql
ALTER USER strapi_admin WITH PASSWORD 'Test12345!';
\q
```
Update `.env` accordingly and rebuild/restart Strapi.

### Clean Reinstall if Persistent Errors:
```bash
rm -rf node_modules .cache dist
npm install
npm run build
npm run start
```

---

## 🚀 Production Deployment (Optional)

### Run Strapi in Background with PM2
```bash
npm install -g pm2
cd backend
pm2 start npm --name "strapi" -- run start
pm2 save
pm2 startup
```

### Setup Nginx Reverse Proxy
```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/strapi
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:1337;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/strapi /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Setup SSL with Let's Encrypt
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 📝 Key Differences from Failed Attempts

### ✅ What Works:
1. **Simple password without special characters** (`Password123!` instead of complex ones)
2. **SUPERUSER privileges** for the PostgreSQL user
3. **127.0.0.1** instead of `localhost` for database host
4. **Fresh installation** without trying to reuse old configurations
5. **SSL disabled** during initial setup

### ❌ Common Mistakes to Avoid:
1. Using `#` or spaces in database password
2. Not granting SUPERUSER to database user
3. Mixing up database names/users between configs
4. Trying to fix a broken installation instead of clean reinstall
5. Enabling SSL without proper certificates

---

## 🎯 Success Indicators

When everything works correctly, you should see:
- ✅ No authentication errors in logs
- ✅ Content Type Builder loads without errors
- ✅ Can create/edit content types
- ✅ Database migrations run successfully
- ✅ Admin panel fully functional

---

**Keep this README for your next VPS deployment – 100% reproducible!**

*Tested and validated on Ubuntu 24.04 LTS with Strapi 5.24.1*
