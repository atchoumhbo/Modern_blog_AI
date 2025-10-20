import { Request, Response } from 'express';
import { credentialsService } from '../services/credentials.service';
import { CredentialService } from '@prisma/client';

/**
 * Controller pour la gestion sécurisée des credentials (API Keys)
 */
export class CredentialsController {
  /**
   * POST /api/credentials
   * Crée ou met à jour un credential
   */
  async upsertCredential(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Non authentifié' });
      }

      const { service, name, credentialData, description, expiresAt } = req.body;

      // Validation
      if (!service || !name || !credentialData) {
        return res.status(400).json({
          error: 'Champs requis: service, name, credentialData'
        });
      }

      // Vérifier que le service est valide
      if (!Object.values(CredentialService).includes(service)) {
        return res.status(400).json({
          error: `Service invalide. Valeurs possibles: ${Object.values(CredentialService).join(', ')}`
        });
      }

      // Valider le format des credentials selon le service
      const isValid = credentialsService.validateCredentials(service, credentialData);
      if (!isValid) {
        return res.status(400).json({
          error: `Format de credentials invalide pour le service ${service}`
        });
      }

      // Créer/Mettre à jour
      const credential = await credentialsService.upsertCredential(
        userId,
        service,
        name,
        credentialData,
        {
          description,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined
        }
      );

      res.status(200).json({
        success: true,
        credential
      });
    } catch (error: any) {
      console.error('Error upserting credential:', error);
      res.status(500).json({
        error: 'Erreur lors de la sauvegarde du credential',
        details: error.message
      });
    }
  }

  /**
   * GET /api/credentials
   * Liste tous les credentials de l'utilisateur (sans données sensibles)
   */
  async listCredentials(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Non authentifié' });
      }

      const credentials = await credentialsService.listUserCredentials(userId);

      res.status(200).json({
        success: true,
        credentials,
        count: credentials.length
      });
    } catch (error: any) {
      console.error('Error listing credentials:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération des credentials',
        details: error.message
      });
    }
  }

  /**
   * GET /api/credentials/:service
   * Récupère un credential spécifique (sans données sensibles)
   */
  async getCredential(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Non authentifié' });
      }

      const { service } = req.params;

      // Vérifier que le service est valide
      if (!Object.values(CredentialService).includes(service as CredentialService)) {
        return res.status(400).json({
          error: `Service invalide: ${service}`
        });
      }

      const credential = await credentialsService.getCredential(
        userId,
        service as CredentialService
      );

      if (!credential) {
        return res.status(404).json({
          error: `Aucun credential trouvé pour le service ${service}`
        });
      }

      res.status(200).json({
        success: true,
        credential
      });
    } catch (error: any) {
      console.error('Error getting credential:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération du credential',
        details: error.message
      });
    }
  }

  /**
   * PATCH /api/credentials/:service/toggle
   * Active/Désactive un credential
   */
  async toggleCredential(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Non authentifié' });
      }

      const { service } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          error: 'Champ requis: isActive (boolean)'
        });
      }

      const credential = await credentialsService.toggleCredential(
        userId,
        service as CredentialService,
        isActive
      );

      res.status(200).json({
        success: true,
        credential
      });
    } catch (error: any) {
      console.error('Error toggling credential:', error);
      res.status(500).json({
        error: 'Erreur lors de la modification du credential',
        details: error.message
      });
    }
  }

  /**
   * DELETE /api/credentials/:service
   * Supprime un credential
   */
  async deleteCredential(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Non authentifié' });
      }

      const { service } = req.params;

      await credentialsService.deleteCredential(
        userId,
        service as CredentialService
      );

      res.status(200).json({
        success: true,
        message: `Credential ${service} supprimé avec succès`
      });
    } catch (error: any) {
      console.error('Error deleting credential:', error);
      res.status(500).json({
        error: 'Erreur lors de la suppression du credential',
        details: error.message
      });
    }
  }

  /**
   * GET /api/credentials/services
   * Liste les services disponibles
   */
  async listServices(req: Request, res: Response) {
    try {
      const services = Object.values(CredentialService).map(service => ({
        value: service,
        label: service.replace(/_/g, ' '),
        description: this.getServiceDescription(service)
      }));

      res.status(200).json({
        success: true,
        services
      });
    } catch (error: any) {
      console.error('Error listing services:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération des services',
        details: error.message
      });
    }
  }

  /**
   * Retourne la description d'un service
   */
  private getServiceDescription(service: string): string {
    const descriptions: Record<string, string> = {
      REDDIT: 'Reddit API pour récupérer les posts (Client ID, Client Secret)',
      OPENAI: 'OpenAI GPT pour génération de texte (API Key)',
      STABILITY_AI: 'Stability AI pour génération d\'images (API Key)',
      ANTHROPIC: 'Anthropic Claude pour chat avancé (API Key)',
      WEBHOOK: 'Webhook générique pour intégrations (URL, Headers)',
      N8N: 'N8N pour orchestration de workflows (API Key, Base URL)',
      CUSTOM: 'Service personnalisé avec credentials custom'
    };
    return descriptions[service] || 'Service externe';
  }

  /**
   * GET /api/credentials/:service/schema
   * Retourne le schéma JSON des champs requis pour un service
   */
  async getCredentialSchema(req: Request, res: Response) {
    try {
      const { service } = req.params;

      const schemas: Record<string, any> = {
        REDDIT: {
          fields: [
            { name: 'clientId', label: 'Client ID', type: 'text', required: true },
            { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
            { name: 'refreshToken', label: 'Refresh Token (optionnel)', type: 'text', required: false }
          ]
        },
        OPENAI: {
          fields: [
            { name: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'sk-...' },
            { name: 'organization', label: 'Organization ID (optionnel)', type: 'text', required: false }
          ]
        },
        STABILITY_AI: {
          fields: [
            { name: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'sk-...' }
          ]
        },
        ANTHROPIC: {
          fields: [
            { name: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'sk-ant-...' }
          ]
        },
        N8N: {
          fields: [
            { name: 'apiKey', label: 'API Key', type: 'password', required: true },
            { name: 'baseUrl', label: 'Base URL', type: 'url', required: true, placeholder: 'https://n8n.example.com' }
          ]
        },
        WEBHOOK: {
          fields: [
            { name: 'url', label: 'Webhook URL', type: 'url', required: true },
            { name: 'method', label: 'HTTP Method', type: 'select', options: ['GET', 'POST', 'PUT', 'PATCH'], required: true },
            { name: 'headers', label: 'Headers (JSON)', type: 'textarea', required: false },
            { name: 'authType', label: 'Auth Type', type: 'select', options: ['none', 'bearer', 'basic'], required: false }
          ]
        },
        CUSTOM: {
          fields: [
            { name: 'data', label: 'Données JSON', type: 'textarea', required: true }
          ]
        }
      };

      const schema = schemas[service];
      if (!schema) {
        return res.status(404).json({
          error: `Schéma non trouvé pour le service ${service}`
        });
      }

      res.status(200).json({
        success: true,
        service,
        schema
      });
    } catch (error: any) {
      console.error('Error getting credential schema:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération du schéma',
        details: error.message
      });
    }
  }
}

export const credentialsController = new CredentialsController();

