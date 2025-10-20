import { Router } from 'express';
import { authenticateHybrid, requireWritePermission, requireDeletePermission } from '../middlewares/auth';
import {
  getTags,
  getTagById,
  getTagBySlug,
  createTag,
  updateTag,
  deleteTag
} from '../controllers/tags.controller';

const router = Router();

// Public routes
router.get('/', getTags);
router.get('/:id', getTagById);
router.get('/slug/:slug', getTagBySlug);

// Protected routes
router.post('/', authenticateHybrid, requireWritePermission, createTag);

router.patch('/:id', authenticateHybrid, requireWritePermission, updateTag);

router.delete('/:id', authenticateHybrid, requireDeletePermission, deleteTag);

export default router;
