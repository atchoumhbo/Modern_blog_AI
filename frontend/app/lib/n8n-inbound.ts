/**
 * N8N webhook service (placeholder)
 * The legacy Strapi integration has been removed. This stub keeps the
 * typings so the API route remains functional but returns a controlled
 * message until a MERN-specific automation flow is implemented.
 */

export interface N8NArticleData {
  title: string;
  slug?: string;
  excerpt?: string;
  body: string;
  date?: string;
  categorySlug?: string;
  tagSlugs?: string[];
  authorEmail?: string;
  featuredImageUrl?: string;
  publishNow?: boolean;
}

export interface N8NProjectData {
  title: string;
  slug?: string;
  description: string;
  content?: string;
  status?: 'active' | 'completed' | 'archived' | 'on-hold';
  categorySlug?: string;
  technologySlugs?: string[];
  featuredImageUrl?: string;
  demoUrl?: string;
  githubUrl?: string;
  publishNow?: boolean;
}

export interface N8NWebhookPayload {
  type: 'article' | 'project';
  action: 'create' | 'update' | 'delete';
  data: N8NArticleData | N8NProjectData;
  metadata?: Record<string, unknown>;
}

export class N8NInboundService {
  async processWebhook(_: N8NWebhookPayload): Promise<{ success: boolean; error: string }> {
    return {
      success: false,
      error: 'N8N automation is not yet available for the MERN backend.',
    };
  }
}

export const n8nInboundService = new N8NInboundService();
