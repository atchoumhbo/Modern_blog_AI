# Create test user in blog_mern database for N8N workflow testing
# Cette base est séparée de Strapi

Write-Host ""
Write-Host "Creating test user in blog_mern database..." -ForegroundColor Yellow
Write-Host ""

# Créer un user via le backend (en utilisant Prisma)
$createUserScript = @'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function createTestUser() {
  const prisma = new PrismaClient();
  
  try {
    const hashedPassword = await bcrypt.hash('Test123!', 10);
    
    const user = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        username: 'testuser',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        isAdmin: false,
        isActive: true
      }
    });
    
    console.log('User created or found:');
    console.log(JSON.stringify({
      id: user.id,
      email: user.email,
      username: user.username
    }, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
'@

# Sauvegarder le script
$createUserScript | Out-File -FilePath "create-user-prisma.js" -Encoding UTF8

Write-Host "Script créé: create-user-prisma.js" -ForegroundColor Green
Write-Host ""
Write-Host "Pour l'exécuter sur le VPS:" -ForegroundColor Yellow
Write-Host "  1. ssh root@173.212.208.181" -ForegroundColor Cyan
Write-Host "  2. docker compose -f docker-compose.mern-full.yml exec backend node /app/create-user-prisma.js" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ou plus simple:" -ForegroundColor Yellow
Write-Host "  Utilise n'importe quel ID dans les tests (l'erreur est OK pour démonstration)" -ForegroundColor Cyan
Write-Host ""
