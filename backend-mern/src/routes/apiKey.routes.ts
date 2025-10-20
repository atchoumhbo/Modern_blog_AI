import { Router } from 'express';
import {
  createApiKey,
  listApiKeys,
  getApiKey,
  updateApiKey,
  deleteApiKey,
  getApiKeyLogs,
} from '../controllers/apiKey.controller';
import { authenticateJWT } from '../middlewares/auth';
import { validate, createApiKeySchema } from '../middlewares/validation';

const router = Router();

// Toutes les routes nécessitent une authentification JWT
router.use(authenticateJWT);

router.post('/', validate(createApiKeySchema), createApiKey);
router.get('/', listApiKeys);
router.get('/:id', getApiKey);
router.patch('/:id', updateApiKey);
router.delete('/:id', deleteApiKey);
router.get('/:id/logs', getApiKeyLogs);

export default router;
