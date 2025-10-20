/**
 * Exemple d'utilisation complète des services Strapi avec TanStack Query
 * Page de blog optimisée avec toutes les fonctionnalités
 */

import { Suspense, useState, useMemo } from 'react';
import { Link } from 'react-router';
import { 
  useStrapiArticles, 
  useStrapiArticlesInfinite,
  useStrapiPrefetch 
} from '../hooks/useStrapi';
import { useSearchArticles, usePopularArticles, useRecentArticles } from '../hooks/useApi';
import { BlogListSkeleton, BlogPostSkeleton } from '../components/SkeletonLoaders';
import { StrapiErrorBoundary } from '../components/StrapiErrorBoundary';
import { STRAPI_CONFIG } from '../lib/strapi-config';

interface BlogPageProps {
  searchParams?: {
    category?: string;
    tag?: string;
    search?: string;
    page?: string;
  };
}

export function BlogPageExample({ searchParams = {} }: BlogPageProps) {
  const [searchQuery, setSearchQuery] = useState(searchParams.search || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.category || '');
  const [selectedTag, setSelectedTag] = useState(searchParams.tag || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Préchargement pour améliorer l'UX
  const { prefetchArticle } = useStrapiPrefetch();

  // Paramètres de requête dynamiques
  const queryParams = useMemo(() => {
    const params: any = {
      pageSize: 12,
      sort: ['date:desc'],
      populate: STRAPI_CONFIG.POPULATE.articles.preview,
      filters: {
        publishedAt: { $notNull: true }
      }
    };

    // Filtrage par catégorie
    if (selectedCategory) {
      params.filters.category = { slug: { $eq: selectedCategory } };
    }

    // Filtrage par tag
    if (selectedTag) {
      params.filters.tags = { slug: { $in: [selectedTag] } };
    }

    return params;
  }, [selectedCategory, selectedTag]);

  // Hooks pour les différents types de contenu
  const {
    data: articles,
    error: articlesError,
    isLoading: articlesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchArticles
  } = useStrapiArticlesInfinite(queryParams);

  const {
    data: popularArticles,
    isLoading: popularLoading,
    error: popularError
  } = usePopularArticles(5);

  const {
    data: recentArticles,
    isLoading: recentLoading,
    error: recentError
  } = useRecentArticles(5);

  const {
    data: searchResults,
    isLoading: searchLoading,
    error: searchError
  } = useSearchArticles(searchQuery, searchQuery.length > 2);

  // Gestion de la recherche
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Réinitialiser les filtres lors d'une recherche
    if (query) {
      setSelectedCategory('');
      setSelectedTag('');
    }
  };

  // Préchargement au survol
  const handleArticleHover = (slug: string) => {
    prefetchArticle(slug);
  };

  // Données à afficher (recherche ou liste normale)
  const displayData = searchQuery.length > 2 ? searchResults : articles;
  const displayLoading = searchQuery.length > 2 ? searchLoading : articlesLoading;
  const displayError = searchQuery.length > 2 ? searchError : articlesError;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête avec recherche */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Blog</h1>
              <p className="text-gray-600 mt-1">
                Découvrez nos derniers articles sur le développement web
              </p>
            </div>
            
            {/* Barre de recherche */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher des articles..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Sélecteur de vue */}
              <div className="flex border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Contenu principal */}
          <main className="flex-1">
            {/* Filtres actifs */}
            {(selectedCategory || selectedTag || searchQuery) && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-blue-700 font-medium">Filtres actifs:</span>
                    {selectedCategory && (
                      <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded">
                        Catégorie: {selectedCategory}
                      </span>
                    )}
                    {selectedTag && (
                      <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded">
                        Tag: {selectedTag}
                      </span>
                    )}
                    {searchQuery && (
                      <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded">
                        Recherche: "{searchQuery}"
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCategory('');
                      setSelectedTag('');
                      setSearchQuery('');
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Effacer les filtres
                  </button>
                </div>
              </div>
            )}

            {/* Liste des articles */}
            <StrapiErrorBoundary 
              error={displayError} 
              retry={() => searchQuery.length > 2 ? void 0 : refetchArticles()}
            >
              {displayLoading ? (
                <BlogListSkeleton count={12} />
              ) : (
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'md:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-1'
                }`}>
                  {displayData?.pages?.map((page, i) => (
                    page.data.map((article) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        viewMode={viewMode}
                        onHover={() => handleArticleHover(article.slug)}
                        onCategoryClick={setSelectedCategory}
                        onTagClick={setSelectedTag}
                      />
                    ))
                  )) || []}
                </div>
              )}

              {/* Bouton de chargement */}
              {hasNextPage && !searchQuery && (
                <div className="text-center mt-8">
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isFetchingNextPage ? 'Chargement...' : 'Charger plus d\'articles'}
                  </button>
                </div>
              )}
            </StrapiErrorBoundary>
          </main>

          {/* Sidebar */}
          <aside className="w-80 space-y-8">
            {/* Articles populaires */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Articles populaires
              </h3>
              <StrapiErrorBoundary error={popularError}>
                {popularLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }, (_, i) => (
                      <BlogPostSkeleton key={i} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {popularArticles?.posts?.slice(0, 5).map((article) => (
                      <SidebarArticleCard
                        key={article.id}
                        article={article}
                        onHover={() => handleArticleHover(article.slug)}
                      />
                    ))}
                  </div>
                )}
              </StrapiErrorBoundary>
            </div>

            {/* Articles récents */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Articles récents
              </h3>
              <StrapiErrorBoundary error={recentError}>
                {recentLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }, (_, i) => (
                      <BlogPostSkeleton key={i} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentArticles?.posts?.slice(0, 5).map((article) => (
                      <SidebarArticleCard
                        key={article.id}
                        article={article}
                        onHover={() => handleArticleHover(article.slug)}
                      />
                    ))}
                  </div>
                )}
              </StrapiErrorBoundary>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// Composants auxiliaires
function ArticleCard({ article, viewMode, onHover, onCategoryClick, onTagClick }: any) {
  return (
    <article 
      className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
      onMouseEnter={() => onHover()}
    >
      {/* Implémentation de la carte d'article */}
      {/* ... */}
    </article>
  );
}

function SidebarArticleCard({ article, onHover }: any) {
  return (
    <div 
      className="flex space-x-3 hover:bg-gray-50 p-2 rounded"
      onMouseEnter={() => onHover()}
    >
      {/* Implémentation de la carte sidebar */}
      {/* ... */}
    </div>
  );
}