import prisma from '../config/database';

interface BudgetAlert {
  userId: string;
  userEmail: string;
  currentSpent: number;
  monthlyLimit: number;
  percentage: number;
  message: string;
}

/**
 * Service de gestion des budgets utilisateurs
 */
export class BudgetService {
  /**
   * Vérifier si l'utilisateur a un budget suffisant
   * Retourne true si l'opération peut être effectuée, false sinon
   */
  async checkBudget(userId: string, estimatedCost: number): Promise<{ allowed: boolean; reason?: string }> {
    const budget = await this.getUserBudget(userId);

    if (!budget) {
      // Créer un budget par défaut si inexistant
      await this.createDefaultBudget(userId);
      return { allowed: true };
    }

    // Vérifier si le budget a expiré (fin de période)
    const now = new Date();
    if (now > budget.periodEnd) {
      await this.resetMonthlyBudget(userId);
      return { allowed: true };
    }

    // Vérifier si le budget est dépassé
    const projectedSpent = budget.currentSpent + estimatedCost;
    if (projectedSpent > budget.monthlyLimit) {
      return {
        allowed: false,
        reason: `Budget insuffisant. Limite: $${budget.monthlyLimit}, Dépensé: $${budget.currentSpent.toFixed(2)}, Estimé: $${estimatedCost.toFixed(2)}`,
      };
    }

    // Envoyer des alertes si nécessaire
    const percentage = (projectedSpent / budget.monthlyLimit) * 100;
    if (percentage >= 80) {
      await this.sendBudgetAlert(userId, percentage);
    }

    return { allowed: true };
  }

  /**
   * Déduire un coût du budget utilisateur
   */
  async deductCost(userId: string, actualCost: number): Promise<void> {
    try {
      const budget = await this.getUserBudget(userId);

      if (!budget) {
        console.warn(`⚠️  No budget found for user ${userId}, creating default budget`);
        await this.createDefaultBudget(userId);
      }

      // Mettre à jour le budget
      await prisma.userBudget.update({
        where: { userId },
        data: {
          currentSpent: { increment: actualCost },
        },
      });

      console.log(`💰 Cost deducted: $${actualCost.toFixed(4)} for user ${userId}`);

      // Vérifier et envoyer alertes si nécessaire
      const updatedBudget = await this.getUserBudget(userId);
      if (updatedBudget) {
        const percentage = (updatedBudget.currentSpent / updatedBudget.monthlyLimit) * 100;
        await this.checkAndSendAlerts(userId, percentage, updatedBudget);
      }
    } catch (error) {
      console.error('❌ Error deducting cost:', error);
      throw error;
    }
  }

  /**
   * Incrémenter les statistiques d'exécution
   */
  async incrementStats(userId: string, status: 'success' | 'failed'): Promise<void> {
    const updateData = {
      totalExecutions: { increment: 1 },
      ...(status === 'success' ? { successfulRuns: { increment: 1 } } : { failedRuns: { increment: 1 } }),
    };

    await prisma.userBudget.update({
      where: { userId },
      data: updateData,
    });
  }

  /**
   * Réinitialiser le budget mensuel d'un utilisateur
   * Appelé automatiquement au début de chaque mois
   */
  async resetMonthlyBudget(userId: string): Promise<void> {
    const now = new Date();
    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    await prisma.userBudget.update({
      where: { userId },
      data: {
        currentSpent: 0,
        periodStart: now,
        periodEnd: nextMonthEnd,
      },
    });

    console.log(`🔄 Budget reset for user ${userId}`);
    console.log(`   New period: ${now.toLocaleDateString()} - ${nextMonthEnd.toLocaleDateString()}`);
  }

  /**
   * Créer un budget par défaut pour un nouvel utilisateur
   */
  async createDefaultBudget(userId: string): Promise<void> {
    const now = new Date();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    await prisma.userBudget.create({
      data: {
        userId,
        monthlyLimit: 50.0, // $50 USD par défaut
        currentSpent: 0,
        periodStart: now,
        periodEnd,
        alertAt80: true,
        alertAt90: true,
        alertAt100: true,
        emailAlerts: true,
        totalExecutions: 0,
        successfulRuns: 0,
        failedRuns: 0,
      },
    });

    console.log(`✅ Default budget created for user ${userId}: $50/month`);
  }

  /**
   * Obtenir le budget d'un utilisateur
   */
  async getUserBudget(userId: string) {
    return await prisma.userBudget.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            email: true,
            username: true,
          },
        },
      },
    });
  }

  /**
   * Mettre à jour la limite mensuelle d'un utilisateur
   */
  async updateMonthlyLimit(userId: string, newLimit: number): Promise<void> {
    await prisma.userBudget.update({
      where: { userId },
      data: { monthlyLimit: newLimit },
    });

    console.log(`💵 Monthly limit updated for user ${userId}: $${newLimit}`);
  }

  /**
   * Vérifier et envoyer les alertes appropriées
   */
  private async checkAndSendAlerts(
    userId: string,
    percentage: number,
    budget: any
  ): Promise<void> {
    if (percentage >= 100 && budget.alertAt100) {
      await this.sendBudgetAlert(userId, 100);
    } else if (percentage >= 90 && budget.alertAt90) {
      await this.sendBudgetAlert(userId, 90);
    } else if (percentage >= 80 && budget.alertAt80) {
      await this.sendBudgetAlert(userId, 80);
    }
  }

  /**
   * Envoyer une alerte de budget
   * TODO: Implémenter l'envoi d'emails réels
   */
  private async sendBudgetAlert(userId: string, percentage: number): Promise<void> {
    const budget = await this.getUserBudget(userId);

    if (!budget) return;

    const alert: BudgetAlert = {
      userId,
      userEmail: budget.user.email,
      currentSpent: budget.currentSpent,
      monthlyLimit: budget.monthlyLimit,
      percentage,
      message: `Alerte budget: ${percentage}% de votre limite mensuelle atteint ($${budget.currentSpent.toFixed(2)}/$${budget.monthlyLimit})`,
    };

    // Log l'alerte (en production, envoyer un email)
    console.warn(`⚠️  BUDGET ALERT: ${alert.message}`);
    console.warn(`   User: ${alert.userEmail}`);
    console.warn(`   Spent: $${alert.currentSpent.toFixed(2)}`);
    console.warn(`   Limit: $${alert.monthlyLimit}`);

    // TODO: Envoyer email via service d'emailing (SendGrid, AWS SES, etc.)
    // await emailService.sendBudgetAlert(alert);
  }

  /**
   * Obtenir les statistiques globales des budgets
   * Utile pour l'admin dashboard
   */
  async getGlobalStats() {
    const budgets = await prisma.userBudget.findMany({
      include: {
        user: {
          select: {
            email: true,
            username: true,
          },
        },
      },
    });

    const totalSpent = budgets.reduce((sum, b) => sum + b.currentSpent, 0);
    const totalLimit = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
    const totalExecutions = budgets.reduce((sum, b) => sum + b.totalExecutions, 0);
    const totalSuccess = budgets.reduce((sum, b) => sum + b.successfulRuns, 0);
    const totalFailed = budgets.reduce((sum, b) => sum + b.failedRuns, 0);

    return {
      totalUsers: budgets.length,
      totalSpent,
      totalLimit,
      averageSpent: budgets.length > 0 ? totalSpent / budgets.length : 0,
      totalExecutions,
      totalSuccess,
      totalFailed,
      successRate: totalExecutions > 0 ? (totalSuccess / totalExecutions) * 100 : 0,
      usersOverBudget: budgets.filter((b) => b.currentSpent > b.monthlyLimit).length,
      usersNear80: budgets.filter(
        (b) => (b.currentSpent / b.monthlyLimit) * 100 >= 80
      ).length,
    };
  }

  /**
   * Réinitialiser tous les budgets (tâche CRON mensuelle)
   */
  async resetAllBudgets(): Promise<void> {
    const now = new Date();
    const budgets = await prisma.userBudget.findMany({
      where: {
        periodEnd: {
          lte: now,
        },
      },
    });

    console.log(`🔄 Resetting ${budgets.length} budgets...`);

    for (const budget of budgets) {
      await this.resetMonthlyBudget(budget.userId);
    }

    console.log(`✅ All budgets reset successfully`);
  }
}

export default new BudgetService();
