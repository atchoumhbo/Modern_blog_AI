import { Request, Response, NextFunction } from 'express';
import { ArticleGeneratorService } from '../services/article-generator.service';
import { AppError } from '../middlewares/error';

/**
 * Contrôleur pour la génération d'articles
 */
export class ArticleGeneratorController {
  /**
   * POST /api/articles/generate
   * Lance le workflow complet de génération d'article
   */
  static async generateArticle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { subreddit, topic } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      // Validation
      if (!topic && !subreddit) {
        throw new AppError('Provide either a topic or a subreddit', 400);
      }

      console.log(`🚀 [ArticleGenerator] Démarrage du workflow pour user ${userId}`);
      console.log(`   Topic: ${topic || 'auto'}`);
      console.log(`   Subreddit: ${subreddit || 'programming'}`);

      // Lancer le workflow
      const result = await ArticleGeneratorService.generateArticle({
        subreddit,
        topic,
        userId,
      });

      if (result.status === 'failed') {
        res.status(500).json({
          success: false,
          executionId: result.executionId,
          error: result.error,
          duration: result.duration,
        });
        return;
      }

      res.status(201).json({
        success: true,
        executionId: result.executionId,
        article: result.article,
        duration: result.duration,
        costs: result.costs,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/articles/generate/:executionId/status
   * Récupère le statut d'une exécution en cours
   */
  static async getExecutionStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { executionId } = req.params;

      const status = await ArticleGeneratorService.getExecutionStatus(executionId);

      res.json({
        success: true,
        execution: status,
      });
    } catch (error) {
      next(error);
    }
  }
}
