import jwt, { SignOptions } from 'jsonwebtoken';
import { jwtConfig } from '../config/security';

export interface JwtPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
}

/**
 * Génère un access token JWT
 */
export function generateAccessToken(payload: JwtPayload): string {
  // @ts-ignore - expiresIn accepts string like "15m"
  return jwt.sign(payload, jwtConfig.accessToken.secret, {
    expiresIn: jwtConfig.accessToken.expiresIn,
  });
}

/**
 * Génère un refresh token JWT
 */
export function generateRefreshToken(payload: JwtPayload): string {
  // @ts-ignore - expiresIn accepts string like "7d"
  return jwt.sign(payload, jwtConfig.refreshToken.secret, {
    expiresIn: jwtConfig.refreshToken.expiresIn,
  });
}

/**
 * Vérifie un access token
 */
export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, jwtConfig.accessToken.secret) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
}

/**
 * Vérifie un refresh token
 */
export function verifyRefreshToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, jwtConfig.refreshToken.secret) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

/**
 * Decode un token sans vérification (pour debug)
 */
export function decodeToken(token: string): any {
  return jwt.decode(token);
}
