/**
 * Production Seed Script - Standalone version
 * No imports from src files, uses direct Prisma Client
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...\n');

  try {
    // 1. Créer l'admin principal
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    
    const admin = await prisma.user.upsert({
      where: { email: 'boujraf.hicham@gmail.com' },
      update: {},
      create: {
        email: 'boujraf.hicham@gmail.com',
        username: 'hicham',
        password: hashedPassword,
        firstName: 'Hicham',
        lastName: 'Boujraf',
        isAdmin: true,
        isActive: true,
      },
    });
    console.log(`✅ Admin created: ${admin.email}\n`);

    // 2. Créer des catégories
    console.log('📁 Creating categories...');
    const categories = await Promise.all([
      prisma.category.upsert({
        where: { slug: 'devops' },
        update: {},
        create: {
          name: 'DevOps',
          slug: 'devops',
          description: 'DevOps, CI/CD, Infrastructure as Code',
          color: '#3B82F6',
        },
      }),
      prisma.category.upsert({
        where: { slug: 'development' },
        update: {},
        create: {
          name: 'Development',
          slug: 'development',
          description: 'Software development, programming, best practices',
          color: '#10B981',
        },
      }),
      prisma.category.upsert({
        where: { slug: 'tutorial' },
        update: {},
        create: {
          name: 'Tutorial',
          slug: 'tutorial',
          description: 'Step-by-step tutorials and guides',
          color: '#F59E0B',
        },
      }),
      prisma.category.upsert({
        where: { slug: 'technology' },
        update: {},
        create: {
          name: 'Technology',
          slug: 'technology',
          description: 'Latest tech trends and innovations',
          color: '#8B5CF6',
        },
      }),
    ]);
    console.log(`✅ Created ${categories.length} categories\n`);

    // 3. Créer des tags
    console.log('🏷️  Creating tags...');
    const tags = await Promise.all([
      prisma.tag.upsert({
        where: { slug: 'react' },
        update: {},
        create: { name: 'React', slug: 'react' },
      }),
      prisma.tag.upsert({
        where: { slug: 'nodejs' },
        update: {},
        create: { name: 'Node.js', slug: 'nodejs' },
      }),
      prisma.tag.upsert({
        where: { slug: 'typescript' },
        update: {},
        create: { name: 'TypeScript', slug: 'typescript' },
      }),
      prisma.tag.upsert({
        where: { slug: 'docker' },
        update: {},
        create: { name: 'Docker', slug: 'docker' },
      }),
      prisma.tag.upsert({
        where: { slug: 'postgresql' },
        update: {},
        create: { name: 'PostgreSQL', slug: 'postgresql' },
      }),
      prisma.tag.upsert({
        where: { slug: 'api' },
        update: {},
        create: { name: 'API', slug: 'api' },
      }),
      prisma.tag.upsert({
        where: { slug: 'backend' },
        update: {},
        create: { name: 'Backend', slug: 'backend' },
      }),
    ]);
    console.log(`✅ Created ${tags.length} tags\n`);

    // 4. Créer un article de démo
    console.log('📝 Creating demo article...');
    const article = await prisma.article.upsert({
      where: { slug: 'getting-started-with-modern-blog-leader' },
      update: {},
      create: {
        title: 'Getting Started with Modern Blog Leader',
        slug: 'getting-started-with-modern-blog-leader',
        content: `
# Welcome to Modern Blog Leader

This is a demo article to showcase the capabilities of our modern MERN stack blog platform.

## Features

- **Secure Authentication**: JWT-based with refresh tokens
- **PostgreSQL Database**: Robust and scalable data storage
- **RESTful API**: Clean and well-documented endpoints
- **TypeScript**: Type-safe development
- **Docker**: Containerized deployment
- **Prisma ORM**: Modern database toolkit

## Getting Started

1. Create an account or login
2. Start creating amazing content
3. Organize with categories and tags
4. Share your knowledge with the world!

## API Integration

Our platform supports API keys for seamless integration with automation tools like N8N.

\`\`\`typescript
// Example API call
const response = await fetch('/api/articles', {
  headers: {
    'X-API-Key': 'your-api-key-here'
  }
});
\`\`\`

Happy blogging! 🚀
        `,
        excerpt: 'Learn how to get started with Modern Blog Leader, a powerful MERN stack blogging platform.',
        isPublished: true,
        authorId: admin.id,
        categoryId: categories[2].id, // Tutorial
        tags: {
          connect: [
            { id: tags[1].id }, // Node.js
            { id: tags[2].id }, // TypeScript
            { id: tags[5].id }, // API
          ],
        },
        publishedAt: new Date(),
      },
    });
    console.log(`✅ Created article: ${article.title}\n`);

    // 5. Créer un projet de démo
    console.log('🚀 Creating demo project...');
    const project = await prisma.project.upsert({
      where: { slug: 'modern-blog-leader-platform' },
      update: {},
      create: {
        title: 'Modern Blog Leader Platform',
        slug: 'modern-blog-leader-platform',
        description: 'A full-stack MERN blogging platform with PostgreSQL, TypeScript, and modern development practices.',
        content: `
# Modern Blog Leader Platform

A production-ready blogging platform built with the MERN stack and modern best practices.

## Tech Stack

- **Frontend**: React 19, TanStack Query, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with refresh tokens
- **Deployment**: Docker, VPS

## Key Features

- ✅ Secure authentication with JWT
- ✅ RESTful API with Strapi v5 compatible format
- ✅ API Keys for automation (N8N integration)
- ✅ Categories and tags organization
- ✅ Rich text content support
- ✅ Image uploads
- ✅ Audit logging
- ✅ Rate limiting
- ✅ Docker deployment

## Repository

[GitHub - Modern Blog Leader](https://github.com/boujrafh/blog_strapi)
        `,
        githubUrl: 'https://github.com/boujrafh/blog_strapi',
        demoUrl: 'https://blog-leader.example.com',
        status: 'COMPLETED',
        isPublished: true,
        authorId: admin.id,
        categoryId: categories[1].id, // Development
        tags: {
          connect: [
            { id: tags[0].id }, // React
            { id: tags[1].id }, // Node.js
            { id: tags[2].id }, // TypeScript
            { id: tags[4].id }, // PostgreSQL
            { id: tags[6].id }, // Backend
          ],
        },
        publishedAt: new Date(),
      },
    });
    console.log(`✅ Created project: ${project.title}\n`);

    // Résumé
    console.log('\n✨ Seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - 1 admin user: ${admin.email}`);
    console.log(`   - ${categories.length} categories`);
    console.log(`   - ${tags.length} tags`);
    console.log(`   - 1 demo article`);
    console.log(`   - 1 demo project`);
    console.log('\n🔐 Admin credentials:');
    console.log(`   Email: boujraf.hicham@gmail.com`);
    console.log(`   Password: Admin123!`);
    console.log('\n✅ You can now login to the platform!\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
