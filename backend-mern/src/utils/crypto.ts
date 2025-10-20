import crypto from 'crypto';

/**
 * Génère une API Key sécurisée pour N8N
 * Format: mbk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 */
export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const prefix = 'mbk_live_';
  const key = prefix + randomBytes;
  
  // Hash de la clé pour stockage en DB (comme un password)
  const hash = hashApiKey(key);
  
  return {
    key,      // À donner à l'utilisateur (une seule fois)
    prefix,   // Pour identification rapide
    hash,     // À stocker en DB
  };
}

/**
 * Hash une API Key pour stockage sécurisé
 */
export function hashApiKey(apiKey: string): string {
  const salt = process.env.API_KEY_SALT || 'default-salt-change-me';
  return crypto
    .createHmac('sha256', salt)
    .update(apiKey)
    .digest('hex');
}

/**
 * Vérifie si une API Key correspond au hash stocké
 */
export function verifyApiKey(apiKey: string, hash: string): boolean {
  const computedHash = hashApiKey(apiKey);
  return crypto.timingSafeEqual(
    Buffer.from(computedHash),
    Buffer.from(hash)
  );
}

/**
 * Génère un token aléatoire pour refresh tokens
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}
