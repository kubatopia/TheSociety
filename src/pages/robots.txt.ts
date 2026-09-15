import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const body = `User-agent: *
Disallow: /admin/
Disallow: /api/

Sitemap: ${new URL('sitemap-index.xml', site)}
`;

  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
