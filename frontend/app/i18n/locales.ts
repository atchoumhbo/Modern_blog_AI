// Auto-discover all JSON dictionaries in this folder
// Vite's import.meta.glob eagerly imports the JSON files and returns their default export
const modules = import.meta.glob('./*.json', { eager: true, import: 'default' }) as Record<string, any>;

// Build a map of locale code -> dictionary, where code is the filename without extension
const dicts: Record<string, Record<string, any>> = {};
for (const path in modules) {
  const match = path.match(/\.\/(.+)\.json$/);
  if (!match) continue;
  const code = match[1];
  dicts[code] = modules[path] as Record<string, any>;
}

export const dictionaries = dicts;
export const locales = Object.keys(dicts);