/**
 * Normalize content from Strapi to markdown string
 * Handles both plain markdown strings and rich text block arrays
 */
export function normalizeContent(content: any): string {
  if (!content) return '';
  
  // If it's already a string, return as-is
  if (typeof content === 'string') {
    return content;
  }
  
  // If it's an array (Strapi rich text blocks)
  if (Array.isArray(content)) {
    return content.map(block => {
      if (!block || typeof block !== 'object') return '';
      
      // Handle different block types
      switch (block.type) {
        case 'paragraph':
          if (block.children && Array.isArray(block.children)) {
            return block.children.map((child: any) => {
              if (child.type === 'text') {
                let text = child.text || '';
                // Apply formatting
                if (child.bold) text = `**${text}**`;
                if (child.italic) text = `*${text}*`;
                if (child.code) text = `\`${text}\``;
                if (child.strikethrough) text = `~~${text}~~`;
                return text;
              }
              if (child.type === 'link') {
                const linkText = child.children?.map((c: any) => c.text || '').join('') || '';
                return `[${linkText}](${child.url || '#'})`;
              }
              return child.text || '';
            }).join('');
          }
          return block.text || '';
          
        case 'heading':
          const level = Math.min(Math.max(block.level || 1, 1), 6);
          const headingText = block.children?.map((child: any) => child.text || '').join('') || block.text || '';
          return '#'.repeat(level) + ' ' + headingText;
          
        case 'list':
          if (block.children && Array.isArray(block.children)) {
            const listItems = block.children.map((item: any) => {
              const itemText = item.children?.map((child: any) => child.text || '').join('') || item.text || '';
              return block.format === 'ordered' ? `1. ${itemText}` : `- ${itemText}`;
            });
            return listItems.join('\n');
          }
          return '';
          
        case 'quote':
          const quoteText = block.children?.map((child: any) => child.text || '').join('') || block.text || '';
          return `> ${quoteText}`;
          
        case 'code':
          const codeText = block.children?.map((child: any) => child.text || '').join('') || block.text || '';
          const lang = block.language || '';
          return `\`\`\`${lang}\n${codeText}\n\`\`\``;
          
        case 'image':
          const alt = block.image?.alternativeText || block.alt || '';
          const url = block.image?.url || block.src || '';
          return `![${alt}](${url})`;
          
        default:
          // Fallback: extract text from children or use text property
          if (block.children && Array.isArray(block.children)) {
            return block.children.map((child: any) => child.text || '').join('');
          }
          return block.text || '';
      }
    }).filter(Boolean).join('\n\n');
  }
  
  // If it's an object, try to extract text
  if (typeof content === 'object') {
    if (content.text) return content.text;
    if (content.content) return normalizeContent(content.content);
    
    // Try to stringify as fallback
    try {
      return JSON.stringify(content);
    } catch {
      return String(content);
    }
  }
  
  // Fallback to string conversion
  return String(content);
}