import { Request, Response } from 'express';
import { WorkflowExecutionService } from '../services/workflow-execution.service';
import { WorkflowRecoveryService } from '../services/workflow-recovery.service';
import { BudgetService } from '../services/budget.service';
import { workflowExecutorService } from '../services/workflow-executor.service';

// ===========================
// WORKFLOW CONTROLLER
// ===========================
// Handles all workflow execution requests
// Integrates execution, recovery, and budget services

export class WorkflowController {
  private executionService: WorkflowExecutionService;
  private recoveryService: WorkflowRecoveryService;
  private budgetService: BudgetService;

  constructor() {
    this.executionService = new WorkflowExecutionService();
    this.recoveryService = new WorkflowRecoveryService();
    this.budgetService = new BudgetService();
  }

  /**
   * POST /api/workflows/execute
   * Execute a new N8N workflow
   * 
   * Body:
   * {
   *   userId: string,
   *   workflowName: string,
   *   workflowType: 'reddit_scraper' | 'image_generator' | 'ai_assistant',
   *   inputData: any,
   *   estimatedCost?: number
   * }
   */
  async executeWorkflow(req: Request, res: Response) {
    try {
      const { userId, workflowName, workflowId, inputData, estimatedCost = 0 } = req.body;

      // Validate required fields
      if (!userId || !workflowName || !workflowId) {
        return res.status(400).json({
          error: 'Missing required fields: userId, workflowName, workflowId'
        });
      }

      // Check budget before execution
      const budgetOk = await this.budgetService.checkBudget(userId, estimatedCost);
      if (!budgetOk) {
        return res.status(402).json({
          error: 'Insufficient budget. Please increase your monthly limit or wait for next period.',
          code: 'BUDGET_EXCEEDED'
        });
      }

      // Start workflow execution
      const execution = await this.executionService.startExecution({
        userId,
        workflowId,
        workflowName,
        inputData
      });

      console.log(`[WorkflowController] Started execution ${execution.id} for user ${userId}`);

      return res.status(201).json({
        success: true,
        execution: {
          id: execution.id,
          status: execution.status,
          workflowName: execution.workflowName,
          createdAt: execution.createdAt
        },
        message: 'Workflow execution started successfully'
      });

    } catch (error: any) {
      console.error('[WorkflowController] Error executing workflow:', error);
      return res.status(500).json({
        error: 'Failed to execute workflow',
        details: error.message
      });
    }
  }

  /**
   * GET /api/workflows/executions
   * List all workflow executions for a user
   * 
   * Query params:
   * - userId: string (required)
   * - status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
   * - limit?: number (default: 50)
   * - offset?: number (default: 0)
   */
  async listExecutions(req: Request, res: Response) {
    try {
      const { userId, status, limit = 50, offset = 0 } = req.query;

      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({
          error: 'Missing or invalid userId query parameter'
        });
      }

      const filters: any = { userId };
      if (status && typeof status === 'string') {
        filters.status = status;
      }

      const executions = await this.executionService.listExecutions(
        userId as string,
        {
          limit: parseInt(limit as string),
          status: status as any
        }
      );

      return res.status(200).json({
        success: true,
        executions,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total: executions.length
        }
      });

    } catch (error: any) {
      console.error('[WorkflowController] Error listing executions:', error);
      return res.status(500).json({
        error: 'Failed to list executions',
        details: error.message
      });
    }
  }

  /**
   * GET /api/workflows/executions/:id
   * Get detailed information about a specific execution
   * Includes all steps and recovery data if available
   */
  async getExecution(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'Missing execution ID'
        });
      }

      const execution = await this.executionService.getExecution(id);

      if (!execution) {
        return res.status(404).json({
          error: 'Execution not found'
        });
      }

      // Get recovery data if execution failed
      let recoveryData = null;
      if (execution.status === 'FAILED') {
        recoveryData = await this.recoveryService.getRecoveryData(id);
      }

      return res.status(200).json({
        success: true,
        execution: {
          id: execution.id,
          userId: execution.userId,
          workflowName: execution.workflowName,
          status: execution.status,
          inputData: execution.inputData,
          outputData: execution.outputData,
          errorMessage: execution.errorMessage,
          totalCost: execution.totalCost,
          duration: execution.duration,
          stepsTotal: execution.stepsTotal,
          stepsCompleted: execution.stepsCompleted,
          stepsFailed: execution.stepsFailed,
          createdAt: execution.createdAt,
          updatedAt: execution.updatedAt,
          startedAt: execution.startedAt,
          completedAt: execution.completedAt,
          steps: execution.steps
        },
        recoveryData
      });

    } catch (error: any) {
      console.error('[WorkflowController] Error getting execution:', error);
      return res.status(500).json({
        error: 'Failed to get execution details',
        details: error.message
      });
    }
  }

  /**
   * POST /api/workflows/executions/:id/retry
   * Retry a failed execution with smart recovery
   * Skips completed steps to save costs
   * 
   * Body:
   * {
   *   userId: string
   * }
   */
  async retryExecution(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!id || !userId) {
        return res.status(400).json({
          error: 'Missing required fields: id, userId'
        });
      }

      // Get original execution
      const originalExecution = await this.executionService.getExecution(id);

      if (!originalExecution) {
        return res.status(404).json({
          error: 'Original execution not found'
        });
      }

      if (originalExecution.status !== 'FAILED') {
        return res.status(400).json({
          error: 'Can only retry failed executions',
          currentStatus: originalExecution.status
        });
      }

      // Get recovery data to estimate savings
      const recoveryData = await this.recoveryService.getRecoveryData(id);
      
      // Estimate cost for retry (only failed/pending steps)
      const estimatedCost = originalExecution.totalCost - (recoveryData?.savings.cost || 0);

      // Check budget
      const budgetOk = await this.budgetService.checkBudget(userId, estimatedCost);
      if (!budgetOk) {
        return res.status(402).json({
          error: 'Insufficient budget for retry',
          estimatedCost,
          code: 'BUDGET_EXCEEDED'
        });
      }

      // Create retry execution
      const retryResult = await this.recoveryService.createRetryExecution(id, userId);

      console.log(`[WorkflowController] Created retry execution ${retryResult.retryExecution.id} from ${id}`);
      console.log(`[WorkflowController] Estimated savings: $${retryResult.savings.cost.toFixed(4)} (${retryResult.savings.stepsSkipped} steps)`);

      return res.status(201).json({
        success: true,
        retry: {
          id: retryResult.retryExecution.id,
          parentId: retryResult.retryExecution.parentId,
          status: retryResult.retryExecution.status,
          createdAt: retryResult.retryExecution.createdAt
        },
        savings: retryResult.savings,
        message: 'Retry execution created with smart recovery'
      });

    } catch (error: any) {
      console.error('[WorkflowController] Error retrying execution:', error);
      return res.status(500).json({
        error: 'Failed to retry execution',
        details: error.message
      });
    }
  }

  /**
   * GET /api/workflows/stats
   * Get workflow execution statistics for a user
   * 
   * Query params:
   * - userId: string (required)
   */
  async getStats(req: Request, res: Response) {
    try {
      const { userId } = req.query;

      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({
          error: 'Missing or invalid userId query parameter'
        });
      }

      // Get execution stats
      const executionStats = await this.executionService.getStats(userId);

      // Get total savings from retries
      const totalSavings = await this.recoveryService.calculateTotalSavings(userId);

      return res.status(200).json({
        success: true,
        stats: {
          executions: executionStats,
          savings: totalSavings
        }
      });

    } catch (error: any) {
      console.error('[WorkflowController] Error getting stats:', error);
      return res.status(500).json({
        error: 'Failed to get statistics',
        details: error.message
      });
    }
  }

  /**
   * GET /api/users/budget
   * Get budget information for a user
   * 
   * Query params:
   * - userId: string (required)
   */
  async getBudget(req: Request, res: Response) {
    try {
      const { userId } = req.query;

      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({
          error: 'Missing or invalid userId query parameter'
        });
      }

      // Get or create budget
      const budgetOk = await this.budgetService.checkBudget(userId, 0);
      
      // Get budget from database using the service method
      const budget = await this.budgetService.getUserBudget(userId);

      if (!budget) {
        return res.status(404).json({
          error: 'Budget not found'
        });
      }

      // Calculate percentage used
      const percentageUsed = (budget.currentSpent / budget.monthlyLimit) * 100;

      return res.status(200).json({
        success: true,
        budget: {
          userId: budget.userId,
          monthlyLimit: budget.monthlyLimit,
          currentSpent: budget.currentSpent,
          percentageUsed: percentageUsed.toFixed(2),
          remainingBudget: budget.monthlyLimit - budget.currentSpent,
          periodStart: budget.periodStart,
          periodEnd: budget.periodEnd,
          totalExecutions: budget.totalExecutions,
          successfulRuns: budget.successfulRuns,
          failedRuns: budget.failedRuns,
          alerts: {
            at80: budget.alertAt80,
            at90: budget.alertAt90,
            at100: budget.alertAt100
          }
        }
      });

    } catch (error: any) {
      console.error('[WorkflowController] Error getting budget:', error);
      return res.status(500).json({
        error: 'Failed to get budget information',
        details: error.message
      });
    }
  }

  /**
   * GET /api/admin/workflows/global-stats
   * Get global statistics for all users (admin only)
   */
  async getGlobalStats(req: Request, res: Response) {
    try {
      // TODO: Add admin authentication middleware

      const globalStats = await this.budgetService.getGlobalStats();

      return res.status(200).json({
        success: true,
        stats: globalStats
      });

    } catch (error: any) {
      console.error('[WorkflowController] Error getting global stats:', error);
      return res.status(500).json({
        error: 'Failed to get global statistics',
        details: error.message
      });
    }
  }

  /**
   * POST /api/workflows/execute-n8n
   * Execute a workflow directly via N8N API
   * This actually runs the workflow on N8N and tracks it in real-time
   */
  async executeN8NWorkflow(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Non authentifié' });
      }

      const { workflowName, inputData } = req.body;

      if (!workflowName) {
        return res.status(400).json({
          error: 'Missing required field: workflowName'
        });
      }

      // Check budget first
      const estimatedCost = 0.05; // Default estimate
      const budgetOk = await this.budgetService.checkBudget(userId, estimatedCost);
      if (!budgetOk) {
        return res.status(402).json({
          error: 'Insufficient budget',
          code: 'BUDGET_EXCEEDED'
        });
      }

      // Execute via N8N
      const result = await workflowExecutorService.executeWorkflow(
        userId,
        workflowName,
        inputData
      );

      return res.status(200).json({
        success: true,
        ...result
      });

    } catch (error: any) {
      console.error('[WorkflowController] Error executing N8N workflow:', error);
      return res.status(500).json({
        error: 'Failed to execute workflow on N8N',
        details: error.message
      });
    }
  }

  /**
   * GET /api/workflows/available
   * List all available workflows from N8N
   */
  async listAvailableWorkflows(req: Request, res: Response) {
    try {
      const workflows = await workflowExecutorService.listAvailableWorkflows();

      return res.status(200).json({
        success: true,
        workflows,
        count: workflows.length
      });

    } catch (error: any) {
      console.error('[WorkflowController] Error listing workflows:', error);
      return res.status(500).json({
        error: 'Failed to list available workflows',
        details: error.message
      });
    }
  }

  /**
   * GET /api/workflows/n8n/status
   * Test N8N connection status
   */
  async testN8NConnection(req: Request, res: Response) {
    try {
      const connected = await workflowExecutorService.testConnection();

      return res.status(200).json({
        success: true,
        connected,
        message: connected ? 'N8N is reachable' : 'N8N is not reachable'
      });

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        connected: false,
        error: error.message
      });
    }
  }
}

