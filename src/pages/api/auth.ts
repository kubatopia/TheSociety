import type { APIRoute } from 'astro';

// This endpoint runs on demand (the rest of the site is static HTML).
export const prerender = false;

const GITHUB_AUTHORIZE = 'https://github.com/login/oauth/authorize';

/** Server-only secrets. Set these in Vercel -> Project -> Settings -> Environment Variables. */
const clientId = () => process.env.GITHUB_OAUTH_ID ?? import.meta.env.GITHUB_OAUTH_ID;

/**
 * Step 1 of the CMS login. Sveltia opens this in a popup as
 *   /api/auth?provider=github&site_id=<domain>&scope=repo
 * and we bounce the browser to GitHub's consent screen.
 */
export const GET: APIRoute = ({ url, cookies, redirect }) => {
  const id = clientId();
  if (!id) {
    return new Response('GITHUB_OAUTH_ID is not configured on the server.', { status: 500 });
  }

  if (url.searchParams.get('provider') !== 'github') {
    return new Response('Unsupported provider.', { status: 400 });
  }

  // CSRF token: round-tripped through GitHub and compared in /api/callback.
  const state = crypto.randomUUID().replaceAll('-', '');
  cookies.set('cms_oauth_state', state, {
    path: '/',
    httpOnly: true,
    secure: url.protocol === 'https:',
    sameSite: 'lax',
    maxAge: 600,
  });

  const scope = url.searchParams.get('scope') === 'public_repo' ? 'public_repo' : 'repo';

  const authorize = new URL(GITHUB_AUTHORIZE);
  authorize.searchParams.set('client_id', id);
  authorize.searchParams.set('scope', scope);
  authorize.searchParams.set('state', state);
  authorize.searchParams.set('redirect_uri', new URL('/api/callback', url.origin).href);

  return redirect(authorize.href, 302);
};
