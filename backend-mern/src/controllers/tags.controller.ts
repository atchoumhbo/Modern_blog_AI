import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all tags with pagination
 */
export const getTags = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '100',
      search = '',
      sort = 'name',
      order = 'asc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Build orderBy
    const orderBy: any = {};
    orderBy[sort as string] = order as string;

    const [tags, total] = await Promise.all([
      prisma.tag.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          _count: {
            select: {
              articles: true,
              projects: true
            }
          }
        }
      }),
      prisma.tag.count({ where })
    ]);

    res.json({
      data: tags,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
};

/**
 * Get a single tag by ID
 */
export const getTagById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            articles: true,
            projects: true
          }
        }
      }
    });

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json(tag);
  } catch (error) {
    console.error('Error fetching tag:', error);
    res.status(500).json({ error: 'Failed to fetch tag' });
  }
};

/**
 * Get a single tag by slug
 */
export const getTagBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const tag = await prisma.tag.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            articles: true,
            projects: true
          }
        }
      }
    });

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json(tag);
  } catch (error) {
    console.error('Error fetching tag:', error);
    res.status(500).json({ error: 'Failed to fetch tag' });
  }
};

/**
 * Create a new tag
 */
export const createTag = async (req: Request, res: Response) => {
  try {
    const { name, slug } = req.body;

    const tag = await prisma.tag.create({
      data: {
        name,
        slug
      }
    });

    res.status(201).json(tag);
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
};

/**
 * Update a tag
 */
export const updateTag = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug } = req.body;

    const existingTag = await prisma.tag.findUnique({
      where: { id }
    });

    if (!existingTag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: {
        name,
        slug,
        updatedAt: new Date()
      }
    });

    res.json(tag);
  } catch (error) {
    console.error('Error updating tag:', error);
    res.status(500).json({ error: 'Failed to update tag' });
  }
};

/**
 * Delete a tag
 */
export const deleteTag = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingTag = await prisma.tag.findUnique({
      where: { id }
    });

    if (!existingTag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    await prisma.tag.delete({
      where: { id }
    });

    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
};
