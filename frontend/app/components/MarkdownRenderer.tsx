import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import { useEffect, useRef, useState } from 'react';

interface MarkdownRendererProps {
  content?: string; // raw markdown
  html?: string;    // pre-rendered sanitized HTML
  toc?: { id: string; text: string; level: number }[];
  showToc?: boolean;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function MarkdownRenderer({ content, html, toc, showToc = false }: MarkdownRendererProps) {
  const [htmlContent, setHtmlContent] = useState('');
  const [tocItems, setTocItems] = useState<TocItem[]>(toc || []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const articleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Prefer SSR provided html/toc when available
    if (html) {
      setHtmlContent(html);
      setTocItems(toc || []);
      return;
    }
    if (!content) return;

    const processMarkdown = async () => {
      // Configuration de marked (async pour supporter des renderers async)
      marked.setOptions({
        async: true,
        breaks: true,
        gfm: true,
      });

      // Parser pour extraire les titres pour la table des matières
      const renderer = new marked.Renderer();
      const toc: TocItem[] = [];

      // Override des titres pour générer la TOC (async)
      ;(renderer as any).heading = async function(token: any) {
        const level = token.depth;
        const text = await (this as any).parser.parseInline(token.tokens);
        const escapedText = (typeof text === 'string' ? text : String(text)).toLowerCase().replace(/[^\w]+/g, '-');
        const id = `heading-${escapedText}`;
        
        if (showToc && level <= 3) {
          toc.push({
            id,
            text: (typeof text === 'string' ? text : String(text)).replace(/[📊🚀🛠🎯🔧📱💡🔮]/g, '').trim(),
            level
          });
        }
        
        return `<h${level} id="${id}" class="heading-${level}">${text}</h${level}>`;
      };

      // Paragraphs - await inline parsing
      ;(renderer as any).paragraph = async ({ tokens }: any) => {
        const inner = await marked.parseInline(tokens);
        return `<p>${inner}</p>`;
      };

      // Lists
      ;(renderer as any).list = async ({ items, ordered, start }: any) => {
        const lis = await Promise.all(
          (items || []).map(async (it: any) => {
            const checkbox = it.task ? `<input type="checkbox" disabled ${it.checked ? 'checked' : ''} /> ` : '';
            const inner = await marked.parseInline(it.tokens || []);
            return `<li>${checkbox}${inner}</li>`;
          })
        );
        const tag = ordered ? 'ol' : 'ul';
        const startAttr = ordered && typeof start === 'number' && start > 1 ? ` start="${start}"` : '';
        return `<${tag}${startAttr}>\n${lis.join('\n')}\n</${tag}>`;
      };

      // Blockquotes
      ;(renderer as any).blockquote = async ({ tokens }: any) => {
        const inner = await marked.parse(tokens || []);
        return `<blockquote>\n${inner}\n</blockquote>`;
      };

      // Parser le markdown
      const generated = await marked.parse(content, { renderer }) as string;
      // Sanitize HTML to prevent XSS
      const clean = DOMPurify.sanitize(generated);
      setHtmlContent(clean);
      setTocItems(toc);
    };

    processMarkdown();
  }, [html, toc, content, showToc]);

  // Observe headings to highlight active section in TOC
  useEffect(() => {
    if (!showToc || tocItems.length === 0) return;
    const container = articleRef.current;
    if (!container) return;

    const headings = Array.from(container.querySelectorAll('h1, h2, h3')) as HTMLElement[];
    if (headings.length === 0) return;

    const idToIndex = new Map<string, number>(headings.map((el, i) => [el.id || `h-${i}`, i]));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible: HTMLElement[] = [];
        for (const entry of entries) {
          if (entry.isIntersecting) visible.push(entry.target as HTMLElement);
        }
        if (visible.length > 0) {
          visible.sort((a, b) => (idToIndex.get(a.id) ?? 0) - (idToIndex.get(b.id) ?? 0));
          const current = visible[0].id;
          setActiveId((prev) => (prev === current ? prev : current));
        } else {
          // Fallback: last heading above the viewport
          const above = headings.filter((h) => h.getBoundingClientRect().top <= 80);
          if (above.length > 0) {
            const last = above[above.length - 1].id;
            setActiveId((prev) => (prev === last ? prev : last));
          }
        }
      },
      { root: null, rootMargin: '0px 0px -70% 0px', threshold: [0, 1.0] }
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [htmlContent, tocItems, showToc]);

  // Reflect active heading in the URL hash without scrolling
  useEffect(() => {
    if (!activeId) return;
    const targetHash = `#${activeId}`;
    if (window.location.hash !== targetHash) {
      window.history.replaceState(null, '', targetHash);
    }
  }, [activeId]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex gap-8 relative">
      {/* Table des matières fixe */}
      {showToc && tocItems.length > 0 && (
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
              Table des matières
            </h3>
            <nav className="space-y-1">
              {tocItems.map((item) => {
                const isActive = item.id === activeId;
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollToHeading(item.id)}
                    aria-current={isActive ? 'true' : undefined}
                    className={`block w-full text-left px-3 py-2 text-sm rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 ${
                      item.level === 1 ? 'font-medium' : item.level === 2 ? 'ml-4' : 'ml-8'
                    } ${
                      isActive
                        ? 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950'
                        : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {item.text}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>
      )}
      
      {/* Contenu Markdown */}
      <main className="flex-1 min-w-0">
        <article
          ref={articleRef}
          className="prose dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-code:text-gray-800 dark:prose-code:text-gray-200 prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </main>
    </div>
  );
}