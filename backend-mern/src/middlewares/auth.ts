import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { verifyApiKey } from '../utils/crypto';
import prisma from '../config/database';

// Extend Express Request pour inclure user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        isAdmin: boolean;
      };
      apiKey?: {
        id: string;
        name: string;
        userId: string;
        canRead: boolean;
        canWrite: boolean;
        canDelete: boolean;
      };
    }
  }
}

/**
 * Middleware d'authentification JWT (pour utilisateurs humains)
 */
export async function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware d'authentification API Key (pour N8N)
 */
export async function authenticateApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      res.status(401).json({ error: 'No API key provided' });
      return;
    }
    
    // Vérifier que la clé commence par le bon prefix
    if (!apiKey.startsWith('mbk_live_')) {
      res.status(401).json({ error: 'Invalid API key format' });
      return;
    }
    
    // Chercher la clé dans la DB
    const apiKeyRecord = await prisma.apiKey.findFirst({
      where: {
        prefix: 'mbk_live_',
        isActive: true,
      },
    });
    
    if (!apiKeyRecord) {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }
    
    // Vérifier le hash
    const isValid = verifyApiKey(apiKey, apiKeyRecord.key);
    
    if (!isValid) {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }
    
    // Vérifier l'expiration
    if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
      res.status(401).json({ error: 'API key has expired' });
      return;
    }
    
    // Mettre à jour lastUsedAt
    await prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { lastUsedAt: new Date() },
    });
    
    // Log d'audit
    await prisma.auditLog.create({
      data: {
        userId: apiKeyRecord.userId,
        action: 'API_KEY_USED',
        resource: 'ApiKey',
        resourceId: apiKeyRecord.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          apiKeyName: apiKeyRecord.name,
          endpoint: req.path,
          method: req.method,
        },
      },
    });
    
    req.apiKey = {
      id: apiKeyRecord.id,
      name: apiKeyRecord.name,
      userId: apiKeyRecord.userId,
      canRead: apiKeyRecord.canRead,
      canWrite: apiKeyRecord.canWrite,
      canDelete: apiKeyRecord.canDelete,
    };
    
    next();
  } catch (error) {
    console.error('API Key authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Middleware hybride: accepte JWT OU API Key
 */
export async function authenticateHybrid(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const hasJWT = req.headers.authorization?.startsWith('Bearer ');
  const hasApiKey = !!req.headers['x-api-key'];
  
  if (hasJWT) {
    return authenticateJWT(req, res, next);
  }
  
  if (hasApiKey) {
    return authenticateApiKey(req, res, next);
  }
  
  res.status(401).json({ error: 'No authentication provided' });
}

/**
 * Middleware pour vérifier les permissions admin
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user?.isAdmin) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

/**
 * Middleware pour vérifier les permissions d'écriture (API Key)
 */
export function requireWritePermission(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.user) {
    // Les utilisateurs JWT ont toujours accès en écriture
    return next();
  }
  
  if (req.apiKey && !req.apiKey.canWrite) {
    res.status(403).json({ error: 'Write permission required' });
    return;
  }
  
  next();
}

/**
 * Middleware pour vérifier les permissions de suppression (API Key)
 */
export function requireDeletePermission(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.user?.isAdmin) {
    // Les admins peuvent tout supprimer
    return next();
  }
  
  if (req.apiKey && !req.apiKey.canDelete) {
    res.status(403).json({ error: 'Delete permission required' });
    return;
  }
  
  next();
}
