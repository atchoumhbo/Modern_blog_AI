# Script PowerShell pour executer les scripts de generation dans Docker

param(
    [Parameter(Position=0)]
    [ValidateSet("demo", "user", "verify", "image", "workflow", "complete", "complete-sd3", "article-image", "list")]
    [string]$Action = "list"
)

Write-Host "🎯 Execution de scripts dans Docker Strapi" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

# Verifier que le container tourne
$containerStatus = docker-compose -f docker-compose.dev.yml ps --services --filter "status=running" | Where-Object { $_ -eq "strapi" }

if (-not $containerStatus) {
    Write-Host "❌ Le container Strapi n'est pas en cours d'execution!" -ForegroundColor Red
    Write-Host "Lancez d'abord: docker-compose -f docker-compose.dev.yml up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Container Strapi detecte" -ForegroundColor Green
Write-Host ""

switch ($Action) {
    "demo" {
        Write-Host "🚀 Execution du generateur de demonstration N8N..." -ForegroundColor Cyan
        docker-compose -f docker-compose.dev.yml exec strapi node demo-n8n-generator.js
    }
    
    "user" {
        Write-Host "👤 Creation d'un utilisateur par defaut..." -ForegroundColor Cyan
        docker-compose -f docker-compose.dev.yml exec strapi node n8n/create-default-user.js
    }
    
    "verify" {
        Write-Host "🔍 Verification des articles crees..." -ForegroundColor Cyan
        docker-compose -f docker-compose.dev.yml exec strapi node n8n/verify-created-articles.js
    }
    
    "image" {
        Write-Host "🖼️  Test de generation d'images..." -ForegroundColor Cyan
        docker-compose -f docker-compose.dev.yml exec strapi node n8n/test-image-generation.js
    }
    
    "workflow" {
        Write-Host "🔄 Execution du workflow de reproduction N8N..." -ForegroundColor Cyan
        docker-compose -f docker-compose.dev.yml exec strapi node n8n/n8n-workflow-reproduction.js
    }
    
    "complete" {
        Write-Host "🚀 Test workflow complet avec images..." -ForegroundColor Cyan
        docker-compose -f docker-compose.dev.yml exec strapi node n8n/test-complete-workflow.js
    }
    
    "complete-sd3" {
        Write-Host "🎨 Test workflow complet avec images SD3..." -ForegroundColor Cyan
        docker-compose -f docker-compose.dev.yml exec strapi node n8n/test-complete-workflow-sd3.js
    }
    
    "article-image" {
        Write-Host "📖 Test article complet avec image FR/EN..." -ForegroundColor Cyan
        docker-compose -f docker-compose.dev.yml exec strapi node n8n/test-article-complet-avec-image.js
    }
    
    "list" {
        Write-Host "📋 Scripts disponibles:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  🎯 Scripts de test principaux:" -ForegroundColor Yellow
        Write-Host "  complete-sd3    - Test workflow complet avec images SD3 (recommande)" -ForegroundColor White
        Write-Host "  workflow        - Workflow de reproduction N8N" -ForegroundColor White
        Write-Host "  article-image   - Test article complet avec image FR/EN" -ForegroundColor White
        Write-Host ""
        Write-Host "  🔧 Scripts utilitaires:" -ForegroundColor Yellow
        Write-Host "  demo            - Generateur de demonstration N8N" -ForegroundColor White
        Write-Host "  user            - Creation d'utilisateur par defaut" -ForegroundColor White  
        Write-Host "  verify          - Verification des articles crees" -ForegroundColor White
        Write-Host "  image           - Test de generation d'images simple" -ForegroundColor White
        Write-Host "  complete        - Test workflow complet classique" -ForegroundColor White
        Write-Host ""
        Write-Host "Usage:" -ForegroundColor Yellow
        Write-Host "  .\run-script.ps1 complete-sd3" -ForegroundColor Green
        Write-Host "  .\run-script.ps1 workflow" -ForegroundColor White
        Write-Host "  .\run-script.ps1 article-image" -ForegroundColor White
        Write-Host "  .\run-script.ps1 demo" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "✅ Termine!" -ForegroundColor Green