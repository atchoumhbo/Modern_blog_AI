import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all articles with pagination, filtering, and sorting
 */
export const getArticles = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      search = '',
      category = '',
      tag = '',
      status = '',
      sort = 'publishedAt',
      order = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    // Search in title and excerpt
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { excerpt: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Filter by category
    if (category) {
      where.categoryId = category as string;
    }

    // Filter by tag
    if (tag) {
      where.tags = {
        some: {
          id: tag as string
        }
      };
    }

    // Filter by publish status
    if (status === 'published') {
      where.isPublished = true;
    } else if (status === 'draft') {
      where.isPublished = false;
    }

    // Build orderBy - only use direct fields from Article table
    const orderBy: any = {};
    const sortField = sort as string;
    const sortOrder = (order as string) as 'asc' | 'desc';

    // Only allow sorting by direct Article fields to avoid Prisma errors
    const allowedSortFields = ['publishedAt', 'createdAt', 'updatedAt', 'title', 'views'];
    if (allowedSortFields.includes(sortField)) {
      orderBy[sortField] = sortOrder;
    } else {
      // Default sort
      orderBy.publishedAt = 'desc';
    }

    // Fetch articles with relations
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          tags: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          author: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        }
      }),
      prisma.article.count({ where })
    ]);

    res.json({
      data: articles,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
};

/**
 * Get a single article by ID
 */
export const getArticleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            
          }
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true,
            
          }
        }
      }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Increment view count
    await prisma.article.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });

    res.json(article);
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
};

/**
 * Get a single article by slug
 */
export const getArticleBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const article = await prisma.article.findUnique({
      where: { slug },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            
          }
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true,
            
          }
        }
      }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Increment view count
    await prisma.article.update({
      where: { slug },
      data: { viewCount: { increment: 1 } }
    });

    res.json(article);
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
};

/**
 * Create a new article
 */
export const createArticle = async (req: Request, res: Response) => {
  try {
    const {
      title,
      slug,
      excerpt,
      content,
      coverImage,
      isPublished,
      publishedAt,
      categoryId,
      tagIds,
      metaTitle,
      metaDescription,
      metaKeywords,
      authorId
    } = req.body;

    const article = await prisma.article.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        coverImage,
        isPublished: isPublished || false,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
        authorId: authorId || req.user?.userId, // From auth middleware
        categoryId,
        metaTitle,
        metaDescription,
        metaKeywords,
        tags: tagIds ? {
          connect: tagIds.map((id: string) => ({ id }))
        } : undefined
      },
      include: {
        category: true,
        tags: true,
        author: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.status(201).json(article);
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ error: 'Failed to create article' });
  }
};

/**
 * Update an article
 */
export const updateArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      excerpt,
      content,
      coverImage,
      isPublished,
      publishedAt,
      categoryId,
      tagIds,
      metaTitle,
      metaDescription,
      metaKeywords
    } = req.body;

    // Check if article exists
    const existingArticle = await prisma.article.findUnique({
      where: { id }
    });

    if (!existingArticle) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const article = await prisma.article.update({
      where: { id },
      data: {
        title,
        slug,
        excerpt,
        content,
        coverImage,
        isPublished,
        publishedAt: publishedAt ? new Date(publishedAt) : undefined,
        categoryId,
        metaTitle,
        metaDescription,
        metaKeywords,
        tags: tagIds ? {
          set: tagIds.map((id: string) => ({ id }))
        } : undefined,
        updatedAt: new Date()
      },
      include: {
        category: true,
        tags: true,
        author: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json(article);
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({ error: 'Failed to update article' });
  }
};

/**
 * Delete an article
 */
export const deleteArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if article exists
    const existingArticle = await prisma.article.findUnique({
      where: { id }
    });

    if (!existingArticle) {
      return res.status(404).json({ error: 'Article not found' });
    }

    await prisma.article.delete({
      where: { id }
    });

    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({ error: 'Failed to delete article' });
  }
};
