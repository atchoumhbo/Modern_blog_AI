import { Router } from 'express';
import { authenticateHybrid, requireWritePermission, requireDeletePermission } from '../middlewares/auth';
import {
  getCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categories.controller';

const router = Router();

// Public routes
router.get('/', getCategories);
router.get('/:id', getCategoryById);
router.get('/slug/:slug', getCategoryBySlug);

// Protected routes
router.post('/', authenticateHybrid, requireWritePermission, createCategory);

router.patch('/:id', authenticateHybrid, requireWritePermission, updateCategory);

router.delete('/:id', authenticateHybrid, requireDeletePermission, deleteCategory);

export default router;
