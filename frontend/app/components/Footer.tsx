import { Link } from 'react-router'
import { Github, Twitter, Linkedin, Mail, Heart } from 'lucide-react'

const socialLinks = [
  { name: 'GitHub', icon: Github, href: 'https://github.com' },
  { name: 'Twitter', icon: Twitter, href: 'https://twitter.com' },
  { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com' },
  { name: 'Email', icon: Mail, href: 'mailto:contact@modernblog.com' },
]

const footerSections = [
  {
    title: 'Content',
    links: [
      { name: 'Latest Posts', href: '/blog' },
      { name: 'Featured Projects', href: '/projects' },
      { name: 'Categories', href: '/categories' },
      { name: 'Tags', href: '/tags' },
    ]
  },
  {
    title: 'Company',
    links: [
      { name: 'About Us', href: '/about' },
      { name: 'Contact', href: '/contact' },
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
    ]
  },
  {
    title: 'Resources',
    links: [
      { name: 'Documentation', href: '/docs' },
      { name: 'API Reference', href: '/api' },
      { name: 'Community', href: '/community' },
      { name: 'Newsletter', href: '/newsletter' },
    ]
  }
]

export function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link 
              to="/" 
              className="flex items-center space-x-2 text-xl font-bold text-gradient mb-4"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                MB
              </div>
              <span>Modern Blog</span>
            </Link>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
              The ultimate modern blog platform with AI-powered content, 
              cutting-edge design, and exceptional user experience.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200"
                    aria-label={social.name}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Footer Sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-wider uppercase mb-4">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="py-8 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Stay Updated
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Get the latest posts and insights delivered to your inbox.
            </p>
            <form className="max-w-md mx-auto flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 input"
                required
              />
              <button
                type="submit"
                className="btn-primary px-4"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar - Design EUC365/IONOS */}
        <div className="py-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col items-center text-center space-y-3">
            {/* Copyright avec liens créateur et hébergeur */}
            <div className="flex items-center flex-wrap justify-center text-sm text-gray-600 dark:text-gray-400 gap-1">
              <span>© 2019 - {new Date().getFullYear()} Created by</span>
              <a 
                href="https://euc365.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                EUC365
              </a>
              <span>Hosted by</span>
              <a 
                href="https://www.ionos.fr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                IONOS
              </a>
            </div>

            {/* All Rights Reserved */}
            <div className="text-sm text-gray-500 dark:text-gray-500">
              All Rights Reserved.
            </div>

            {/* Liens de politique */}
            <div className="flex items-center space-x-4">
              <Link
                to="/privacy"
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors"
              >
                Change privacy settings
              </Link>
              <Link
                to="/privacy-history"
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors"
              >
                Privacy settings history
              </Link>
              <button
                onClick={() => {
                  // Révocation des consentements
                  if (window.confirm('Voulez-vous révoquer tous vos consentements de confidentialité ?')) {
                    // Logique de révocation des cookies/consentements
                    console.log('Consentements révoqués');
                  }
                }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors cursor-pointer"
              >
                Revoke consents
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}