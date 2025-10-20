import { Router } from 'express';
import { WorkflowController } from '../controllers/workflow.controller';

// ===========================
// WORKFLOW ROUTES
// ===========================
// Defines all REST endpoints for N8N workflow management

const router = Router();
const workflowController = new WorkflowController();

/**
 * POST /api/workflows/execute
 * Execute a new N8N workflow
 * 
 * Request Body:
 * {
 *   userId: string,
 *   workflowName: string,
 *   workflowType: 'reddit_scraper' | 'image_generator' | 'ai_assistant',
 *   inputData: any,
 *   estimatedCost?: number
 * }
 * 
 * Response: 201 Created
 * {
 *   success: true,
 *   execution: { id, status, workflowName, createdAt },
 *   message: string
 * }
 * 
 * Errors:
 * - 400: Missing required fields
 * - 402: Insufficient budget
 * - 500: Server error
 */
router.post('/execute', (req, res) => workflowController.executeWorkflow(req, res));

/**
 * GET /api/workflows/executions
 * List all workflow executions for a user
 * 
 * Query Parameters:
 * - userId: string (required)
 * - status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
 * - limit?: number (default: 50)
 * - offset?: number (default: 0)
 * 
 * Response: 200 OK
 * {
 *   success: true,
 *   executions: [...],
 *   pagination: { limit, offset, total }
 * }
 * 
 * Errors:
 * - 400: Missing userId
 * - 500: Server error
 */
router.get('/executions', (req, res) => workflowController.listExecutions(req, res));

/**
 * GET /api/workflows/executions/:id
 * Get detailed information about a specific execution
 * 
 * Path Parameters:
 * - id: string (execution ID)
 * 
 * Response: 200 OK
 * {
 *   success: true,
 *   execution: { id, userId, workflowName, status, steps, ... },
 *   recoveryData?: { completedSteps, failedStep, savings }
 * }
 * 
 * Errors:
 * - 404: Execution not found
 * - 500: Server error
 */
router.get('/executions/:id', (req, res) => workflowController.getExecution(req, res));

/**
 * POST /api/workflows/executions/:id/retry
 * Retry a failed execution with smart recovery
 * 
 * Path Parameters:
 * - id: string (original execution ID)
 * 
 * Request Body:
 * {
 *   userId: string
 * }
 * 
 * Response: 201 Created
 * {
 *   success: true,
 *   retry: { id, parentId, status, createdAt },
 *   savings: { cost, time, stepsSkipped },
 *   message: string
 * }
 * 
 * Errors:
 * - 400: Can only retry failed executions
 * - 402: Insufficient budget
 * - 404: Execution not found
 * - 500: Server error
 */
router.post('/executions/:id/retry', (req, res) => workflowController.retryExecution(req, res));

/**
 * GET /api/workflows/stats
 * Get workflow execution statistics for a user
 * 
 * Query Parameters:
 * - userId: string (required)
 * 
 * Response: 200 OK
 * {
 *   success: true,
 *   stats: {
 *     executions: { total, completed, failed, running, totalCost, avgDuration },
 *     savings: { totalCost, totalTime, totalSteps, totalRetries }
 *   }
 * }
 * 
 * Errors:
 * - 400: Missing userId
 * - 500: Server error
 */
router.get('/stats', (req, res) => workflowController.getStats(req, res));

/**
 * GET /api/users/budget
 * Get budget information for a user
 * 
 * Query Parameters:
 * - userId: string (required)
 * 
 * Response: 200 OK
 * {
 *   success: true,
 *   budget: {
 *     userId, monthlyLimit, currentSpent, percentageUsed,
 *     remainingBudget, periodStart, periodEnd,
 *     totalExecutions, successfulRuns, failedRuns,
 *     alerts: { at80, at90, at100 }
 *   }
 * }
 * 
 * Errors:
 * - 400: Missing userId
 * - 404: Budget not found
 * - 500: Server error
 */
router.get('/budget', (req, res) => workflowController.getBudget(req, res));

/**
 * GET /api/admin/workflows/global-stats
 * Get global statistics for all users (admin only)
 * 
 * Response: 200 OK
 * {
 *   success: true,
 *   stats: {
 *     totalUsers, totalSpent, totalLimit,
 *     totalExecutions, successfulRuns, failedRuns,
 *     successRate, usersOverBudget, usersNear80
 *   }
 * }
 * 
 * Errors:
 * - 500: Server error
 * 
 * TODO: Add admin authentication middleware
 */
router.get('/admin/global-stats', (req, res) => workflowController.getGlobalStats(req, res));

/**
 * POST /api/workflows/execute-n8n
 * Execute a workflow directly via N8N API (real execution)
 * 
 * Request Body:
 * {
 *   workflowName: string (ex: "Reddit Tech Analysis"),
 *   inputData?: any
 * }
 * 
 * Response: 200 OK
 * {
 *   success: true,
 *   executionId: string,
 *   status: 'PENDING',
 *   workflowName: string,
 *   message: 'Workflow started successfully'
 * }
 */
router.post('/execute-n8n', (req, res) => workflowController.executeN8NWorkflow(req, res));

/**
 * GET /api/workflows/available
 * List all available workflows from N8N instance
 * 
 * Response: 200 OK
 * {
 *   success: true,
 *   workflows: [{ id, name, active, tags, nodes }],
 *   count: number
 * }
 */
router.get('/available', (req, res) => workflowController.listAvailableWorkflows(req, res));

/**
 * GET /api/workflows/n8n/status
 * Test N8N connection status
 * 
 * Response: 200 OK
 * {
 *   success: true,
 *   connected: boolean,
 *   message: string
 * }
 */
router.get('/n8n/status', (req, res) => workflowController.testN8NConnection(req, res));

export default router;
