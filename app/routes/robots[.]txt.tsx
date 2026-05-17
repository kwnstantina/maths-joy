import type { LoaderFunction } from "@remix-run/node";

export const loader: LoaderFunction = () => {
    const host =
        process.env.SITE_URL ?? "https://www.gregkyrmaths.com";

    const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${host}/sitemap.xml
`;

    return new Response(robotsTxt, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
    });
};
