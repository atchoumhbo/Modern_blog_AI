import { Link, useLoaderData } from "react-router";
import type { MetaArgs } from "./+types/post";
import { config, generateMetaTags, formatDate, getResponsiveAttrs } from "~/lib/utils";
import { getPostById } from "~/lib/api";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    throw new Response("Bad Request", { status: 400 });
  }
  const post = await getPostById(id);
  if (!post) throw new Response("Not Found", { status: 404 });
  return { post };
}

export function meta({ data }: MetaArgs) {
  const p = (data as any)?.post;
  const title = p?.seo?.metaTitle || p?.title || "Post";
  const description = p?.seo?.metaDescription || p?.excerpt || "";
  const image = p?.image;
  const url = p?.slug ? `${config.siteUrl}/blog/${p.slug}` : `${config.siteUrl}/blog/post?id=${p?.id}`;
  return generateMetaTags({
    title,
    description,
    image,
    url,
    type: "article",
    canonicalURL: p?.seo?.canonicalURL,
    keywords: p?.seo?.keywords,
  });
}

export default function BlogPost() {
  const { post } = useLoaderData<typeof loader>();
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <article className="prose dark:prose-invert max-w-none">
        <h1>{post.title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {post.author?.name ? <>By {post.author.name} • </> : null}
          {post.date ? formatDate(post.date) : null}
        </p>
        {post.image && (
          <img {...getResponsiveAttrs((post as any).featured_image || (post as any).og_image || { url: post.image })} alt={post.title} className="w-full rounded-lg" loading="lazy" decoding="async" />
        )}
        {post.body && (
          <div className="mt-6 whitespace-pre-wrap">{post.body}</div>
        )}
        {post.slug && (
          <p className="mt-6"><Link to={`/blog/${post.slug}`}>Permalink</Link></p>
        )}
      </article>
    </div>
  );
}