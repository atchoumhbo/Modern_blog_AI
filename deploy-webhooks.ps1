# Deploy webhooks to VPS
Write-Host "🚀 Déploiement des webhooks sur le VPS..." -ForegroundColor Cyan

$VPS_HOST = "root@173.212.208.181"
$VPS_PASSWORD = "Atchoum#2020#"

Write-Host "📦 Compilation du backend..." -ForegroundColor Yellow
cd backend-mern
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur de compilation!" -ForegroundColor Red
    exit 1
}

Write-Host "📤 Migration du schema Prisma..." -ForegroundColor Yellow
# Envoyer le schema
pscp -pw $VPS_PASSWORD prisma/schema.prisma ${VPS_HOST}:/root/blog_strapi/backend-mern/prisma/

Write-Host "📤 Upload des fichiers..." -ForegroundColor Yellow
# Envoyer le dist
pscp -r -pw $VPS_PASSWORD dist/ ${VPS_HOST}:/root/blog_strapi/backend-mern/

Write-Host "🔄 Rebuild du container..." -ForegroundColor Yellow
plink -pw $VPS_PASSWORD $VPS_HOST "cd /root/blog_strapi && npx prisma migrate deploy --schema=./backend-mern/prisma/schema.prisma && docker compose build --no-cache backend && docker compose up -d --force-recreate backend"

Write-Host "✅ Déploiement terminé!" -ForegroundColor Green
Write-Host "🧪 Test du webhook: curl https://blog.bh-systems.be/api/webhooks/n8n/ping" -ForegroundColor Cyan
