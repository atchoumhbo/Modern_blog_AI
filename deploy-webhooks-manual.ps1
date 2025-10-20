# Deploy Phase 3 Webhooks - Manuel
# Étape par étape

Write-Host "🚀 DÉPLOIEMENT PHASE 3 - WEBHOOKS N8N" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📦 Étape 1: Compilation locale (DONE ✅)" -ForegroundColor Green
Write-Host "   Le code est déjà compilé dans backend-mern/dist/" -ForegroundColor Gray
Write-Host ""

Write-Host "📤 Étape 2: Upload sur VPS" -ForegroundColor Yellow
Write-Host "   Exécutez ces commandes dans 2 terminaux séparés:" -ForegroundColor Gray
Write-Host ""
Write-Host "   Terminal 1 - Upload dist:" -ForegroundColor White
Write-Host "   scp -r backend-mern/dist root@173.212.208.181:/root/blog_strapi/backend-mern/" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Terminal 2 - Upload migration:" -ForegroundColor White
Write-Host "   scp backend-mern/prisma/migrations/20250120_add_n8n_execution_id/migration.sql root@173.212.208.181:/root/blog_strapi/backend-mern/prisma/migrations/20250120_add_n8n_execution_id/" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔧 Étape 3: SSH dans le VPS" -ForegroundColor Yellow
Write-Host "   ssh root@173.212.208.181" -ForegroundColor Cyan
Write-Host "   Password: Atchoum#2020#" -ForegroundColor Gray
Write-Host ""

Write-Host "💾 Étape 4: Migration DB (dans SSH)" -ForegroundColor Yellow
Write-Host "   cd /root/blog_strapi/backend-mern" -ForegroundColor Cyan
Write-Host "   npx prisma migrate deploy" -ForegroundColor Cyan
Write-Host ""

Write-Host "🐳 Étape 5: Rebuild container (dans SSH)" -ForegroundColor Yellow
Write-Host "   cd /root/blog_strapi" -ForegroundColor Cyan
Write-Host "   docker compose build --no-cache backend" -ForegroundColor Cyan
Write-Host "   docker compose up -d --force-recreate backend" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Étape 6: Tester" -ForegroundColor Green
Write-Host "   curl https://blog.bh-systems.be/api/webhooks/n8n/ping" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔍 Étape 7: Vérifier les logs" -ForegroundColor Yellow
Write-Host "   docker logs -f blog-backend" -ForegroundColor Cyan
Write-Host ""
