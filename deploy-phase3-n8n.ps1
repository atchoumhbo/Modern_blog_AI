#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Déploie Phase 3 avec configuration N8N sur le VPS
.DESCRIPTION
    Script pour déployer le backend Phase 3 avec WorkflowExecutorService et N8N
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$N8N_API_KEY,
    
    [Parameter(Mandatory=$false)]
    [string]$VPS_IP = "173.212.208.181",
    
    [Parameter(Mandatory=$false)]
    [string]$VPS_USER = "root"
)

Write-Host "🚀 Déploiement Phase 3 - N8N Integration" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que l'API Key est fournie
if ([string]::IsNullOrWhiteSpace($N8N_API_KEY)) {
    Write-Host "❌ Erreur: N8N_API_KEY requis" -ForegroundColor Red
    Write-Host "Usage: .\deploy-phase3-n8n.ps1 -N8N_API_KEY 'votre-api-key-n8n'" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Configuration:" -ForegroundColor Green
Write-Host "  VPS: $VPS_IP" -ForegroundColor White
Write-Host "  N8N URL: https://n8n.bh-systems.be" -ForegroundColor White
Write-Host "  N8N API Key: $($N8N_API_KEY.Substring(0, [Math]::Min(10, $N8N_API_KEY.Length)))..." -ForegroundColor White
Write-Host ""

# Créer le fichier de commandes pour le VPS
$remoteCommands = @"
#!/bin/bash
set -e

echo "🔄 Phase 3 Deployment Started..."

# Navigation
cd /root/blog_strapi

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin master

# Backup .env si existe
if [ -f backend-mern/.env ]; then
    echo "💾 Backing up .env..."
    cp backend-mern/.env backend-mern/.env.backup
fi

# Update .env with N8N config
echo "⚙️  Updating .env configuration..."
cd backend-mern

# Vérifier si .env existe, sinon créer depuis .env.example
if [ ! -f .env ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
fi

# Ajouter/Mettre à jour les variables N8N
if grep -q "N8N_BASE_URL=" .env; then
    sed -i 's|N8N_BASE_URL=.*|N8N_BASE_URL=https://n8n.bh-systems.be|' .env
else
    echo "" >> .env
    echo "# N8N Integration" >> .env
    echo "N8N_BASE_URL=https://n8n.bh-systems.be" >> .env
fi

if grep -q "N8N_API_KEY=" .env; then
    sed -i 's|N8N_API_KEY=.*|N8N_API_KEY=$N8N_API_KEY|' .env
else
    echo "N8N_API_KEY=$N8N_API_KEY" >> .env
fi

if grep -q "N8N_TIMEOUT_MS=" .env; then
    sed -i 's|N8N_TIMEOUT_MS=.*|N8N_TIMEOUT_MS=300000|' .env
else
    echo "N8N_TIMEOUT_MS=300000" >> .env
fi

# Vérifier ENCRYPTION_KEY
if ! grep -q "ENCRYPTION_KEY=" .env || grep -q "ENCRYPTION_KEY=CHANGE_ME" .env; then
    echo "🔐 Generating ENCRYPTION_KEY..."
    ENCRYPTION_KEY=\$(openssl rand -base64 24)
    if grep -q "ENCRYPTION_KEY=" .env; then
        sed -i "s|ENCRYPTION_KEY=.*|ENCRYPTION_KEY=\$ENCRYPTION_KEY|" .env
    else
        echo "ENCRYPTION_KEY=\$ENCRYPTION_KEY" >> .env
    fi
fi

echo "✅ Configuration updated"

# Prisma migration
echo "🗄️  Running Prisma migrations..."
npx prisma migrate deploy

echo "📦 Generating Prisma client..."
npx prisma generate

# Rebuild backend
cd ..
echo "🔨 Rebuilding backend container..."
docker compose -f docker-compose.prod.yml build --no-cache backend

# Restart services
echo "🔄 Restarting services..."
docker compose -f docker-compose.prod.yml up -d --force-recreate backend

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 10

# Test N8N connection
echo "🧪 Testing N8N connection..."
curl -f http://localhost:3001/api/workflows/n8n/status || echo "⚠️  Warning: N8N connection test failed"

echo ""
echo "✅ Phase 3 Deployment Complete!"
echo ""
echo "📊 Service Status:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "📋 Next steps:"
echo "  1. Test N8N connection: curl https://blog.bh-systems.be/api/workflows/n8n/status"
echo "  2. List available workflows: curl https://blog.bh-systems.be/api/workflows/available"
echo "  3. Configure N8N workflow with MERN API Key"
echo ""
"@

# Sauvegarder les commandes dans un fichier temporaire
$tempFile = [System.IO.Path]::GetTempFileName()
$remoteCommands | Out-File -FilePath $tempFile -Encoding UTF8 -NoNewline

Write-Host "📤 Uploading deployment script to VPS..." -ForegroundColor Yellow

# Upload le script
scp $tempFile "${VPS_USER}@${VPS_IP}:/tmp/deploy-phase3.sh"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload script" -ForegroundColor Red
    Remove-Item $tempFile
    exit 1
}

# Exécuter le script sur le VPS
Write-Host ""
Write-Host "🚀 Executing deployment on VPS..." -ForegroundColor Yellow
Write-Host ""

ssh "${VPS_USER}@${VPS_IP}" "chmod +x /tmp/deploy-phase3.sh && /tmp/deploy-phase3.sh"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    Remove-Item $tempFile
    exit 1
}

# Cleanup
Remove-Item $tempFile

Write-Host ""
Write-Host "✅ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Test URLs:" -ForegroundColor Cyan
Write-Host "  - N8N Status: https://blog.bh-systems.be/api/workflows/n8n/status" -ForegroundColor White
Write-Host "  - Available Workflows: https://blog.bh-systems.be/api/workflows/available" -ForegroundColor White
Write-Host "  - API Health: https://blog.bh-systems.be/api/health" -ForegroundColor White
Write-Host ""
Write-Host "📋 Next: Update your N8N workflow with the new MERN API Key" -ForegroundColor Yellow
Write-Host ""
