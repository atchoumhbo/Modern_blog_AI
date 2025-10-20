import prisma from '../config/database';
import { WorkflowStatus, StepStatus } from '@prisma/client';

/**
 * Coûts de référence pour les APIs (en USD)
 * Source: Pricing officiel des providers
 */
const PRICING = {
  openai: {
    'gpt-4o': {
      input: 2.50 / 1_000_000,  // $2.50 per 1M input tokens
      output: 10.00 / 1_000_000, // $10.00 per 1M output tokens
    },
    'gpt-4o-mini': {
      input: 0.150 / 1_000_000,  // $0.15 per 1M input tokens
      output: 0.600 / 1_000_000, // $0.60 per 1M output tokens
    },
  },
  stabilityai: {
    'sd3-large': 0.065,      // $0.065 per image
    'sd3-large-turbo': 0.040, // $0.04 per image
    'sd3-medium': 0.035,      // $0.035 per image
  },
};

export interface WorkflowInput {
  workflowId: string;
  workflowName: string;
  userId: string;
  inputData: Record<string, any>;
}

export interface StepInput {
  executionId: string;
  stepName: string;
  stepOrder: number;
  stepType: 'API_CALL' | 'AI_GENERATION' | 'DATABASE_WRITE' | 'DATA_PROCESSING';
  inputData?: Record<string, any>;
}

export interface StepResult {
  stepId: string;
  status: StepStatus;
  outputData?: Record<string, any>;
  cost: number;
  duration: number;
  errorMessage?: string;
}

export interface CostCalculation {
  provider: 'openai' | 'stabilityai';
  model: string;
  operation: string;
  usage: {
    inputTokens?: number;
    outputTokens?: number;
    imageCount?: number;
  };
}

/**
 * Service de gestion des exécutions de workflows N8N
 */
export class WorkflowExecutionService {
  /**
   * Démarrer une nouvelle exécution de workflow
   */
  async startExecution(input: WorkflowInput) {
    try {
      const execution = await prisma.workflowExecution.create({
        data: {
          workflowId: input.workflowId,
          workflowName: input.workflowName,
          userId: input.userId,
          status: WorkflowStatus.PENDING,
          inputData: input.inputData,
          startedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
        },
      });

      console.log(`🚀 Workflow execution started: ${execution.id}`);
      console.log(`   Workflow: ${input.workflowName}`);
      console.log(`   User: ${execution.user.email}`);

      return execution;
    } catch (error) {
      console.error('❌ Error starting workflow execution:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour le statut d'une exécution
   */
  async updateStatus(
    executionId: string,
    status: WorkflowStatus,
    additionalData?: {
      outputData?: Record<string, any>;
      errorMessage?: string;
      errorStack?: string;
    }
  ) {
    const isCompleted = status === WorkflowStatus.COMPLETED || status === WorkflowStatus.FAILED;
    const completedAt = isCompleted ? new Date() : null;

    const execution = await prisma.workflowExecution.findUnique({
      where: { id: executionId },
      select: { startedAt: true },
    });

    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    const duration = completedAt
      ? Math.floor((completedAt.getTime() - execution.startedAt.getTime()) / 1000)
      : null;

    const updated = await prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        status,
        completedAt,
        duration,
        ...additionalData,
      },
    });

    console.log(`📊 Execution ${executionId} status updated: ${status}`);
    if (duration) {
      console.log(`   Duration: ${duration}s`);
    }

    return updated;
  }

  /**
   * Démarrer le tracking d'une étape
   */
  async startStep(input: StepInput) {
    try {
      const step = await prisma.workflowStep.create({
        data: {
          executionId: input.executionId,
          stepName: input.stepName,
          stepOrder: input.stepOrder,
          stepType: input.stepType,
          status: StepStatus.RUNNING,
          inputData: input.inputData,
          startedAt: new Date(),
        },
      });

      // Mettre à jour l'exécution pour indiquer qu'elle est en cours
      await prisma.workflowExecution.update({
        where: { id: input.executionId },
        data: {
          status: WorkflowStatus.RUNNING,
          stepsTotal: { increment: 1 },
        },
      });

      console.log(`⚙️  Step started: ${input.stepName} (order: ${input.stepOrder})`);

      return step;
    } catch (error) {
      console.error(`❌ Error starting step ${input.stepName}:`, error);
      throw error;
    }
  }

  /**
   * Compléter une étape avec succès
   */
  async completeStep(
    stepId: string,
    outputData: Record<string, any>,
    costCalculation?: CostCalculation
  ): Promise<StepResult> {
    const step = await prisma.workflowStep.findUnique({
      where: { id: stepId },
      select: { startedAt: true, executionId: true },
    });

    if (!step) {
      throw new Error(`Step ${stepId} not found`);
    }

    const completedAt = new Date();
    const duration = completedAt.getTime() - step.startedAt.getTime(); // milliseconds

    // Calculer le coût si fourni
    let cost = 0;
    let costDetails = null;
    if (costCalculation) {
      const calculation = this.calculateCost(costCalculation);
      cost = calculation.cost;
      costDetails = calculation.details;
    }

    // Mettre à jour l'étape
    const updatedStep = await prisma.workflowStep.update({
      where: { id: stepId },
      data: {
        status: StepStatus.COMPLETED,
        completedAt,
        duration,
        outputData,
        cost,
        costDetails,
      },
    });

    // Mettre à jour l'exécution
    await this.updateExecutionCosts(step.executionId, cost);
    await prisma.workflowExecution.update({
      where: { id: step.executionId },
      data: {
        stepsCompleted: { increment: 1 },
      },
    });

    console.log(`✅ Step completed: ${stepId}`);
    console.log(`   Duration: ${duration}ms`);
    if (cost > 0) {
      console.log(`   Cost: $${cost.toFixed(4)}`);
    }

    return {
      stepId,
      status: StepStatus.COMPLETED,
      outputData,
      cost,
      duration,
    };
  }

  /**
   * Marquer une étape comme échouée
   */
  async failStep(stepId: string, errorMessage: string): Promise<StepResult> {
    const step = await prisma.workflowStep.findUnique({
      where: { id: stepId },
      select: { startedAt: true, executionId: true },
    });

    if (!step) {
      throw new Error(`Step ${stepId} not found`);
    }

    const completedAt = new Date();
    const duration = completedAt.getTime() - step.startedAt.getTime();

    const updatedStep = await prisma.workflowStep.update({
      where: { id: stepId },
      data: {
        status: StepStatus.FAILED,
        completedAt,
        duration,
        errorMessage,
      },
    });

    // Mettre à jour l'exécution
    await prisma.workflowExecution.update({
      where: { id: step.executionId },
      data: {
        stepsFailed: { increment: 1 },
      },
    });

    console.error(`❌ Step failed: ${stepId}`);
    console.error(`   Error: ${errorMessage}`);

    return {
      stepId,
      status: StepStatus.FAILED,
      duration,
      errorMessage,
      cost: 0,
    };
  }

  /**
   * Calculer le coût d'une opération
   */
  calculateCost(input: CostCalculation): { cost: number; details: any } {
    let cost = 0;
    const details: any = {
      provider: input.provider,
      model: input.model,
      operation: input.operation,
    };

    if (input.provider === 'openai') {
      const pricing = PRICING.openai[input.model as keyof typeof PRICING.openai];
      if (pricing && input.usage.inputTokens && input.usage.outputTokens) {
        const inputCost = input.usage.inputTokens * pricing.input;
        const outputCost = input.usage.outputTokens * pricing.output;
        cost = inputCost + outputCost;

        details.inputTokens = input.usage.inputTokens;
        details.outputTokens = input.usage.outputTokens;
        details.inputCost = inputCost;
        details.outputCost = outputCost;
      }
    } else if (input.provider === 'stabilityai') {
      const pricePerImage = PRICING.stabilityai[input.model as keyof typeof PRICING.stabilityai];
      if (pricePerImage && input.usage.imageCount) {
        cost = input.usage.imageCount * pricePerImage;

        details.imageCount = input.usage.imageCount;
        details.pricePerImage = pricePerImage;
      }
    }

    return { cost, details };
  }

  /**
   * Mettre à jour les coûts d'une exécution
   */
  private async updateExecutionCosts(executionId: string, additionalCost: number) {
    const execution = await prisma.workflowExecution.findUnique({
      where: { id: executionId },
      select: { openaiCost: true, stabilityAiCost: true },
    });

    if (!execution) return;

    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        totalCost: { increment: additionalCost },
      },
    });
  }

  /**
   * Obtenir les détails d'une exécution
   */
  async getExecution(executionId: string) {
    return await prisma.workflowExecution.findUnique({
      where: { id: executionId },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
    });
  }

  /**
   * Lister les exécutions d'un utilisateur
   */
  async listExecutions(userId: string, options?: { limit?: number; status?: WorkflowStatus }) {
    return await prisma.workflowExecution.findMany({
      where: {
        userId,
        ...(options?.status && { status: options.status }),
      },
      include: {
        _count: {
          select: { steps: true },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: options?.limit || 50,
    });
  }

  /**
   * Obtenir les statistiques d'exécution
   */
  async getStats(userId: string) {
    const executions = await prisma.workflowExecution.findMany({
      where: { userId },
      select: {
        status: true,
        totalCost: true,
        duration: true,
      },
    });

    const stats = {
      total: executions.length,
      completed: executions.filter((e) => e.status === WorkflowStatus.COMPLETED).length,
      failed: executions.filter((e) => e.status === WorkflowStatus.FAILED).length,
      running: executions.filter((e) => e.status === WorkflowStatus.RUNNING).length,
      totalCost: executions.reduce((sum, e) => sum + e.totalCost, 0),
      avgDuration:
        executions.filter((e) => e.duration).reduce((sum, e) => sum + (e.duration || 0), 0) /
          executions.filter((e) => e.duration).length || 0,
    };

    return stats;
  }
}

export default new WorkflowExecutionService();
