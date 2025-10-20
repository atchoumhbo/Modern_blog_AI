import type { Route } from "./+types/about";
import { generateMetaTags } from "~/lib/utils";
import { useI18n } from "~/i18n";
import { QuickNav } from "~/components/QuickNav";

export function meta({}: Route.MetaArgs) {
  // Static meta (English fallback); runtime content will be translated
  return generateMetaTags({
    title: "About - Modern Blog Leader",
    description: "Learn about our mission to create the ultimate modern blogging experience.",
  });
}

export function headers(_: Route.HeadersArgs) {
  // Static content can be cached longer
  return {
    "Cache-Control": "public, max-age=600, stale-while-revalidate=1800",
  };
}

export default function About() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-fade-in">
            {/* Page indicator badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
              </svg>
              À propos
            </div>
            
            <QuickNav />
            
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6 mt-8">
              {t("about.title").split(' ').slice(0, 2).join(' ')} <span className="text-gradient">{t("about.title").split(' ').slice(2).join(' ')}</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              {t("about.intro", "We're building the future of blogging with AI-powered content, modern design, and exceptional user experience.")}
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg dark:prose-invert max-w-none">
        
            <h2>{t("about.missionTitle", "Our Mission")}</h2>
            <p>{t("about.missionDesc", "To create the most advanced, user-friendly, and visually stunning blogging platform that empowers creators and engages readers like never before.")}</p>
            
            <h2>{t("about.stackTitle", "Technology Stack")}</h2>
            <ul>
              <li><strong>{t("about.stack.frontend", "Frontend:")}</strong> React Router v7, TypeScript</li>
              <li><strong>{t("about.stack.styling", "Styling:")}</strong> Tailwind CSS</li>
              <li><strong>{t("about.stack.backend", "Backend:")}</strong> MERN API (Express + Prisma + PostgreSQL)</li>
              <li><strong>{t("about.stack.ai", "AI Integration:")}</strong> {t("about.stack.aiDesc", "Multi-provider AI content generation")}</li>
              <li><strong>{t("about.stack.deployment", "Deployment:")}</strong> {t("about.stack.deploymentDesc", "Modern CI/CD with performance monitoring")}</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}