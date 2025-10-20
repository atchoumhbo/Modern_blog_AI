# Script de Test Final VPS - Blog Strapi
# Test complet de tous les endpoints et services

Write-Host "Test Final du Deploiement VPS Blog Strapi" -ForegroundColor Cyan
Write-Host ("=" * 60)

# Configuration
$VPS_IP = "173.212.208.181"
$DOMAIN = "https://blog.bh-systems.be"

Write-Host "`n1. Test API Articles..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$DOMAIN/api/articles" -Method GET -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "   OK - Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ERREUR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n2. Test API Projects..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$DOMAIN/api/projects" -Method GET -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "   OK - Status: $($response.StatusCode)" -ForegroundColor Green
    }
} catch {
    Write-Host "   ERREUR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n3. Test Admin Panel..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$DOMAIN/admin" -Method GET -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "   OK - Status: $($response.StatusCode)" -ForegroundColor Green
    }
} catch {
    Write-Host "   ERREUR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n4. Verification Strapi sur VPS..." -ForegroundColor Yellow
ssh root@$VPS_IP "ps aux | grep 'strapi start' | grep -v grep | head -1"

Write-Host "`n5. Derniers logs Strapi..." -ForegroundColor Yellow
ssh root@$VPS_IP "tail -5 /root/strapi.log"

Write-Host "`n" + ("=" * 60)
Write-Host "Tests termines!" -ForegroundColor Green
Write-Host "Site: $DOMAIN" -ForegroundColor Cyan
Write-Host "Admin: $DOMAIN/admin" -ForegroundColor Cyan

