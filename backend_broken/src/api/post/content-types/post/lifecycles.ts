/**
 * Auto-generate slug from title if not provided
 */

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

export default {
  /**
   * Called before creating a new post
   */
  async beforeCreate(event: any) {
    const { data } = event.params;
    
    // Auto-generate slug if not provided and title exists
    if (!data.slug && data.title) {
      data.slug = generateSlug(data.title);
    }
  },

  /**
   * Called before updating an existing post
   */
  async beforeUpdate(event: any) {
    const { data } = event.params;
    
    // Auto-generate slug if not provided and title exists
    if (!data.slug && data.title) {
      data.slug = generateSlug(data.title);
    }
  },
};