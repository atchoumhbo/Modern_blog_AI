# Deploy Phase 3 sur VPS - Commandes à exécuter
Write-Host "🚀 PHASE 3 DEPLOYMENT - WEBHOOKS N8N" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Exécute ces commandes sur le VPS (dans l'ordre):" -ForegroundColor Yellow
Write-Host ""

Write-Host "# 1. Git pull" -ForegroundColor Green
Write-Host "cd /root/blog_strapi" -ForegroundColor White
Write-Host "git pull origin master" -ForegroundColor White
Write-Host ""

Write-Host "# 2. Migration SQL directement dans PostgreSQL" -ForegroundColor Green
Write-Host 'docker exec -i blog-postgres psql -U postgres -d blog_mern -c "ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS \"n8nExecutionId\" TEXT;"' -ForegroundColor White
Write-Host 'docker exec -i blog-postgres psql -U postgres -d blog_mern -c "CREATE UNIQUE INDEX IF NOT EXISTS workflow_executions_n8nExecutionId_key ON workflow_executions(\"n8nExecutionId\");"' -ForegroundColor White
Write-Host ""

Write-Host "# 3. Générer le client Prisma" -ForegroundColor Green
Write-Host "cd /root/blog_strapi/backend-mern" -ForegroundColor White
Write-Host "npx prisma generate" -ForegroundColor White
Write-Host ""

Write-Host "# 4. Rebuild le backend" -ForegroundColor Green
Write-Host "cd /root/blog_strapi" -ForegroundColor White
Write-Host "docker compose -f docker-compose.mern-full.yml build --no-cache backend" -ForegroundColor White
Write-Host "docker compose -f docker-compose.mern-full.yml up -d --force-recreate backend" -ForegroundColor White
Write-Host ""

Write-Host "# 5. Vérifier les logs" -ForegroundColor Green
Write-Host "docker logs -f blog-backend" -ForegroundColor White
Write-Host ""

Write-Host "# 6. Tester le webhook" -ForegroundColor Green
Write-Host "curl https://blog.bh-systems.be/api/webhooks/n8n/ping" -ForegroundColor White
Write-Host ""

Write-Host "✅ Si tout fonctionne, tu verras:" -ForegroundColor Cyan
Write-Host '{"success":true,"message":"Webhook endpoint is alive","timestamp":"..."}' -ForegroundColor Gray
