import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

/**
 * A compact index of every archive entry, fetched by the archive page the
 * first time someone searches or filters.
 *
 * Rendering all 748 cards into the HTML produced a 956KB page, and the
 * collection only grows. The page now ships a first screenful and pulls this
 * in on demand, so searching still covers everything without making everyone
 * download everything up front.
 */
export const GET: APIRoute = async () => {
  const entries = (await getCollection('archive', ({ data }) => !data.draft)).sort(
    (a, b) =>
      Number(b.data.featured) - Number(a.data.featured) ||
      b.data.date.getTime() - a.data.date.getTime(),
  );

  const index = entries.map((entry) => ({
    h: entry.data.externalUrl || `/archive/${entry.id}`,
    t: entry.data.title,
    y: entry.data.type,
    d: entry.data.date.toISOString().slice(0, 10),
    s: (entry.data.summary ?? '').slice(0, 130),
    o: entry.data.topics,
    a: entry.data.author ?? '',
    p: entry.data.publication ?? '',
    i: entry.data.image ?? '',
    f: entry.data.featured ? 1 : 0,
  }));

  return new Response(JSON.stringify(index), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  });
};
