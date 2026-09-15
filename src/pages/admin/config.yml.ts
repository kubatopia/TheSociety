import type { APIRoute } from 'astro';
import { parse } from 'yaml';
import collections from '../../cms/collections.yml?raw';

/**
 * The CMS config is generated rather than hand-written so the deployed origin
 * lives in exactly one place: PUBLIC_SITE_URL (see astro.config.mjs).
 *
 * The DecapBridge site id is not a secret -- it is served to every browser in
 * this very file -- so it is checked in rather than hidden in an env var that
 * can go missing. DECAPBRIDGE_SITE_ID overrides it if a second site ever needs
 * to point at a different bridge.
 */
const BRIDGE_SITE_ID =
  process.env.DECAPBRIDGE_SITE_ID?.trim() || '995e38c3-13d7-415d-acfa-d6b483c6f5a9';

/** Widgets shipped by Decap CMS core. */
const DECAP_CORE_WIDGETS = new Set([
  'boolean', 'code', 'color', 'datetime', 'file', 'hidden', 'image', 'list',
  'map', 'markdown', 'number', 'object', 'relation', 'select', 'string',
  'text', 'uuid',
]);

const REQUIRED_COLLECTIONS = ['archive', 'events', 'exhibits', 'board', 'minutes', 'pages', 'settings'];

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

  /**
   * DecapBridge handles identity and commits on the editor's behalf, so no
   * board member needs a git account.
   *
   * The author-name / author-login placeholders are DecapBridge's: they put
   * the actual editor in the commit message, so the repo history says who
   * changed what rather than showing a row of identical gateway commits.
   */
  const backend = `backend:
  name: git-gateway
  repo: kubatopia/TheSociety
  branch: main
  auth_type: pkce
  base_url: https://auth.decapbridge.com
  auth_endpoint: /sites/${BRIDGE_SITE_ID}/pkce
  auth_token_endpoint: /sites/${BRIDGE_SITE_ID}/token
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
  avatar_url_claim: avatar_url`;

  const yaml = `# CMS configuration -- GENERATED AT BUILD TIME. Do not edit by hand.
# Collections and fields:  src/cms/collections.yml
# Site origin:             PUBLIC_SITE_URL
# Editor and sign-in:      Decap CMS + DecapBridge (Google), see DECISIONS.md

${backend}

site_url: ${origin}
display_url: ${origin}
publish_mode: simple

${collections}`;

  // Fail the build rather than ship a config the CMS cannot read. Both editors
  // parse strictly; a duplicate key is tolerated by looser parsers but surfaces
  // in the browser only as "The configuration file could not be parsed."
  let parsed: { backend?: Record<string, string>; collections?: Collection[]; site_url?: string };
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
  if (!parsed.backend.auth_endpoint?.includes(BRIDGE_SITE_ID)) {
    throw new Error('DecapBridge backend auth_endpoint does not carry the site id.');
  }
  if (!parsed.site_url) {
    throw new Error('CMS config has no site_url — is PUBLIC_SITE_URL set?');
  }

  return new Response(yaml, {
    headers: {
      'content-type': 'text/yaml; charset=utf-8',
      'cache-control': 'no-cache',
    },
  });
};
