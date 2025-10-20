import { Suspense } from 'react';
import { Link } from 'react-router';
import { useStrapiArticles, useStrapiProjects } from '../hooks/useStrapi';
import { BlogListSkeleton, ProjectListSkeleton } from './SkeletonLoaders';
import { StrapiErrorBoundary } from './StrapiErrorBoundary';

/**
 * Composant pour afficher les articles récents avec Strapi
 */
export function StrapiRecentArticles({ limit = 6 }: { limit?: number }) {
  const { 
    data, 
    error, 
    isLoading, 
    refetch 
  } = useStrapiArticles({
    pageSize: limit,
    sort: ['date:desc'],
    populate: {
      featuredImage: { populate: '*' },
      category: { populate: '*' },
      tags: { populate: '*' },
      author: { populate: ['avatar'] }
    }
  });

  if (isLoading) {
    return <BlogListSkeleton count={limit} />;
  }

  return (
    <StrapiErrorBoundary error={error} retry={refetch}>
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Articles récents
            </h2>
            <Link 
              to="/blog" 
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Voir tous les articles →
            </Link>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data?.data.map((article) => (
              <StrapiArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      </section>
    </StrapiErrorBoundary>
  );
}

/**
 * Composant pour afficher les projets avec Strapi
 */
export function StrapiRecentProjects({ limit = 6 }: { limit?: number }) {
  const { 
    data, 
    error, 
    isLoading, 
    refetch 
  } = useStrapiProjects({
    pageSize: limit,
    sort: ['createdAt:desc'],
    populate: {
      featuredImage: { populate: '*' },
      technologies: { populate: '*' },
      category: { populate: '*' }
    }
  });

  if (isLoading) {
    return <ProjectListSkeleton count={limit} />;
  }

  return (
    <StrapiErrorBoundary error={error} retry={refetch}>
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Projets récents
            </h2>
            <Link 
              to="/projets" 
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Voir tous les projets →
            </Link>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data?.data.map((project) => (
              <StrapiProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </section>
    </StrapiErrorBoundary>
  );
}

/**
 * Carte d'article optimisée pour Strapi
 */
function StrapiArticleCard({ article }: { article: any }) {
  const featuredImage = article.featuredImage?.url;
  const category = article.category;
  const tags = article.tags || [];
  const author = article.author;
  
  return (
    <article className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      {featuredImage && (
        <div className="aspect-video overflow-hidden rounded-t-lg">
          <img 
            src={featuredImage} 
            alt={article.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
      )}
      
      <div className="p-6 space-y-4">
        {/* Métadonnées */}
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          {category && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {category.name}
            </span>
          )}
          <time>{new Date(article.date).toLocaleDateString('fr-FR')}</time>
          {author && (
            <div className="flex items-center space-x-2">
              {author.avatar?.url && (
                <img 
                  src={author.avatar.url} 
                  alt={author.name}
                  className="w-5 h-5 rounded-full"
                />
              )}
              <span>{author.name}</span>
            </div>
          )}
        </div>
        
        {/* Titre et extrait */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
            <Link 
              to={`/blog/${article.slug}`}
              className="hover:text-blue-600 transition-colors"
            >
              {article.title}
            </Link>
          </h3>
          {article.excerpt && (
            <p className="text-gray-600 line-clamp-3">
              {article.excerpt}
            </p>
          )}
        </div>
        
        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 3).map((tag: any) => (
              <span 
                key={tag.id}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
        
        {/* Lien de lecture */}
        <Link 
          to={`/blog/${article.slug}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
        >
          Lire la suite
          <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>
    </article>
  );
}

/**
 * Carte de projet optimisée pour Strapi
 */
function StrapiProjectCard({ project }: { project: any }) {
  const featuredImage = project.featuredImage?.url;
  const technologies = project.technologies || [];
  const category = project.category;
  
  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow overflow-hidden">
      {featuredImage && (
        <div className="aspect-video overflow-hidden">
          <img 
            src={featuredImage} 
            alt={project.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
      )}
      
      <div className="p-6 space-y-4">
        {/* Titre et statut */}
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-semibold text-gray-900 line-clamp-1">
            <Link 
              to={`/projets/${project.slug}`}
              className="hover:text-blue-600 transition-colors"
            >
              {project.title}
            </Link>
          </h3>
          {project.status && (
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              project.status === 'active' ? 'bg-green-100 text-green-800' :
              project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {project.status}
            </span>
          )}
        </div>
        
        {/* Catégorie */}
        {category && (
          <span className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
            {category.name}
          </span>
        )}
        
        {/* Description */}
        {project.description && (
          <p className="text-gray-600 line-clamp-3">
            {project.description}
          </p>
        )}
        
        {/* Technologies */}
        {technologies.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {technologies.slice(0, 4).map((tech: any) => (
              <span 
                key={tech.id}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
              >
                {tech.name}
              </span>
            ))}
          </div>
        )}
        
        {/* Liens */}
        <div className="flex space-x-4 pt-2">
          <Link 
            to={`/projets/${project.slug}`}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Voir le projet
          </Link>
          {project.demoUrl && (
            <a 
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Démo live
            </a>
          )}
        </div>
      </div>
    </div>
  );
}