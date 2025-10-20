import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  getMe,
  changePassword,
} from '../controllers/auth.controller';
import { authenticateJWT, requireAdmin } from '../middlewares/auth';
import { validate, registerSchema, loginSchema } from '../middlewares/validation';
import { authRateLimiter } from '../config/security';

const router = Router();

// Public routes (avec rate limiting strict)
router.post('/register', authRateLimiter, validate(registerSchema), register);
router.post('/login', authRateLimiter, validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Protected routes (nécessite JWT)
router.get('/me', authenticateJWT, getMe);
router.post('/change-password', authenticateJWT, changePassword);

export default router;
