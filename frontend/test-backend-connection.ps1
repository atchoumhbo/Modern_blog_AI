# Script de test Frontend <-> Backend MERN
# Usage: .\test-backend-connection.ps1

Write-Host "`n🔍 Test de connexion Frontend <-> Backend MERN" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$LocalBackend = "http://localhost:3000"
$VPSBackend = "http://173.212.208.181:3000"
$AdminEmail = "boujraf.hicham@gmail.com"
$AdminPassword = "Admin123!"

# Fonction pour tester un endpoint
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$URL
    )
    
    try {
        $response = Invoke-RestMethod -Uri $URL -Method Get -TimeoutSec 5
        Write-Host "✓ $Name" -ForegroundColor Green -NoNewline
        Write-Host " - OK" -ForegroundColor Gray
        return $true
    }
    catch {
        Write-Host "✗ $Name" -ForegroundColor Red -NoNewline
        Write-Host " - FAILED: $($_.Exception.Message)" -ForegroundColor Gray
        return $false
    }
}

# Fonction pour tester le login
function Test-Login {
    param(
        [string]$Name,
        [string]$BaseURL
    )
    
    $loginURL = "$BaseURL/api/auth/login"
    $body = @{
        email = $AdminEmail
        password = $AdminPassword
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri $loginURL -Method Post -Body $body -ContentType "application/json" -TimeoutSec 5
        
        if ($response.accessToken -or $response.jwt) {
            Write-Host "✓ $Name - Login" -ForegroundColor Green -NoNewline
            Write-Host " - Token reçu" -ForegroundColor Gray
            return $response
        }
        else {
            Write-Host "✗ $Name - Login" -ForegroundColor Red -NoNewline
            Write-Host " - Pas de token reçu" -ForegroundColor Gray
            return $null
        }
    }
    catch {
        Write-Host "✗ $Name - Login" -ForegroundColor Red -NoNewline
        Write-Host " - FAILED: $($_.Exception.Message)" -ForegroundColor Gray
        return $null
    }
}

# Fonction pour tester un endpoint avec auth
function Test-AuthEndpoint {
    param(
        [string]$Name,
        [string]$URL,
        [string]$Token
    )
    
    $headers = @{
        Authorization = "Bearer $Token"
    }
    
    try {
        $response = Invoke-RestMethod -Uri $URL -Method Get -Headers $headers -TimeoutSec 5
        Write-Host "✓ $Name" -ForegroundColor Green -NoNewline
        Write-Host " - OK ($(($response.data ?? $response).Count) items)" -ForegroundColor Gray
        return $true
    }
    catch {
        Write-Host "✗ $Name" -ForegroundColor Red -NoNewline
        Write-Host " - FAILED: $($_.Exception.Message)" -ForegroundColor Gray
        return $false
    }
}

# Test Backend Local
Write-Host "📡 Test Backend Local (localhost:3000)" -ForegroundColor Yellow
Write-Host "---------------------------------------" -ForegroundColor Yellow

$localHealthOK = Test-Endpoint "Health Check" "$LocalBackend/health"
$localLoginResult = Test-Login "Auth" $LocalBackend

if ($localLoginResult) {
    $token = $localLoginResult.accessToken ?? $localLoginResult.jwt
    Test-AuthEndpoint "Articles" "$LocalBackend/api/articles" $token | Out-Null
    Test-AuthEndpoint "Categories" "$LocalBackend/api/categories" $token | Out-Null
    Test-AuthEndpoint "Tags" "$LocalBackend/api/tags" $token | Out-Null
    Test-AuthEndpoint "Projects" "$LocalBackend/api/projects" $token | Out-Null
}

Write-Host ""

# Test Backend VPS
Write-Host "📡 Test Backend VPS (173.212.208.181:3000)" -ForegroundColor Yellow
Write-Host "------------------------------------------" -ForegroundColor Yellow

$vpsHealthOK = Test-Endpoint "Health Check" "$VPSBackend/health"
$vpsLoginResult = Test-Login "Auth" $VPSBackend

if ($vpsLoginResult) {
    $token = $vpsLoginResult.accessToken ?? $vpsLoginResult.jwt
    Test-AuthEndpoint "Articles" "$VPSBackend/api/articles" $token | Out-Null
    Test-AuthEndpoint "Categories" "$VPSBackend/api/categories" $token | Out-Null
    Test-AuthEndpoint "Tags" "$VPSBackend/api/tags" $token | Out-Null
    Test-AuthEndpoint "Projects" "$VPSBackend/api/projects" $token | Out-Null
}

Write-Host ""

# Vérifier la configuration du frontend
Write-Host "📝 Configuration Frontend" -ForegroundColor Yellow
Write-Host "-------------------------" -ForegroundColor Yellow

if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    
    if ($envContent -match "VITE_BACKEND_TYPE=(\w+)") {
        $backendType = $matches[1]
        Write-Host "  Backend Type: " -NoNewline
        Write-Host $backendType -ForegroundColor Cyan
    }
    
    if ($envContent -match "VITE_API_URL=([^\r\n]+)") {
        $apiUrl = $matches[1]
        Write-Host "  API URL: " -NoNewline
        Write-Host $apiUrl -ForegroundColor Cyan
    }
    
    Write-Host ""
    
    # Recommandations
    if ($envContent -match "localhost") {
        Write-Host "💡 Frontend configuré pour backend LOCAL" -ForegroundColor Green
        if (!$localHealthOK) {
            Write-Host "⚠️  ATTENTION: Backend local ne répond pas!" -ForegroundColor Yellow
            Write-Host "   Démarrer le backend avec: npm run dev" -ForegroundColor Gray
        }
    }
    elseif ($envContent -match "173.212.208.181") {
        Write-Host "💡 Frontend configuré pour backend VPS" -ForegroundColor Green
        if (!$vpsHealthOK) {
            Write-Host "⚠️  ATTENTION: Backend VPS ne répond pas!" -ForegroundColor Yellow
            Write-Host "   Vérifier que le VPS est accessible" -ForegroundColor Gray
        }
    }
}
else {
    Write-Host "✗ .env.local not found" -ForegroundColor Red
    Write-Host "  Créer .env.local depuis .env.local ou .env.vps" -ForegroundColor Gray
}

Write-Host ""

# Summary
Write-Host "📊 Résumé" -ForegroundColor Cyan
Write-Host "---------" -ForegroundColor Cyan

$localStatus = if ($localHealthOK -and $localLoginResult) { "✓ OK" } else { "✗ FAILED" }
$vpsStatus = if ($vpsHealthOK -and $vpsLoginResult) { "✓ OK" } else { "✗ FAILED" }

Write-Host "  Backend Local: " -NoNewline
if ($localHealthOK -and $localLoginResult) {
    Write-Host $localStatus -ForegroundColor Green
}
else {
    Write-Host $localStatus -ForegroundColor Red
}

Write-Host "  Backend VPS:   " -NoNewline
if ($vpsHealthOK -and $vpsLoginResult) {
    Write-Host $vpsStatus -ForegroundColor Green
}
else {
    Write-Host $vpsStatus -ForegroundColor Red
}

Write-Host ""

# Actions suggérées
Write-Host "🔧 Actions Suggérées" -ForegroundColor Cyan
Write-Host "--------------------" -ForegroundColor Cyan

if (!$localHealthOK -and !$vpsHealthOK) {
    Write-Host "❌ Aucun backend ne répond!" -ForegroundColor Red
    Write-Host "   1. Démarrer le backend local: cd backend-mern && npm run dev" -ForegroundColor Gray
    Write-Host "   2. Ou vérifier le VPS: ssh root@173.212.208.181" -ForegroundColor Gray
}
elseif ($localHealthOK -and !$vpsHealthOK) {
    Write-Host "💡 Backend local fonctionne, VPS ne répond pas" -ForegroundColor Yellow
    Write-Host "   Pour utiliser le backend local:" -ForegroundColor Gray
    Write-Host "   - Vérifier .env.local: VITE_API_URL=http://localhost:3000/api" -ForegroundColor Gray
    Write-Host "   - Redémarrer le frontend: npm run dev" -ForegroundColor Gray
}
elseif (!$localHealthOK -and $vpsHealthOK) {
    Write-Host "💡 Backend VPS fonctionne, local ne répond pas" -ForegroundColor Yellow
    Write-Host "   Pour utiliser le backend VPS:" -ForegroundColor Gray
    Write-Host "   - Copy-Item .env.vps .env.local -Force" -ForegroundColor Gray
    Write-Host "   - Redémarrer le frontend: npm run dev" -ForegroundColor Gray
}
else {
    Write-Host "✅ Les deux backends fonctionnent!" -ForegroundColor Green
    Write-Host "   Choisir le backend dans .env.local" -ForegroundColor Gray
    Write-Host "   - Local: Copy-Item .env.local.backup .env.local -Force" -ForegroundColor Gray
    Write-Host "   - VPS:   Copy-Item .env.vps .env.local -Force" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📚 Documentation: BACKEND_CONNECTION_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
