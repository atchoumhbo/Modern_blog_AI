import prisma from './config/database';

/**
 * Initialiser les budgets pour les utilisateurs existants
 */
async function initializeUserBudgets() {
  console.log('🔄 Initialisation des budgets utilisateurs...');

  try {
    // Récupérer tous les utilisateurs sans budget
    const users = await prisma.user.findMany({
      where: {
        userBudget: null,
      },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    console.log(`📊 ${users.length} utilisateurs trouvés sans budget`);

    // Créer un budget pour chaque utilisateur
    const now = new Date();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59); // Fin du mois

    for (const user of users) {
      await prisma.userBudget.create({
        data: {
          userId: user.id,
          monthlyLimit: 50.0, // $50 USD par défaut
          currentSpent: 0,
          periodStart: now,
          periodEnd: periodEnd,
          alertAt80: true,
          alertAt90: true,
          alertAt100: true,
          emailAlerts: true,
          totalExecutions: 0,
          successfulRuns: 0,
          failedRuns: 0,
        },
      });

      console.log(`✅ Budget créé pour ${user.email} (${user.username})`);
    }

    console.log(`\n🎉 ${users.length} budgets initialisés avec succès !`);
    console.log(`💰 Budget mensuel par défaut: $50 USD`);
    console.log(`📅 Période: ${now.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des budgets:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  initializeUserBudgets()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default initializeUserBudgets;
