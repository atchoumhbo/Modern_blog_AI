import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import { codeToHtml } from 'shiki';

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

// Helper to normalize content from Strapi (could be string, array, or object)
function normalizeContent(content: any): string {
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    // Rich text blocks from Strapi
    return content.map((block: any) => {
      if (block.type === 'paragraph' && block.children) {
        return block.children.map((child: any) => child.text || '').join('');
      }
      return block.text || JSON.stringify(block);
    }).join('\n\n');
  }
  if (content && typeof content === 'object') {
    return JSON.stringify(content);
  }
  return String(content || '');
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[📊🚀🛠🎯🔧📱💡🔮]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export async function renderMarkdown(content: any, theme: 'github-light' | 'github-dark' = 'github-light') {
  // Normalize content from Strapi
  const markdown = normalizeContent(content);
  const toc: TocItem[] = [];

  // Configure marked with sync renderer to avoid Promise leakage
  const renderer = new marked.Renderer();

  // Heading with TOC collection (completely sync to avoid Promise objects)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (renderer as any).heading = ({ tokens, depth }: any) => {
    const raw = (tokens || []).map((t: any) => t.raw ?? t.text ?? '').join('');
    const id = `heading-${slugify(raw)}`;
    if (depth <= 3) {
      toc.push({ id, text: raw.replace(/[📊🚀🛠🎯🔧📱💡🔮]/g, '').trim(), level: depth });
    }
    // Use raw text directly - no parsing to avoid any Promise issues
    return `<h${depth} id="${id}" class="heading-${depth}">${raw}</h${depth}>`;
  };

  // Code blocks with Shiki highlighting
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(renderer as any).code = async ({ text, lang }: any) => {
    try {
      const html = await codeToHtml(text, {
        lang: (lang || 'text').toString(),
        theme,
      });
      return html;
    } catch {
      // Fallback to plain pre/code
      const safe = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<pre class="shiki"><code class="language-${lang || 'text'}">${safe}</code></pre>`;
    }
  };

  // Use default paragraph/list/blockquote renderers to avoid Promise leakage

  marked.setOptions({
    async: true, // Keep async for code blocks only
    breaks: true,
    gfm: true,
    renderer,
  });

  // Parse markdown with proper awaiting
  const html = await marked.parse(markdown) as string;
  const clean = DOMPurify.sanitize(html);
  return { html: clean, toc };
}
