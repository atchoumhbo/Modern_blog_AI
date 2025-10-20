/**
 * Article Generator Service - Workflow complet
 * Reddit → OpenAI → Image → Article Publishing
 */

import prisma from '../config/database';
import axios from 'axios';

// Import du générateur d'images (CommonJS module)
const { imageGenerator } = require('../n8n');

interface GenerateArticleInput {
  subreddit?: string;
  topic?: string;
  userId: string;
}

interface WorkflowResult {
  executionId: string;
  status: 'completed' | 'failed';
  article?: {
    id: string;
    title: string;
    slug: string;
    url: string;
  };
  error?: string;
  duration: number;
  costs: {
    reddit: number;
    openai: number;
    image: number;
    total: number;
  };
}

export class ArticleGeneratorService {
  /**
   * Génère un article complet via le workflow local
   */
  static async generateArticle(input: GenerateArticleInput): Promise<WorkflowResult> {
    const startTime = Date.now();
    const costs = { reddit: 0, openai: 0, image: 0, total: 0 };

    // 1. Créer l'exécution en DB
    const execution = await prisma.workflowExecution.create({
      data: {
        userId: input.userId,
        workflowId: 'local-article-generator',
        workflowName: 'Article Generator (Local)',
        status: 'RUNNING',
        inputData: input as any, // Cast to JSON
      },
    });

    try {
      // ÉTAPE 1: Reddit Scraping
      await this.updateStep(execution.id, 'Reddit Scraping', 'RUNNING');
      const redditData = await this.scrapeReddit(input.subreddit || 'programming', input.topic);
      await this.updateStep(execution.id, 'Reddit Scraping', 'COMPLETED', { posts: redditData.posts.length });
      
      // ÉTAPE 2: Content Generation (OpenAI)
      await this.updateStep(execution.id, 'Content Generation', 'RUNNING');
      const article = await this.generateContent(redditData, input.topic);
      costs.openai = article.cost || 0;
      await this.updateStep(execution.id, 'Content Generation', 'COMPLETED', { title: article.title });

      // ÉTAPE 3: Image Generation
      await this.updateStep(execution.id, 'Image Generation', 'RUNNING');
      const imageUrl = await this.generateImage(article.title);
      costs.image = 0.02; // Stability AI coût fixe
      await this.updateStep(execution.id, 'Image Generation', 'COMPLETED', { url: imageUrl });

      // ÉTAPE 4: Article Publishing
      await this.updateStep(execution.id, 'Article Publishing', 'RUNNING');
      const publishedArticle = await this.publishArticle({
        ...article,
        coverImage: imageUrl,
        authorId: input.userId,
      });
      await this.updateStep(execution.id, 'Article Publishing', 'COMPLETED', { articleId: publishedArticle.id });

      // Finaliser
      costs.total = costs.reddit + costs.openai + costs.image;
      const duration = Math.floor((Date.now() - startTime) / 1000);

      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          duration,
          totalCost: costs.total,
          outputData: {
            articleId: publishedArticle.id,
            title: publishedArticle.title,
            slug: publishedArticle.slug,
          },
        },
      });

      return {
        executionId: execution.id,
        status: 'completed',
        article: {
          id: publishedArticle.id,
          title: publishedArticle.title,
          slug: publishedArticle.slug,
          url: `/articles/${publishedArticle.slug}`,
        },
        duration,
        costs,
      };
    } catch (error: any) {
      // Marquer comme failed
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
          completedAt: new Date(),
        },
      });

      return {
        executionId: execution.id,
        status: 'failed',
        error: error.message,
        duration: Math.floor((Date.now() - startTime) / 1000),
        costs,
      };
    }
  }

  /**
   * Met à jour une étape du workflow
   */
  private static async updateStep(
    executionId: string,
    stepName: string,
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED',
    output?: any
  ) {
    await prisma.workflowStep.upsert({
      where: {
        executionId_stepName: { executionId, stepName },
      },
      create: {
        executionId,
        stepName,
        stepOrder: this.getStepOrder(stepName),
        stepType: 'INTERNAL_SCRIPT',
        status,
        outputData: output,
      },
      update: {
        status,
        outputData: output,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
      },
    });
  }

  /**
   * Scrape Reddit pour récupérer du contenu
   */
  private static async scrapeReddit(subreddit: string, topic?: string) {
    // TODO: Implémenter avec Reddit API
    // Pour l'instant, données simulées
    return {
      posts: [
        {
          title: topic || 'Latest Tech News',
          content: 'Contenu simulé du Reddit post...',
          upvotes: 150,
          comments: 42,
        },
      ],
    };
  }

  /**
   * Génère le contenu avec OpenAI
   */
  private static async generateContent(redditData: any, topic?: string) {
    // TODO: Implémenter avec OpenAI API
    const title = topic || redditData.posts[0].title;
    
    return {
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      content: `# ${title}\n\nContenu généré via OpenAI...\n\n${redditData.posts[0].content}`,
      excerpt: 'Un article généré automatiquement à partir de Reddit et OpenAI',
      metaTitle: title,
      metaDescription: `Découvrez ${title}`,
      metaKeywords: topic,
      readingTime: 5,
      cost: 0.05, // Simulation coût OpenAI
    };
  }

  /**
   * Génère une image avec le générateur local
   */
  private static async generateImage(title: string): Promise<string> {
    try {
      const result = await imageGenerator.generate(title, {
        provider: 'stability',
        style: 'digital-art',
        width: 1024,
        height: 1024,
      });

      return result.url || '/images/default-cover.jpg';
    } catch (error) {
      console.error('Image generation failed:', error);
      return '/images/default-cover.jpg';
    }
  }

  /**
   * Publie l'article en base de données
   */
  private static async publishArticle(data: any) {
    return await prisma.article.create({
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt,
        coverImage: data.coverImage,
        authorId: data.authorId,
        isPublished: true,
        publishedAt: new Date(),
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        metaKeywords: data.metaKeywords,
      },
    });
  }

  /**
   * Ordre des étapes
   */
  private static getStepOrder(stepName: string): number {
    const order: Record<string, number> = {
      'Reddit Scraping': 1,
      'Content Generation': 2,
      'Image Generation': 3,
      'Article Publishing': 4,
    };
    return order[stepName] || 0;
  }

  /**
   * Récupère le statut d'une exécution
   */
  static async getExecutionStatus(executionId: string) {
    const execution = await prisma.workflowExecution.findUnique({
      where: { id: executionId },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
      },
    });

    if (!execution) {
      throw new Error('Execution not found');
    }

    return {
      id: execution.id,
      status: execution.status,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
      duration: execution.duration,
      cost: execution.totalCost,
      steps: execution.steps.map((step) => ({
        name: step.stepName,
        status: step.status,
        output: step.outputData,
        error: step.errorMessage,
      })),
      result: execution.outputData,
      error: execution.errorMessage,
    };
  }
}
