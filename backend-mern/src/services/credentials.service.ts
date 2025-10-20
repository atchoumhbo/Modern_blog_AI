import { PrismaClient, CredentialService as CredentialServiceType } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Clé de chiffrement (DOIT être en variable d'environnement en production !)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key!!'; // 32 caractères pour AES-256
const ALGORITHM = 'aes-256-cbc';

/**
 * Service de gestion sécurisée des credentials
 * Chiffrement AES-256-CBC pour protéger les API keys
 */
export class CredentialsService {
  /**
   * Chiffre les données sensibles
   */
  private encrypt(text: string): { encrypted: string; iv: string } {
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32));
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex')
    };
  }

  /**
   * Déchiffre les données
   */
  private decrypt(encryptedData: string, ivHex: string): string {
    const iv = Buffer.from(ivHex, 'hex');
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32));
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Crée ou met à jour un credential
   */
  async upsertCredential(
    userId: string,
    service: CredentialServiceType,
    name: string,
    credentialData: Record<string, any>,
    options?: {
      description?: string;
      expiresAt?: Date;
    }
  ) {
    // Chiffrer les données
    const dataString = JSON.stringify(credentialData);
    const { encrypted, iv } = this.encrypt(dataString);

    // Upsert en DB
    const credential = await prisma.userCredential.upsert({
      where: {
        userId_service: {
          userId,
          service
        }
      },
      update: {
        name,
        description: options?.description,
        encryptedData: encrypted,
        iv,
        expiresAt: options?.expiresAt,
        updatedAt: new Date()
      },
      create: {
        userId,
        service,
        name,
        description: options?.description,
        encryptedData: encrypted,
        iv,
        expiresAt: options?.expiresAt,
        isActive: true
      }
    });

    return {
      id: credential.id,
      service: credential.service,
      name: credential.name,
      description: credential.description,
      isActive: credential.isActive,
      expiresAt: credential.expiresAt,
      createdAt: credential.createdAt,
      updatedAt: credential.updatedAt
      // NE JAMAIS retourner encryptedData ou iv !
    };
  }

  /**
   * Récupère un credential déchiffré (usage interne uniquement)
   */
  async getDecryptedCredential(
    userId: string,
    service: CredentialServiceType
  ): Promise<Record<string, any> | null> {
    const credential = await prisma.userCredential.findUnique({
      where: {
        userId_service: {
          userId,
          service
        }
      }
    });

    if (!credential || !credential.isActive) {
      return null;
    }

    // Vérifier expiration
    if (credential.expiresAt && credential.expiresAt < new Date()) {
      return null;
    }

    // Déchiffrer
    const decrypted = this.decrypt(credential.encryptedData, credential.iv);
    
    // Mettre à jour lastUsedAt
    await prisma.userCredential.update({
      where: { id: credential.id },
      data: { lastUsedAt: new Date() }
    });

    return JSON.parse(decrypted);
  }

  /**
   * Liste tous les credentials d'un user (sans les données sensibles)
   */
  async listUserCredentials(userId: string) {
    const credentials = await prisma.userCredential.findMany({
      where: { userId },
      select: {
        id: true,
        service: true,
        name: true,
        description: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true
        // PAS encryptedData ni iv !
      },
      orderBy: {
        service: 'asc'
      }
    });

    return credentials;
  }

  /**
   * Récupère un credential spécifique (sans données sensibles)
   */
  async getCredential(userId: string, service: CredentialServiceType) {
    const credential = await prisma.userCredential.findUnique({
      where: {
        userId_service: {
          userId,
          service
        }
      },
      select: {
        id: true,
        service: true,
        name: true,
        description: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return credential;
  }

  /**
   * Active/Désactive un credential
   */
  async toggleCredential(userId: string, service: CredentialServiceType, isActive: boolean) {
    const credential = await prisma.userCredential.update({
      where: {
        userId_service: {
          userId,
          service
        }
      },
      data: {
        isActive,
        updatedAt: new Date()
      }
    });

    return {
      id: credential.id,
      service: credential.service,
      isActive: credential.isActive
    };
  }

  /**
   * Supprime un credential
   */
  async deleteCredential(userId: string, service: CredentialServiceType) {
    await prisma.userCredential.delete({
      where: {
        userId_service: {
          userId,
          service
        }
      }
    });

    return { success: true };
  }

  /**
   * Valide les credentials Reddit
   */
  validateRedditCredentials(data: any): boolean {
    return (
      typeof data.clientId === 'string' &&
      data.clientId.length > 0 &&
      typeof data.clientSecret === 'string' &&
      data.clientSecret.length > 0
    );
  }

  /**
   * Valide les credentials OpenAI
   */
  validateOpenAICredentials(data: any): boolean {
    return (
      typeof data.apiKey === 'string' &&
      data.apiKey.startsWith('sk-') &&
      data.apiKey.length > 20
    );
  }

  /**
   * Valide les credentials Stability AI
   */
  validateStabilityAICredentials(data: any): boolean {
    return (
      typeof data.apiKey === 'string' &&
      data.apiKey.startsWith('sk-') &&
      data.apiKey.length > 20
    );
  }

  /**
   * Valide selon le type de service
   */
  validateCredentials(service: CredentialServiceType, data: any): boolean {
    switch (service) {
      case 'REDDIT':
        return this.validateRedditCredentials(data);
      case 'OPENAI':
        return this.validateOpenAICredentials(data);
      case 'STABILITY_AI':
        return this.validateStabilityAICredentials(data);
      case 'N8N':
        return typeof data.apiKey === 'string' && data.apiKey.length > 0;
      default:
        // Pour CUSTOM et autres, on accepte tout objet non vide
        return typeof data === 'object' && Object.keys(data).length > 0;
    }
  }
}

export const credentialsService = new CredentialsService();
