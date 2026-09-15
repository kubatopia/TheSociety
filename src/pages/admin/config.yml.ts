import type { APIRoute } from 'astro';
import { parse } from 'yaml';
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

  // Fail the build rather than shipping a config the CMS cannot read. Sveltia
  // parses strictly -- a duplicate key between the generated header and
  // collections.yml is silently tolerated by looser parsers but shows up in the
  // browser only as "The configuration file could not be parsed."
  let parsed: Record<string, unknown>;
  try {
    parsed = parse(yaml) as Record<string, unknown>;
  } catch (error) {
    throw new Error(
      `src/cms/collections.yml produced invalid CMS config: ${(error as Error).message}`,
    );
  }

  const expected = ['news', 'events', 'board', 'minutes', 'pages', 'settings'];
  const found = (parsed.collections as Array<{ name: string }> | undefined)?.map((c) => c.name) ?? [];
  const missing = expected.filter((name) => !found.includes(name));
  if (missing.length > 0) {
    throw new Error(`CMS config is missing collection(s): ${missing.join(', ')}`);
  }
  if (!parsed.backend || !(parsed.backend as { base_url?: string }).base_url) {
    throw new Error('CMS config has no backend.base_url — is PUBLIC_SITE_URL set?');
  }

  return new Response(yaml, {
    headers: {
      'content-type': 'text/yaml; charset=utf-8',
      'cache-control': 'no-cache',
    },
  });
};
