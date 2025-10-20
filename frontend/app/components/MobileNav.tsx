import { Link, useLocation } from 'react-router'
import { Home, BookOpen, FolderKanban, Info, Mail } from 'lucide-react'
import { cn } from '~/lib/utils'
import { useI18n } from "~/i18n";

const items = [
  { key: 'home', to: '/', label: 'Home', Icon: Home },
  { key: 'blog', to: '/blog', label: 'Blog', Icon: BookOpen },
  { key: 'projects', to: '/projects', label: 'Projects', Icon: FolderKanban },
  { key: 'about', to: '/about', label: 'About', Icon: Info },
  { key: 'contact', to: '/contact', label: 'Contact', Icon: Mail },
]

export function MobileNav() {
  const location = useLocation();
  const path = location.pathname || '/';
  const { t } = useI18n();

  return (
    <div className="sm:hidden fixed inset-x-0 bottom-0 z-[9998]">
      <div className="max-w-7xl mx-auto p-3">
        <nav aria-label="Mobile navigation"
             className="flex items-center justify-between gap-2 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 shadow-lg backdrop-blur">
          {items.map(({ key, to, label, Icon }) => {
            const active = key === 'home' ? path === '/' : path.startsWith(to);
            return (
              <Link
                key={key}
                to={to}
                className={cn(
                  'flex-1 py-2 px-2 inline-flex flex-col items-center justify-center text-xs font-medium transition-colors',
                  active
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                )}
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="leading-none">{t(`common.${key}`, label)}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  )
}

export default MobileNav
