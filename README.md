# The Society

Website for the Society's board and committees. Built with Astro and Tailwind,
hosted on Vercel. Board members edit content in a browser at `/admin/`; every
save is a commit to this repository.

## Run it locally

```sh
npm install
npm run dev      # http://localhost:4321
npm run check    # type-check
npm run build    # production build
```

## How content works

All content lives in this repo as Markdown, so there is no CMS subscription and
no database to back up. The site is rebuilt automatically whenever content
changes.

| What | Where | Edited at |
| --- | --- | --- |
| News posts | `src/content/news/` | `/admin/` → News |
| Events | `src/content/events/` | `/admin/` → Events |
| Board roster | `src/content/board/` | `/admin/` → Board & Committees |
| Minutes & PDFs | `src/content/minutes/` | `/admin/` → Minutes & Documents |
| Free-text pages (About, Museum, Membership) | `src/content/pages/` | `/admin/` → Pages |
| Name, hours, contact, hero photo | `src/data/site.json` | `/admin/` → Site settings |
| Uploaded images and PDFs | `public/media/` | uploaded through `/admin/` |

Field definitions live in two places and must be kept in step:

- `src/content.config.ts` — the schema the site validates against at build time
- `public/admin/config.yml` — the form the CMS shows to board members

If you add a field to one, add it to the other. A mismatch fails the build with
a clear error naming the file and field.

## Giving a board member access

1. They create a free GitHub account.
2. Add them to this repo: **Settings → Collaborators → Add people**, role `Write`.
3. They go to `https://<domain>/admin/` and click *Sign in with GitHub*.

Removing their collaborator access removes their ability to edit the site.

## Deployment

Hosted on Vercel, connected to this repo. Pushes to `main` deploy to production.

Required environment variables (Vercel → Project → Settings → Environment
Variables), used only by the CMS login endpoints:

| Name | Value |
| --- | --- |
| `GITHUB_OAUTH_ID` | Client ID of the GitHub OAuth app |
| `GITHUB_OAUTH_SECRET` | Client secret of the GitHub OAuth app |
| `PUBLIC_SITE_URL` | `https://<production domain>` |

The GitHub OAuth app (github.com → Settings → Developer settings → OAuth Apps)
needs its **Authorization callback URL** set to
`https://<production domain>/api/callback`.

When the custom domain goes live, update the domain in three places:
`public/admin/config.yml` (`base_url` and `site_url`), `public/robots.txt`, and
the `PUBLIC_SITE_URL` environment variable.

## Architecture notes

- The site builds to static HTML. Only `/api/auth` and `/api/callback` run on
  demand — they are the OAuth handshake that lets the CMS sign board members in
  against GitHub, so no OAuth secrets ever reach the browser.
- Images referenced from CMS uploads are plain paths under `/media/`. They are
  served as uploaded rather than passed through Astro's image optimizer, which
  cannot process files in `public/`.
