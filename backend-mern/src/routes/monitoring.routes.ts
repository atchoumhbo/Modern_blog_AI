import { Router } from 'express';
import { receiveMonitoringData, getMonitoringStats } from '../controllers/monitoring.controller';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

/**
 * POST /api/monitoring
 * Receive frontend monitoring data (errors, performance metrics)
 * Public endpoint - no auth required
 */
router.post('/', receiveMonitoringData);

/**
 * GET /api/monitoring/stats
 * Get monitoring statistics
 * Protected endpoint - admin only
 */
router.get('/stats', authenticateJWT, getMonitoringStats);

export default router;
