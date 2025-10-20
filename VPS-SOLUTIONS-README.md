# 🔧 Solutions pour Résoudre le Problème VPS

Ce dossier contient **3 scripts PowerShell** pour diagnostiquer et résoudre les problèmes de déploiement Strapi sur le VPS.

---

## 🎯 Quelle Solution Choisir ?

### 📊 Étape 1 : DIAGNOSTIC (OBLIGATOIRE)

**Script** : `diagnose-vps-problem.ps1`

**Ce qu'il fait** :
- Collecte toutes les informations système (OS, RAM, disque)
- Vérifie Node.js, Docker, conteneurs en cours
- Affiche les logs des 3 services (Strapi, Frontend, Nginx)
- Teste la connectivité (localhost et externe)
- Vérifie les certificats SSL

**Quand l'utiliser** :
- ✅ **TOUJOURS EN PREMIER** avant toute autre action
- Vous permet de comprendre exactement quel est le problème

**Commande** :
```powershell
.\diagnose-vps-problem.ps1
```

**Résultat attendu** :
```
✅ Docker est installé
✅ Node.js est installé
⚠️ Conteneur Strapi n'est PAS en cours  ← LE PROBLÈME
✅ Conteneur Frontend est en cours
✅ Conteneur Nginx est en cours
```

---

### 🧪 Étape 2 : TEST SIMPLE (RECOMMANDÉ EN PREMIER)

**Script** : `test-strapi-vps-manual.ps1`

**Ce qu'il fait** :
1. Crée un nouveau dossier `/root/strapi-test` sur le VPS
2. Installe Strapi v5 avec `npx create-strapi-app` (SANS Docker)
3. Configure SQLite
4. Donne les instructions pour démarrer manuellement

**Avantages** :
- ✅ Isole le problème : Docker vs Strapi vs VPS
- ✅ Installation propre et officielle
- ✅ Rapide à tester (5 minutes)
- ✅ Aucune modification du code existant

**Quand l'utiliser** :
- Si vous ne savez pas si le problème vient de Docker ou de Strapi
- Pour vérifier que Strapi fonctionne sur le VPS

**Commande** :
```powershell
.\test-strapi-vps-manual.ps1
```

**Après l'exécution** :
1. Connectez-vous au VPS :
   ```bash
   ssh root@173.212.208.181
   ```

2. Allez dans le dossier de test :
   ```bash
   cd /root/strapi-test/test-blog
   ```

3. Démarrez Strapi :
   ```bash
   npm run develop
   ```

4. Testez dans votre navigateur :
   ```
   http://173.212.208.181:1337/admin
   ```

**Interprétation** :
- ✅ **Ça fonctionne** → Le problème vient du Dockerfile/Docker → Utilisez Solution 3 (Hybride)
- ❌ **Ça ne fonctionne pas** → Le problème vient du VPS/Node.js/Strapi → Voir section Troubleshooting

---

### 🔀 Étape 3 : SOLUTION HYBRIDE (SI TEST SIMPLE OK)

**Script** : `deploy-hybrid-solution.ps1`

**Ce qu'il fait** :
1. Installe Strapi **MANUELLEMENT** dans `/root/blog_strapi/backend`
2. Lance Strapi avec **PM2** (process manager)
3. Crée un `docker-compose.hybrid.yml` **SANS service Strapi**
4. Configure Nginx pour pointer vers `host.docker.internal:1337`
5. Frontend reste en Docker

**Architecture** :
```
Internet (HTTPS)
    ↓
Nginx (Docker) :443
    ↓
    ├── / → Frontend (Docker) :3000
    └── /api/ → Strapi (PM2 Manuel) :1337 (localhost)
```

**Avantages** :
- ✅ Évite complètement le problème du Dockerfile backend
- ✅ Strapi tourne en natif (performances optimales)
- ✅ Frontend reste isolé en Docker
- ✅ PM2 gère les redémarrages automatiques
- ✅ Facile à déboguer (logs PM2 accessibles)

**Inconvénients** :
- ⚠️ Architecture hybride (moins "propre")
- ⚠️ Nécessite PM2 sur le VPS

**Quand l'utiliser** :
- Si le test simple (Étape 2) a fonctionné
- Si vous voulez une solution qui marche **MAINTENANT**

**Commande** :
```powershell
.\deploy-hybrid-solution.ps1
```

**Après l'exécution** :

Vérifications :
```bash
# État de Strapi (PM2)
ssh root@173.212.208.181 "pm2 status"

# Logs Strapi
ssh root@173.212.208.181 "pm2 logs strapi-backend"

# État Docker
ssh root@173.212.208.181 "cd /root/blog_strapi && docker-compose -f docker-compose.hybrid.yml ps"

# Test connectivité
curl https://blog.bh-systems.be
curl https://blog.bh-systems.be/admin
```

Commandes utiles :
```bash
# Redémarrer Strapi
ssh root@173.212.208.181 "pm2 restart strapi-backend"

# Voir les logs en temps réel
ssh root@173.212.208.181 "pm2 logs strapi-backend --lines 100"

# Redémarrer Frontend
ssh root@173.212.208.181 "cd /root/blog_strapi && docker-compose -f docker-compose.hybrid.yml restart frontend"
```

---

## 🚨 Troubleshooting

### Problème : "Node.js n'est PAS installé"

**Solution** :
```bash
ssh root@173.212.208.181

# Installer Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Vérifier
node --version  # Devrait afficher v20.x.x
npm --version
```

---

### Problème : "Docker n'est PAS installé"

**Solution** :
```bash
ssh root@173.212.208.181

# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Installer Docker Compose
apt install docker-compose-plugin -y

# Vérifier
docker --version
docker compose version
```

---

### Problème : "Certificats SSL NOT FOUND"

**Solution** :
```bash
ssh root@173.212.208.181

# Installer Certbot
apt install certbot -y

# Générer les certificats
certbot certonly --standalone -d blog.bh-systems.be

# Vérifier
ls -la /etc/letsencrypt/live/blog.bh-systems.be/
```

---

### Problème : "Strapi démarre mais plante après 30 secondes"

**Causes possibles** :
1. Manque de RAM (< 2GB)
2. SQLite database corrompue
3. Permissions fichiers incorrectes

**Solutions** :
```bash
ssh root@173.212.208.181

# 1. Vérifier la RAM
free -h
# Si < 2GB, augmenter la RAM du VPS

# 2. Supprimer la base SQLite
rm -rf /root/blog_strapi/backend/data/data.db
# Puis redémarrer Strapi (recréera la DB)

# 3. Corriger les permissions
chown -R root:root /root/blog_strapi/backend
chmod -R 755 /root/blog_strapi/backend
```

---

### Problème : "Port 1337 already in use"

**Solution** :
```bash
ssh root@173.212.208.181

# Trouver le processus
lsof -i :1337

# Tuer le processus
kill -9 <PID>

# OU si c'est PM2
pm2 delete all
```

---

### Problème : "Cannot find module 'ts-node'"

**Solution** :
```bash
ssh root@173.212.208.181
cd /root/blog_strapi/backend

# Installer ts-node globalement ET localement
npm install -g ts-node
npm install ts-node @types/node typescript

# Rebuild
npm run build
```

---

## 📋 Récapitulatif de la Stratégie

```
┌─────────────────────────────────────────────────┐
│  1. DIAGNOSTIC (OBLIGATOIRE)                    │
│     .\diagnose-vps-problem.ps1                  │
│     → Comprendre le problème                    │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  2. TEST SIMPLE (RECOMMANDÉ)                    │
│     .\test-strapi-vps-manual.ps1                │
│     → Strapi fonctionne-t-il sans Docker ?      │
└──────────────────┬──────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
    ✅ Ça marche        ❌ Ça ne marche pas
         │                   │
         │                   ▼
         │            Problème VPS/Node.js
         │            → Voir Troubleshooting
         │
         ▼
┌─────────────────────────────────────────────────┐
│  3. SOLUTION HYBRIDE                            │
│     .\deploy-hybrid-solution.ps1                │
│     → Strapi manuel + Frontend Docker           │
└─────────────────────────────────────────────────┘
```

---

## 🎯 Recommandation Finale

**Je te conseille de faire dans l'ordre** :

1. ✅ **Diagnostic** → Pour savoir où on en est
   ```powershell
   .\diagnose-vps-problem.ps1
   ```

2. ✅ **Test Simple** → Pour isoler le problème
   ```powershell
   .\test-strapi-vps-manual.ps1
   ```
   Puis sur le VPS :
   ```bash
   ssh root@173.212.208.181
   cd /root/strapi-test/test-blog
   npm run develop
   ```
   Tester : `http://173.212.208.181:1337/admin`

3. ✅ **Si le test marche** → Solution Hybride
   ```powershell
   .\deploy-hybrid-solution.ps1
   ```

4. ✅ **Si le test ne marche pas** → Problème plus profond (Node.js/VPS)
   - Voir section Troubleshooting
   - Peut-être réinstaller Node.js
   - Vérifier les logs système : `journalctl -xe`

---

## 💡 Pourquoi cette approche ?

1. **Diagnostic** = On comprend le problème
2. **Test Simple** = On isole le problème (Docker vs Strapi)
3. **Solution Hybride** = On évite le problème en contournant Docker pour Strapi

**Philosophie** : "Si ça marche sans Docker, alors utilisons-le sans Docker (au moins pour Strapi)"

Le frontend reste en Docker car il n'a jamais posé problème. On garde les avantages de Docker là où ça marche, et on utilise du natif là où Docker pose problème.

---

## 📞 Besoin d'Aide ?

Si aucune solution ne fonctionne :
1. Exécute `.\diagnose-vps-problem.ps1` et partage le résultat
2. Vérifie les logs : `ssh root@173.212.208.181 "docker compose logs strapi"`
3. Vérifie la RAM disponible : `ssh root@173.212.208.181 "free -h"`

---

**Bonne chance! 🚀**
