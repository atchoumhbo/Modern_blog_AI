/**
 * Route API pour recevoir les webhooks N8N
 * Endpoint: POST /api/webhooks/n8n
 */

import type { ActionFunction } from 'react-router';
import { json } from 'react-router';
import { n8nInboundService } from '../../lib/n8n-inbound';
import type { N8NWebhookPayload } from '../../lib/n8n-inbound';

// Clé secrète pour valider les webhooks N8N
const WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET || 'your-webhook-secret';

/**
 * Action pour traiter les webhooks POST de N8N
 */
export const action: ActionFunction = async ({ request }) => {
  // Vérification de la méthode HTTP
  if (request.method !== 'POST') {
    return json({ error: 'Méthode non autorisée' }, { status: 405 });
  }

  try {
    // Validation de l'authentification
    const authHeader = request.headers.get('authorization');
    const webhookSecret = request.headers.get('x-webhook-secret');
    
    if (webhookSecret !== WEBHOOK_SECRET && !authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Lecture du payload
    const payload: N8NWebhookPayload = await request.json();
    
    console.log('🎣 Webhook N8N reçu:', {
      type: payload.type,
      action: payload.action,
      timestamp: new Date().toISOString(),
      metadata: payload.metadata
    });

    // Traitement du webhook
    const result = await n8nInboundService.processWebhook(payload);

    if (result.success) {
      console.log('✅ Webhook N8N traité avec succès:', result.data);
      return json({ 
        success: true, 
        message: 'Webhook traité avec succès',
        data: result.data 
      });
    } else {
      console.error('❌ Erreur traitement webhook N8N:', result.error);
      return json({ 
        success: false, 
        error: result.error 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('💥 Erreur webhook N8N:', error);
    
    return json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur serveur' 
    }, { status: 500 });
  }
};

/**
 * GET handler pour info sur l'endpoint
 */
export const loader = async () => {
  return json({
    endpoint: '/api/webhooks/n8n',
    methods: ['POST'],
    description: 'Endpoint pour recevoir les webhooks N8N',
    authentication: 'Clé secrète ou Bearer token requis',
    payload: {
      type: 'article | project',
      action: 'create | update | delete',
      data: 'Données spécifiques au type',
      metadata: 'Métadonnées optionnelles'
    }
  });
};