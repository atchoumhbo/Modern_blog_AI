# Deployment Configuration Verification Script (PowerShell)
# Run this script to verify Dockerfile and docker-compose.prod.yml are correctly configured

Write-Host "🔍 Backend MERN - Configuration Verification" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Counters
$script:Passed = 0
$script:Failed = 0
$script:Warnings = 0

# Function to check file exists
function Test-FileExists {
    param([string]$FilePath)
    
    if (Test-Path $FilePath) {
        Write-Host "✓ File exists: $FilePath" -ForegroundColor Green
        $script:Passed++
        return $true
    }
    else {
        Write-Host "✗ File missing: $FilePath" -ForegroundColor Red
        $script:Failed++
        return $false
    }
}

# Function to check content in file
function Test-ContentExists {
    param(
        [string]$FilePath,
        [string]$Pattern,
        [string]$Description
    )
    
    if ((Get-Content $FilePath -Raw) -match $Pattern) {
        Write-Host "✓ $Description" -ForegroundColor Green
        $script:Passed++
        return $true
    }
    else {
        Write-Host "✗ $Description" -ForegroundColor Red
        $script:Failed++
        return $false
    }
}

# Function to check warning content
function Test-WarningContent {
    param(
        [string]$FilePath,
        [string]$Pattern,
        [string]$Description
    )
    
    if ((Get-Content $FilePath -Raw) -match $Pattern) {
        Write-Host "⚠ $Description" -ForegroundColor Yellow
        $script:Warnings++
        return $true
    }
    else {
        Write-Host "✓ $Description (not found, good)" -ForegroundColor Green
        $script:Passed++
        return $false
    }
}

Write-Host "📁 Checking Required Files..." -ForegroundColor Cyan
Write-Host "------------------------------" -ForegroundColor Cyan
Test-FileExists "Dockerfile" | Out-Null
Test-FileExists "docker-compose.prod.yml" | Out-Null
Test-FileExists "prisma/schema.prisma" | Out-Null
Test-FileExists ".dockerignore" | Out-Null
Test-FileExists "tsconfig.json" | Out-Null
Test-FileExists "package.json" | Out-Null
Write-Host ""

if (!(Test-Path "Dockerfile") -or !(Test-Path "docker-compose.prod.yml")) {
    Write-Host "✗ Critical files missing. Cannot continue verification." -ForegroundColor Red
    exit 1
}

Write-Host "🐳 Checking Dockerfile Configuration..." -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan
Test-ContentExists "Dockerfile" "FROM node:20-alpine AS builder" "Multi-stage build using Node 20 Alpine" | Out-Null
Test-ContentExists "Dockerfile" "COPY prisma ./prisma/" "Prisma schema and migrations copied" | Out-Null
Test-ContentExists "Dockerfile" "npx prisma generate" "Prisma Client generation included" | Out-Null
Test-ContentExists "Dockerfile" "npm run build" "TypeScript compilation included" | Out-Null
Test-ContentExists "Dockerfile" "COPY --from=builder" "Production stage copies from builder" | Out-Null
Test-ContentExists "Dockerfile" "USER node" "Non-root user configured" | Out-Null
Test-ContentExists "Dockerfile" "HEALTHCHECK" "Health check configured" | Out-Null
Test-ContentExists "Dockerfile" "dumb-init" "dumb-init configured for proper signal handling" | Out-Null
Test-ContentExists "Dockerfile" "openssl" "OpenSSL installed for Prisma" | Out-Null
Write-Host ""

Write-Host "🐳 Checking docker-compose.prod.yml Configuration..." -ForegroundColor Cyan
Write-Host "----------------------------------------------------" -ForegroundColor Cyan
Test-ContentExists "docker-compose.prod.yml" "NODE_ENV: production" "Production environment set" | Out-Null
Test-ContentExists "docker-compose.prod.yml" "DATABASE_URL:" "DATABASE_URL configured" | Out-Null
Test-ContentExists "docker-compose.prod.yml" "host.docker.internal" "Docker host networking configured" | Out-Null
Test-ContentExists "docker-compose.prod.yml" "JWT_SECRET:" "JWT secrets configured" | Out-Null
Test-ContentExists "docker-compose.prod.yml" "API_KEY_SALT:" "API key salt configured" | Out-Null
Test-ContentExists "docker-compose.prod.yml" "CORS_ORIGINS:" "CORS origins configured" | Out-Null
Test-ContentExists "docker-compose.prod.yml" "restart: unless-stopped" "Restart policy configured" | Out-Null
Test-ContentExists "docker-compose.prod.yml" "healthcheck:" "Health check configured" | Out-Null
Test-ContentExists "docker-compose.prod.yml" "`"3000:3000`"" "Port 3000 exposed" | Out-Null
Test-ContentExists "docker-compose.prod.yml" "extra_hosts:" "Extra hosts for PostgreSQL access" | Out-Null
Test-ContentExists "docker-compose.prod.yml" "volumes:" "Persistent volumes configured" | Out-Null
Write-Host ""

Write-Host "🗄️ Checking Prisma Configuration..." -ForegroundColor Cyan
Write-Host "------------------------------------" -ForegroundColor Cyan
if (Test-Path "prisma/schema.prisma") {
    Test-ContentExists "prisma/schema.prisma" 'provider = "postgresql"' "PostgreSQL provider configured" | Out-Null
    Test-ContentExists "prisma/schema.prisma" "model User" "User model defined" | Out-Null
    Test-ContentExists "prisma/schema.prisma" "model Article" "Article model defined" | Out-Null
    Test-ContentExists "prisma/schema.prisma" "model Project" "Project model defined" | Out-Null
    Test-ContentExists "prisma/schema.prisma" "model Category" "Category model defined" | Out-Null
    Test-ContentExists "prisma/schema.prisma" "model Tag" "Tag model defined" | Out-Null
    Test-ContentExists "prisma/schema.prisma" "model ApiKey" "ApiKey model defined" | Out-Null
    Test-ContentExists "prisma/schema.prisma" "model AuditLog" "AuditLog model defined" | Out-Null
    Test-ContentExists "prisma/schema.prisma" "model RefreshToken" "RefreshToken model defined" | Out-Null
}
Write-Host ""

Write-Host "📦 Checking Migrations..." -ForegroundColor Cyan
Write-Host "-------------------------" -ForegroundColor Cyan
if (Test-Path "prisma/migrations") {
    $migrationFiles = Get-ChildItem -Path "prisma/migrations" -Filter "migration.sql" -Recurse
    if ($migrationFiles.Count -gt 0) {
        Write-Host "✓ Found $($migrationFiles.Count) migration(s)" -ForegroundColor Green
        $script:Passed++
    }
    else {
        Write-Host "✗ No migration.sql files found" -ForegroundColor Red
        Write-Host "  Run: npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/YYYYMMDD_init/migration.sql" -ForegroundColor Gray
        $script:Failed++
    }
    
    if (Test-Path "prisma/migrations/migration_lock.toml") {
        Write-Host "✓ migration_lock.toml exists" -ForegroundColor Green
        $script:Passed++
    }
    else {
        Write-Host "✗ migration_lock.toml missing" -ForegroundColor Red
        $script:Failed++
    }
}
else {
    Write-Host "✗ prisma/migrations directory not found" -ForegroundColor Red
    Write-Host "  Create migrations before deployment" -ForegroundColor Gray
    $script:Failed++
}
Write-Host ""

Write-Host "🔐 Checking Security Configuration..." -ForegroundColor Cyan
Write-Host "--------------------------------------" -ForegroundColor Cyan
if (Test-Path ".env.production") {
    Write-Host "✓ .env.production exists" -ForegroundColor Green
    $script:Passed++
    
    # Check for required variables
    $envContent = Get-Content ".env.production" -Raw
    $requiredVars = @("DATABASE_URL", "JWT_SECRET", "JWT_REFRESH_SECRET", "API_KEY_SALT", "CORS_ORIGINS")
    
    foreach ($var in $requiredVars) {
        if ($envContent -match "^$var=") {
            Write-Host "✓ $var is set" -ForegroundColor Green
            $script:Passed++
        }
        else {
            Write-Host "✗ $var is missing" -ForegroundColor Red
            $script:Failed++
        }
    }
}
else {
    Write-Host "⚠ .env.production not found (create it on VPS)" -ForegroundColor Yellow
    $script:Warnings++
}

# Check for potential security issues
if (Test-Path ".env.production") {
    Test-WarningContent ".env.production" "password.*123" "Warning: Weak password detected" | Out-Null
    Test-WarningContent ".env.production" "secret.*test" "Warning: Test secret detected" | Out-Null
}
Write-Host ""

Write-Host "📝 Checking Seed Scripts..." -ForegroundColor Cyan
Write-Host "---------------------------" -ForegroundColor Cyan
Test-FileExists "src/seed-production.ts" | Out-Null
if (Test-Path "package.json") {
    Test-ContentExists "package.json" "`"seed:prod`"" "Production seed script defined" | Out-Null
}
Write-Host ""

Write-Host "🔧 Checking Build Configuration..." -ForegroundColor Cyan
Write-Host "-----------------------------------" -ForegroundColor Cyan
if (Test-Path "package.json") {
    Test-ContentExists "package.json" "`"build`".*`"tsc`"" "TypeScript build script defined" | Out-Null
    Test-ContentExists "package.json" "`"@prisma/client`"" "Prisma client dependency" | Out-Null
    Test-ContentExists "package.json" "`"express`"" "Express framework dependency" | Out-Null
    Test-ContentExists "package.json" "`"typescript`"" "TypeScript dependency" | Out-Null
}

if (Test-Path "tsconfig.json") {
    Write-Host "✓ TypeScript configuration exists" -ForegroundColor Green
    $script:Passed++
}
Write-Host ""

Write-Host "📊 Verification Summary" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
Write-Host "Passed:   " -NoNewline; Write-Host $script:Passed -ForegroundColor Green -NoNewline; Write-Host " checks"
Write-Host "Failed:   " -NoNewline; Write-Host $script:Failed -ForegroundColor Red -NoNewline; Write-Host " checks"
Write-Host "Warnings: " -NoNewline; Write-Host $script:Warnings -ForegroundColor Yellow -NoNewline; Write-Host " checks"
Write-Host ""

if ($script:Failed -eq 0) {
    Write-Host "✅ Configuration is READY for deployment!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Create .env.production on VPS with production values"
    Write-Host "2. Follow DEPLOYMENT_PROCEDURE.md for complete deployment"
    Write-Host "3. Test on a fresh VPS to verify everything works"
    exit 0
}
else {
    Write-Host "❌ Configuration has ISSUES that need to be fixed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please resolve the failed checks above before deployment."
    exit 1
}
