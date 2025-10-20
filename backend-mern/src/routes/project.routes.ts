import { Router } from 'express';
import { authenticateHybrid, requireWritePermission, requireDeletePermission } from '../middlewares/auth';
import {
  getProjects,
  getProjectById,
  getProjectBySlug,
  createProject,
  updateProject,
  deleteProject
} from '../controllers/projects.controller';

const router = Router();

// Public routes
router.get('/', getProjects);
router.get('/slug/:slug', getProjectBySlug);
router.get('/:id', getProjectById);

// Protected routes
router.post('/', authenticateHybrid, requireWritePermission, createProject);

router.patch('/:id', authenticateHybrid, requireWritePermission, updateProject);

router.delete('/:id', authenticateHybrid, requireDeletePermission, deleteProject);

export default router;
