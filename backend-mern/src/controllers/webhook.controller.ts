import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middlewares/error';

/**
 * Webhook Controller - Reçoit les notifications N8N
 * Endpoints pour tracking en temps réel des exécutions N8N
 */
export class WebhookController {
  /**
   * Webhook: Démarrage d'une exécution N8N
   * POST /api/webhooks/n8n/start
   */
  async handleExecutionStart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        workflowId,
        workflowName,
        executionId,
        startedAt,
        userId,
        inputData
      } = req.body;

      // Validation
      if (!workflowId || !workflowName || !executionId) {
        throw new AppError('Missing required fields: workflowId, workflowName, executionId', 400);
      }

      // Trouver ou utiliser l'utilisateur par défaut
      const user = userId 
        ? await prisma.user.findUnique({ where: { id: userId } })
        : await prisma.user.findFirst({ where: { email: 'n8n@blog.bh-systems.be' } });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Créer l'exécution dans la DB
      const execution = await prisma.workflowExecution.create({
        data: {
          userId: user.id,
          workflowId: workflowId,
          workflowName,
          status: 'RUNNING',
          n8nExecutionId: executionId,
          startedAt: startedAt ? new Date(startedAt) : new Date(),
          inputData: inputData || {}
        }
      });

      console.log(`📥 [Webhook] Exécution démarrée: ${execution.id} (N8N: ${executionId})`);

      res.status(201).json({
        success: true,
        execution: {
          id: execution.id,
          n8nExecutionId: executionId,
          status: execution.status
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Webhook: Mise à jour d'une étape
   * POST /api/webhooks/n8n/step
   */
  async handleStepUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        executionId,
        stepName,
        status,
        startedAt,
        completedAt,
        output,
        error,
        metadata
      } = req.body;

      // Validation
      if (!executionId || !stepName || !status) {
        throw new AppError('Missing required fields: executionId, stepName, status', 400);
      }

      // Trouver l'exécution par N8N execution ID
      const execution = await prisma.workflowExecution.findFirst({
        where: { n8nExecutionId: executionId }
      });

      if (!execution) {
        throw new AppError(`Execution not found: ${executionId}`, 404);
      }

      // Créer ou mettre à jour l'étape
      const step = await prisma.workflowStep.upsert({
        where: {
          executionId_stepName: {
            executionId: execution.id,
            stepName
          }
        },
        create: {
          executionId: execution.id,
          stepName,
          stepOrder: 0, // À améliorer plus tard
          stepType: 'N8N_NODE',
          status,
          startedAt: startedAt ? new Date(startedAt) : new Date(),
          completedAt: completedAt ? new Date(completedAt) : null,
          outputData: output || null,
          errorMessage: error || null
        },
        update: {
          status,
          completedAt: completedAt ? new Date(completedAt) : null,
          outputData: output || null,
          errorMessage: error || null
        }
      });

      console.log(`📝 [Webhook] Step updated: ${stepName} - ${status}`);

      res.json({
        success: true,
        step: {
          id: step.id,
          stepName: step.stepName,
          status: step.status
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Webhook: Fin d'exécution
   * POST /api/webhooks/n8n/complete
   */
  async handleExecutionComplete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        executionId,
        status,
        completedAt,
        result,
        error,
        costs
      } = req.body;

      // Validation
      if (!executionId || !status) {
        throw new AppError('Missing required fields: executionId, status', 400);
      }

      // Trouver l'exécution
      const execution = await prisma.workflowExecution.findFirst({
        where: { n8nExecutionId: executionId },
        include: { steps: true }
      });

      if (!execution) {
        throw new AppError(`Execution not found: ${executionId}`, 404);
      }

      // Calculer la durée
      const duration = completedAt 
        ? new Date(completedAt).getTime() - execution.startedAt.getTime()
        : Date.now() - execution.startedAt.getTime();

      // Mettre à jour l'exécution
      const updatedExecution = await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: status === 'success' ? 'COMPLETED' : 'FAILED',
          completedAt: completedAt ? new Date(completedAt) : new Date(),
          duration: Math.floor(duration / 1000), // en secondes
          outputData: result || null,
          errorMessage: error || null,
          totalCost: costs?.total || 0
        }
      });

      // Déduire du budget si coût > 0
      if (costs?.total && costs.total > 0) {
        const budget = await prisma.userBudget.findUnique({
          where: { userId: execution.userId }
        });

        if (budget) {
          await prisma.userBudget.update({
            where: { userId: execution.userId },
            data: {
              currentSpent: budget.currentSpent + costs.total
            }
          });
        }
      }

      console.log(`✅ [Webhook] Exécution terminée: ${execution.id} - ${status} (${costs?.total || 0}$)`);

      res.json({
        success: true,
        execution: {
          id: updatedExecution.id,
          status: updatedExecution.status,
          duration: updatedExecution.duration,
          cost: updatedExecution.totalCost
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Webhook: Heartbeat (pour vérifier que le webhook fonctionne)
   * GET /api/webhooks/n8n/ping
   */
  async handlePing(req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      message: 'Webhook endpoint is alive',
      timestamp: new Date().toISOString()
    });
  }
}

export const webhookController = new WebhookController();
