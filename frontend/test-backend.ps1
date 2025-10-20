# Test de connexion Frontend <-> Backend MERN
# Usage: .\test-backend.ps1

Write-Host ""
Write-Host "[Test] Test de connexion Frontend Backend MERN" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# URLs des backends
$localBackend = "http://localhost:3000"
$vpsBackend = "http://173.212.208.181:3000"

# Credentials admin
$adminEmail = "boujraf.hicham@gmail.com"
$adminPassword = "Admin123!"

# Fonction pour tester un endpoint
function Test-Endpoint {
    param (
        [string]$Url,
        [string]$Name
    )
    try {
        Write-Host "Testing $Name..." -NoNewline
        $response = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 5
        Write-Host " [OK]" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host " [FAILED]" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Fonction pour tester le login
function Test-Login {
    param (
        [string]$BaseUrl,
        [string]$Name
    )
    try {
        Write-Host "Testing $Name login..." -NoNewline
        $body = @{
            email = $adminEmail
            password = $adminPassword
        } | ConvertTo-Json
        
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -Body $body -Headers $headers -TimeoutSec 5
        Write-Host " [OK]" -ForegroundColor Green
        
        if ($response.accessToken) {
            Write-Host "  Token: $($response.accessToken.Substring(0, 20))..." -ForegroundColor Gray
        }
        elseif ($response.jwt) {
            Write-Host "  Token: $($response.jwt.Substring(0, 20))..." -ForegroundColor Gray
        }
        
        return $response
    }
    catch {
        Write-Host " [FAILED]" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Fonction pour tester un endpoint authentifié
function Test-AuthEndpoint {
    param (
        [string]$BaseUrl,
        [string]$Token,
        [string]$Endpoint,
        [string]$Name
    )
    try {
        Write-Host "  - $Name..." -NoNewline
        
        $headers = @{
            "Authorization" = "Bearer $Token"
        }
        
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/$Endpoint" -Method Get -Headers $headers -TimeoutSec 5
        
        $count = 0
        if ($response.data) {
            $count = $response.data.Count
        }
        elseif ($response -is [Array]) {
            $count = $response.Count
        }
        
        Write-Host " - OK ($count items)" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host " - FAILED" -ForegroundColor Red
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Tests backend local
Write-Host ""
Write-Host "1. Backend Local (localhost:3000)" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow

$localHealthOK = Test-Endpoint -Url "$localBackend/health" -Name "Local Health Check"
$localLoginResult = Test-Login -BaseUrl $localBackend -Name "Local"

if ($localLoginResult) {
    Write-Host ""
    Write-Host "Testing Local authenticated endpoints:" -ForegroundColor Cyan
    
    $token = ""
    if ($localLoginResult.accessToken) {
        $token = $localLoginResult.accessToken
    }
    elseif ($localLoginResult.jwt) {
        $token = $localLoginResult.jwt
    }
    
    Test-AuthEndpoint -BaseUrl $localBackend -Token $token -Endpoint "articles" -Name "Articles"
    Test-AuthEndpoint -BaseUrl $localBackend -Token $token -Endpoint "categories" -Name "Categories"
    Test-AuthEndpoint -BaseUrl $localBackend -Token $token -Endpoint "tags" -Name "Tags"
    Test-AuthEndpoint -BaseUrl $localBackend -Token $token -Endpoint "projects" -Name "Projects"
}

# Tests backend VPS
Write-Host ""
Write-Host "2. Backend VPS (173.212.208.181:3000)" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow

$vpsHealthOK = Test-Endpoint -Url "$vpsBackend/health" -Name "VPS Health Check"
$vpsLoginResult = Test-Login -BaseUrl $vpsBackend -Name "VPS"

if ($vpsLoginResult) {
    Write-Host ""
    Write-Host "Testing VPS authenticated endpoints:" -ForegroundColor Cyan
    
    $token = ""
    if ($vpsLoginResult.accessToken) {
        $token = $vpsLoginResult.accessToken
    }
    elseif ($vpsLoginResult.jwt) {
        $token = $vpsLoginResult.jwt
    }
    
    Test-AuthEndpoint -BaseUrl $vpsBackend -Token $token -Endpoint "articles" -Name "Articles"
    Test-AuthEndpoint -BaseUrl $vpsBackend -Token $token -Endpoint "categories" -Name "Categories"
    Test-AuthEndpoint -BaseUrl $vpsBackend -Token $token -Endpoint "tags" -Name "Tags"
    Test-AuthEndpoint -BaseUrl $vpsBackend -Token $token -Endpoint "projects" -Name "Projects"
}

# Vérification de la configuration frontend
Write-Host ""
Write-Host "3. Configuration Frontend" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow

if (Test-Path ".env.local") {
    Write-Host "[OK] .env.local found" -ForegroundColor Green
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "VITE_API_URL=(.+)") {
        $apiUrl = $matches[1].Trim()
        Write-Host "  API URL: $apiUrl" -ForegroundColor Gray
    }
    if ($envContent -match "VITE_BACKEND_TYPE=(.+)") {
        $backendType = $matches[1].Trim()
        Write-Host "  Backend Type: $backendType" -ForegroundColor Gray
    }
}
else {
    Write-Host "[FAILED] .env.local not found" -ForegroundColor Red
    Write-Host "  Create it from .env.vps or configure manually" -ForegroundColor Yellow
}

# Résumé
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "RESUME" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

if ($localHealthOK -and $localLoginResult) {
    Write-Host "Backend Local:  [OK]" -ForegroundColor Green
}
else {
    Write-Host "Backend Local:  [FAILED]" -ForegroundColor Red
}

if ($vpsHealthOK -and $vpsLoginResult) {
    Write-Host "Backend VPS:    [OK]" -ForegroundColor Green
}
else {
    Write-Host "Backend VPS:    [FAILED]" -ForegroundColor Red
}

Write-Host ""
Write-Host "[INFO] PROCHAINES ETAPES:" -ForegroundColor Cyan
Write-Host "-------------------" -ForegroundColor Cyan

if (-not $localHealthOK) {
    Write-Host "[WARNING] Backend local non disponible:" -ForegroundColor Yellow
    Write-Host "   1. Demarrer le backend local: cd backend-mern; npm run dev" -ForegroundColor Gray
    Write-Host "   2. Verifier PostgreSQL local" -ForegroundColor Gray
}

if (-not $vpsHealthOK) {
    Write-Host "[WARNING] Backend VPS non disponible:" -ForegroundColor Yellow
    Write-Host "   1. Verifier le conteneur Docker sur le VPS" -ForegroundColor Gray
    Write-Host "   2. Consulter les logs: ssh root@173.212.208.181" -ForegroundColor Gray
    Write-Host "      docker logs backend-mern" -ForegroundColor Gray
}

if ($localHealthOK -and $localLoginResult) {
    Write-Host "[OK] Backend local operationnel - Configurer .env.local:" -ForegroundColor Green
    Write-Host "   VITE_API_URL=http://localhost:3000/api" -ForegroundColor Gray
    Write-Host "   VITE_BACKEND_TYPE=mern" -ForegroundColor Gray
}

if ($vpsHealthOK -and $vpsLoginResult) {
    Write-Host "[OK] Backend VPS operationnel - Pour utiliser le VPS:" -ForegroundColor Green
    Write-Host "   1. Copier .env.vps vers .env.local" -ForegroundColor Gray
    Write-Host "   2. Ou configurer manuellement:" -ForegroundColor Gray
    Write-Host "      VITE_API_URL=http://173.212.208.181:3000/api" -ForegroundColor Gray
    Write-Host "      VITE_BACKEND_TYPE=mern" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[INFO] Demarrer le frontend:" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
