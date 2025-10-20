import { Link, useLocation } from "react-router";
import { useI18n } from "~/i18n";

export function QuickNav() {
  const { t, locale, setLocale } = useI18n();
  const location = useLocation();

  const navItems = [
    { to: "/", label: t("common.home", "Accueil") },
    { to: "/blog", label: t("common.blog", "Blog") },
    { to: "/projects", label: t("common.projects", "Projets") },
    { to: "/about", label: t("common.about", "À propos") },
    { to: "/contact", label: t("common.contact", "Contact") },
  ];

  return (
    <nav aria-label="Quick navigation" className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
      {navItems.map((item) => {
        const isActive = location.pathname === item.to || 
          (item.to === "/blog" && location.pathname.startsWith("/blog")) ||
          (item.to === "/projects" && location.pathname.startsWith("/projects"));
        
        return (
          <Link 
            key={item.to}
            to={item.to} 
            className={
              `px-3 py-1 rounded-full inline-flex items-center justify-center text-center border transition-colors ` +
              (isActive
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700')
            }
          >
            {item.label}
          </Link>
        );
      })}
      
      {/* Language switcher inline with quick nav */}
      <div className="inline-flex items-center gap-1 ml-2 rounded-full bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 p-1">
        <button
          type="button"
          aria-label="Français"
          aria-pressed={locale === 'fr'}
          onClick={() => setLocale('fr')}
          className={
            `px-3 py-1 rounded-full border text-sm transition-colors ` +
            (locale === 'fr'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700')
          }
        >
          FR
        </button>
        <button
          type="button"
          aria-label="English"
          aria-pressed={locale === 'en'}
          onClick={() => setLocale('en')}
          className={
            `px-3 py-1 rounded-full border text-sm transition-colors ` +
            (locale === 'en'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700')
          }
        >
          EN
        </button>
      </div>
    </nav>
  );
}