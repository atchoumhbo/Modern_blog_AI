import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all projects with pagination, filtering, and sorting
 */
export const getProjects = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      search = '',
      category = '',
      tag = '',
      status = '',
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    // Search in title and description
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
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

    // Filter by status
    if (status) {
      where.status = status as string;
    }

    // Build orderBy - only use direct fields from Project table
    const orderBy: any = {};
    const sortField = sort as string;
    const sortOrder = (order as string) as 'asc' | 'desc';

    // Only allow sorting by direct Project fields
    const allowedSortFields = ['createdAt', 'updatedAt', 'title', 'status'];
    if (allowedSortFields.includes(sortField)) {
      orderBy[sortField] = sortOrder;
    } else {
      // Default sort
      orderBy.createdAt = 'desc';
    }

    // Fetch projects with relations
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
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
          }
        }
      }),
      prisma.project.count({ where })
    ]);

    res.json({
      data: projects,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

/**
 * Get a single project by ID
 */
export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
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
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

/**
 * Get a single project by slug
 */
export const getProjectBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const project = await prisma.project.findUnique({
      where: { slug },
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
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

/**
 * Create a new project
 */
export const createProject = async (req: Request, res: Response) => {
  try {
    const {
      title,
      slug,
      description,
      content,
      coverImage,
      githubUrl,
      demoUrl,
      status,
      isPublished,
      publishedAt,
      categoryId,
      authorId,
      tagIds
    } = req.body;

    const project = await prisma.project.create({
      data: {
        title,
        slug,
        description,
        content,
        coverImage,
        githubUrl,
        demoUrl,
        status: status || 'IN_PROGRESS',
        isPublished: isPublished || false,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
        authorId: authorId || req.user?.userId, // From auth middleware
        categoryId,
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

    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

/**
 * Update a project
 */
export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      description,
      content,
      coverImage,
      githubUrl,
      demoUrl,
      status,
      isPublished,
      publishedAt,
      categoryId,
      tagIds
    } = req.body;

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        title,
        slug,
        description,
        content,
        coverImage,
        githubUrl,
        demoUrl,
        status,
        isPublished,
        publishedAt: publishedAt ? new Date(publishedAt) : undefined,
        categoryId,
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

    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

/**
 * Delete a project
 */
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await prisma.project.delete({
      where: { id }
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

