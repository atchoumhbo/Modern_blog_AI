import prisma from '../src/config/database';
import bcrypt from 'bcrypt';
import { bcryptConfig } from '../src/config/security';

async function seed() {
  console.log('🌱 Seeding database...\n');

  try {
    // 1. Créer l'admin principal
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('Admin123!', bcryptConfig.saltRounds);
    
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
        where: { slug: 'automation' },
        update: {},
        create: {
          name: 'Automation',
          slug: 'automation',
          description: 'Automation, N8N, workflows',
          color: '#F59E0B',
        },
      }),
      prisma.category.upsert({
        where: { slug: 'tutorials' },
        update: {},
        create: {
          name: 'Tutorials',
          slug: 'tutorials',
          description: 'Step-by-step guides and tutorials',
          color: '#8B5CF6',
        },
      }),
    ]);
    console.log(`✅ ${categories.length} categories created\n`);

    // 3. Créer des tags
    console.log('🏷️  Creating tags...');
    const tags = await Promise.all([
      prisma.tag.upsert({
        where: { slug: 'docker' },
        update: {},
        create: { name: 'Docker', slug: 'docker', color: '#2496ED' },
      }),
      prisma.tag.upsert({
        where: { slug: 'kubernetes' },
        update: {},
        create: { name: 'Kubernetes', slug: 'kubernetes', color: '#326CE5' },
      }),
      prisma.tag.upsert({
        where: { slug: 'nodejs' },
        update: {},
        create: { name: 'Node.js', slug: 'nodejs', color: '#339933' },
      }),
      prisma.tag.upsert({
        where: { slug: 'typescript' },
        update: {},
        create: { name: 'TypeScript', slug: 'typescript', color: '#3178C6' },
      }),
      prisma.tag.upsert({
        where: { slug: 'n8n' },
        update: {},
        create: { name: 'N8N', slug: 'n8n', color: '#EA4B71' },
      }),
      prisma.tag.upsert({
        where: { slug: 'postgresql' },
        update: {},
        create: { name: 'PostgreSQL', slug: 'postgresql', color: '#336791' },
      }),
      prisma.tag.upsert({
        where: { slug: 'security' },
        update: {},
        create: { name: 'Security', slug: 'security', color: '#DC2626' },
      }),
    ]);
    console.log(`✅ ${tags.length} tags created\n`);

    // 4. Créer un article exemple
    console.log('📝 Creating sample article...');
    const devopsCategory = categories.find(c => c.slug === 'devops');
    const dockerTag = tags.find(t => t.slug === 'docker');
    const nodejsTag = tags.find(t => t.slug === 'nodejs');

    const article = await prisma.article.upsert({
      where: { slug: 'bienvenue-modern-blog-leader' },
      update: {},
      create: {
        title: 'Bienvenue sur Modern Blog Leader',
        slug: 'bienvenue-modern-blog-leader',
        excerpt: 'Découvrez notre nouvelle plateforme de blog sécurisée avec backend MERN et intégration N8N.',
        content: `# Bienvenue sur Modern Blog Leader

## Une plateforme de blog moderne et sécurisée

Modern Blog Leader est une plateforme de blog construite avec les technologies les plus récentes :

- **Backend MERN** : PostgreSQL, Express, Node.js, TypeScript
- **Sécurité renforcée** : JWT, API Keys, rate limiting, Helmet.js
- **Intégration N8N** : Automatisation des workflows
- **API REST complète** : CRUD, pagination, filtering, search

## Fonctionnalités principales

### Authentification sécurisée
- JWT avec refresh tokens
- Bcrypt (12 salt rounds)
- Rate limiting anti-brute-force

### API Keys pour N8N
- Génération cryptographique
- Permissions granulaires (read/write/delete)
- Logs d'audit complets

### Performance
- PostgreSQL avec Prisma ORM
- Queries optimisées avec indexes
- Caching et compression

## Comment commencer ?

1. Créez un compte
2. Générez une API Key
3. Connectez N8N
4. Automatisez vos workflows

---

**Développé avec ❤️ par Hicham Boujraf**
`,
        coverImage: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea',
        isPublished: true,
        publishedAt: new Date(),
        viewCount: 0,
        metaTitle: 'Bienvenue sur Modern Blog Leader - Plateforme de blog sécurisée',
        metaDescription: 'Découvrez Modern Blog Leader : backend MERN, PostgreSQL, intégration N8N, sécurité renforcée.',
        metaKeywords: 'blog, mern, postgresql, n8n, security, devops',
        authorId: admin.id,
        categoryId: devopsCategory?.id,
        tags: {
          connect: [
            { id: dockerTag?.id },
            { id: nodejsTag?.id },
          ],
        },
      },
    });
    console.log(`✅ Sample article created: ${article.title}\n`);

    // 5. Créer un projet exemple
    console.log('🚀 Creating sample project...');
    const project = await prisma.project.upsert({
      where: { slug: 'modern-blog-leader' },
      update: {},
      create: {
        title: 'Modern Blog Leader',
        slug: 'modern-blog-leader',
        description: 'Plateforme de blog sécurisée avec backend MERN et intégration N8N',
        content: `# Modern Blog Leader

## Stack technique

- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Security**: JWT, API Keys, Helmet, Rate Limiting
- **Automation**: N8N Integration
- **Deployment**: Docker, Docker Compose

## Fonctionnalités

- ✅ Authentification JWT sécurisée
- ✅ API Keys pour N8N
- ✅ CRUD complet (Articles, Projects, Categories, Tags)
- ✅ Permissions granulaires
- ✅ Audit logs
- ✅ Rate limiting
- ✅ Validation Zod
- ✅ Error handling global

## Installation

\`\`\`bash
npm install
npm run prisma:migrate
npm run dev
\`\`\`
`,
        coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
        githubUrl: 'https://github.com/boujrafh/blog_strapi',
        status: 'COMPLETED',
        isPublished: true,
        publishedAt: new Date(),
        viewCount: 0,
        metaTitle: 'Modern Blog Leader - Backend MERN sécurisé',
        metaDescription: 'Backend sécurisé avec PostgreSQL, Express, Node.js et intégration N8N',
        authorId: admin.id,
        categoryId: devopsCategory?.id,
        tags: {
          connect: [
            { id: dockerTag?.id },
            { id: nodejsTag?.id },
            { id: tags.find(t => t.slug === 'typescript')?.id },
            { id: tags.find(t => t.slug === 'postgresql')?.id },
          ],
        },
      },
    });
    console.log(`✅ Sample project created: ${project.title}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ Seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Admin user: ${admin.email}`);
    console.log(`   - Password: Admin123! (change it!)`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Tags: ${tags.length}`);
    console.log(`   - Articles: 1`);
    console.log(`   - Projects: 1`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
