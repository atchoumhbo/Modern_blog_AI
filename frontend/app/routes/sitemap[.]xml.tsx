import { config } from "~/lib/utils";
import { getPosts, getProjects } from "~/lib/api";

export async function loader() {
  const base = config.siteUrl.replace(/\/$/, "");
  // Fetch ALL posts and projects via pagination so every item is included
  async function fetchAllPosts() {
    const pageSize = 100;
    const first = await getPosts({ page: 1, pageSize });
    let all = [...first.posts];
    const pageCount = (first.meta as any)?.pagination?.pageCount || 1;
    for (let p = 2; p <= pageCount; p++) {
      const next = await getPosts({ page: p, pageSize });
      all = all.concat(next.posts);
    }
    return all;
  }
  async function fetchAllProjects() {
    const pageSize = 100;
    const first = await getProjects({ page: 1, pageSize });
    let all = [...first.projects];
    const pageCount = (first.meta as any)?.pagination?.pageCount || 1;
    for (let p = 2; p <= pageCount; p++) {
      const next = await getProjects({ page: p, pageSize });
      all = all.concat(next.projects);
    }
    return all;
  }

  const [posts, projects] = await Promise.all([fetchAllPosts(), fetchAllProjects()]);

  const urls: Array<{ loc: string; lastmod?: string; changefreq?: string; priority?: string }> = [];

  // Static sections
  urls.push({ loc: `${base}/`, priority: "1.0", changefreq: "daily" });
  // Compute lastmod for listing pages using the newest item
  const latestPostIso = posts
    .map((p: any) => (p.date ? new Date(p.date) : null))
    .filter((d: Date | null): d is Date => d instanceof Date && !isNaN(d.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())[0]?.toISOString();
  const latestProjectIso = projects
    .map((p: any) => (p.date ? new Date(p.date) : null))
    .filter((d: Date | null): d is Date => d instanceof Date && !isNaN(d.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())[0]?.toISOString();

  urls.push({ loc: `${base}/blog`, priority: "0.8", changefreq: "daily", lastmod: latestPostIso });
  urls.push({ loc: `${base}/projects`, priority: "0.8", changefreq: "weekly", lastmod: latestProjectIso });
  urls.push({ loc: `${base}/about`, priority: "0.5", changefreq: "yearly" });
  urls.push({ loc: `${base}/contact`, priority: "0.5", changefreq: "yearly" });

  // Posts (only those with a slug)
  for (const p of posts) {
    if (!p.slug) continue;
    urls.push({
      loc: `${base}/blog/${p.slug}`,
      lastmod: p.date ? new Date(p.date).toISOString() : undefined,
      changefreq: "monthly",
      priority: "0.7",
    });
  }

  // Projects
  for (const pr of projects) {
    const d = pr.date ? new Date(pr.date).toISOString() : undefined;
    const slug = pr.slug ?? pr.documentId ?? pr.id;
    urls.push({
      loc: `${base}/projects/${slug}`,
      lastmod: d,
      changefreq: "monthly",
      priority: "0.6",
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">` +
    urls
      .map((u) => {
        const altLinks = config.locales
          .map((lng) => `<xhtml:link rel="alternate" hreflang="${lng}" href="${u.loc}"/>`)
          .join("");
        const xDefault = `<xhtml:link rel="alternate" hreflang="x-default" href="${u.loc}"/>`;
        return (
          `<url>` +
          `<loc>${u.loc}</loc>` +
          altLinks +
          xDefault +
          (u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : "") +
          (u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : "") +
          (u.priority ? `<priority>${u.priority}</priority>` : "") +
          `</url>`
        );
      })
      .join("") +
    `</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

