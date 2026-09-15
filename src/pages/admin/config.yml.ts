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
  /**
   * With a DecapBridge site id we speak git-gateway with PKCE auth, and
   * DecapBridge handles identity: a board member accepts an email invitation
   * and signs in with Google, never touching GitHub.
   *
   * Without one we fall back to Sveltia against GitHub directly, using the
   * OAuth endpoints in src/pages/api/. Unset the variable in Vercel to roll
   * back in a single redeploy.
   *
   * The author-name / author-login placeholders are DecapBridge's: they put
   * the actual editor in the commit message, so the repo history says who
   * changed what.
   */
  const backend = bridgeSiteId
    ? `backend:
  name: git-gateway
  repo: kubatopia/TheSociety
  branch: main
  auth_type: pkce
  base_url: https://auth.decapbridge.com
  auth_endpoint: /sites/${bridgeSiteId}/pkce
  auth_token_endpoint: /sites/${bridgeSiteId}/token
  gateway_url: https://gateway.decapbridge.com
  commit_messages:
    create: 'Create {{collection}} \u201c{{slug}}\u201d - {{author-name}} <{{author-login}}> via DecapBridge'
    update: 'Update {{collection}} \u201c{{slug}}\u201d - {{author-name}} <{{author-login}}> via DecapBridge'
    delete: 'Delete {{collection}} \u201c{{slug}}\u201d - {{author-name}} <{{author-login}}> via DecapBridge'
    uploadMedia: 'Upload \u201c{{path}}\u201d - {{author-name}} <{{author-login}}> via DecapBridge'
    deleteMedia: 'Delete \u201c{{path}}\u201d - {{author-name}} <{{author-login}}> via DecapBridge'

auth:
  email_claim: email
  first_name_claim: first_name
  last_name_claim: last_name
  avatar_url_claim: avatar_url`
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
  if (bridgeSiteId && !parsed.backend.auth_endpoint?.includes(bridgeSiteId)) {
    throw new Error('DecapBridge backend auth_endpoint does not carry the site id — is DECAPBRIDGE_SITE_ID valid?');
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
