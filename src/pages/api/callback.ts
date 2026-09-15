import type { APIRoute } from 'astro';

export const prerender = false;

const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

const clientId = () => process.env.GITHUB_OAUTH_ID ?? import.meta.env.GITHUB_OAUTH_ID;
const clientSecret = () => process.env.GITHUB_OAUTH_SECRET ?? import.meta.env.GITHUB_OAUTH_SECRET;

/**
 * Renders the popup page that hands the token back to the CMS window.
 *
 * Protocol (Netlify CMS / Decap / Sveltia compatible):
 *   popup  -> opener : "authorizing:github"
 *   opener -> popup  : "authorizing:github"
 *   popup  -> opener : 'authorization:github:success:{"provider":"github","token":"..."}'
 *
 * The token is injected as JSON and only ever posted to our own origin.
 */
function popupPage(origin: string, payload: Record<string, string>, ok: boolean) {
  const message = `authorization:github:${ok ? 'success' : 'error'}:${JSON.stringify(payload)}`;

  const html = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>Signing in…</title></head>
  <body style="font:14px system-ui;padding:2rem">
    <p>${ok ? 'Signed in. You can close this window.' : 'Sign-in failed. You can close this window.'}</p>
    <script>
      (function () {
        var origin = ${JSON.stringify(origin)};
        var message = ${JSON.stringify(message)};
        function onMessage(event) {
          if (event.origin !== origin) return;
          window.opener.postMessage(message, origin);
          window.removeEventListener('message', onMessage, false);
          window.close();
        }
        if (!window.opener) {
          document.body.append('No opener window — open the CMS at /admin/ and sign in from there.');
          return;
        }
        window.addEventListener('message', onMessage, false);
        window.opener.postMessage('authorizing:github', origin);
      })();
    </script>
  </body>
</html>`;

  return new Response(html, {
    status: ok ? 200 : 401,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      // The page holds a live token: never let it be framed or indexed.
      'x-frame-options': 'DENY',
      'referrer-policy': 'no-referrer',
    },
  });
}

export const GET: APIRoute = async ({ url, cookies }) => {
  const origin = url.origin;
  const expectedState = cookies.get('cms_oauth_state')?.value;
  cookies.delete('cms_oauth_state', { path: '/' });

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code || !state || !expectedState || state !== expectedState) {
    return popupPage(origin, { provider: 'github', error: 'Invalid or expired login attempt.' }, false);
  }

  const id = clientId();
  const secret = clientSecret();
  if (!id || !secret) {
    return popupPage(origin, { provider: 'github', error: 'OAuth is not configured on the server.' }, false);
  }

  const response = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({
      client_id: id,
      client_secret: secret,
      code,
      redirect_uri: new URL('/api/callback', origin).href,
    }),
  });

  const data = (await response.json()) as { access_token?: string; error_description?: string };

  if (!response.ok || !data.access_token) {
    return popupPage(
      origin,
      { provider: 'github', error: data.error_description ?? 'GitHub rejected the login.' },
      false,
    );
  }

  return popupPage(origin, { provider: 'github', token: data.access_token }, true);
};
