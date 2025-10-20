import { config } from "~/lib/utils";
import { getPosts } from "~/lib/api";

export async function loader() {
  const base = config.siteUrl.replace(/\/$/, "");
  // Fetch more posts for RSS; adjust if needed
  const { posts } = await getPosts({ page: 1, pageSize: 100 });
  const nowRfc = new Date().toUTCString();

  const items = posts
    .filter((p) => !!p.slug)
    .map((p) => {
      const link = `${base}/blog/${p.slug}`;
      const pubDate = p.date ? new Date(p.date).toUTCString() : new Date().toUTCString();
      const description = p.seo?.metaDescription || p.excerpt || "";
      const title = p.seo?.metaTitle || p.title || link;
      const author = p.author?.name ? `\n      <author><![CDATA[${p.author.name}]]></author>` : "";
      const category = p.category ? `\n      <category><![CDATA[${p.category}]]></category>` : "";
      const tags = Array.isArray(p.tags) ? p.tags.map((t) => `\n      <category><![CDATA[${t}]]></category>`).join("") : "";
      return `\n    <item>\n      <title><![CDATA[${title}]]></title>\n      <link>${link}</link>\n      <guid>${link}</guid>\n      <pubDate>${pubDate}</pubDate>\n      <description><![CDATA[${description}]]></description>${author}${category}${tags}\n    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0">\n  <channel>\n    <title>${config.siteName}</title>\n    <link>${base}</link>\n    <description>${config.siteDescription}</description>\n    <lastBuildDate>${nowRfc}</lastBuildDate>\n    <image>\n      <url>${base}/favicon.ico</url>\n      <title>${config.siteName}</title>\n      <link>${base}</link>\n    </image>${items}\n  </channel>\n</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=600",
    },
  });
}

