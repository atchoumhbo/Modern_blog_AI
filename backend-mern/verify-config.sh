#!/bin/bash
# Deployment Configuration Verification Script
# Run this script to verify Dockerfile and docker-compose.prod.yml are correctly configured

echo "🔍 Backend MERN - Configuration Verification"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} File exists: $1"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} File missing: $1"
        ((FAILED++))
        return 1
    fi
}

# Function to check content in file
check_content() {
    local file=$1
    local pattern=$2
    local description=$3
    
    if grep -q "$pattern" "$file"; then
        echo -e "${GREEN}✓${NC} $description"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $description"
        ((FAILED++))
        return 1
    fi
}

# Function to check warning content
check_warning() {
    local file=$1
    local pattern=$2
    local description=$3
    
    if grep -q "$pattern" "$file"; then
        echo -e "${YELLOW}⚠${NC} $description"
        ((WARNINGS++))
        return 0
    else
        echo -e "${GREEN}✓${NC} $description (not found, good)"
        ((PASSED++))
        return 1
    fi
}

echo "📁 Checking Required Files..."
echo "------------------------------"
check_file "Dockerfile"
check_file "docker-compose.prod.yml"
check_file "prisma/schema.prisma"
check_file ".dockerignore"
check_file "tsconfig.json"
check_file "package.json"
echo ""

if [ ! -f "Dockerfile" ] || [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}✗ Critical files missing. Cannot continue verification.${NC}"
    exit 1
fi

echo "🐳 Checking Dockerfile Configuration..."
echo "----------------------------------------"
check_content "Dockerfile" "FROM node:20-alpine AS builder" "Multi-stage build using Node 20 Alpine"
check_content "Dockerfile" "COPY prisma ./prisma/" "Prisma schema and migrations copied"
check_content "Dockerfile" "npx prisma generate" "Prisma Client generation included"
check_content "Dockerfile" "npm run build" "TypeScript compilation included"
check_content "Dockerfile" "COPY --from=builder" "Production stage copies from builder"
check_content "Dockerfile" "USER node" "Non-root user configured"
check_content "Dockerfile" "HEALTHCHECK" "Health check configured"
check_content "Dockerfile" "dumb-init" "dumb-init configured for proper signal handling"
check_content "Dockerfile" "openssl" "OpenSSL installed for Prisma"
echo ""

echo "🐳 Checking docker-compose.prod.yml Configuration..."
echo "----------------------------------------------------"
check_content "docker-compose.prod.yml" "NODE_ENV: production" "Production environment set"
check_content "docker-compose.prod.yml" "DATABASE_URL:" "DATABASE_URL configured"
check_content "docker-compose.prod.yml" "host.docker.internal" "Docker host networking configured"
check_content "docker-compose.prod.yml" "JWT_SECRET:" "JWT secrets configured"
check_content "docker-compose.prod.yml" "API_KEY_SALT:" "API key salt configured"
check_content "docker-compose.prod.yml" "CORS_ORIGINS:" "CORS origins configured"
check_content "docker-compose.prod.yml" "restart: unless-stopped" "Restart policy configured"
check_content "docker-compose.prod.yml" "healthcheck:" "Health check configured"
check_content "docker-compose.prod.yml" '"3000:3000"' "Port 3000 exposed"
check_content "docker-compose.prod.yml" "extra_hosts:" "Extra hosts for PostgreSQL access"
check_content "docker-compose.prod.yml" "volumes:" "Persistent volumes configured"
echo ""

echo "🗄️ Checking Prisma Configuration..."
echo "------------------------------------"
check_file "prisma/schema.prisma"
if [ -f "prisma/schema.prisma" ]; then
    check_content "prisma/schema.prisma" 'provider = "postgresql"' "PostgreSQL provider configured"
    check_content "prisma/schema.prisma" "model User" "User model defined"
    check_content "prisma/schema.prisma" "model Article" "Article model defined"
    check_content "prisma/schema.prisma" "model Project" "Project model defined"
    check_content "prisma/schema.prisma" "model Category" "Category model defined"
    check_content "prisma/schema.prisma" "model Tag" "Tag model defined"
    check_content "prisma/schema.prisma" "model ApiKey" "ApiKey model defined"
    check_content "prisma/schema.prisma" "model AuditLog" "AuditLog model defined"
    check_content "prisma/schema.prisma" "model RefreshToken" "RefreshToken model defined"
fi
echo ""

echo "📦 Checking Migrations..."
echo "-------------------------"
if [ -d "prisma/migrations" ]; then
    MIGRATION_COUNT=$(find prisma/migrations -name "migration.sql" | wc -l)
    if [ $MIGRATION_COUNT -gt 0 ]; then
        echo -e "${GREEN}✓${NC} Found $MIGRATION_COUNT migration(s)"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} No migration.sql files found"
        echo "  Run: npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/YYYYMMDD_init/migration.sql"
        ((FAILED++))
    fi
    
    if [ -f "prisma/migrations/migration_lock.toml" ]; then
        echo -e "${GREEN}✓${NC} migration_lock.toml exists"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} migration_lock.toml missing"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗${NC} prisma/migrations directory not found"
    echo "  Create migrations before deployment"
    ((FAILED++))
fi
echo ""

echo "🔐 Checking Security Configuration..."
echo "--------------------------------------"
if [ -f ".env.production" ]; then
    echo -e "${GREEN}✓${NC} .env.production exists"
    ((PASSED++))
    
    # Check for required variables (without revealing values)
    for var in DATABASE_URL JWT_SECRET JWT_REFRESH_SECRET API_KEY_SALT CORS_ORIGINS; do
        if grep -q "^${var}=" .env.production; then
            echo -e "${GREEN}✓${NC} ${var} is set"
            ((PASSED++))
        else
            echo -e "${RED}✗${NC} ${var} is missing"
            ((FAILED++))
        fi
    done
else
    echo -e "${YELLOW}⚠${NC} .env.production not found (create it on VPS)"
    ((WARNINGS++))
fi

# Check for potential security issues
check_warning "docker-compose.prod.yml" "ports.*80:80" "Warning: Port 80 exposed (should use reverse proxy)"
check_warning ".env.production" "password.*123" "Warning: Weak password detected"
check_warning ".env.production" "secret.*test" "Warning: Test secret detected"
echo ""

echo "📝 Checking Seed Scripts..."
echo "---------------------------"
check_file "src/seed-production.ts"
if [ -f "package.json" ]; then
    check_content "package.json" '"seed:prod"' "Production seed script defined"
fi
echo ""

echo "🔧 Checking Build Configuration..."
echo "-----------------------------------"
if [ -f "package.json" ]; then
    check_content "package.json" '"build".*"tsc"' "TypeScript build script defined"
    check_content "package.json" '"@prisma/client"' "Prisma client dependency"
    check_content "package.json" '"express"' "Express framework dependency"
    check_content "package.json" '"typescript"' "TypeScript dependency"
fi

if [ -f "tsconfig.json" ]; then
    echo -e "${GREEN}✓${NC} TypeScript configuration exists"
    ((PASSED++))
fi
echo ""

echo "📊 Verification Summary"
echo "======================="
echo -e "Passed:   ${GREEN}${PASSED}${NC} checks"
echo -e "Failed:   ${RED}${FAILED}${NC} checks"
echo -e "Warnings: ${YELLOW}${WARNINGS}${NC} checks"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Configuration is READY for deployment!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Create .env.production on VPS with production values"
    echo "2. Follow DEPLOYMENT_PROCEDURE.md for complete deployment"
    echo "3. Test on a fresh VPS to verify everything works"
    exit 0
else
    echo -e "${RED}❌ Configuration has ISSUES that need to be fixed${NC}"
    echo ""
    echo "Please resolve the failed checks above before deployment."
    exit 1
fi
