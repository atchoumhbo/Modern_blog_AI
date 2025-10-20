# 🚀 Guide Déploiement Phase 3 - N8N Integration

## ✅ Prérequis

- [ ] Backend Phase 3 committé sur GitHub (✅ Done: commits 9a0b0c9 + fa01575)
- [ ] N8N instance accessible: https://n8n.bh-systems.be
- [ ] VPS accessible: 173.212.208.181
- [ ] Compte MERN: boujraf.hicham@gmail.com

---

## 📋 ÉTAPE 1 : Créer l'API Key MERN (pour N8N)

### Option A : Via PowerShell (recommandé)

```powershell
# 1. Login pour obtenir JWT temporaire
$login = Invoke-RestMethod -Uri "https://blog.bh-systems.be/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"boujraf.hicham@gmail.com","password":"TON_PASSWORD"}'

Write-Host "🔑 JWT Token obtenu!" -ForegroundColor Green
$token = $login.token

# 2. Créer l'API Key permanente pour N8N
$apiKey = Invoke-RestMethod -Uri "https://blog.bh-systems.be/api/api-keys" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"Authorization"="Bearer $token"} `
  -Body '{"name":"N8N Workflow Automation","canRead":true,"canWrite":true,"canDelete":false}'

Write-Host ""
Write-Host "✅ API Key créée avec succès!" -ForegroundColor Green
Write-Host ""
Write-Host "🔐 COPIE CETTE CLÉ (tu ne pourras plus la revoir):" -ForegroundColor Yellow
Write-Host $apiKey.key -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Sauvegarde-la pour l'étape 3 (modification N8N workflow)" -ForegroundColor Yellow
```

### Option B : Via cURL

```bash
# 1. Login
curl -X POST https://blog.bh-systems.be/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"boujraf.hicham@gmail.com","password":"TON_PASSWORD"}'

# Copie le token JWT de la réponse

# 2. Créer API Key
curl -X POST https://blog.bh-systems.be/api/api-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "name": "N8N Workflow Automation",
    "canRead": true,
    "canWrite": true,
    "canDelete": false
  }'

# Copie l'API Key (mbk_live_...) de la réponse
```

**⚠️ IMPORTANT : Sauvegarde l'API Key quelque part (elle commence par `mbk_live_`)**

---

## 📋 ÉTAPE 2 : Récupérer l'API Key N8N

1. Va sur **https://n8n.bh-systems.be**
2. Click sur ton avatar → **Settings**
3. Onglet **API**
4. Click **Create API Key**
5. Copie la clé générée

---

## 📋 ÉTAPE 3 : Déployer Phase 3 sur le VPS

```powershell
# Depuis le dossier blog_strapi
cd C:\Devops\blog_strapi

# Exécute le script de déploiement
.\deploy-phase3-n8n.ps1 -N8N_API_KEY "ta-cle-n8n-ici"
```

**Ce script va :**
- ✅ Pull le code depuis GitHub
- ✅ Mettre à jour `.env` avec N8N_BASE_URL et N8N_API_KEY
- ✅ Générer ENCRYPTION_KEY si manquant
- ✅ Lancer les migrations Prisma (table `user_credentials`, contrainte unique)
- ✅ Rebuild le container backend
- ✅ Restart les services
- ✅ Tester la connexion N8N

---

## 📋 ÉTAPE 4 : Modifier le Workflow N8N

1. Va sur **https://n8n.bh-systems.be**
2. Ouvre le workflow : **"Reddit Tech Analysis & Content Generation - Advanced"**
3. Click sur le node : **"Post Articles to Strapi"**
4. Dans les **Headers** :
   - ❌ **Supprime** : `Authorization: Bearer a4239ed0...`
   - ✅ **Ajoute** : 
     ```
     Header Name: X-API-Key
     Header Value: mbk_live_... (ta clé de l'étape 1)
     ```
5. **Save** le workflow
6. Click **Execute Workflow** pour tester

---

## 📋 ÉTAPE 5 : Tester End-to-End

### Test 1 : Vérifier la connexion N8N

```powershell
Invoke-RestMethod -Uri "https://blog.bh-systems.be/api/workflows/n8n/status"
```

**Réponse attendue :**
```json
{
  "connected": true,
  "url": "https://n8n.bh-systems.be",
  "workflowsCount": 1
}
```

### Test 2 : Lister les workflows disponibles

```powershell
Invoke-RestMethod -Uri "https://blog.bh-systems.be/api/workflows/available"
```

**Réponse attendue :**
```json
{
  "workflows": [
    {
      "id": "...",
      "name": "Reddit Tech Analysis & Content Generation - Advanced",
      "active": true,
      "tags": []
    }
  ]
}
```

### Test 3 : Exécuter le workflow depuis l'API MERN

```powershell
# Login d'abord
$login = Invoke-RestMethod -Uri "https://blog.bh-systems.be/api/auth/login" `
  -Method POST -ContentType "application/json" `
  -Body '{"email":"boujraf.hicham@gmail.com","password":"TON_PASSWORD"}'

# Exécuter le workflow
$execution = Invoke-RestMethod -Uri "https://blog.bh-systems.be/api/workflows/execute-n8n" `
  -Method POST -ContentType "application/json" `
  -Headers @{"Authorization"="Bearer $($login.token)"} `
  -Body '{"workflowName":"Reddit Tech Analysis & Content Generation - Advanced","inputData":{}}'

Write-Host "✅ Workflow lancé!" -ForegroundColor Green
Write-Host "Execution ID: $($execution.execution.id)"
Write-Host "N8N Execution ID: $($execution.execution.n8nExecutionId)"
Write-Host "Status: $($execution.execution.status)"
```

### Test 4 : Surveiller l'exécution

```powershell
# Récupère les détails de l'exécution
$executionId = $execution.execution.id

$details = Invoke-RestMethod -Uri "https://blog.bh-systems.be/api/workflows/executions/$executionId" `
  -Headers @{"Authorization"="Bearer $($login.token)"}

Write-Host "Status: $($details.status)" -ForegroundColor Cyan
Write-Host "Steps complétées: $($details.steps.Length)" -ForegroundColor Cyan

# Afficher les étapes
$details.steps | ForEach-Object {
    Write-Host "  - $($_.stepName): $($_.status)" -ForegroundColor $(
        if ($_.status -eq "completed") { "Green" } 
        elseif ($_.status -eq "failed") { "Red" } 
        else { "Yellow" }
    )
}
```

### Test 5 : Vérifier l'article créé

```powershell
# Lister les articles récents
$articles = Invoke-RestMethod -Uri "https://blog.bh-systems.be/api/articles?limit=5"

Write-Host ""
Write-Host "📰 Articles récents:" -ForegroundColor Green
$articles.articles | ForEach-Object {
    Write-Host "  - $($_.title)" -ForegroundColor White
    Write-Host "    Status: $($_.status) | Créé: $($_.createdAt)" -ForegroundColor Gray
}
```

---

## 🎯 Résumé des Commandes

```powershell
# 1. Créer API Key MERN
$login = Invoke-RestMethod -Uri "https://blog.bh-systems.be/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"boujraf.hicham@gmail.com","password":"TON_PASSWORD"}'
$apiKey = Invoke-RestMethod -Uri "https://blog.bh-systems.be/api/api-keys" -Method POST -ContentType "application/json" -Headers @{"Authorization"="Bearer $($login.token)"} -Body '{"name":"N8N Workflow Automation","canRead":true,"canWrite":true,"canDelete":false}'
Write-Host $apiKey.key

# 2. Déployer sur VPS
.\deploy-phase3-n8n.ps1 -N8N_API_KEY "ta-cle-n8n"

# 3. Modifier N8N workflow (manuel sur https://n8n.bh-systems.be)
#    Remplacer Authorization Bearer par X-API-Key: mbk_live_...

# 4. Tester
Invoke-RestMethod -Uri "https://blog.bh-systems.be/api/workflows/n8n/status"
```

---

## 🐛 Troubleshooting

### Erreur : "Invalid API key"

**Cause :** L'API Key MERN n'est pas correcte dans N8N.

**Solution :**
1. Vérifie que tu as bien copié l'API Key complète (mbk_live_...)
2. Vérifie le header dans N8N : `X-API-Key` (pas Authorization)
3. Recrée une nouvelle API Key si besoin

### Erreur : "N8N connection failed"

**Cause :** Le backend MERN ne peut pas atteindre N8N.

**Solution :**
1. Vérifie que N8N est accessible : `curl https://n8n.bh-systems.be`
2. Vérifie N8N_API_KEY dans `/root/blog_strapi/backend-mern/.env`
3. Vérifie les logs : `docker logs blog_strapi-backend-1`

### Workflow reste en PENDING

**Cause :** N8N n'a pas reçu la requête ou l'exécution a timeout.

**Solution :**
1. Vérifie les logs N8N sur https://n8n.bh-systems.be
2. Vérifie le nom exact du workflow (sensible à la casse)
3. Augmente le timeout : `N8N_TIMEOUT_MS=600000` (10 min)

### Article non créé malgré workflow COMPLETED

**Cause :** Le workflow N8N a réussi mais le POST /articles a échoué.

**Solution :**
1. Vérifie les logs du step "Post Articles" dans la DB
2. Vérifie que l'API Key a `canWrite: true`
3. Teste manuellement : `curl -X POST https://blog.bh-systems.be/api/articles -H "X-API-Key: ..." -H "Content-Type: application/json" -d '{"title":"Test",...}'`

---

## 📊 Monitoring

### Logs Backend

```bash
ssh root@173.212.208.181
cd /root/blog_strapi
docker logs -f blog_strapi-backend-1
```

### Logs Base de données

```bash
ssh root@173.212.208.181
docker exec -it blog_strapi-postgres-1 psql -U blog_mern

-- Voir les exécutions
SELECT id, workflow_name, status, created_at FROM workflow_executions ORDER BY created_at DESC LIMIT 10;

-- Voir les étapes d'une exécution
SELECT step_name, status, started_at, completed_at FROM workflow_steps WHERE execution_id = 'ID_ICI' ORDER BY started_at;

-- Voir les derniers articles
SELECT id, title, status, created_at FROM articles ORDER BY created_at DESC LIMIT 5;
```

---

## ✅ Checklist

- [ ] API Key MERN créée (mbk_live_...)
- [ ] API Key N8N récupérée
- [ ] Phase 3 déployée sur VPS
- [ ] Workflow N8N modifié (X-API-Key)
- [ ] Test connexion N8N OK
- [ ] Test liste workflows OK
- [ ] Test exécution workflow OK
- [ ] Article créé dans la DB

---

## 🎉 Succès !

Si tous les tests passent, tu as maintenant :
- ✅ Backend MERN avec WorkflowExecutorService
- ✅ Système de credentials sécurisé (AES-256)
- ✅ Intégration N8N fonctionnelle
- ✅ Workflow automatique Reddit → Article
- ✅ Monitoring en temps réel des exécutions
- ✅ API Keys permanentes pour l'automation

**Phase 3 Part 1 : COMPLETE! 🚀**

Prochaine étape : Interface de monitoring (`/admin/workflows/:id` + `/admin/settings`)
