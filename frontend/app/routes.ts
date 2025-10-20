import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  layout("components/Layout.tsx", [
    index("routes/home.tsx"),
    route("blog", "routes/blog/index.tsx"),
    route("blog/post", "routes/blog/post.tsx"),
    route("blog/:slug", "routes/blog/$slug.tsx"),
    route("projects", "routes/projects/index.tsx"),
    route("projects/:slug", "routes/projects/$slug.tsx"),
    route("about", "routes/about.tsx"),
    route("contact", "routes/contact.tsx"),
    route("login", "routes/login/index.tsx"),
    route("admin", "routes/admin/index.tsx"),
    route("admin/workflows", "routes/admin/workflows.tsx"),
    route("*", "routes/not-found.tsx"),
  ]),
  // XML endpoints (not wrapped with layout)
  route("sitemap.xml", "routes/sitemap[.]xml.tsx"),
  route("rss.xml", "routes/rss[.]xml.tsx"),
] satisfies RouteConfig;
