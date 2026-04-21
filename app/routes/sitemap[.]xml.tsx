import type { LoaderFunction } from "@remix-run/node";

export const loader: LoaderFunction = () => {
    const host =
        process.env.SITE_URL ?? "https://www.gregkyrmaths.com";

    // Add all your public, indexable routes here
    const staticRoutes = [
        "",
        "/exercises",
        "/books",
        "/videos",
        "/qa",
        "/chat",
        "/tutorial",
        "/aboutUs",
        "/contact",
        "/login",
        "/signup",
        "/privacyPolicy",
        "/useOfTerms",
    ];

    const urls = staticRoutes
        .map(
            (route) => `  <url>
    <loc>${host}${route}</loc>
    <changefreq>${route === "" ? "weekly" : "monthly"}</changefreq>
    <priority>${route === "" ? "1.0" : "0.8"}</priority>
  </url>`
        )
        .join("\n");

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    return new Response(sitemap, {
        status: 200,
        headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
        },
    });
};
