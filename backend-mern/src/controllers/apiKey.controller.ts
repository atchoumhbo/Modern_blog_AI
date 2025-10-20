import { Request, Response } from 'express';
import prisma from '../config/database';
import { generateApiKey } from '../utils/crypto';
import { asyncHandler, AppError } from '../middlewares/error';

/**
 * Create new API Key (Admin only)
 * POST /api/api-keys
 */
export const createApiKey = asyncHandler(async (req: Request, res: Response) => {
  const { name, expiresInDays, canRead = true, canWrite = false, canDelete = false, rateLimit } = req.body;
  
  // Générer l'API Key
  const { key, prefix, hash } = generateApiKey();
  
  // Calculer la date d'expiration
  const expiresAt = expiresInDays 
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null;
  
  // Créer l'API Key en DB
  const apiKey = await prisma.apiKey.create({
    data: {
      name,
      key: hash, // Stocker le hash, pas la clé en clair
      prefix,
      userId: req.user!.userId,
      canRead,
      canWrite,
      canDelete,
      expiresAt,
      rateLimit,
    },
    select: {
      id: true,
      name: true,
      prefix: true,
      canRead: true,
      canWrite: true,
      canDelete: true,
      expiresAt: true,
      rateLimit: true,
      createdAt: true,
    },
  });
  
  // Log d'audit
  await prisma.auditLog.create({
    data: {
      userId: req.user!.userId,
      action: 'CREATE',
      resource: 'ApiKey',
      resourceId: apiKey.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { apiKeyName: name },
    },
  });
  
  // IMPORTANT: La clé complète n'est retournée qu'une seule fois
  res.status(201).json({
    ...apiKey,
    key, // Clé en clair - à sauvegarder immédiatement
    message: 'IMPORTANT: Save this API key now. You will not be able to see it again.',
  });
});

/**
 * List all API Keys for current user
 * GET /api/api-keys
 */
export const listApiKeys = asyncHandler(async (req: Request, res: Response) => {
  const apiKeys = await prisma.apiKey.findMany({
    where: {
      userId: req.user!.userId,
    },
    select: {
      id: true,
      name: true,
      prefix: true,
      isActive: true,
      canRead: true,
      canWrite: true,
      canDelete: true,
      lastUsedAt: true,
      expiresAt: true,
      rateLimit: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  
  res.json({ data: apiKeys, count: apiKeys.length });
});

/**
 * Get API Key by ID
 * GET /api/api-keys/:id
 */
export const getApiKey = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const apiKey = await prisma.apiKey.findFirst({
    where: {
      id,
      userId: req.user!.userId,
    },
    select: {
      id: true,
      name: true,
      prefix: true,
      isActive: true,
      canRead: true,
      canWrite: true,
      canDelete: true,
      lastUsedAt: true,
      expiresAt: true,
      rateLimit: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  
  if (!apiKey) {
    throw new AppError('API Key not found', 404);
  }
  
  res.json(apiKey);
});

/**
 * Update API Key
 * PATCH /api/api-keys/:id
 */
export const updateApiKey = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, isActive, canRead, canWrite, canDelete, rateLimit } = req.body;
  
  // Vérifier que l'API Key appartient à l'utilisateur
  const existingKey = await prisma.apiKey.findFirst({
    where: {
      id,
      userId: req.user!.userId,
    },
  });
  
  if (!existingKey) {
    throw new AppError('API Key not found', 404);
  }
  
  // Mettre à jour
  const apiKey = await prisma.apiKey.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(typeof isActive === 'boolean' && { isActive }),
      ...(typeof canRead === 'boolean' && { canRead }),
      ...(typeof canWrite === 'boolean' && { canWrite }),
      ...(typeof canDelete === 'boolean' && { canDelete }),
      ...(rateLimit && { rateLimit }),
    },
    select: {
      id: true,
      name: true,
      prefix: true,
      isActive: true,
      canRead: true,
      canWrite: true,
      canDelete: true,
      expiresAt: true,
      rateLimit: true,
      updatedAt: true,
    },
  });
  
  // Log d'audit
  await prisma.auditLog.create({
    data: {
      userId: req.user!.userId,
      action: 'UPDATE',
      resource: 'ApiKey',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });
  
  res.json(apiKey);
});

/**
 * Delete API Key
 * DELETE /api/api-keys/:id
 */
export const deleteApiKey = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Vérifier que l'API Key appartient à l'utilisateur
  const existingKey = await prisma.apiKey.findFirst({
    where: {
      id,
      userId: req.user!.userId,
    },
  });
  
  if (!existingKey) {
    throw new AppError('API Key not found', 404);
  }
  
  // Supprimer
  await prisma.apiKey.delete({
    where: { id },
  });
  
  // Log d'audit
  await prisma.auditLog.create({
    data: {
      userId: req.user!.userId,
      action: 'DELETE',
      resource: 'ApiKey',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { apiKeyName: existingKey.name },
    },
  });
  
  res.json({ message: 'API Key deleted successfully' });
});

/**
 * Get API Key usage logs
 * GET /api/api-keys/:id/logs
 */
export const getApiKeyLogs = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  
  // Vérifier que l'API Key appartient à l'utilisateur
  const existingKey = await prisma.apiKey.findFirst({
    where: {
      id,
      userId: req.user!.userId,
    },
  });
  
  if (!existingKey) {
    throw new AppError('API Key not found', 404);
  }
  
  // Récupérer les logs
  const logs = await prisma.auditLog.findMany({
    where: {
      metadata: {
        path: ['apiKeyName'],
        equals: existingKey.name,
      },
    },
    select: {
      id: true,
      action: true,
      resource: true,
      ipAddress: true,
      userAgent: true,
      metadata: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });
  
  const total = await prisma.auditLog.count({
    where: {
      metadata: {
        path: ['apiKeyName'],
        equals: existingKey.name,
      },
    },
  });
  
  res.json({
    data: logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});
