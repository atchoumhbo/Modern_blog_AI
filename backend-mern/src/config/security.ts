import rateLimit from 'express-rate-limit';
import { CorsOptions } from 'cors';

// CORS Configuration
export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'];
    
    // Permettre les requêtes sans origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

// Rate Limiting - Global
export const globalRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate Limiting - Auth endpoints (plus strict)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

// Rate Limiting - API Keys (N8N)
export const apiKeyRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 1000, // 1000 requests par heure
  message: 'API rate limit exceeded. Please check your API key plan.',
  keyGenerator: (req) => {
    // Utiliser l'API key comme identifiant
    return req.headers['x-api-key'] as string || req.ip || 'unknown';
  },
});

// Helmet Configuration
export const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
};

// JWT Configuration
export const jwtConfig = {
  accessToken: {
    secret: process.env.JWT_SECRET || 'CHANGE_ME',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET || 'CHANGE_ME',
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
};

// Bcrypt Configuration
export const bcryptConfig = {
  saltRounds: 12,
};

// Upload Configuration
export const uploadConfig = {
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
  uploadPath: process.env.UPLOAD_PATH || './uploads',
};
