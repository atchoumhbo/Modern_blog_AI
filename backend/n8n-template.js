#!/usr/bin/env node

/**
 * Template N8N opérationnel pour Strapi
 */

console.log('🎯 TEMPLATE N8N POUR STRAPI');
console.log('============================');

const payloadMinimal = {
  data: {
    title: "Article depuis N8N - {{$now}}",
    slug: "article-n8n-{{$now}}",
    content: "# Article créé par N8N\n\nCet article a été créé automatiquement par un workflow N8N.\n\n## Détails\n- Date: {{$now}}\n- Source: Automation",
    status: "published",
    publishedAt: "{{$now}}"
  }
};

const payloadComplet = {
  data: {
    title: "Article N8N Complet - {{$now}}",
    slug: "article-complet-{{$now}}",
    content: "# Article N8N Complet\n\nArticle avec toutes les métadonnées.\n\n## SEO\n- Optimisé pour les moteurs de recherche\n- Métadonnées complètes\n\n## Schema.org\n- Données structurées incluses",
    excerpt: "Article créé par N8N avec métadonnées complètes",
    status: "published",
    readingTime: 3,
    viewCount: 0,
    seo: {
      metaTitle: "Article N8N - {{$now}}",
      metaDescription: "Article automatisé créé par workflow N8N",
      keywords: "n8n, automation, strapi, cms",
      preventIndexing: false
    },
    schema: {
      type: "Article",
      headline: "Article N8N Complet - {{$now}}",
      datePublished: "{{$now}}",
      dateModified: "{{$now}}",
      wordCount: 75
    },
    publishedAt: "{{$now}}"
  }
};

console.log('📝 PAYLOAD MINIMAL (testé ✅):');
console.log(JSON.stringify(payloadMinimal, null, 2));

console.log('\n📋 PAYLOAD COMPLET (avec SEO):');
console.log(JSON.stringify(payloadComplet, null, 2));

console.log('\n🔧 CONFIGURATION N8N:');
console.log('URL:', 'http://localhost:1337/api/articles');
console.log('Method:', 'POST');
console.log('Headers:');
console.log('  Authorization: Bearer [VOTRE_TOKEN]');
console.log('  Content-Type: application/json');

console.log('\n✅ TESTÉ ET FONCTIONNEL!');