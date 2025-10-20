import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';

// Configuration
dotenv.config();

// Middlewares
import { globalRateLimiter, corsOptions, helmetOptions } from './config/security';
import { errorHandler, notFoundHandler } from './middlewares/error';

// Routes
import authRoutes from './routes/auth.routes';
import apiKeyRoutes from './routes/apiKey.routes';
import articleRoutes from './routes/article.routes';
import projectRoutes from './routes/project.routes';
import categoryRoutes from './routes/category.routes';
import tagRoutes from './routes/tag.routes';
import monitoringRoutes from './routes/monitoring.routes';
import workflowRoutes from './routes/workflow.routes';
import credentialsRoutes from './routes/credentials.routes';
import webhookRoutes from './routes/webhook.routes';

// Initialize app
const app: Application = express();
const PORT = process.env.PORT || 3000;

// ============================================
// SECURITY MIDDLEWARES
// ============================================
app.use(helmet(helmetOptions));
app.use(cors(corsOptions));
app.use(globalRateLimiter);

// ============================================
// BODY PARSING
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// ============================================
// STATIC FILES (uploads)
// ============================================
const uploadPath = process.env.UPLOAD_PATH || './uploads';
app.use('/uploads', express.static(path.join(__dirname, '..', uploadPath)));

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// ============================================
// API INFO
// ============================================
app.get('/api', (req, res) => {
  res.json({
    name: 'Modern Blog Leader API',
    version: '1.0.0',
    description: 'Secure MERN Backend with PostgreSQL',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      articles: '/api/articles',
      projects: '/api/projects',
      categories: '/api/categories',
      tags: '/api/tags',
      apiKeys: '/api/api-keys',
      monitoring: '/api/monitoring',
      workflows: '/api/workflows',
      credentials: '/api/credentials',
      webhooks: '/api/webhooks',
    },
  });
});

// ============================================
// API ROUTES
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/credentials', credentialsRoutes);
app.use('/api/webhooks', webhookRoutes);

// ============================================
// ERROR HANDLING
// ============================================
app.use(notFoundHandler);
app.use(errorHandler);

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔐 API Keys enabled for N8N integration`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

export default app;
