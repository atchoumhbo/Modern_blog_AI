import prisma from '../config/database';
import { WorkflowStatus, StepStatus, Prisma } from '@prisma/client';

/**
 * Service de reprise intelligente des workflows échoués
 * Permet d'économiser 30-50% des coûts en évitant de re-exécuter les étapes réussies
 */
export class WorkflowRecoveryService {
  /**
   * Sauvegarder les données intermédiaires d'une étape
   * Utilisé pour reprendre à partir de cette étape en cas d'échec ultérieur
   */
  async saveIntermediateData(
    executionId: string,
    stepName: string,
    data: Record<string, any>
  ): Promise<void> {
    try {
      // Récupérer l'étape
      const step = await prisma.workflowStep.findFirst({
        where: {
          executionId,
          stepName,
        },
      });

      if (!step) {
        throw new Error(`Step ${stepName} not found for execution ${executionId}`);
      }

      // Mettre à jour les données de sortie (output)
      await prisma.workflowStep.update({
        where: { id: step.id },
        data: {
          outputData: data,
        },
      });

      console.log(`💾 Intermediate data saved for step: ${stepName}`);
    } catch (error) {
      console.error('❌ Error saving intermediate data:', error);
      throw error;
    }
  }

  /**
   * Récupérer les données de reprise pour une exécution échouée
   * Retourne les étapes complétées et leurs données
   */
  async getRecoveryData(executionId: string) {
    const execution = await prisma.workflowExecution.findUnique({
      where: { id: executionId },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
      },
    });

    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    // Étapes complétées (à sauter lors du retry)
    const completedSteps = execution.steps.filter((s) => s.status === StepStatus.COMPLETED);

    // Première étape échouée (point de reprise)
    const failedStep = execution.steps.find((s) => s.status === StepStatus.FAILED);

    // Calculer les économies potentielles
    const savedCost = completedSteps.reduce((sum, step) => sum + step.cost, 0);
    const savedTime = completedSteps.reduce((sum, step) => sum + (step.duration || 0), 0);

    return {
      execution,
      completedSteps: completedSteps.map((s) => ({
        stepName: s.stepName,
        stepOrder: s.stepOrder,
        outputData: s.outputData,
        cost: s.cost,
        duration: s.duration,
      })),
      failedStep: failedStep
        ? {
            stepName: failedStep.stepName,
            stepOrder: failedStep.stepOrder,
            errorMessage: failedStep.errorMessage,
          }
        : null,
      savings: {
        cost: savedCost,
        time: savedTime,
        stepsSkipped: completedSteps.length,
      },
    };
  }

  /**
   * Créer une nouvelle exécution de retry à partir d'une exécution échouée
   * Copie les données des étapes réussies et reprend à l'étape échouée
   */
  async createRetryExecution(originalExecutionId: string, userId: string) {
    const recoveryData = await this.getRecoveryData(originalExecutionId);
    const { execution, completedSteps, failedStep, savings } = recoveryData;

    // Vérifier si on peut retry
    if (execution.retryCount >= execution.maxRetries) {
      throw new Error(
        `Maximum retries (${execution.maxRetries}) reached for execution ${originalExecutionId}`
      );
    }

    // Créer la nouvelle exécution de retry
    const retryExecution = await prisma.workflowExecution.create({
      data: {
        workflowId: execution.workflowId,
        workflowName: execution.workflowName,
        userId,
        status: WorkflowStatus.RETRYING,
        inputData: execution.inputData as Prisma.InputJsonValue,
        parentId: originalExecutionId,
        retryCount: execution.retryCount + 1,
        maxRetries: execution.maxRetries,
        stepsTotal: execution.stepsTotal,
        stepsCompleted: completedSteps.length, // On a déjà ces étapes
      },
    });

    // Copier les étapes complétées avec status SKIPPED
    for (const step of completedSteps) {
      await prisma.workflowStep.create({
        data: {
          executionId: retryExecution.id,
          stepName: step.stepName,
          stepOrder: step.stepOrder,
          stepType: 'DATA_PROCESSING', // Type générique pour étapes skipped
          status: StepStatus.SKIPPED,
          inputData: {},
          outputData: step.outputData as Prisma.InputJsonValue, // Données récupérées de l'exécution originale
          cost: 0, // Pas de coût car on ne re-exécute pas
          duration: 0,
          startedAt: new Date(),
          completedAt: new Date(),
        },
      });
    }

    // Incrémenter le retry count de l'exécution originale
    await prisma.workflowExecution.update({
      where: { id: originalExecutionId },
      data: {
        retryCount: { increment: 1 },
      },
    });

    console.log(`🔄 Retry execution created: ${retryExecution.id}`);
    console.log(`   Original execution: ${originalExecutionId}`);
    console.log(`   Steps to skip: ${completedSteps.length}`);
    console.log(`   Resume from: ${failedStep?.stepName || 'next step'}`);
    console.log(`   Estimated savings: $${savings.cost.toFixed(4)}`);
    console.log(`   Time saved: ${(savings.time / 1000).toFixed(2)}s`);

    return {
      retryExecution,
      skipSteps: completedSteps.map((s) => s.stepName),
      resumeFromStep: failedStep?.stepName,
      savings,
    };
  }

  /**
   * Vérifier si une étape doit être skippée lors d'un retry
   * Retourne true si l'étape a déjà été complétée dans l'exécution parente
   */
  async shouldSkipStep(executionId: string, stepName: string): Promise<boolean> {
    const execution = await prisma.workflowExecution.findUnique({
      where: { id: executionId },
      select: { parentId: true },
    });

    if (!execution?.parentId) {
      return false; // Pas un retry, on ne skip rien
    }

    // Vérifier si l'étape existe déjà dans cette exécution avec status SKIPPED
    const existingStep = await prisma.workflowStep.findFirst({
      where: {
        executionId,
        stepName,
        status: StepStatus.SKIPPED,
      },
    });

    return !!existingStep;
  }

  /**
   * Récupérer les données de sortie d'une étape skippée
   * Utilisé pour continuer le workflow avec les données de l'exécution parente
   */
  async getSkippedStepData(executionId: string, stepName: string): Promise<Record<string, any> | null> {
    const step = await prisma.workflowStep.findFirst({
      where: {
        executionId,
        stepName,
        status: StepStatus.SKIPPED,
      },
      select: {
        outputData: true,
      },
    });

    if (!step?.outputData) {
      return null;
    }

    console.log(`📥 Retrieved skipped step data: ${stepName}`);
    return step.outputData as Record<string, any>;
  }

  /**
   * Obtenir l'historique de retry d'une exécution
   */
  async getRetryHistory(executionId: string) {
    const execution = await prisma.workflowExecution.findUnique({
      where: { id: executionId },
      include: {
        retries: {
          orderBy: { startedAt: 'desc' },
          include: {
            _count: {
              select: { steps: true },
            },
          },
        },
        parent: {
          select: {
            id: true,
            workflowName: true,
            status: true,
            startedAt: true,
            completedAt: true,
          },
        },
      },
    });

    return execution;
  }

  /**
   * Calculer les économies totales réalisées grâce au système de reprise
   */
  async calculateTotalSavings(userId: string) {
    // Toutes les exécutions de retry de l'utilisateur
    const retries = await prisma.workflowExecution.findMany({
      where: {
        userId,
        parentId: { not: null },
      },
      include: {
        steps: {
          where: { status: StepStatus.SKIPPED },
        },
        parent: {
          select: {
            steps: {
              where: { status: StepStatus.COMPLETED },
            },
          },
        },
      },
    });

    let totalSavedCost = 0;
    let totalSavedTime = 0;
    let totalStepsSkipped = 0;

    for (const retry of retries) {
      const skippedSteps = retry.steps;
      totalStepsSkipped += skippedSteps.length;

      // Récupérer les coûts des étapes originales
      if (retry.parent) {
        for (const originalStep of retry.parent.steps) {
          const wasSkipped = skippedSteps.some((s) => s.stepName === originalStep.stepName);
          if (wasSkipped) {
            totalSavedCost += originalStep.cost;
            totalSavedTime += originalStep.duration || 0;
          }
        }
      }
    }

    return {
      totalRetries: retries.length,
      totalStepsSkipped,
      totalSavedCost,
      totalSavedTime,
      avgSavingsPerRetry: retries.length > 0 ? totalSavedCost / retries.length : 0,
    };
  }
}

export default new WorkflowRecoveryService();
