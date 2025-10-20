# 🚀 Blog Strapi - Professional Blog & Portfolio Platform

A modern, production-ready blog and portfolio platform built with **React Router v7 SSR** and **Strapi CMS**, deployed on VPS with enterprise-grade architecture.

[![Production](https://img.shields.io/badge/Production-Live-brightgreen)](https://blog.bh-systems.be)
[![Stack](https://img.shields.io/badge/Stack-React%20%2B%20Strapi-blue)]()
[![License](https://img.shields.io/badge/License-MIT-yellow)]()

## 📋 Overview

A complete full-stack blog platform featuring:
- **Public Website**: https://blog.bh-systems.be (HTTPS with Let's Encrypt)
- **Admin Panel**: Strapi headless CMS with role-based access
- **Architecture**: Docker-based microservices on VPS
- **Database**: SQLite (lightweight, persistent storage)
- **Performance**: Redis caching, Nginx reverse proxy, HTTP/2

## ✨ Key Features

### 🌐 Public Website
- **Server-Side Rendering (SSR)**: Fast initial page loads with React Router v7
- **SEO Optimized**: Dynamic meta tags, Open Graph, Twitter Cards
- **Responsive Design**: Mobile-first approach with Tailwind CSS v4
- **Dark Mode**: Intelligent theme switching with system detection
- **Animations**: Smooth transitions with Framer Motion
- **Accessible UI**: WCAG-compliant components with Radix UI
- **Performance**: Redis caching, image optimization, HTTP/2

### 📝 Content Management (Strapi)
- **Articles**: Rich text editor, featured images, categories, tags
- **Projects**: Portfolio showcase with image galleries
- **Categories & Tags**: Organize content efficiently
- **SEO Settings**: Per-post meta descriptions, OG images
- **Media Library**: Integrated file management with automatic image optimization
- **i18n**: Multi-language support (FR/EN)
- **API-First**: RESTful API with TypeScript types
- **User Permissions**: Role-based access control (RBAC)

### 🔒 Security & Infrastructure
- **HTTPS**: Let's Encrypt SSL certificates (auto-renewal)
- **Nginx Reverse Proxy**: Secure backend, public frontend
- **Docker**: Isolated services, easy deployment
- **Role-Based Access**: Admin authentication with JWT
- **Network Isolation**: Backend not publicly exposed
- **Security Headers**: HSTS, CSP, X-Frame-Options

### 🚀 Performance & Developer Experience
- **TanStack Query**: Smart server state management with automatic caching
- **Redis Caching**: Fast data retrieval and session management
- **SQLite**: Lightweight, file-based database (persistent volumes)
- **HTTP/2**: Modern protocol for faster loading
- **SSR**: Server-side rendering for optimal SEO
- **Hot Reload**: Instant feedback during development
- **TypeScript**: Full type safety across frontend & backend
- **Code Highlighting**: Beautiful syntax highlighting with Shiki
- **DevTools**: TanStack Query DevTools for debugging

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Internet (HTTPS)                         │
│                 https://blog.bh-systems.be                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   Nginx (Port 443)   │  ← SSL/TLS Termination
              │   - HTTP → HTTPS     │  ← Let's Encrypt Certs
              │   - Reverse Proxy    │  ← HTTP/2 Enabled
              └──────────┬───────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Frontend   │  │   Backend    │  │    Redis     │
│ React Router │  │    Strapi    │  │   Cache      │
│  (SSR App)   │  │   Headless   │  │  Key-Value   │
│              │  │     CMS      │  │    Store     │
│ Port: 3000   │  │ Port: 1337   │  │ Port: 6379   │
│  (internal)  │  │  (internal)  │  │  (internal)  │
└──────────────┘  └──────┬───────┘  └──────────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │   SQLite    │
                  │  Database   │
                  │ data/data.db│
                  │  (Volume)   │
                  └─────────────┘

Docker Network: blog-network (Internal communication)
Volumes: strapi_data, strapi_uploads, redis_data
```

### Tech Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Frontend Framework** | React Router v7 | 7.7.1 | SSR application, file-based routing |
| **UI Library** | React | 19.1.0 | Component-based UI |
| **State Management** | TanStack Query | 5.90.2 | Server state management, caching |
| **Styling** | Tailwind CSS | 4.1.13 | Utility-first CSS framework |
| **UI Components** | Radix UI | 2.x | Accessible headless components |
| **Animations** | Framer Motion | 12.23.15 | Advanced animations & gestures |
| **Icons** | Lucide React | 0.544.0 | Beautiful consistent icons |
| **Markdown** | Marked + React Markdown | 16.3.0 | Content rendering |
| **Code Highlighting** | Shiki | 3.13.0 | Syntax highlighting |
| **Type Safety** | TypeScript | 5.9.2 | Static type checking |
| **Backend CMS** | Strapi | 5.24.1 | Headless CMS, REST API |
| **Database** | SQLite 3 + better-sqlite3 | 11.3.0 | Lightweight file-based storage |
| **Cache** | Redis | 7.4 | Performance optimization |
| **Web Server** | Nginx (Alpine) | Latest | Reverse proxy, SSL termination |
| **Runtime** | Node.js | 20.19.5 | JavaScript runtime |
| **Containerization** | Docker + Docker Compose | Latest | Service orchestration |
| **SSL** | Let's Encrypt (Certbot) | - | Free SSL certificates |
| **Build Tool** | Vite | 6.3.3 | Fast bundler & dev server |

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)
- Git

### Production Deployment (VPS)

1. **Clone the repository**
```bash
git clone https://github.com/boujrafh/blog_strapi.git
cd blog_strapi
```

2. **Configure environment variables**
```bash
# Backend (.env.production)
cp backend/.env.example backend/.env.production

# Update with your values:
# - JWT secrets
# - Admin credentials
# - Domain configuration
```

3. **Deploy with Docker Compose**
```bash
# Start all services
docker compose up -d

# Check container status
docker compose ps

# View logs
docker compose logs -f
```

4. **Create Strapi Super Admin**
```bash
# Access admin panel
https://blog.bh-systems.be/admin

# Or via IP (temporary)
http://YOUR_VPS_IP:1337/admin

# Register first admin account
```

5. **Configure Public Permissions**
- Navigate to **Settings** → **Users & Permissions Plugin** → **Roles** → **Public**
- Enable permissions for:
  - ✅ Article: `find`, `findOne`
  - ✅ Project: `find`, `findOne`  
  - ✅ Category: `find`, `findOne`
  - ✅ Tag: `find`, `findOne`
  - ✅ Upload: `find`, `findOne`
- Click **Save**

### Local Development

**Frontend** (with hot reload):
```bash
cd frontend
npm install
npm run dev
# Access: http://localhost:5190
```

**Backend** (standalone):
```bash
cd backend
npm install
npm run develop
# Access: http://localhost:1337/admin
```

## 📁 Project Structure

Ce projet supporte **3 environnements distincts** pour différents cas d'usage :

### 🎯 Les 3 Environnements de Travail

| Environnement | Frontend | Backend | Docker | Usage |
|---------------|----------|---------|--------|-------|
| **1️⃣ Local Dev** | `http://localhost:5190` | `http://localhost:1337` | ❌ Non | Développement rapide avec hot-reload |
| **2️⃣ Docker Dev** | `http://localhost:3001` | `http://localhost:1339` | ✅ Oui | Test de l'environnement de production en local |
| **3️⃣ Production VPS** | `https://blog.bh-systems.be` | (Internal network) | ✅ Oui | Déploiement final - Frontend public HTTPS, Backend isolé |

### 1️⃣ Environnement de Développement Local (npm run dev)

**Quand l'utiliser :**
- Développement quotidien avec hot-reload ultra-rapide
- Debugging avec breakpoints dans VSCode
- Tests de features frontend/backend isolées

**Configuration :**
```bash
# Terminal 1: Frontend React Router
cd frontend
npm run dev
# → http://localhost:5190 (React Router dev server)

# Terminal 2: Backend Strapi
cd backend
npm run develop
# → http://localhost:1337/admin
```

**Variables d'environnement** (`.env` à la racine):
```env
# Frontend accède au backend via localhost
VITE_STRAPI_URL=http://localhost:1337
VITE_STRAPI_URL_SERVER=http://localhost:1337
VITE_SITE_URL=http://localhost:5190
```

**Communication :**
- 🌐 Browser → `localhost:5190` → React Router Dev Server
- 🔌 Frontend SSR → `localhost:1337` → Strapi API
- 💾 Strapi → SQLite local (`backend/data/data.db`)

---

### 2️⃣ Environnement Docker Local (docker-compose.dev.yml)

**Quand l'utiliser :**
- Tester l'environnement de production en local
- Valider la configuration Docker avant déploiement VPS
- Reproduire des bugs spécifiques à Docker

**Configuration :**
```bash
# Démarrer tous les services Docker en mode dev
docker compose -f docker-compose.dev.yml up -d

# Frontend: http://localhost:3001
# Backend: http://localhost:1339/admin
```

**Différences avec Local Dev :**
- ⚠️ **Ports différents** : Frontend `3001`, Backend `1339` (vs `5173`/`1337`)
- 🐳 Code source monté en volumes (hot-reload conservé)
- 🔒 Réseau Docker interne (`blog-dev-network`)
- 📦 Base de données SQLite dans volume Docker (`strapi_dev_data`)

**Variables d'environnement** (`.env.docker`):
```env
VITE_STRAPI_URL=http://localhost:1339         # Pour le navigateur
VITE_STRAPI_URL_SERVER=http://strapi:1337     # Pour SSR (nom Docker)
VITE_SITE_URL=http://localhost:3001
```

**Communication :**
- 🌐 Browser → `localhost:3001` → Frontend Container
- 🔌 Frontend SSR → `strapi:1337` (Docker network) → Backend Container
- 💾 Backend → SQLite volume Docker

---

### 3️⃣ Environnement Production VPS (docker-compose.yml)

**Quand l'utiliser :**
- Déploiement final sur le serveur de production (173.212.208.181)
- Site accessible publiquement via HTTPS

**Architecture de Production :**
```
Internet (HTTPS)
       │
       ▼
┌──────────────────┐
│  Nginx (80/443)  │ ← Seul service exposé publiquement
│  blog.bh-systems │ ← SSL/TLS Let's Encrypt
│  .be             │ ← Reverse proxy
└────────┬─────────┘
         │
    Docker Network (blog-network - INTERNAL)
         │
    ┌────┴────┬─────────┬─────────┐
    ▼         ▼         ▼         ▼
┌─────────┐ ┌─────┐ ┌─────────┐ ┌───────┐
│Frontend │ │Strapi│ │ Redis  │ │SQLite │
│  :3000  │ │:1337│ │  :6379 │ │Volume │
│(internal│ │(int)│ │ (int)  │ │       │
└─────────┘ └─────┘ └─────────┘ └───────┘
```

**Configuration :**
```bash
# Sur le VPS (via SSH)
cd /root/blog_strapi
git pull
docker compose up -d --build

# OU depuis local (PowerShell)
./deploy-simple-vps.ps1
```

**Variables d'environnement** (`.env.production`):
```env
# Frontend public HTTPS
VITE_STRAPI_URL=https://blog.bh-systems.be
VITE_STRAPI_URL_SERVER=http://strapi:1337  # Communication interne Docker
VITE_SITE_URL=https://blog.bh-systems.be

# Backend Strapi
PUBLIC_URL=https://blog.bh-systems.be
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=./data/data.db
```

**Communication :**
- 🌐 Internet → `https://blog.bh-systems.be` → Nginx (443)
- 📡 Nginx `/api/` → `http://strapi:1337/api` (internal)
- 📡 Nginx `/admin/` → `http://strapi:1337/admin` (internal)
- 📡 Nginx `/` → `http://frontend:3000` (internal)
- 💾 Strapi → SQLite volume (`strapi_data`)

**Sécurité :**
- ✅ **Backend JAMAIS exposé** publiquement (pas de port 1337 externe)
- ✅ **Frontend TOUJOURS accessible** via HTTPS
- ✅ Communication interne via réseau Docker isolé
- ✅ SSL/TLS automatique avec Let's Encrypt

---

### 📂 Arborescence des Fichiers

```
blog_strapi/
├── 🔧 Configuration des Environnements
│   ├── docker-compose.yml          # 3️⃣ PRODUCTION VPS (nginx public)
│   ├── docker-compose.dev.yml      # 2️⃣ DOCKER LOCAL (ports 1339, 3001)
│   ├── .env                         # 1️⃣ Local dev (npm run dev)
│   ├── .env.docker                  # 2️⃣ Docker local
│   ├── .env.production              # 3️⃣ VPS production
│   └── .env.example                 # Template
│
├── 📦 Frontend (React Router v7)
│   ├── app/
│   │   ├── components/              # Composants réutilisables
│   │   │   ├── ui/                 # Primitives UI (Button, Card...)
│   │   │   ├── Header.tsx          # Navigation principale
│   │   │   ├── Footer.tsx          # Pied de page
│   │   │   └── Layout.tsx          # Layout racine
│   │   ├── hooks/                  # Custom React hooks
│   │   │   └── useDarkMode.ts      # Logique dark mode
│   │   ├── lib/                    # Utilitaires & types
│   │   │   ├── strapi.ts           # Client API Strapi
│   │   │   ├── types.ts            # Types TypeScript
│   │   │   └── utils.ts            # Fonctions helper
│   │   ├── routes/                 # Pages de l'application
│   │   │   ├── home.tsx            # Page d'accueil
│   │   │   ├── about.tsx           # À propos
│   │   │   ├── contact.tsx         # Formulaire contact
│   │   │   ├── blog/               # Section blog
│   │   │   │   ├── index.tsx       # Liste articles
│   │   │   │   └── $slug.tsx       # Détail article
│   │   │   └── projects/           # Section projets
│   │   │       ├── index.tsx       # Liste projets
│   │   │       └── $slug.tsx       # Détail projet
│   │   ├── app.css                 # Styles globaux
│   │   ├── root.tsx                # Point d'entrée app
│   │   └── routes.ts               # Configuration routes
│   ├── public/                      # Assets statiques
│   ├── Dockerfile                   # Container frontend
│   └── package.json
│
├── 🗄️ Backend (Strapi v5.24.1)
│   ├── config/                      # Configuration Strapi
│   │   ├── server.ts               # Paramètres serveur
│   │   ├── database.ts             # Config SQLite
│   │   ├── middlewares.ts          # CORS, security headers
│   │   └── plugins.ts              # Config plugins
│   ├── src/
│   │   ├── api/                    # Content types
│   │   │   ├── article/           # API Articles
│   │   │   ├── project/           # API Projets
│   │   │   ├── category/          # API Catégories
│   │   │   └── tag/               # API Tags
│   │   ├── components/            # Composants réutilisables
│   │   │   └── seo/              # Composant SEO
│   │   └── index.ts
│   ├── data/                       # 💾 Base SQLite (volume Docker)
│   ├── public/uploads/             # 📁 Médias uploadés (volume)
│   ├── Dockerfile                  # Container backend
│   └── package.json
│
├── 🌐 Nginx (Reverse Proxy)
│   ├── nginx.conf                  # Config proxy HTTPS
│   └── conf.d/                     # Configs supplémentaires
│
├── 🚀 Scripts de Déploiement
│   ├── deploy-simple-vps.ps1       # Déploiement VPS automatisé
│   ├── reset-strapi-db.ps1         # Reset base de données
│   └── check-strapi-logs.ps1       # Voir les logs Strapi
│
├── 📚 Documentation
│   ├── README.md                   # Ce fichier
│   ├── ENVIRONNEMENTS.md           # Guide détaillé des 3 environnements
│   ├── ARCHITECTURE-VPS.md         # Architecture VPS
│   └── DEPLOY-FINAL.md             # Guide de déploiement
│
└── package.json                    # Monorepo scripts (npm run dev)
```

---

### 🎮 Commandes Rapides par Environnement

#### 1️⃣ Développement Local (npm run dev)
```bash
# Démarrer frontend + backend simultanément
npm run dev

# OU séparément :
cd frontend && npm run dev    # → http://localhost:5190
cd backend && npm run develop # → http://localhost:1337/admin
```

#### 2️⃣ Docker Local (docker-compose.dev.yml)
```bash
# Démarrer l'environnement Docker complet
docker compose -f docker-compose.dev.yml up -d

# Voir les logs
docker compose -f docker-compose.dev.yml logs -f

# Arrêter
docker compose -f docker-compose.dev.yml down

# Rebuild après changements de code
docker compose -f docker-compose.dev.yml up -d --build

# Accès :
# - Frontend: http://localhost:3001
# - Backend: http://localhost:1339/admin
```

#### 3️⃣ Production VPS (docker-compose.yml)
```bash
# Depuis local (PowerShell) - Déploiement automatisé
./deploy-simple-vps.ps1

# OU directement sur VPS (SSH)
ssh root@173.212.208.181
cd /root/blog_strapi
git pull
docker compose up -d --build

# Accès :
# - Frontend: https://blog.bh-systems.be
# - Backend Admin: https://blog.bh-systems.be/admin
```

---

### 📋 Résumé des URLs par Environnement

| Environnement | Frontend | Backend Admin | Backend API |
|---------------|----------|---------------|-------------|
| **Local Dev** | `http://localhost:5190` | `http://localhost:1337/admin` | `http://localhost:1337/api` |
| **Docker Local** | `http://localhost:3001` | `http://localhost:1339/admin` | `http://localhost:1339/api` |
| **Production VPS** | `https://blog.bh-systems.be` | `https://blog.bh-systems.be/admin` | `https://blog.bh-systems.be/api` |

**⚠️ Important :**
- En **production**, le backend n'est **jamais exposé directement** (pas de port 1337 externe)
- Toutes les requêtes passent par **Nginx** qui route vers les services internes Docker
- Le **frontend** est toujours accessible publiquement via HTTPS
- La communication **backend ↔ frontend** se fait via le réseau Docker interne

---

## 🛠️ Development

### Available Scripts

**Frontend**:
```bash
npm run dev          # Development server (hot reload)
npm run build        # Production build
npm run start        # Start production server
npm run typecheck    # TypeScript validation
```

**Backend** (Strapi):
```bash
npm run develop      # Development mode with auto-reload
npm run start        # Production mode
npm run build        # Build admin panel
npm run strapi       # Strapi CLI commands
```

**Docker**:
```bash
docker compose up -d              # Start all services
docker compose down               # Stop all services
docker compose logs -f [service]  # View service logs
docker compose ps                 # List containers
docker compose restart [service]  # Restart specific service
```

### Environment Variables

**Backend** (`.env.production`):
```bash
# Application
NODE_ENV=production
HOST=0.0.0.0
PORT=1337
PUBLIC_URL=https://blog.bh-systems.be

# Database (SQLite)
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=./data/data.db

# Security (Generate with: openssl rand -base64 32)
JWT_SECRET=your-jwt-secret-min-32-chars
ADMIN_JWT_SECRET=your-admin-jwt-secret-min-32-chars
API_TOKEN_SALT=your-api-token-salt-min-32-chars
TRANSFER_TOKEN_SALT=your-transfer-token-salt-min-32-chars
APP_KEYS=key1,key2,key3,key4

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
```

**Frontend** (build args):
```bash
VITE_STRAPI_URL=http://strapi:1337  # Internal Docker network
VITE_API_URL=http://strapi:1337/api
VITE_SITE_URL=https://blog.bh-systems.be
VITE_SITE_NAME=Modern Blog Leader
```

## � Pages de l'Application

Le site est structuré avec **React Router v7** (file-based routing) et offre les pages suivantes :

### 🏠 Pages Publiques

#### 1. **Page d'Accueil** (`/` - `home.tsx`)
**Fonctionnalité** :
- Hero section avec présentation du blog
- Affichage des **3 derniers articles** (via TanStack Query)
- Affichage des **3 derniers projets**
- Section features avec animations (Framer Motion)
- Call-to-action vers le blog et les projets

**Données** :
- Utilise `getPosts({ page: 1, pageSize: 3 })` pour charger les articles récents
- Utilise `getProjects({ page: 1, pageSize: 3 })` pour charger les projets récents
- Cache public de 60 secondes (`Cache-Control: public, max-age=60`)

---

#### 2. **Blog - Liste des Articles** (`/blog` - `blog/index.tsx`)
**Fonctionnalité** :
- Liste paginée de tous les articles publiés
- **Article featured** en haut (premier article avec mise en avant)
- Grille d'articles avec images, extraits, catégories, tags
- Pagination avec boutons Prev/Next
- Support multilingue (FR/EN via i18n)
- Filtrage par langue actuelle

**Données** :
- **Loader SSR** : `getPosts({ page, pageSize: 10 })` pour le rendu serveur
- **TanStack Query** : Hydratation côté client pour navigation fluide
- Métadonnées SEO : balises `rel="prev"` et `rel="next"` pour pagination
- Temps de lecture calculé automatiquement

**Paramètres URL** :
- `?page=2` pour la pagination

---

#### 3. **Article Détail** (`/blog/:slug` - `blog/$slug.tsx`)
**Fonctionnalité** :
- Affichage complet d'un article avec :
  - **Markdown rendering** (via Shiki pour syntax highlighting)
  - **Table des matières** (TOC) automatique
  - Image featured responsive
  - Métadonnées (auteur, date, temps de lecture, catégorie, tags)
  - Boutons de partage social (Twitter, Facebook, LinkedIn)
  - Navigation Prev/Next vers articles adjacents
  - Analytics de lecture (tracking des vues)

**Données** :
- `getPostBySlug(slug)` pour récupérer l'article
- Rendu Markdown server-side avec `renderMarkdown()`
- Normalisation du contenu avec `normalizeContent()`
- Recherche des articles précédent/suivant par date de publication

**SEO** :
- Meta title/description personnalisés (via composant SEO)
- Open Graph tags pour réseaux sociaux
- Canonical URL
- Schema.org Article markup

---

#### 4. **Projets - Liste** (`/projects` - `projects/index.tsx`)
**Fonctionnalité** :
- Portfolio de projets avec pagination
- **Projet featured** en haut (mise en avant)
- Grille de projets avec images, descriptions, tags
- Liens vers démo live et GitHub
- Animations au scroll

**Données** :
- Loader SSR : `getProjects({ page, pageSize: 12 })`
- Cache public de 300 secondes
- Métadonnées SEO avec pagination

---

#### 5. **Projet Détail** (`/projects/:slug` - `projects/$slug.tsx`)
**Fonctionnalité** :
- Page détaillée d'un projet avec :
  - Galerie d'images
  - Description complète (Markdown)
  - Technologies utilisées (tags)
  - Liens vers démo et code source
  - SEO optimisé

**Données** :
- `getProjectBySlug(slug)` pour récupérer le projet
- Rendu Markdown pour la description

---

#### 6. **À Propos** (`/about` - `about.tsx`)
**Fonctionnalité** :
- Présentation de l'équipe/mission
- Valeurs et objectifs du blog
- Statistiques (optionnel)
- Navigation rapide (QuickNav)

**Cache** : 600 secondes (contenu statique)

---

#### 7. **Contact** (`/contact` - `contact.tsx`)
**Fonctionnalité** :
- Formulaire de contact sécurisé (SecureForm)
- Validation côté client
- Protection XSS/injection
- État de soumission (idle/success/error)

**Composants sécurisés** :
- `SecureInput` : Input avec sanitization
- `SecureTextarea` : Textarea protégé
- `SecureForm` : Wrapper avec CSRF protection

---

#### 8. **404 - Page Non Trouvée** (`/not-found` - `not-found.tsx`)
**Fonctionnalité** :
- Page d'erreur personnalisée
- Suggestions de navigation
- Retour à l'accueil

---

### 🔧 Pages Techniques

#### 9. **Sitemap XML** (`/sitemap.xml` - `sitemap[.]xml.tsx`)
**Fonctionnalité** :
- Génération automatique du sitemap pour SEO
- Liste toutes les URLs publiques (articles, projets, pages statiques)
- Fréquence de mise à jour et priorités

**Format** :
```xml
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://blog.bh-systems.be/blog/mon-article</loc>
    <lastmod>2025-10-12</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

---

#### 10. **RSS Feed** (`/rss.xml` - `rss[.]xml.tsx`)
**Fonctionnalité** :
- Flux RSS pour abonnement aux articles
- Format XML standard RSS 2.0
- Inclut titre, description, auteur, date

---

#### 11. **API Webhook N8N** (`/api/webhooks/n8n` - `api/webhooks/n8n.tsx`)
**Fonctionnalité** :
- Endpoint pour recevoir des webhooks de N8N (automation)
- Création automatique d'articles depuis sources externes (Reddit, etc.)
- Validation et sanitization des données

---

### 🔐 Pages Admin

#### 12. **Login** (`/login` - `login/index.tsx`)
**Fonctionnalité** :
- Authentification des administrateurs
- Redirection vers panel admin

#### 13. **Admin Panel** (`/admin` - `admin/index.tsx`)
**Fonctionnalité** :
- Tableau de bord administrateur
- Accès protégé (authentification requise)

---

## 📝 Workflow de Création de Contenu

### 🎨 Création d'un Article dans Strapi

#### Étape 1 : Accéder au Panel Admin

**Environnements** :
- **Production** : `https://blog.bh-systems.be/admin`
- **Local Dev** : `http://localhost:1337/admin`
- **Docker Local** : `http://localhost:1339/admin`

#### Étape 2 : Créer un Nouvel Article

1. **Connexion** : Connectez-vous avec vos identifiants super admin
2. **Navigation** : Dans le menu latéral, cliquez sur **Content Manager** → **Article**
3. **Nouveau** : Cliquez sur **Create new entry**

#### Étape 3 : Remplir les Champs

**Champs Obligatoires** :
- ✅ **Title** (Titre) : Le titre de l'article (min 10 caractères, max 255)
  - Exemple : `"Guide Complet React Router v7 en 2025"`
- ✅ **Slug** : URL-friendly (auto-généré depuis le titre)
  - Exemple : `guide-complet-react-router-v7-2025`
- ✅ **Content** (Contenu) : Éditeur riche pour le corps de l'article
  - Support **Markdown** et **Rich Text**
  - Insertion d'images, liens, code blocks

**Champs Recommandés** :
- 📝 **Excerpt** (Extrait) : Résumé court (20-160 caractères) pour SEO
  - Affiché dans les listes d'articles et meta descriptions
- 🖼️ **Featured Image** : Image mise en avant (1200x630px recommandé)
  - Formats acceptés : JPG, PNG, WebP
  - Optimisation automatique (breakpoints : 1920, 1000, 750, 500, 64px)
- 📂 **Category** : Catégorie principale (relation many-to-one)
  - Exemples : `Web Development`, `Tutorial`, `News`
- 🏷️ **Tags** : Tags multiples (relation many-to-many)
  - Exemples : `React`, `TypeScript`, `SSR`, `Performance`
- 👤 **Author** : Auteur de l'article (relation vers User)
- ⏱️ **Reading Time** : Temps de lecture estimé en minutes (calculé automatiquement)

**Champs SEO** (Composant SEO) :
- 🔍 **Meta Title** : Titre pour moteurs de recherche (différent du titre si nécessaire)
- 📄 **Meta Description** : Description pour Google (max 160 caractères)
- 🔗 **Canonical URL** : URL canonique (optionnel)
- 🔑 **Keywords** : Mots-clés séparés par virgules
- 📷 **OG Image** : Image Open Graph pour réseaux sociaux

**Champs Avancés** :
- 📊 **Status** : État de l'article
  - `draft` : Brouillon (non publié)
  - `published` : Publié (visible sur le site)
  - `scheduled` : Programmé pour publication future
- 👁️ **View Count** : Nombre de vues (incrémenté automatiquement)

#### Étape 4 : Prévisualiser et Publier

1. **Sauvegarder Brouillon** : Cliquez sur **Save** pour sauvegarder sans publier
2. **Prévisualiser** : Testez l'affichage avant publication
3. **Publier** :
   - Activez **Published** (toggle en haut à droite)
   - Cliquez sur **Save & Publish**

#### Étape 5 : Vérifier sur le Site

L'article sera immédiatement disponible sur :
- **Liste** : `https://blog.bh-systems.be/blog`
- **Détail** : `https://blog.bh-systems.be/blog/[slug]`

---

### 🚀 Création d'un Projet

**Même workflow que les articles**, mais avec des champs spécifiques :
- **Title**, **Slug**, **Description** (Markdown)
- **Featured Image** + **Gallery** (plusieurs images)
- **Tags**, **Category**
- **Live URL** : Lien vers la démo en ligne
- **GitHub URL** : Lien vers le code source
- **Technologies** : Liste des technologies utilisées

---

### 🔄 Comment les Articles sont Affichés

#### 1. **Côté Backend (Strapi)**

**API REST automatique** :
- `GET /api/articles` : Liste tous les articles
- `GET /api/articles/:id` : Récupère un article par ID
- `GET /api/articles?filters[slug][$eq]=mon-slug` : Par slug

**Permissions** :
- Configurées dans **Settings → Users & Permissions → Roles → Public**
- Permissions requises : `find`, `findOne`

**Relations automatiques** :
- Les champs `category`, `tags`, `author` sont automatiquement peuplés (populate)
- Images optimisées avec formats multiples (responsive)

---

#### 2. **Côté Frontend (React Router)**

**Flux de données** :

```
1. Route demandée (/blog/mon-article)
       ↓
2. Loader SSR exécuté (server-side)
   → getPostBySlug("mon-article")
       ↓
3. Fetch API Strapi
   → GET http://strapi:1337/api/articles?filters[slug][$eq]=mon-article
       ↓
4. Strapi retourne les données JSON
   {
     "data": {
       "id": 1,
       "attributes": {
         "title": "Mon Article",
         "content": "# Markdown...",
         "featured_image": { ... },
         "category": { ... },
         "tags": [ ... ]
       }
     }
   }
       ↓
5. Normalisation du contenu
   → normalizeContent(post.content)
       ↓
6. Rendu Markdown server-side
   → renderMarkdown(markdown, 'github-light')
   → HTML + Table of Contents (TOC)
       ↓
7. Hydratation React côté client
   → TanStack Query prend le relais pour navigation fluide
       ↓
8. Page affichée avec :
   - HTML pré-rendu (SEO)
   - Interactivité React
   - Analytics tracking
```

**Optimisations** :
- ✅ **SSR** : Rendu server-side pour Google crawlers
- ✅ **TanStack Query** : Cache intelligent côté client (60s)
- ✅ **Markdown Server-Side** : Syntax highlighting avec Shiki (pas de client-side parsing)
- ✅ **Images Responsive** : Srcset automatique avec breakpoints Strapi
- ✅ **Lazy Loading** : Images chargées progressivement

---

### 🤖 Génération Automatique d'Articles (N8N - Optionnel)

**Workflow d'automation** :
1. **Trigger** : N8N détecte un nouveau post Reddit/Twitter/RSS
2. **Transformation** : Extraction du contenu, résumé IA
3. **Webhook** : POST vers `/api/webhooks/n8n`
4. **Validation** : Sanitization et structuration des données
5. **Création** : Article créé automatiquement dans Strapi (status: draft)
6. **Révision Humaine** : Admin revoit et publie

**Fichiers liés** :
- `backend/n8n-workflow-generator.js` : Générateur de workflow
- `backend/demo-n8n-workflow.json` : Template de workflow N8N
- `frontend/app/routes/api/webhooks/n8n.tsx` : Endpoint de réception

---

### 📊 Analytics et Tracking

**Vues d'Articles** :
- Hook `useArticleAnalytics()` dans `blog/$slug.tsx`
- Incrémente automatiquement le champ `viewCount` de Strapi
- Tracking Google Analytics (si `VITE_GA_MEASUREMENT_ID` configuré)

**Données collectées** :
- Nombre de vues par article
- Temps de lecture effectif
- Partages sociaux (via boutons)

---

## �🔧 Configuration

### SSL Certificates (Let's Encrypt)

Certificates should be located at:
```
/etc/letsencrypt/live/blog.bh-systems.be/
├── fullchain.pem
├── privkey.pem
├── cert.pem
└── chain.pem
```

Auto-renewal with certbot (cron):
```bash
0 3 * * 1 certbot renew --quiet && docker compose restart nginx
```

### Nginx Configuration

See `nginx/nginx.conf` for:
- HTTP → HTTPS redirect (301)
- SSL/TLS settings (TLS 1.2+)
- Reverse proxy rules
- Security headers (HSTS, CSP)
- Gzip compression

### Strapi Content Types (Détails Techniques)

#### 📰 Content Type: **Article**

**Schema** : `backend/src/api/article/content-types/article/schema.json`

| Champ | Type | Requis | i18n | Description |
|-------|------|--------|------|-------------|
| `title` | string | ✅ | ✅ | Titre de l'article (10-255 caractères) |
| `slug` | uid | ✅ | ❌ | URL unique (auto-généré depuis title) |
| `content` | richtext | ✅ | ✅ | Contenu principal (Markdown/Rich Text) |
| `excerpt` | text | ❌ | ✅ | Résumé court (20-160 caractères pour SEO) |
| `featured_image` | media | ❌ | ❌ | Image mise en avant (1200x630px) |
| `status` | enum | ✅ | ❌ | État : `draft`, `published`, `scheduled` |
| `seo` | component | ❌ | ❌ | Composant SEO (metaTitle, metaDescription, etc.) |
| `category` | relation | ❌ | ❌ | Catégorie (many-to-one) |
| `tags` | relation | ❌ | ❌ | Tags multiples (many-to-many) |
| `author` | relation | ❌ | ❌ | Auteur (User) |
| `readingTime` | integer | ❌ | ❌ | Temps de lecture estimé (minutes) |
| `viewCount` | integer | ❌ | ❌ | Nombre de vues (auto-incrémenté) |
| `publishedAt` | datetime | ❌ | ❌ | Date de publication (draft & publish activé) |

**Fonctionnalités** :
- ✅ **Draft & Publish** : Système de brouillon/publication
- ✅ **i18n** : Support multilingue FR/EN (champs title, content, excerpt)
- ✅ **Relations** : Catégorie, tags, auteur automatiquement peuplés
- ✅ **SEO** : Composant SEO réutilisable pour métadonnées

---

#### 🚀 Content Type: **Project**

**Schema** : `backend/src/api/project/content-types/project/schema.json`

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `title` | string | ✅ | Nom du projet |
| `slug` | uid | ✅ | URL unique |
| `description` | richtext | ✅ | Description complète (Markdown) |
| `excerpt` | text | ❌ | Résumé court |
| `featured_image` | media | ❌ | Image principale |
| `gallery` | media | ❌ | Galerie d'images (multiple) |
| `tags` | relation | ❌ | Technologies utilisées |
| `category` | relation | ❌ | Catégorie du projet |
| `seo` | component | ❌ | Métadonnées SEO |
| `liveUrl` | string | ❌ | URL de la démo en ligne |
| `githubUrl` | string | ❌ | Lien vers le code source |
| `status` | enum | ✅ | `draft`, `published`, `archived` |

**Fonctionnalités** :
- ✅ **Galerie** : Plusieurs images pour portfolio
- ✅ **Liens Externes** : Démo live + GitHub
- ✅ **Technologies** : Tags pour stack technique

---

#### 📂 Content Type: **Category**

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `name` | string | ✅ | Nom de la catégorie |
| `slug` | uid | ✅ | URL-friendly slug |
| `description` | text | ❌ | Description de la catégorie |
| `articles` | relation | ❌ | Articles liés (inverse relation) |
| `projects` | relation | ❌ | Projets liés (inverse relation) |

**Exemples** :
- `Web Development`, `Machine Learning`, `DevOps`, `Tutorial`, `News`

---

#### 🏷️ Content Type: **Tag**

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `name` | string | ✅ | Nom du tag |
| `slug` | uid | ✅ | URL-friendly slug |
| `description` | text | ❌ | Description optionnelle |
| `articles` | relation | ❌ | Articles liés |
| `projects` | relation | ❌ | Projets liés |

**Exemples** :
- `React`, `TypeScript`, `Docker`, `Performance`, `Security`, `API`

---

#### 🔍 Composant Réutilisable: **SEO Data**

**Schema** : `backend/src/components/seo/seo-data.json`

| Champ | Type | Description |
|-------|------|-------------|
| `metaTitle` | string | Titre pour moteurs de recherche (max 60 caractères) |
| `metaDescription` | text | Description pour Google (max 160 caractères) |
| `canonicalURL` | string | URL canonique (éviter duplicate content) |
| `keywords` | string | Mots-clés séparés par virgules |
| `metaImage` | media | Image Open Graph pour réseaux sociaux (1200x630px) |
| `metaRobots` | string | Directives robots (index, follow, noindex, etc.) |
| `structuredData` | json | Schema.org structured data (optionnel) |

**Utilisation** :
- Attaché aux Articles et Projets
- Génère automatiquement les balises `<meta>`, Open Graph, Twitter Cards

---

## 📊 Monitoring & Logs

### Health Checks

All services include health checks:
```bash
# Strapi
curl http://localhost:1337/_health

# Frontend
curl http://localhost:3000

# Nginx
docker exec blog-nginx nginx -t
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f blog-strapi
docker compose logs -f blog-frontend
docker compose logs -f blog-nginx
docker compose logs -f blog-redis

# Last 50 lines
docker compose logs --tail=50 blog-strapi
```

### Database Backup

SQLite database location:
```bash
# Container: /opt/app/data/data.db
# Host volume: strapi_data

# Backup
docker compose exec strapi sqlite3 /opt/app/data/data.db ".backup /tmp/backup.db"
docker cp blog-strapi:/tmp/backup.db ./backup-$(date +%Y%m%d).db

# Restore
docker cp ./backup.db blog-strapi:/opt/app/data/data.db
docker compose restart blog-strapi
```

## � Deployment

### VPS Requirements

- **OS**: Ubuntu 22.04 LTS (recommended)
- **RAM**: 2GB minimum (4GB recommended)
- **Storage**: 20GB minimum
- **Docker**: 20.10+ with Docker Compose
- **Ports**: 80 (HTTP), 443 (HTTPS), 1337 (Strapi - optional)

### Deployment Steps

1. **Prepare VPS**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y
```

2. **Clone Repository**
```bash
cd /root
git clone https://github.com/boujrafh/blog_strapi.git
cd blog_strapi
```

3. **Configure SSL Certificates**
```bash
# Install certbot
sudo apt install certbot -y

# Generate certificates
sudo certbot certonly --standalone -d blog.bh-systems.be

# Certificates will be at:
# /etc/letsencrypt/live/blog.bh-systems.be/
```

4. **Set Environment Variables**
```bash
# Edit backend/.env.production
nano backend/.env.production

# Generate secrets with:
openssl rand -base64 32
```

5. **Deploy with Docker Compose**
```bash
# Use deployment script
./deploy-simple-vps.ps1  # On Windows
# Or manually:
docker compose up -d

# Check status
docker compose ps
```

6. **Configure Strapi**
- Access: https://blog.bh-systems.be/admin
- Create super admin account
- Configure public permissions (see Quick Start)

### Deployment Script (PowerShell)

```powershell
# deploy-simple-vps.ps1
.\deploy-simple-vps.ps1

# What it does:
# 1. SSH to VPS
# 2. Git pull latest changes
# 3. Restart Docker containers
# 4. Show container status
```

### CI/CD (Future)

GitHub Actions workflow for automated deployment:
- Run tests
- Build Docker images
- Push to registry
- Deploy to VPS via SSH

## 🔒 Security Best Practices

### Production Checklist

- [ ] **SSL/TLS**: HTTPS enabled with Let's Encrypt
- [ ] **Environment Variables**: Secrets not in Git
- [ ] **Firewall**: Only ports 80, 443 exposed
- [ ] **Backend Isolation**: Port 1337 disabled after setup
- [ ] **Strong Passwords**: 16+ characters with symbols
- [ ] **Regular Updates**: Docker images and dependencies
- [ ] **Backups**: Automated SQLite database backups
- [ ] **Monitoring**: Health checks enabled

### Security Headers (Nginx)

```nginx
# Content Security Policy
add_header Content-Security-Policy "default-src 'self'...";

# Strict Transport Security
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# Prevent clickjacking
add_header X-Frame-Options "SAMEORIGIN" always;

# XSS Protection
add_header X-Content-Type-Options "nosniff" always;
```

## 🐛 Troubleshooting

### Common Issues

**1. Nginx fails to start - SSL certificate error**
```bash
# Error: cannot load certificate "/etc/letsencrypt/live/blog.bh-systems.be/fullchain.pem"
# Solution: Check SSL certificates exist
ls -la /etc/letsencrypt/live/blog.bh-systems.be/

# If missing, generate with certbot
sudo certbot certonly --standalone -d blog.bh-systems.be
```

**2. Frontend shows 500 errors**
```bash
# Error: ForbiddenError: Forbidden access
# Solution: Configure Strapi public permissions
# Settings → Users & Permissions → Roles → Public
# Enable find + findOne for Article, Project, Category, Tag, Upload
```

**3. Cannot create Strapi admin - "Internal Server Error"**
```bash
# Error: Cannot send secure cookie over unencrypted connection
# Solution: Access via HTTPS instead of HTTP
# Use: https://blog.bh-systems.be/admin
# Not: http://IP:1337/admin
```

**4. Database reset needed**
```bash
# Stop containers
docker compose down

# Remove database volume
docker volume rm blog_strapi_strapi_data

# Restart
docker compose up -d

# Recreate admin account
```

**5. Port 1337 already in use**
```bash
# Check what's using the port
sudo lsof -i :1337

# Kill process or change Strapi port in docker-compose.yml
```

### Debug Commands

```bash
# Check container logs
docker compose logs -f blog-strapi

# Enter container shell
docker compose exec blog-strapi sh

# Check Strapi process
docker compose exec blog-strapi ps aux

# Test Strapi API
curl http://localhost:1337/_health

# Test frontend
curl http://localhost:3000

# Check nginx config
docker exec blog-nginx nginx -t
```

## 📚 Documentation

- **Strapi**: https://docs.strapi.io/
- **React Router v7**: https://reactrouter.com/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Docker**: https://docs.docker.com/
- **Nginx**: https://nginx.org/en/docs/

### Additional Resources

- [ARCHITECTURE-VPS.md](./ARCHITECTURE-VPS.md) - Detailed VPS architecture
- [DEPLOY-FINAL.md](./DEPLOY-FINAL.md) - Step-by-step deployment guide
- [configure-strapi-permissions.md](./configure-strapi-permissions.md) - Permission setup

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- **Code Style**: Use ESLint + Prettier
- **TypeScript**: Strict mode enabled
- **Commits**: Follow conventional commits
- **Testing**: Write tests for new features (coming soon)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## � Author

**Hicham Boujraf**
- GitHub: [@boujrafh](https://github.com/boujrafh)
- Website: [blog.bh-systems.be](https://blog.bh-systems.be)
- Email: boujraf.hicham@gmail.com

## 🙏 Acknowledgments

- **Strapi Team** - Amazing headless CMS
- **React Router Team** - Modern routing solution
- **Tailwind Labs** - Beautiful CSS framework
- **Let's Encrypt** - Free SSL certificates
- **Open Source Community** - For all the amazing tools

---

**Built with ❤️ using modern web technologies**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)]()
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)]()
[![Strapi](https://img.shields.io/badge/Strapi-2E7EEA?logo=strapi&logoColor=white)]()
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)]()
[![Nginx](https://img.shields.io/badge/Nginx-009639?logo=nginx&logoColor=white)]()
[![SQLite](https://img.shields.io/badge/SQLite-07405E?logo=sqlite&logoColor=white)]()

**Last Updated**: October 2025