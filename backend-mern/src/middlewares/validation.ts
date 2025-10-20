import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de validation Zod
 */
export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}

// ============================================
// VALIDATION SCHEMAS
// ============================================

// Auth Schemas
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    username: z.string().min(3, 'Username must be at least 3 characters').max(30),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

// Article Schemas
export const createArticleSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200),
    slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
    excerpt: z.string().max(500).optional(),
    content: z.string().min(1, 'Content is required'),
    coverImage: z.string().url().optional(),
    categoryId: z.string().uuid().optional(),
    tagIds: z.array(z.string().uuid()).optional(),
    isPublished: z.boolean().optional(),
    metaTitle: z.string().max(60).optional(),
    metaDescription: z.string().max(160).optional(),
    metaKeywords: z.string().optional(),
  }),
});

export const updateArticleSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid article ID'),
  }),
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
    excerpt: z.string().max(500).optional(),
    content: z.string().optional(),
    coverImage: z.string().url().optional(),
    categoryId: z.string().uuid().optional().nullable(),
    tagIds: z.array(z.string().uuid()).optional(),
    isPublished: z.boolean().optional(),
    metaTitle: z.string().max(60).optional(),
    metaDescription: z.string().max(160).optional(),
    metaKeywords: z.string().optional(),
  }),
});

// Project Schemas
export const createProjectSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200),
    slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
    description: z.string().max(500).optional(),
    content: z.string().optional(),
    coverImage: z.string().url().optional(),
    githubUrl: z.string().url().optional(),
    demoUrl: z.string().url().optional(),
    status: z.enum(['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED']).optional(),
    categoryId: z.string().uuid().optional(),
    tagIds: z.array(z.string().uuid()).optional(),
    isPublished: z.boolean().optional(),
    metaTitle: z.string().max(60).optional(),
    metaDescription: z.string().max(160).optional(),
  }),
});

export const updateProjectSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid project ID'),
  }),
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
    description: z.string().max(500).optional(),
    content: z.string().optional(),
    coverImage: z.string().url().optional(),
    githubUrl: z.string().url().optional(),
    demoUrl: z.string().url().optional(),
    status: z.enum(['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED']).optional(),
    categoryId: z.string().uuid().optional().nullable(),
    tagIds: z.array(z.string().uuid()).optional(),
    isPublished: z.boolean().optional(),
    metaTitle: z.string().max(60).optional(),
    metaDescription: z.string().max(160).optional(),
  }),
});

// Category Schema
export const categorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(50),
    slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
    description: z.string().max(500).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  }),
});

// Tag Schema
export const tagSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(30),
    slug: z.string().min(1).max(30).regex(/^[a-z0-9-]+$/),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  }),
});

// API Key Schema
export const createApiKeySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    expiresInDays: z.number().int().positive().optional(),
    canRead: z.boolean().optional(),
    canWrite: z.boolean().optional(),
    canDelete: z.boolean().optional(),
    rateLimit: z.number().int().positive().optional(),
  }),
});

// Query Schemas (pagination, filtering)
export const paginationSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
    search: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    tagId: z.string().uuid().optional(),
    isPublished: z.string().transform(val => val === 'true').optional(),
  }),
});
