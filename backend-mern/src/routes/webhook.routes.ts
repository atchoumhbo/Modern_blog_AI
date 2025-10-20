import { Router } from 'express';
import { webhookController } from '../controllers/webhook.controller';

const router = Router();

/**
 * @route   POST /api/webhooks/n8n/start
 * @desc    Notification de démarrage d'exécution N8N
 * @access  Public (mais validé par secret dans le body)
 * @body    { workflowId, workflowName, executionId, startedAt, userId?, inputData? }
 */
router.post('/n8n/start', webhookController.handleExecutionStart.bind(webhookController));

/**
 * @route   POST /api/webhooks/n8n/step
 * @desc    Mise à jour d'une étape du workflow
 * @access  Public (mais validé par secret)
 * @body    { executionId, stepName, status, startedAt?, completedAt?, output?, error?, metadata? }
 */
router.post('/n8n/step', webhookController.handleStepUpdate.bind(webhookController));

/**
 * @route   POST /api/webhooks/n8n/complete
 * @desc    Notification de fin d'exécution
 * @access  Public (mais validé par secret)
 * @body    { executionId, status, completedAt?, result?, error?, costs? }
 */
router.post('/n8n/complete', webhookController.handleExecutionComplete.bind(webhookController));

/**
 * @route   GET /api/webhooks/n8n/ping
 * @desc    Test de l'endpoint webhook
 * @access  Public
 */
router.get('/n8n/ping', webhookController.handlePing.bind(webhookController));

export default router;
