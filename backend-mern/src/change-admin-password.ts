/**
 * Script pour changer le mot de passe admin
 * Usage: node dist/change-admin-password.js "VotreNouveauMotDePasse"
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function changeAdminPassword() {
  try {
    // Récupérer le nouveau mot de passe depuis les arguments
    const newPassword = process.argv[2];

    if (!newPassword) {
      console.error('❌ Usage: node dist/change-admin-password.js "VotreNouveauMotDePasse"');
      process.exit(1);
    }

    // Vérifier la force du mot de passe
    if (newPassword.length < 12) {
      console.error('❌ Le mot de passe doit contenir au moins 12 caractères');
      process.exit(1);
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecial) {
      console.error('❌ Le mot de passe doit contenir:');
      console.error('   - Au moins une majuscule');
      console.error('   - Au moins une minuscule');
      console.error('   - Au moins un chiffre');
      console.error('   - Au moins un caractère spécial (!@#$%^&*...)');
      process.exit(1);
    }

    console.log('🔐 Changement du mot de passe admin...\n');

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe
    const admin = await prisma.user.update({
      where: { email: 'boujraf.hicham@gmail.com' },
      data: { password: hashedPassword },
    });

    console.log(`✅ Mot de passe changé avec succès pour: ${admin.email}`);
    console.log(`📧 Email: ${admin.email}`);
    console.log(`👤 Username: ${admin.username}`);
    console.log('🔒 Nouveau mot de passe: [MASQUÉ]\n');
    console.log('⚠️  IMPORTANT: Notez bien votre nouveau mot de passe !');

  } catch (error) {
    console.error('❌ Erreur lors du changement de mot de passe:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

changeAdminPassword();
