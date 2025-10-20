const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Décode le mot de passe depuis base64
    const passwordBase64 = process.argv[2];
    const email = process.argv[3];
    const name = process.argv[4];
    
    const password = Buffer.from(passwordBase64, 'base64').toString('utf8');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const existing = await prisma.user.findUnique({
      where: { email: email }
    });
    
    if (existing) {
      console.log('Utilisateur existe deja, mise a jour du mot de passe...');
      await prisma.user.update({
        where: { email: email },
        data: {
          password: hashedPassword,
          isAdmin: true,
          isActive: true
        }
      });
      console.log('✓ Mot de passe mis a jour!');
    } else {
      console.log('Creation du nouvel utilisateur...');
      await prisma.user.create({
        data: {
          email: email,
          password: hashedPassword,
          name: name,
          isAdmin: true,
          isActive: true
        }
      });
      console.log('✓ Utilisateur cree!');
    }
    
    console.log('');
    console.log('Email: ' + email);
    console.log('Admin: true');
    console.log('');
  } catch (error) {
    console.error('Erreur:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
