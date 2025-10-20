interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

/**
 * Composant skeleton de base
 */
export function Skeleton({ className = '', width, height }: SkeletonProps) {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div 
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      style={style}
    />
  );
}

/**
 * Skeleton pour un article de blog
 */
export function BlogPostSkeleton() {
  return (
    <article className="bg-white rounded-lg shadow-sm border p-6">
      <div className="space-y-4">
        {/* Image */}
        <Skeleton className="w-full h-48 rounded-lg" />
        
        {/* Titre */}
        <div className="space-y-2">
          <Skeleton width="75%" height={24} />
          <Skeleton width="50%" height={20} />
        </div>
        
        {/* Métadonnées */}
        <div className="flex space-x-4">
          <Skeleton width={80} height={16} />
          <Skeleton width={100} height={16} />
          <Skeleton width={60} height={16} />
        </div>
        
        {/* Extrait */}
        <div className="space-y-2">
          <Skeleton width="100%" height={16} />
          <Skeleton width="100%" height={16} />
          <Skeleton width="80%" height={16} />
        </div>
        
        {/* Tags */}
        <div className="flex space-x-2">
          <Skeleton width={60} height={24} className="rounded-full" />
          <Skeleton width={80} height={24} className="rounded-full" />
          <Skeleton width={70} height={24} className="rounded-full" />
        </div>
      </div>
    </article>
  );
}

/**
 * Skeleton pour un projet
 */
export function ProjectSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Image */}
      <Skeleton className="w-full h-48" />
      
      <div className="p-6 space-y-4">
        {/* Titre et statut */}
        <div className="flex justify-between items-start">
          <Skeleton width="70%" height={24} />
          <Skeleton width={80} height={20} className="rounded-full" />
        </div>
        
        {/* Description */}
        <div className="space-y-2">
          <Skeleton width="100%" height={16} />
          <Skeleton width="100%" height={16} />
          <Skeleton width="60%" height={16} />
        </div>
        
        {/* Technologies */}
        <div className="flex flex-wrap gap-2">
          <Skeleton width={60} height={20} className="rounded" />
          <Skeleton width={80} height={20} className="rounded" />
          <Skeleton width={70} height={20} className="rounded" />
          <Skeleton width={90} height={20} className="rounded" />
        </div>
        
        {/* Liens */}
        <div className="flex space-x-4 pt-2">
          <Skeleton width={100} height={32} className="rounded" />
          <Skeleton width={80} height={32} className="rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton pour la liste des articles
 */
export function BlogListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <BlogPostSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton pour la liste des projets
 */
export function ProjectListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <ProjectSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton pour la page d'un article
 */
export function ArticlePageSkeleton() {
  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* En-tête */}
        <header className="space-y-4">
          <Skeleton width="80%" height={40} />
          <div className="flex items-center space-x-4">
            <Skeleton width={40} height={40} className="rounded-full" />
            <div className="space-y-2">
              <Skeleton width={120} height={16} />
              <Skeleton width={100} height={14} />
            </div>
          </div>
        </header>
        
        {/* Image principale */}
        <Skeleton className="w-full h-96 rounded-lg" />
        
        {/* Contenu */}
        <div className="prose max-w-none space-y-4">
          <Skeleton width="100%" height={20} />
          <Skeleton width="100%" height={20} />
          <Skeleton width="90%" height={20} />
          
          <div className="my-6">
            <Skeleton width="100%" height={200} className="rounded" />
          </div>
          
          <Skeleton width="100%" height={20} />
          <Skeleton width="100%" height={20} />
          <Skeleton width="85%" height={20} />
          
          <div className="space-y-2">
            <Skeleton width="100%" height={20} />
            <Skeleton width="100%" height={20} />
            <Skeleton width="70%" height={20} />
          </div>
        </div>
        
        {/* Tags et partage */}
        <footer className="border-t pt-6">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Skeleton width={60} height={24} className="rounded-full" />
              <Skeleton width={80} height={24} className="rounded-full" />
              <Skeleton width={70} height={24} className="rounded-full" />
            </div>
            <div className="flex space-x-2">
              <Skeleton width={40} height={40} className="rounded" />
              <Skeleton width={40} height={40} className="rounded" />
              <Skeleton width={40} height={40} className="rounded" />
            </div>
          </div>
        </footer>
      </div>
    </article>
  );
}

/**
 * Skeleton pour la navigation
 */
export function NavSkeleton() {
  return (
    <nav className="flex space-x-6">
      <Skeleton width={60} height={20} />
      <Skeleton width={80} height={20} />
      <Skeleton width={70} height={20} />
      <Skeleton width={90} height={20} />
    </nav>
  );
}