import { Router } from 'express';
import { authenticateHybrid, authenticateJWT, requireWritePermission, requireDeletePermission } from '../middlewares/auth';
import { validate, createArticleSchema, updateArticleSchema, paginationSchema } from '../middlewares/validation';
import {
  getArticles,
  getArticleById,
  getArticleBySlug,
  createArticle,
  updateArticle,
  deleteArticle
} from '../controllers/articles.controller';
import { ArticleGeneratorController } from '../controllers/article-generator.controller';

const router = Router();

// Article Generation Workflow (JWT required)
router.post('/generate', authenticateJWT, ArticleGeneratorController.generateArticle);
router.get('/generate/:executionId/status', authenticateJWT, ArticleGeneratorController.getExecutionStatus);

// Public routes (GET - lecture seule)
router.get('/', getArticles);
router.get('/:id', getArticleById);
router.get('/slug/:slug', getArticleBySlug);

// Protected routes (require JWT or API Key)
router.post('/', authenticateHybrid, requireWritePermission, createArticle);

router.patch('/:id', authenticateHybrid, requireWritePermission, updateArticle);

router.delete('/:id', authenticateHybrid, requireDeletePermission, deleteArticle);

export default router;
