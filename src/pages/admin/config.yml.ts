import type { APIRoute } from 'astro';
import { parse } from 'yaml';
import collections from '../../cms/collections.yml?raw';

/**
 * The CMS config is generated rather than hand-written, so two things live in
 * exactly one place each:
 *
 *   PUBLIC_SITE_URL      the deployed origin
 *   DECAPBRIDGE_SITE_ID  which editor and sign-in method to use
 *
 * See DECISIONS.md (DECISION-001).
 */

/** Widgets shipped by Decap CMS core. */
const DECAP_CORE_WIDGETS = new Set([
  'boolean', 'code', 'color', 'datetime', 'file', 'hidden', 'image', 'list',
  'map', 'markdown', 'number', 'object', 'relation', 'select', 'string',
  'text', 'uuid',
]);

const REQUIRED_COLLECTIONS = ['news', 'events', 'board', 'minutes', 'pages', 'settings'];

type Field = { widget?: string; fields?: Field[] };
type Collection = { name?: string; fields?: Field[]; files?: Array<{ fields?: Field[] }> };

const widgetsIn = (collectionList: Collection[]): Set<string> => {
  const found = new Set<string>();
  const walk = (fields: Field[] = []) => {
    for (const field of fields) {
      if (field.widget) found.add(field.widget);
      if (field.fields) walk(field.fields);
    }
  };
  for (const collection of collectionList) {
    walk(collection.fields);
    for (const file of collection.files ?? []) walk(file.fields);
  }
  return found;
};

export const GET: APIRoute = ({ site }) => {
  const origin = site?.origin ?? '';
  const bridgeSiteId = process.env.DECAPBRIDGE_SITE_ID?.trim();

  /**
   * With a DecapBridge site id we speak git-gateway and DecapBridge handles
   * identity: board members accept an email invitation and sign in with
   * Google, never touching GitHub.
   *
   * Without one we fall back to Sveltia against GitHub directly, using the
   * OAuth endpoints in src/pages/api/. Unset the variable in Vercel to roll
   * back in a single redeploy.
   */
  const backend = bridgeSiteId
    ? `backend:
  name: git-gateway
  repo: kubatopia/TheSociety
  branch: main
  identity_url: https://auth.decapbridge.com/sites/${bridgeSiteId}
  gateway_url: https://gateway.decapbridge.com
  commit_messages:
    create: 'Create {{collection}} "{{slug}}"'
    update: 'Update {{collection}} "{{slug}}"'
    delete: 'Delete {{collection}} "{{slug}}"'
    uploadMedia: 'Upload {{path}}'
    deleteMedia: 'Delete {{path}}'`
    : `backend:
  name: github
  repo: kubatopia/TheSociety
  branch: main
  base_url: ${origin}
  auth_endpoint: api/auth`;

  const yaml = `# CMS configuration -- GENERATED AT BUILD TIME. Do not edit by hand.
# Collections and fields:  src/cms/collections.yml
# Site origin:             PUBLIC_SITE_URL
# Editor and sign-in:      DECAPBRIDGE_SITE_ID (set = Decap + Google, unset = Sveltia + GitHub)

${backend}

site_url: ${origin}
display_url: ${origin}
publish_mode: simple

${collections}`;

  // Fail the build rather than ship a config the CMS cannot read. Both editors
  // parse strictly; a duplicate key is tolerated by looser parsers but surfaces
  // in the browser only as "The configuration file could not be parsed."
  let parsed: { backend?: Record<string, string>; collections?: Collection[] };
  try {
    parsed = parse(yaml);
  } catch (error) {
    throw new Error(
      `src/cms/collections.yml produced invalid CMS config: ${(error as Error).message}`,
    );
  }

  const collectionList = parsed.collections ?? [];

  const missing = REQUIRED_COLLECTIONS.filter(
    (name) => !collectionList.some((c) => c.name === name),
  );
  if (missing.length > 0) {
    throw new Error(`CMS config is missing collection(s): ${missing.join(', ')}`);
  }

  // DECISION-001: staying inside Decap's core widget set is what keeps the
  // editor swap a config change rather than a rewrite.
  const nonCore = [...widgetsIn(collectionList)].filter((w) => !DECAP_CORE_WIDGETS.has(w));
  if (nonCore.length > 0) {
    throw new Error(
      `src/cms/collections.yml uses widget(s) outside Decap's core set: ${nonCore.join(', ')}. ` +
        `See DECISIONS.md (DECISION-001) — we stay Decap-compatible so editors can ` +
        `sign in with Google. Pick a core widget, or amend the decision first.`,
    );
  }

  if (!parsed.backend) {
    throw new Error('CMS config has no backend block.');
  }
  if (bridgeSiteId && !parsed.backend.identity_url) {
    throw new Error('DecapBridge backend has no identity_url — is DECAPBRIDGE_SITE_ID valid?');
  }
  if (!bridgeSiteId && !parsed.backend.base_url) {
    throw new Error('GitHub backend has no base_url — is PUBLIC_SITE_URL set?');
  }

  return new Response(yaml, {
    headers: {
      'content-type': 'text/yaml; charset=utf-8',
      'cache-control': 'no-cache',
    },
  });
};
