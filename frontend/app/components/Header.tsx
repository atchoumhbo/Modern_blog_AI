import { useState } from 'react'
import { Link } from 'react-router'
import { Menu, X, Sun, Moon, Monitor } from 'lucide-react'
import { useDarkMode } from '~/hooks/useDarkMode'
import { cn } from '~/lib/utils'
import { useI18n } from "~/i18n";

const navigation = [
  { key: 'common.home', name: 'Home', href: '/' },
  { key: 'common.blog', name: 'Blog', href: '/blog' },
  { key: 'common.projects', name: 'Projects', href: '/projects' },
  { key: 'common.about', name: 'About', href: '/about' },
  { key: 'common.contact', name: 'Contact', href: '/contact' },
] as const;

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { theme, isDark, setTheme, toggleTheme } = useDarkMode()
  const { t, locale, setLocale } = useI18n();

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-5 h-5" />
      case 'dark':
        return <Moon className="w-5 h-5" />
      default:
        return <Monitor className="w-5 h-5" />
    }
  }

  const cycleTheme = () => {
    const themes = ['light', 'dark', 'system'] as const
    const currentIndex = themes.indexOf(theme)
    const nextTheme = themes[(currentIndex + 1) % themes.length]
    setTheme(nextTheme)
  }

  return (
    <header role="banner" aria-label="Site header" className="fixed inset-x-0 top-0 h-16 z-[9999] w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo amélioré */}
          <Link 
            to="/" 
            className="group flex items-center space-x-3 text-xl font-bold text-gradient hover:opacity-80 transition-all duration-300"
          >
            <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L13.09 8.26L22 9L13.09 15.74L12 22L10.91 15.74L2 9L10.91 8.26L12 2Z"/>
              </svg>
              <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg leading-none">Modern Blog</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-normal leading-none">Tech & Development</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.key}
                to={item.href}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium inline-flex items-center justify-center text-center"
              >
                {t(item.key, item.name)}
              </Link>
            ))}
            {/* Language switcher (desktop) */}
            <div className="ml-2 inline-flex items-center gap-1 rounded-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-1">
              <button
                type="button"
                aria-label="Français"
                aria-pressed={locale === 'fr'}
                onClick={() => setLocale('fr')}
                className={
                  `px-2.5 py-1 rounded-full text-xs font-medium transition-colors ` +
                  (locale === 'fr'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800')
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
                  `px-2.5 py-1 rounded-full text-xs font-medium transition-colors ` +
                  (locale === 'en'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800')
                }
              >
                EN
              </button>
            </div>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={cycleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              title={`Current theme: ${theme}`}
            >
              {getThemeIcon()}
            </button>

            {/* Search Button (placeholder for future) */}
            <button className="hidden sm:block p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="px-4 py-4 space-y-3">
            {navigation.map((item) => (
              <Link
                key={item.key}
                to={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium py-2"
              >
                {t(item.key, item.name)}
              </Link>
            ))}
            <div className="pt-2">
              <label htmlFor="lang" className="sr-only">Language</label>
              <select
                id="lang"
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm px-2 py-2 text-gray-700 dark:text-gray-200"
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
              >
                <option value="fr">FR</option>
                <option value="en">EN</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}