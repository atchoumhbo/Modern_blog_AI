/**
 * Type definitions for N8N Image Generator V2
 */

declare module '../n8n' {
  export interface ImageGeneratorOptions {
    provider?: 'stability' | 'openai';
    style?: string;
    width?: number;
    height?: number;
    quality?: number;
  }

  export interface ImageGeneratorResult {
    url: string;
    path?: string;
    cached?: boolean;
    provider?: string;
    metadata?: any;
  }

  export const imageGenerator: {
    generate(title: string, options?: ImageGeneratorOptions): Promise<ImageGeneratorResult>;
  };

  export const promptEngine: any;
  export const providerManager: any;
  export const cacheManager: any;
  export const imageOptimizer: any;
  export const logger: any;
}
