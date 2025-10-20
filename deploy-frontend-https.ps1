# Script pour deployer le frontend React Router v7 sur HTTPS
# Genere index.html et deploie vers VPS

$VPS_IP = "173.212.208.181"
$FRONTEND_PATH = "/var/www/blog-frontend"

Write-Host "`nDeploy Frontend HTTPS" -ForegroundColor Cyan
Write-Host "=====================`n" -ForegroundColor Cyan

# Step 1: Build frontend
Write-Host "[1/4] Build frontend..." -NoNewline
Set-Location frontend
npm run build 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " ERREUR" -ForegroundColor Red
    exit 1
}

# Step 2: Get asset names from build
Write-Host "[2/4] Generation index.html..." -NoNewline
$cssFile = (Get-ChildItem "build/client/assets/app-*.css" | Select-Object -First 1).Name
$jsFile = (Get-ChildItem "build/client/assets/entry.client-*.js" | Select-Object -First 1).Name

# Create index.html
$indexHtml = @"
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blog - BH Systems</title>
    <link rel="icon" href="/favicon.ico" />
    <link rel="stylesheet" href="/assets/$cssFile">
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/assets/$jsFile"></script>
</body>
</html>
"@

$indexHtml | Out-File -FilePath "build/client/index.html" -Encoding UTF8
Write-Host " OK" -ForegroundColor Green

# Step 3: Transfer files to VPS
Write-Host "[3/4] Transfert vers VPS..." -NoNewline
scp -r -q build/client/* root@${VPS_IP}:${FRONTEND_PATH}/
if ($LASTEXITCODE -eq 0) {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " ERREUR" -ForegroundColor Red
    exit 1
}

# Step 4: Test
Write-Host "[4/4] Test HTTPS..." -NoNewline
Set-Location ..
Start-Sleep -Seconds 2
try {
    $response = Invoke-WebRequest -Uri "https://blog.bh-systems.be" -Method Head -ErrorAction Stop
    Write-Host " OK (Status $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host " ERREUR" -ForegroundColor Red
    Write-Host "  $_" -ForegroundColor Red
}

Write-Host "`nDeploiement termine !" -ForegroundColor Green
Write-Host "Site: https://blog.bh-systems.be`n" -ForegroundColor Cyan
