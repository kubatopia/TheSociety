import type { APIRoute } from 'astro';
import collections from '../../cms/collections.yml?raw';

/**
 * The CMS config is generated rather than hand-written so the deployed origin
 * lives in exactly one place: PUBLIC_SITE_URL (see astro.config.mjs).
 *
 * Sveltia opens `{base_url}/{auth_endpoint}` in a popup to start the GitHub
 * login, and refuses a token that arrives from a different origin -- so a
 * stale base_url here breaks sign-in silently. Deriving it from the same value
 * that produces canonical URLs keeps the two from drifting apart.
 */
export const GET: APIRoute = ({ site }) => {
  const origin = site?.origin ?? '';

  const yaml = `# Sveltia CMS configuration -- GENERATED AT BUILD TIME. Do not edit by hand.
# Collections and fields:  src/cms/collections.yml
# Site origin:             PUBLIC_SITE_URL (Vercel env var)
# Docs:                    https://sveltiacms.app/en/docs

backend:
  name: github
  repo: kubatopia/TheSociety
  branch: main
  base_url: ${origin}
  auth_endpoint: api/auth

site_url: ${origin}
publish_mode: simple

${collections}`;

  return new Response(yaml, {
    headers: {
      'content-type': 'text/yaml; charset=utf-8',
      'cache-control': 'no-cache',
    },
  });
};
